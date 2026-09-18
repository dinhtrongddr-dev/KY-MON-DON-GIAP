# KY-MON-MENH-ZHANG-ZHICHUN — REFERENCE BACKTEST v0.3

**Status:** Research validation / freeze-decision candidate  
**Date:** 2026-09-18  
**Scope:** Kỳ Môn Mệnh / 奇门终身局 in the Zhang Zhichun teaching line  
**Input:** `KY-MON-MENH-ZHANG-ZHICHUN-SPEC-v0.2-candidate.md` + `BACKTEST-v0.2.md`  
**Purpose:** Test whether the candidate rules remain stable when the corpus is expanded beyond the direct-Zhang cases, while preserving source provenance.

> This report tests reproduction of a traditional divination corpus. It is not evidence that the system scientifically predicts personality, wealth, marriage, health, or future events.

---

## 1. Bottom line

The v0.2 architecture survives the expanded reference backtest.

After adding **8 new lifetime/natal charts** from Li Wanfu's `《奇门与四柱》` and retaining the already-audited Wang Jianguo cases as transmission controls, the corpus now contains:

- **DIRECT_ZHANG natal/lifetime:** 6 audited charts
  - 5 usable for rule reproduction
  - 1 `SOURCE_CONFLICT` fixture (Z19), excluded from golden scoring
- **DIRECT_ZHANG auxiliary, non-natal:** 3 question-time cases used only to validate significator conventions
- **TRANSMISSION — Wang Jianguo:** 2 lifetime charts
- **TRANSMISSION_ZHANG_LINE — Li Wanfu:** 8 newly audited lifetime charts
- **Du Xinhui:** auxiliary-only for this pass; no clean, continuously extractable birth-time lifetime case was admitted merely to increase sample size

Total natal/lifetime charts audited to date: **16**.  
Rule-scoreable natal/lifetime charts: **15**.

The expanded corpus produces **no new contradiction that invalidates the v0.2 core interpretation architecture**. It does, however, strengthen the need for profile-versioned chart construction and identifies several later-line extensions that must remain optional.

---

## 2. Provenance policy

### 2.1 DIRECT_ZHANG

A case is `DIRECT_ZHANG` only when the chart and reasoning are directly attributed to Zhang Zhichun in his book/course corpus.

Current main natal set:

| ID | Source | Status |
|---|---|---|
| Z16 | Advanced Class Example 16 | usable |
| Z17 | Advanced Class Example 17 | usable |
| Z18 | Advanced Class Example 18 | usable |
| Z19 | Advanced Class Example 19 | `SOURCE_CONFLICT`, not golden |
| S1 | `《神奇之门》` Ch.16 Example 1 | usable |
| S5 | `《神奇之门》` Ch.16 Example 5 | usable |

Auxiliary direct Zhang cases from `《神奇之门》` Examples 2–4 are **not counted as natal fixtures**, because they use question-time charts. They may validate significators but not natal chart-construction rules.

### 2.2 TRANSMISSION

A case is `TRANSMISSION` when it belongs to a documented Zhang-line teacher/student but is not Zhang's own reasoning.

Two sublabels are used:

- `TRANSMISSION_WJG` — Wang Jianguo, Advanced Class, fourth lecture.
- `TRANSMISSION_ZHANG_LINE_LWF` — Li Wanfu.

Zhang's foreword to Li Wanfu's `《奇门与四柱》` is unusually useful for provenance. Zhang explicitly describes Li's Qimen + Four Pillars lifetime work as an **initial exploration**, says the techniques should be tested in practice, and separately notes Li's use of branch three-combinations / three-meetings as a developed technique. Therefore Li's cases are excellent **compatibility tests**, but cannot silently become direct-Zhang doctrine.

---

## 3. Admission criteria for v0.3

A newly added main fixture had to contain:

1. birth-time / Four Pillars information;
2. a Qimen lifetime chart or sufficiently explicit lifetime-chart placement;
3. explicit author reasoning connecting symbols/palaces to life domains or period activation;
4. enough continuous text to identify which rule was actually used;
5. provenance that can be labeled honestly.

Cases were excluded from the main score if they were only question-time charts, isolated quotations, promotional summaries, incomplete OCR fragments, or lacked enough chart/reasoning continuity.

---

# 4. Eight new lifetime cases

## LWF-01 — Ming official Zhao, upper-status case

**Provenance:** `TRANSMISSION_ZHANG_LINE_LWF`  
**Source:** Li Wanfu, `《奇门与四柱》`, section “第五节 奇门遁甲与四柱分析结合运用”, example 1.  
**Pillars:** `壬辰 / 壬子 / 丁未 / 癸卯`, Yang Dun 4.

### Source mechanisms

Li starts from the Day Stem Ding palace, reads star/door/deity vertically, compares Zhi Fu / Zhi Shi with the person, uses Open Door for official career, Year-Life Ren as a major root/career cue, and activates the fixed natal chart with annual stems/branches.

Most importantly, before the reading he attributes a Tian-Qin lodging convention to Zhang:

- after Winter Solstice / Yang Dun, Tian Qin is associated with Gen-8 / Tian Ren;
- after Summer Solstice / Yin Dun, Tian Qin is associated with Kun-2 / Tian Rui.

### Reverse-test

| Mechanism | v0.2 | Result |
|---|---|---|
| Day Stem palace = self | `KMZ-SELF-001` | MATCH |
| Vertical self bundle | palace pipeline | MATCH |
| Zhi Fu / Zhi Shi baseline | `KMZ-SELF-002` | MATCH |
| Open Door = career/office | `KMZ-CAREER-002` | MATCH |
| Year Stem/Year-Life as root corroborator | self/family registry | MATCH |
| Annual stem + branch activate fixed natal chart | `KMZ-YEAR-001/003` | MATCH |
| Yang Tian-Qin follows Gen/Tian-Ren convention | Advanced-Class profile | SUPPORT, secondary attribution |
| Four-Pillars 10-year luck analysis | excluded from core | TRANSMISSION_EXTENSION |

**Finding:** reinforces the Advanced-Class Tian-Qin profile, but cannot by itself resolve the Center-5 conflict because the next Li case uses a different printed lodging policy.

---

## LWF-02 — Male, `戊戌 / 乙卯 / 癸卯 / 甲寅`

**Provenance:** `TRANSMISSION_ZHANG_LINE_LWF`  
**Chart:** Yang Dun 9; Tian Qin is Zhi Fu, printed as `落5宫寄2宫`.

### Reverse-test

| Mechanism | v0.2 | Result |
|---|---|---|
| Day Stem Gui = self core | `KMZ-SELF-001` | MATCH |
| Self palace with Zhi Fu + Zhi Shi | `KMZ-SELF-002` | MATCH |
| Open Door = official career | `KMZ-CAREER-002` | MATCH |
| 31–45 Gen, 46–60 Zhen | `KMZ-LUCK-001..003` | MATCH |
| Annual stem/branch overlay | `KMZ-YEAR-*` | MATCH |
| **Yang Center-5/Tian-Qin lodged Kun-2** | Advanced-Class Yang→Gen8 | PROFILE_CONFLICT |
| Bazi 10-year luck | excluded | TRANSMISSION_EXTENSION |

**Finding:** this is a second independent reason not to create a universal `ZHANG_CENTER5_RULE`. The same Zhang-line author can cite Yang Tian-Qin→Gen/Tian-Ren in one case and print `5寄2` in another. **Profile versioning must be frozen.**

---

## LWF-03 — Male, `辛卯 / 丁酉 / 壬戌 / 癸卯`

**Provenance:** `TRANSMISSION_ZHANG_LINE_LWF`  
**Chart:** Yin Dun 6.

### Reverse-test

| Mechanism | v0.2 | Result |
|---|---|---|
| Day Stem Ren = self | `KMZ-SELF-001` | MATCH |
| Year-Life Xin analyzed separately | self/root corroboration | MATCH |
| Open Door supports career | `KMZ-CAREER-002` | MATCH |
| Life Door relation to self | `KMZ-WEALTH-001` | MATCH |
| Self + Sheng both outer / development away from origin | `KMZ-WEALTH-003` | MATCH |
| Annual stem + annual branch activation | `KMZ-YEAR-*` | MATCH |
| Three-combination / three-meeting palace activation | not core | OPTIONAL_TRANSMISSION |

### Annual-layer evidence

This case is especially valuable because the natal chart is not Fu-Yin.

For `丁亥`, Li says **Ding falls in Zhen-3**. In the printed natal chart Ding is the **Heaven-plate stem in Zhen-3**, while the Earth-plate stem there is Xin. This is unambiguous evidence that this transmission uses the **Heaven plate for the annual stem locator**.

**Finding:** first clean non-FuYin support for `annualStemLayerDefault = TIAN_PAN_ACTIVE_STEM`.

---

## LWF-04 — Male, `丁丑 / 壬子 / 辛卯 / 辛卯`

**Provenance:** `TRANSMISSION_ZHANG_LINE_LWF`  
**Chart:** Yang Dun 4.

### Reverse-test

| Mechanism | v0.2 | Result |
|---|---|---|
| Day Stem Xin = self | `KMZ-SELF-001` | MATCH |
| Zhi Fu and self relation | `KMZ-SELF-002` | MATCH |
| Open Door = official career | `KMZ-CAREER-002` | MATCH |
| Year-Life stem as major life cue | root corroboration | MATCH |
| Five-combination pair remains active evidence | `KMZ-MARR-002/003` concept | SUPPORT |
| Annual activation on fixed natal chart | `KMZ-YEAR-*` | MATCH |
| Heaven-plate annual stem locator | candidate default | MATCH |
| Exact status/event timing from branch networks | not core | OPTIONAL_TRANSMISSION |

For a historical promotion year `丙辰`, Li places Bing in Li-9; the chart has Bing on the **Heaven plate** in Li-9, while the Earth stem is Gui. This independently reproduces the Heaven-plate annual-stem convention.

---

## LWF-05 — 1964 male, provincial-leader secretary

**Provenance:** `TRANSMISSION_ZHANG_LINE_LWF`  
**Birth:** 1964-08-19 19:40  
**Pillars:** `甲辰 / 壬申 / 庚子 / 丙戌`, Yin Dun 5.

### Reverse-test

| Mechanism | v0.2 | Result |
|---|---|---|
| Day Stem Geng = self | `KMZ-SELF-001` | MATCH |
| Zhi Fu with self = major baseline | `KMZ-SELF-002` | MATCH |
| Open Door supports official career | `KMZ-CAREER-002` | MATCH |
| Life Door vs self = wealth | `KMZ-WEALTH-001` | MATCH |
| Severe self/stem/opposition structure gets high weight | `KMZ-GLOBAL-001` | MATCH |
| Annual stem/branch triggers natal severe structure | `KMZ-YEAR-*` | MATCH |
| Exact accident month/day/hour | excluded from default | EXCLUDED / Ying-Qi-only |

**Finding:** strengthens the v0.2 rule that favorable career/wealth symbols do **not** erase a severe high-priority natal structure. At the same time, the case should not authorize deterministic accident predictions in the app.

---

## LWF-06 — Jiangnan mine owner

**Provenance:** `TRANSMISSION_ZHANG_LINE_LWF`  
**Birth:** 1950-10-04 about 05:00  
**Pillars:** `庚寅 / 乙酉 / 壬申 / 癸卯`, Yin Dun 1.

### Reverse-test

| Mechanism | v0.2 | Result |
|---|---|---|
| Day Stem Ren = self | `KMZ-SELF-001` | MATCH |
| Year Stem Geng = parents/root | `KMZ-PARENT-001` | MATCH |
| Life Door = profit/wealth | `KMZ-WEALTH-001` | MATCH |
| Wu = capital corroborator | `KMZ-WEALTH-002` | MATCH |
| Kai/Du/Sheng distinguish career domains | `KMZ-CAREER-002/003` | MATCH |
| Liu He = marriage/family | `KMZ-MARR-001` | MATCH |
| Yi-Geng partner axis remains active | `KMZ-MARR-003` | MATCH |
| Ren-Ding five-combination axis also used | `KMZ-MARR-002` | MATCH |
| Annual stem/branch overlay | `KMZ-YEAR-*` | MATCH |
| Numeric profit from palace number | prohibited | EXCLUDED |

**Finding — marriage resolver:** this case is unusually clean. Li explicitly says to inspect **Liu He**, then **Yi-Geng**, then **Ren-Ding**. It strongly supports v0.2's multi-resolver marriage design and argues against any one spouse symbol being universally primary.

---

## LWF-07 — Zhang, male, born 1989-12-11 16:00

**Provenance:** `TRANSMISSION_ZHANG_LINE_LWF`  
**Pillars:** `己巳 / 丙子 / 乙巳 / 甲申`, Yin Dun (OCR loses the Ju number).

### Reverse-test

| Mechanism | v0.2 | Result |
|---|---|---|
| Day Stem Yi self-palace vertical bundle | `KMZ-SELF-001` | MATCH |
| Void/Tomb/door/star must modify, not be counted mechanically | evidence synthesis | MATCH |
| Annual branch + stem trigger natal structure | `KMZ-YEAR-*` | MATCH |
| Severe-looking symbols are not automatically a global veto | `KMZ-GLOBAL-001` guard | MATCH |
| Day Stem's `禄/官禄之地` used as extra body proxy | absent from core | OPTIONAL_TRANSMISSION |
| Three-combination/three-meeting activation network | absent from core | OPTIONAL_TRANSMISSION |
| Exact injury date | excluded | EXCLUDED |

**Finding:** validates the “no raw bad-symbol vote counting” rule. It also exposes a genuine later-line extension: Li uses the Day Stem's `官禄/禄地` palace as an additional proxy for the native. This should **not** enter Zhang core v1 without direct evidence.

---

## LWF-08 — Female born 1986-08-04 22:00

**Provenance:** `TRANSMISSION_ZHANG_LINE_LWF`  
**Pillars:** `丙寅 / 乙未 / 庚辰 / 丁亥`, Yin Dun 7.

### Reverse-test

| Mechanism | v0.2 | Result |
|---|---|---|
| Day Stem Geng = self | `KMZ-SELF-001` | MATCH |
| Vertical self bundle | palace pipeline | MATCH |
| Open Door supports education/career | career bundle | MATCH |
| Year Stem as parent/father cue | parent registry | MATCH |
| Kun palace as mother corroborator | `KMZ-PARENT-003` | MATCH |
| Annual stem/branch activates fixed natal chart | `KMZ-YEAR-*` | MATCH |
| Heaven-plate annual stem locator | candidate default | MATCH |
| Deterministic parent-death timing | prohibited | EXCLUDED |

For `丙子`, Li locates annual Bing in Qian-6. In the printed natal chart Bing is the **Heaven-plate** stem in Qian-6 while the Earth stem is Ji. This is a third independent non-FuYin confirmation of the same annual-stem layer.

---

# 5. Cross-case findings

## 5.1 Architecture stability

Across the eight new charts, the following v0.2 mechanisms recur without contradiction:

- Day Stem as natal self core;
- vertical palace analysis;
- Zhi Fu / Zhi Shi relation as a baseline;
- Open Door for career / institution;
- Life Door for wealth / profit;
- Year-Life stem as family/root/life corroboration;
- fixed natal chart with annual activation;
- branch palace as a year-level trigger;
- multi-symbol marriage reading;
- contextual weighting of Void, Tomb, star/door/deity and stem patterns.

This is enough to treat these as **stable Zhang-line architecture**, not isolated case tricks.

## 5.2 Annual stem layer — major v0.3 delta

v0.2 left the Heaven-vs-Earth plate question open.

v0.3 adds at least three clean, non-FuYin transmission cases where the annual stem location can be disambiguated:

- LWF-03: `丁亥` → Ding at Zhen-3 = Heaven plate.
- LWF-04: `丙辰` → Bing at Li-9 = Heaven plate.
- LWF-08: `丙子` → Bing at Qian-6 = Heaven plate.

### Decision

```yaml
annualStemLayerDefault:
  value: TIAN_PAN_ACTIVE_STEM
  status: FREEZE_IMPLEMENTATION_DEFAULT
  sourceAuthority: TRANSMISSION_CORROBORATED
  claim: "default used by the Zhang-line compatibility profile"
  universalZhangDoctrine: false
```

This is now strong enough for a deterministic engine default. It must still carry provenance metadata because the directly audited Zhang natal corpus did not state the layer as explicitly.

## 5.3 Center-5 / Tian-Qin — profile split becomes mandatory

The expanded corpus produces both:

1. a secondary attribution from Li that Zhang taught Yang-Dun Tian Qin with Gen-8/Tian-Ren and Yin-Dun with Kun-2/Tian-Rui; and
2. Li's own Yang-Dun 9 chart with Tian Qin Zhi Fu printed `5寄2`.

Together with the already-known direct Zhang conflict (`Advanced Class` vs `《神奇之门》`), this makes one conclusion unavoidable:

```yaml
center5:
  universalPolicy: FORBIDDEN
  ADVANCED_CLASS_LIFETIME:
    yang: GEN_8
    yin: KUN_2
  SHENQI_GENERAL_NATAL_LEGACY:
    center5: KUN_2
  transmissionFixtures:
    mustDeclareProfile: true
```

### Decision

**FREEZE the profile split. Do not freeze a universal lodging rule.**

Exact Tian-Qin lodged-stem behavior must be tested **inside each profile**, never across profiles as if the charts were generated by one algorithm.

## 5.4 Parent-sex stem pairing — upgrade from optional

Direct Zhang's `《神奇之门》` auxiliary example explicitly treats a Yang Year Stem as father and its five-combination counterpart as mother. The new Li cases independently preserve Year Stem as parent/father evidence and Kun as mother evidence.

### Decision

Upgrade the v0.2 optional rule to:

```yaml
parentStemConvention:
  status: FREEZE_AS_CORROBORATOR
  ifYearStemYang:
    yearStemRole: FATHER
    pairedStemRole: MOTHER
  ifYearStemYin:
    yearStemRole: MOTHER
    pairedStemRole: FATHER

  neverOverrides:
    - YEAR_STEM_PARENT_AGGREGATE
    - QIAN_FATHER
    - KUN_MOTHER
```

It should not become the sole parent resolver.

## 5.5 Marriage resolver — freeze v2 bundle

The expanded cases support all of these simultaneously:

- Liu He = union/family;
- Yi/Geng remain active traditional partner symbols;
- Day Stem five-combination counterpart remains active;
- multiple marriage symbols can contradict each other and must be synthesized.

### Decision

```yaml
marriageResolver:
  status: FREEZE_CORE
  required:
    - DAY_STEM
    - XIU_MEN
    - LIU_HE
    - YI_GENG
    - DAY_STEM_FIVE_COMBINATION_COUNTERPART
  solePrimaryAllowed: false
```

`Yi/Geng` may remain hidden in normal UI if desired, but the engine should not remove it.

## 5.6 Three-combination / three-meeting networks

Li repeatedly uses `三合 / 三会 / 六合 / 六冲` across natal palaces to activate events and narrow timing. Zhang's foreword specifically describes this as part of Li's developed exploration.

### Decision

```yaml
branchNetworkActivation:
  status: OPTIONAL_TRANSMISSION
  defaultInKM_MENH_1_0: false
  possibleFutureProfile: ZHANG_LINE_LWF_EXTENDED
```

Do not merge it silently into Zhang core.

## 5.7 Day Stem `禄/官禄之地` as a second body proxy

Li uses the Day Stem's Twelve-Growth / Lu palace as a second place where damage to the native may manifest.

### Decision

`OPTIONAL_TRANSMISSION`.  
It is not sufficiently supported in the direct Zhang lifetime corpus to become core.

## 5.8 Bazi 10-year luck integrated with Qimen lifetime chart

Li deliberately combines Four-Pillars 10-year luck with Qimen lifetime analysis. Zhang's foreword presents this as exploratory work.

### Decision

Keep **outside** `KM-MENH-1.0` core.

It may later become:

```text
profile = ZHANG_LINE_LWF_QIMEN_BAZI_HYBRID
```

but it must not replace the direct Advanced-Class 15-year Qimen luck engine.

---

# 6. Freeze matrix after v0.3

## 6.1 FREEZE_CORE

| Rule | Decision |
|---|---|
| Birth-time Qimen natal chart is fixed | FREEZE |
| Day Stem = self | FREEZE |
| Vertical star/door/deity/stems/state analysis | FREEZE |
| Horizontal five-element relations | FREEZE |
| Zhi Fu / Zhi Shi vs self baseline | FREEZE |
| Hour Stem vs Day Stem general process baseline | FREEZE |
| Year Stem = parents aggregate / life-root corroboration | FREEZE |
| Qian = father corroborator | FREEZE |
| Kun = mother corroborator | FREEZE |
| Yang/Yin Year-Stem parent pairing | **FREEZE AS CORROBORATOR** |
| Geng in Qian/Kun strong traditional parent pattern | FREEZE with non-deterministic guard |
| Hour Stem = children | FREEZE |
| Open Door vs self = career/institution | FREEZE |
| Self star/door = vocation nature | FREEZE |
| Du Door = career/closure/specialization corroborator | FREEZE |
| Life Door vs self = wealth | FREEZE |
| Wu/Jia-Zi-Wu = capital corroborator | FREEZE |
| Sheng/Self inner-outer development semantics | FREEZE |
| Marriage = Rest + Liu He + Yi/Geng + Day paired stem | FREEZE |
| No universal sole spouse-primary | FREEZE |
| 8 palaces × 15 years | FREEZE |
| Luck starts at birth-year Branch palace | FREEZE |
| Luck proceeds clockwise | FREEZE |
| 5+5+5 star/door/stem emphasis | FREEZE |
| Annual Stem primary + Branch secondary | FREEZE |
| Jia-year hidden instrument resolver | FREEZE |
| Annual stem uses Tian-pan active stem | **FREEZE IMPLEMENTATION DEFAULT**, transmission-corroborated |
| Global hard-structure precedence | FREEZE |
| `NATAL_TENDENCY != OBSERVED_EVENT` | FREEZE |
| Center-5 must be profile-versioned | FREEZE |

## 6.2 FREEZE_PROFILE_SPECIFIC

| Rule | Profile |
|---|---|
| Yang Center-5 → Gen8 / Yin → Kun2 | `ADVANCED_CLASS_LIFETIME` |
| Center-5 → Kun2 | `SHENQI_GENERAL_NATAL_LEGACY` |
| 15-year Advanced-Class luck model | `ADVANCED_CLASS_LIFETIME` |
| Tian-pan annual-stem locator | default for Zhang-line compatibility profile; provenance flag retained |

## 6.3 OPTIONAL_TRANSMISSION

| Rule / extension | Status |
|---|---|
| Branch `三合/三会` network across palaces as event activator | OPTIONAL |
| Day-Stem `禄/官禄之地` as secondary body proxy | OPTIONAL |
| Bazi 10-year luck integration | OPTIONAL separate hybrid profile |
| Four-Pillars 用神 combined with Qimen synthesis | OPTIONAL separate hybrid profile |
| Hour Stem = final life outcome | Wang-line optional, not core |
| traditional sex × Yin/Yang Dun “顺/不顺” label | optional metadata only |
| exact month/day Ying-Qi via branch networks | separate future engine only |

## 6.4 EXCLUDED / REJECTED FROM DEFAULT

- universal unversioned Center-5 rule;
- five-combination spouse stem as universal sole primary;
- raw symbol vote-counting;
- exact number of marriages from palace numbers;
- exact number/sex of children;
- deterministic infertility claims;
- age-of-death / lifespan calculation;
- deterministic parent-death claims;
- deterministic severe disease or accident prediction;
- numeric wealth/profit derived directly from palace numbers;
- overall destiny score/probability;
- Bazi 10-year luck replacing the Zhang 15-year Qimen cycle.

---

# 7. What happened to Du Xinhui in this pass?

Du Xinhui remains relevant to the Zhang transmission line, but the accessible clean corpus found in this pass is dominated by **question-time application cases**, especially in `《奇门遁甲现代实例精解》`. Public copies of `《奇门遁甲预测学》` were located, but the accessible text layer did not expose a continuous birth-time lifetime section cleanly enough to admit specific natal fixtures.

Therefore:

```yaml
DU_XINHUI:
  provenance: TRANSMISSION
  v0.3Role: AUXILIARY_NO_SCORE
  reason: NO_CLEAN_NATAL_FIXTURE_EXTRACTED
```

This is an evidence-quality decision, not a claim that Du's corpus contains no lifetime method.

---

# 8. Corpus status after v0.3

```yaml
corpus:
  directZhangNatal:
    audited: 6
    goldenOrUsable: 5
    sourceConflict: 1

  directZhangAuxQuestionCharts:
    audited: 3
    natalScore: 0

  transmissionWangJianguoNatal:
    audited: 2

  transmissionLiWanfuNatal:
    auditedNewInV03: 8

  duXinhui:
    natalAdmitted: 0
    auxiliaryOnly: true

  totalNatalAudited: 16
  scoreableNatal: 15
```

This does **not** satisfy the old target of “10 clean DIRECT_ZHANG natal cases.” It does satisfy the newer goal agreed for v0.3: determine which rules are stable enough to freeze by combining direct-source authority with a clearly separated transmission validation set.

---

# 9. Freeze recommendation

## 9.1 Interpretation rules

**Ready to freeze as `KM-MENH-1.0` interpretation core.**

The core significator architecture, evidence priority, career/wealth/family/marriage rules, 15-year cycle, annual overlay and safety/output contract are now reproduced across direct Zhang and independent Zhang-line transmission cases.

## 9.2 Chart-construction layer

Freeze **named profiles**, not a universal Zhang chart.

Recommended profiles:

```yaml
KM_MENH_1_0:
  defaultProfile: ZHANG_ADVANCED_CLASS_LIFETIME

profiles:
  ZHANG_ADVANCED_CLASS_LIFETIME:
    plate: ROTATING
    juMethod: CHAI_BU
    center5Yang: GEN_8
    center5Yin: KUN_2
    annualStemLayer: TIAN_PAN_ACTIVE_STEM

  ZHANG_SHENQI_GENERAL_NATAL_LEGACY:
    center5: KUN_2
    annualStemLayer: TIAN_PAN_ACTIVE_STEM
```

The second profile should remain research/compatibility metadata unless the product needs to reproduce `《神奇之门》` legacy examples exactly.

## 9.3 `《开悟之门》` five cases

They should no longer block the v1 **rule freeze**.

When their page images/text become available, treat them as a **post-freeze regression corpus**. If they reveal a true direct-source contradiction, create `KM-MENH-1.1` or a new named construction profile rather than silently rewriting v1.

---

# 10. Required regression fixtures before coding

At minimum:

1. Advanced-Class Yang Center-5 → Gen8.
2. Advanced-Class Yin Center-5 → Kun2.
3. ShenQi Yang legacy Center-5 → Kun2.
4. Li Yang `5寄2` transmission fixture must not be compared under the Advanced-Class profile.
5. Annual Tian-pan discriminator fixture: LWF-03 `丁亥`.
6. Annual Tian-pan discriminator fixture: LWF-04 `丙辰`.
7. Annual Tian-pan discriminator fixture: LWF-08 `丙子`.
8. 15-year start from each branch-palace family.
9. WJG-21 Qian→Kan→Gen→Zhen→Xun 15-year sequence.
10. Parent Yang-Year-Stem paired-stem resolver.
11. Marriage bundle with Liu He + Yi/Geng + Day paired stem.
12. Wealth inner/outer combinations.
13. GLOBAL_HARD_STRUCTURE precedence.
14. Source-conflict rejection using Z19.
15. Validator rejects exact death age, exact child count and certainty claims.

---

# 11. Sources

### Direct Zhang

1. Zhang Zhichun, `《神奇之门》`, chapter “人生机遇预测”  
   https://www.zhaosir.online/Books/BookChapterDetail.aspx?did=1183

2. `《张志春奇门遁甲高级班笔记》` — Zhang lifetime lecture + Wang Jianguo transmission lecture  
   https://nhqhblog.tech/wp-content/uploads/2025/03/%E5%BC%A0%E5%BF%97%E6%98%A5%E5%A5%87%E9%97%A8%E9%81%81%E7%94%B2%E9%AB%98%E7%BA%A7%E7%8F%AD%E7%AC%94%E8%AE%B0-%E6%9F%AF%E6%98%93%E9%98%B3-%E6%95%B4%E7%90%86.pdf

### Li Wanfu — Zhang-line transmission

3. Li Wanfu, `《奇门与四柱》`, full searchable text  
   https://www.scribd.com/document/753567527/%E5%A5%87%E9%97%A8%E4%B8%8E%E5%9B%9B%E6%9F%B1-%E6%9D%8E%E4%B8%87%E7%A6%8F%E8%91%97

   Key source ranges used:
   - Zhang foreword: lines ~160–188
   - lifetime section starts: ~11922
   - LWF-01: ~11926–12023
   - LWF-02: ~12025–12090
   - LWF-03: ~12092–12127
   - LWF-04: ~12220–12258
   - LWF-05: ~12259–12319
   - LWF-06: ~12763–12827
   - LWF-07: ~12830–12917
   - LWF-08: ~12929–12987

4. Bibliographic / author provenance for Li Wanfu  
   https://book.douban.com/subject/5259516/

### Du Xinhui source discovery

5. `《奇门遁甲预测学》` bibliographic/public preview  
   https://www.cuwen.com/page/1227266.html

---

## 12. v0.3 final verdict

The evidence now supports a clean three-way separation:

```text
CORE_ZHANG
    = freeze

PROFILE_SPECIFIC_CONSTRUCTION
    = freeze by named profile

LATER_ZHANG_LINE_EXTENSIONS
    = optional, provenance-visible
```

The five inaccessible `《开悟之门》` lifetime cases are no longer a justified blocker for freezing the core rules. They remain valuable future regression tests.

**Recommended next artifact:** derive `KM-MENH-1.0` directly from this freeze matrix, with no app code changes until the implementation spec and regression fixtures are written.
