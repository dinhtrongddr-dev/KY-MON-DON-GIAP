# Core Rule Coverage

Scope: Thoi Gia Ky Mon, rotating eight-spirit board, engine TG-ROTATING-2.0,
rules TG-CB-5.0, protocol 5. The calendar is a fixed civil UTC offset; it does
not implement daylight-saving rules or true solar time. Supported input years
are 1900 through 2100. Chaibu and Mao Shan remain separate yuan methods.

| Layer / convention | Evidence and regression coverage | Limit |
| --- | --- | --- |
| Input calendar | Invalid dates, leap centuries, minute precision and offsets -12 to +14 rejected/accepted explicitly | Not a historical local-time-zone database |
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
| Special combinations | Six explicit stem pairs, Tian/Di/Ren Dun; Wu Bu Yu Shi requires hour-over-day control with equal polarity | Not the entire ten-stem response corpus |
| Core immutability | Six source hashes plus the unchanged 480-board output SHA-256; mutation and extra-file checks | A hash detects drift; it is not an independent proof of rule correctness |
| Analysis/context/planner | 16 topics x 2 methods; roles, unresolved people, bundles, all directional element links, same-palace aliases, dominant conflicts and graph endpoints | Symbolic scenarios and finite intent classification are not empirical causal models |
| KM-YONGSHEN-2.0 | Domain resolver with primary/secondary/counterpart/corroborator/operational tiers; career, finance, relationship, family, study, health, legal, property, search, travel and social profiles; named family relatives activate Year/Month/Hour stems | Multi-source interpretation convention, not a universal school table or empirical probability; unknown people remain unresolved |
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
- HKO 2024 major terms: https://www.hko.gov.hk/en/gts/astron2024/files/2024SolarTerms24.pdf
- HKO term definitions: https://www.hko.gov.hk/en/gts/time/24solarterms.htm
- Vendored calendar source: https://github.com/6tail/lunar-javascript

The HKO PDF inspected on 2026-09-14 has SHA-256
`532ff6e4b461b53205d227fa9d7b7097baa8e0053a1f02e9d5a934e931fcdf97`.
Rule fixtures are in `tests/audit.test.mjs`; calendar rollover coverage is in
`tests/calendar-boundaries.test.mjs`. For empirical AI content evaluation, use
`AI-EVAL.md`; a technically valid response does not complete that matrix.
