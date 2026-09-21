# KM-DIRECTION-4.0

Date: 2026-09-21
Status: develop upgrade
Profile: CLASSICAL_DIRECTION_BOUNDED
Scope: Thời Gia Kỳ Môn · Chuyển Bàn · Tháo Bổ

## 1. Goal

KM-DIRECTION-4.0 completes the currently sourced classical direction layer that remains after KM-FORMATION-3.0.

Implemented families:

- Địa Tư Môn / 地私門;
- Đình Đình–Bạch Gian / 亭亭白奸;
- Thiên Mã phương / 天馬方;
- Thiên Cương phương / 天罡方;
- Tam Thắng Cung / 三勝宮;
- Ngũ Bất Kích / 五不擊.

These are directional annotations. They do not change the existing Direction ranking, evidenceScore, primaryJudgment or probability.

## 2. Sources

Primary source families:

- 奇門法竅卷六 for Earth Private Doors, Heaven Horse and Heaven Gang;
- 御定奇門遁甲寶鑒 for the canonical Tingting/Baijian interpretation;
- 奇門法竅卷二 for Three Victories / Five No-Strike.

Cross-checks:

- 遁甲演義卷二;
- 遁甲符應經卷下.

Web references used for release research:

- https://ctext.org/wiki.pl?chapter=600483&if=gb&remap=gb
- https://ctext.org/wiki.pl?chapter=250961&if=gb
- https://ctext.org/wiki.pl?chapter=118328&if=gb
- https://zh.wikisource.org/zh-hant/%E9%81%81%E7%94%B2%E6%BC%94%E7%BE%A9_%28%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC%29/%E5%8D%B72

Variant policy:

`one_canonical_formula_per_rule_family_variants_are_metadata`

A textual variant does not create another vote or another ranking bonus.

## 3. Shared month-general overlay

Phase 11 reuses the same Heaven Month General mapping already locked by KM-FORMATION-3.0.

For a target sky branch:

`landing = hourBranch + (targetBranch - monthGeneral) mod 12`

The landing branch is mapped to the existing Later-Heaven palace/direction.

No Gregorian-month shortcut is added.

## 4. Earth Private Doors

The selected Qimen Fa Qiao method uses:

- hour Chen/Si/Wu/Wei/Shen/You → `dan_gui`;
- hour Xu/Hai/Zi/Chou/Yin/Mao → `mu_gui`.

Day-stem Nobleman branches:

- Jia/Wu/Geng: Chou / Wei;
- Yi/Ji: Zi / Shen;
- Bing/Ding: Hai / You;
- Ren/Gui: Si / Mao;
- Xin: Wu / Yin.

The first branch is dan gui and the second branch is mu gui.

After placing the Month General on the hour branch, the selected Nobleman is located on the ground branch.

Rotation:

- Nobleman landing at Hai/Zi/Chou/Yin/Mao/Chen → forward;
- Nobleman landing at Si/Wu/Wei/Shen/You/Xu → reverse.

The three Earth Private Doors are the landing directions of:

- Six Harmony;
- Tai Yin;
- Tai Chang.

### Golden source example A

After Yu Shui, Month General = Hai.

Jia/Wu/Geng day + Mao hour:

- use mu gui = Wei;
- Wei lands Hai;
- rotate forward;
- Six Harmony → Yin;
- Tai Chang → Wei;
- Tai Yin → You.

### Golden source example B

Jia/Wu/Geng day + Wu hour:

- use dan gui = Chou;
- Chou lands Shen;
- rotate reverse;
- Six Harmony → Si;
- Tai Chang → Zi;
- Tai Yin → Xu.

Both examples are reproduced by regression tests.

Modern meaning:

- Six Harmony: coordination / connection / negotiated withdrawal;
- Tai Yin: discreet research / privacy-sensitive handling;
- Tai Chang: stability / logistics / resource maintenance.

Private-direction wording must not justify privacy violations, surveillance or unsafe travel.

## 5. Tingting

Canonical KM-DIRECTION-4.0 rule:

- place Month General on the hour;
- locate Shen Hou / sky Zi;
- its ground landing is Tingting.

Examples under Yu Shui / Month General Hai:

- Mao hour → Tingting at Chen;
- Wu hour → Tingting at Wei.

Modern meaning:

Tingting is a traditional stance/base axis. It is not a guarantee of victory.

## 6. Baijian

The texts contain multiple methods.

KM-DIRECTION-4.0 uses the interpretation preserved in `御定奇門遁甲寶鑒`:

- locate sky Yin / Gong Cao;
- sky Wu / Sheng Guang;
- sky Xu / Tian Kui;
- whichever lands on one of the four Meng branches Yin/Si/Shen/Hai is Baijian.

The canonical engine normally yields exactly one candidate.

Examples:

- Yu Shui + Mao hour → Baijian at Yin;
- Yu Shui + Wu hour → Baijian at Si.

Other day/month shortcut traditions remain provenance only.

Modern meaning:

Baijian is an external-facing/opposition axis. The application does not convert it into attack advice.

## 7. Heaven Horse direction

The classical source states that Heaven Horse is Tai Chong.

Rule:

- sky Mao / Tai Chong;
- place Month General on hour;
- its ground landing is Heaven Horse direction.

Example:

Yu Shui + Wu hour:

- Month General Hai;
- Tai Chong/Mao lands Xu.

This is a movement annotation only.

It does not prove road safety.

## 8. Heaven Gang direction

Rule:

- sky Chen / Tian Gang;
- place Month General on hour;
- its ground landing is Heaven Gang direction.

Example:

Yu Shui + Wu hour:

- Tian Gang/Chen lands Hai.

The source presents this as a fallback directional technique.

The application only exposes it as a secondary directional overlay and does not reproduce combat promises.

## 9. Three Victories

### First Victory: Tianyi palace

The classical sources distinguish Yang and Yin Dun.

Yang Dun:

- use the heavenly Zhi Fu palace.

Yin Dun:

- use the ground/earth Zhi Fu location;
- in the current rotating-board implementation this is the earth palace of the hidden Jia instrument.

If that raw location is Center 5, the existing application convention hosts Center at Kun 2 for directional use.

### Second Victory: Nine Heaven palace

Use the current palace carrying Nine Heaven.

### Third Victory: Life Door + Three Wonder

The third Victory is only fully qualified when:

- Life Door is present;
- at least one heavenly Yi/Bing/Ding is in that palace.

Life Door without a Three Wonder is recorded but not qualified as the third Victory.

Modern meaning:

Three Victories are supportive stance annotations only.

The word “Victory” is a historical label, not a result prediction.

## 10. Five No-Strike

KM-DIRECTION-4.0 uses five rule reasons:

1. Tianyi palace;
2. Nine Heaven palace;
3. Life Door palace;
4. Nine Earth palace;
5. Duty Door / Zhi Shi palace.

Some textual witnesses mention Zhi Fu together with Zhi Shi in the fifth line. Because Tianyi already covers the Zhi-Fu axis in this profile, the app does not count Zhi Fu again as a sixth or duplicate vote.

Multiple reasons may land in the same palace.

They remain separate provenance reasons but do not become separate ranking penalties.

Modern meaning:

`Ngũ Bất Kích` is translated as:

“avoid direct confrontation / avoid forcing the situation from this direction.”

It is not a combat instruction.

## 11. Direction-mode contract

A Direction candidate may carry:

`directionMarkers[]`

Families:

- `earth_private_doors`;
- `tingting_baijian`;
- `heaven_horse_gang`;
- `three_victories`;
- `five_no_strike`.

The markers are attached after the normal candidate metrics are computed.

Existing ranking remains:

1. fewer blockers;
2. then action fit;
3. equal criteria remain tied by the existing convention.

Direction markers are not included in the comparator.

## 12. Writer contract

Writer-visible fields contain:

- modern name;
- family;
- palace;
- plain meaning;
- use tags.

Writer-visible fields do not contain:

- source URLs;
- classical source titles;
- “hundred battles / certain victory” language;
- an attack target;
- a probability;
- a direction score.

The writer must preserve computed rank.

For Five No-Strike, wording must be limited to avoiding direct confrontation / forcing the situation.

## 13. UI contract

Direction comparison cards show:

`Phương vị cổ điển: ... Chỉ là lớp đối chiếu, không đổi thứ hạng.`

This is deliberately separate from:

- blocker count;
- action fit;
- supports.

The normal Qimen board is not recolored by KM-DIRECTION-4.0.

Phase 10 Attention UI remains structural and independent.

## 14. Relationship with KM-FORMATION-3.0

KM-FORMATION-3.0 owns:

- Three Deceptions;
- Five Fakes;
- Nine Escapes;
- Heaven Three Gates;
- Earth Four Doors.

KM-DIRECTION-4.0 owns:

- Earth Private Doors;
- Tingting/Baijian;
- Heaven Horse/Heaven Gang;
- Three Victories/Five No-Strike.

The two layers can appear together in Direction mode but neither may change the existing rank.

## 15. Relationship with other engines

KM-YONGSHEN-2.0 remains authoritative for role selection.

KM-STRUCTURE-2.0 remains authoritative for Four Harms, Ten-Stem responses and major structures.

KM-STRENGTH-2.0 remains authoritative for symbolic capacity.

KM-ROLE-2.0 remains authoritative for Host/Guest and agency.

KM-YINGQI-2.0 remains authoritative for dated response windows.

KM-CASE-1.0 cannot turn Direction markers into empirical evidence.

## 16. Non-goals

Phase 11 does not implement:

- physical route safety;
- navigation;
- weather or terrain safety;
- military tactics;
- attack planning;
- violent target selection;
- probability of success;
- a new Direction score;
- automatic rank override;
- automatic use in KM-MENH-1.1;
- unrelated Liu Ren or proprietary direction systems;
- Seven Stars Path.

## 17. Regression requirements

Phase 11 verifies:

1. declared coverage;
2. Earth Private Doors Mao-hour source example;
3. Earth Private Doors Wu-hour source example;
4. Tingting Mao/Wu examples;
5. canonical Baijian uniqueness;
6. Heaven Horse and Heaven Gang overlay;
7. Yang-Dun Tianyi uses heavenly Zhi Fu;
8. Yin-Dun Tianyi uses earth instrument palace;
9. third Victory requires Life Door + Three Wonder;
10. exactly five No-Strike rule reasons;
11. no rank/verdict eligibility on directional overlays;
12. real Direction rank is unchanged when markers are removed;
13. writer strips source refs and military victory language;
14. UI labels markers as non-ranking;
15. six protected core files stay unchanged;
16. frozen 480-board SHA stays unchanged.

Frozen 480-board SHA-256:

`d384c9f4d42a94bd80d709eac2c865943ac5ac4f7e86489d84b003edd2b465ea`

## 18. Epistemic status

These are traditional symbolic direction rules.

Classical provenance establishes what the historical rule says; it does not establish empirical predictive validity.

The application therefore exposes them as auditable, bounded directional annotations rather than guarantees, probabilities or instructions to confront another person.
