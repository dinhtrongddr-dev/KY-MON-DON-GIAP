import {mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

if (process.platform !== 'win32') throw new Error('The tray launcher requires Windows and .NET Framework 4.x.');
const root = fileURLToPath(new URL('../', import.meta.url));
const compiler = join(process.env.SystemRoot || 'C:/Windows', 'Microsoft.NET/Framework64/v4.0.30319/csc.exe');
const output = join(root, '.verification/launcher/KyMonTray.exe');
mkdirSync(join(root, '.verification/launcher'), {recursive: true});
execFileSync(compiler, ['/nologo', '/utf8output', '/target:exe',
  '/reference:System.Windows.Forms.dll', '/reference:System.Drawing.dll',
  `/win32icon:${join(root, 'KyMonTray.ico')}`, `/out:${output}`, join(root, 'local/KyMonTray.cs')],
{cwd: root, stdio: 'inherit', windowsHide: true});
execFileSync(output, ['--self-test'], {cwd: root, stdio: 'inherit', windowsHide: true, timeout: 30000});
console.log(`Launcher source compiled and self-test passed: ${output}`);
