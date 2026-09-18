# KM-MENH-1.0 — Implementation Specification

**Status:** FROZEN FOR IMPLEMENTATION  
**Freeze date:** 2026-09-18  
**Code status:** NOT STARTED — this specification and the golden regression suite are the implementation gate  
**Domain:** Kỳ Môn Mệnh / 奇门终身局  
**Default source profile:** Zhang Zhichun Advanced-Class lifetime method  
**Base system:** 时家奇门 · 转盘 · 拆补法  
**Primary validation:** `KY-MON-MENH-ZHANG-ZHICHUN-REFERENCE-BACKTEST-v0.3.md`

> KM-MENH-1.0 codifies a traditional metaphysical/divination corpus. It is a source-reproduction specification, not a scientifically validated model of personality, wealth, health, relationships, or future events.

---

## 0. Freeze declaration

`KM-MENH-1.0` freezes the interpretation core identified by the v0.3 reference backtest.

The implementation MUST preserve three separate concepts:

1. **CORE_ZHANG** — rules frozen for the default engine.
2. **PROFILE_SPECIFIC_CONSTRUCTION** — chart-construction behavior that is frozen only inside a named profile.
3. **LATER_ZHANG_LINE_EXTENSIONS** — transmission-school techniques that remain disabled in the default engine.

The implementation MUST NOT create a blended “universal Zhang” profile.

The following are explicitly frozen:

```yaml
specId: KM-MENH-1.0
defaultProfile: ZHANG_ADVANCED_CLASS_LIFETIME
chartFamily: SHI_JIA_QIMEN
plate: ROTATING
juMethod: CHAI_BU
inputTime: BIRTH_TIME
chartPersistence: FIXED_NATAL
luckModel: EIGHT_PALACES_X_15_YEARS
annualStemLayerDefault: TIAN_PAN_ACTIVE_STEM
numericDestinyScore: FORBIDDEN
deterministicEventClaims: FORBIDDEN
```

---

# 1. Source authority and provenance

## 1.1 Source tiers

Source authority and in-chart evidence priority are separate axes.

```text
A1 = direct Zhang Advanced-Class lifetime rule
A2 = direct Zhang book / general natal rule
B  = direct Zhang general framework / auxiliary cases
C1 = Wang Jianguo transmission
C2 = Li Wanfu Zhang-line transmission
C3 = other later Zhang-line transmission
```

A lower-tier source MAY corroborate a core rule. It MUST NOT silently override a conflicting A1/A2 construction rule.

## 1.2 Provenance enum

Every source-backed rule and every source golden fixture MUST store one of:

```yaml
provenance:
  - DIRECT_ZHANG
  - DIRECT_ZHANG_AUXILIARY
  - TRANSMISSION_WJG
  - TRANSMISSION_ZHANG_LINE_LWF
  - TRANSMISSION_OTHER
  - DERIVED_INVARIANT
```

## 1.3 Source conflict policy

If a published case has internally inconsistent birth pillars, analyzed Day Stem, analyzed Hour Stem, or chart placement:

```text
fixture.status = SOURCE_CONFLICT
fixture.golden = false
```

It may remain as a **negative fixture** proving that the validator rejects inconsistent source material.

---

# 2. Named chart profiles

## 2.1 Default profile — `ZHANG_ADVANCED_CLASS_LIFETIME`

```yaml
profileId: ZHANG_ADVANCED_CLASS_LIFETIME
profileStatus: DEFAULT_FROZEN
chartFamily: SHI_JIA_QIMEN
plate: ROTATING
juMethod: CHAI_BU
inputTime: BIRTH_TIME
chartPersistence: FIXED_NATAL

center5Policy:
  YANG_DUN:
    lodgePalace: GEN_8
    associatedDoor: SHENG
  YIN_DUN:
    lodgePalace: KUN_2
    associatedDoor: SI

luck:
  enabled: true
  model: EIGHT_PALACES_X_15_YEARS
  direction: CLOCKWISE
  start: BIRTH_YEAR_BRANCH_PALACE
  subperiodModel: FIVE_PLUS_FIVE_PLUS_FIVE

annual:
  stemPriority: PRIMARY
  branchPriority: SECONDARY
  stemLayer: TIAN_PAN_ACTIVE_STEM
  stemLayerAuthority: TRANSMISSION_CORROBORATED
```

The Tian-pan annual-stem locator is an **implementation default corroborated repeatedly by Zhang-line transmission cases**. Metadata MUST NOT label it as a universally explicit Zhang statement.

## 2.2 Compatibility profile — `ZHANG_SHENQI_GENERAL_NATAL_LEGACY`

```yaml
profileId: ZHANG_SHENQI_GENERAL_NATAL_LEGACY
profileStatus: RESEARCH_COMPATIBILITY_FROZEN
chartFamily: SHI_JIA_QIMEN
plate: ROTATING
inputTime: BIRTH_TIME

center5Policy:
  YANG_DUN:
    lodgePalace: KUN_2
  YIN_DUN:
    lodgePalace: KUN_2

annual:
  stemLayer: TIAN_PAN_ACTIVE_STEM
  stemLayerAuthority: TRANSMISSION_CORROBORATED
```

This profile exists to reproduce legacy/general natal examples such as the audited `《神奇之门》` Yang-Dun example with Center-5 lodged to Kun-2.

It MUST NOT be silently selected when the caller requested the Advanced-Class lifetime method.

## 2.3 Forbidden universalization

The following identifier or equivalent behavior is forbidden:

```text
ZHANG_UNIVERSAL_CENTER5_POLICY
```

Any fixture involving Center-5 MUST declare its profile explicitly.

---


# 3. Birth-time input contract

KM-MENH-1.0 exposes exactly **two user-facing birth-time states**.

```yaml
birthTimeMode:
  KNOWN:
    label: "Biết giờ sinh"
    requiresTimeInput: true
    readingMode: FULL

  UNKNOWN:
    label: "Không nhớ giờ sinh"
    requiresTimeInput: false
    readingMode: STABILITY_ANALYSIS
    autoSelectCorrectHour: false
    rectification: false
```

There is no `RANGE` mode in KM-MENH-1.0.

## 3.1 UI behavior

The birth-data form MUST present:

```text
Ngày sinh: [ date ]

Giờ sinh:  [ time ]
[ ] Không nhớ giờ sinh
```

Behavior:

```yaml
whenUnknownUnchecked:
  timeInput:
    enabled: true
    required: true
  birthTimeMode: KNOWN

whenUnknownChecked:
  timeInput:
    enabled: false
    required: false
    submittedValue: null
  birthTimeMode: UNKNOWN
```

The UI MUST NOT silently preserve and submit a previously entered time after the user checks `Không nhớ giờ sinh`.

If the checkbox is later unchecked, the UI MAY restore the locally entered value for convenience, but the request is `KNOWN` only when a valid time is actually submitted.

## 3.2 KNOWN mode

When `birthTimeMode = KNOWN`:

- one natal chart is constructed from the submitted date/time;
- full KM-MENH-1.0 domain reading is permitted;
- luck and annual overlays operate normally;
- the result MUST retain the exact input time and timezone in technical metadata.

## 3.3 UNKNOWN mode

When `birthTimeMode = UNKNOWN`, the engine MUST NOT:

- invent `12:00`, `00:00`, or any other default birth time;
- select one candidate as the true birth hour;
- use majority voting to produce a positive/negative destiny conclusion;
- claim to have rectified the birth time.

Instead it generates a deterministic candidate set covering all birth-hour possibilities for the stated civil date under the application's `23:00 changes Day Pillar` convention.

### Candidate coverage

The candidate set MUST cover the 12 traditional double-hour branches:

```text
ZI, CHOU, YIN, MAO, CHEN, SI, WU, WEI, SHEN, YOU, XU, HAI
```

Because the application's day boundary is **23:00**, Zi hour is special. A civil birth date can contain:

```text
00:00–00:59  -> early-Zi segment under the current Day Pillar
23:00–23:59  -> late-Zi segment after the Day Pillar boundary
```

If those two segments produce different natal identities, both MUST be represented. Therefore UNKNOWN mode normally has **12 double-hour families**, but may require **13 executable chart candidates** to preserve the 23:00 boundary correctly.

The implementation MUST NOT collapse the two Zi boundary variants when their Day Pillars differ.

## 3.4 Stability analysis

UNKNOWN mode produces a comparison result, not a normal single-chart reading.

Every rule/domain finding is classified as:

```yaml
STABLE:
  meaning: materially consistent across all applicable candidate families

TIME_SENSITIVE:
  meaning: changes across candidate charts and cannot be stated as a stable natal conclusion

UNRESOLVED:
  meaning: insufficient common evidence across candidates
```

The engine MUST compare **rule/evidence identity**, not count favorable vs unfavorable candidate charts.

Forbidden logic:

```text
8 of 12 candidates are favorable -> therefore favorable
```

Required logic:

```text
the same rule mechanism and compatible direction persist across all applicable candidates
-> STABLE
```

## 3.5 UNKNOWN-mode output contract

```yaml
UnknownBirthTimeReading:
  specVersion: KM-MENH-1.0
  birthTimeMode: UNKNOWN
  candidateFamilies:
  executableCandidateCount:
  dayBoundaryVariants:
  stableFindings: []
  timeSensitiveFindings: []
  unresolvedDomains: []
  autoSelectedBirthHour: null
```

A normal full-domain claim that is `TIME_SENSITIVE` MUST NOT be surfaced as a stable conclusion.

The UI SHOULD present UNKNOWN results in three sections:

```text
Ổn định dù không nhớ giờ sinh
Phụ thuộc giờ sinh
Chưa thể kết luận
```

## 3.6 Birth-time rectification

Birth-time rectification is **outside KM-MENH-1.0**.

```yaml
birthTimeRectification:
  enabled: false
  futureFeature: true
```

A future rectification feature may compare known life events against candidates, but it requires a separate specification/version and MUST NOT be implemented by reusing UNKNOWN-mode stability as proof of the true hour.

---

# 4. Canonical data types

The code may use different language-specific structures, but it MUST preserve these semantic fields.

## 4.1 Chart input

```yaml
NatalInput:
  birthDateLocal: ISO_DATE
  birthTimeMode: KNOWN | UNKNOWN
  birthTimeLocal: HH_MM | null
  timezone: IANA_TZ
  sexMetadata: OPTIONAL
  statedPillars:
    year:
    month:
    day:
    hour:
  profileId:
```

`sexMetadata` MUST NOT alter the 15-year luck direction.

## 4.2 Natal chart

```yaml
NatalChart:
  profileId:
  ju:
  dun: YANG | YIN
  pillars:
  palaces:
    KAN_1:
    GEN_8:
    ZHEN_3:
    XUN_4:
    LI_9:
    KUN_2:
    DUI_7:
    QIAN_6:
  center5:
  zhiFu:
  zhiShi:
  globalStructures: []
  immutableAfterConstruction: true
```

Annual/luck processing MUST create overlays. It MUST NOT mutate `NatalChart`.

## 4.3 Evidence object

```yaml
Evidence:
  evidenceId:
  ruleId:
  sourceTier:
  sourceRef:
  domain:
  palace:
  symbol:
  relation:
  effectTag:
  severity: INFO | LOW | MEDIUM | HIGH | HARD
  dedupeKey:
  provenance:
```

## 4.4 Claim object

```yaml
Claim:
  claimId:
  domain:
  claimType: NATAL_TENDENCY | PERIOD_ACTIVATION | OBSERVED_EVENT
  direction: SUPPORT | PRESSURE | MIXED | NEUTRAL | UNKNOWN
  evidenceIds: []
  ruleIds: []
  sourceTiers: []
  conditions: []
  certaintyLanguage: NON_DETERMINISTIC
```

The engine MUST NOT convert a `NATAL_TENDENCY` into an `OBSERVED_EVENT` unless observed real-world facts are supplied separately by the user.

---

# 5. Canonical stem resolvers

## 5.1 Five stem combinations

```yaml
JIA: JI
JI: JIA
YI: GENG
GENG: YI
BING: XIN
XIN: BING
DING: REN
REN: DING
WU: GUI
GUI: WU
```

Rule IDs:

```text
KMZ-MARR-002
KMZ-JIA-002
```

## 5.2 Six Jia hidden instruments

For a Jia pillar with known branch:

```yaml
JIA_ZI: WU
JIA_XU: JI
JIA_SHEN: GENG
JIA_WU: XIN
JIA_CHEN: REN
JIA_YIN: GUI
```

Function:

```text
resolvePillarStem(JIA, branch) -> hidden instrument
resolvePillarStem(non-JIA, branch) -> original stem
```

For an abstract paired stem of Jia where no branch exists:

```text
resolveAbstractStem(JIA) -> ZHI_FU_JIA_PROXY
```

The implementation MUST distinguish `pillar Jia` from `abstract Jia`.

Rule IDs:

```text
KMZ-JIA-001
KMZ-JIA-002
KMZ-YEAR-002
```

---

# 6. Branch → palace mapping

```yaml
ZI:   KAN_1
CHOU: GEN_8
YIN:  GEN_8
MAO:  ZHEN_3
CHEN: XUN_4
SI:   XUN_4
WU:   LI_9
WEI:  KUN_2
SHEN: KUN_2
YOU:  DUI_7
XU:   QIAN_6
HAI:  QIAN_6
```

Clockwise sequence:

```text
KAN_1
-> GEN_8
-> ZHEN_3
-> XUN_4
-> LI_9
-> KUN_2
-> DUI_7
-> QIAN_6
-> KAN_1
```

This same branch mapping is used for the birth-year luck start and annual Branch palace.

---

# 7. Self / lifetime core

## 7.1 Primary self

```text
SELF = BIRTH_DAY_STEM_PALACE
```

Rule:

```text
KMZ-SELF-001
```

## 7.2 Mandatory self bundle

The self baseline MUST calculate:

```text
1. verticalAnalyze(DayStemPalace)
2. compare(ZhiFuStar, SelfStar)
3. compare(ZhiShiDoor, SelfDoor)
4. compare(BirthHourStemPalace, DayStemPalace)
5. global Fu-Yin / Fan-Yin / source-backed severe structures
```

Rule IDs:

```text
KMZ-SELF-001
KMZ-SELF-002
KMZ-SELF-003
KMZ-GLOBAL-001
```

The Hour-Stem-to-Day-Stem relation is a general life-process baseline **in addition to** Hour Stem being the children significator.

## 7.3 Vertical analysis

Every significator palace MUST expose at least:

```yaml
palaceElement:
seasonStrength:
star:
door:
deity:
heavenStem:
earthStem:
stemPattern:
void:
tomb:
punishment:
doorPressure:
horse:
specialStructures: []
```

No single ordinary symbol may decide the domain by itself.

---

# 8. Evidence priority

## 8.1 In-chart priority

```text
1. GLOBAL_HARD_STRUCTURE
2. SELF_CORE
3. DOMAIN_PRIMARY
4. DOMAIN_CORROBORATORS
5. LUCK_PERIOD_BACKGROUND
6. ANNUAL_ACTIVATION
7. OPTIONAL_TRANSMISSION   [disabled by default]
```

`GLOBAL_HARD_STRUCTURE` is not an automatic negative veto. It requires a source-backed rule, an explicit severity, affected domains, and evidence IDs.

## 8.2 No vote counting

The engine MUST NOT decide by counting positive/negative symbols.

Evidence sharing the same mechanism or palace alias MUST be deduplicated by `dedupeKey`.

---

# 9. Family domain

## 9.1 Parents aggregate

```yaml
parents:
  aggregate: BIRTH_YEAR_STEM_PALACE
  fatherCorroborator: QIAN_6
  motherCorroborator: KUN_2
```

Rules:

```text
KMZ-PARENT-001
KMZ-PARENT-002
KMZ-PARENT-003
```

## 9.2 Parent sex stem pairing

Frozen as a **corroborator**, never as the sole resolver:

```yaml
ifYearStemYang:
  yearStemRole: FATHER
  fiveCombinationCounterpartRole: MOTHER

ifYearStemYin:
  yearStemRole: MOTHER
  fiveCombinationCounterpartRole: FATHER
```

This layer MUST NOT override:

```text
YEAR_STEM_PARENT_AGGREGATE
QIAN_FATHER
KUN_MOTHER
```

Rule:

```text
KMZ-PARENT-005
```

## 9.3 Geng in Qian/Kun

```yaml
GENG_IN_QIAN:
  target: FATHER_SIDE

GENG_IN_KUN:
  target: MOTHER_SIDE
```

This is `TRADITIONAL_STRONG_PATTERN`.

It may increase pressure/risk evidence but MUST NOT emit a certain death claim.

Rule:

```text
KMZ-PARENT-004
```

## 9.4 Children

```yaml
children:
  primary: BIRTH_HOUR_STEM_PALACE
  compareToSelf: true
```

Rule:

```text
KMZ-CHILD-001
```

Exact number, sex, infertility, death, or medical outcome is outside KM-MENH-1.0.

---

# 10. Marriage / spouse domain

Marriage is a mandatory multi-resolver bundle.

```yaml
marriage:
  self: DAY_STEM_PALACE
  familyContainer: XIU_MEN_PALACE
  unionSymbol: LIU_HE_PALACE
  dayStemPairedStem: FIVE_COMBINATION_COUNTERPART_OF_DAY_STEM

  traditionalPartnerSymbols:
    female: [YI, DING]
    male: [GENG, BING]

  solePrimaryAllowed: false
```

Required active evidence:

```text
DAY_STEM
XIU_MEN
LIU_HE
YI/GENG traditional partner axis
DAY_STEM_FIVE_COMBINATION_COUNTERPART
```

Rules:

```text
KMZ-MARR-001
KMZ-MARR-002
KMZ-MARR-003
```

For an already-known spouse, the Day-Stem paired stem may gain contextual relevance, but Yi/Geng MUST remain active.

Traditional inner/outer early/late marriage semantics may be returned only as `traditional_timing_tendency`, never as an exact marriage age.

Number of marriages from palace numbers is forbidden.

---

# 11. Career / profession

```yaml
career:
  vocationNature:
    primary: STAR_IN_DAY_STEM_PALACE
    secondary: DOOR_IN_DAY_STEM_PALACE

  institutionOpportunity:
    primary: KAI_MEN_PALACE
    compareTo: DAY_STEM_PALACE

  obstructionCorroborator:
    DU_MEN_PALACE

  developmentDirections:
    - KAI_MEN
    - XIU_MEN
    - SHENG_MEN
```

Rules:

```text
KMZ-CAREER-001
KMZ-CAREER-002
KMZ-CAREER-003
```

Five-element relation semantics MUST stay descriptive:

```text
KAI generates SELF -> institution/opportunity supports self
KAI same SELF       -> alignment
SELF generates KAI -> sustained input/cost into career
KAI controls SELF   -> institutional pressure/conflict
SELF controls KAI   -> agency/control/disengagement; context required
```

No numeric career-success score is allowed.

---

# 12. Wealth

```yaml
wealth:
  primary: SHENG_MEN_PALACE
  compareTo: DAY_STEM_PALACE
  capitalCorroborator: WU_OR_JIA_ZI_WU
  wealthStar: STAR_OCCUPYING_SHENG_MEN_PALACE
```

Rules:

```text
KMZ-WEALTH-001
KMZ-WEALTH-002
KMZ-WEALTH-003
```

Relation semantics:

```text
SHENG generates SELF -> resource/wealth structure supports self
SHENG same SELF      -> aligned/easier access
SELF generates SHENG -> greater personal input/cost
SHENG controls SELF  -> financial/resource pressure
SELF controls SHENG  -> context-dependent; no forced good/bad verdict
```

## 12.1 Inner/outer plate

```yaml
YANG_DUN:
  inner: [KAN_1, GEN_8, ZHEN_3, XUN_4]
  outer: [LI_9, KUN_2, DUI_7, QIAN_6]

YIN_DUN:
  inner: [LI_9, KUN_2, DUI_7, QIAN_6]
  outer: [KAN_1, GEN_8, ZHEN_3, XUN_4]
```

Wealth/development semantics:

```yaml
SHENG_OUTER_SELF_INNER:
  tendency: DEVELOPMENT_AWAY_FROM_ORIGIN

SELF_OUTER_SHENG_INNER:
  tendency: ANCESTRAL_LOCAL_ASSETS_HARDER_TO_RETAIN

BOTH_INNER:
  tendency: LOCAL_OR_ANCESTRAL_BASE_MORE_SUPPORTIVE

BOTH_OUTER:
  tendency: DEVELOPMENT_OR_ENTERPRISE_AWAY_FROM_ORIGIN
```

These are tendencies only.

---

# 13. 15-year Great-Luck engine

This engine is frozen for `ZHANG_ADVANCED_CLASS_LIFETIME`.

## 13.1 Period construction

```text
startPalace = branchToPalace(birthYearBranch)

period 1: ages   1–15
period 2: ages  16–30
period 3: ages  31–45
period 4: ages  46–60
period 5: ages  61–75
period 6: ages  76–90
period 7: ages  91–105
period 8: ages 106–120
```

Palaces always advance clockwise.

Rules:

```text
KMZ-LUCK-001
KMZ-LUCK-002
KMZ-LUCK-003
```

## 13.2 5+5+5

Within every 15-year period:

```yaml
years_1_to_5:
  dominantEmphasis: NINE_STAR

years_6_to_10:
  dominantEmphasis: EIGHT_DOOR

years_11_to_15:
  dominantEmphasis: TEN_STEM_KE_YING_AND_PALACE_STATE
```

The whole 15-year palace remains the background for all 15 years.

Rule:

```text
KMZ-LUCK-004
```

## 13.3 Age-boundary invariant

Boundary behavior MUST be:

```text
age 5  -> first five-year layer
age 6  -> second layer
age 10 -> second layer
age 11 -> third layer
age 15 -> third layer
age 16 -> next 15-year palace, first layer
```

---

# 14. Annual-year overlay

## 14.1 Fixed natal chart

Annual processing MUST NOT rebuild or mutate the natal chart.

## 14.2 Stem and branch

```yaml
annualStem:
  role: PRIMARY

annualBranch:
  role: SECONDARY
  palace: branchToPalace(annualBranch)
```

If annual stem is Jia, resolve using the Six-Jia hidden instrument.

Rules:

```text
KMZ-YEAR-001
KMZ-YEAR-002
KMZ-YEAR-003
```

## 14.3 Stem layer

```yaml
annualStemLayer:
  default: TIAN_PAN_ACTIVE_STEM
  freezeStatus: IMPLEMENTATION_DEFAULT
  authority: TRANSMISSION_CORROBORATED
  universalZhangDoctrine: false
```

The output/debug trace SHOULD preserve:

```yaml
annualStemLayerUsed:
annualStemLayerAuthority:
```

## 14.4 Evaluation order

```text
1. resolve annual stem;
2. locate the resolved stem on the Tian pan of the fixed natal chart;
3. analyze that natal palace vertically;
4. locate annual Branch palace;
5. compare annual Stem palace ↔ annual Branch palace;
6. compare both ↔ natal Day-Stem palace;
7. overlay current 15-year luck palace;
8. apply supported Void/Clash/Horse/FuYin/FanYin modifiers;
9. synthesize by domain.
```

15-year luck is the **background phase**. Annual stem/branch is the **year activation**.

---

# 15. Global structures

Rule:

```text
KMZ-GLOBAL-001
```

A global hard structure may cap or dominate a superficially favorable local domain only when:

```yaml
ruleSourceBacked: true
severity: HIGH_OR_HARD
affectedDomains: EXPLICIT
evidenceIds: NON_EMPTY
```

Required behavior:

```text
favorable local symbol != automatic cancellation of severe global/self structure
severe-looking symbol != automatic bad-fate veto
```

---

# 16. Output contract

Every reading MUST expose or retain internally:

```yaml
reading:
  specVersion: KM-MENH-1.0
  profileId:
  natalChartId:
  natalChartImmutable: true

  self:
    claims: []
    evidence: []

  domains:
    parents:
    marriage:
    children:
