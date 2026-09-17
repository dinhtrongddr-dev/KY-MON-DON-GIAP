#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

: "${QIMEN_PAIRING_TOKEN:?Set QIMEN_PAIRING_TOKEN in the service environment}"

export QIMEN_AI_ROUTER="${QIMEN_AI_ROUTER:-9router}"
export QIMEN_MODEL="${QIMEN_MODEL:-qimen-smart}"
export QIMEN_REASONING_EFFORT="${QIMEN_REASONING_EFFORT:-auto}"
export OPENAI_BASE_URL="${OPENAI_BASE_URL:-http://127.0.0.1:20128/v1}"
PUBLISH_RELAY="${QIMEN_PUBLISH_RELAY:-0}"

if [[ -z "${QIMEN_CODEX_PROVIDER:-}" ]]; then
  : "${OPENAI_API_KEY:?Set OPENAI_API_KEY for the local 9router endpoint, or set QIMEN_CODEX_PROVIDER to a Codex provider already configured on the VPS}"
fi
if [[ "$PUBLISH_RELAY" == "1" ]]; then
  : "${RELAY_ADMIN_SECRET:?Set RELAY_ADMIN_SECRET before publishing the VPS tunnel to the production relay}"
elif [[ "$PUBLISH_RELAY" != "0" ]]; then
  echo "QIMEN_PUBLISH_RELAY must be 0 or 1" >&2
  exit 1
fi

for cmd in node codex cloudflared curl; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Missing required command: $cmd" >&2; exit 1; }
done

LOG_DIR="${QIMEN_LOG_DIR:-$ROOT/.vps-runtime}"
mkdir -p "$LOG_DIR"
TUNNEL_LOG="$LOG_DIR/cloudflared.log"
SERVER_LOG="$LOG_DIR/server.log"
: >"$TUNNEL_LOG"
: >"$SERVER_LOG"

server_pid=""
tunnel_pid=""
cleanup(){
  [[ -n "$tunnel_pid" ]] && kill "$tunnel_pid" 2>/dev/null || true
  [[ -n "$server_pid" ]] && kill "$server_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

node local/server.mjs >>"$SERVER_LOG" 2>&1 &
server_pid=$!

ready=0
for _ in $(seq 1 40); do
  if curl -fsS -H "Host: 127.0.0.1:8765" -H "X-Qimen-Token: $QIMEN_PAIRING_TOKEN" "http://127.0.0.1:8765/api/status" >/dev/null 2>&1; then
    ready=1
    break
  fi
  kill -0 "$server_pid" 2>/dev/null || { cat "$SERVER_LOG" >&2; exit 1; }
  sleep 0.5
done
[[ "$ready" == "1" ]] || { echo "Bridge did not become ready" >&2; cat "$SERVER_LOG" >&2; exit 1; }

cloudflared tunnel --no-autoupdate --url http://127.0.0.1:8765 --loglevel info >>"$TUNNEL_LOG" 2>&1 &
tunnel_pid=$!

TUNNEL_URL=""
for _ in $(seq 1 120); do
  TUNNEL_URL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | tail -n 1 || true)"
  [[ -n "$TUNNEL_URL" ]] && break
  kill -0 "$tunnel_pid" 2>/dev/null || { cat "$TUNNEL_LOG" >&2; exit 1; }
  sleep 0.5
done

[[ -n "$TUNNEL_URL" ]] || { echo "Could not obtain Cloudflare Quick Tunnel URL" >&2; cat "$TUNNEL_LOG" >&2; exit 1; }

# A Quick Tunnel URL can be printed before its DNS record is resolvable everywhere.
# Do not publish or report readiness until the public URL itself reaches the bridge.
tunnel_ready=0
for _ in $(seq 1 180); do
  if curl -fsS --connect-timeout 2 --max-time 5 \
    -H "X-Qimen-Token: $QIMEN_PAIRING_TOKEN" \
    "$TUNNEL_URL/api/status" >/dev/null 2>&1; then
    tunnel_ready=1
    break
  fi
  kill -0 "$tunnel_pid" 2>/dev/null || { cat "$TUNNEL_LOG" >&2; exit 1; }
  sleep 1
done

[[ "$tunnel_ready" == "1" ]] || { echo "Quick Tunnel URL did not become reachable" >&2; cat "$TUNNEL_LOG" >&2; exit 1; }

if [[ "$PUBLISH_RELAY" == "1" ]]; then
  curl -fsS --retry 5 --retry-all-errors \
    -X POST 'https://ky-mon-codex-relay.dinhtrongddr.workers.dev/admin/origin' \
    -H 'Content-Type: application/json' \
    -H "X-Qimen-Relay-Secret: $RELAY_ADMIN_SECRET" \
    --data "{\"url\":\"$TUNNEL_URL\"}" >/dev/null
fi

echo "Kỳ Môn VPS bridge ready"
echo "Router: $QIMEN_AI_ROUTER"
echo "Model route: $QIMEN_MODEL"
echo "Tunnel: $TUNNEL_URL"
if [[ "$PUBLISH_RELAY" == "1" ]]; then
  echo "Production relay: UPDATED"
  echo "Website: https://kymon.pp.ua"
else
  echo "Production relay: UNCHANGED (develop test mode)"
fi

while kill -0 "$server_pid" 2>/dev/null && kill -0 "$tunnel_pid" 2>/dev/null; do
  sleep 5
done

wait "$server_pid" 2>/dev/null || true
wait "$tunnel_pid" 2>/dev/null || true
exit 1
