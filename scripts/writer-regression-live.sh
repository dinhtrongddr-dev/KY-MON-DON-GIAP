#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
set -a
source "${QIMEN_ENV_FILE:-$HOME/.config/kymon-vps/env}"
source "${QIMEN_CHATGPT2API_ENV_FILE:-$HOME/services/chatgpt2api.env}"
set +a
export QIMEN_WRITER_PROVIDER=chatgpt2api
export QIMEN_CHATGPT2API_ENABLED=1
export CHATGPT2API_BASE_URL=http://127.0.0.1:3000/v1
export CHATGPT2API_WRITER_MODEL="${CHATGPT2API_WRITER_MODEL:-gpt-5-6}"
export CHATGPT2API_REASONING_EFFORT="${CHATGPT2API_REASONING_EFFORT:-xhigh}"
export QIMEN_LIVE_QA_STRUCTURED_PROVIDER=writer
cd "$ROOT"
exec node scripts/writer-regression.mjs --live "$@"
