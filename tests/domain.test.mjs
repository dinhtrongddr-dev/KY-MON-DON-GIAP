import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isAllowedOrigin} from '../local/server.mjs';
import worker from '../relay/src/index.js';

const primary = 'https://kymon.pp.ua';
const legacy = 'https://kymon.tkgiongnoi2.chatgpt.site';

test('custom domain and the migration fallback reach bridge and relay with exact CORS', async () => {
  for (const origin of [primary, legacy]) {
    assert.equal(isAllowedOrigin(origin, 8765), true, origin);
    const response = await worker.fetch(new Request('https://relay.example/api/read', {
      method: 'OPTIONS', headers: {Origin: origin},
    }), {});
    assert.equal(response.status, 204, origin);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
    assert.equal(response.headers.get('Vary'), 'Origin');
  }
  for (const origin of ['http://kymon.pp.ua', 'https://kymon.pp.ua.evil.example',
    'https://evil.kymon.pp.ua', 'https://kymon.pp.ua:444', 'null', '']) {
    assert.equal(isAllowedOrigin(origin, 8765), false, origin);
    const response = await worker.fetch(new Request('https://relay.example/api/read', {
      method: 'OPTIONS', headers: {Origin: origin},
    }), {});
    assert.equal(response.status, 403, origin);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  }
});

test('launcher, redirects and canonical website address use the custom domain', () => {
  const source = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
  assert.ok(source('local/KyMonTray.cs').includes('OfficialSite = "https://kymon.pp.ua/"'));
  assert.match(source('dist/index.html'), /rel="canonical" href="https:\/\/kymon\.pp\.ua\/"/);
});
