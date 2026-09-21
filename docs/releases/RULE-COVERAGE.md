# Core Rule Coverage

Scope: Thoi Gia Ky Mon, rotating eight-spirit board, engine TG-ROTATING-2.0,
rules TG-CB-6.3, protocol 5. Fixed civil UTC offset remains the default. KM-TIMEPLACE-2.0 adds opt-in IANA civil-time history/DST resolution and solar-time metadata without silently applying solar correction to the board. Supported input years are 1900 through 2100. Chaibu and Mao Shan remain separate yuan methods.

| Layer / convention | Evidence and regression coverage | Limit |
| --- | --- | --- |
| Input calendar | Invalid dates, leap centuries, minute precision and fixed offsets -12 to +14 rejected/accepted explicitly; optional KM-TIMEPLACE-2.0 resolves IANA civil offsets before entering the unchanged core | Fixed-offset core remains canonical; IANA accuracy depends on runtime tzdb and rejects unsupported sub-minute historical offsets |
| Day/hour pillars | 675 cases compared with the continuous Julian-day/Jia-Zi rule and Five Rats hour formula, including 23:00, year ends and UTC extremes | Formula samples across 1900-2100, not every minute in that range |
| Astronomical terms | Twelve 2024 major terms transcribed from HKO, tolerance 90 seconds; both sides tested across offsets/methods | The linked HKO PDF lists 12 major terms despite its title; it is not 24 independently measured fixtures |
| Year/month pillars | 192 pairs around all twelve jie, eight offsets and both methods; Five Tigers month sequence, year changes only at Li Chun | Boundary instants come from the calendar library; this tests the pillar convention, not independent astronomy for the other 12 terms |
| Yin/Yang dun | Winter solstice to before summer solstice Yang; summer to before winter Yin; tests include both transition sides | Does not mix conventions from other schools |
| Ju/yuan | All 24 term tables, all 60 Fu-head days, Mao Shan exact 120/240-hour changes and final yuan until next term | No intercalation/Zhi Run method |
| Earth plate | Nine-stem sequence Wu, Ji, Geng, Xin, Ren, Gui, Ding, Bing, Yi; correct dun direction | Covered across all 18 ju configurations |
| Rotating layers | All 1,080 configurations (2 dun x 9 ju x 60 hours), duty star/door, ring order, eight spirits, nine heaven stems | Exhaustive for those discrete rotating inputs, not all interpretation conventions |
| Center hosting | Center 5 target hosted at Kun 2; Qin and center stem travel with Rui; independent carried-stem conditions | The selected center convention is explicitly part of this engine |
| Void/horse, Fu/Fan Yin | Six xun heads, void branches, horse branches/palaces, star and door layers | Symbolic conditions do not establish real events |
| Worked classical boards | Eight externally transcribed configurations in Dun Jia Yan Yi, volume 2 | Fixed reference examples, not generated snapshots |
| Door pressure, punishment, tombs | Door controls palace; Wu3/Ji2/Geng8/Xin9/Ren4/Gui4; Yi2/Bing6/Ding8; main and carried stems independently | Tomb coverage deliberately limited to three wonders; Yi→Kun 2 correction is source-backed by Dun Jia Yan Yi vol. 2 and Qimen Fa Qiao |
| Star seasonal strength | Yan Bo Diao Sou Ge mapping for all five element relationships | Not ordinary seasonal strength for stems/doors; no Earth 18-day rule |
| Legacy core special detector | Six explicit stem pairs, Tian/Di/Ren Dun; Wu Bu Yu Shi requires hour-over-day control with equal polarity | Kept for backward compatibility; full 81-pair interpretation is provided separately by KM-STRUCTURE-2.0 |
| Core immutability | Six source hashes plus the unchanged 480-board output SHA-256; mutation and extra-file checks | A hash detects drift; it is not an independent proof of rule correctness |
| Analysis/context/planner | 16 topics x 2 methods; roles, unresolved people, bundles, all directional element links, same-palace aliases, dominant conflicts and graph endpoints | Symbolic scenarios and finite intent classification are not empirical causal models |
| KM-YONGSHEN-2.0 | Domain resolver with primary/secondary/counterpart/corroborator/operational tiers; career, finance, relationship, family, study, health, legal, property, search, travel and social profiles; named family relatives activate Year/Month/Hour stems | Multi-source interpretation convention, not a universal school table or empirical probability; unknown people remain unresolved |
| KM-STRUCTURE-2.0 | 81 visible Ten-Stem responses with distinct modern meanings; actor-specific Void/Door-pressure/Punishment/Tomb; explicit Door-controls-Palace vs Palace-controls-Door; bounded major patterns including Green Dragon Returns, Flying Bird Falls Nest, Geng structures, Three Wonders Gain Use, Jade Woman Guards Door and Tian/Di/Ren Dun | Classical corpus is a symbolic interpretation system, not empirical probability; Eight-Door/Three-Wonder Keying moved to KM-KEYING-3.0; Three Deceptions/Five Fakes/Nine Escapes remain outside Structure scope |
| KM-STRENGTH-2.0 | Separate seasonal models: Nine-Star Yan-Bo status; Eight-Door residual-qi 旺/相/休/囚/廢; Ten-Stem Twelve-Life-Stage with yang-forward/yin-reverse; palace seasonal environment; role-specific capacity follows the actual Useful-God type | Internal weights rank explanatory force only; Twelve-Life-Stage is a classical stem-cycle signal, not the Nine-Star/Door formula; palace environment is an explicit app synthesis rather than a universal school rule |
| KM-ROLE-2.0 | Contextual Host/Guest frame; hour-stem first-move/later-response bias; Yang/Yin Inner-Outer zones; role-specific agency; directional support/pressure; same-palace evidence de-duplication; multiple user-mapped external actors | Host/Guest is posture, not fixed identity; Inner/Outer is a procedural tendency; agency is symbolic capacity, not verified power, intent, probability or a winner prediction |
| KM-TIMEPLACE-2.0 | Default fixed-offset compatibility; opt-in IANA historical civil offset/DST; ambiguous local times require earlier/later selection; nonexistent local times rejected; timing candidates re-resolve zone per date; optional longitude/latitude metadata; NOAA-style apparent-solar-time comparison | Runtime tzdb freshness depends on browser/Node; IANA notes pre-1970 history has limitations; historical sub-minute offsets are rejected rather than rounded; solar comparison is metadata only and never silently changes the core board |
| KM-MENH-1.1 | Compatibility runtime over frozen KM-MENH-1.0 construction; adds KM-STRENGTH-2.0/KM-STRUCTURE-2.0 to claim-linked Mệnh roles and reuses KM-TIMEPLACE-2.0 for known/unknown civil-time resolution; Mệnh protocol 2 distinguishes runtime from source spec | Does not rewrite the frozen 1.0 profile/resolvers; solar time remains metadata; UNKNOWN stability remains separate from rectification |
| KM-MENH-RECTIFICATION-1.0 | Research-only candidate ranking from user-supplied historical event years; annual Stem overlap is primary and annual Branch overlap secondary; minimum gate 5 events across 3 domains; runner-up/tie/abstention retained; no auto-selection | Only 1 blind research case currently; no accuracy claim; annual-resolution only, so DAY/MONTH event precision receives no extra weight; ranking units are not probability |
| KM-CASE-1.0 | Provenance-locked case retrieval after the current deterministic judgment; hard product/domain/stage/role gates; adaptation-aware ranking; bounded assembly/adaptation/avoid guidance for Hỏi Việc and Mệnh; manual verified-only Retain; browser/bridge `caseRules` compatibility marker | Cases are methodological precedents, not evidence or votes; no verdict override, no majority vote, no probability, no automatic session retention, no question-text retention; current seed corpus has zero empirical observed-outcome calibration cases |
| KM-KEYING-3.0 | 64 Door×Door static responses; 72 Door×visible-stem responses; 24 Three-Wonder-to-palace responses; Door–Palace Tỷ hòa/Hòa/Nghĩa/Bức/Chế based on actual element direction; full 108 Nine-Star×hour source index; role/stem attachment including carried stems | Keying is a condition layer, not an independent vote or probability. Nine-Star-hour rows are `classical_context_only` with zero verdict weight because the classical corpus is heavily burial/travel-omen specific; no new Timing dates; no automatic Mệnh migration |
| Modes/comparisons | Distinct prediction/strategy/business/negotiation plans; 2-12 timing candidates and eight directions; original self pillar preserved | Relative comparison scores are not calibrated probabilities |
| KM-YINGQI-2.0 timing | Explicit user horizon only; pace signal from inner/outer plate plus Fu/Fan Yin; dated trigger priority Void fill/clash → Horse arrival/clash → Three-Wonder Tomb arrival/clash | Pace does not fabricate dates; punishment, stem/door timing, Fu/Fan Yin dates and non-Three-Wonder tomb dates remain unsupported |
| Writer/validation | Frozen claims, actions, edges and candidates; words/conditions/resolution checked; one repair; fabricated references and some certainty forms rejected | Lexical/schema checks cannot guarantee every sentence is grounded or useful |
| Transport/browser | Fingerprints recomputed server-side; pairing, Host/Origin, cancellation, stale responses, errors after keepalive; relay preserves streaming JSON; safe text rendering and five tabs | Offline tests use controlled model responses; real-provider availability is external |
| Distribution | Required Windows inputs and SHA-256 pins; deterministic ZIP, stale-source/CRC checks; launcher compilation and self-test | The legacy C# compiler is not byte-reproducible; the shipped EXE is separately pinned |

Frozen output SHA-256 (480 boards):

`d384c9f4d42a94bd80d709eac2c865943ac5ac4f7e86489d84b003edd2b465ea`

Do not regenerate this expected hash to make a failing test pass. A demonstrated
rule correction needs an independent fixture, a reviewed convention/version
change and a new upgrade branch. Keep the original frozen tag intact.

## Independent References

- Yan Bo Diao Sou Ge: https://zh.wikisource.org/wiki/煙波釣叟歌
- Dun Jia Yan Yi, volume 2: https://zh.wikisource.org/wiki/遁甲演義_(四庫全書本)/卷2
- Qimen Fa Qiao, volume 2 (Void/Tomb discussion): https://ctext.org/wiki.pl?chapter=118328&if=gb
- Secondary procedural Ying-Qi reference (pace and trigger ordering context): https://www.yjgov.com/30.html
- KM-YONGSHEN-2.0 domain mapping references: https://www.qimena.com/wiki/qimen-yongshen/ ; https://qimen.pro/ask/ ; https://dougleschan.com/chinese/
- Six-relative Useful-God references: https://d1peixun.com/m/view.php?aid=1248 ; https://www.sohu.com/a/449137793_121020386
- Ten-Stem response corpus: https://www.shidianguji.com/book/SDZJ0630/chapter/1lx9g1urkiyp2 ; cross-check https://fengshui678.com/show/106.html
- Structure/pattern references: https://zh.wikisource.org/wiki/遁甲演義_(四庫全書本)/卷2 ; https://ctext.org/wiki.pl?chapter=665347&if=gb&remap=gb
- Door/Palace pressure directional reference: https://shuyuan.zhiming.life/read/奇门法窍/4
- KM-KEYING-3.0 Eight-Door corpus cross-check: https://www.qiankuntang.com/blogs/entry/18-%E5%A5%87%E9%97%A8%E9%81%81%E7%94%B2%E5%85%AB%E9%97%A8%E5%85%8B%E5%BA%94%EF%BC%88%E5%8A%A8%E5%BA%94%E9%9D%99%E5%BA%94%EF%BC%89/ ; corpus overview https://www.sanmin.com.tw/product/index/003670413
- KM-KEYING-3.0 Three-Wonders-to-palace text: https://ctext.org/wiki.pl?chapter=772362&if=gb&remap=gb ; https://www.shidianguji.com/book/SDZJ0630/chapter/1lx9g1w8ky4nd
- KM-KEYING-3.0 Nine-Star × hour source: https://zh.wikisource.org/zh-hant/%E9%81%81%E7%94%B2%E6%BC%94%E7%BE%A9
- Hòa/Nghĩa and Door–Palace control-direction source: https://ctext.org/wiki.pl?chapter=250961&if=gb ; naming-variant cross-check https://ichingtrilogy.com/post/qi-men-fa-qiao-06/
- Eight-Door seasonal residual qi: https://ctext.org/wiki.pl?chapter=473804&if=gb ; https://ctext.org/wiki.pl?chapter=250961&if=gb
- Ten-Stem Twelve-Life-Stage starts and yang-forward/yin-reverse: https://zh.wikisource.org/wiki/Page:Gujin_Tushu_Jicheng,_Volume_041_(1700-1725).djvu/86 ; background stages https://zh.wikisource.org/wiki/三命通會/卷二
- Host/Guest contextual rule: https://ctext.org/wiki.pl?chapter=961040&if=gb&remap=gb
- Hour-stem Host/Guest action bias: https://ctext.org/wiki.pl?chapter=473804&if=gb
- Inner/Outer procedural convention: https://www.sohu.com/a/550238240_324894
- IANA Time Zone Database overview/theory/releases: https://www.iana.org/time-zones/tz-link ; https://www.iana.org/time-zones/theory ; https://www.iana.org/time-zones/releases/2026d
- NOAA solar-time calculation equations: https://gml.noaa.gov/grad/solcalc/solareqns.PDF
- HKO 2024 major terms: https://www.hko.gov.hk/en/gts/astron2024/files/2024SolarTerms24.pdf
- HKO term definitions: https://www.hko.gov.hk/en/gts/time/24solarterms.htm
- Vendored calendar source: https://github.com/6tail/lunar-javascript

The HKO PDF inspected on 2026-09-14 has SHA-256
`532ff6e4b461b53205d227fa9d7b7097baa8e0053a1f02e9d5a934e931fcdf97`.
Rule fixtures are in `tests/audit.test.mjs`; calendar rollover coverage is in
`tests/calendar-boundaries.test.mjs`. For empirical AI content evaluation, use
`AI-EVAL.md`; a technically valid response does not complete that matrix.
