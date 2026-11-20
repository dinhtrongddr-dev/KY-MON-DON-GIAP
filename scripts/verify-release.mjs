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
  const pkg = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
  if (pkg.type !== 'commonjs' || Object.keys(pkg.dependencies || {}).length) throw new Error('Keep the vendored lunar CommonJS boundary and dependency-free app runtime');
  const versionChecks = [
    ['dist/qimen.mjs', 'TG-ROTATING-2.0'], ['dist/reading-core.mjs', 'TG-CB-7.0'],
    ['dist/reading-core.mjs', 'READING_PROTOCOL=6'], ['dist/qimen/analysis/nianmingEngine.mjs', 'KM-NIANMING-1.0'],
    ['dist/qimen/validation/protocol.mjs', 'KM-VALIDATION-1.0'], ['dist/qimen/validation/protocol.mjs', 'KM-OUTCOME-REGISTRY-1.0'],
    ['dist/qimen/ai/timingEngine.mjs', 'KM-TIMING-4.0'], ['local/ai-client.mjs', 'QIMEN_DIRECT_MODEL'],
  ];
  for (const [name, expected] of versionChecks) {
    if (!readFileSync(join(directory, name), 'utf8').replace(/\s+/g, '').includes(expected)) throw new Error(`Baseline version mismatch: ${name}`);
  }
  for (const subdirectory of ['local', 'scripts', 'tests']) {
    for (const path of walk(join(directory, subdirectory)).filter(path => /\.(mjs|js)$/.test(path))) {
      execFileSync(process.execPath, ['--check', path], {stdio: 'pipe', windowsHide: true});
    }
  }
  execFileSync(process.execPath, [join(directory, 'scripts/verify-assets.mjs')], {stdio: 'inherit', windowsHide: true});
  console.log(`Release checks passed: ${count} protected core files, versions and module syntax.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) verifyRelease();
