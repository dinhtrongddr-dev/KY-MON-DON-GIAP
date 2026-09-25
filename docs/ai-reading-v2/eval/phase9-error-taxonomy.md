# Phase 9 error taxonomy

## V2 factual-audit calibration fixes

The first 80-sample run exposed four validator rejects. The exact generated drafts were retained; no AI reroll was used to erase failures.

| Code | Observed case | Cause | Disposition |
|---|---|---|---|
| FP-WEEKDAY-LEXEME | Q11 relationship, P1 | normalized Vietnamese sequence `mọi thứ tự thay đổi` was read as weekday `thứ tư` | fixed with context-sensitive non-temporal exclusion |
| FP-NEGATED-FUTURE-EVENT | Q12 property, P0 x2 | `không xác nhận rằng hợp đồng sẽ được ký` was treated as a promised event | fixed by explicit negation scope; positive promise remains rejected |
| FP-MENH-USER-EXPERIENCE | M03 unknown birth time, P0 | generic phrase `những chuyện bạn đã trải qua` hit broad `bạn đã` event regex | narrowed to explicit fabricated life-event verbs |

After the targeted fixes, the same saved 80 drafts revalidated **80/80** without regenerating text.

## Legacy/P0 issues observed during pilot

Legacy runs produced additional validation/repair traffic including:
- emphasis-count style gate;
- repeated verification/payment-verification gate;
- certainty/probability gate;
- numeric-money detector on natural prose;
- bounded rewrite/fallback after repeated validation failures.

These are recorded as legacy architecture behavior, not automatically copied into V2.

## Non-blocking V2 quality telemetry

`REPEATED_VERIFICATION` occurred on some P1 drafts. It remains a style report only; it does not force a rewrite or invalidate otherwise faithful prose.

## Release-blocking classes

The release remains blocked on any confirmed:
- invented placement/date/money/probability/event;
- verdict reversal;
- missing mandatory facet;
- USER_REPORTED/UNKNOWN evidence promoted into deterministic fact;
- provenance mismatch;
- saved/share/export incompatibility;
- cancel/reconnect failure;
- secret exposure.
