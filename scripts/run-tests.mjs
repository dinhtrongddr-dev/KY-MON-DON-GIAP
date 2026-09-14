import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = ['tests', 'relay/test'].flatMap(directory =>
  readdirSync(new URL(`../${directory}/`, import.meta.url))
    .filter(name => name.endsWith('.test.mjs')).sort().map(name => `${directory}/${name}`));
const run = (command, args) => {
  const result = spawnSync(command, args, {cwd: root, stdio: 'inherit', windowsHide: true});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};
// Expand files here: shell wildcards behave differently on Windows and Node 22.
run(process.execPath, ['--test', ...files]);
run(process.env.KYMON_PYTHON || 'python', ['tests/package.test.py']);
