import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));

test('Cloudflare Pages publishes the verified dist directory without server bindings', async () => {
  const config = JSON.parse(await readFile(join(root, 'wrangler.jsonc'), 'utf8'));
  assert.equal(config.name, 'ky-mon-don-giap');
  assert.equal(config.pages_build_output_dir, './dist');
  assert.equal(config.compatibility_date, '2026-09-15');
  assert.equal(config.main, undefined);
  assert.equal(config.kv_namespaces, undefined);
  assert.equal(config.d1_databases, undefined);
  assert.equal(config.r2_buckets, undefined);
});

test('the ChatGPT Sites configuration remains available for rollback', async () => {
  const config = JSON.parse(await readFile(join(root, '.openai/hosting.json'), 'utf8'));
  assert.equal(config.static.directory, 'dist');
});
