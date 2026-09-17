# Kỳ Môn All-in-One v17.1.0 / TG-CB-6.1

Cập nhật 17/09/2026. Source chính: GitHub `dinhtrongddr-dev/KY-MON-DON-GIAP`, Cloudflare Pages tại `https://kymon.pp.ua`. Engine TG-ROTATING-2.0 không đổi. Giao thức mạng vẫn là 5; public structured reading JSON giữ các field và ba slot `current/next/outcome`. Internal graph là `ReadingEvidenceGraph/2`, context là `QuestionContext/2`; server và browser cùng tính lại, không dùng graph cũ đã lưu.

## Luồng dữ liệu

Core deterministic -> QuestionContext / OutcomeTarget -> Actor map theo ngữ cảnh -> Evidence bundles -> Relevance và conflict priority riêng -> Role-aware translation / interactions -> Outcome dimensions -> Seven event stages -> Primary judgment -> Scenario / recommendations / timing -> Writer -> Validators -> Five tabs.

AI không tham gia lập bàn hoặc quyết định lại judgment. Mọi ánh xạ thành sự việc đời thường là quy ước diễn giải ứng dụng, không phải kiểm chứng dự báo.

| Trách nhiệm | Module |
| --- | --- |
| Core và canonical chart | `dist/qimen.mjs`, `dist/qimen/core/`, `dist/vendor/lunar.js` (6 file đóng băng) |
| Ý định, câu hỏi trọng tâm, chủ thể, thời hạn | `dist/qimen/ai/questionContext.mjs`, `outcomeTarget.mjs`, `classifier.mjs` |
| Vai và nguồn chọn | `dist/qimen/analysis/usefulGod.mjs`, `actorRelevance.mjs`, `ruleRegistry.mjs` |
| Cụm Môn/Tinh/Thần/Can/trạng thái | `dist/qimen/analysis/evidenceBundles.mjs` |
| Ưu tiên theo mục tiêu/giai đoạn | `dist/qimen/analysis/evidenceScore.mjs` |
| Mâu thuẫn theo vai và dimension | `dist/qimen/analysis/contradictions.mjs` |
| Mạng có chiều và cơ chế quan hệ | `dist/qimen/analysis/relationGraph.mjs`, `interactions.mjs` |
| Dịch cụm tượng trong ngữ cảnh | `dist/qimen/ai/realWorld.mjs` |
| Các mức kết quả độc lập | `dist/qimen/ai/outcomeDimensions.mjs` |
| Bảy tầng và điều kiện chuyển | `dist/qimen/ai/eventStages.mjs` |
| Nhận định trước writer | `dist/qimen/ai/primaryJudgment.mjs`, `scenario.mjs`, `reasoningPlanner.mjs` |
| Hành động có căn cứ | `dist/qimen/ai/recommendations.mjs` |
| Thời hạn / giới hạn ứng kỳ | `dist/qimen/ai/timingEngine.mjs` |
| So thời điểm bằng bàn riêng | `dist/qimen/ai/timingComparison.mjs` (giữ phép tính hiện có) |
| Payload và sáu nhiệm vụ writer | `dist/qimen/ai/writerContext.mjs`, `prompts.mjs` |
| Schema, vị trí, ngữ nghĩa hữu hạn | `dist/qimen/ai/readingAudit.mjs`, `technicalAudit.mjs`, `synthesisAudit.mjs` |
| Năm tab và trace | `dist/reading-view.mjs`, `dist/qimen/ui-results.mjs` |

## Hợp đồng diễn giải

`outcomeTarget` có object/event/stageAsked/realizationAsked/timeHorizon. Phần câu hỏi trực tiếp được ưu tiên hơn lời kể trước đó. Registry không còn payment/reply trùng. Ranh giới từ ngăn “thay đổi nơi” khớp nhầm “đòi nợ”; “tiến triển” không phải “tiền”.

Vai legacy vẫn phục vụ mode engine; graph cho writer lọc theo domain/intent/outcome/mode và vai người dùng cung cấp. Vai người chưa biết không có cung hoặc cạnh giả. Câu hỏi thu nhập chung không tạo customer/payer/authority. Vai có actorId, role, source, palace, stem, evidenceIds, relevance và confidenceLevel về căn cứ.

Bundle gom các alias trong cùng cung, không cộng chúng thành nhiều bằng chứng. Relevance cộng các chiều question/actor/goal/stage/strength/corroboration; modifierImportance và conflictPriority không nhân vào evidenceScore. Self/event và các Can Chi người dùng cung cấp được giữ khi chọn tối đa sáu cung.

Tài chính có opportunity, income_emergence, income_formation, payment_commitment, payment_processing, cash_realization, completion. Mỗi dimension có status, supportingEvidenceIds, limitingEvidenceIds, conditions, confidenceLevel, reason. Không có điểm tổng vận may hoặc xác suất. Sinh Môn có trên mọi bàn nên một vị trí dụng thần riêng không đủ để mọi câu thu nhập đều thành positive: cần phối hợp sự việc và cụm tượng. Các giới hạn có thể làm formation/execution/realization yếu hơn emergence.

EventStages giữ đủ POSSIBILITY -> EMERGENCE -> FORMATION -> CONFIRMATION -> EXECUTION -> REALIZATION -> COMPLETION. `observed` chỉ từ lời kể khẳng định của người dùng, không từ tượng; từng stage của bàn luôn `observed:false`. Kịch bản gồm các điều kiện chuyển, không hứa sự kiện sẽ tuần tự xảy ra. Mạng có chiều được dùng trong conditions, transitions và recommendations; quan hệ ngũ hành không biến thành tâm ý hoặc hành vi đã có.

Primary judgment gồm answerClass/main/distinction/support/limit/condition/expectedSequence/forbiddenClaims. Astra diễn đạt kết quả này. Trực Phù ở self thành quyền chủ động của người hỏi; chỉ vai authority phù hợp mới nói về thẩm quyền. Void có affectedDimension/effect/severity/resolution/evidenceIds riêng theo vai; khi nhiều vai cùng cung vẫn giữ cách tác động riêng.

## Writer và kiểm tra

GPT-6 Astra (`gpt-6-astra`), reasoning `ultra`, tài khoản ChatGPT riêng. Payload đã xử lý, không có toàn bộ raw board; giữ cụm tượng được chọn để giải thích và đối chiếu kỹ thuật. Luận sâu thêm quan hệ, phản chứng và các tầng; không ép 900-1400 từ. Tổng ngân sách 600000 ms gồm tối đa một lượt sửa; web chờ 610000 ms. Lỗi xác thực/hạn mức/mạng không được retry như lỗi nội dung.

Validators kiểm schema, claim/evidence, cung/can/trạng thái/chiều sinh khắc, mâu thuẫn với judgment theo các mẫu được hỗ trợ, sự kiện/người/tiền/thời điểm thêm vào và cảnh báo lặp nghĩa. Semantic repetition cần cơ chế và căn cứ mới; đổi claim ID đơn thuần không tính là thêm ý. Đây là bộ kiểm mẫu hữu hạn, không phải chứng minh toàn bộ ngữ nghĩa tự do. Một lượt sửa vẫn không đạt thì verified_fallback chỉ đưa dữ kiện đã tính; client tự tính lại fallback trước khi nhận.

Timing engine đổi các thời hạn tương đối đã hỗ trợ thành khoảng lịch theo UTC offset của bàn. Không triển khai ngày xuất Không/điền thực/xung Không/hợp xung định ngày. `allowedPredictions=[]`, `timingConfidence=low`. Chọn thời điểm bằng các bàn ứng viên là chức năng khác và vẫn giữ nguyên.

## UI và tương thích

Năm tab cả với bài trọng tâm: kết luận, diễn biến, phân tích, chiến lược, ứng kỳ. Phân tích cụm được đưa vào tab kỹ thuật để kết luận gọn. Mỗi tab có tối đa một collection căn cứ, mở bằng nút trace có aria-controls và hỗ trợ focus. Bài concise không bắt model tạo ba đoạn; UI dùng chuỗi điều kiện đã tính và ghi rõ đó không phải sự kiện đã xảy ra. Chữ đậm an toàn vẫn dùng DOM, không render HTML từ AI.

Mã kết nối hiển thị rõ; ghi nhớ là lựa chọn, spinner/elapsed/cancel giữ nguyên. CORS/Origin/Host, pairing, relay, launcher, hồ sơ đăng nhập không đổi. TG-CB-6.1 chặn bridge khác phiên bản để tránh ghép hai planner; cập nhật và khởi động lại runtime. Dữ liệu bàn lưu và phép an bàn không cần migration.

## Debug và tái lập

Debug chỉ là CLI riêng, không có endpoint/UI debug production. Ví dụ PowerShell: đặt `$env:QIMEN_DEBUG_REASONING='1'`, chạy `node scripts/debug-reasoning.mjs tests/fixtures/income-emergence-2026-09-16.json .release/reasoning-debug.json`, rồi bỏ biến sau khi dùng. Script mặc định từ chối chạy; whitelist chỉ thu các tầng luận và payload, không đọc cấu hình auth/pairing. Không chia sẻ dump chứa câu hỏi riêng tư.

Chạy `npm run check`, `npm run package:local`, `npm run verify:package`. Danh sách file đóng gói bao gồm fixtures JSON mới. Báo cáo actual before/after, live model và giới hạn: `docs/releases/REASONING-UPGRADE-2026-09-16.md`; bằng chứng trong `docs/releases/evidence/reasoning-*.json`.
