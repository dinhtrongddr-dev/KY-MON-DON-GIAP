import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isAllowedOrigin} from '../local/server.mjs';

const primary = 'https://kymon.pp.ua';
const legacy = 'https://kymon.tkgiongnoi2.chatgpt.site';

test('custom domain and the migration fallback reach the bridge with exact origin checks', async () => {
  for (const origin of [primary, legacy]) {
    assert.equal(isAllowedOrigin(origin, 8765), true, origin);
  }
  for (const origin of ['http://kymon.pp.ua', 'https://kymon.pp.ua.evil.example',
    'https://evil.kymon.pp.ua', 'https://kymon.pp.ua:444', 'null', '']) {
    assert.equal(isAllowedOrigin(origin, 8765), false, origin);
  }
});

test('launcher, redirects and canonical website address use the custom domain', () => {
  const source = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
  assert.match(source('dist/index.html'), /rel="canonical" href="https:\/\/kymon\.pp\.ua\/"/);
});
