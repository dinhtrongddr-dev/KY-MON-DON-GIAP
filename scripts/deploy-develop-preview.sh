#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${QIMEN_REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
PREVIEW_DIR="${QIMEN_PREVIEW_DIR:-$HOME/.local/share/kymon-develop-preview}"
ENV_FILE="${QIMEN_ENV_FILE:-$HOME/.config/kymon-vps/env}"
PREVIEW_PORT="${QIMEN_PREVIEW_PORT:-8766}"

die(){ printf 'deploy-develop-preview: %s\n' "$*" >&2; exit 1; }

cd "$REPO_DIR"
[[ -d .git ]] || die "REPO_DIR không phải git checkout."
[[ -z "$(git status --porcelain)" ]] || die "Working tree không sạch; dừng để tránh ghi đè thay đổi chưa commit."

git fetch origin develop --prune
git switch develop >/dev/null
git reset --hard origin/develop >/dev/null
[[ -z "$(git status --porcelain)" ]] || die "develop vẫn có thay đổi sau khi đồng bộ origin/develop."

SOURCE_COMMIT="$(git rev-parse HEAD)"
printf 'Source: origin/develop @ %s\n' "$SOURCE_COMMIT"

if [[ "${QIMEN_PREVIEW_SKIP_VERIFY:-0}" != "1" ]]; then
  npm run verify
fi

mkdir -p "$PREVIEW_DIR"
STAGE="$(mktemp -d "${PREVIEW_DIR}.stage.XXXXXX")"
cleanup(){ rm -rf "$STAGE"; }
trap cleanup EXIT

cp -a dist "$STAGE/"
cp -a local "$STAGE/"
cp -a package.json package-lock.json "$STAGE/"
printf '%s\n' "$SOURCE_COMMIT" > "$STAGE/source-commit"

# Preview-only adaptation. Source files in Git remain untouched.
python3 - "$STAGE" <<'PY'
from pathlib import Path
import sys

stage = Path(sys.argv[1])

site = stage / "dist/site-config.mjs"
text = site.read_text()
needle = "export const AI_RELAY_ORIGIN = 'https://ky-mon-codex-relay.dinhtrongddr.workers.dev';"
if needle not in text:
    raise SystemExit("Không tìm thấy AI_RELAY_ORIGIN chuẩn để tạo same-origin preview.")
site.write_text(text.replace(
    needle,
    "export const AI_RELAY_ORIGIN = ''; // preview only: same-origin bridge",
    1,
))

server = stage / "local/server.mjs"
text = server.read_text()
redirect = """   if(host.type==='tunnel'){
     res.writeHead(302,{Location:SITE_ORIGIN+'/','Cache-Control':'no-store'});
     return res.end();
   }"""
preview_redirect = """   if(host.type==='tunnel'&&!process.env.QIMEN_PREVIEW_PORT){
     res.writeHead(302,{Location:SITE_ORIGIN+'/','Cache-Control':'no-store'});
     return res.end();
   }"""
if redirect not in text:
    raise SystemExit("Không tìm thấy redirect tunnel chuẩn để tạo preview.")
text = text.replace(redirect, preview_redirect, 1)

startup = """ const activityStore=createActivityStore({filePath:defaultActivityPath()});
 const bridge=createBridge({activityStore});
 bridge.server.on('error',e=>console.error(e.code==='EADDRINUSE'?'Cổng 8765 đang được dùng. Đóng server cũ rồi chạy lại.':'Không khởi động được server local.'));
 bridge.server.listen(8765,'127.0.0.1',()=>{"""
preview_startup = """ const listenPort=Number(process.env.QIMEN_PREVIEW_PORT||8765);
 const activityStore=createActivityStore({filePath:defaultActivityPath()});
 const bridge=createBridge({activityStore,port:listenPort});
 bridge.server.on('error',e=>console.error(e.code==='EADDRINUSE'?('Cổng '+listenPort+' đang được dùng. Đóng server cũ rồi chạy lại.'):'Không khởi động được server local.'));
 bridge.server.listen(listenPort,'127.0.0.1',()=>{"""
if startup not in text:
    raise SystemExit("Không tìm thấy startup bridge chuẩn để tạo preview.")
server.write_text(text.replace(startup, preview_startup, 1))
PY

node --check "$STAGE/local/server.mjs"
node --check "$STAGE/dist/activity-log.mjs"

OLD_PID="$(cat "$PREVIEW_DIR/bridge.pid" 2>/dev/null || true)"
if [[ "$OLD_PID" =~ ^[0-9]+$ ]]; then
  kill "$OLD_PID" 2>/dev/null || true
fi

rm -rf "$PREVIEW_DIR/dist" "$PREVIEW_DIR/local"
mv "$STAGE/dist" "$PREVIEW_DIR/dist"
mv "$STAGE/local" "$PREVIEW_DIR/local"
cp "$STAGE/package.json" "$STAGE/package-lock.json" "$STAGE/source-commit" "$PREVIEW_DIR/"

[[ -f "$ENV_FILE" ]] || die "Thiếu env file: $ENV_FILE"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

export QIMEN_PREVIEW_PORT="$PREVIEW_PORT"
export QIMEN_TUNNEL_HOSTNAME=
export QIMEN_ACTIVITY_LOG="${QIMEN_ACTIVITY_LOG:-$PREVIEW_DIR/activity-dev.json}"

nohup node "$PREVIEW_DIR/local/server.mjs" >"$PREVIEW_DIR/bridge.log" 2>&1 </dev/null &
BRIDGE_PID=$!
printf '%s\n' "$BRIDGE_PID" > "$PREVIEW_DIR/bridge.pid"

STATUS=
for _ in $(seq 1 40); do
  if STATUS="$(curl -fsS --max-time 2 \
      -H "Host: 127.0.0.1:$PREVIEW_PORT" \
      -H "X-Qimen-Token: $QIMEN_PAIRING_TOKEN" \
      "http://127.0.0.1:$PREVIEW_PORT/api/status" 2>/dev/null)"; then
    break
  fi
  sleep .5
done
[[ -n "$STATUS" ]] || { tail -40 "$PREVIEW_DIR/bridge.log" >&2 || true; die "Bridge preview không lên ở port $PREVIEW_PORT."; }

URL="$(grep -Eo 'https://[a-z0-9-]+[.]trycloudflare[.]com' "$PREVIEW_DIR/tunnel.log" 2>/dev/null | tail -1 || true)"
[[ -n "$URL" ]] || die "Không tìm thấy Quick Tunnel URL trong $PREVIEW_DIR/tunnel.log."

curl -fsS --max-time 10 "$URL/" >/dev/null
CONFIG="$(curl -fsS --max-time 10 "$URL/site-config.mjs")"
grep -Fq "AI_RELAY_ORIGIN = ''" <<<"$CONFIG" || die "Preview chưa dùng same-origin AI relay."
PUBLIC_STATUS="$(curl -fsS --max-time 10 \
  -H 'Sec-Fetch-Site: same-origin' \
  -H "X-Qimen-Token: $QIMEN_PAIRING_TOKEN" \
  "$URL/api/status")"
ACTIVITY="$(curl -fsS --max-time 10 \
  -H 'Sec-Fetch-Site: same-origin' \
  "$URL/api/activity?tzOffset=7")"

printf 'Preview OK\n'
printf 'Commit: %s\n' "$SOURCE_COMMIT"
printf 'Bridge PID: %s\n' "$BRIDGE_PID"
printf 'URL: %s\n' "$URL"
printf 'Status: %s\n' "$PUBLIC_STATUS"
printf 'Activity: %s\n' "$ACTIVITY"
