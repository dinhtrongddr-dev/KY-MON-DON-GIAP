# Reasoning upgrade - 2026-09-16

## Baseline audit (before implementation)

- Source: GitHub `dinhtrongddr-dev/KY-MON-DON-GIAP`, commit `3a8c4c2`, checkout `E:/kymon-site`; production `kymon.pp.ua`.
- `npm run check`: 128 Node tests, 1 Python test passed. Six protected Core files and the existing frozen board fixtures passed.
- Actual deterministic baseline captured for income emergence, cash realization, strategy, business, negotiation and relationship in `.release/reasoning-before-2026-09-16.json`. This is planner output, not a live model reading.
- Target chart: 2026-09-16 07:46 UTC+7, chaibu. Chart SHA256 `1b8dc506acb201f4c6b922da5a0dcb31cfccedfb353e904fb8ae418f188d5288`. Self Quy at Can 8; event Binh / Sinh Mon / Thien Nham / Cuu Thien at Chan 3. Self at Can 8 and capital at Kham 1 are void.
- Baseline intent `understand_event`. Self score 2.443 exceeds event/money score 2.414 because conflicts multiply relevance by 1.15. Judgment `requires_realization`, resolution asks for payment confirmation even though the question asks for emergence. Customer and contract are included without question-specific need; Chief at self translates to an approval officer.

## Source responsibilities

| Layer | Existing module under dist/qimen |
| --- | --- |
| Intent and context | ai/questionContext.mjs, ai/classifier.mjs |
| Actors | analysis/usefulGod.mjs, modes/semantics.mjs |
| Bundles and priority | analysis/evidenceBundles.mjs, analysis/evidenceScore.mjs |
| Relations | analysis/relationGraph.mjs, analysis/interactions.mjs |
| Modifiers | analysis/contradictions.mjs |
| Translation | ai/realWorld.mjs |
| Scenario and judgment | ai/scenario.mjs, ai/reasoningPlanner.mjs |
| Actions | ai/recommendations.mjs |
| Writer and validation | ai/writerContext.mjs, ai/prompts.mjs, ai/readingAudit.mjs, ai/technicalAudit.mjs |
| Timing comparison | ai/timingComparison.mjs |
| UI | ../reading-view.mjs, ui-results.mjs |

## Implementation plan

- [x] Audit source, run baseline checks, reproduce target and capture six baseline modes.
- [x] Add failing semantic regressions and structured target golden fixture.
- [x] Implement outcome targets, context-specific actors, independent relevance/conflict scores, role-specific modifiers and translation.
- [x] Implement dimension, event-stage, timing and deterministic judgment engines; integrate directed relationships and traced recommendations.
- [x] Supply compact processed writer context; shorten prompt; validate unsupported actors, events, timing, stages and repetitive warnings.
- [x] Keep five result tabs; one evidence collection per tab with accessible compact trace controls.
- [x] Run existing and new regressions, frozen Core checks, desktop/mobile replay and package checks.
- [x] Record six before/after planner cases, two accepted live Astra/ultra readings, limitations and current architecture.
- [ ] Complete the live-model mode matrix: negotiation is still quota-blocked; the failed draft is not accepted.

Publication verification is recorded separately after deployment in `.release/reasoning-publication-2026-09-17.json`, so this packaged report does not assert an unverified deployment.

## Design boundaries

Core and canonical charts remain unchanged. The internal graph will be versioned; public reading JSON keeps its existing shape and three narrative slots, backed by a seven-stage deterministic model. Legacy role definitions remain available to mode engines, while the reasoning/writer graph only includes context-relevant roles. Stages describe symbolic support separately from user-reported observations. Confidence describes evidence coverage, never predictive probability. Calendar windows describe the question horizon; traditional date prediction remains explicitly unimplemented. GPT-6 Astra / ultra and the shared 600-second one-repair budget remain unchanged.

## Kết quả bàn mẫu và sáu tình huống

Hoàn thiện ngày 17/09/2026, bản v17.0.0 / TG-CB-6.0, protocol 5. Lịch sử v16.1.0 vẫn giữ nguyên trong hồ sơ riêng.

| Mục | Trước 3a8c4c2 | Sau nâng cấp |
| --- | --- | --- |
| Ý định câu hỏi mẫu | understand_event | income |
| Mục tiêu | Không có stageAsked | emergence; realizationAsked=false |
| Căn cứ đứng đầu | Self Cấn 8, score 2.443; Matter/Money Chấn 3 score 2.414 | Matter/Money Chấn 3 theo goal/stage; Không của Self không tăng evidenceScore |
| Nhận định | requires_realization, yêu cầu xác nhận thanh toán chung | conditional_positive; phát sinh positive, thực nhận conditional |
| Thành hình | Chưa có dimension | conditional do yêu cầu từ sự việc lên người hỏi |
| Cam kết/xử lý/hoàn tất | Trộn trong kết quả chung | unresolved khi không có vai/dữ kiện riêng |
| Vai phụ | Có customer, contract dù câu hỏi không nêu | Không customer/payer/authority/decisionMaker trong graph câu thu nhập chung |
| Trực Phù ở Self | Kiểm tra người có quyền chấp thuận | Quyền xử lý và bước chủ động của chính người hỏi |
| Ứng kỳ | question_horizon_only | Khoảng hỏi 14-20/09/2026 UTC+7; low; không có ngày dự báo |

`docs/releases/evidence/reasoning-before-after-2026-09-16.json` chứa dữ liệu trước/sau thật từ planner của sáu câu: tiền phát sinh, tiền thực nhận, chiến lược hợp đồng, thương chiến, đàm phán và tình cảm. Cả sáu chartFingerprint giữ nguyên. Đây là so sánh engine, không phải sáu bài model thật. Chỉ câu hỏi phát sinh có kết luận conditional_positive ở mẫu; câu thực nhận và các mục tiêu khác giữ conditional theo đúng tầng hỏi. Không hard-code ngày, cung hay câu văn của fixture trong engine.

Nguyên văn đoạn mở của lần chạy Astra/ultra standard: “Theo tượng bàn, thiên về **có khoản thu phát sinh trong tuần này; để khoản thu thành hình, cần đáp ứng yêu cầu thực hiện trực tiếp**. Tượng phát sinh mạnh hơn tượng thực nhận, nên chưa thể kết luận tiền sẽ vào tay trong tuần.”

## Kiểm thử và bằng chứng

- Nền trước sửa: 128 Node + 1 Python, không lỗi.
- Bộ mới: 156 Node + 1 Python; bao gồm toàn bộ ca cũ và 28 ca hồi quy mới. Nhóm finance_income_emergence, finance_cash_realization, finance_payment, business_contract, business_reply, project_result, career_change, relationship, family_decision, timing, void_modifier, counterflow, supporting_flow đều có test.
- Core: 6 file giữ hash đóng băng; 480 bàn legacy không đổi; các kiểm tra 1.080 cấu hình, lịch biên và Can Chi cũ vẫn chạy. Không sửa file Core hoặc thay golden baseline.
- Regression bổ sung: Sinh Môn có mặt ở mọi bàn không làm mọi giờ đều positive; Void theo vai/giai đoạn; money vs income; lời kể trước câu hỏi không đảo ý định; vai được cung cấp giữ provenance; graph kích hoạt/cản trở dùng trạng thái thật; ngày ứng viên được so sánh nhưng không được hứa kết quả; ngày/số tiền/actor/sự kiện bịa, kết quả trái judgment và ba cảnh báo paraphrase đều bị chặn; debug tắt mặc định.
- Bài model thật standard: 94,180 giây, một lần gọi, không repair/fallback. Deep: 167,042 giây, một lần gọi, không repair/fallback. Model gpt-6-astra, effort ultra. Tình huống giả định, văn model thật. Hai bài nguyên văn được kiểm lại bằng validator trên planner cuối; file ghi riêng requestFingerprint ban đầu và finalValidation, không giả rằng lần live dùng hash cuối.
- Ca đàm phán 16/09: nhận bản nháp sau 202,243 giây; bị chặn vì nhấn đậm tách khỏi điều kiện. Lượt sửa hết hạn mức Codex. Thử lại 17/09 vẫn hết hạn mức, không có bài đạt. Không đổi model/mức suy luận hoặc dùng fixture giả làm kết quả model.
- Chrome: phát lại nguyên văn hai bài thật ở 1440px và 390px. Năm tab, một collection căn cứ mỗi tab, nút trace/focus hoạt động, không page error hoặc tràn ngang. Relay trong phép thử này được mock; không coi đây là lượt live browser -> relay -> model.
- Test UI cũ vẫn kiểm spinner, elapsed, cancel, late response, nhớ/xóa mã, chữ đậm an toàn, bàn và hướng/chế độ.
- Gói local: `npm run package:local` và `npm run verify:package` kiểm 152 file, CRC, hash binary được pin và đối chiếu từng nội dung với source. Không đóng gói pairing code, relay-admin key hoặc Codex home. Hash của gói phát hành được ghi riêng trong biên nhận triển khai để tránh tự tham chiếu.
- Điều chỉnh test có chủ đích: stakeholder chưa được nhắc không còn record “possible”; fixture văn tổng hợp được viết lại để có cơ chế riêng thay cho cảnh báo lặp; assertion rules đổi 5.1 -> 6.0. Không xóa ca kiểm thử cũ để che lỗi.

## Kiến trúc và quy tắc thay đổi

QuestionContext/2 + OutcomeTarget -> actor map theo câu hỏi -> bundle theo cung/vai -> relevance và conflictPriority độc lập -> dịch theo vai + quan hệ có chiều -> OutcomeDimensions -> EventStages -> PrimaryJudgment -> Scenario/Recommendations/Timing -> writer -> audit -> UI.

Public JSON giữ shape cũ; bảy giai đoạn bên trong ánh xạ vào ba slot narrative cũ. Năm tab vẫn có với bài concise; mạch điều kiện deterministic được ghi rõ là mạch có điều kiện. Tab kỹ thuật chứa phân tích chi tiết; kết luận nhanh không mang cả phần giải nghĩa dài. Recommendations có action/reason/sourceEvidenceIds/targetBlocker/expectedEffect. Prompt rút về sáu nhiệm vụ; việc phát hiện các mẫu lỗi chuyển vào code, vẫn một lượt sửa có giới hạn và verified fallback.

## File thay đổi

### File đã sửa

- `AI-EVAL.md`
- `HUONG-DAN-LOCAL.md`
- `QIMEN-ARCHITECTURE.md`
- `README.md`
- `dist/audit.html`
- `dist/downloads/ky-mon-ai.zip`
- `dist/index.html`
- `dist/qimen/ai/classifier.mjs`
- `dist/qimen/ai/contextBuilder.mjs`
- `dist/qimen/ai/prompts.mjs`
- `dist/qimen/ai/questionContext.mjs`
- `dist/qimen/ai/readingAudit.mjs`
- `dist/qimen/ai/realWorld.mjs`
- `dist/qimen/ai/reasoningPlanner.mjs`
- `dist/qimen/ai/recommendations.mjs`
- `dist/qimen/ai/scenario.mjs`
- `dist/qimen/ai/writerContext.mjs`
- `dist/qimen/analysis/contradictions.mjs`
- `dist/qimen/analysis/evidenceBundles.mjs`
- `dist/qimen/analysis/evidenceScore.mjs`
- `dist/qimen/analysis/interactions.mjs`
- `dist/qimen/analysis/ruleRegistry.mjs`
- `dist/qimen/analysis/usefulGod.mjs`
- `dist/qimen/modes/semantics.mjs`
- `dist/qimen/ui-results.mjs`
- `dist/reading-core.mjs`
- `dist/reading-view.mjs`
- `dist/styles.css`
- `package-lock.json`
- `package.json`
- `scripts/package-local.py`
- `scripts/verify-release.mjs`
- `tests/ai-ui.test.mjs`
- `tests/bridge-integration.test.mjs`
- `tests/deep-reading.test.mjs`
- `tests/reading-fixture.mjs`
- `tests/reasoning-context.test.mjs`

### File mới

- `dist/qimen/ai/eventStages.mjs`
- `dist/qimen/ai/outcomeDimensions.mjs`
- `dist/qimen/ai/outcomeTarget.mjs`
- `dist/qimen/ai/primaryJudgment.mjs`
- `dist/qimen/ai/synthesisAudit.mjs`
- `dist/qimen/ai/timingEngine.mjs`
- `dist/qimen/analysis/actorRelevance.mjs`
- `docs/releases/REASONING-UPGRADE-2026-09-16.md`
- `docs/releases/evidence/reasoning-astra-deep-2026-09-16.json`
- `docs/releases/evidence/reasoning-astra-income-2026-09-16.json`
- `docs/releases/evidence/reasoning-astra-strategy-2026-09-16.json`
- `docs/releases/evidence/reasoning-astra-strategy-retry-2026-09-17.json`
- `docs/releases/evidence/reasoning-before-after-2026-09-16.json`
- `docs/releases/evidence/reasoning-browser-2026-09-16.json`
- `scripts/debug-reasoning.mjs`
- `tests/fixtures/income-emergence-2026-09-16.json`
- `tests/reasoning-guardrails.test.mjs`
- `tests/reasoning-stages.test.mjs`

## Giới hạn còn lại

- Chưa triển khai ứng kỳ truyền thống định ngày: xuất Không, điền thực, xung Không, hợp/xung định ngày, Can/Môn/Mã định ngày. Chỉ có khoảng thời hạn và so sánh các bàn người dùng chọn.
- Mapping và tổng hợp là quy ước ứng dụng, chưa hiệu chuẩn bằng kết quả thực nghiệm. Không phải xác suất hoặc bảo đảm lời dự báo đúng.
- Validator ngữ nghĩa dùng mẫu hữu hạn. Nó chặn các ca đã đặc tả, không chứng minh mọi cách diễn đạt tự do đều đúng hoặc không thể bịa.
- Nhận dạng ý định/lời kể là quy tắc hữu hạn; câu nhiều mục tiêu hoặc cách diễn đạt mới có thể cần bổ sung. Không tự coi lời hỏi là sự kiện đã xảy ra.
- Bảy tầng hiện dùng bộ nhãn chuyên biệt cho finance/business/project/career/relationship/family; các lĩnh vực còn lại dùng nhãn tổng quát trong cùng pipeline, cùng engine mode hiện có.
- Chưa có nguồn truyền thống đã kiểm chứng riêng cho mọi ánh xạ actor hiện đại. Không thêm phép “hợp” mới ngoài graph đang có; cạnh cùng cung/đối cung và sinh khắc có phạm vi công bố.
- Review agent không chạy được vì môi trường trả 404 thiếu credentials; đã tự rà và bổ sung test, không nhận là có review độc lập thành công.
- Ma trận model thật nhiều mode chưa hoàn tất vì quota; ca đàm phán mới chưa đạt và cần chạy lại khi hạn mức được đặt lại. Hai lượt income đã qua không thay cho nghiệm thu toàn bộ chất lượng diễn giải.

## Phát hành

Source chính E:/kymon-site; GitHub main -> Cloudflare Pages ky-mon-don-giap -> kymon.pp.ua. Dùng bản rules 6.0 nên bộ kết nối phải được cập nhật đồng bộ; protocol và auth không đổi. Private config ngoài thư mục app được giữ. Biên nhận triển khai và đối chiếu file production được lưu sau khi publish; phần này không tự coi publish đã thành công trước khi kiểm tra.
