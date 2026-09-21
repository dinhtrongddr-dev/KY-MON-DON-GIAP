# KM-TIMING-3.0

Date: 2026-09-21
Status: develop / Phase 13
Scope: Hỏi Việc timing/response layer. The frozen rotating-board core remains unchanged.

## Goal

KM-TIMING-3.0 supersedes KM-YINGQI-2.0 as the current bounded response-window engine.

The phase closes three explicit gaps from v2:

1. Kích Hình can participate in deterministic response-window selection when it is attached to the active role.
2. Nhập Mộ is no longer limited to the Three Wonders; the Six Registers use the same declared tomb profile.
3. A Six-Register hidden branch can use the classical clash/combine response rule when the relation is uniquely determined.

The engine still does not claim that a real-world outcome must occur on a returned date.

## Compatibility retained from KM-YINGQI-2.0

- An explicit user time horizon is required before dates are scanned.
- Void and Horse response behavior is retained.
- Three-Wonder Tomb behavior is retained.
- Inner/Outer plate remains a pace signal.
- Fan Yin remains a faster/reversing pace signal.
- Fu Yin remains a slower/repeating pace signal.
- Pace never fabricates a calendar date.
- Timing candidates are verification windows, not calibrated probabilities.

## Visible-stem tomb profile

The app now exposes tomb state for all nine visible Dun-Jia stems:

| Stem | Tomb branch | Palace |
| --- | --- | ---: |
| 乙 | 未 | Kun 2 |
| 丙 | 戌 | Qian 6 |
| 丁 | 丑 | Gen 8 |
| 戊 | 戌 | Qian 6 |
| 己 | 丑 | Gen 8 |
| 庚 | 丑 | Gen 8 |
| 辛 | 辰 | Xun 4 |
| 壬 | 辰 | Xun 4 |
| 癸 | 未 | Kun 2 |

Yi -> Kun 2 is intentionally retained from the app's existing Qimen Fa Qiao / Dun Jia Yan Yi profile rather than switching to a conflicting variant table.

The Six-Register extension is bounded by the same yin/yang Twelve-Life-Stage convention already declared in KM-STRENGTH-2.0. It is not a new empirical model.

## Six-Register hidden branches

For response rules that require the branch carried by a Six Register:

| Register | Hidden Jia branch |
| --- | --- |
| 戊 | 子 |
| 己 | 戌 |
| 庚 | 申 |
| 辛 | 午 |
| 壬 | 辰 |
| 癸 | 寅 |

These are the six Jia-hidden instrument correspondences already used by the Dun-Jia board convention.

## Kích Hình response

When an active role has a Six-Register Kích Hình state, the response target uses the hidden branch of that register and its Six Harmony branch.

Example implemented by regression:

- Wu instrument -> hidden Zi.
- Wu Kích Hình -> response target Chou, the Six Harmony of Zi.
- The scan returns the matching Chou day only if it lies inside the user's explicit horizon.

The returned day is a symbolic response/checking window, not a promise that the requested event happens that day.

## Hidden-branch clash/combine response

When there is no higher-priority direct trigger and an active Six-Register role has a uniquely readable branch relation:

- hidden branch is clashed by the palace branch -> use the hidden branch's Six Harmony branch as the response target;
- hidden branch combines with the palace branch -> use the hidden branch's clash branch as the response target.

If neither relation is present, this rule creates no date.

## Trigger precedence

The current app profile uses this deterministic priority:

1. Void release.
2. Kích Hình response.
3. Horse activation.
4. Tomb release.
5. Six-Register hidden-branch clash/combine response.

This order is an explicit app conflict-resolution profile. It prevents multiple symbolic families from becoming competing independent date votes.

## Deliberate non-implementation

KM-TIMING-3.0 does not auto-date:

- Fu Yin or Fan Yin by themselves;
- Star/Door generation-control wording when it does not identify one unique stem-branch target;
- Geng named-pattern timing by itself;
- hour-level response scans when the user's question only supplies a day/month-scale horizon;
- dates outside the user's explicit horizon.

The classical response text contains additional Star/Door wording, but this phase does not force it into one day without a deterministic single-target mapping.

## Formation and UI effect

The new tomb coverage also closes the old KM-FORMATION-3.0 limitation for Ji/Gui/Ren Five-Fake rows:

- non-Three-Wonder stems now have known tomb coverage;
- a Five-Fake row is no longer marked partial only because its stem is Ji, Gui or Ren;
- actual tomb, punishment and Door-pressure blockers still apply;
- the Attention UI can surface a Six-Register Tomb as a strong structural warning.

No Formation or UI marker becomes a probability or primary-judgment override.

## Source basis

Primary classical profile:

- Qimen Fa Qiao, response-period and clash/combine discussion:
  https://ctext.org/wiki.pl?chapter=118328&if=gb
- Qimen Fa Qiao, tomb discussion and statement that Heaven/Earth Six Registers entering tomb are judged with the Three Wonders:
  https://ctext.org/wiki.pl?chapter=118328&if=gb
- Dun Jia Yan Yi, volume 2, cross-check for the app's Three-Wonder tomb profile:
  https://zh.wikisource.org/wiki/遁甲演義_(四庫全書本)/卷2

These sources document a traditional symbolic system. They do not establish empirical predictive validity.

## Regression coverage

- `tests/timing-engine-v2.test.mjs` preserves v2 Void/Horse/Three-Wonder behavior under the v3 engine.
- `tests/timing-engine-v3.test.mjs` verifies Six-Register Tomb, Kích Hình, hidden-branch clash/combine, trigger precedence and Fu/Fan non-dating.
- `tests/audit.test.mjs` verifies tomb palaces for all nine visible stems.
- `tests/formation-v3.test.mjs` verifies complete tomb qualification for Ji/Gui/Ren and actual tomb blocking.
- `tests/attention-ui.test.mjs` keeps the presentation-only no-probability policy.

The protected 480-board hash remains unchanged because Phase 13 changes analysis/timing only, not board construction.
