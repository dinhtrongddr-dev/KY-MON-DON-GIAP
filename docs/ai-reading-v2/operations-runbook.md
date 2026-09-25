# AI Reading v2 operations runbook

## Runtime roles

- Deterministic engine and contract construction stay code-owned.
- Structured Planner/reviewer route: existing Sol → Gemini → Prism quota-only chain.
- Surface Writer can be selected independently with `QIMEN_WRITER_PROVIDER`.
- Current RC path: `/home/dinhtrongddr/releases/ai-v2-rc`; source commit `a857633e7536c3d6d04380160e93586981fae438`.
- Current canary Writer: `chatgpt2api`, requested model `gpt-5-6`, requested effort `xhigh`.
- Live chatgpt2api maps requested `xhigh` to transmitted `extended`; effective upstream model/effort is not independently observable.

## Runtime checks

1. `systemctl status kymon-vps.service`
2. `docker ps --filter name=qimen-chatgpt2api`
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

## chatgpt2api

- Bind only `127.0.0.1:3000:80`.
- Release pin is the tested image digest recorded in `chatgpt2api-capabilities.json`.
- Account credentials are runtime-only.
- The built-in Chat Completions cache must be disabled for quality evaluation; cached replay is not an independent sample.
- `max_tokens` was not enforced in the live probe; output length is controlled by contract/prompt plus app validation.

## Diagnostics

- AI errors: `$HOME/.local/state/kymon/ai-errors.jsonl`
- bridge log: release `.vps-runtime/server.log`
- provider log: Docker logs for `qimen-chatgpt2api`
- never paste access/refresh/id tokens into issue/PR logs

## Updating provider pin

Probe a new digest separately. Repeat model catalog, auth, Vietnamese text, long Writer payload, SSE, cancel, cache, error mapping and Case A/B validation before changing the release pin.
