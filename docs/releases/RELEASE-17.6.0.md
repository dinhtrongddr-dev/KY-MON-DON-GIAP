# Release 17.6.0

Date: 2026-09-22
Branch: main
Rules: TG-CB-6.3
Reading protocol: 6
Menh rules: KM-MENH-1.1 / protocol 2

## Scope

v17.6.0 is a UX/UI release. It does not change the deterministic Qimen engine or the protected TG-ROTATING-2.0 core.

## Included

- Primary Hỏi Việc and Mệnh pages are simplified to the core workflow:
  input -> AI reading -> Four Pillars -> Qimen board -> palace interpretation -> Five Elements.
- Help, AI/VPS connection instructions, and system/technical information moved to dedicated top-level pages.
- AI pairing input now shows compact × / … / ✓ connection state with an inline Enter-style check button.
- AI reading is placed before Four Pillars on both Hỏi Việc and Mệnh.
- One floating circular switch navigates between Board and AI result.
- Hỏi Việc and Mệnh share the same compact mobile navigation language.
- Textual color legends such as "Mộc · xanh lá" were removed.
- Advanced IANA/DST/longitude/latitude controls are hidden from the primary UI while the underlying engine support remains.
- Niên Mệnh and manual representative inputs are unified by related person:
  birth date/year is the normal field, while manual Can-Chi selection is nested under Advanced.
- Mobile Niên Mệnh date masking, iOS Origin handling, and Nian Ming evidence rendering fixes from the preview series are included.
- The local bridge allowlist serves the new guide.html, server.html, info.html and info.mjs resources.

## Guardrails retained

- Niên Mệnh remains corroborative and cannot replace Nhật can or the primary Dụng Thần.
- Manual representatives are used only when the user explicitly selects them.
- KM-TIMING-3.0, KM-CASE-1.0, KM-VALIDATION-1.0 and KM-OUTCOME-REGISTRY-1.0 behavior is unchanged.
- Case Engine cannot override deterministic verdicts, majority-vote outcomes or fabricate probabilities.
- Fu Yin / Fan Yin remain pace signals only.
- No automatic learning from user sessions.

## Verification

Before publishing v17.6.0:

- 485/485 Node tests passed.
- Python regression passed.
- npm run verify passed.
- Six protected core files and the frozen baseline stayed unchanged.
- Mobile and desktop browser smoke checks covered Hỏi Việc, Mệnh, Guide, Server and Info pages.
- No horizontal overflow was observed in the audited mobile layouts.
- The downloadable local connector package is regenerated from this exact source.

## Production

GitHub main is the source of truth for the production site at https://kymon.pp.ua.
The production AI bridge remains behind the Named Tunnel at ai-origin.kymon.pp.ua and continues to require the pairing token.
