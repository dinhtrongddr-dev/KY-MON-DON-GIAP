from pathlib import Path
import argparse
import hashlib
import json
import os
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'dist/downloads/ky-mon-ai.zip'
PREFIX = 'ky-mon-ai/'
STAMP = (2026, 9, 14, 0, 0, 0)
REQUIRED = [
    'START-WINDOWS.cmd', 'START-MAC.command', 'LOGIN-WINDOWS.cmd',
    'HUONG-DAN-LOCAL.md', 'AI-EVAL.md', 'QIMEN-ARCHITECTURE.md',
    'KyMonTray.exe', 'KyMonTray.ico', 'KyMonTray-white.ico', 'KyMonTray.png',
    'local/KyMonTray.cs', 'local/server.mjs', 'local/codex-client.mjs',
    'local/reading.mjs', 'local/interpret.mjs',
    'tools/cloudflared.exe', 'tools/LICENSE.cloudflared',
    'dist/index.html', 'dist/app.mjs', 'dist/qimen.mjs', 'dist/reading-core.mjs',
    'dist/vendor/lunar.js', 'dist/vendor/LICENSE.lunar-javascript',
    'dist/qimen/core/board.mjs', 'dist/qimen/ai/reasoningPlanner.mjs',
    'scripts/verify-assets.mjs', 'scripts/package-local.py', 'scripts/windows-dependencies.json',
    'package.json', 'package-lock.json', 'README.md', 'THIRD-PARTY-NOTICES.md',
    'docs/releases/core-baseline.json', 'relay/package.json', 'relay/wrangler.jsonc',
]


def source_files(root):
    missing = [name for name in REQUIRED if not (root / name).is_file()]
    if missing:
        raise ValueError('Missing required inputs: ' + ', '.join(missing) +
                         '. Run npm run prepare:windows in the source repository.')
    files = {root / name for name in REQUIRED}
    for pattern in ['local/*.mjs', 'dist/*.mjs', 'dist/*.html', 'dist/*.css',
                    'dist/*.svg', 'dist/*.png', 'dist/assets/*.png',
                    'dist/qimen/**/*.mjs', 'tests/*.mjs', 'tests/*.py',
                    'scripts/*.mjs', 'scripts/*.json', 'scripts/*.py',
                    'relay/src/*.js', 'relay/test/*.mjs', 'relay/*.md',
                    'docs/releases/**/*.md', 'docs/releases/**/*.json']:
        files.update(root.glob(pattern))
    for path in files:
        if path.is_symlink() or not path.resolve().is_relative_to(root.resolve()):
            raise ValueError('Package input must be a regular in-repository file: ' + str(path))
    pins = json.loads((root / 'scripts/windows-dependencies.json').read_text(encoding='utf-8'))
    launcher_source = (root / pins['launcher']['source']).read_bytes().replace(b'\r\n', b'\n')
    if hashlib.sha256(launcher_source).hexdigest() != pins['launcher']['sourceSha256']:
        raise ValueError('Launcher source checksum mismatch; rebuild and review both checksums')
    for name, pin in [('tools/cloudflared.exe', pins['cloudflared']),
                      ('KyMonTray.exe', pins['launcher'])]:
        content = (root / name).read_bytes()
        if hashlib.sha256(content).hexdigest() != pin['sha256']:
            raise ValueError('Checksum mismatch: ' + name)
        if 'size' in pin and len(content) != pin['size']:
            raise ValueError('Size mismatch: ' + name)
    return sorted(files, key=lambda path: path.relative_to(root).as_posix())


def verify_package(root, target):
    files = source_files(root)
    expected = {PREFIX + path.relative_to(root).as_posix(): path for path in files}
    with zipfile.ZipFile(target) as archive:
        if len(archive.namelist()) != len(expected) or set(archive.namelist()) != set(expected):
            raise ValueError('Package file list differs from the required runtime distribution')
        if archive.testzip() is not None:
            raise ValueError('Package CRC validation failed')
        for name, path in expected.items():
            if archive.read(name) != package_bytes(path):
                raise ValueError('Package contains stale or corrupted source: ' + name)
    return len(expected)


def package_bytes(path):
    content = path.read_bytes()
    if path.suffix.lower() in {'.cmd', '.command', '.mjs', '.js', '.json', '.jsonc',
                               '.md', '.html', '.css', '.svg', '.py', '.cs'} or path.name.startswith('LICENSE.'):
        content = content.replace(b'\r\n', b'\n')
        if path.suffix.lower() == '.cmd':
            content = content.replace(b'\n', b'\r\n')
    return content


def build_package(root, target):
    files = source_files(root)
    target.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(prefix='ky-mon-', suffix='.zip', dir=target.parent)
    os.close(descriptor)
    try:
        with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for path in files:
                name = PREFIX + path.relative_to(root).as_posix()
                entry = zipfile.ZipInfo(name, STAMP)
                entry.create_system = 3
                entry.compress_type = zipfile.ZIP_DEFLATED
                entry.external_attr = (0o100755 if name.endswith('.command') else 0o100644) << 16
                archive.writestr(entry, package_bytes(path), compresslevel=9)
        count = verify_package(root, Path(temporary))
        # Validation completes before replacing a previously usable download.
        os.replace(temporary, target)
        return count
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description='Build or verify the complete Windows/local distribution')
    parser.add_argument('--check', action='store_true', help='compare the ZIP against current source and pins')
    args = parser.parse_args()
    try:
        count = verify_package(ROOT, TARGET) if args.check else build_package(ROOT, TARGET)
        digest = hashlib.sha256(TARGET.read_bytes()).hexdigest()
        print(f'Local package verified: {count} files; SHA-256 {digest}\n{TARGET}')
    except (ValueError, OSError, zipfile.BadZipFile) as error:
        sys.exit(str(error))
