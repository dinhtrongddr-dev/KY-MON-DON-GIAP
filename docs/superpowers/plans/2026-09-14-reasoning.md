# Qimen Interpretation Upgrade Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. Sites ownership requires the owner to edit the checkout. Steps use checkbox syntax.

**Goal:** Make readings explain a contextual, evidence-linked sequence of events and actions.

**Architecture:** Extend the existing analysis context with a deterministic evidence graph and planner. The AI writer sees compact selected facts and writes a validated response. Core and connection authentication remain unchanged.

**Tech Stack:** Existing browser/Node ES modules, node:test, buildless Sites hosting.

**Spec:** `docs/superpowers/specs/2026-09-14-reasoning-design.md`

## Global Constraints

- Preserve Core and baseline hash `d384c9f4d42a94bd80d709eac2c865943ac5ac4f7e86489d84b003edd2b465ea`.
- Preserve model `gpt-5.6-sol`, high effort, manual pairing and fixed relay.
- Keep the same Site and main layout. No new dependencies or secret handling.
- Protocol 5 / TG-CB-5.0 must match in browser and bridge.

### Task 1: Context and semantic actors

Files: add `dist/qimen/ai/questionContext.mjs`, `dist/qimen/modes/semantics.mjs`; modify classifier, usefulGod, analysis/index and contextBuilder; add `tests/reasoning-context.test.mjs`.

Interfaces:
```js
buildQuestionContext(question, {mode, topic, depth}) // structured source-aware context
domainSemantics(domain) // roles, implications, vocabulary and cautions
// prepareReading(body).context.allInOne.questionContext
```
- [ ] Add a failing test: same board contract prediction/strategy yields questionType prediction/strategy, same domain business, same board.
- [ ] Add literal cases for duration 1 month, explicit company subject, find-person vs romance Khai semantics, unknown customer, and user facts retained verbatim.
- [ ] Run `node --test tests/reasoning-context.test.mjs` and observe missing-context assertions.
- [ ] Implement structured extraction, domain/intent separation, source provenance and resolver integration; run those tests plus the 480-board test.
- [ ] Commit context and registry slice.

### Task 2: Evidence bundles and deterministic scenario

Files: add `analysis/evidenceBundles.mjs`, `analysis/contradictions.mjs`, `analysis/evidenceScore.mjs`, `ai/scenario.mjs`, `ai/recommendations.mjs`, `ai/realWorld.mjs`; extend relationGraph and contextBuilder; add `tests/reasoning-planner.test.mjs`.

Interfaces:
```js
buildEvidenceBundles(analysis, context, graph)
scoreEvidence(bundles, context, graph)
resolveContradictions(bundle, context)
translateToRealWorld(bundle, context)
buildScenario(selected, context, graph)
buildRecommendations(scenario, selected, context)
```
- [ ] Test that Khai+Void has a conditional opportunity and realization blocker; removing Void removes that blocker.
- [ ] Test four symbols yield one bundle; own-stem tomb does not leak from carried stem; unresolved actors have no fabricated edges; rank deduplicates same-palace evidence.
- [ ] Test prediction vs strategy changes scenario objective and recommendation ordering, not only prompt text.
- [ ] Implement pure modules and expose `allInOne.reasoning` with claims and recommendation IDs; verify new tests and regression; commit.

### Task 3: Writer, contract, audit and UI

Files: add `ai/writerContext.mjs`, `ai/readingAudit.mjs`, `schemas/reading.mjs`; modify reading-core, local/interpret, prompts, reading-view, ui-controls/results, index/styles. Migrate contract fixtures and boundary tests.

Interfaces:
```js
buildWriterContext(preparedContext) // selected facts, immutable planner, no full raw board dump
readingSchema(facts, context)
validateReading(result, facts, topic, context)
// result: status/topic_id/mode/questionType/summary/situation/development/bottleneck/actions/alternative/timing/comparisons/questions
// substantive prose nodes: text + claim_ids; action nodes: text + recommendation_id
```
- [ ] Test fabricated claim/action/candidate IDs fail, omitted dominant conflict fails, repeated paragraph fails, prediction template cannot satisfy strategy, and short clarification succeeds.
- [ ] Test invalid writer response triggers exactly one repair with unchanged planner; abort covers repair and stale results.
- [ ] Implement compact request, strict schema and audit, explicit depth input bound into request identity, safe DOM renderer with collapsed evidence; keep candidate comparisons.
- [ ] Migrate old tests from retired schema to equivalent v5 invariants, keeping core/security/cancellation tests; verify and commit.

### Task 4: Release verification and publication

Files: update QIMEN-ARCHITECTURE.md, AI-EVAL.md, HUONG-DAN-LOCAL.md, audit.html and package manifest script as needed; regenerate downloads/ky-mon-ai.zip.
- [ ] Run `node --test tests/*.test.mjs`, `node scripts/verify-assets.mjs`, `git diff --check`.
- [ ] Compare core paths to v15; require zero diff. Inspect zipped module coverage and run bridge tests from extracted archive.
- [ ] Document limitations of heuristic audits and unexecuted live-model evaluation; update installation instructions and rules labels.
- [ ] Commit and push exact source to existing Site branch, package validated dist, save/deploy through Sites, wait for terminal status, report version and bridge update requirement.

## Self review

All user requirements map to the four tasks above. Domain registry is finite and extensible, unknown facts are retained as unknown; no claim of universal traditional consensus. Timing and direction reuse their existing comparison engine. Work occurs in the owner worktree; no delegated implementation or additional approval round.
