# AI Reading v2 operations runbook

## Runtime roles

- Deterministic engine and contract construction stay code-owned.
- Structured Planner/reviewer route: existing Sol → Gemini → Prism quota-only chain.
- Surface Writer can be selected independently with `QIMEN_WRITER_PROVIDER`.
- Current RC path: `/home/dinhtrongddr/releases/ai-v2-rc`; source commit `a857633e7536c3d6d04380160e93586981fae438`.
- Current Writer provider: `chatgpt2api-web`, source commit `f47c0ed`, requested model `gpt-6-astra-wm`, requested effort `xhigh`.
- The new Web Edition catalog probe passes; live text generation requires at least one account in its new account pool.

## Runtime checks

1. `systemctl status kymon-vps.service`
2. `docker ps --filter name=qimen-chatgpt2api-web`
3. authenticated local `/api/status`
4. authenticated `http://127.0.0.1:3000/v1/models`
5. named Tunnel `/api/status`

Do not infer model entitlement from `/v1/models` alone.

## Rollback

Release switch is filesystem/symlink based and does not delete data:

`/home/dinhtrongddr/releases/switch-kymon-release.sh legacy`

Return to the tested RC:

`/home/dinhtrongddr/releases/switch-kymon-release.sh rc`

`canary` is an alias for the same RC. `previous-canary` selects the older `46ecb0b` release only for diagnosis.

After either switch, verify local status, named Tunnel status, saved/share read and one deterministic request fingerprint.

## Data to preserve

- `$HOME/.local/share/kymon-shares`
- `$HOME/.local/state/kymon/activity.json`
- outcome registry when present
- runtime auth/provider secrets outside Git
- original legacy release worktree until the Phase 11 observation condition is satisfied

## chatgpt2api-web

- Repository: `https://github.com/dinhtrongddr-dev/chatgpt2api-web`.
- VPS install: `/home/dinhtrongddr/services/chatgpt2api-web`, source commit `f47c0ed`.
- Bind only `127.0.0.1:3000:3000`; never expose the dashboard/API port through the public tunnel.
- Kỳ Môn connects with `http://127.0.0.1:3000/v1`, model `gpt-6-astra-wm`, effort `xhigh`.
- Runtime credentials and account pool are stored outside Git in the new service data directory.
- `/v1/models` passed; text generation must be re-probed after adding a ChatGPT account to the new pool.

## Diagnostics

- AI errors: `$HOME/.local/state/kymon/ai-errors.jsonl`
- bridge log: release `.vps-runtime/server.log`
- provider log: Docker logs for `qimen-chatgpt2api-web`
- never paste access/refresh/id tokens into issue/PR logs

## Updating provider pin

Probe a new digest separately. Repeat model catalog, auth, Vietnamese text, long Writer payload, SSE, cancel, cache, error mapping and Case A/B validation before changing the release pin.
