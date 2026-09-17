#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${QIMEN_VPS_ENV_FILE:-$HOME/.config/kymon-vps/env}"
TOKEN_FILE="${CLOUDFLARE_TUNNEL_TOKEN_FILE:-$HOME/.config/kymon-vps/cloudflare-tunnel.token}"
SERVICE_FILE="/etc/systemd/system/kymon-vps.service"

for cmd in node codex cloudflared curl; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Missing required command: $cmd" >&2; exit 1; }
done

if ! systemctl list-unit-files 9router.service --no-legend 2>/dev/null | grep -q '^9router.service'; then
  echo '9router.service is not installed. Configure 9router systemd first.' >&2
  exit 1
fi

sudo systemctl enable 9router.service >/dev/null
sudo systemctl start 9router.service

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing private environment file: $ENV_FILE" >&2
  exit 1
fi
chmod 600 "$ENV_FILE"

if [[ ! -f "$TOKEN_FILE" ]]; then
  echo "Missing Cloudflare Named Tunnel token file: $TOKEN_FILE" >&2
  exit 1
fi
chmod 600 "$TOKEN_FILE"

USER_NAME="$(id -un)"
HOME_DIR="$HOME"

sudo tee "$SERVICE_FILE" >/dev/null <<EOF
[Unit]
Description=Ky Mon VPS AI Bridge
After=network-online.target 9router.service
Wants=network-online.target
Requires=9router.service

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
echo -n '9router: '
sudo systemctl is-enabled 9router.service
sudo systemctl is-active 9router.service
echo -n 'kymon-vps: '
sudo systemctl is-enabled kymon-vps.service
sudo systemctl is-active kymon-vps.service
