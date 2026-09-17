#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZIP_PATH="${1:-}"
[[ -n "$ZIP_PATH" ]] || { echo "Usage: bash scripts/install-prism-vps.sh /path/to/openai-prism.zip" >&2; exit 2; }
ZIP_PATH="$(realpath "$ZIP_PATH")"
[[ -f "$ZIP_PATH" ]] || { echo "Prism zip not found: $ZIP_PATH" >&2; exit 2; }

for cmd in node unzip curl systemctl; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Missing required command: $cmd" >&2; exit 1; }
done

INSTALL_DIR="${PRISM_INSTALL_DIR:-$HOME/.local/share/qimen-prism-proxy}"
STATE_DIR="${PRISM_STATE_DIR:-$HOME/.local/state/qimen-prism-proxy}"
PRISM_ENV="${PRISM_ENV_FILE:-$HOME/.config/qimen-prism/env}"
QIMEN_ENV="${QIMEN_VPS_ENV_FILE:-$HOME/.config/kymon-vps/env}"
SERVICE_FILE="/etc/systemd/system/qimen-prism.service"
TMP="$(mktemp -d)"
cleanup(){ rm -rf "$TMP"; }
trap cleanup EXIT

unzip -q "$ZIP_PATH" -d "$TMP"
PACKAGE_JSON="$(find "$TMP" -maxdepth 3 -type f -name package.json -print | head -n 1)"
[[ -n "$PACKAGE_JSON" ]] || { echo 'No package.json found in Prism zip.' >&2; exit 1; }
SOURCE_DIR="$(dirname "$PACKAGE_JSON")"
node -e "const p=require(process.argv[1]); if(p.name!=='prism-openai-proxy') process.exit(1)" "$PACKAGE_JSON" || {
  echo 'The zip is not prism-openai-proxy.' >&2
  exit 1
}
[[ -f "$SOURCE_DIR/bin/prism-openai-proxy.mjs" ]] || { echo 'Missing Prism proxy entrypoint.' >&2; exit 1; }

# Run the package's offline/mock test suite before installing it.
(
  cd "$SOURCE_DIR"
  npm test
)

mkdir -p "$(dirname "$INSTALL_DIR")" "$STATE_DIR" "$(dirname "$PRISM_ENV")" "$(dirname "$QIMEN_ENV")"
NEW_DIR="${INSTALL_DIR}.new"
rm -rf "$NEW_DIR"
cp -a "$SOURCE_DIR" "$NEW_DIR"
rm -rf "$INSTALL_DIR"
mv "$NEW_DIR" "$INSTALL_DIR"

if [[ -f "$PRISM_ENV" ]]; then
  PROXY_KEY="$(sed -n 's/^PROXY_API_KEY=//p' "$PRISM_ENV" | tail -n 1)"
else
  PROXY_KEY=""
fi
if [[ -z "$PROXY_KEY" ]]; then
  PROXY_KEY="$(node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))")"
fi

cat >"$PRISM_ENV" <<EOF
HOST=127.0.0.1
PORT=8787
PROXY_API_KEY=$PROXY_KEY
PRISM_MODEL=gpt-6-astra
PRISM_REASONING_EFFORT=xhigh
PRISM_AUTO_BOOTSTRAP=true
PRISM_EAGER_BOOTSTRAP=true
PRISM_ENABLE_WEB_UI=false
PRISM_HISTORY_MODE=flatten
PRISM_STATE_FILE=$STATE_DIR/.prism-state.json
PRISM_TENANTS_FILE=$STATE_DIR/prism-tenants.json
EXPOSE_FILE_DIFFS=false
DEBUG=false
EOF
chmod 600 "$PRISM_ENV"

NODE_BIN="$(command -v node)"
USER_NAME="$(id -un)"
HOME_DIR="$HOME"
sudo tee "$SERVICE_FILE" >/dev/null <<EOF
[Unit]
Description=Kỳ Môn Prism OpenAI-compatible proxy
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$INSTALL_DIR
Environment=HOME=$HOME_DIR
ExecStart=/bin/bash -lc 'set -a; source "$PRISM_ENV"; set +a; exec "$NODE_BIN" "$INSTALL_DIR/bin/prism-openai-proxy.mjs"'
Restart=always
RestartSec=10
TimeoutStopSec=15

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable qimen-prism.service >/dev/null
sudo systemctl restart qimen-prism.service

ready=0
for _ in $(seq 1 120); do
  if curl -fsS --connect-timeout 2 --max-time 5 \
    -H "Authorization: Bearer $PROXY_KEY" \
    'http://127.0.0.1:8787/v1/models' >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
[[ "$ready" == "1" ]] || {
  echo 'Prism proxy did not become ready.' >&2
  sudo journalctl -u qimen-prism.service -n 80 --no-pager >&2 || true
  exit 1
}

# Preserve unrelated private settings while selecting Prism only for this test branch.
touch "$QIMEN_ENV"
chmod 600 "$QIMEN_ENV"
upsert(){
  local key="$1" value="$2" tmpfile
  tmpfile="$(mktemp)"
  grep -v "^${key}=" "$QIMEN_ENV" >"$tmpfile" || true
  printf '%s=%s\n' "$key" "$value" >>"$tmpfile"
  cat "$tmpfile" >"$QIMEN_ENV"
  rm -f "$tmpfile"
}
upsert QIMEN_AI_ROUTER prism
upsert QIMEN_MODEL gpt-6-astra
upsert QIMEN_REASONING_EFFORT xhigh
upsert PRISM_PROXY_BASE_URL http://127.0.0.1:8787/v1
upsert PRISM_PROXY_API_KEY "$PROXY_KEY"
upsert QIMEN_PUBLISH_RELAY 0
chmod 600 "$QIMEN_ENV"

bash "$ROOT/scripts/install-vps-autostart.sh"

echo 'Prism proxy installed and Kỳ Môn test bridge switched to router=prism.'
echo 'Production relay was left unchanged (QIMEN_PUBLISH_RELAY=0).'
echo 'Check: sudo systemctl status qimen-prism.service kymon-vps.service --no-pager'
