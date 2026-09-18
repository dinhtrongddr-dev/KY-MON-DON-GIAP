# KM-MENH-1.0 — Release Evidence

Status: FEATURE COMPLETE ON `codex/km-menh-1.0`  
Date: 2026-09-18

## Completed scope

- P0/P1: frozen specification, 41 golden fixtures, source validation.
- P2/P2A: named profiles, resolvers, immutable natal adapter, KNOWN/UNKNOWN birth-time contract.
- P3: 8-palace × 15-year luck engine and 5+5+5 layers.
- P4: evidence core, dedupe, precedence, global-hard guard.
- P5: family/children/marriage/career/wealth domain resolvers.
- P6: immutable annual Tian-pan overlay.
- P7: output/audit guardrails and UNKNOWN stability rules.
- P8: deterministic public API.
- P9: evidence-bound AI writer contract.
- P10: real natal analyzer, browser/server fingerprint contract, `/api/menh/read`, relay support, dedicated `menh.html` UI.

## Final QA

```text
Node tests:        264 / 264 PASS
Python package:    PASS
verify-release:    PASS
protected core:    6 files unchanged
legacy baseline:   480 boards unchanged
package files:     225
package SHA-256:   2d2b2e0ae1dba6e4c91bda179797637661bade3d5eb5c69ad365d7b8418c5f27
```

## Runtime safety

- Existing `/api/read` question-reading protocol remains `TG-CB-6.2 / protocol 5`.
- Mệnh uses separate `KM-MENH-1.0 / MENH_PROTOCOL 1`.
- Server recomputes the natal result and fingerprints from birth inputs before AI is called.
- UNKNOWN birth time runs 12 double-hour families / up to 13 executable candidates and never majority-votes or auto-rectifies a birth hour.
- AI may only verbalize deterministic claims/evidence and has a deterministic fallback after failed validation repair.
- No protected TG-ROTATING-2.0 core file was modified.

## Deployment state

Implementation is committed to the feature branch only. It is not merged into `develop` and not published to production by this evidence record.
