# Release 17.6.3

Date: 2026-09-23

## Scope

v17.6.3 improves AI-reading readability in both Hỏi Việc and Mệnh. It does not change Qimen chart calculation, deterministic reasoning, provider routing, or AI protocols.

## Default reading mode

- Technical Kỳ Môn basis remains in the generated prose and keeps its original position before the plain-language interpretation.
- When a paragraph follows the required pattern “technical basis → **plain-language meaning**”, the technical prefix is tagged separately in the renderer.
- The technical prefix is hidden by default; the translated/plain-language meaning remains visible.
- A global button above the reading starts as **Hiện căn cứ Kỳ Môn**.
- Turning it on reveals the original technical prefix in place and changes the button to **Ẩn căn cứ Kỳ Môn**.
- Turning it off restores the translation-first reading view without regenerating or changing the AI content.
- Paragraphs that do not contain a verified translated-emphasis segment are left intact rather than being guessed and partially hidden.

## Writer contract

Both Hỏi Việc and Mệnh prompts now explicitly require every paragraph that uses technical Qimen basis to place all technical sentences first, followed by one or two bold natural-language interpretation sentences. Technical sentences must not be inserted after the translated portion. This keeps the stored prose auditable while allowing the UI to hide only the technical prefix.

## Safety and compatibility

- Raw AI HTML is still never interpreted.
- The toggle is presentation-only; no claim, evidence, chart, ranking, or model output is rewritten.
- Existing per-claim “Xem căn cứ Kỳ Môn” evidence controls and the dedicated technical tab remain available.
- TG-CB-6.3 / protocol 6 and KM-MENH-1.1 / protocol 2 are unchanged.
