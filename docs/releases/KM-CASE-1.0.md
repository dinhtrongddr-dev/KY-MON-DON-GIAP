# KM-CASE-1.0 — Case Engine

Date: 2026-09-21
Status: bounded methodological case-based reasoning layer
Runtime: Hỏi Việc TG-CB-6.3 / protocol 5; Mệnh KM-MENH-1.1 / protocol 2
Compatibility marker: caseRules = KM-CASE-1.0

## 1. Purpose

KM-CASE-1.0 adds a bounded case-based reasoning layer above the deterministic Kỳ Môn engines. Its job is to retrieve already reviewed methodological precedents and help the writer assemble the current deterministic result consistently.

It does not replace the current chart, Useful Gods, outcome dimensions, Structure, Strength, Role/Agency, Timing, natal claims or annual/luck overlays.

Case guidance is not evidence. The current chart always has authority over the case library.

## 2. External CBR basis

The architecture follows the classical CBR cycle described by Agnar Aamodt and Enric Plaza: retrieve prior cases, reuse relevant knowledge, revise for the target problem, then retain useful experience.

Reference: Aamodt, A. & Plaza, E. (1994), “Case-Based Reasoning: Foundational Issues, Methodological Variations, and System Approaches”, AI Communications 7(1), 39–59. DOI: 10.3233/AIC-1994-7104.

Retrieval deliberately does not assume that the most superficially similar case is automatically the most reusable one. KM-CASE-1.0 therefore combines hard compatibility gates with adaptation cost.

Reference: Smyth, B. & Keane, M. T. (1998), “Adaptation-guided retrieval: questioning the similarity assumption in reasoning”, Artificial Intelligence 102(2), 249–293. DOI: 10.1016/S0004-3702(98)00059-9.

## 3. The four steps in this application

### Retrieve

The engine builds a sanitized target signature from current deterministic analysis, then retrieves only cases that pass hard boundaries such as product, domain, mode, stage, required roles, unresolved roles, secondary domains, global structures, claim types, Timing availability or annual-overlay availability.

Similarity is used only after hard compatibility gates. The ranking also includes adaptation cost, case priority and specificity.

### Reuse

Only methodological guidance is reused:
- order of reading;
- stage separation;
- Useful-God precedence;
- global-structure precedence;
- role and unresolved-counterpart guardrails;
- no-double-count rules;
- timing precedence;
- annual-layer boundaries.

Old outcome, actor identity, palace, stem, date, amount, answer class or life event is never transferred into the target reading.

### Revise

Every retrieved case carries explicit adaptation notes. A case whose old answer class differs from the current planner receives adaptation burden rather than changing the current answer.

The writer receives only a stripped checklist: applicability, assembly, adaptation and avoid. It does not receive caseId, sourceCase, sourceRef, similarity score or adaptationCost.

### Retain

Runtime never auto-retains user sessions.

`proposeCaseRetention()` can only create a sanitized review candidate. It stores no question text and does not mutate the source-controlled library.

A case is ready for manual library review only when it has human review and an explicit provenance/source reference. A case intended for outcome calibration additionally requires observed-outcome evidence external to the Kỳ Môn reading.

## 4. Authority boundaries

KM-CASE-1.0 has the following immutable policy:

- verdictOverrideAllowed = false
- majorityVoteAllowed = false
- probabilityAllowed = false
- autoRetainUserSessions = false
- storesQuestionText = false

The engine is instantiated after the current deterministic primary judgment in Hỏi Việc. It therefore cannot participate in forming that judgment.

For Mệnh, retrieval is built from already generated deterministic natal claims and global structures. It cannot change KM-MENH resolvers or claims.

## 5. Current seed library

The first library contains reviewed regression/reference precedents rather than empirical prediction-outcome records.

Hỏi Việc seeds include:
- finance income emergence vs cash realization;
- mixed family + financial-capacity hierarchy;
- unresolved relationship counterpart / no mind-reading;
- symbolic health boundary;
- KM-YINGQI trigger precedence.

Mệnh seeds include:
- Z18 global FuYin precedence;
- Z17 Day/Hour baseline and no duplicate vote;
- LWF06 marriage multi-resolver;
- LWF08 annual Tian-pan locator boundary.

Every current seed declares `observedOutcome=false`.

Therefore current seed corpus has:
`outcomeCalibrationAllowed = false`

The library cannot be used to claim predictive accuracy, win rate, success rate, confidence percentage or empirical validation of Kỳ Môn.

## 6. Retrieval and adaptation mechanics

Hard gates reject cases crossing incompatible conditions, for example a finance-emergence case cannot be retrieved as a health case merely because role patterns happen to overlap.

After hard gates, the engine computes an internal explanatory similarity and adaptation cost. These values only order methodological precedents. They are not probabilities and are not exposed to the writer.

Priority exists to preserve cross-cutting guardrails. For example, when a natal chart has global FuYin, the Z18 global-precedence lesson is ordered before domain-specific marriage or annual lessons when they are otherwise equally applicable.

## 7. Hỏi Việc integration

The Case Engine runs after:
1. Useful-God/domain resolution;
2. evidence bundle selection;
3. directional interactions;
4. outcome dimensions;
5. event stages;
6. primary judgment;
7. deterministic Timing.

Only then is `caseProfile` built.

This preserves the principle:
`current deterministic result → case assembly guidance`, never the reverse.

## 8. Mệnh integration

Mệnh retrieval uses the frozen/runtime result already created by KM-MENH-1.1.

Examples:
- FuYin can retrieve the Z18 lesson that global structure must be read before favorable local signals but is not an automatic bad-fate veto;
- MARRIAGE_CORE can retrieve the multi-resolver lesson;
- ANNUAL_CURRENT can retrieve the annual Stem-primary / Branch-secondary scope boundary;
- SELF_CORE + CHILDREN_CORE can retrieve the Day/Hour anti-double-count lesson.

No reference case can overwrite the current person's natal evidence.

## 9. Writer privacy and leakage guard

Writer context intentionally strips:
- caseId;
- sourceCase;
- sourceRef;
- similarity;
- adaptationCost;
- provenance labels.

Both Hỏi Việc and Mệnh validators reject internal Case Engine metadata if a model tries to print it into user-visible prose.

Normal user prose should read as a direct interpretation of the current Kỳ Môn board, not as “a similar old case says...”.

## 10. Retention/privacy policy

The initial runtime does not learn automatically from ordinary readings.

It does not automatically store:
- question text;
- identity;
- chat/session data;
- user outcome;
- generated AI prose.

Future new cases require manual review and provenance. Observed outcome must be independently recorded if the case will ever participate in empirical outcome evaluation.

## 11. Compatibility

Browser and bridge now exchange:
`caseRules: KM-CASE-1.0`

This is required for both Hỏi Việc and Mệnh requests/responses.

A Phase-8 browser talking to a Phase-7 bridge, or the reverse, fails closed instead of silently running without the expected Case Engine contract.

`/api/status` exposes the same `caseRules` version for deployment verification.

## 12. Regression contract

Phase 8 must prove at least:
1. library case IDs are unique and provenance-locked;
2. current seed corpus contains no empirical outcome claim;
3. finance emergence retrieves the correct golden case without changing the planner verdict;
4. hard domain boundaries prevent unrelated retrieval;
5. answer-class mismatch creates adaptation burden instead of copying the old outcome;
6. mixed family + finance preserves family primacy;
7. unresolved counterpart guidance disappears once the counterpart is resolved;
8. Timing case cannot fabricate dates;
9. writer context contains no case IDs, source refs or retrieval scores;
10. runtime Retain does not auto-store sessions or question text;
11. Mệnh global FuYin precedent is ordered before domain-specific precedents;
12. writer validators reject Case Engine metadata leakage;
13. browser/bridge compatibility requires caseRules KM-CASE-1.0;
14. protected core and the 480-board baseline remain unchanged.

Frozen 480-board SHA-256:
`d384c9f4d42a94bd80d709eac2c865943ac5ac4f7e86489d84b003edd2b465ea`

## 13. Non-goals

KM-CASE-1.0 does not claim:
- scientific validation of Kỳ Môn forecasting;
- statistical predictive accuracy;
- automated online learning from users;
- a nearest-neighbor outcome predictor;
- a case-frequency probability model;
- replacement of deterministic Qimen rules;
- permission to infer missing facts from precedent.

It is a controlled reasoning-quality layer whose purpose is consistency, adaptation discipline and auditability.
