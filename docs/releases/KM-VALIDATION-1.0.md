# KM-VALIDATION-1.0

Date: 2026-09-21
Status: develop / Phase 12
Companion registry: KM-OUTCOME-REGISTRY-1.0
Question protocol: unchanged at protocol 6

## Goal

KM-VALIDATION-1.0 adds a point-in-time evaluation layer for Hỏi Việc. It does not change the Qimen reading.

The evaluation question is intentionally narrow: when a deterministic judgment was locked before the real-world outcome, did the directional class agree with independently reviewed outcome evidence after the stated observation window closed?

This is an evaluation layer, not a new divination rule.

## Separation from KM-CASE-1.0

KM-CASE-1.0 contains reviewed methodological precedents. Its current seed library declares observedOutcome=false.

Phase 12 does not rewrite those cases and does not turn them into empirical evidence.

Policy:

- writesCaseLibrary=false
- no automatic Case retention
- no majority vote
- no verdict override
- no outcome from Phase 12 enters the writer
- no outcome from Phase 12 changes the current chart

Observed-outcome records live in a separate local registry.

## External evaluation principles

The design follows general modern evaluation principles rather than claiming those sources validate Qimen.

NIST AI measurement and TEVV emphasize explicit metrics, test design, documented limitations, context, real-world outcomes, and independent review.

References:

- https://www.nist.gov/ai-measurement-and-evaluation
- https://www.nist.gov/artificial-intelligence/ai-research/tevv-athlon-framework-evaluating-ai-systems
- https://www.nist.gov/publications/aria-evaluation-planning-manual-elements-aria-style-ai-evaluations

NIST AITE emphasizes blind or sequestered evaluation to reduce train/test contamination:

- https://www.nist.gov/news-events/news/2026/07/announcing-nists-artificial-intelligence-technology-evaluation-aite
- https://pages.nist.gov/ai-technology-evaluation/

Probability-calibration reference:

- https://scikit-learn.org/1.4/modules/calibration.html

Because the current Qimen planner does not emit calibrated event probabilities, Phase 12 does not use Brier score, log loss, reliability diagrams or ECE.

## Validation snapshot

A snapshot stores only the minimum derived fields required for evaluation:

- validation and registry version
- capture time and chart time
- request and chart fingerprints
- rules and protocol markers
- domain, mode, question type and intent
- asked stage and dimension
- deterministic answerClass
- directional prediction class or abstention
- observation-window deadline
- temporal-integrity status
- opaque evaluation-unit reference

It does not store raw question text, user statements, AI prose, birth date, chat transcript, Case guidance, or personal name.

## Point-in-time integrity

The server capture time is authoritative.

A snapshot is PROSPECTIVE only when the board timestamp is within 30 minutes of server capture time.

A board more than 30 minutes in the past is RETROSPECTIVE.

A board more than 5 minutes in the future is FUTURE_BOARD_TIME.

Neither retrospective nor future-board snapshots are benchmark eligible.

This blocks creating a historical chart after the outcome is already known and later presenting it as a prospective forecast.

## Observation window

A benchmark needs a deadline.

Supported Phase-12 windows:

- explicit N days, weeks, months, or years
- today
- tomorrow
- this week
- next week
- this month
- next month

Unknown horizon becomes NO_SCORABLE_HORIZON.

An unknown-horizon record may be retained for monitoring, but it cannot be called a failed forecast merely because no event has yet occurred.

The window is resolved from the original civil board input.

## Directional class and abstention

Current planner answer classes are not forcibly rewritten.

Mapping:

- conditional_positive → directional OBSERVED
- future negative / conditional_negative → directional NOT_OBSERVED
- conditional → abstain
- unresolved → abstain
- needs_clarification → abstain

Unresolved is not converted to NOT_OBSERVED. Doing that would manufacture negative predictions the current engine does not make.

## Evaluation unit

Every benchmark-cohort snapshot requires evaluationUnitRef, an opaque identifier for one real-world outcome unit. Directional and abstention cases can both remain in the cohort so coverage and abstention are measurable without forcing coverage to 100%.

Suitable examples include an opaque CRM event ID, local UUID, or salted hash of an external event ID. It must not be the question text.

Registry rules:

- same request fingerprint reuses the existing snapshot
- same evaluationUnitRef with a different request fingerprint is rejected

This prevents repeated readings of one contract or event from being counted as multiple independent outcome samples.

## Outcome classes

Supported observed outcome classes:

- OBSERVED
- NOT_OBSERVED
- INDETERMINATE
- CANCELLED_EXTERNAL

Only OBSERVED and NOT_OBSERVED can enter benchmark scoring.

INDETERMINATE and CANCELLED_EXTERNAL remain visible as excluded or reviewed records.

## Outcome evidence

Every outcome submission needs sourceKind, sourceRef, humanReviewed, independentOfReading, and an outcome or review timestamp.

Source kinds:

- system_record
- document_record
- public_record
- manual_attestation

sourceRef is a compact opaque reference. The registry does not store the underlying document, full evidence text, or a free-text outcome note. Any late-occurrence reference must also be opaque.

manual_attestation may be reviewed descriptively, but it is not benchmark eligible.

Benchmark eligibility requires:

- prospective snapshot
- resolved horizon that was still open at capture time
- opaque evaluation unit
- OBSERVED or NOT_OBSERVED outcome
- human review
- evidence independent of the Qimen reading
- non-attestation external source
- opaque evaluation unit

## Temporal outcome checks

Outcome or evidence timestamp cannot predate snapshot capture.

An OBSERVED outcome occurring after the locked deadline cannot be rewritten as an in-window hit. The original window is NOT_OBSERVED; a later event may only be kept as separate descriptive metadata.

A NOT_OBSERVED outcome cannot be finalized before the deadline.

## No early-hit bias

A positive outcome can be recorded before the deadline, but aggregate agreement metrics do not include the record until its observation window closes.

Otherwise early hits would be counted immediately while misses remain pending until the deadline, biasing the rate upward.

Aggregate metrics therefore use only matured closed windows.

## Metrics

Phase 12 computes:

- total records
- prospective and retrospective counts
- horizon-resolved and matured counts
- records with outcomes
- verified benchmark outcomes
- reviewed descriptive outcomes
- pending-review outcomes
- directional-scored count
- abstained count
- matched and mismatched counts
- coverage
- abstention rate
- historical agreement rate
- categorical confusion counts
- breakdown by domain
- breakdown by asked stage
- separate blind-holdout summary

Coverage is directional-scored divided by all verified benchmark outcomes in the matured cohort; abstentions remain in the denominator. Historical agreement is computed only among directional-scored records. These are descriptive evaluation metrics, not Qimen probabilities.

## Reporting gate

Internal governance threshold:

- fewer than 20 matured directional benchmark cases → COUNTS_ONLY
- 20 or more → DESCRIPTIVE_ONLY

This threshold is a display and governance rule, not proof of statistical sufficiency.

Even after the threshold:

predictiveValidityClaimAllowed=false

Phase 12 never automatically claims predictive accuracy, scientific validation, win rate, calibrated confidence, causal validity, or future probability.

## Probability calibration is intentionally disabled

Policy:

- probabilityCalibrationAllowed=false
- brierScoreAllowed=false
- logLossAllowed=false
- predictiveValidityClaimAllowed=false

Brier score and log loss are proper scoring rules for probability forecasts. The current deterministic Qimen layer does not output calibrated event probabilities. Applying those metrics now would manufacture a probability layer that does not exist.

## Blind holdout track

A snapshot may use BLIND_HOLDOUT or MONITORING.

Blind holdout is reported separately. The label does not itself prove independence; the evaluator must ensure the outcome was unknown and unavailable at snapshot capture time.

## Opt-in collection

Phase 12 does not automatically register normal readings.

Policy:

- autoRegisterReadings=false
- autoCollectOutcomes=false

A normal /api/read call leaves the outcome registry unchanged. A snapshot is created only by explicit validation registration.

This prevents ordinary user questions from silently becoming an empirical dataset.

## Bridge API

Authenticated local bridge endpoints:

- POST /api/validation/register
- POST /api/validation/outcome
- GET /api/validation/report

Registration recomputes the normal protocol-6 reading fingerprint before accepting the snapshot.

Outcome registration is application-level append-once.

The report returns aggregate evaluation metadata.

## Compatibility markers

/api/status exposes:

- validationRules=KM-VALIDATION-1.0
- outcomeRegistryRules=KM-OUTCOME-REGISTRY-1.0

Question protocol remains 6 because Phase 12 does not change the /api/read request or reading-response contract.

## Local storage

Default storage follows QIMEN_APP_ROOT when set:

<QIMEN_APP_ROOT>/outcome-registry.json

Otherwise:

~/.local/state/kymon/outcome-registry.json

This keeps develop and production registries separate when they run from separate app roots.

## Application-level immutability

- prediction snapshot cannot be rewritten through registry APIs
- outcome can be attached only once
- duplicate request fingerprint is de-duplicated
- duplicate evaluation unit with a different prediction is rejected
- invalid registry structure fails closed instead of silently dropping records

Phase 12 does not claim cryptographic notarization against a machine owner manually rewriting local files. External anchoring or notarization is outside Phase 12.

## Case Engine boundary

Outcome Registry records do not flow into CASE_LIBRARY.

KM-CASE-1.0 current seed corpus remains observedOutcome=false.

A future outcome case may only enter Case Engine through a separate manual review and provenance process. There is no automatic promotion.

## Epistemic status

Phase 12 creates infrastructure for disciplined outcome evaluation. It does not make Kỳ Môn scientifically validated.

A future empirical claim would require a study design strong enough for that claim, including sampling discipline, independent outcomes, leakage control, adequate sample size and appropriate comparison baselines.

Phase 12 therefore keeps predictiveValidityClaimAllowed=false.
