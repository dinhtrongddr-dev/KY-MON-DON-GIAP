import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, copyFile, writeFile, appendFile, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyFrozenCore} from '../scripts/verify-release.mjs';
import {prepareWindows} from '../scripts/prepare-windows.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
test('the frozen guard rejects changed code, additional core files and an altered golden baseline', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'kymon-core-'));
  t.after(() => rm(directory, {recursive: true, force: true}));
  const manifestPath = 'docs/releases/core-baseline.json';
  const manifest = JSON.parse(await readFile(join(root, manifestPath), 'utf8'));
  for (const name of [manifestPath, ...Object.keys(manifest.files)]) {
    await mkdir(dirname(join(directory, name)), {recursive: true});
    await copyFile(join(root, name), join(directory, name));
  }
  assert.equal(verifyFrozenCore(directory), 6);
  await appendFile(join(directory, 'dist/qimen.mjs'), '\n// accidental edit\n');
  assert.throws(() => verifyFrozenCore(directory), /Protected core changed/);
  await copyFile(join(root, 'dist/qimen.mjs'), join(directory, 'dist/qimen.mjs'));
  await writeFile(join(directory, 'dist/qimen/core/new-rule.mjs'), 'export const rule = 1;');
  assert.throws(() => verifyFrozenCore(directory), /file set/);
  manifest.goldenBoards.sha256 = '0'.repeat(64);
  await writeFile(join(directory, manifestPath), JSON.stringify(manifest));
  assert.throws(() => verifyFrozenCore(directory), /480-board/);
});

test('an unverified tunnel binary is never installed or silently overwritten', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'kymon-dependency-'));
  t.after(() => rm(directory, {recursive: true, force: true}));
  await copyFile(join(root, 'KyMonTray.exe'), join(directory, 'KyMonTray.exe'));
  await mkdir(join(directory, 'local'));
  await copyFile(join(root, 'local/KyMonTray.cs'), join(directory, 'local/KyMonTray.cs'));
  const source = join(directory, 'unverified.exe');
  await writeFile(source, 'unverified-download');
  await assert.rejects(prepareWindows({directory, source}), /Checksum mismatch/);
  await assert.rejects(readFile(join(directory, 'tools/cloudflared.exe')), {code: 'ENOENT'});
  await writeFile(join(directory, 'tools/cloudflared.exe'), 'existing-unverified-file');
  await assert.rejects(prepareWindows({directory, source}), /Checksum mismatch/);
  assert.equal(await readFile(join(directory, 'tools/cloudflared.exe'), 'utf8'), 'existing-unverified-file');
  await appendFile(join(directory, 'local/KyMonTray.cs'), '\n// source changed after the binary was built\n');
  await assert.rejects(prepareWindows({directory, source}), /Launcher source changed/);
});
