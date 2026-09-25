# Writer Layer refactor audit
Baseline: develop 5a52c5e (17.6.3). 527 JS tests + 1 Python test pass.
Production runs from a separate packaged directory; no deployment is authorized.

## Dependency map
- reading-core -> contextBuilder -> reasoningPlanner -> writerContext -> interpret
- interpret -> deliberation -> prompts + reading schema -> readingAudit
- readingAudit -> technicalAudit + synthesisAudit + formatting
- menh-reading -> deterministic Mệnh result -> writer-context -> menh-interpret
- menh-interpret -> prompts + schema -> reading-audit
- reading-view / menh-view -> reading-format -> technical toggle

## Gate classification
| Gate | Class | Treatment |
| --- | --- | --- |
| Core hashes, 480 boards, roles, primary judgment, timing | A/B | Preserve; contract is downstream |
| Claim/rule/evidence existence, actor and palace binding | A/B | Validate before writing and on output |
| Stage escalation, invented facts/dates/money/probability | A/C | Preserve; add independent semantic fidelity audit |
| Mortality/medical/children/marriage determinism | C | Preserve |
| Mệnh overview must say Phục/Phản Ngâm, precedence, cap, veto | D | Replace with applied structured global modifier |
| Forced current-next-outcome for all full layouts | D/E | Only requested development; explicit answer facets otherwise |
| Length floors, bold technical prefix, prose certainty keywords | D/E | Coverage/structured certainty; style feedback not engine logic |
| Whole-sentence event/stage repair boilerplate | E | Bounded structured rewrite; verified natural fallback |
| formatParts guessing technical before bold | E | No heuristic hiding; explicit technicalEvidence field |

The raw writer contexts remain available to the reasoning adapter and historical
audit. The new surface writer must never receive their raw engine profiles.
Historical readings keep their original text; they must not be relabelled or
partially hidden by a guessed technical boundary.

## Validation design
Contract gates lock verdict, stage, certainty, provenance, scope and modifiers.
Technical prose is generated from verified data, not composed by the model.
Surface fidelity is checked against allowed statements, not mandatory phrases.
Valid IDs alone are not proof that prose preserves their meaning.
