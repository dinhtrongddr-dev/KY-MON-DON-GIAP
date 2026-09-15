# Nâng cấp tầng AI 16.1.0 / TG-CB-5.1

Nguồn chính: GitHub `dinhtrongddr-dev/KY-MON-DON-GIAP`, nền `5f1a9c92b8fdca21c6823f8f5d9a48366a33a23a`, checkout `E:/kymon-site`; host production là Cloudflare Pages tại https://kymon.pp.ua. Protocol 5 giữ lại, phiên bản quy tắc tăng để chặn bộ kết nối cũ trước khi gọi model.

**Đã bổ sung và kiểm thử các lỗi tái hiện trong phần mềm. Chất lượng bài Astra thực chưa nghiệm thu vì tài khoản hết hạn mức Codex.** Kiểm thử schema, mock và hash không chứng minh mọi diễn giải đúng hoặc dự báo đã được xác thực.

| Yêu cầu | Xử lý và bằng chứng | Giới hạn |
| --- | --- | --- |
| Lập bàn bằng code, giữ trường phái/lịch | Giữ sáu tệp lõi và hash 480 bàn. Kiểm thử core/lịch độc lập hiện có đạt. Thời Gia Chuyển Bàn, Tháo bổ/Mao Sơn, UTC offset dân dụng, đổi ngày 23:00. | Không tuyên bố kiểm chứng toàn bộ Kỳ Môn. |
| Đúng câu hỏi, bàn, chế độ | `reading-core.mjs` giữ fingerprint, server tái tính, chặn phản hồi cũ; thêm chủ thể hỏi thay và loại hướng/điểm quy chiếu vào định danh yêu cầu. | Chart fingerprint không đổi khi chỉ đổi yêu cầu luận. |
| Hiểu câu hỏi trước khi lấy vai | `questionContext.mjs`, `classifier.mjs` phân biệt phản hồi/lợi nhuận/thương lượng/hợp đồng; giữ câu gốc, chủ thể, bên liên quan, thời hạn, điều kiện và phương án. “Phương hướng kinh doanh” là chiến lược. UI nêu chế độ và cảnh báo ý định mơ hồ. | Vẫn dùng các mẫu ngôn ngữ; chưa chứng minh hiểu mọi câu tiếng Việt. |
| Dụng thần, nguồn và giới hạn | `usefulGod.mjs`, `ruleRegistry.mjs` thêm selectionRule, nguồn, mức xác minh và limitations cho từng vai. Hỏi thay dùng Can Chi được xác nhận; chưa rõ giữ unresolved. | Ánh xạ vai hiện đại ghi `app_convention_unverified`, không coi là chuẩn đã xác minh cho mọi phái. |
| Hồ sơ chứng cứ và phản chứng | `reasoningPlanner.mjs` thêm ruleIds, counterEvidenceIds, limitations; giữ graph, bundle gom đồng cung, điều kiện chi phối và xếp ưu tiên bằng code. Renderer hiện nguồn/điều kiện. | Điểm nội bộ không là xác suất hoặc công thức cổ truyền. |
| Các mode | Giữ logic riêng. Timing thực sự lập từng ứng viên, giữ cả đại diện hỏi thay đã xác nhận. Direction chỉ xếp hạng khi có điểm quy chiếu và loại hướng: di chuyển, ngồi (lưng/tựa), nhìn (mặt). | Mục tiêu/thời điểm theo đầu vào; vẫn cần kiểm tra thực địa. |
| Kiểm tra dữ kiện trong văn | `technicalAudit.mjs` kiểm các mẫu vị trí Môn/Tinh/Thần/Can, Không/Mã/Môn bức, hình/mộ từng can, vai, chiều sinh/khắc và rule/claim/evidence. Ca “Sinh Môn nằm ở cung 5” đã bị chặn dù ID hợp lệ; Càn/Cấn được phân biệt trước khi bỏ dấu. `readingAudit.mjs` kiểm cả lời giải thích bảng so sánh: giờ dùng bàn và đại diện của chính ứng viên, hướng dùng dữ kiện cung tương ứng. | Bộ kiểm tra mẫu câu không chứng minh toàn bộ ngữ nghĩa tự do; còn có cách nói vòng chưa bao phủ. |
| Chống bịa/lặp | Giữ kiểm tra số tiền/ngày/xác suất, tăng mẫu chắc chắn/sự kiện/động cơ vô căn cứ; kiểm đoạn trùng và dẫn phản chứng chính. | Chưa bảo đảm phát hiện mọi suy diễn ngầm hoặc lặp ý khác từ. |
| Sửa hữu hạn và phần xác minh | `interpret.mjs`, `verifiedFallback.mjs`: tối đa một lượt sửa; sau đó chỉ trả dữ kiện do code dựng, browser kiểm lại toàn bộ. Lỗi đăng nhập/hạn mức/mạng không thử lại. Thiếu dữ liệu cốt yếu được hỏi trước khi gọi model. | Phần dự phòng được ghi rõ chưa có bài AI đủ căn cứ. |
| Trả lời đúng trọng tâm | Bài hẹp có bố cục ngắn trong schema hiện có, không ép ba chặng; bài phức tạp giữ cấu trúc phù hợp. Prompt yêu cầu câu trả lời trực tiếp, cơ chế/căn cứ, điều kiện và hành động cụ thể. | Chất lượng văn Astra cần thử lại khi có hạn mức. |
| Tô đậm và giữ thuật ngữ | `reading-format.mjs`, `reading-view.mjs`: DOM text/strong an toàn, giữ chữ/điều kiện/tiếng Việt/dòng/bảng; không thực thi HTML. Kiểm dấu nhấn, độ dài và điều kiện. Có thể nhấn nguyên câu đã tồn tại trong văn chưa có Markdown. | Không sửa dữ liệu lịch sử hoặc tự tóm tắt nội dung khi định dạng. |
| Loading/ghi nhớ/mã rõ | Vòng xoay/số giây, Hủy và dọn trạng thái; localStorage có chọn lựa, bỏ chọn xóa ngay; input text. | Số giây là thời gian chờ, không phải phần trăm xử lý. |
| Model theo yêu cầu bổ sung | `gpt-6-astra`, effort `high`; xác nhận qua `model/list`. Launcher cập nhật, biên dịch và khóa checksum lại. | Có quyền model nhưng lượt luận thực bị chặn vì hết hạn mức. Không tự đổi model khác. |

## Kiểm thử đã chạy

- `npm run check`: **128 Node tests + 1 Python test đạt**. Kiểm 63 tài nguyên, 130 tham chiếu nội bộ, cú pháp/NFC và sáu tệp lõi đạt. Hai ca bổ sung tái hiện lỗi lời giải thích bảng so sánh trước khi sửa và kiểm tra không lấy dữ kiện bàn hỏi gán cho giờ ứng viên.
- `npm run build:launcher`: biên dịch C# và self-test icon 64 x 64 đạt; executable/source có checksum cập nhật cùng nhau, giữ pin cloudflared 2026.9.0.
- Chrome tại 1440 x 1000 và 390 x 844: chữ đậm thật, không dấu `**` thô, không tràn ngang/lỗi trang. Ghi nhớ/tải lại/xóa mã, mã rõ, vòng xoay, đầu vào hướng, dự phòng, Hủy và reduced motion đạt với phản hồi giả lập.
- Thử Astra thực: `account/read` trả `chatgpt`, `model/list` có `gpt-6-astra`/`high`. Câu hỏi báo giá giả định gặp `usageLimitExceeded`, không có bài hoàn chỉnh và không thử lại lỗi hạn mức. Không ghi là đã nghiệm thu AI.
- Mẫu văn đã qua validator: `AI-EXAMPLE-2026-09-15.md`, ghi rõ **văn giả lập**, không phải bài Astra. Không dựng lại bản trước để so sánh.

Tài liệu OpenAI đã đối chiếu: https://developers.openai.com/api/docs/guides/latest-model/gpt-6-astra.md#migration-quickstart. Giữ high, Codex App Server, đăng nhập và Structured Outputs; không thêm API key hoặc tham số sampling.

## Tự kiểm tra

Mở https://kymon.pp.ua, nhập mã/chọn ghi nhớ/tải lại, rồi bỏ chọn/tải lại để kiểm tra xóa. Chọn hướng cần điểm quy chiếu và loại hướng; hỏi thay dùng đại diện bổ sung. Khi luận, kiểm vòng xoay/Hủy; đổi câu hỏi phải bỏ kết quả cũ. Mở căn cứ để đối chiếu cung, nguồn và giới hạn. Bộ kết nối cần TG-CB-5.1; giữ cấu hình riêng khi cập nhật. Khi hạn mức trở lại, chạy các bài trong `AI-EVAL.md` để nghiệm thu văn Astra.
