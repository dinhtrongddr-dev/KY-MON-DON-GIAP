# KM-STRUCTURE-2.0

Date: 2026-09-21
Status: upgrade branch implementation
Scope: event-reading structure layer. Board construction remains frozen and unchanged.

## Goal

Add a deterministic structure layer between Useful-God selection and AI writing. The layer answers four separate questions:

1. Which of the four-harm conditions actually affects the role being read?
2. What is the exact Door-versus-Palace elemental direction?
3. Which Heaven-Stem / Earth-Stem response applies to that role?
4. Does a bounded classical structure strengthen, weaken, or merely qualify the reading?

A structure is a symbolic condition. It is not an observed real-world event and its internal weight is not a probability.

## Profile

Profile id: `CLASSIC_ROTATING_STANDARD`.

This profile is designed for the app's existing Thoi-Gia rotating-board method. It does not merge Flying-Pan, Yin-Pan or other school-specific corpora into the default engine.

## Ten-Stem response corpus

The engine contains all 81 visible combinations of the Three Wonders and Six Registers on the Heaven/Earth plates. Jia remains hidden by the normal Dun-Jia rule and is not added as a tenth visible row.

Each pair stores:

- heaven stem,
- earth stem,
- classical audit name,
- bounded tone,
- internal relevance weight,
- its own modern `plainMeaning`,
- source provenance.

All 81 pairs have distinct modern meanings; the engine does not reduce the corpus to one generic “good/bad” sentence.

Classical names remain available for audit. The writer receives `plainMeaning` rather than the old names by default.
## Four harms and role attribution

The structure layer keeps these conditions separate:

- Void: palace-level condition affecting active roles in that palace.
- Door pressure: the selected profile's door-controls-palace condition.
- Six-Register punishment: attached to the exact Heaven Stem and therefore only to roles represented by that stem.
- Three-Wonder tomb: attached to the exact Heaven Stem and therefore only to roles represented by that stem.

Main and carried stems are evaluated independently. A tomb or punishment on a carried stem is not attributed to another role in the same palace.

## Door / Palace direction

Classical and modern references do not use the labels `门迫` and `宫迫` consistently. Therefore the engine stores the elemental direction first:

- `door_controls_palace`
- `palace_controls_door`
- `neutral`

Labels are presentation metadata only. No rule is allowed to reverse its logic because a source uses a different name.

## Priority rule

Structures only change interpretation priority when they are connected to a role being read.

- A severe adverse response on a primary Useful God becomes a `primary_structure_condition`.
- An adverse response on a supporting role becomes only a `supporting_structure_condition`.
- Favorable responses may support a stage only when the response belongs to a role relevant to that stage.
- Favorable structures cannot erase a direct Void, punishment, tomb, Door/Palace obstruction or other explicit limiting condition.

The resulting weights rank attention; they do not estimate success probability.
## Bounded classical pattern families

KM-STRUCTURE-2.0 currently detects a bounded set of high-value structures:

- Green Dragon Returns / 戊丙.
- Flying Bird Falls Into Nest / 丙戊.
- Green Dragon Escapes / 乙辛.
- White Tiger Rages / 辛乙.
- Vermilion Bird Falls Into River / 丁癸.
- Soaring Snake Twists / 癸丁.
- Geng-related structures including Great Structure, Punishment Structure, Hidden-Palace Structure and Flying-Palace Structure.
- Three Wonders Gain Use, with blemished combinations downgraded unless the profile's qualifying condition is met.
- Jade Woman Guards Door.
- Tian Dun, Di Dun and Ren Dun under the declared conditions already used by this app.

These patterns are stored as conditions and modern meanings. A named pattern elsewhere on the board does not automatically override the selected Useful God.

## Sources and provenance

Primary / classical-text references used to bound the implementation:

- Ten-Stem response chapter, Qimen Dunjia Secret Compendium:
  https://www.shidianguji.com/book/SDZJ0630/chapter/1lx9g1urkiyp2
- Cross-check table of the 81 combinations:
  https://fengshui678.com/show/106.html
- Dun Jia Yan Yi, volume 2:
  https://zh.wikisource.org/wiki/遁甲演義_(四庫全書本)/卷2
- Qimen Dunjia Baojian / related classical pattern text:
  https://ctext.org/wiki.pl?chapter=665347&if=gb&remap=gb
- Qimen Fa Qiao, Door/Palace pressure discussion:
  https://shuyuan.zhiming.life/read/奇门法窍/4

The sources document traditional symbolic rules. They do not provide empirical validation of divination accuracy.
## Writer and UI policy

The technical/audit data retains pair IDs and classical provenance. The normal AI writer receives:

- pair,
- tone,
- role linkage,
- modern plain meaning,
- whether the stem is carried,
- Door/Palace direction,
- applicable structure conditions.

The default explanation should not dump code labels or archaic pattern names. The user-facing text should describe the practical condition first.

## Explicit non-goals

This phase does not yet implement the complete corpora for:

- Eight-Door response formulas,
- Nine-Star time-response formulas,
- all Three-Wonders-to-palace formulas,
- all Three Deceptions / Five Fakes / Nine Escapes,
- school-specific alternative names as independent logic,
- date prediction from a Ten-Stem response by itself.

## Regression coverage

`tests/structure-v2.test.mjs` verifies:

- exactly 81 visible stem responses,
- canonical favorable/adverse pair fixtures,
- explicit Door-controls-Palace versus Palace-controls-Door direction,
- actor-specific Four-Harm attribution including carried stems,
- severe adverse response on a primary Useful God becoming a primary structure condition,
- writer exposure of modern meanings without archaic response names,
- favorable structure support not erasing direct limiting evidence,
- Tian/Di/Ren Dun, Jade Woman Guards Door and qualified/unqualified Three-Wonders Gain-Use fixtures.

The frozen 480-board hash must remain unchanged because this phase belongs to the analysis layer, not board construction.
