#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${QIMEN_REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
WORKTREE_DIR="${QIMEN_DEVELOP_WORKTREE:-$HOME/.local/share/kymon-develop-worktree}"
PREVIEW_DIR="${QIMEN_PREVIEW_DIR:-$HOME/.local/share/kymon-develop-preview}"
ENV_FILE="${QIMEN_ENV_FILE:-$HOME/.config/kymon-vps/env}"
PREVIEW_PORT="${QIMEN_PREVIEW_PORT:-8766}"

die(){ printf 'deploy-develop-preview: %s\n' "$*" >&2; exit 1; }

cd "$REPO_DIR"
git rev-parse --git-dir >/dev/null 2>&1 || die "REPO_DIR không phải git checkout."

# Fetch only. Never switch/reset the caller's current branch or working tree.
git fetch origin develop --prune
SOURCE_TARGET="$(git rev-parse origin/develop)"

if [[ ! -e "$WORKTREE_DIR/.git" ]]; then
  [[ ! -e "$WORKTREE_DIR" || -z "$(ls -A "$WORKTREE_DIR" 2>/dev/null)" ]] || die "Develop worktree path đã tồn tại nhưng không phải git worktree: $WORKTREE_DIR"
  rm -rf "$WORKTREE_DIR"
  git worktree add --detach "$WORKTREE_DIR" "$SOURCE_TARGET" >/dev/null
fi

git -C "$WORKTREE_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "Develop worktree không hợp lệ: $WORKTREE_DIR"
[[ -z "$(git -C "$WORKTREE_DIR" status --porcelain)" ]] || die "Develop worktree có thay đổi chưa commit; dừng để không ghi đè."

git -C "$WORKTREE_DIR" reset --hard "$SOURCE_TARGET" >/dev/null
SOURCE_COMMIT="$(git -C "$WORKTREE_DIR" rev-parse HEAD)"
[[ "$SOURCE_COMMIT" == "$SOURCE_TARGET" ]] || die "Develop worktree không khớp origin/develop."

printf 'Source: origin/develop @ %s\n' "$SOURCE_COMMIT"
printf 'Worktree: %s\n' "$WORKTREE_DIR"

if [[ "${QIMEN_PREVIEW_SKIP_VERIFY:-0}" != "1" ]]; then
  (cd "$WORKTREE_DIR" && npm run verify)
fi

mkdir -p "$PREVIEW_DIR"
STAGE="$(mktemp -d "${PREVIEW_DIR}.stage.XXXXXX")"
cleanup(){ rm -rf "$STAGE"; }
trap cleanup EXIT

cp -a "$WORKTREE_DIR/dist" "$STAGE/"
cp -a "$WORKTREE_DIR/local" "$STAGE/"
cp -a "$WORKTREE_DIR/package.json" "$WORKTREE_DIR/package-lock.json" "$STAGE/"
printf '%s\n' "$SOURCE_COMMIT" > "$STAGE/source-commit"

# Preview-only adaptation. Files inside the Git worktree remain byte-for-byte origin/develop.
python3 - "$STAGE" <<'PY'
from pathlib import Path
import sys

stage = Path(sys.argv[1])

site = stage / "dist/site-config.mjs"
text = site.read_text()
needle = "export const AI_RELAY_ORIGIN = 'https://ai-origin.kymon.pp.ua';"
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
export QIMEN_AI_ERROR_LOG="${QIMEN_AI_ERROR_LOG:-$PREVIEW_DIR/ai-errors-dev.jsonl}"

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
