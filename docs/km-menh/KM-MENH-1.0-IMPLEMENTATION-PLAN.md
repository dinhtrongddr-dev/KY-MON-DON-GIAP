# KM-MENH-1.0 — Implementation Plan

**Status:** IMPLEMENTATION PLAN FROZEN — runtime code not started  
**Date:** 2026-09-18  
**Target repo:** `dinhtrongddr-dev/KY-MON-DON-GIAP`  
**Target branch baseline inspected:** `develop` @ `e214379cd93b91b757a12271398718005f39f509`  
**Observed package version:** `17.2.4`  
**Normative inputs:**
- `KM-MENH-1.0-SPEC.md`
- `KM-MENH-1.0-GOLDEN-FIXTURES.yaml`
- `KM-MENH-1.0-IMPLEMENTATION-MAP.yaml`

> This plan is the bridge between the frozen research contract and app code. It deliberately does **not** change the application.

---

## 1. Non-negotiable repository constraints

### 1.1 Frozen Qimen core is read-only

The current release verifier hash-locks:

```text
dist/qimen.mjs
dist/vendor/lunar.js
dist/qimen/core/*
```

and verifies the independent **480-board baseline**.

KM-MENH-1.0 implementation MUST NOT modify those files or add files under `dist/qimen/core/`.

This is a hard architectural invariant, not a preference.

### 1.2 Existing question-reading pipeline remains separate

The current app's deterministic flow is built around:

```text
Qimen chart
-> QuestionContext
-> actor/useful-god mapping
-> evidence bundles
-> event stages
-> primary judgment
-> AI writer
```

The existing six modes under `dist/qimen/modes/` are **question-chart interpretation modes**.

KM-MENH MUST NOT be registered as a seventh mode in `dist/qimen/modes/index.mjs`.

Reason: lifetime/natal analysis has different input identity, chart profile, evidence registry, 15-year luck, annual overlay and output semantics.

### 1.3 No runtime dependency is added

`package.json` currently has no runtime dependencies and `verify-release.mjs` enforces that boundary.

The frozen YAML is a research artifact. Runtime/tests MUST NOT add a YAML package.

A compiled JSON representation will be generated from the frozen YAML before implementation and checksum-linked to it.

---

# 2. Target architecture

KM-MENH is a **parallel deterministic feature pipeline**, sharing only stable primitives from the existing app.

```text
birth input
   |
   v
frozen TG-ROTATING-2.0 chart -------------------+
   |                                             |
   v                                             |
KM-MENH natal adapter/profile                    |
   |                                             |
   +--> self/family/marriage/career/wealth       |
   +--> 15-year luck overlay                     |
   +--> annual overlay                           |
   +--> evidence + precedence                    |
   +--> claims + audit                           |
   |                                             |
   v                                             |
KM-MENH deterministic result                     |
   |                                             |
   +--> optional AI writer later                 |
   +--> UI later                                 |
                                                 |
existing question-chart pipeline remains --------+
unchanged
```

The **base chart object is never mutated**.

---

# 3. Proposed file layout

No file below exists yet; these are the planned implementation boundaries.

```text
dist/
  menh-core.mjs                       # public deterministic entry point

  qimen/
    menh/
      version.mjs                     # KM-MENH-1.0 constants / protocol-independent version
      profiles.mjs                    # named construction profiles only
      resolvers.mjs                   # five combinations, Jia hidden instruments, branch mapping
      source-validation.mjs           # fixture/source consistency checks
      natal-adapter.mjs               # immutable lifetime view over frozen base board
      relations.mjs                   # thin reuse/wrapper around existing element relations
      luck.mjs                        # 8 palaces x 15 years + 5+5+5
      overlay.mjs                     # immutable overlay helpers
      annual.mjs                      # annual stem/branch resolver
      evidence.mjs                    # Evidence objects + dedupe
      synthesis.mjs                   # precedence / global-hard handling
      schema.mjs                      # NatalChart / Evidence / Claim / result validators
      audit.mjs                       # output guards, traceability, forbidden claims

      domains/
        family.mjs
        marriage.mjs
        career.mjs
        wealth.mjs
        children.mjs

tests/
  fixtures/
    km-menh-1.0-golden.json           # compiled, checksum-linked mirror of frozen YAML
    km-menh-source-boards/            # curated board snapshots; no invented missing data

  menh-fixture-contract.test.mjs
  menh-source-validation.test.mjs
  menh-profile.test.mjs
  menh-resolvers.test.mjs
  menh-luck.test.mjs
  menh-evidence.test.mjs
  menh-family.test.mjs
  menh-marriage.test.mjs
  menh-career.test.mjs
  menh-wealth.test.mjs
  menh-annual.test.mjs
  menh-guardrails.test.mjs
  menh-integration.test.mjs

docs/
  km-menh/
    KM-MENH-1.0-SPEC.md
    KM-MENH-1.0-GOLDEN-FIXTURES.yaml
    KM-MENH-1.0-IMPLEMENTATION-PLAN.md
    KM-MENH-1.0-IMPLEMENTATION-MAP.yaml
```

Later, after deterministic release gate passes:

```text
local/
  menh-reading.mjs                    # shared server/browser request contract

dist/qimen/menh/ai/
  writer-context.mjs
  prompts.mjs
  reading-audit.mjs

UI files:
  separate Mệnh input/result surface
```

---

# 4. Construction strategy

## 4.1 Reuse the frozen core; never patch it

The existing protected `createQimenBoard()` / TG-ROTATING-2.0 output is the base input.

`natal-adapter.mjs` must deep-copy/freeze its own lifetime view.

```text
baseBoard = createQimenBoard(...)
natalView = createNatalView(baseBoard, profileId)
```

`baseBoard` must remain byte/structure-equivalent before and after every KM-MENH call.

This is tested explicitly.

## 4.2 Center-5 is a named-profile transformation

A critical implementation rule:

```text
DO NOT change TG-ROTATING-2.0.
DO NOT make a global Center-5 setting.
DO NOT infer the profile from the chart.
```

`profiles.mjs` owns:

```yaml
ZHANG_ADVANCED_CLASS_LIFETIME:
  Yang: GEN_8 / SHENG
  Yin: KUN_2 / SI

ZHANG_SHENQI_GENERAL_NATAL_LEGACY:
  Yang: KUN_2
  Yin: KUN_2
```

### Center-5 implementation gate

The first implementation must prove whether the frozen source fixtures require:

1. only a **lifetime semantic lodging view**, or
2. actual relocation of Tian-Qin / lodged stem / associated symbols inside the derived natal view.

The code MUST NOT guess.

The derived view is allowed to differ from the base chart, but only inside KM-MENH and only when the selected named profile demands it.

If a fixture requires a transformation not specified by the frozen source evidence, implementation stops and the spec is amended/versioned before proceeding.

---

# 5. Fixture compilation gate — before runtime implementation

The frozen YAML contains the correct normative expectations, but not every source fixture is a complete E2E birth-input fixture.

Before runtime code:

Each of the **41 fixtures** must be compiled into one of four executable classes:

```text
FUNCTION
  pure deterministic function/vector
  e.g. stem combinations, branch mapping, luck boundary

BOARD_SNAPSHOT
  source-backed natal board/partial board snapshot
  tests interpretation against known source placements
  no invented missing birth/chart data

OUTPUT_GUARD
  validator contract

SOURCE_REJECT
  intentionally inconsistent source; must be rejected
```

The mapping is frozen in:

```text
KM-MENH-1.0-IMPLEMENTATION-MAP.yaml
```

### Compilation rules

- No missing source field may be filled from guesswork.
- A `BOARD_SNAPSHOT` may contain only the subset required by that fixture.
- Source provenance and profile/scope are serialized.
- LWF annual-layer fixtures remain `ANNUAL_LAYER_RESOLVER_ONLY`; they do not assert a whole-chart Advanced-Class profile.
- Z19 remains a rejection fixture.
- S5 and LWF-02 are never normalized into the Advanced-Class Center-5 profile.

### Frozen-YAML checksum

The compiled JSON must store:

```yaml
sourceYamlSha256:
fixtureCount: 35
specVersion: KM-MENH-1.0
```

`menh-fixture-contract.test.mjs` fails if the JSON and frozen YAML identity diverge.

No YAML runtime dependency is required.

---

# 6. Implementation phases

## P0 — Branch and documentation lock

Create a dedicated feature branch from the inspected `develop` head.

Recommended branch:

```text
codex/km-menh-1.0
```

First commit contains documentation/fixture artifacts only.

**Gate:**
- existing `npm run check` passes;
- protected core hashes unchanged;
- no runtime behavior changed.

---

## P1 — Fixture compiler + source validation

Implement only the test-data layer and `source-validation.mjs`.

Covers:

```text
F-Z19-SOURCE-CONFLICT
and fixture contract / checksum
```

Outputs:

- compiled `km-menh-1.0-golden.json`;
- source-board snapshots;
- fixture ID uniqueness;
- 41/41 fixture presence;
- profile/scope metadata validation.

**Gate:** no Mệnh interpretation exists yet, but fixture corpus is executable without guessing.

---

## P2 — Profiles + canonical resolvers + natal adapter

Implement:

```text
version.mjs
profiles.mjs
resolvers.mjs
natal-adapter.mjs
schema.mjs (minimal chart schema)
```

Covers fixture groups:

- Center-5 Advanced Yang/Yin;
- S5 legacy;
- LWF-02 profile isolation;
- 5 stem combinations;
- Six Jia hidden instruments;
- abstract Jia proxy.

### P2 acceptance

- protected core unchanged;
- base board immutable;
- profile explicit in every natal result;
- cross-profile silent normalization rejected;
- no universal Center-5 function exported.

---


## P2A — Birth-time input contract

Before natal profile/domain logic, implement the two-state birth-time contract:

```text
KNOWN
UNKNOWN
```

UI/API semantics:

```text
KNOWN   -> explicit time required -> one natal candidate
UNKNOWN -> time must be null      -> candidate-set + stability analysis
```

UNKNOWN candidate generation must cover all 12 double-hour families and preserve the separate late-Zi `23:00` boundary candidate whenever it changes the Day Pillar. Therefore the executable candidate count is 12 or 13, never a hard-coded single chart.

No `RANGE` mode exists.

No default time, majority vote, or birth-time rectification is allowed.

Target modules:

```text
dist/qimen/menh/input.mjs
dist/qimen/menh/candidates.mjs
dist/qimen/menh/stability.mjs
```

Target tests:

```text
tests/menh-input.test.mjs
tests/menh-guardrails.test.mjs
```


## P3 — 15-year luck engine

Implement:

```text
luck.mjs
overlay.mjs
```

Covers:

- 12 branches → 8 palaces;
- clockwise sequence;
- Z16 from Si;
- WJG-21 from Hai;
- exact 5/6, 10/11, 15/16 boundaries.

Return shape:

```yaml
period:
  ageStart:
  ageEnd:
  palace:
  activeFiveYearLayer:
  natalBackgroundRef:
```

No Bazi 10-year cycle exists in this phase.

---

## P4 — Evidence core and precedence

Implement:

```text
evidence.mjs
synthesis.mjs
relations.mjs
```

Reuse the existing element-link semantics where compatible; do not duplicate a conflicting five-element engine.

Covers:

- Day Stem = self;
- Zhi Fu/Zhi Shi baseline;
- Hour Stem ↔ Day Stem baseline;
- evidence deduplication;
- global hard structure precedence.

### Evidence identity

Every evidence object requires:

```text
evidenceId
ruleId
sourceTier
domain
palace
effectTag
severity
dedupeKey
provenance
```

No raw positive/negative vote count.

---

## P5 — Domain resolvers

Implement domains independently so one cannot silently change another.

### Family

```text
Year Stem aggregate
Qian father
Kun mother
Yang/Yin parent pairing as corroborator
Geng Qian/Kun strong-pattern guard
Hour Stem children
```

### Marriage

Required multi-resolver:

```text
Day Stem
Rest Door
Liu He
Yi/Geng
Day-Stem five-combination counterpart
```

No universal sole spouse primary.

### Career

```text
Self Star/Door
Open Door vs self
Du Door corroborator
```

### Wealth

```text
Life Door vs self
Wu/Jia-Zi-Wu corroborator
inner/outer development semantics
```

Every domain returns **structured claims/evidence**, not final prose.

---

## P6 — Annual overlay

Implement:

```text
annual.mjs
overlay.mjs
```

Rules:

1. fixed natal view remains immutable;
2. annual Stem primary;
3. annual Branch secondary;
4. Jia annual stem resolves through Six Jia;
5. annual stem lookup defaults to `TIAN_PAN_ACTIVE_STEM`;
6. authority metadata retained.

Three LWF source fixtures discriminate Tian-pan from Earth-pan without asserting their whole chart profile.

### P6 gate

The same natal object hash before/after annual evaluation must be identical.

---

## P7 — Output contract / audit

Complete:

```text
schema.mjs
audit.mjs
```

Covers:

- `NATAL_TENDENCY != OBSERVED_EVENT`;
- prohibited exact/death/child/probability outputs;
- optional transmission disabled;
- every rendered/structured claim traceable to rule IDs + evidence IDs.

At this stage `KM-MENH-1.0` deterministic core is complete.

**Deterministic release gate: all 41 frozen fixtures pass.**

---

## P8 — Deterministic integration API

Only after P0–P7 are green.

Add `dist/menh-core.mjs` public API such as:

```js
createMenhNatal(input, options)
analyzeMenhNatal(natal, options)
applyMenhLuck(natal, age)
applyMenhAnnual(natal, year)
validateMenhResult(result)
```

No AI.

Add an end-to-end integration test ensuring the old question pipeline returns identical snapshots/results for existing fixtures.

---

## P9 — AI writer contract

Only after deterministic KM-MENH passes independently.

The AI receives a **prepared KM-MENH result**, never raw authority to rebuild the chart or override deterministic claims.

Use a separate contract:

```text
MENH_PROTOCOL = 1
MENH_RULE_VERSION = KM-MENH-1.0
```

Do not overload current:

```text
READING_PROTOCOL = 5
RULE_VERSION = TG-CB-6.2
```

Suggested server route later:

```text
POST /api/menh/read
```

The existing `/api/read` remains unchanged.

The writer is only allowed to:

- explain structured evidence;
- organize self/family/marriage/career/wealth;
- explain current 15-year period / annual overlay;
- state contradictions/conditions.

It cannot:

- invent a rule;
- promote optional transmission;
- state prohibited deterministic claims;
- alter `profileId`;
- alter evidence.

---

## P10 — UI

Only after deterministic + AI contracts are green.

Mệnh should be a separate feature surface, not a topic inside the question form.

Minimum input:

```text
Ngày sinh
Giờ sinh
[ ] Không nhớ giờ sinh
timezone
profile (default hidden/advanced metadata initially)
optional year/age to inspect
```

UI rules:

- unchecked `Không nhớ giờ sinh` -> time field enabled and required;
- checked -> time field disabled, request sends `birthTimeLocal:null`;
- UNKNOWN result uses stability sections instead of pretending there is one natal chart.

Minimum visible metadata:

```text
KM-MENH-1.0
profile used
birth pillars
Dun/Ju
current 15-year luck period if requested
annual stem layer metadata in technical trace
```

Recommended sections:

```text
Tổng thể
Gia đình
Hôn nhân
Sự nghiệp
Tài vận
Đại vận
Lưu niên
Căn cứ kỹ thuật
```

Do not display a destiny score or probability.

---

# 7. 41-fixture implementation coverage

The machine-readable 1:1 mapping is in `KM-MENH-1.0-IMPLEMENTATION-MAP.yaml`.

Coverage by phase:

```text
P1 source validation:       source-reject + fixture-contract checks
P2 profiles/resolvers:      construction/resolver fixtures
P2A birth-time contract:    4 input/candidate fixtures
P3 luck:                    luck fixtures
P4 evidence core:           evidence/precedence fixtures
P5 domains:                 family/marriage/career/wealth fixtures
P6 annual:                  annual fixtures
P7 output/guards:           output guards + 2 UNKNOWN stability/rectification guards
-----------------------------------------------
Frozen fixture total:      41
```

No frozen fixture is left without a target module and target test file.

---

# 8. Existing modules to reuse vs isolate

## Reuse safely

Read/import without modification where appropriate:

```text
dist/qimen/core/board.mjs          # protected adapter to frozen chart
dist/qimen/schemas/board.mjs       # validation/freeze concepts
dist/qimen/analysis/relationships.mjs
dist/reading-focus.mjs             # elementLink semantic primitive, if stable
```

Reusing does not mean KM-MENH adopts the question-chart role logic.

## Do not reuse semantically

Do not feed natal analysis through:

```text
dist/qimen/ai/questionContext.mjs
dist/qimen/analysis/usefulGod.mjs  # question-oriented registry
dist/qimen/modes/*
dist/qimen/ai/eventStages.mjs
dist/qimen/ai/outcomeDimensions.mjs
```

Those model a question/event, not a lifetime natal profile.

## AI infrastructure reusable later

The transport/security pattern can be reused:

```text
local/ai-client.mjs
local/server.mjs
```

but with a separate Mệnh request/response contract.

---

# 9. Release safety gates

Every implementation commit/PR must preserve:

```text
npm run check
npm run verify
npm run package:local
npm run verify:package
```

Additional KM-MENH gates:

1. 41/41 mandatory fixture contract present.
2. All mandatory fixtures pass.
3. Source-negative fixtures reject exactly as specified.
4. No protected core hash changes.
5. Existing 480-board baseline unchanged.
6. Existing question-reading tests unchanged and green.
7. No optional transmission affects default profile.
8. No cross-profile silent normalization.
9. Natal object immutable across luck/annual overlays.
10. Every claim has `ruleIds` + `evidenceIds`.
11. No prohibited deterministic outputs.
12. No new npm runtime dependency.

---

# 10. Commit sequence

Recommended implementation sequence on the feature branch:

```text
KM1 docs: add frozen KM-MENH contracts
KM2 tests: compile fixture corpus and source validation
KM3 core: add profiles, resolvers and immutable natal adapter
KM4 luck: add 15-year and 5+5+5 overlay
KM5 evidence: add self/evidence precedence and dedupe
KM6 domains: add family, marriage, career, wealth, children
KM7 annual: add Tian-pan annual overlay and Jia resolver integration
KM8 audit: add output contract and prohibited-claim guards
KM9 integration: add menh-core deterministic public entrypoint
KM10 bridge: add separate MENH_PROTOCOL API
KM11 writer: add evidence-bound Mệnh writer/audit
KM12 ui: add separate Kỳ Môn Mệnh surface
KM13 release: package, docs, full regression evidence
```

Each commit must remain revertible without changing protected TG-ROTATING-2.0 core.

---

# 11. Implementation stop conditions

Stop implementation and return to spec/versioning if any of these occurs:

- a mandatory source fixture requires changing the protected Qimen core;
- a source fixture cannot be reproduced without inventing missing information;
- Advanced-Class and legacy profile data are forced into one chart;
- a new direct Zhang source contradicts a frozen core rule;
- the annual Tian-pan default fails a clean discriminator fixture;
- a rule needs optional transmission to make the default fixture pass;
- the deterministic result needs AI to decide a rule outcome.

A stop condition is a specification issue, not a reason to patch around the fixture.

---

# 12. Definition of done

## Deterministic KM-MENH-1.0 is done when

- protected core is untouched;
- all 41 frozen fixtures pass;
- existing app suite passes;
- 480-board baseline is unchanged;
- `KM-MENH-1.0` returns immutable structured results with traceability;
- optional transmission is off;
- no AI is required for a deterministic conclusion.

## Full app integration is done when

- a separate Mệnh input surface exists;
- browser/server recompute the same deterministic result;
- MENH protocol identity/fingerprints prevent stale/mismatched results;
- AI only verbalizes prepared deterministic evidence;
- local/VPS/package checks all pass;
- existing question/timing modes show no behavior change.

---

# 13. Immediate next executable step

After approval of this plan, the **first code change** should be only:

```text
P0 + P1:
1. create feature branch;
2. add frozen docs;
3. compile the 41-fixture YAML to checksum-linked JSON;
4. add fixture/source-validation tests;
5. run the existing full suite;
6. confirm protected core and 480-board baseline are unchanged.
```

Do **not** implement Center-5, luck, annual, domains, AI or UI in the first code change.

That gives a clean test gate before any Kỳ Môn Mệnh behavior enters the application.
