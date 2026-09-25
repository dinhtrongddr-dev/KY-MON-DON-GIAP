# Writer and PDF continuation - 2026-09-24

Baseline: develop, 5a52c5eefec13201e28eb847797890490bef09ff, app 17.6.3,
TG-CB-6.3, Reading Protocol 6, KM-MENH-1.1, Menh Protocol 2.
Scope follows the user's attached handover. Production publishing is excluded.
Protected chart/core files must remain unchanged.

## Audit at handover

| Module | Status | Evidence / remaining work |
| --- | --- | --- |
| Deterministic engine, semantic matrix, roles | CURRENT | Existing regression suite; protected files unchanged. |
| Writer section contract | PARTIAL | New meaning/evidence schema and audit exist; UI and old technical-first prompts still need alignment. |
| Narrative contract / question facets | PARTIAL | Planner has semantic_frame.related_considerations; no explicit surface contract yet. |
| Meaning-first UI | BROKEN for new sections | Renderers still read text; connect structured fields, retain legacy readings. |
| Provider routing and repair | CURRENT | Sol xhigh -> Gemini -> Prism Astra; validator repair retains route. Live access still to verify. |
| PDF capture + selectable prose | PARTIAL | Download wired; browser download, duplicate tabs, cancellation and layout not yet verified. |
| Spirit orientation | CURRENT, verification pending | Existing KM-SPIRIT-ACTIVATION and shared back-facing helper. |
| Exact timing selection | CURRENT, verification pending | Confirm date/hour/minute flow in source and UI. |
| Live AI / preview | MISSING verification | No live AI or deployment claimed by this work. |

Root cause: text combines meaning with technical statements, prompts demand technical-first
paragraphs, and rendering guesses the split from bold spans. Structured sections remove
that display dependency while the validator continues checking both fields.

## Execution order

1. Complete structured Writer contract, prompts, renderer, protocol compatibility and focused tests.
2. Expose a bounded narrative contract from existing planner facts and question facets.
3. Complete PDF capture/text export and browser verification at desktop/mobile widths.
4. Run full tests/verify, check protected-file diff, inspect live AI capability and preview constraints.
5. Fresh review of the final diff, fix material findings, record results and open limitations.

## Verification ledger

- Before the new Writer edits: 528 JS tests passed, 0 failed/skipped; Python packaging test passed; verify passed (handover evidence).
- Structured audit subset: 23/23 passed before renderer wiring (handover evidence).
- Browser smoke before continuation only established page load and initially hidden PDF buttons; no actual download was verified then.

## Compatibility decision

Reading Protocol 7 and Menh Protocol 3 identify the new Writer response contract.
Old clients cannot read structured sections, so retaining 6/2 would incorrectly
advertise compatibility. Existing protocol checks reject mixed deployments before
AI generation. Deploy the matching frontend and server together in an isolated
preview; keep production on its matching pair. The new validators still accept
legacy sections for deterministic fallbacks and stored readings, which does not
make an old server/client deployment compatible with this release.
