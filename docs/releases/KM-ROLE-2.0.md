# KM-ROLE-2.0

Date: 2026-09-21
Status: upgrade branch implementation
Scope: event-reading role / Host-Guest / agency layer. Board construction remains unchanged.

## Goal

Add a deterministic layer that separates five questions which were previously mixed together:

1. Who/what does each Useful-God role represent?
2. Is the role acting from a Host-like or Guest-like posture in this question?
3. Is the role in the Inner or Outer plate?
4. How much symbolic agency does that role have after Strength and Structure are applied?
5. Which role symbolically supports or pressures which other role?

None of these fields establishes real-world intent, legal authority, competence, or a winner.

## Host / Guest is contextual

Classical Qimen sources explicitly warn that Host and Guest are not fixed identities. The traditional discussion includes several contextual frames:

- first mover / moving side can be Guest,
- later responder / static side can be Host,
- Heaven Plate can be Guest and Earth Plate Host,
- the roles can reverse according to the matter being handled.

KM-ROLE-2.0 therefore does not keep the old simplification “self = Host, event = Guest” as the operative rule. That mapping remains only as a legacy reference for compatibility.

Primary source:
https://ctext.org/wiki.pl?chapter=961040&if=gb&remap=gb

## Time-stem action posture

Qimen Dunjia Tong Zong, volume 11, gives a tactical distinction:

- 甲乙丙丁戊 hour stems: Guest / first movement is emphasized,
- 己庚辛壬癸 hour stems: Host / later response is emphasized.

KM-ROLE-2.0 stores this as timeBias:

- guest_first_move
- host_later_response

This is an action-posture signal only. It cannot override Void, Tomb, Punishment, Strength, the selected Useful God, or the requested outcome stage.

Source:
https://ctext.org/wiki.pl?chapter=473804&if=gb
## Question posture

The app separately detects whether the wording says that the user is initiating or receiving an action.

Examples:

- “Tôi chủ động liên hệ / gửi / đàm phán ...” -> initiator -> Guest-like posture.
- “Họ liên hệ trước / tôi đang chờ phản hồi ...” -> receiver -> Host-like posture.
- No clear action wording -> undetermined.

The parser binds action verbs to the user or to explicit “nên/cần/muốn” constructions; a bare occurrence of “liên hệ” is not enough to label the user the initiator.

The question posture and time-stem posture are stored separately. If they disagree, the result is counter_time, not a forced reversal of the user’s real-world role.

## Inner / Outer plate

The app uses the same bounded Inner/Outer convention already used by KM-YINGQI-2.0:

- Yang Dun: 1 / 8 / 3 / 4 are Inner; 9 / 2 / 7 / 6 are Outer.
- Yin Dun: 9 / 2 / 7 / 6 are Inner; 1 / 8 / 3 / 4 are Outer.

Inner is read as a tendency toward nearer/faster/more direct scope; Outer as farther/slower/more externally dependent scope.

This convention is a procedural interpretation convention rather than a claim of empirical distance or timing.

Secondary procedural reference:
https://www.sohu.com/a/550238240_324894

## Party model

Each active role is classified into a practical party class:

- self
- matter
- counterpart
- competitor
- authority
- resource
- operational
- family
- supporting

A symbolic authority proxy is not treated as a confirmed real decision-maker. Only a user-supplied decisionMaker mapping is a resolved external person.
## Agency

Agency is the role’s symbolic capacity to act within the reading.

It is derived from:

- KM-STRENGTH-2.0 strength of the actual role type,
- actor-specific Four-Harm conditions,
- actor-specific adverse Ten-Stem responses.

Output bands:

- strong
- usable
- constrained
- unresolved

Agency never means actual legal authority, actual willingness, competence, or a probability of success.

A role may therefore be:

- Guest-like but constrained,
- Host-like but strong,
- Inner but constrained,
- Outer but usable.

These dimensions are intentionally independent.

## Directional influence

Five-phase relations are converted into a directional role graph:

- generation -> symbolic support from driver to target,
- control -> symbolic pressure from driver to target,
- same element -> alignment to check,
- same palace -> interdependence, not a directional advantage.

If the driver is symbolically strong while the target is constrained, the engine may mark driver_capacity_advantage. This means only that the symbolic pressure/support has more capacity in the current reading. It must not be written as “the driver wins”.

## Multiple actors and evidence independence

User-supplied mappings for customer, competitor and decision-maker remain separate parties.

Unknown people remain unresolved and receive:

- no palace,
- no strength,
- no agency ranking.

When several roles occupy the same palace, KM-ROLE-2.0 marks them as a shared_palace_cluster.

They share one condition cluster and must not be counted as independent votes. The planner also recomputes this after relevance filtering, so an inactive alias does not falsely make an active role look duplicated.
## AI / UI policy

The writer receives:

- Host/Guest posture,
- Inner/Outer zone,
- agency band and plain-language meaning,
- selected important directional influences,
- same-palace clusters.

The normal UI displays plain Vietnamese such as:

- Nội bàn / Ngoại bàn
- thế Chủ / thế Khách
- chủ động tốt / có thể tác động / đang bị hạn chế

The AI must not output a competitive verdict such as “bên A thắng bên B”, “A mạnh hơn nên chắc thắng”, or treat internal role fields as probability.

## Interaction with previous phases

KM-YONGSHEN-2.0 answers: which role matters?
KM-STRUCTURE-2.0 answers: what condition affects that role?
KM-STRENGTH-2.0 answers: how much symbolic capacity does that role have?
KM-ROLE-2.0 answers: what posture does the role occupy and in which direction does it interact with other roles?
KM-YINGQI-2.0 remains responsible for bounded timing.

Role posture cannot erase a direct blocker from Structure or a weak primary Useful God from Strength.

## Explicit non-goals

KM-ROLE-2.0 does not:

- infer an unknown person’s stem,
- infer hidden motives or feelings,
- prove who has real authority,
- predict who will win a dispute or negotiation,
- equate Guest with “good/aggressive” or Host with “weak/passive”,
- turn Inner/Outer into a guaranteed distance/date,
- count same-palace role aliases as independent evidence.

## Regression coverage

tests/role-v2.test.mjs verifies:

- Yang/Yin Inner/Outer mapping,
- initiating vs receiving Host/Guest posture,
- hour-stem Guest/Host action bias,
- unresolved counterpart safety,
- user-supplied counterpart dynamics,
- directional pressure without a winner field,
- same-palace evidence de-duplication,
- three separately mapped external actors,
- writer exposure without probability/winner/score fields,
- strategy posture cannot override direct blockers.

The frozen 480-board hash must remain unchanged because Phase 5 modifies the analysis layer only.
