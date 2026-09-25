# AI Reading v2 — phase status

Reference branch at start: `develop`  
Reference SHA: `5a52c5eefec13201e28eb847797890490bef09ff`  
Implementation branch: `feature/ai-reading-v2-chatgpt2api`

## Current result

Status: **implementation branch passes the complete repository gate; production is not switched or deployed**.

Verified in an isolated VPS worktree:

- `npm run check`: 566/566 JavaScript tests passed.
- Python regression: 1/1 passed.
- `npm run verify`: static assets, six protected core files, launcher pin, versions and module syntax passed.
- The original `develop` worktree was not reset or overwritten.

## Phase 0 — repository/runtime baseline

GitHub source still starts from v17.6.3 at `5a52c5e...`.

The VPS develop worktree also contained an existing uncommitted Writer-layer refactor. That work was read and merged into the isolated feature worktree instead of being reset. Production process/DNS/Tunnel/provider entitlement remain separate runtime checks.

## Phase 2 — provider interface

Status: **implemented and tested**.

- `generateStructured` preserves the current structured Sol → Gemini → Prism route.
- `generateText` is independent of JSON-schema coercion.
- Codex and Prism both have natural-text transports.
- Writer provider selection is explicit.
- Selecting `chatgpt2api` does not silently downgrade to another route.
- Requested/reported/effective model and effort metadata remain distinct.

## Phase 3 — narrative contract and provenance

Status: **implemented and tested**.

- Hỏi Việc and Mệnh create a downstream narrative contract without changing the board or deterministic conclusions.
- Facts, conditions, global modifiers, facets and technical evidence stay backend-owned.
- Contract construction is covered by regression fixtures for Case A and Case B.

## Phase 4 — question-aware facets / Mệnh life topics

Status: **implemented and tested**.

- Hỏi Việc uses explicit facets from the real question instead of forcing every reading into three stages.
- Case B retains decision, requested late-October milestone, one-year resources and career-return concerns.
- Mệnh keeps life-topic sections and applies global modifiers by scope instead of requiring technical password wording.

## Phase 5 — free Surface Writer

Status: **implemented and wired to the text provider path**.

The Writer now receives only the approved natural-language projection and returns a lightweight envelope:

```json
{"sections":[{"id":"approved-section-id","text":"natural Vietnamese prose"}]}
```

The Writer does **not** return `claim_ids`, atom IDs, certainty codes, technical evidence or trace metadata. Backend code reattaches provenance and evidence deterministically.

Production-default orchestration on this branch uses `runSurfaceText` for the Writer, while Planner and semantic reviewer remain on structured `runAI`.

## Phase 6 — semantic audit, bounded repair and fallback

Status: **implemented and tested**.

- Hard integrity/factual checks remain code-owned.
- Independent semantic review checks prose against approved meaning.
- At most one content-repair pass is used before natural deterministic fallback.
- Style/repetition is a quality report only; it no longer acts as an automatic rewrite gate.
- Legacy sentence-level regex repair is removed from the v2 interpretation path.

## Phase 7 — meaning/evidence rendering and export

Status: **implemented in the feature worktree and covered by repository tests**.

- Meaning and technical evidence are separate fields.
- The existing technical-evidence toggle hides whole evidence fields, not text guessed from formatting.
- Hỏi Việc/Mệnh rendering and report export understand the new shape.
- Legacy/fingerprint/integrity checks remain protected by the existing test suite.

## Phase 8 — chatgpt2api capability adapter

Status: **adapter implemented; live capability probe completed successfully on VPS; production canary is the next step**.

Upstream source pin:

`basketikun/chatgpt2api@dc105e51bd486bd75c8ef4f74be4bc4724bdfc33`

Implemented:

- loopback-only client at `http://127.0.0.1:3000/v1`;
- explicit runtime auth-key requirement;
- Chat Completions text path for the Surface Writer;
- catalog discovery marked advertised-only, never entitlement proof;
- conservative model/effort observability;
- auth/rate-limit/unavailable/network/malformed/cancel error mapping;
- source-pinned Docker deployment bound to `127.0.0.1:3000:80`;
- no credentials committed and no public provider/admin tunnel.
- live probe service is bound to `127.0.0.1:3000`.
- tested runtime image digest: `sha256:fbee934fd5363ef6ce5f7632df854f87c770e382bf0f874f8c59372eeded6aab`.
- one existing local Codex OAuth account was imported at runtime without committing credentials.
- `gpt-5-6` completed the real Case B Surface Writer payload and returned all six expected sections in parseable JSON.
- first full Case B Writer call took about 78.8 s; a later equivalent call completed in about 9.9 s.

## Phase 9 — focused A/B on locked regression packages

Status: **focused Case A / Case B comparison completed; both providers passed deterministic validation**.

Case B — Hỏi Việc:

- current Writer route: `gpt-5.6-sol`, about 15.6 s, valid output, style report `REPEATED_VERIFICATION`;
- chatgpt2api Writer route: `gpt-5-6`, about 9.9 s on the measured repeat, valid output, same style report.

Case A — Mệnh:

- current Writer route: `gpt-5.6-sol`, about 20.3 s, valid output, no style issue;
- chatgpt2api Writer route: `gpt-5-6`, about 8.6 s, valid output, no style issue.

These timings are observational, not a model-quality ranking. Cache/warm-state effects can materially change latency.

## Deliberately not done

- no production merge yet;
- no account token/cookie in GitHub;
- no claim that echoed/catalog model fields prove the hidden upstream implementation or effective reasoning effort;
- no change to deterministic engine, Dụng Thần, Strength, Structure, Role, Timing, Kích Thần, đại vận or lưu niên.

## Next dependency

Deploy a Writer-only canary: Surface Writer uses `chatgpt2api/gpt-5-6`; Planner and semantic reviewer remain on the current structured route. Keep rollback as an environment-only switch.
