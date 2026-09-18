import {ALLOWED_WEB_ORIGINS} from '../../dist/site-config.mjs';

const UPSTREAM_ORIGIN = 'https://ai-origin.kymon.pp.ua';

function json(status, data, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Qimen-Token',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}

async function clientIdentity(request, env) {
  const address = request.headers.get('CF-Connecting-IP') || 'unknown';
  const salt = env.RELAY_ADMIN_SECRET || 'ky-mon-relay-client-v1';
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${salt}:${address}`),
  );
  return Array.from(new Uint8Array(bytes), (value) => value.toString(16).padStart(2, '0')).join('');
}

async function proxyApi(request, env, url) {
  const origin = request.headers.get('Origin');
  if (!ALLOWED_WEB_ORIGINS.includes(origin)) {
    return json(403, {error: 'Nguon truy cap khong duoc phep.'});
  }
  const cors = corsHeaders(origin);
  if (request.method === 'OPTIONS') {
    return new Response(null, {status: 204, headers: cors});
  }

  const isStatus = url.pathname === '/api/status' && request.method === 'GET';
  const isRead = url.pathname === '/api/read' && request.method === 'POST';
  const isActivity = url.pathname === '/api/activity' && request.method === 'GET';
  const isChart = url.pathname === '/api/activity/chart' && request.method === 'POST';
  if (!isStatus && !isRead && !isActivity && !isChart) {
    return json(404, {error: 'Khong co chuc nang nay.'}, cors);
  }
  if ((isStatus || isRead) && !request.headers.get('X-Qimen-Token')) {
    return json(401, {error: 'Nhap ma ket noi AI.'}, cors);
  }
  if (isRead) {
    const contentLength = Number(request.headers.get('Content-Length') || '0');
    if (contentLength > 20000) {
      return json(413, {error: 'Cau hoi qua dai.'}, cors);
    }
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) {
      return json(415, {error: 'Can du lieu JSON.'}, cors);
    }
  }

  const target = new URL(url.pathname + url.search, `${UPSTREAM_ORIGIN}/`);
  const headers = new Headers({
    Origin: origin,
    'X-Qimen-Client': await clientIdentity(request, env),
  });
  const token = request.headers.get('X-Qimen-Token');
  if (token) headers.set('X-Qimen-Token', token);
  if (isRead) headers.set('Content-Type', 'application/json');

  let upstream;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: isRead ? request.body : undefined,
      redirect: 'manual',
      signal: request.signal,
    });
  } catch {
    return json(502, {error: 'Khong ket noi duoc may chu Ky Mon.'}, cors);
  }

  const responseHeaders = new Headers(cors);
  responseHeaders.set('Content-Type', upstream.headers.get('Content-Type') || 'application/json; charset=utf-8');
  responseHeaders.set('Cache-Control', 'no-store');
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  const retryAfter = upstream.headers.get('Retry-After');
  if (retryAfter) responseHeaders.set('Retry-After', retryAfter);
  return new Response(upstream.body, {status: upstream.status, headers: responseHeaders});
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health' && request.method === 'GET') {
      return json(200, {service: 'ky-mon-codex-relay'});
    }
    if (url.pathname.startsWith('/api/')) {
      return proxyApi(request, env, url);
    }
    return json(404, {error: 'Not found.'});
  },
};
