# AI Reading v2 — phase status

Reference branch at start: `develop`  
Reference SHA: `5a52c5eefec13201e28eb847797890490bef09ff`  
Implementation branch: `feature/ai-reading-v2-chatgpt2api`

## Phase 0 — repository baseline

Status: **repo audit verified; production runtime not re-verified in this branch**.

Verified from GitHub source:

- `develop` still points at the v17.6.3 snapshot used by the upgrade plan.
- Legacy structured routing remains Sol → Gemini → Prism, quota-only fallback.
- Prism structured mode still injects JSON schema and parses JSON.
- Hỏi Việc and Mệnh still use their legacy structured Writer/validator paths.
- Frozen deterministic engine files were not modified by this work.

Not verified here:

- currently running VPS process identity and deployed SHA;
- live 9router/Prism/chatgpt2api account quota;
- live model entitlement/effective model;
- DNS/Tunnel process state.

## Phase 2 — provider interface

Status: **implemented on feature branch; CI validation pending at time of this note**.

Added:

- unstructured Codex text generation without `outputSchema`;
- unstructured Prism text generation without JSON-schema prompt coercion;
- `generateStructured` and `generateText` provider interface;
- Writer text routing separated from legacy structured routing;
- explicit provider metadata that does not claim an effective model/effort when it cannot be observed;
- no silent downgrade when `chatgpt2api` is explicitly selected.

Legacy `runAI` structured behavior is intentionally preserved.

## Phase 8 — chatgpt2api capability spike

Status: **adapter + pinned experimental deployment artifacts implemented; live capability probe blocked until runtime credentials/account are configured outside GitHub**.

Upstream source pin:

`basketikun/chatgpt2api@dc105e51bd486bd75c8ef4f74be4bc4724bdfc33`

Implemented:

- loopback-only client at `http://127.0.0.1:3000/v1`;
- explicit auth key requirement when enabled;
- Chat Completions text path for Writer;
- model catalog discovery labelled advertised-only;
- requested/reported/effective model fields kept distinct;
- `xhigh` is transmitted as requested, but effective effort remains unknown unless independently observed;
- auth/rate-limit/unavailable/network/malformed/cancel error classes;
- Docker Compose source-pinned to upstream commit and bound to `127.0.0.1:3000:80`;
- no secret committed and no public Tunnel route added.

## Deliberately not done yet

- chatgpt2api is **not** the production default;
- no account token/cookie is stored in this repository;
- no deterministic engine, Dụng Thần, Strength, Structure, Role, Timing, Kích Thần, đại vận or lưu niên logic changed;
- no Phase 3–7 NarrativeFactPackage/Writer-v2/semantic-audit UI switch has been claimed complete;
- no production deploy or merge.

## Next dependency

Before replacing the user-facing Writer, continue Phase 3 → 7 and then run Phase 9 A/B evaluation. The provider decision is separate: Writer v2 can ship on the current provider even if chatgpt2api is rejected after live probing.
