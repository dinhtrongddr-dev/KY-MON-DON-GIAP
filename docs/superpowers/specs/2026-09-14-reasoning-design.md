# Qimen reasoning v16 — approved design

The user approved approach 1 on 2026-09-14: deterministic analysis planner followed by one AI writer, with one bounded repair if validation fails. Implement directly in the existing Site; no further design approval is needed.

## Boundaries

Keep `dist/qimen.mjs`, `dist/vendor/lunar.js`, and `dist/qimen/core/` unchanged. Preserve both methods and the 480-board baseline hash. Preserve model `gpt-5.6-sol`, high effort, fixed relay `https://ky-mon-codex-relay.dinhtrongddr.workers.dev`, manual pairing, cancellation, server recomputation, and fingerprint validation. No secrets or new providers. Keep the existing Site and main layout.

## Data flow

Question context separates domain from intent. Extend existing topic/mode registries and actor resolver; do not add another board implementation. User statements retain their source text. Inferred semantic roles are explicitly proxies, never verified people. Unresolved actors retain null palaces.

Each actor receives a bundle of its relevant palace symbols, its own stem conditions, and related edges. Rank bundles by transparent relevance and corroboration, not success probability; select three to six distinct mechanisms. Contradictions record support, blocker, dominant condition and an observable resolution condition. A domain semantic registry supplies concepts and vocabulary, not canned readings.

The planner produces traceable claims, a conditional scenario, alternative, turning point and recommendations. The writer receives a compact ReadingEvidenceGraph and only selected board facts; full normalized data stays available to the application for verification. Graph edges describe symbolic relationships, never prove real-world causality.

## Result contract

Protocol 5 / TG-CB-5.0 replaces overlapping prose requirements with conclusion, situation, three linked stages, bottleneck, actions and optional candidate comparisons. Every substantive section references allowed claim IDs; actions reference planner recommendations. Short clarification remains possible. Default target is 500–800 Vietnamese space-delimited words, simple questions shorter; deep mode explicitly opts into longer output. No invented identities, exact outcomes, dates, amounts or success percentages. UI retains five result tabs and shows concise evidence in closed details by default.

## Validation and acceptance

Deterministic validation checks structure, exact identity, claim coverage, scenario order, required conflicts, action grounding, candidate IDs, repeated passages, unsupported numerical certainty and bounded length. It cannot prove semantic truth or calibrated forecasts. Actual model quality requires the documented live evaluation matrix; report that separately from mocked runner and DOM tests.

Acceptance cases include same-board prediction vs strategy; domain-dependent Khai; Khai plus Void; multi-symbol bundles; conflict dominance and resolution; no repetition; readable output; traceable collapsed evidence; stale response/cancel/security regressions; timing/direction preservation. Publish the validated static Site and distribute the matching bridge archive. Publishing cannot update the user's running bridge.
