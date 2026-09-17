import {createHash} from 'node:crypto';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join, relative, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
export const GOLDEN_BOARDS_SHA256 = 'd384c9f4d42a94bd80d709eac2c865943ac5ac4f7e86489d84b003edd2b465ea';
const walk = directory => readdirSync(directory, {withFileTypes: true}).flatMap(entry =>
  entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]);

export function verifyFrozenCore(directory = root) {
  const manifest = JSON.parse(readFileSync(join(directory, 'docs/releases/core-baseline.json'), 'utf8'));
  if (manifest.goldenBoards.count !== 480 || manifest.goldenBoards.sha256 !== GOLDEN_BOARDS_SHA256) {
    throw new Error('The independent 480-board baseline must not be replaced.');
  }
  const names = ['dist/qimen.mjs', 'dist/vendor/lunar.js', ...walk(join(directory, 'dist/qimen/core'))
    .map(path => relative(directory, path).replaceAll('\\', '/'))].sort();
  if (JSON.stringify(names) !== JSON.stringify(Object.keys(manifest.files).sort())) {
    throw new Error('Protected core file set differs from the frozen baseline.');
  }
  for (const name of names) {
    // Git stores LF text; this also verifies older Windows checkouts without changing code.
    const source = readFileSync(join(directory, name), 'utf8').replaceAll('\r\n', '\n');
    const digest = createHash('sha256').update(source).digest('hex');
    if (digest !== manifest.files[name]) throw new Error(`Protected core changed: ${name}`);
  }
  return names.length;
}

export function verifyRelease(directory = root) {
  const count = verifyFrozenCore(directory);
  const pins = JSON.parse(readFileSync(join(directory, 'scripts/windows-dependencies.json'), 'utf8'));
  const launcher = readFileSync(join(directory, pins.launcher.path));
  if (createHash('sha256').update(launcher).digest('hex') !== pins.launcher.sha256) throw new Error('Launcher checksum mismatch');
  const launcherSource = readFileSync(join(directory, pins.launcher.source), 'utf8').replaceAll('\r\n', '\n');
  if (createHash('sha256').update(launcherSource).digest('hex') !== pins.launcher.sourceSha256) throw new Error('Launcher source checksum mismatch');
  const pkg = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
  if (pkg.type !== 'commonjs' || Object.keys(pkg.dependencies || {}).length) throw new Error('Keep the vendored lunar CommonJS boundary and dependency-free app runtime');
  const versionChecks = [
    ['dist/qimen.mjs', 'TG-ROTATING-2.0'], ['dist/reading-core.mjs', 'TG-CB-6.1'],
    ['dist/reading-core.mjs', 'READING_PROTOCOL=5'], ['local/codex-client.mjs', 'gpt-6-astra'],
  ];
  for (const [name, expected] of versionChecks) {
    if (!readFileSync(join(directory, name), 'utf8').replace(/\s+/g, '').includes(expected)) throw new Error(`Baseline version mismatch: ${name}`);
  }
  for (const subdirectory of ['local', 'scripts', 'tests', 'relay/src', 'relay/test']) {
    for (const path of walk(join(directory, subdirectory)).filter(path => /\.(mjs|js)$/.test(path))) {
      execFileSync(process.execPath, ['--check', path], {stdio: 'pipe', windowsHide: true});
    }
  }
  execFileSync(process.execPath, [join(directory, 'scripts/verify-assets.mjs')], {stdio: 'inherit', windowsHide: true});
  if (statSync(join(directory, 'dist/downloads/ky-mon-ai.zip')).size > 100 * 1024 * 1024) {
    throw new Error('Local ZIP exceeds the GitHub per-file limit');
  }
  console.log(`Release checks passed: ${count} protected core files, launcher pin, versions and module syntax.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) verifyRelease();
