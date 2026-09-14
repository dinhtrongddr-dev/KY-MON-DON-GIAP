import {createHash, randomUUID} from 'node:crypto';
import {createWriteStream} from 'node:fs';
import {readFile, mkdir, access, copyFile, rename, unlink} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {fileURLToPath, pathToFileURL} from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
const pins = JSON.parse(await readFile(new URL('./windows-dependencies.json', import.meta.url), 'utf8'));
const exists = async path => {try {await access(path); return true;} catch {return false;}};

export async function verifyArtifact(path, pin) {
  const bytes = await readFile(path);
  if ((pin.size && bytes.length !== pin.size) || createHash('sha256').update(bytes).digest('hex') !== pin.sha256) {
    throw new Error(`Checksum mismatch: ${path}. Keep the frozen dependency pin unchanged.`);
  }
}

export async function prepareWindows({directory = root, source} = {}) {
  const launcherSource = (await readFile(join(directory, pins.launcher.source), 'utf8')).replaceAll('\r\n', '\n');
  if (createHash('sha256').update(launcherSource).digest('hex') !== pins.launcher.sourceSha256) {
    throw new Error('Launcher source changed: rebuild and review the source/binary checksums together.');
  }
  await verifyArtifact(join(directory, pins.launcher.path), pins.launcher);
  const target = join(directory, 'tools/cloudflared.exe');
  if (await exists(target)) {
    await verifyArtifact(target, pins.cloudflared);
    return target;
  }
  const installed = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'KyMonCodex/app/tools/cloudflared.exe');
  const input = source || (installed && await exists(installed) ? installed : null);
  await mkdir(dirname(target), {recursive: true});
  const temporary = `${target}.${randomUUID()}.download`;
  try {
    if (input) {
      await verifyArtifact(input, pins.cloudflared);
      await copyFile(input, temporary);
    } else {
      const response = await fetch(pins.cloudflared.url, {signal: AbortSignal.timeout(180000)});
      if (!response.ok || !response.body) throw new Error(`Download failed: HTTP ${response.status}`);
      await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary, {flags: 'wx'}));
    }
    await verifyArtifact(temporary, pins.cloudflared);
    await rename(temporary, target);
    return target;
  } finally {
    await unlink(temporary).catch(error => {if (error.code !== 'ENOENT') throw error;});
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--cloudflared-source')) {
    throw new Error('Usage: node scripts/prepare-windows.mjs [--cloudflared-source PATH]');
  }
  const target = await prepareWindows({source: args[1]});
  console.log(`Windows dependencies verified: cloudflared ${pins.cloudflared.version}; ${target}`);
}
