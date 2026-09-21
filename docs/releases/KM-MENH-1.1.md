# KM-MENH-1.1

Date: 2026-09-21
Status: compatibility runtime upgrade
Frozen source specification: KM-MENH-1.0
Runtime rule version: KM-MENH-1.1
Protocol: 2

## Compatibility contract

KM-MENH-1.1 does not rewrite the frozen KM-MENH-1.0 construction specification. Shi Jia Qimen, rotating plate, Chai Bu, fixed natal chart, named Zhang lifetime profile, Center-5 profile policy, 8-palace × 15-year luck, 5+5+5 layers, annual Stem-primary/Branch-secondary semantics and UNKNOWN stability rules remain inherited from 1.0.

The runtime version changes because bounded Strength, Structure and TimePlace layers are added around the frozen natal construction. Numeric destiny scores and deterministic life-event claims remain forbidden.

## Mệnh analysis layer

Known-time readings expose KM-MENH-ANALYSIS-1.1 and reuse the audited KM-STRENGTH-2.0 and KM-STRUCTURE-2.0 engines. No second formula table is created.

Strength keeps Nine Star, Eight Door, Ten-Stem Twelve-Life-Stage and palace environment separate. It changes explanatory force only; it does not select a different Mệnh significator, create a probability, or convert a natal tendency into an observed event.

Structure adds Void, Door-controls-Palace, punishment, Three-Wonder tomb, 81 visible Ten-Stem responses and the bounded major pattern set. Only structures connected to the actual Mệnh role/stem receive role linkage. Normal UI/AI uses modern plainMeaning rather than requiring archaic response names.

## TimePlace

KM-TIMEPLACE-2.0 is reused in Mệnh. fixed_offset remains the default. iana_civil is explicit opt-in and resolves the historical civil UTC offset for the named IANA zone. Repeated DST times require earlier/later disambiguation; nonexistent local times are rejected.

For UNKNOWN birth time, every executable candidate resolves its own civil offset. If a DST ambiguity cannot be resolved without knowing the hour, the engine fails closed instead of inventing a branch.

Optional longitude/latitude can create apparent-solar-time comparison metadata. It is metadata_only: KM-MENH-1.1 never silently rebuilds the natal chart from solar time, never infers location from an IANA zone and never treats solar correction as destiny evidence.

## UNKNOWN birth time

The 1.0 stability invariant remains unchanged: 12 double-hour families, normally 13 executable candidates because early-Zi and late-Zi are separated by the 23:00 day boundary, STABLE/TIME_SENSITIVE/UNRESOLVED classification, no majority vote and no automatic true-hour selection.

Stability and rectification are separate contracts.

## KM-MENH-RECTIFICATION-1.0

Rectification is now a separate module. Validation status is RESEARCH_ONLY. The current blind validation corpus contains 1 independent case, so accuracyClaimAllowed is false and autoSelectedBirthHour is always null.

The research gate asks for at least 5 independent life events across 3 event domains. Below that gate the result is RESEARCH_INSUFFICIENT. A tied top result is RESEARCH_TIED. A unique current leader is RESEARCH_LEADING. Leading means only leading under the current research comparison; it does not mean correct, recovered, verified, probable or accurate birth hour.

Supported event domains are marriage, children, career, wealth, family and relocation/self.

Current rectification is annual-resolution only. For each historical event year, the candidate natal chart stays fixed and an annual overlay is applied. An annual Stem primary overlap contributes 2 internal support units; annual Branch secondary overlap contributes 1. These units are ranking mechanics only, not probability or predictive accuracy.

Users may store DAY/MONTH/YEAR event precision, but this release does not implement sub-annual rectification. Therefore day precision gets no bonus, month precision gets no bonus, and changing 2020 to 12/12/2020 within the same event year must not change ranking support.

Remembered time windows are memory filters, not astrological evidence: MORNING = Mao/Chen/Si/Wu; AFTERNOON = Wu/Wei/Shen/You; EVENING = You/Xu/Hai; NIGHT = Zi/Chou/Yin. NIGHT therefore corresponds approximately to 23:00–04:59 and deliberately excludes Hai.

## Explicit candidate exploration

UNKNOWN results may show candidate boards. A user may explicitly choose “Dùng ứng viên này để xem thử”; the UI then creates a normal KNOWN-time reading using that candidate sample time. This is exploratory and must never be serialized as a verified or rectified birth time.

## AI writer contract

The writer receives frozen deterministic claims/evidence, compact board facts, Semantic Matrix, claim-linked KM-MENH-ANALYSIS-1.1 layers, TimePlace metadata, stability metadata and bounded research rectification metadata.

The writer must not invent a Mệnh significator, promote one Structure pattern over the resolver, call Strength weights probability, expose internal profile labels in normal prose, recalculate pillars from solar metadata, call a rectification leader the true hour, or imply that a day-precision event received day-level astrological matching.

## Protocol

The Mệnh transport protocol is upgraded from 1 to 2. specVersion remains KM-MENH-1.0 to preserve source-construction identity; runtime/server rules become KM-MENH-1.1. Old protocol-1 Mệnh clients fail closed instead of receiving answers under a different runtime contract.

## Regression requirements

Phase 7 verifies: frozen 1.0 spec identity; runtime 1.1/protocol 2; Strength/Structure integration; modern structure meanings; HCMC IANA equivalence with UTC+07; solar metadata immutability; 13 UNKNOWN candidates; RESEARCH_ONLY rectification; no fake DAY/MONTH weighting; abstention below the research gate; NIGHT excluding Hai; blind-case-count alignment; protected-core integrity and the unchanged 480-board baseline.

Frozen 480-board SHA-256:
`d384c9f4d42a94bd80d709eac2c865943ac5ac4f7e86489d84b003edd2b465ea`

## Research status

Birth-time rectification is not a scientifically validated method for recovering a true birth time. In this application it remains a traditional/metaphysical research workflow for consistently comparing candidate charts against user-supplied life-event history. Release gates remain documented in docs/km-menh/KM-MENH-RECTIFICATION-RESEARCH.md.
