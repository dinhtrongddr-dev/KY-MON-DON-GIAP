#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${QIMEN_VPS_ENV_FILE:-$HOME/.config/kymon-vps/env}"

command -v npm >/dev/null 2>&1 || { echo 'npm is required' >&2; exit 1; }
command -v 9router >/dev/null 2>&1 || { echo '9router is not installed' >&2; exit 1; }

if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2
fi
PM2_BIN="$(command -v pm2)"

# Reuse the current user's ~/.9router data/provider sessions. PM2 restarts it after crashes/reboots.
pm2 delete 9router >/dev/null 2>&1 || true
pm2 start "$(command -v 9router)" --name 9router --time

# The Kỳ Môn bridge is enabled only when its private environment file exists.
# Secrets remain outside Git and are sourced by the child shell at process start.
if [[ -f "$ENV_FILE" ]]; then
  chmod 600 "$ENV_FILE"
  pm2 delete kymon-vps >/dev/null 2>&1 || true
  pm2 start /bin/bash --name kymon-vps --time -- -lc "set -a; source '$ENV_FILE'; set +a; exec '$ROOT/START-VPS.sh'"
else
  echo "Kỳ Môn bridge not added to autostart yet: missing $ENV_FILE"
  echo "9router autostart will still be installed."
fi

pm2 save
sudo env PATH="$PATH" "$PM2_BIN" startup systemd -u "$USER" --hp "$HOME" >/dev/null
pm2 save

echo 'PM2 reboot startup installed.'
pm2 status
