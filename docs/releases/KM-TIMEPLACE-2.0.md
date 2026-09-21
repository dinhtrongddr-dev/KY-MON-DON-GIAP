# KM-TIMEPLACE-2.0

Date: 2026-09-21
Status: upgrade branch implementation
Scope: civil-time and place metadata for event readings. Frozen board construction remains unchanged.

## Goal

KM-TIMEPLACE-2.0 separates three concepts that must not be silently mixed:

1. the civil wall-clock time supplied by the user;
2. the UTC offset that converts that civil time to an instant;
3. optional longitude-based solar-time comparison.

The existing fixed UTC-offset path remains the default and compatibility path.

## Default compatibility mode

`fixed_offset` is the default when no TimePlace policy is supplied.

In this mode:

- the submitted year/month/day/hour/minute and `tzOffset` enter the frozen core unchanged;
- no IANA lookup occurs;
- no DST rule is inferred;
- coordinates, if supplied, produce metadata only;
- solar-time comparison never changes the board.

This preserves the pre-Phase-6 behavior and the frozen 480-board hash.

## Opt-in IANA civil mode

`iana_civil` is explicit opt-in.

The user supplies an IANA zone such as:

- `Asia/Ho_Chi_Minh`
- `America/New_York`

The resolver interprets the submitted date/time as a local civil wall time and resolves the UTC offset applicable to that named zone at that date.

The unchanged board engine then receives the same local date/time fields plus that resolved minute-precision UTC offset.

IANA source background:
https://www.iana.org/time-zones/tz-link
https://www.iana.org/time-zones/theory

## DST gaps and repeated times

A local wall time can be invalid or ambiguous around clock transitions.

### Nonexistent time

If no UTC instant maps back to the submitted local wall time, the input is rejected.

Example regression fixture:

`America/New_York · 2024-03-10 02:30`

That wall time is inside the spring-forward gap and must not be guessed or normalized.

### Repeated time

If two UTC instants map to the same wall-clock minute, default behavior is reject and require an explicit choice:

- `earlier`
- `later`

Regression fixture:

`America/New_York · 2024-11-03 01:30`

The earlier occurrence uses UTC−04 and the later occurrence uses UTC−05.

The app never silently selects one.

## Runtime timezone database provenance

The implementation intentionally uses the runtime `Intl.DateTimeFormat` IANA database in `dist/qimen/timePlace.mjs` so the same JavaScript resolver runs in browser and server. It is an adapter before the frozen core, not a protected-core module.

The server status endpoint exposes `tzdbVersion` when Node reports it.

At implementation time on the develop VPS:

- Node v22.23.2 reported tzdb 2026a;
- the Debian OS zoneinfo package reported 2026c;
- the resolver uses Node/Browser Intl, not the OS `/usr/share/zoneinfo` database.

IANA release 2026d was published on 2026-09-11:
https://www.iana.org/time-zones/releases/2026d

Therefore KM-TIMEPLACE-2.0 does not claim that every runtime has the latest IANA release.

Browser and server independently recompute the deterministic reading fingerprint. If an IANA rule difference makes them produce different effective boards, the server blocks the reading instead of accepting a mismatched chart.

## Historical limitations

The IANA database is designed primarily around civil-time agreement after 1970 and explicitly warns that pre-1970 data can be incomplete or unreliable.

Source:
https://www.iana.org/time-zones/theory

KM-TIMEPLACE-2.0 therefore:

- records the IANA zone used;
- does not describe IANA as authoritative historical truth;
- rejects an effective historical UTC offset that contains seconds because the frozen core accepts minute-precision offsets only;
- never rounds a sub-minute historical offset into a different instant.

## Timing-comparison candidates

When mode = timing and IANA civil mode is active, every candidate local date/time is resolved independently through the named IANA zone.

This matters when candidates cross a DST transition.

Fixed-offset mode retains the prior behavior: every candidate uses the same submitted fixed offset.

Solar-time metadata does not alter any timing candidate board.

## Optional coordinates

The advanced form accepts:

- longitude −180..180;
- latitude −90..90.

Longitude is required for solar-time comparison. Latitude is retained as location metadata but is not used to assign a palace, actor, direction or result.

The application does not request browser geolocation. Coordinates exist only when the user enters them.

## Apparent solar-time comparison

The solar metadata follows the NOAA Global Monitoring Laboratory approximation:

`gamma = 2π / days_in_year × (day_of_year − 1 + (hour − 12)/24)`

`eqtime = 229.18 × (...)`

`time_offset = eqtime + 4 × longitude − 60 × timezone`

Longitude is positive east and timezone is hours from UTC.

Source:
https://gml.noaa.gov/grad/solcalc/solareqns.PDF

The output records:

- longitude;
- standard meridian implied by civil offset;
- local-mean-solar correction;
- equation of time;
- apparent-solar correction;
- apparent solar clock.

Every solar record is tagged:

`application: metadata_only`

This phase does not establish a Qimen-school rule requiring true/apparent solar time, and it never feeds the corrected solar clock back into board construction.

## AI and user-interface policy

The AI writer receives only the declared civil-time basis and bounded TimePlace metadata.

It is forbidden to:

- recalculate pillars from solar time;
- claim that solar correction is a predictive signal;
- silently switch a fixed-offset reading to IANA;
- silently choose an ambiguous DST occurrence;
- invent a location or coordinates.

The technical UI shows the TimePlace basis in plain language.

## Transport and fingerprint policy

A reading request preserves both:

- the original user civil input;
- the explicit TimePlace request policy.

The browser and server each resolve the policy and regenerate the board.

This prevents a browser-computed IANA offset from being smuggled into the server as if it were a user-entered fixed offset.

For IANA mismatches, the bridge returns a specific error advising the user to update browser/server timezone data or temporarily use fixed UTC offset.

## Mệnh scope

KM-MENH-1.0 currently retains its frozen birth-time contract and is not silently changed by Phase 6.

The TimePlace resolver is reusable infrastructure for a future KM-MENH-1.1/2.0 upgrade, where migration of natal inputs to IANA must have its own fixtures and compatibility policy.

## Non-goals

KM-TIMEPLACE-2.0 does not:

- mutate the six protected core files;
- replace the fixed-offset core;
- use device geolocation;
- geocode a place name;
- infer longitude from an IANA zone;
- claim IANA is authoritative for all historical civil time;
- silently round historical second-level UTC offsets;
- automatically use true/apparent solar time to construct the Qimen board;
- treat geographic metadata as divination evidence.

## Regression requirements

`tests/timeplace-v2.test.mjs` verifies:

- fixed-offset path exactly preserves the legacy board;
- coordinates do not modify the board;
- Ho Chi Minh IANA civil time resolves to +07 for the modern fixture;
- New York repeated hour requires disambiguation and yields two distinct instants;
- New York spring-forward gap is rejected;
- timing candidates re-resolve their offset across DST;
- reading requests retain original input plus TimePlace policy;
- writer receives solar comparison as metadata only;
- invalid coordinates are rejected.

The frozen 480-board SHA-256 must remain:
`d384c9f4d42a94bd80d709eac2c865943ac5ac4f7e86489d84b003edd2b465ea`.
