# KM-YINGQI-2.0

Date: 2026-09-20
Status: upgrade branch implementation
Scope: Event-reading timing layer only; frozen rotating-board core remains unchanged.

## Goal

Separate two questions that were previously mixed:

1. Is the chart rhythm relatively fast/near, slow/far, or mixed?
2. If the user supplied an explicit time horizon, is there a deterministic response trigger inside that horizon?

The engine still does not claim that a predicted real-world outcome must occur on a returned date.

## Pace layer

`timing.pace` uses only declared chart signals:

- Yang Dun inner plate: Kan 1, Gen 8, Zhen 3, Xun 4.
- Yin Dun inner plate: Li 9, Kun 2, Dui 7, Qian 6.
- Inner plate contributes a faster/nearer signal; outer plate contributes a slower/farther signal.
- Fan Yin contributes a faster/change signal.
- Fu Yin contributes a slower/repeating signal.
Pace is deliberately separate from dated candidates. It never fabricates a date and is not a probability.

## Dated trigger priority

When an explicit user horizon exists, the response scan uses the first applicable trigger family:

1. Void: fill the Void or clash the Void.
2. Horse: Horse branch arrives or is clashed.
3. Three-Wonder Tomb: tomb branch arrives or the tomb is clashed.

Current Three-Wonder tomb mapping:

- Yi -> Kun 2, tomb branch Wei.
- Bing -> Qian 6, tomb branch Xu.
- Ding -> Gen 8, tomb branch Chou.

The Yi correction replaces the previous erroneous Yi -> Qian 6 mapping.

## Source basis

Primary/source-text support for the tomb correction:

- Dun Jia Yan Yi, volume 2:
  https://zh.wikisource.org/wiki/遁甲演義_(四庫全書本)/卷2
- Qimen Fa Qiao, volume 2:
  https://ctext.org/wiki.pl?chapter=118328&if=gb

Secondary procedural reference for Ying-Qi pace/trigger sequencing:
- https://www.yjgov.com/30.html

The secondary reference is treated as a procedural convention, not as proof of empirical prediction accuracy.

## Explicit non-goals

KM-YINGQI-2.0 does not yet auto-date:

- punishment,
- Fu Yin / Fan Yin,
- stem/door response rules,
- tombs outside the Three Wonders,
- Geng-pattern timing,
- hour-level scans inferred from a day-level question,
- dates outside the horizon explicitly supplied by the user.

## Regression coverage

- `tests/audit.test.mjs` verifies Yi -> Kun 2, Bing -> Qian 6, Ding -> Gen 8.
- `tests/timing-engine-v2.test.mjs` verifies Tomb response dates, trigger priority, and that pace does not fabricate dates.
- `tests/reasoning-stages.test.mjs` verifies the existing Void case remains stable and exposes the v2 pace metadata.

The 480 frozen rotating-board hash is not changed because the board-construction core is untouched.
