#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="${QIMEN_APP_ROOT:-$ROOT}"
cd "$APP_ROOT"

: "${QIMEN_PAIRING_TOKEN:?Set QIMEN_PAIRING_TOKEN in the service environment}"

export QIMEN_AI_ROUTER="${QIMEN_AI_ROUTER:-9router}"
export QIMEN_MODEL="${QIMEN_MODEL:-qimen-smart}"
export QIMEN_REASONING_EFFORT="${QIMEN_REASONING_EFFORT:-auto}"
export OPENAI_BASE_URL="${OPENAI_BASE_URL:-http://127.0.0.1:20128/v1}"
export QIMEN_TUNNEL_HOSTNAME="${QIMEN_TUNNEL_HOSTNAME:-ai-origin.kymon.pp.ua}"
PUBLISH_RELAY="${QIMEN_PUBLISH_RELAY:-0}"
TOKEN_FILE="${CLOUDFLARE_TUNNEL_TOKEN_FILE:-$HOME/.config/kymon-vps/cloudflare-tunnel.token}"

if [[ -z "${QIMEN_CODEX_PROVIDER:-}" ]]; then
  : "${OPENAI_API_KEY:?Set OPENAI_API_KEY for the local 9router endpoint, or set QIMEN_CODEX_PROVIDER to a Codex provider already configured on the VPS}"
fi
if [[ "$PUBLISH_RELAY" != "0" ]]; then
  echo "Named Tunnel develop mode requires QIMEN_PUBLISH_RELAY=0 until production publish is explicitly confirmed." >&2
  exit 1
fi
if [[ ! -f "$TOKEN_FILE" ]]; then
  echo "Missing Cloudflare Named Tunnel token file: $TOKEN_FILE" >&2
  exit 1
fi
chmod 600 "$TOKEN_FILE"

for cmd in node codex cloudflared curl; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Missing required command: $cmd" >&2; exit 1; }
done

LOG_DIR="${QIMEN_LOG_DIR:-$ROOT/.vps-runtime}"
mkdir -p "$LOG_DIR"
TUNNEL_LOG="$LOG_DIR/cloudflared.log"
SERVER_LOG="$LOG_DIR/server.log"
PRISM_LOG="$LOG_DIR/prism.log"
: >"$TUNNEL_LOG"
: >"$SERVER_LOG"
: >"$PRISM_LOG"

server_pid=""
tunnel_pid=""
prism_pid=""
cleanup(){
  [[ -n "$tunnel_pid" ]] && kill "$tunnel_pid" 2>/dev/null || true
  [[ -n "$server_pid" ]] && kill "$server_pid" 2>/dev/null || true
  [[ -n "$prism_pid" ]] && kill "$prism_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

PRISM_ENV="${PRISM_ENV_FILE:-$HOME/.config/qimen-prism/env}"
PRISM_BIN="${PRISM_INSTALL_DIR:-$HOME/.local/share/qimen-prism-proxy}/bin/prism-openai-proxy.mjs"
if [[ -n "${PRISM_PROXY_API_KEY:-}" && -f "$PRISM_ENV" && -f "$PRISM_BIN" ]]; then
  (
    set -a
    source "$PRISM_ENV"
    set +a
    exec node "$PRISM_BIN"
  ) >>"$PRISM_LOG" 2>&1 &
  prism_pid=$!
  prism_ready=0
  for _ in $(seq 1 60); do
    if curl -fsS --connect-timeout 2 --max-time 5       -H "Authorization: Bearer $PRISM_PROXY_API_KEY"       "http://127.0.0.1:8787/v1/models" >/dev/null 2>&1; then
      prism_ready=1
      break
    fi
    kill -0 "$prism_pid" 2>/dev/null || { cat "$PRISM_LOG" >&2; exit 1; }
    sleep 1
  done
  [[ "$prism_ready" == "1" ]] || { echo "Prism fallback runtime did not become ready" >&2; cat "$PRISM_LOG" >&2; exit 1; }
fi

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

cloudflared tunnel run --token-file "$TOKEN_FILE" >>"$TUNNEL_LOG" 2>&1 &
tunnel_pid=$!

TUNNEL_URL="https://$QIMEN_TUNNEL_HOSTNAME"
tunnel_ready=0
for _ in $(seq 1 180); do
  if curl -fsS --connect-timeout 3 --max-time 8 \
    -H "Origin: https://kymon.pp.ua" \
    -H "X-Qimen-Token: $QIMEN_PAIRING_TOKEN" \
    "$TUNNEL_URL/api/status" >/dev/null 2>&1; then
    tunnel_ready=1
    break
  fi
  kill -0 "$tunnel_pid" 2>/dev/null || { cat "$TUNNEL_LOG" >&2; exit 1; }
  sleep 1
done

[[ "$tunnel_ready" == "1" ]] || { echo "Cloudflare Named Tunnel did not become reachable at $TUNNEL_URL" >&2; cat "$TUNNEL_LOG" >&2; exit 1; }

echo "Kỳ Môn VPS bridge ready"
echo "Router: $QIMEN_AI_ROUTER"
echo "Model route: $QIMEN_MODEL"
echo "Named Tunnel: $TUNNEL_URL"
echo "Production relay: UNCHANGED (develop test mode)"

while kill -0 "$server_pid" 2>/dev/null && kill -0 "$tunnel_pid" 2>/dev/null && { [[ -z "$prism_pid" ]] || kill -0 "$prism_pid" 2>/dev/null; }; do
  sleep 5
done

wait "$server_pid" 2>/dev/null || true
wait "$tunnel_pid" 2>/dev/null || true
[[ -n "$prism_pid" ]] && wait "$prism_pid" 2>/dev/null || true
exit 1
