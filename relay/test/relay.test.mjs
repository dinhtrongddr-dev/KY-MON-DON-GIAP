import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

class MemoryKv {
  constructor() { this.values = new Map(); }
  async get(key, type) {
    const value = this.values.get(key) ?? null;
    return type === 'json' && value !== null ? JSON.parse(value) : value;
  }
  async put(key, value) { this.values.set(key, value); }
}

const officialOrigin = 'https://kymon.tkgiongnoi2.chatgpt.site';
const tunnel = 'https://unit-test.trycloudflare.com';

test('relay authenticates updates and proxies only the Ky Mon API', async () => {
  const env = { KYMON_RELAY: new MemoryKv(), RELAY_ADMIN_SECRET: 'a'.repeat(64) };

  const unauthorized = await worker.fetch(new Request('https://relay.example/admin/origin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Qimen-Relay-Secret': 'wrong' },
    body: JSON.stringify({ url: tunnel }),
  }), env);
  assert.equal(unauthorized.status, 401);

  const update = await worker.fetch(new Request('https://relay.example/admin/origin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Qimen-Relay-Secret': env.RELAY_ADMIN_SECRET },
    body: JSON.stringify({ url: tunnel }),
  }), env);
  assert.equal(update.status, 200);

  const forbidden = await worker.fetch(new Request('https://relay.example/api/status', {
    headers: { Origin: 'https://evil.example', 'X-Qimen-Token': 'test-pairing-token' },
  }), env);
  assert.equal(forbidden.status, 403);

  const originalFetch = globalThis.fetch;
  let upstreamRequest;
  globalThis.fetch = async (url, options) => {
    upstreamRequest = { url: String(url), options };
    return new Response(JSON.stringify({ model: 'gpt-5.6-sol' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  try {
    const response = await worker.fetch(new Request('https://relay.example/api/status', {
      headers: {
        Origin: officialOrigin,
        'X-Qimen-Token': 'test-pairing-token',
        'CF-Connecting-IP': '203.0.113.10',
      },
    }), env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), officialOrigin);
    assert.equal(upstreamRequest.url, tunnel + '/api/status');
    assert.equal(upstreamRequest.options.headers.get('Origin'), officialOrigin);
    assert.equal(upstreamRequest.options.headers.get('X-Qimen-Token'), 'test-pairing-token');
    assert.match(upstreamRequest.options.headers.get('X-Qimen-Client'), /^[a-f0-9]{64}$/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('relay streams keepalive and final JSON errors without buffering or losing Retry-After', async t => {
  const env = {KYMON_RELAY: new MemoryKv(), RELAY_ADMIN_SECRET: 'b'.repeat(64)};
  await env.KYMON_RELAY.put('active_tunnel', JSON.stringify({url: tunnel}));
  const previousFetch = globalThis.fetch;
  t.after(() => {globalThis.fetch = previousFetch;});
  let finish;
  const encoder = new TextEncoder();
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.redirect, 'manual');
    assert.equal(await new Response(options.body).text(), '{"request":"unchanged"}');
    return new Response(new ReadableStream({start(controller) {
      controller.enqueue(encoder.encode(' '.repeat(2048)));
      finish = () => {
        controller.enqueue(encoder.encode('{"error":"Provider usage limit reached."}'));
        controller.close();
      };
    }}), {status: 200, headers: {'Content-Type': 'application/json', 'Retry-After': '600'}});
  };
  const response = await worker.fetch(new Request('https://relay.example/api/read', {
    method: 'POST', headers: {Origin: officialOrigin, 'X-Qimen-Token': 'test-pairing-token',
      'Content-Type': 'application/json'}, body: '{"request":"unchanged"}',
  }), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Retry-After'), '600');
  const reader = response.body.getReader();
  const first = await reader.read();
  assert.equal(first.done, false);
  assert.equal(first.value.length, 2048);
  finish();
  const last = await reader.read();
  const text = new TextDecoder().decode(first.value) + new TextDecoder().decode(last.value);
  assert.deepEqual(JSON.parse(text), {error: 'Provider usage limit reached.'});
  assert.equal((await reader.read()).done, true);
});
