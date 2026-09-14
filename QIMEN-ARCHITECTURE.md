# All-in-One Qimen AI · v16 / TG-CB-5.0

## Lõi giữ nguyên

`dist/qimen.mjs`, `dist/vendor/lunar.js` và toàn bộ `dist/qimen/core/` giữ nguyên so với v15. Cùng một triển khai lịch/an bàn phục vụ giao diện, preparation và từng ứng viên Timing. `QimenBoard/1` vẫn bất biến; `QimenAnalysis/1` bổ sung metadata vai và không ghi trở lại bàn.

Mốc 480 bàn (hai pháp, 1900/2024/2026/2100, 12 tháng, năm mốc giờ/múi giờ) giữ hash `d384c9f4d42a94bd80d709eac2c865943ac5ac4f7e86489d84b003edd2b465ea`. Không cập nhật mốc này để làm test xanh. Bộ cũ vẫn kiểm 1.080 cấu hình chuyển bàn, tám fixture cổ thư và giao tiết HKO.

## Pipeline và vị trí mã

| Module | Vai trò |
|---|---|
| `ai/questionContext.mjs` | Tách domain/mode/questionType, chủ thể, giai đoạn, thời hạn, dữ kiện người dùng và từ vựng liên quan |
| `modes/semantics.mjs` | Registry ngữ nghĩa của business, project, relationship, family, career, recruitment, study, search, health, legal, finance, property, travel, social |
| `analysis/usefulGod.mjs` | Tái sử dụng Nhật/Thời, dụng thần chuyên đề và đại diện khai báo; gắn vai ngữ nghĩa theo domain |
| `analysis/evidenceBundles.mjs` | Gom các tượng của một cung với các vai liên quan; điều kiện mộ/hình chỉ gắn đúng can đại diện |
| `analysis/contradictions.mjs` | Điều kiện hỗ trợ/cản, điều kiện chi phối và dấu hiệu tháo gỡ |
| `analysis/evidenceScore.mjs` | Xếp relevance; giữ người/việc chính, thường chọn 4 cụm, tối đa 6 khi luận sâu hoặc cần giữ đại diện nhập tay, không đếm bí danh cùng cung là chứng cứ độc lập |
| `analysis/relationGraph.mjs`, `interactions.mjs` | Nút có cung/lớp/điều kiện; cạnh có chiều; phân tích nguồn lực, sức ép, phụ thuộc và đồng cung |
| `ai/realWorld.mjs` | Phối hợp Môn × Tinh × Thần × vai × domain × trạng thái, tạo khái niệm/điều kiện để AI diễn đạt |
| `ai/scenario.mjs`, `recommendations.mjs` | Dùng quyết định của registry mode hiện tại, dựng hiện trạng → bước chuyển → kết quả, nhánh thay thế và hành động có căn cứ |
| `ai/reasoningPlanner.mjs` | Điều phối `ReadingEvidenceGraph/1`, đóng băng claims/graph/scenario/recommendations |
| `ai/writerContext.mjs` | Chọn planner và facts cần thiết cho model; không gửi lại toàn bộ QimenBoard và Analysis |
| `schemas/reading.mjs`, `ai/readingAudit.mjs` | Schema v5 và validation/relevance checks; dùng chung ở browser và bridge |
| `reading-view.mjs` | Năm tab, căn cứ đóng mặc định, chỉ textContent, nút đối chiếu cung |

Điểm vào công khai vẫn là `prepareReading(body)`. Kết quả có `context.allInOne.questionContext` và `context.allInOne.reasoning`. Context đầy đủ dùng để băm/kiểm chứng; `buildWriterContext(context)` là payload rút gọn của AI. Không truyền mã kết nối vào model. Không thêm lượt AI planner: planner chạy bằng mã, writer gọi một lượt và chỉ sửa tối đa một lần khi không qua validator.

## Các quy ước phải giữ rõ

- Domain và ý định độc lập: Thương chiến có thể trả lời prediction hoặc strategy. Manual mode được giữ; classifier vẫn là quy tắc hữu hạn có thể nhầm câu đa nghĩa, người dùng có thể đổi mode/chủ đề.
- Dữ kiện người dùng được giữ nguyên nguồn. Từ vựng ngành là gợi ý, không phải bằng chứng có bộ phận/người/hồ sơ ấy. Không hard-code kết quả của ví dụ vệ sinh công nghiệp.
- Vai cùng một cung dùng chung bundle, nhưng từng can chỉ nhận mộ/hình của chính nó. Khách/đối thủ/người duyệt chưa khai báo có cung null. Không suy danh tính, giới tính hoặc tâm ý từ một thần.
- Scoring là ưu tiên giải thích: tượng có khí làm tăng mức cần chú ý; điều kiện cản cũng tăng mức cần chú ý. Điểm không phải cát/hung, tỷ lệ hoặc xác suất đã hiệu chuẩn.
- Nút thắt xét toàn bộ cụm trọng tâm, gồm cung mục tiêu và người quyết định đã khai báo. Điều kiện chi phối đi cùng kết luận, chặng kết quả và hành động ưu tiên; graph rút gọn luôn giữ đủ hai đầu mỗi cạnh.
- Graph là quan hệ biểu tượng. `interactions` không chứng minh nguyên nhân thực tế; scenario luôn có điều kiện quan sát. Không suy lịch trước/sau từ chiều sinh khắc.
- Core cũ giữ phép Cửu Tinh theo [Yên Ba Điếu Tẩu Ca](https://zh.wikisource.org/wiki/煙波釣叟歌): đồng hành tháng tướng, Tinh sinh tháng vượng, tháng sinh Tinh phế, Tinh khắc tháng hưu, tháng khắc Tinh tù. Không áp cho Môn/Can/cung.
- Phạm vi mộ/hình, Ngũ bất ngộ thời và các tổ hợp giới hạn giữ v15. Không tự thêm nhập mộ ngoài Tam kỳ, toàn bộ thập can khắc ứng, Phi Bàn/Cửu Thần hay ngày ứng nghiệm chắc chắn.

## Protocol 5

Request thêm `depth: standard|deep` bên cạnh `mode`, `actors`, `action`, `candidates`. `chartFingerprint` vẫn băm bàn legacy; `requestFingerprint` băm rules + chart hash + toàn context, gồm planner/độ sâu/ứng viên. Server bỏ qua planner/facts/instructions do client chèn, tự chuẩn bị lại. TG-CB-4.0 và trước đó bị chặn; không chỉ đổi số phiên bản để lách.

Result gồm status/topic_id/mode/questionType; summary/situation/timing là text + claim_ids. development đúng ba chặng với text, condition, claim_ids, interaction_ids. bottleneck có resolution; alternative có id; actions có recommendation_id + text; comparisons chỉ dùng ứng viên đã tính; questions phục vụ làm rõ.

Không còn schema đánh giá bốn aspect rồi viết lại toàn bộ mode_chain. Mỗi đoạn phải dẫn claim đã lập, mỗi hành động phải dẫn recommendation; chặng phải dùng cạnh đã chọn. Bài thường hướng tới 500–800 đơn vị cách nhau bởi khoảng trắng, đơn giản có thể ngắn; lựa chọn Luận sâu cho phép dài hơn. Văn chính, điều kiện và resolution cùng tính vào giới hạn; căn cứ và bảng ứng viên không tính.

Audit chặn cấu trúc sai, claim/action/cạnh/ứng viên giả, lệch topic/mode/ý định, bỏ đại diện chính, thiếu mâu thuẫn chi phối, thiếu chặng/điều kiện, văn quá ngắn/dài, trùng hoặc gần trùng đoạn, một số dạng số tiền/ngày/xác suất bịa trong mọi chuỗi hiển thị, kể cả điều kiện, resolution, so sánh và làm rõ. Các heuristic không chứng minh mọi câu có nghĩa đúng và không phát hiện mọi kiểu bịa hoặc lặp ý; writer được yêu cầu tự kiểm, rồi cần đánh giá người đọc/AI thật theo AI-EVAL.md.

## Timing / Direction và kết nối

Timing tiếp tục so 2–12 thời điểm, giữ Nhật trụ người hỏi của bàn gốc, gọi một Core cho mỗi ứng viên khác nhau. Direction so tám cung ngoài trung tâm; thứ hạng tương đối và đồng hạng giữ nguyên. Writer nhận điều kiện từng ứng viên, không được lấy Không/Mã của bàn hỏi thay ngày khác.

Giữ relay `https://ky-mon-codex-relay.dinhtrongddr.workers.dev`, model `gpt-5.6-sol`, high effort, tài khoản ChatGPT, xác thực nhập tay, Host/Origin/CORS, chỉ đọc và chặn công cụ. Tổng hạn 180 giây cho cả lượt/repair, web chờ 190 giây. Không thử lại lỗi auth/network. Hủy và thay form làm phản hồi cũ mất hiệu lực.

## Kiểm tra và triển khai

`npm run check`; `npm run prepare:windows`; `npm run package:local`; `npm run verify:package`. Ca mới nằm trong reasoning-context/planner/writer; ca bridge/DOM được chuyển sang contract v5, vẫn giữ bảo vệ cũ. Ngày 14/09/2026 đã chạy AI thật qua Chrome, website, Worker và tunnel, xác nhận một bài hợp lệ với năm tab. Ma trận đánh giá nội dung AI đầy đủ vẫn chưa hoàn tất. Fixture chữ chỉ để kiểm contract, không phải bằng chứng chất lượng AI. Bản ghi và quy trình tái lập nằm trong `docs/releases/`.

Repo gốc đóng kèm `relay/`, mã nguồn launcher, cấu hình đóng gói và workflow kiểm thử. Manifest `docs/releases/core-baseline.json` khóa sáu tệp lõi theo UTF-8/LF; test 480 bàn vẫn kiểm độc lập hash đầu ra cũ. `scripts/package-local.py` dùng danh sách tệp cho phép, timestamp cố định và checksum Windows, xác minh nội dung trước khi thay ZIP. Lịch sử Git và source archive được sao lưu riêng với bộ cài local; cấu hình đăng nhập/ghép nối nằm ngoài cả ba.

Publish đúng Site hiện tại và gói `downloads/ky-mon-ai.zip`. Người dùng cần cập nhật/restart bộ kết nối; website không có quyền thay tiến trình trên máy họ. Hướng dẫn migration trong HUONG-DAN-LOCAL.md. Không tạo app, key, secret hoặc model mới.
