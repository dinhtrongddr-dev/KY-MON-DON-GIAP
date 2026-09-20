import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const codex=readFileSync(new URL('../local/codex-client.mjs',import.meta.url),'utf8');
const server=readFileSync(new URL('../local/server.mjs',import.meta.url),'utf8');
const browser=readFileSync(new URL('../dist/menh-ai.mjs',import.meta.url),'utf8');

test('KM-MENH one-shot long-form keeps a ten-minute model budget and larger browser budget',()=>{
  assert.match(codex,/READING_TIMEOUT_MS=600000/);
  assert.match(browser,/610000/);
});
test('successful Mệnh AI reading scrolls the result into view',()=>{
  assert.match(browser,/scrollIntoView\?\.\(\{behavior:'smooth',block:'start'\}\)/);
  assert.match(browser,/status\.textContent='Đã nhận bài luận AI'.*scrollToAnswer\(\)/s);
});
test('KM-MENH one-shot long-form transport has megabyte output headroom and tunnel keepalive',()=>{
  assert.match(codex,/outputBytes>4\*1024\*1024/);
  assert.match(server,/keepAliveAfterMs=75000/);
  assert.match(server,/keepAliveEveryMs=15000/);
});
