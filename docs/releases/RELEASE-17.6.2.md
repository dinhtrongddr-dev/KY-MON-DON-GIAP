# Release 17.6.2

Date: 2026-09-23

## Scope

v17.6.2 improves the floating Bàn ↔ AI switch in both Hỏi Việc and Mệnh. It does not change Qimen chart calculation, deterministic analysis, AI protocol, model routing, or provider fallback.

## New result-ready behavior

- Before an AI result exists, the floating button is **Xem Bàn**.
- When a validated AI reading finishes, the button immediately changes to **Xem AI**.
- The button pulses until the user taps it, so a result that arrived while the user was reading the board is obvious.
- The app no longer force-scrolls to the AI result at completion.
- Tapping **Xem AI** scrolls to the AI reading, clears the pulse, and changes the switch back to **Xem Bàn**.
- Tapping **Xem Bàn** returns to the board and exposes **Xem AI** again without replaying the unread-result pulse.
- Editing chart/question/birth inputs or starting a new invalidated state clears the AI-ready alert.

## Accessibility

When reduced-motion is requested, the infinite pulse animation is disabled and replaced by a persistent high-contrast outline.

## Compatibility

TG-CB-6.3 / protocol 6 and KM-MENH-1.1 / protocol 2 are unchanged.
