import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

const officialOrigin = 'https://kymon.pp.ua';
const namedTunnel = 'https://ai-origin.kymon.pp.ua';

test('relay uses the fixed Named Tunnel and only proxies the Ky Mon API', async () => {
  const env = {RELAY_ADMIN_SECRET: 'a'.repeat(64)};

  const oldAdminRoute = await worker.fetch(new Request('https://relay.example/admin/origin', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({url: 'https://unit-test.trycloudflare.com'}),
  }), env);
  assert.equal(oldAdminRoute.status, 404);

  const forbidden = await worker.fetch(new Request('https://relay.example/api/status', {
    headers: {Origin: 'https://evil.example', 'X-Qimen-Token': 'test-pairing-token'},
  }), env);
  assert.equal(forbidden.status, 403);

  const originalFetch = globalThis.fetch;
  let upstreamRequest;
  globalThis.fetch = async (url, options) => {
    upstreamRequest = {url: String(url), options};
    return new Response(JSON.stringify({model: 'qimen-smart'}), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
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
    assert.equal(upstreamRequest.url, namedTunnel + '/api/status');
    assert.equal(upstreamRequest.options.headers.get('Origin'), officialOrigin);
    assert.equal(upstreamRequest.options.headers.get('X-Qimen-Token'), 'test-pairing-token');
    assert.match(upstreamRequest.options.headers.get('X-Qimen-Client'), /^[a-f0-9]{64}$/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('relay exposes activity totals without pairing token and keeps client identity hashed', async t => {
  const env={RELAY_ADMIN_SECRET:'c'.repeat(64)},previousFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=previousFetch;});
  const seen=[];
  globalThis.fetch=async(url,options)=>{seen.push({url:String(url),options});return new Response(JSON.stringify({activity:{chartCount:4,readingCount:2,recentReadings:[]}}),{headers:{'Content-Type':'application/json'}});};
  const summary=await worker.fetch(new Request('https://relay.example/api/activity?tzOffset=7',{headers:{Origin:officialOrigin,'CF-Connecting-IP':'203.0.113.20'}}),env);
  assert.equal(summary.status,200);assert.deepEqual((await summary.json()).activity.chartCount,4);
  assert.equal(seen[0].url,namedTunnel+'/api/activity?tzOffset=7');assert.equal(seen[0].options.headers.has('X-Qimen-Token'),false);
  assert.match(seen[0].options.headers.get('X-Qimen-Client'),/^[a-f0-9]{64}$/);
  const chart=await worker.fetch(new Request('https://relay.example/api/activity/chart',{method:'POST',headers:{Origin:officialOrigin,'CF-Connecting-IP':'203.0.113.20'}}),env);
  assert.equal(chart.status,200);assert.equal(seen[1].url,namedTunnel+'/api/activity/chart');
  const forbidden=await worker.fetch(new Request('https://relay.example/api/activity',{headers:{Origin:'https://evil.example'}}),env);
  assert.equal(forbidden.status,403);
});

test('relay streams keepalive and final JSON errors without buffering or losing Retry-After', async t => {
  const env = {RELAY_ADMIN_SECRET: 'b'.repeat(64)};
  const previousFetch = globalThis.fetch;
  t.after(() => {globalThis.fetch = previousFetch;});
  let finish;
  const encoder = new TextEncoder();
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), namedTunnel + '/api/read');
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
