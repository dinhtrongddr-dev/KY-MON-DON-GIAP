#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${QIMEN_VPS_ENV_FILE:-$HOME/.config/kymon-vps/env}"
SERVICE_FILE="/etc/systemd/system/kymon-vps.service"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing private environment file: $ENV_FILE" >&2
  exit 1
fi
chmod 600 "$ENV_FILE"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
ROUTER="${QIMEN_AI_ROUTER:-9router}"

for cmd in node cloudflared curl; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Missing required command: $cmd" >&2; exit 1; }
done

DEPENDENCY=""
case "$ROUTER" in
  9router)
    command -v codex >/dev/null 2>&1 || { echo 'Missing required command: codex' >&2; exit 1; }
    if ! systemctl list-unit-files 9router.service --no-legend 2>/dev/null | grep -q '^9router.service'; then
      echo '9router.service is not installed. Configure 9router systemd first.' >&2
      exit 1
    fi
    DEPENDENCY="9router.service"
    ;;
  prism)
    if ! systemctl list-unit-files qimen-prism.service --no-legend 2>/dev/null | grep -q '^qimen-prism.service'; then
      echo 'qimen-prism.service is not installed. Run scripts/install-prism-vps.sh first.' >&2
      exit 1
    fi
    DEPENDENCY="qimen-prism.service"
    ;;
  chatgpt)
    command -v codex >/dev/null 2>&1 || { echo 'Missing required command: codex' >&2; exit 1; }
    ;;
  *)
    echo 'QIMEN_AI_ROUTER must be chatgpt, 9router or prism.' >&2
    exit 1
    ;;
esac

if [[ -n "$DEPENDENCY" ]]; then
  sudo systemctl enable "$DEPENDENCY" >/dev/null
  sudo systemctl start "$DEPENDENCY"
fi

USER_NAME="$(id -un)"
HOME_DIR="$HOME"
AFTER="network-online.target${DEPENDENCY:+ $DEPENDENCY}"
REQUIRES="${DEPENDENCY:+Requires=$DEPENDENCY}"

sudo tee "$SERVICE_FILE" >/dev/null <<EOF
[Unit]
Description=Ky Mon VPS AI Bridge
After=$AFTER
Wants=network-online.target
$REQUIRES

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$ROOT
Environment=HOME=$HOME_DIR
ExecStart=/bin/bash -lc 'set -a; source "$ENV_FILE"; set +a; exec /bin/bash "$ROOT/START-VPS.sh"'
Restart=always
RestartSec=10
TimeoutStopSec=15

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable kymon-vps.service >/dev/null
sudo systemctl restart kymon-vps.service

echo 'Systemd reboot startup installed.'
if [[ -n "$DEPENDENCY" ]]; then
  echo -n "$DEPENDENCY: "
  sudo systemctl is-enabled "$DEPENDENCY"
  sudo systemctl is-active "$DEPENDENCY"
fi
echo -n 'kymon-vps: '
sudo systemctl is-enabled kymon-vps.service
sudo systemctl is-active kymon-vps.service
