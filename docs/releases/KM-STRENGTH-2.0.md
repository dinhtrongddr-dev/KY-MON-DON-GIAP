# KM-STRENGTH-2.0

Date: 2026-09-21
Status: upgrade branch implementation
Scope: event-reading strength/capacity layer. Frozen board construction remains unchanged.

## Goal

Stop treating all symbolic layers as if they shared one seasonal-strength formula.

KM-STRENGTH-2.0 keeps four distinct models:

1. Nine-Star seasonal status.
2. Eight-Door seasonal residual qi.
3. Ten-Stem Twelve-Life-Stage plus Stem-to-Palace support.
4. Palace seasonal environment as an explicit app synthesis.

The resulting values rank explanatory force only. They are not calibrated probabilities.

## Nine-Star model

The existing Yan-Bo-Diao-Sou-Ge convention remains unchanged:

- star same as month element -> 相 / tướng,
- star generates month element -> 旺 / vượng,
- month generates star -> 廢 / phế,
- star controls month -> 休 / hưu,
- month controls star -> 囚 / tù.

This model is used only for Nine Stars.

Primary source:
https://zh.wikisource.org/wiki/煙波釣叟歌

## Eight-Door model

Eight Doors use the separate residual-qi convention documented in Qimen Dunjia Tong Zong and Qimen Baojian:

- door same as current seasonal element -> 旺 / vượng,
- door generates seasonal element -> 相 / tướng,
- door controls seasonal element -> 休 / hưu,
- seasonal element controls door -> 囚 / tù,
- seasonal element generates door -> 廢 / phế.

Therefore a Star and a Door of the same element can legitimately have different strength labels in the same month.

Sources:
https://ctext.org/wiki.pl?chapter=473804&if=gb
https://ctext.org/wiki.pl?chapter=250961&if=gb

## Ten-Stem Twelve-Life-Stage

Ten Stems use the classical Twelve-Life-Stage cycle:

Trường Sinh -> Mộc Dục -> Quan Đới -> Lâm Quan -> Đế Vượng -> Suy -> Bệnh -> Tử -> Mộ -> Tuyệt -> Thai -> Dưỡng.

Classical starting branches:

- Jia 甲 -> Hai 亥
- Yi 乙 -> Wu 午
- Bing 丙 -> Yin 寅
- Ding 丁 -> You 酉
- Wu 戊 -> Yin 寅
- Ji 己 -> You 酉
- Geng 庚 -> Si 巳
- Xin 辛 -> Zi 子
- Ren 壬 -> Shen 申
- Gui 癸 -> Mao 卯

Yang stems run forward; Yin stems run backward.

The app evaluates this phase against the solar-month branch already calculated by the board engine. This is a phase/capacity signal for a stem, not a replacement for Nine-Star or Eight-Door seasonal strength.

Sources:
https://zh.wikisource.org/wiki/Page:Gujin_Tushu_Jicheng,_Volume_041_(1700-1725).djvu/86
https://zh.wikisource.org/wiki/三命通會/卷二

## Stem-to-Palace support

For a role represented directly by a Heaven Stem, the app also records the elemental relationship between the Stem and the palace:

- palace generates stem -> strongest environmental support,
- same element -> aligned support,
- stem generates palace -> resource drain,
- stem controls palace -> active expenditure/pressure,
- palace controls stem -> strong environmental constraint.

The internal combination of Life Stage and Stem-to-Palace support is an app synthesis for relevance ranking. It is explicitly not presented as an ancient probability formula.

## Palace seasonal environment

The palace layer uses ordinary five-phase seasonal relation only as environmental context:

- same season -> 旺,
- season generates palace -> 相,
- palace generates season -> 休,
- palace controls season -> 囚,
- season controls palace -> 死.

This layer never replaces the Star or Door formulas and is labeled as an app synthesis.

## Role-specific capacity

Strength follows the actual Useful-God type selected by KM-YONGSHEN-2.0.

Examples:

- money / Sheng Door -> Door strength,
- opportunity / Kai Door -> Door strength,
- capital / Wu stem -> Stem Life Stage + Stem-to-Palace support,
- study / Tian Fu -> Star strength,
- health issue / Tian Rui -> Star strength,
- self and event -> their representative Heaven-Stem capacity.

When a bundle contains more than one role, the stage resolver first looks for a primary Useful God relevant to the stage. A secondary or corroborating weak role cannot automatically downgrade a strong primary role.

## Interaction with KM-STRUCTURE-2.0

Structure and strength are separate questions:

- structure asks whether the role is helped, obstructed, void, tombed, punished, etc.;
- strength asks how much seasonal/phase capacity the actual role has to express that structure.

A favorable symbol or favorable stem response with weak role capacity is reduced to a conditional reading. Conversely, strong capacity does not erase Void, Tomb, Punishment, Door/Palace obstruction or another direct limiting condition.

## Writer/UI policy

The AI writer receives only human-facing strength states:

- strong / usable / weak,
- Star status,
- Door status,
- Palace status,
- role-specific status,
- Twelve-Life-Stage name and modern meaning.

Numeric internal weights are not exposed to the writer as prediction probabilities.

## Explicit non-goals

KM-STRENGTH-2.0 does not:

- claim empirical prediction accuracy,
- use one universal 旺相休囚死 table for all layers,
- apply an Earth 18-day rule,
- infer exact dates from a strength state,
- convert Twelve-Life-Stage into a medical, legal or financial fact,
- claim the palace-environment synthesis is a universal Qimen school convention.

## Regression coverage

tests/strength-v2.test.mjs verifies:

- all ten classical Life-Stage starting branches,
- Yang forward / Yin reverse,
- Star and Door formulas remain distinct,
- role strength follows the actual Useful-God type,
- weak favorable support becomes conditional rather than automatically positive,
- writer receives states/bands without strength weights,
- finance keeps Sheng-Door money strength separate from Wu-stem capital strength.

Existing frozen income-emergence and Void-modifier reasoning fixtures remain unchanged after the stage resolver was corrected to prioritize the relevant primary Useful God.

The frozen 480-board hash must remain unchanged because this phase modifies analysis only.
