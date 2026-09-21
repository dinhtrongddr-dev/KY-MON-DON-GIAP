# KM-FORMATION-3.0

Date: 2026-09-21
Status: develop upgrade
Profile: QIMEN_FAQIAO_STRATEGIC_BOUNDED
Scope: Thời Gia Kỳ Môn · Chuyển Bàn · Tháo Bổ

## 1. Goal

KM-FORMATION-3.0 completes a bounded classical strategic-formation layer for the current rotating-board profile.

It adds:

- Tam Trá / 三詐;
- Ngũ Giả / 五假;
- Cửu Độn / 九遁;
- Thiên Tam Môn / 天三門;
- Địa Tứ Hộ / 地四戶.

These are action/direction conditions. They are not independent evidence votes, not probabilities and do not override the current primary judgment, timing comparison ranking or direction ranking.

## 2. Source profile and variants

Different transmissions do not always give identical names or formulas for every formation.

KM-FORMATION-3.0 therefore selects `奇門法竅` as the primary profile for Tam Trá, Ngũ Giả and Cửu Độn. `遁甲演義` and `奇門遁甲秘笈大全` are used as cross-checks and variant provenance.

Primary references:

- https://ctext.org/wiki.pl?chapter=600483&if=gb&remap=gb
- https://zh.wikisource.org/zh-hant/%E9%81%81%E7%94%B2%E6%BC%94%E7%BE%A9_%28%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC%29/%E5%8D%B72
- https://ctext.org/wiki.pl?chapter=665347&if=gb&remap=gb
- https://ctext.org/wiki.pl?chapter=139827&if=gb&remap=gb

A variant is metadata, not an extra vote. For example, a transmission using a related `神假` label does not create a sixth Fake in the selected Five-Fake profile.

## 3. Three Deceptions

The primary profile implements:

- Chân Trá / 真詐 = Three Wonders + one of Open/Rest/Life Doors + Tai Yin;
- Trọng Trá / 重詐 = Three Wonders + one of Open/Rest/Life Doors + Nine Earth;
- Hưu Trá / 休詐 = Three Wonders + one of Open/Rest/Life Doors + Six Harmony.

Modern action meanings:

- Chân Trá: discreet planning, privacy, conciliation;
- Trọng Trá: resource mobilization, consolidation, staging;
- Hưu Trá: cooperation, negotiation, agreement.

The classical word `詐` is not rendered as advice to deceive people. The application translates it as a tactical style of concealment, staging or coordination.

## 4. Five Fakes

The selected Qimen Fa Qiao profile implements exactly five:

### Heaven Fake / 天假

View Door + Yi/Bing/Ding + Nine Heaven.

Modern use:
presentation, petition, public signal and formal visibility.

### Earth Fake / 地假

Primary branch:
Block Door + Ding/Ji/Gui + Nine Earth.

The same Qimen Fa Qiao paragraph also gives two spirit subvariants under the Earth-Fake heading:

- Block Door + Ding/Ji/Gui + Tai Yin → discreet reconnaissance/private inquiry;
- Block Door + Ding/Ji/Gui + Six Harmony → coordinated withdrawal/avoidance.

They remain `earth_fake`; they do not create extra Fake families.

Modern use:
concealment, research, private inquiry, defensive preparation or coordinated withdrawal depending on the spirit subvariant.

### Object Fake / 物假

Harm Door + Ding/Ji/Gui + Six Harmony.

Modern use:
recovery, repair, reuse and trade around an existing object/resource.

### Ghost Fake / 鬼假

Death Door + Ding/Ji/Gui + Nine Earth.

Modern use:
closure, cleanup and decommissioning.

It must never be rewritten as a literal death or ghost prediction.

### Human Fake / 人假

Fear Door + Ren + Nine Heaven.

Modern use:
search, verification and investigation.

It must never be used to accuse a person of wrongdoing.

Five Fakes are lowered when the relevant supported stem is in Tomb or the Door is pressed.

The classical text says Five Fakes avoid `迫墓`, but the current app only has deterministic Tomb rules for Yi/Bing/Ding. Therefore a Five-Fake match carried by Ji/Gui/Ren is emitted as `qualificationStatus=partial_tomb_coverage`, `qualified=false`: the formula matches, but the Tomb prerequisite is not fully checked. This preserves the existing explicit non-goal of not inventing non-Three-Wonder Tomb rules.

## 5. Nine Escapes

The primary profile implements all nine families.

### Heaven Escape / 天遁

Canonical active formula:
Bing Wonder + Life Door + Earth Ding.

One Qimen Fa Qiao transcription reads `丙奇生开合地丁`; other classical witnesses, including the Yuding Qimen Baojian line, give the canonical Life-Door formula explicitly. KM-FORMATION-3.0 therefore activates Life Door only and records the `生开` wording as a textual variant rather than silently broadening the match to Open Door.

Modern use:
launch, petition, controlled advance and public action.

### Earth Escape / 地遁

Yi Wonder + Open Door + Earth Ji.

Modern use:
build, property/logistics preparation and stabilization.

### Human Escape / 人遁

Ding Wonder + Rest Door + Tai Yin.

Modern use:
negotiation, cooperation, relationship handling and discreet contact.

### Spirit Escape / 神遁

Bing Wonder + Life Door + Nine Heaven.

Modern use:
strategic initiative, expansion and high-visibility action.

The application does not interpret this as supernatural assistance.

### Ghost Escape / 鬼遁

Yi Wonder + Block Door + Nine Earth.

Modern use:
research, intelligence gathering, concealment and quiet preparation.

The application does not interpret this as literal ghosts.

### Wind Escape / 風遁

Yi Wonder + one of Open/Rest/Life Doors + Xun palace.

Modern use:
movement, communication, adaptation and travel.

### Cloud Escape / 雲遁

Yi Wonder + one of Open/Rest/Life Doors + Earth Xin.

Modern use:
staging, concealment and gradual rollout.

### Dragon Escape / 龍遁

Yi Wonder + one of Open/Rest/Life Doors + Kan palace.

Modern use:
logistics, route/flow and movement.

### Tiger Escape / 虎遁

Primary Qimen Fa Qiao profile:
Yi Wonder + Rest Door + Earth Xin + Gen palace.

An alternate Qimen Fa Qiao expression using Bing + Life Door + Earth Xin is retained as variant metadata, not an additional vote.

Modern use:
defense, boundary control, terrain/risk control or controlled execution.

## 6. Formation qualification

Nine Escapes are lowered when the relevant formation meets:

- Three-Wonder Tomb;
- Six-Instrument Punishment where applicable;
- Door pressure.

Five Fakes are lowered by:

- supported Tomb checks;
- Door pressure.

For Yi/Bing/Ding the Tomb check is deterministic. For Ji/Gui/Ren the match is retained for audit but qualification remains partial until a separately sourced non-Three-Wonder Tomb layer exists.

These checks do not replace the existing Structure/Strength/Role layers.

A formation marked `qualified=true` is still only a compatible action style. It is not proof that the action will succeed.

## 7. Heaven Three Gates

The three Heaven Gates are:

- Tai Chong / 太沖 at sky branch Mao;
- Xiao Ji / 小吉 at sky branch Wei;
- Cong Kui / 從魁 at sky branch You.

The classical method places the current Heaven Month General / 天月將 on the hour branch, then rotates the sky branch sequence to locate the three target generals on earthly directions.

### Month General by middle qi

The engine changes Month General at the twelve middle qi rather than estimating from Gregorian or lunar months.

Mapping:

- after Da Han: Zi;
- after Yu Shui: Hai;
- after Chun Fen: Xu;
- after Gu Yu: You;
- after Xiao Man: Shen;
- after Xia Zhi: Wei;
- after Da Shu: Wu;
- after Chu Shu: Si;
- after Qiu Fen: Chen;
- after Shuang Jiang: Mao;
- after Xiao Xue: Yin;
- after Dong Zhi: Chou.

The adjacent Jie keeps the same Month General until the next middle qi.

### Rotation formula

For a target sky branch:

`landing = hourBranch + (targetSkyBranch - monthGeneral) mod 12`

The engine then maps the landing branch to its Qimen palace/direction.

### Classical worked example

After Yu Shui:

- Month General = Hai;
- hour = Wu;
- Tai Chong lands Xu;
- Xiao Ji lands Yin;
- Cong Kui lands Chen.

The regression suite reproduces exactly this sequence: `Xu → Yin → Chen`.

Heaven Three Gates are directional overlays only. They do not establish route safety or success.

## 8. Earth Four Doors

The engine uses the twelve Jian-Chu officers:

`Jian → Chu → Man → Ping → Ding → Zhi → Po → Wei → Cheng → Shou → Kai → Bi`

With Jian placed on the hour branch, the four selected Earth Doors are:

- Chu: offset +1;
- Ding: offset +4;
- Wei: offset +7;
- Kai: offset +10.

At Wu hour the four landing branches are:

`Wei → Xu → Chou → Chen`.

The landing branches are then mapped to Qimen palaces/directions.

Earth Four Doors are traditional directional/action overlays. They do not replace real-world route, weather, terrain, safety or legal checks.

## 9. Branch-to-palace mapping

The Direction layer uses the existing Later-Heaven palace branch mapping:

- Zi → Kan 1;
- Chou/Yin → Gen 8;
- Mao → Zhen 3;
- Chen/Si → Xun 4;
- Wu → Li 9;
- Wei/Shen → Kun 2;
- You → Dui 7;
- Xu/Hai → Qian 6.

Center 5 has no independent direction.

## 10. Role attachment

Formation matching occurs after Useful-God/role resolution.

Each palace formation carries:

- all active roles in that palace;
- the subset of role representatives whose stem participates in the formation;
- qualification blockers.

Formation does not invent a customer, authority, spouse, competitor or decision maker.

## 11. Timing and Direction behavior

### Timing

A timing candidate may expose qualified `formationMarkers` for the target role palaces.

The markers explain how a candidate could be used.

They do not change:

- blockers;
- fit;
- candidate rank.

### Direction

A direction comparison may expose Heaven-Gate/Earth-Door markers for the corresponding palace.

The markers do not change the existing direction rank.

The writer must not call a marked direction safe, winning or guaranteed.

## 12. Evidence and judgment contract

KM-FORMATION-3.0 deliberately adds no:

- `formationScore`;
- `formationImportance`;
- probability;
- vote count;
- win/loss field.

The existing evidence-scoring algorithm is unchanged.

The existing primary-judgment algorithm is unchanged.

A direct blocker can dominate a favorable formation.

## 13. Writer contract

The writer receives sanitized modern fields:

- formation id/name/family;
- qualified status and blockers;
- plain meaning;
- action-use tags;
- variant label;
- role/stem attachment;
- Heaven-Gate/Earth-Door direction markers.

The writer does not receive classical source references in ordinary writing context.

It must not turn terms such as Ghost Escape, Spirit Escape or Ghost Fake into literal supernatural claims.

## 14. UI contract

The technical Qimen panel can show, for relevant palaces:

- matched Three Deceptions/Five Fakes/Nine Escapes;
- qualification blockers;
- Heaven Three Gates hitting that palace;
- Earth Four Doors hitting that palace.

Normal prose should prefer modern action meanings.

## 15. Relationship to previous phases

KM-YONGSHEN-2.0 remains authoritative for Useful-God/role selection.

KM-STRUCTURE-2.0 remains authoritative for 81 Ten-Stem responses, Four Harms and the bounded major-pattern set already implemented there.

KM-STRENGTH-2.0 remains authoritative for symbolic capacity/strength.

KM-ROLE-2.0 remains authoritative for Host/Guest, Inner/Outer and agency.

KM-YINGQI-2.0 remains authoritative for dated response windows.

KM-KEYING-3.0 remains authoritative for Eight-Door Keying, Wonder-to-palace and the classical Nine-Star-hour index.

KM-FORMATION-3.0 adds tactical/action/direction context only.

KM-CASE-1.0 may guide assembly discipline but cannot turn a formation into empirical evidence.

## 16. Non-goals

Phase 10 does not implement:

- Earth Private Gates / 地私門;
- Tingting/Baijian directional methods;
- Three Victory Palaces / 三勝宮;
- Five No-Strike directions / 五不擊;
- military victory prediction;
- ritual/supernatural guarantees;
- new Ying-Qi dates;
- new ranking weight for Timing or Direction;
- automatic migration into KM-MENH-1.1;
- Flying Pan, Yin Pan or Zhi Run profiles.

Those require separate provenance/profile work.

## 17. Regression requirements

Phase 10 must verify:

1. all three Deceptions;
2. exactly five Fake families in the selected profile, including Earth-Fake Tai-Yin/Six-Harmony subvariants without creating extra families;
3. all nine Escape families;
4. the Tiger alternate remains a variant rather than a new family;
5. Escape/Fake qualification blockers plus partial-tomb qualification for Ji/Gui/Ren;
6. Yu-Shui + Wu-hour Heaven-Gate example = Xu/Yin/Chen;
7. Earth Four Doors at Wu hour = Wei/Xu/Chou/Chen;
8. all 24 solar-term ids map to the correct middle-qi Month General interval;
9. primary judgment remains unchanged on the finance/emergence golden;
10. no Formation score enters evidence ranking;
11. writer context strips source refs/internal vote flags;
12. Timing formation markers preserve candidate ranking;
13. Direction portal markers preserve direction ranking;
14. six protected core files and the frozen 480-board output hash remain unchanged.

Frozen 480-board SHA-256:

`d384c9f4d42a94bd80d709eac2c865943ac5ac4f7e86489d84b003edd2b465ea`

## 18. Epistemic status

These formations are traditional symbolic rules and strategic conventions.

Classical textual provenance does not establish empirical predictive validity.

The application therefore treats them as bounded, auditable action/direction interpretations rather than proof of future outcomes.
