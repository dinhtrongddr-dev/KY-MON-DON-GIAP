# KM-MENH birth-time rectification — research gate

This feature is not part of frozen KM-MENH-1.0 and must not claim that it recovers a true birth time.

## Blind protocol
1. Collect independent profiles with documented birth time and dated life events.
2. Hide the known birth time from the scoring input; it is evaluation-only.
3. Run UNKNOWN mode across the remembered window or whole day.
4. Record Top-1, Top-3, reciprocal rank, abstention rate, and confidence calibration.
5. Never tune weights on a case and then count that same case as validation.

## Release gates
- Fewer than 20 independent cases: RESEARCH ONLY.
- 20–49 cases: calibration allowed; no accuracy claim.
- 50+ cases: report metrics, including failures and abstentions, before considering a stable rectification release.
- Any rule change resets the validation report and must be rerun against the frozen blind set.

The current fixture file intentionally starts small. New cases must include event provenance/precision and should span different dates, hour branches, sexes, and event histories.

## KM-MENH-RECTIFICATION-1.0 implementation boundary

As of 2026-09-21 the runtime has one blind research case, so the module is hard-coded `RESEARCH_ONLY`, `accuracyClaimAllowed=false` and `autoSelectedBirthHour=null`.

The first deterministic rectifier is annual-resolution only: it checks whether the annual Stem/Branch activation overlaps the domain of an observed life-event year. DAY and MONTH precision are retained as research metadata but receive no scoring bonus until a separately specified sub-annual method exists. Internal support units are ranking mechanics, not probability or calibrated confidence.

UNKNOWN stability remains separate and authoritative for statements that do not depend on birth hour. Rectification must never replace STABLE/TIME_SENSITIVE/UNRESOLVED with majority voting.
