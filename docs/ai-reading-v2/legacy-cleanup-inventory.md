# Legacy cleanup inventory — Phase 11 preparation

Status: **inventory only; destructive cleanup is blocked until Phase 10 observation criteria are met.**

## Call graph findings

The v2 orchestration files `local/interpret.mjs` and `local/menh-interpret.mjs` call the new Surface Writer path and validators. They do not call the legacy local rewrite functions.

The legacy v17.6.3 interpreter still contains:
- `repairUnsupportedTiming`
- `repairUnsupportedEvents`
- `repairCertainty`
- `repairStageOverclaim`
- `repairRepeatedVerification`
- `repairEmphasis`

Those functions are confined to the retained legacy release path and remain necessary only while that path is the rollback target.

## What remains intentionally

- `validateReading` / `validateMenhReading`: retain factual, integrity, trace, timing and schema protections. Do not delete merely because older versions also enforced wording.
- old ReadingDocument adapters and browser compatibility tests: retain while saved/share legacy documents exist.
- legacy release worktree: retain until rollback no longer depends on it.
- sanitizer/parser/Host/Origin/pairing/fingerprint checks: permanent security/integrity behavior, not “legacy wording gates”.

## What may be removed after observation

Only after Phase 10 observation and a replacement rollback strategy:
- legacy sentence rewrite functions and their production-only callers;
- experimental flags no longer used;
- wording tests that protect no supported legacy document/pipeline.

Before removal, rerun caller inventory, old/new compatibility, saved/share/export and frozen-core gates.
