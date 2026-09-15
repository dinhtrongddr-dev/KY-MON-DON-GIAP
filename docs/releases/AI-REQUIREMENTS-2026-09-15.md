# Đối chiếu yêu cầu AI ngày 15/09/2026

**Kết luận: chưa thực hiện đầy đủ tài liệu yêu cầu.** Lần cập nhật này hoàn tất ba thay đổi giao diện: trạng thái tải kèm thời gian chờ, tùy chọn ghi nhớ mã kết nối và hiển thị mã rõ. Những khả năng AI có từ bản trước được ghi nhận riêng; không coi số kiểm thử đạt là bằng chứng mọi yêu cầu về chất lượng bài luận đã đạt.

Đối chiếu trên bản nguồn `9541366675878063dbffdf3b60056ae760ac257b` (domain kymon.pp.ua) cùng các thay đổi giao diện. Bảng này dựa vào code đã đọc và kiểm thử đã chạy, không dựa vào lời tự đánh giá của AI.

| Hạng mục | Trạng thái | Bằng chứng | Xử lý / phần còn thiếu |
| --- | --- | --- | --- |
| Lập bàn bằng code, giữ trường phái và lịch | Đạt trong phạm vi kiểm thử hiện có | `dist/qimen.mjs`, `dist/qimen/core/`, `tests/audit.test.mjs`, `tests/calendar-boundaries.test.mjs`, `docs/releases/core-baseline.json` | Giữ nguyên sáu tệp lõi được khóa; không coi hash là chứng minh chuyên môn tuyệt đối. Thời Gia Chuyển Bàn, Tháo bổ/Mao Sơn, UTC offset dân dụng cố định, đổi ngày lúc 23:00. |
| Khớp bàn/câu hỏi/chế độ và loại phản hồi cũ | Đạt qua kiểm thử cơ chế | `buildReadingRequest`, `validateReadingResponse` trong `dist/reading-core.mjs`; bộ đếm lượt và hủy trong `dist/ai-local.mjs`; `tests/ai-ui.test.mjs` | Giữ fingerprint và tái tính ở server; không thay schema/giao thức. |
| Hiểu câu hỏi trước khi lấy dụng thần | Chưa đạt đầy đủ | `dist/qimen/ai/questionContext.mjs` dùng danh sách mẫu và regex cho subject, intent, timeHorizon, constraints | Có cấu trúc nền; chưa kiểm chứng đầy đủ khả năng phân biệt kết quả/bao giờ phản hồi/lợi nhuận/đàm phán và các biến thể hỏi thay. |
| Vai đại diện, căn cứ và mâu thuẫn | Có sẵn, chưa xác minh đầy đủ theo tài liệu | `analysis/usefulGod.mjs`, `evidenceBundles.mjs`, `contradictions.mjs`, `ai/reasoningPlanner.mjs` | Đã có trạng thái unresolved/proxy/convention, claims, evidence và quan hệ. Các ánh xạ hiện đại vẫn là quy ước của app; chưa có xác minh nguồn và điều kiện áp dụng cho từng phép ánh xạ theo toàn bộ yêu cầu. |
| Các chế độ và so sánh thời điểm | Đạt phần cơ chế, còn giới hạn | `tests/allinone-modes.test.mjs`, `tests/allinone-comparison.test.mjs`; `ai/timingComparison.mjs` | Các mode có logic riêng; Timing thật sự lập 2–12 bàn ứng viên. Chưa chứng minh chất lượng diễn giải thực tế của mọi mode. |
| Chọn phương hướng có điểm quy chiếu và loại hướng rõ | Chưa đạt đầy đủ | `dist/qimen/modes/direction.mjs` xếp tám phương vị nhưng trả `origin: null` | Chưa có đầu vào buộc phân biệt hướng di chuyển/hướng ngồi/hướng nhìn và xác nhận điểm quy chiếu. |
| Bộ kiểm tra nội dung ngăn dữ kiện bàn sai | Chưa đạt đầy đủ, có ca tái hiện | `dist/qimen/ai/readingAudit.mjs` kiểm cấu trúc, claim/edge/action IDs, độ dài và một số mẫu số tiền/ngày/chắc chắn | Thêm câu sai về vị trí Môn vào văn vẫn qua kiểm tra; xem ca thử bên dưới. ID hợp lệ chưa chứng minh câu văn được ID đó hỗ trợ. |
| Chống lặp, bịa sự kiện/động cơ và trả lời đúng trọng tâm | Có một phần, chưa xác minh đầy đủ | `readingAudit.mjs`, `prompts.mjs`, `tests/reasoning-writer.test.mjs` | Đã chặn trùng đoạn và một số mẫu chắc chắn; chưa kiểm mọi chi tiết vô căn cứ hoặc chứng minh chất lượng ngữ nghĩa. |
| Sửa có giới hạn và trả phần đã xác minh khi vẫn lỗi | Đạt giới hạn sửa; thiếu trả phần đã xác minh tự động | `local/interpret.mjs` tối đa hai lần chạy trong tổng 180 giây | Khi lượt sửa vẫn sai, server trả lỗi và UI không hiện bài. Người dùng có nút xem phân tích quy tắc riêng; chưa phải fallback tự động theo tài liệu. |
| Tô đậm diễn giải, giữ nội dung và thuật ngữ | Chưa thực hiện | `dist/reading-view.mjs` tạo đoạn bằng `textContent`; `dist/qimen/ai/prompts.mjs` yêu cầu không Markdown/HTML | Chưa có renderer chữ đậm trong văn AI, quy tắc chọn phần nhấn hoặc kiểm thử bảo toàn nội dung khi tô đậm. Không được nhận là đã đáp ứng mục 7. |
| Kiểm thử AI thực và ví dụ bài luận đạt toàn bộ yêu cầu | Chưa nghiệm thu | `AI-EVAL.md`; biên bản cũ `docs/releases/BASELINE-2026-09-14.md` ghi một lượt AI thực | Ngày 15/09 không gọi model thực; chưa chạy đủ ma trận, chưa có bài luận mẫu được nghiệm thu theo toàn bộ tài liệu. |
| Ba yêu cầu giao diện mới | Đã thực hiện | `dist/ai-local.mjs`, `dist/index.html`, `dist/styles.css`, `tests/ai-ui.test.mjs` | Vòng xoay/số giây chờ; ghi nhớ có chọn lựa, khôi phục/xóa mã; mã dạng text. Trạng thái dừng khi xong/lỗi/hủy/hết giờ/đổi dữ liệu. |

## Ca kiểm tra giới hạn của validator

- Dùng fixture văn giả lập trong `tests/reading-fixture.mjs`, câu hỏi "Tôi cần chuẩn bị gì cho hợp đồng A trong tháng này?", topic contract, pháp chaibu, 10/09/2026 lúc 10:00 UTC+7.
- Dùng `buildReadingRequest` để lấy đúng bàn, facts và fingerprint.
- Thêm câu cố ý sai `Sinh Môn nằm ở cung 5.` vào summary, giữ các claim IDs và dữ kiện khác hợp lệ.
- Gọi `validateReadingResponse`: **được chấp nhận**. Trong khi đó `facts.p5` ghi Trung Ngũ không có Môn/Thần độc lập.
- Đây là ca kiểm tra phần mềm với văn giả lập, không phải bài do model thực tạo và không phải bàn chuẩn độc lập.

## Kiểm thử đã chạy cho bản xuất bản giao diện

- `npm run check`: 107 kiểm thử Node và 1 kiểm thử Python đạt; kiểm tra tài nguyên, sáu tệp lõi và checksum launcher đạt.
- Chrome với phản hồi API giả lập: mã rõ, mặc định không lưu, ghi nhớ/tải lại, đổi mã/tải lại, bỏ ghi nhớ, thành công/lỗi/hủy, desktop/mobile 390px và reduced motion đạt trong lượt kiểm tra giao diện trước khi ghép domain. Bộ giao diện sau khi ghép giữ cùng hành vi; domain có kiểm thử tự động riêng.
- Gói Windows dùng script kiểm tra bắt buộc launcher và cloudflared 2026.9.0 của bản mới; không xuất bản ZIP nhỏ thiếu công cụ của checkout cũ.
- Không thay model, lịch, bộ tính bàn, dữ liệu lịch sử, cấu hình riêng hoặc tiến trình AI đang chạy.

Để kiểm tra ba thay đổi trên giao diện: nhập mã, chọn ghi nhớ và tải lại trang; bỏ chọn rồi tải lại để kiểm tra xóa; nhập câu hỏi và bấm luận để thấy vòng xoay/số giây, sau đó bấm Hủy.
