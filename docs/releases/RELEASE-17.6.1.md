# Release 17.6.1

Date: 2026-09-23

## Scope

v17.6.1 improves **Chọn thời điểm** without changing the protected TG-ROTATING-2.0 chart core, TG-CB-6.3 protocol 6, or the deterministic comparison convention.

### Chọn ngày

- Default timing-entry mode.
- User selects 2–12 calendar dates only.
- The browser deterministically scans the 12 double-hour centres for each date: 00:00, 02:00, …, 22:00.
- Each centre represents the middle of one Tý–Hợi time branch, avoiding ordinary branch boundaries.
- For every date, the app keeps the earliest candidate among the best deterministic rank for that date, then sends those concrete date-times through the existing comparison pipeline.
- IANA/DST invalid civil times are skipped; a day remains usable when enough valid time slots remain.

### Giờ cụ thể

- Keeps the existing exact comparison flow.
- User selects 2–12 date-times to the minute.
- No automatic scan is performed.

## Compatibility

The date scan happens in the website before the AI request is built. The request still contains the same concrete `candidates` date-time strings understood by TG-CB-6.3 / protocol 6. No bridge protocol bump is required.

## Guardrails

- The ranking rule is unchanged: fewer deterministic blockers first, then action-fit signals; ties remain ties.
- Date scan does not create a probability, guarantee, or predicted outcome date.
- The selected date-time is a representative action time for comparison, not a claim that an event will happen then.
- Exact-time mode remains available whenever the user already has fixed appointments.

## Tests required before production

- Date scan regression, invalid/duplicate date rejection, and DST-gap handling.
- UI toggle and value-preservation tests for Chọn ngày ↔ Giờ cụ thể.
- Full Node test suite and Python package regression.
- `npm run verify`.
- Rebuilt local package verification, including JPG assets.
- Browser smoke on develop preview at mobile width, including no horizontal overflow and one end-to-end date scan producing concrete hourly candidates.
