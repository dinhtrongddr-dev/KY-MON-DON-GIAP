# KM-YONGSHEN-2.0

Date: 2026-09-20
Status: upgrade branch implementation
Scope: Event-reading Useful-God resolver. Board construction is unchanged.

## Goal

Replace a flat list of topic proxies with an explicit hierarchy:

- primary: main symbolic axis for the question,
- secondary: supporting axis required for the domain,
- counterpart: a named other party only when the question mentions one; never auto-assigned a stem,
- corroborator: cross-check only,
- operational: execution/payment/process layer.

The resolver selects symbolic roles. It also supports a bounded secondary domain when the wording clearly introduces another decision axis (for example, family + financial capacity). It does not verify identity, motive, diagnosis, legal fact, market outcome or probability.

## Domain profiles

| Domain | Primary | Secondary / corroborating |
| --- | --- | --- |
| General | Hour-stem event | Kai / execution |
| Business | Kai | Jing, Liu He, Sheng, Chief, Wu |
| Project | Event | Zhi Shi execution, Liu He, Kai, Chief |
| Career | Kai | Chief, event, Tian Fu, execution |
| Recruitment | Kai | Chief, Liu He, event |
| Finance | Sheng | Wu, event; commitment/payment only when the stage needs it |
| Relationship | Event + Liu He | Xiu; Yi/Geng retained as a corroborating axis, not automatic gender/person identity |
| Family | Event + Liu He | Xiu + execution; explicit relatives activate pillar roles |
| Study | Tian Fu | Jing, Ding, event |
| Health | Tian Rui + self | Tian Xin + user-stated issue context |
| Legal/dispute | Kinh Môn (驚門) + event | Cảnh Môn (景門) documents, Chief, Liu He, Geng as obstacle axis |
| Property | Sheng | Tian Ren, documents, contract, capital |
| Search/lost | Xuan Wu + event | Du, Horse |
| Travel | Horse | Jiu Tian, event, Kai |
| Social/cooperation | Liu He | Xiu, event, Kai |

## Family / six-relatives rule

Family questions use pillar relatives only when explicitly named:

- Year stem: parents / elders.
- Month stem: siblings / peers.
- Day stem: self.
- Hour stem: children / juniors.

No gender split is inferred automatically. A named spouse/partner is treated as a counterpart; without a user-confirmed representative it remains unresolved and receives no invented palace.

## Relationship rule

Yi/Geng are retained only as a traditional corroborating axis. KM-YONGSHEN-2.0 does not automatically say Yi = the woman and Geng = the man, and does not use those stems to identify a real person.
## Evidence-ranking integration

Each role carries:

- resolver version,
- tier,
- order,
- purpose,
- domain,
- tier weight.

Primary Useful Gods are mandatory candidates in evidence selection. Tier weight is a relevance factor only and is not a success probability.

The AI writer receives the same hierarchy and is instructed not to let a corroborator overrule a primary axis unless the deterministic planner contains strong conflicting evidence.

## UI

The technical evidence panel labels active roles in plain Vietnamese:

- Dụng thần chính
- Dụng thần phụ
- Phía đối ứng
- Đối chiếu bổ sung
- Khâu thực hiện

## Sources / provenance

Cross-source domain mapping references used for this profile:

- Qimena Useful-God overview:
  https://www.qimena.com/wiki/qimen-yongshen/
- qimen.pro wealth/useful-god pages:
  https://qimen.pro/ask/
  https://qimen.pro/ask/wealth/
- Douglas Chan Qimen overview / useful-god table:
  https://dougleschan.com/chinese/
- Six-relative pillar method:
  https://d1peixun.com/m/view.php?aid=1248
  https://www.sohu.com/a/449137793_121020386
These references are treated as interpretation conventions, not empirical validation of divination accuracy. Where traditions differ, the app keeps the rule bounded and labels it as a convention instead of universalizing it.

## Explicit non-goals

KM-YONGSHEN-2.0 does not yet:

- implement every school-specific Useful-God table,
- infer an unknown person's stem from a deity/star/door,
- infer gender from Yi/Geng,
- use Useful Gods as a medical diagnosis, legal finding or investment signal,
- calibrate tier weight as probability,
- replace the separate KM-MENH natal-family rules.

## Regression coverage

- tests/yongshen-v2.test.mjs: domain profiles, finance-stage behavior, relationship axis, family relatives, unresolved counterpart, health safety.
- Existing planner/stage tests must remain stable.
- The 480-board frozen hash remains unchanged because this phase is analysis-layer only.
