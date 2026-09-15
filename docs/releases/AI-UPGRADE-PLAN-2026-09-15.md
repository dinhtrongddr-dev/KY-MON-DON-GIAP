# AI reading upgrade implementation plan

Spec: user attachment b8952492-2d53-408d-b107-cc257a6d8705/pasted-text.txt, sections 1-9.

Goal: complete the verified gaps in the AI reading pipeline on GitHub main's source and publish the tested result to kymon.pp.ua under the user's explicit publishing instruction.

Architecture: retain the rotating-board core and existing reading structure. Extend deterministic question context, evidence provenance, prose validation and safe display. A bounded invalid AI response falls back to a clearly labeled, code-generated verified view. The user subsequently requests GPT-6 Astra; preserve the existing ChatGPT authentication flow.

Constraints: preserve the six protected core files and their hashes; use the user-requested gpt-6-astra model and preserve high effort; do not expose private credentials; keep Windows package reproducible. Sources that have not been independently verified remain labeled unverified or app conventions. Tests of plumbing are not evidence of prediction accuracy.

## Work items

- [x] Audit current modules and record evidence in AI-REQUIREMENTS-2026-09-15.md.
- [x] Transfer spinner, elapsed time, visible connection code and opt-in remembering to the authoritative checkout.
- [ ] Question context and direction: separate outcome/reply/profit/negotiation, preserve supplied roles and constraints, clarify only material missing data, capture origin and movement/seating/facing. Test stable board identity and request invalidation.
- [ ] Safe formatting: render strong emphasis while retaining Vietnamese, line breaks, tables, qualifiers and every approved word; no model HTML execution. Add semantic selection guidance and preservation tests.
- [ ] Technical validation: compare prose references to computed Can/Door/Star/Spirit, palace and technical states; verify cited claims/rules and reject wrong roles or unsupported references. Include adversarial wrong-board fixtures and valid examples.
- [ ] Evidence provenance and scope: expose source, rule conditions, counter evidence and limitations; explicitly mark app conventions and unverified mappings; keep same-palace roles from becoming independent evidence.
- [ ] Focused writing and bounded fallback: allow short readings for narrow questions with the existing schema; check determinable unsupported claims; after one repair return only deterministic verified content with a clear notice.
- [ ] Integration: run existing and new tests, package verification, real browser checks and a small real-model matrix if the configured environment permits. Record real evidence and a correctly labeled example.
- [ ] Update docs, regenerate Windows package, commit and push GitHub main without force, verify the exact Cloudflare production deployment and assets at kymon.pp.ua.

## Test gates

For each behavioral fix, write a failing regression first, implement the minimal change, and rerun the relevant tests. Then run npm run check, npm run prepare:windows, npm run package:local and npm run verify:package. Browser checks cover desktop/mobile, emphasis preservation, progress/cancel and connection preferences. Real AI checks use the existing bridge account without printing credentials and distinguish model output from fallback.

## Progress

Baseline before AI upgrade: 109 Node tests, 1 Python package test, static assets and protected core checks pass. Changes have not been pushed to GitHub yet. Local branch codex/ai-loading-remember is based on GitHub main 5f1a9c92b8fdca21c6823f8f5d9a48366a33a23a.
