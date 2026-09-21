# KM-NIANMING-1.0

Date: 2026-09-21
Status: develop upgrade
Scope: Hỏi Việc only
Protocol: question protocol 6

## 1. Goal

KM-NIANMING-1.0 lets a user optionally provide the birth date or birth year of:

- the questioner;
- a person asked on behalf of;
- a customer / counterpart;
- a competitor;
- a decision maker.

The derived birth-year marker is added as a corroborator on the current event chart.

It must not replace:

- Day Stem as the existing questioner convention;
- KM-YONGSHEN-2.0 primary/secondary resolver;
- question-context actor mapping;
- evidenceScore;
- primaryJudgment;
- timing/direction rank.

## 2. Source distinction

Classical provenance:

`遁甲演義卷一` explicitly says that using Dunjia without considering 本命/行年 is incomplete, and discusses the birth-life / annual-age axis as an additional layer on the current configuration.

Primary references:

- https://ctext.org/wiki.pl?chapter=140678&if=en
- https://zh.wikisource.org/zh-hant/%E9%81%81%E7%94%B2%E6%BC%94%E7%BE%A9
- https://zh.wikisource.org/zh-hant/%E9%81%81%E7%94%B2%E6%BC%94%E7%BE%A9_%28%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC%29

The complete classical 本命行年 method contains more than a birth-year stem locator. It also contains 行年 progression and traditions involving sex-direction, 五虎遁 and 納音.

KM-NIANMING-1.0 deliberately does **not** claim to implement that complete method.

Operational convention selected for this app:

- use the heavenly stem of the birth-year pillar as the current-chart personal locator;
- if that stem is Jia, resolve its hidden Six-Instrument stem from the full year pillar;
- keep the birth-year branch as a secondary directional/palace reference only.

This year-stem usage is common in contemporary Qimen practice, but it is not claimed to be the only school convention.

Cross-checks:

- https://www.sohu.com/a/360803454_120276443
- https://www.sohu.com/a/449137793_121020386

## 3. Input

Accepted values per person:

- `DD/MM/YYYY`;
- `YYYY-MM-DD`;
- `YYYY`.

Supported range follows the app calendar range:

`1900–2100`

The request field is:

`nianming`

Example:

```json
{
  "nianming": {
    "self": "1994-07-17",
    "customer": "1990"
  }
}
```

Raw birth dates are required by the browser/bridge deterministic request, but the AI writer does not receive raw birth dates.

## 4. Li Chun boundary

The birth-year pillar uses the same calendar convention as the main engine:

- Qimen year changes at Li Chun;
- not at Gregorian January 1;
- not at Lunar New Year.

For a full birth date:

1. resolve the year pillar at 00:00;
2. resolve it again at 23:59;
3. if both are identical, the date is safe without a birth time;
4. if they differ, return `boundary_ambiguous`.

The engine must not choose one side of a Li Chun transition when the birth hour is unknown.

Locked regression:

- 03/02/1994 → 癸酉;
- 04/02/1994 → boundary_ambiguous;
- 05/02/1994 → 甲戌.

For year-only input, the app uses the mid-year year pillar and always attaches this warning:

> A person born before Li Chun may belong to the previous Qimen year pillar; enter the full birth date when known.

## 5. Jia handling

A birth year with Jia cannot be located by bare `甲` on the rotating heaven plate.

The full sexagenary year pillar is therefore used to resolve the hidden instrument.

Example:

- 17/07/1994 → 甲戌;
- 甲戌 hides under 己;
- the current event chart locates 己 on the heaven plate;
- that palace is the Niên Mệnh stem palace for this reading.

This reuses the same hidden-Jia rule already used by the audited engine.

## 6. Birth branch

The birth-year branch is recorded separately.

Example:

- 甲戌 → branch 戌;
- 戌 maps to Qian 6 as a branch reference.

The branch reference does not replace the year-stem palace.

It is not an extra vote, score or independent actor.

## 7. Authority boundary

Every resolved row carries:

- `corroboratorOnly:true`;
- `verdictEligible:false`;
- `scoringEligible:false`.

Profile policy:

- `primaryOverrideAllowed:false`;
- `yongshenOverrideAllowed:false`;
- `evidenceScoreAllowed:false`;
- `probabilityAllowed:false`;
- `writerReceivesBirthDate:false`;
- `retentionAllowed:false`.

The Niên Mệnh engine is invoked after the existing roles, palace conditions and strength models have been built.

It does not enter `roles[]`.

Therefore it cannot silently acquire a KM-YONGSHEN tier or evidence weight.

## 8. Multiple people

Each input person keeps a separate identity key.

Supported keys:

- `self`;
- `subject`;
- `customer`;
- `competitor`;
- `decisionMaker`.

If two people have the same birth-year stem, both may point to the same current palace.

That is a shared symbolic location, not two independent votes.

KM-NIANMING-1.0 does not invent a second earth-plate locator to force separation.

## 9. Actor resolution guardrail

Providing a birth year/date for another person does not resolve that person's main actor mapping.

Example:

- question mentions a customer;
- customer Can-Chi mapping remains unknown;
- user supplies customer birth year;
- customer main actor stays `unresolved`;
- Niên Mệnh may be shown as a corroborator only.

This prevents the birth-year layer from bypassing KM-YONGSHEN-2.0 / actor confirmation.

If a third party is not mentioned in the question, its Niên Mệnh can remain display metadata but is not exposed as an active AI claim.

## 10. Reasoning and writer contract

The deterministic planner creates optional claims:

`claim_nianming_<person>`

with:

- `status:'corroboration_only'`;
- `priority:0`;
- `ruleIds:['rule_nianming_v1']`.

They are created only after primary judgment has already been computed.

Niên Mệnh claims cannot enter:

- primary judgment claim IDs;
- deliberation `decisive_claim_ids`;
- deliberation `bottleneck_claim_id`.

They may appear only as supporting or counter-correspondence.

Writer instruction:

- corroborate;
- soften;
- add a condition;
- disclose contradiction as a secondary cross-check.

Writer must not:

- replace Day Stem;
- replace primary/secondary Useful Gods;
- resolve a third party;
- infer fixed personality/destiny from date of birth;
- turn Niên Mệnh into probability.

## 11. Privacy boundary

The deterministic request fingerprint binds the normalized `nianming` input so browser and bridge recompute the same result.

The writer context receives only derived values:

- person key / label;
- input precision;
- year pillar;
- year stem;
- hidden instrument if Jia;
- current palace;
- branch reference;
- relation to already-resolved role/event;
- symbolic snapshot;
- limitations.

It does not receive the raw birth date.

The Case Engine does not retain the birth date.

## 12. UI

The Hỏi Việc form has a collapsed optional section:

`Niên Mệnh · ngày/năm sinh · tùy chọn`

Each palace carrying a supplied Niên Mệnh displays:

`◇`

The board legend says:

`Niên Mệnh · đối chiếu`

The inspector card shows:

- person;
- birth-year pillar;
- year stem / hidden Jia instrument;
- current palace;
- relation to the already-existing main role/event;
- “chỉ dùng để kiểm chứng chéo.”

Niên Mệnh does not:

- recolor the palace;
- change KM-UI-ATTENTION-1.0 severity;
- add a good/bad score.

## 13. Protocol

Hỏi Việc protocol changes:

`5 → 6`

Reason:

- request body gains deterministic `nianming`;
- request fingerprint must bind it;
- old bridges must fail closed rather than silently ignore the new layer.

Production remains on its previous protocol until an explicit publish.

## 14. Non-goals

KM-NIANMING-1.0 does not implement:

- full classical 本命行年;
- annual-age 行年 progression;
- male/female forward/reverse annual-age formulas;
- 五虎遁 annual-age placement;
- 納音 judgment;
- natal-life prediction;
- automatic birth data lookup;
- geolocation;
- personality profiling;
- probability;
- verdict override;
- automatic actor identification;
- automatic Case Engine retention.

## 15. Regression requirements

1. input normalization;
2. invalid date rejection;
3. Li Chun before / boundary / after cases;
4. year-only warning;
5. Jia hidden-instrument resolution;
6. birth branch remains secondary;
7. roles unchanged with/without Niên Mệnh;
8. selected evidence unchanged;
9. primary judgment unchanged;
10. unresolved counterparty remains unresolved;
11. unmentioned third-party Niên Mệnh does not become an active claim;
12. writer receives no raw birth date;
13. protocol 6 round-trip is deterministic;
14. Niên Mệnh changes request fingerprint, not chart fingerprint;
15. UI marks Niên Mệnh separately from Attention severity;
16. protected core unchanged;
17. frozen 480-board SHA unchanged.

Frozen 480-board SHA-256:

`d384c9f4d42a94bd80d709eac2c865943ac5ac4f7e86489d84b003edd2b465ea`

## 16. Epistemic status

Niên Mệnh is a traditional Qimen symbolic convention.

Classical and contemporary sources establish that such a layer exists in Qimen traditions; they do not establish empirical predictive validity.

KM-NIANMING-1.0 therefore treats it as an optional, user-supplied corroborator rather than a factual identity signal, probability or outcome predictor.
