import {ALLOWED_WEB_ORIGINS} from '../../dist/site-config.mjs';
const ORIGIN_KEY = "active_tunnel";
const TUNNEL_SUFFIX = ".trycloudflare.com";

function json(status, data, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Qimen-Token",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

function isAllowedTunnel(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.port === "" &&
      url.pathname === "/" &&
      url.search === "" &&
      url.hash === "" &&
      url.hostname.length > TUNNEL_SUFFIX.length &&
      url.hostname.endsWith(TUNNEL_SUFFIX)
    );
  } catch {
    return false;
  }
}

async function constantTimeEqual(left, right) {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const a = new Uint8Array(leftHash);
  const b = new Uint8Array(rightHash);
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a[index] ^ b[index];
  }
  return difference === 0;
}

async function clientIdentity(request, env) {
  const address = request.headers.get("CF-Connecting-IP") || "unknown";
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${env.RELAY_ADMIN_SECRET}:${address}`),
  );
  return Array.from(new Uint8Array(bytes), (value) => value.toString(16).padStart(2, "0")).join("");
}

async function updateTunnel(request, env) {
  const supplied = request.headers.get("X-Qimen-Relay-Secret") || "";
  if (!env.RELAY_ADMIN_SECRET || !(await constantTimeEqual(supplied, env.RELAY_ADMIN_SECRET))) {
    return json(401, { error: "Khong duoc phep cap nhat relay." });
  }
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) {
    return json(415, { error: "Can du lieu JSON." });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Du lieu JSON khong hop le." });
  }
  if (!isAllowedTunnel(body?.url)) {
    return json(400, { error: "URL Quick Tunnel khong hop le." });
  }

  const record = { url: body.url.toLowerCase(), updatedAt: new Date().toISOString() };
  await env.KYMON_RELAY.put(ORIGIN_KEY, JSON.stringify(record));
  return json(200, { ok: true, ...record });
}

async function proxyApi(request, env, url) {
  const origin = request.headers.get("Origin");
  if (!ALLOWED_WEB_ORIGINS.includes(origin)) {
    return json(403, { error: "Nguon truy cap khong duoc phep." });
  }
  const cors = corsHeaders(origin);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const isStatus = url.pathname === "/api/status" && request.method === "GET";
  const isRead = url.pathname === "/api/read" && request.method === "POST";
  if (!isStatus && !isRead) {
    return json(404, { error: "Khong co chuc nang nay." }, cors);
  }
  if (!request.headers.get("X-Qimen-Token")) {
    return json(401, { error: "Nhap ma ket noi AI." }, cors);
  }
  if (isRead) {
    const contentLength = Number(request.headers.get("Content-Length") || "0");
    if (contentLength > 20000) {
      return json(413, { error: "Cau hoi qua dai." }, cors);
    }
    if (!request.headers.get("Content-Type")?.startsWith("application/json")) {
      return json(415, { error: "Can du lieu JSON." }, cors);
    }
  }

  const record = await env.KYMON_RELAY.get(ORIGIN_KEY, "json");
  if (!record || !isAllowedTunnel(record.url)) {
    return json(503, { error: "May chu Ky Mon chua truc tuyen." }, cors);
  }

  const target = new URL(url.pathname, record.url);
  const headers = new Headers({
    Origin: origin,
    "X-Qimen-Token": request.headers.get("X-Qimen-Token"),
    "X-Qimen-Client": await clientIdentity(request, env),
  });
  if (isRead) headers.set("Content-Type", "application/json");

  let upstream;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: isRead ? request.body : undefined,
      redirect: "manual",
      signal: request.signal,
    });
  } catch {
    return json(502, { error: "Khong ket noi duoc may chu Ky Mon." }, cors);
  }

  const responseHeaders = new Headers(cors);
  responseHeaders.set("Content-Type", upstream.headers.get("Content-Type") || "application/json; charset=utf-8");
  responseHeaders.set("Cache-Control", "no-store");
  responseHeaders.set("X-Content-Type-Options", "nosniff");
  const retryAfter = upstream.headers.get("Retry-After");
  if (retryAfter) responseHeaders.set("Retry-After", retryAfter);
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/admin/origin" && request.method === "POST") {
      return updateTunnel(request, env);
    }
    if (url.pathname === "/health" && request.method === "GET") {
      return json(200, { service: "ky-mon-codex-relay" });
    }
    if (url.pathname.startsWith("/api/")) {
      return proxyApi(request, env, url);
    }
    return json(404, { error: "Not found." });
  },
};
