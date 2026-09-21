# KM-KEYING-3.0

Date: 2026-09-21
Status: develop upgrade
Profile: CLASSIC_KEYING_ROLE_BOUNDED
Scope: Thời Gia Kỳ Môn · Chuyển Bàn · Tháo Bổ

## 1. Goal

KM-KEYING-3.0 fills the remaining classical 克應/Khắc Ứng gap without turning each traditional corpus into another independent good/bad vote.

The layer adds:
- Eight-Door × Earth-Door responses;
- Eight-Door × Three-Wonders/Six-Instruments responses;
- Three-Wonders-to-palace responses;
- Door–Palace classical relation labels;
- the complete Nine-Star × twelve double-hour source index.

All Keying rows are conditions attached to the current deterministic palace/role. They are not probabilities, not empirical evidence and cannot override the current planner judgment.

## 2. Classical source basis

### Eight-Door Keying

`奇門遁甲秘笈大全` places `八門克應訣總目` in the classical corpus and treats Eight-Door Keying as combinations of Door×Door, Door×Three-Wonders/Six-Instruments and Door×Palace.

Primary/secondary source references:
- https://ctext.org/wiki.pl?chapter=772362&if=gb&remap=gb
- https://www.shidianguji.com/book/SDZJ0630
- https://www.qiankuntang.com/blogs/entry/18-%E5%A5%87%E9%97%A8%E9%81%81%E7%94%B2%E5%85%AB%E9%97%A8%E5%85%8B%E5%BA%94%EF%BC%88%E5%8A%A8%E5%BA%94%E9%9D%99%E5%BA%94%EF%BC%89/

The engine implements the static-response table as:
- 8 moving Doors × 8 Earth Doors = 64;
- 8 moving Doors × 9 visible Qimen stems = 72.

`甲` is not placed visibly as an ordinary rotating-board stem; the corpus row traditionally written against 甲/戊 is represented by the visible `戊` instrument in this engine profile.

### Three Wonders to Palace

`奇門遁甲秘笈大全·卷四·三奇到宮克應吉凶` lists Yi, Bing and Ding at every non-center palace.

Text reference:
- https://ctext.org/wiki.pl?chapter=772362&if=gb&remap=gb
- https://www.shidianguji.com/book/SDZJ0630/chapter/1lx9g1w8ky4nd

Coverage:
`3 wonders × 8 palaces = 24`.

The source contains concrete omen/event language. KM-KEYING-3.0 rewrites it into bounded modern conditions. It does not preserve literal death, guaranteed wealth, pregnancy, litigation or disaster predictions.

### Nine-Star hour Keying

`遁甲演義` contains twelve sections from `九星子時克應` through the remaining double-hours, covering Nine Stars by hour.

Source:
- https://zh.wikisource.org/zh-hant/%E9%81%81%E7%94%B2%E6%BC%94%E7%BE%A9

Coverage:
`9 stars × 12 branches = 108 source-index rows`.

The source is especially tied to traditional burial, travel and observed-omen language. Phase 9 deliberately marks every row:
`scope = classical_context_only`
`weight = 0`
`verdictEligible = false`

This means the corpus is fully indexed for audit and future research, but it is not translated into direct modern finance/relationship/health/event predictions in this release.

### Door–Palace relation

`御定奇門遁甲寶鑒` explicitly records:
- Door generates Palace → 和 / Hòa;
- Palace generates Door → 義 / Nghĩa.

It also documents Door/Palace controlling relations, but terminology such as `門迫` and `宮迫` varies across transmissions. `奇門法竅` is an example of the naming variation.

References:
- https://ctext.org/wiki.pl?chapter=250961&if=gb
- https://www.novel543.com/0517696400/8096_3_2.html
- https://ichingtrilogy.com/post/qi-men-fa-qiao-06/

Therefore KM-KEYING-3.0 stores the actual five-element direction first and treats the classical label as presentation metadata.

## 3. Door–Palace classes

The engine emits five classes:
- same element → `Tỷ hòa`;
- Door generates Palace → `Hòa`;
- Palace generates Door → `Nghĩa`;
- Door controls Palace → directional code `door_controls_palace`, displayed as `Bức/迫` reference label;
- Palace controls Door → directional code `palace_controls_door`, displayed as `Chế/制` reference label.

No downstream rule is allowed to infer element direction from the label alone.

## 4. Earth-Door mapping

For Door×Door responses, the Earth-door baseline follows the fixed home-palace mapping of the Eight Doors:
- Kan 1 → Rest;
- Kun 2 → Death;
- Zhen 3 → Harm;
- Xun 4 → Block;
- Qian 6 → Open;
- Dui 7 → Fear;
- Gen 8 → Life;
- Li 9 → View.

Center 5 has no independent Eight-Door position in this rotating profile.

## 5. Role attachment

Keying is evaluated after Useful-God/role resolution.

Door×Door and Door–Palace describe the active palace environment and can condition roles already resolved to that palace.

Door×Stem and Three-Wonder-to-palace rows are promoted only when the relevant heaven stem is actually the representative stem of an active role in that palace.

Carried stems remain distinct. A carried stem can receive its own Keying row only for the role represented by that carried stem.

Nine-Star-hour rows may be attached for audit context, but their weight remains zero in Phase 9.

## 6. No independent voting

One palace can simultaneously have:
- an Eight-Door response;
- a Door×Stem response;
- a Three-Wonder-to-palace response;
- a Ten-Stem response;
- a Four-Harm condition;
- a seasonal Strength state.

These are not six independent witnesses.

KM-KEYING-3.0 therefore does not add a Keying score to evidence ranking. `evidenceScore` and `primaryJudgment` remain unchanged by Phase 9.

The Keying rows explain or condition an already-selected evidence bundle.

## 7. Writer contract

The writer receives:
- modern `plainMeaning`;
- tone labels where useful for explanation;
- role attachment;
- Door–Palace direction/class label;
- Nine-Star-hour `classical_context_only` scope.

The writer does not receive:
- source text quotations;
- source URL/provenance inside ordinary prose;
- internal Keying weight;
- `verdictEligible` flags;
- any permission to recompute the planner judgment.

The writer must never translate a classical burial/travel omen into a modern claim that money, illness, marriage, death, litigation or disaster will occur.

## 8. UI contract

The technical Qimen panel may show a compact `KM-KEYING-3.0` line for relevant palaces:
- Door×Door;
- Door–Palace class;
- role-attached Door×Stem;
- role-attached Wonder-to-palace;
- Nine-Star-hour audit index.

Normal user-facing AI prose should prefer the modern meaning rather than archaic formula names.

## 9. Relationship with previous phases

KM-STRUCTURE-2.0 remains responsible for:
- 81 Ten-Stem responses;
- Four Harms;
- bounded major formations.

KM-KEYING-3.0 is separate so Eight-Door and Wonder response corpora are not confused with the 81 Ten-Stem table.

KM-STRENGTH-2.0 remains the only Strength model.

KM-YONGSHEN-2.0 remains authoritative for role selection.

KM-ROLE-2.0 remains authoritative for contextual Host/Guest and agency.

KM-YINGQI-2.0 remains authoritative for dated response windows. Phase 9 does not create new dates.

KM-CASE-1.0 may teach assembly discipline but cannot turn a Keying response into empirical probability.

## 10. Non-goals

KM-KEYING-3.0 does not:
- implement Three Deceptions, Five Fakes or full Nine Escapes;
- implement Heavenly Three Gates / Earth Four Doors;
- implement Hidden Stems / Lead Stems;
- implement Flying Pan, Yin Pan or Zhi Run profiles;
- convert Nine-Star-hour ancient omens into modern outcome predictions;
- create additional Timing dates;
- migrate this corpus into KM-MENH-1.1 without a separate natal specification;
- claim scientific validation of classical Keying.

## 11. Regression requirements

Phase 9 must verify:
1. 64/64 Door×Door rows exist;
2. 72/72 Door×visible-stem rows exist;
3. 24/24 Three-Wonder-to-palace rows exist;
4. 108/108 Nine-Star×hour rows exist;
5. every Keying row is non-verdict-eligible;
6. Nine-Star-hour rows have zero verdict weight and `classical_context_only` scope;
7. Door–Palace classes follow actual element direction;
8. Door×Stem and Wonder rows attach only to matching role stems;
9. carried stems remain independently attached;
10. finance/emergence golden keeps the same primary judgment and event-stage separation;
11. evidence ranking contains no Keying vote/score;
12. writer context strips source refs and internal weights;
13. technical facts expose bounded modern meanings;
14. six protected core files and the frozen 480-board hash remain unchanged.

Frozen 480-board SHA-256:
`d384c9f4d42a94bd80d709eac2c865943ac5ac4f7e86489d84b003edd2b465ea`

## 12. Epistemic status

These corpora are traditional symbolic interpretation rules. Their presence in classical texts does not establish empirical predictive validity.

The application treats them as bounded interpretive conditions whose main value is consistency with the selected classical Qimen profile and auditability.
