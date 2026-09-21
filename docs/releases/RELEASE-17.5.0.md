# Release 17.5.0

Date: 2026-09-21
Branch: main
Rules: TG-CB-6.3
Reading protocol: 6
Menh rules: KM-MENH-1.1 / protocol 2

## Included

- Phase 12 validation infrastructure and outcome-registry separation.
- Phase 13 KM-TIMING-3.0.
- Kích Hình response windows when the active role exposes a deterministic target.
- Nhập Mộ coverage for all nine visible Dun-Jia stems.
- Six-Register hidden-branch clash/combine response rules.
- Niên Mệnh corroboration in Hỏi Việc without replacing Nhật can or the primary Dụng Thần.
- Desktop Hỏi Việc layout rebalanced to Board + selected-palace reading, with Five Elements below.
- Selected-palace interpretation split into modern translation and classical gloss.
- Modern translation keeps explicit Cung, Thần, Tinh, Môn, Thiên Can and Địa Can rows.
- Mobile Niên Mệnh date mask: DD/MM/YYYY is inserted while typing; year-only input remains supported.
- iOS preview requests without Origin are accepted only under the existing host/token security model.
- AI evidence renderer handles Niên Mệnh corroboration claims without requiring an evidence bundle.
- Preview server serves qimen/case browser modules instead of returning JSON 404.

## Guardrails retained

- Core TG-ROTATING-2.0 and the protected 480-board baseline remain unchanged.
- Fu Yin / Fan Yin remain pace signals and do not fabricate dates.
- Timing candidates stay inside the user's explicit horizon.
- Case Engine cannot override deterministic verdicts, create probabilities or majority-vote outcomes.
- Phase 12 does not auto-learn from user sessions.
- Raw birth dates are not passed to the AI writer for Niên Mệnh.

## Verification

Before publishing v17.5.0:

- 475/475 Node tests passed.
- Python regression passed.
- npm run verify passed.
- Six protected core files and frozen baseline stayed unchanged.
- Browser smoke tests covered desktop/mobile layout, Hỏi Việc, Mệnh, no-known-birth-hour mode and AI connection behavior.
- The downloadable local connector package is regenerated from this exact source before main is pushed.

## Production

GitHub main is the source of truth for Cloudflare Pages. Production static URL: https://kymon.pp.ua.
The production AI bridge remains on the Named Tunnel at ai-origin.kymon.pp.ua and continues to require the pairing token.
