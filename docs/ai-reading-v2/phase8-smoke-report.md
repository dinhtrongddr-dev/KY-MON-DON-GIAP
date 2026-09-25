# Phase 8 live capability smoke report

## Decision

**GO — limited to Surface Writer.** The provider is usable for natural-text Writer traffic. Planner and semantic reviewer remain on the structured provider path unless a separate evaluation proves a reason to move them.

## Live deployment evidence

- Loopback endpoint: `127.0.0.1:3000`; no public admin/provider port.
- Tested image digest: `sha256:fbee934fd5363ef6ce5f7632df854f87c770e382bf0f874f8c59372eeded6aab`.
- One existing local Codex OAuth account imported at runtime; no token committed.
- Catalog advertised `gpt-5-6`; catalog is not treated as entitlement/effective-model proof.
- Real Case B Surface Writer payload returned six expected sections in parseable JSON.
- Real Case A and Case B Writer payloads both passed deterministic validation.

## Transport probes

- Invalid auth: HTTP 401 with `invalid_api_key`.
- Streaming: SSE emitted multiple `data:` chunks and `[DONE]`.
- Cancel: client closed after ~1 second; service remained healthy and `/v1/models` returned 200 afterwards.
- Unicode + system/user roles: passed.
- Long Writer payload: passed.
- `reasoning_effort=xhigh`: live image source normalizes to `thinking_effort=extended`; effective upstream effort remains unknown.
- `max_tokens=8`: ignored/not enforced in observed Chat Completions path; response was ~1.2k chars with `finish_reason=stop`. App must control length in contract/prompt and validate output rather than depend on this field.
- Identical-request cache: first request ~5.1s, repeated request ~8ms, identical response body. Evaluation runs must bypass/disable cache.

## Unknown / intentionally not forced

- Natural live 429/quota exhaustion.
- Natural upstream 5xx.
- Independent proof of hidden upstream model implementation or effective reasoning effort.

Those conditions remain covered by adapter/fake-transport tests where possible and are not fabricated as live PASS results.
