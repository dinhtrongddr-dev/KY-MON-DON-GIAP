# All-in-One Qimen AI · v15 / TG-CB-4.0

## Giữ Core, mở lớp phân tích

`dist/qimen.mjs` và thư viện lịch không thay đổi. `dist/qimen/core/` là facade tương thích; app và preparation gọi cùng triển khai, không sao chép thuật toán. `toQimenBoard(chart)` chỉ chuẩn hóa bàn đã tính, không lập lại. Kết quả JSON tách khỏi bản legacy và đóng băng đệ quy. API thực tế: `createQimenBoard`, `toQimenBoard`, `analyzeBoard`, `analyzeMode`.

| Tầng | Trách nhiệm | Không làm |
|---|---|---|
| Core | Lịch và an bàn cũ; nhận diện tổ hợp xác định | Không chứa AI, prompt hoặc quyết định giao dịch |
| QimenBoard/1 | Ngày/giờ, trụ, tiết, độn, cục, tầng, Cửu cung, ký cung | Không nhập dữ liệu model vào bàn |
| Analysis | Giải đại diện, 64 quan hệ cung có chiều, điều kiện từng can, Tinh vượng suy, mâu thuẫn | Không bịa danh tính hoặc tâm ý |
| Modes | Nhánh, chuỗi và mục tiêu riêng cho sáu chế độ | Không tự gọi lịch/an bàn |
| Classifier | Router ý định và chủ đề minh bạch, có ghi lý do/override | Không gọi AI, không giả vờ hiểu mọi ý định |
| Graph | Nối các vai đã giải cung, giữ unresolved không có cạnh | Không đồng nhất liên hệ tượng với nhân quả |
| Synthesis | Prompt riêng, schema, căn cứ, chuỗi mode và graph → văn xuôi | Không tự tính lại trường có thể tính bằng mã |
| Bridge / UI | Tính lại, băm, xác thực, Hủy và năm tab an toàn | Không nhúng token, tạo key hay đổi model |

## Phạm vi và quy ước

- Nhật/Thời can dùng lại `locateStem`, Giáp phải có đủ Can Chi. Các đại diện hiện đại là convention/proxy; `customer`, `competitor`, `decisionMaker` mặc định unresolved. Nhập đại diện là xác nhận của người dùng, không phải xác minh khách quan. Hỏi thay cần làm rõ chủ thể.
- Cửu Tinh theo [Yên Ba Điếu Tẩu Ca](https://zh.wikisource.org/wiki/煙波釣叟歌): đồng hành tháng là tướng; Tinh sinh tháng là vượng; tháng sinh Tinh là phế; Tinh khắc tháng là hưu; tháng khắc Tinh là tù. Không dùng bảng này cho Môn/Can/cung. Tháng theo tiết khí, Thìn–Tuất–Sửu–Mùi quy Thổ; chưa dùng Thổ vượng 18 ngày. Mức khí không phải nhãn cát/hung.
- Cùng nguồn: kích hình, Tam kỳ nhập mộ, Môn bức giữ triển khai cũ; thêm Ngũ bất ngộ thời (Thời can khắc Nhật can cùng âm/dương), sáu tổ hợp can và Thiên/Địa/Nhân độn. Duyệt riêng can chính/can ký. Không nhận là toàn bộ thập can khắc ứng.
- Không hỗ trợ nhập mộ ngoài Tam kỳ, Phi Bàn/Cửu Thần hoặc ngày ứng nghiệm chắc chắn. Core cũ là Chuyển Bàn Bát Thần; không thêm một tầng Cửu Thần giả để đủ tên tính năng.

## Timing / Direction

`ai/timingComparison.mjs` điều phối cùng Core một lần cho mỗi ứng viên khác nhau, tối đa 12; cùng thời điểm bàn gốc được tái sử dụng. Pháp/múi giờ/mục tiêu cố định. Giữ Nhật trụ của bàn hỏi làm đại diện người hỏi xuyên các ứng viên, gồm nghi ẩn của Giáp; không tự đổi người hỏi theo ngày mới. Dữ liệu ứng viên `QimenCandidateSnapshot/1` là tóm tắt, không mạo danh schema QimenBoard đầy đủ.

Bộ lọc ứng dụng được công bố, không coi là cổ pháp duy nhất: ít điều kiện cản hơn được xét trước; cùng mức thì xét dấu hiệu hợp mục tiêu. Cùng cặp tiêu chí thì đồng hạng. Môn mục tiêu ưu tiên: gửi hồ sơ Cảnh/Khai, ký và triển khai Khai, gặp gỡ Hưu; phối hợp Lục Hợp chỉ bổ sung cho gặp/ký. Tinh vượng không tự cộng lợi, Mã không tự cộng tốt, phản/phục ngâm là lưu ý diễn biến. Direction xét tám cung ngoài Trung Ngũ. Các thứ hạng chỉ để đối chiếu, không đổi thành % hay chắc chắn thành công.

## Hợp đồng và chống kết quả cũ

Giao thức 4 giữ v3 và thêm `mode`, `actors`, `action`, `candidates` trong request. Server bỏ qua facts/analysis/instructions do client chèn, tự xây lại. `requestFingerprint` gồm toàn context (QimenBoard, analysis, plan, graph và ứng viên); `chartFingerprint` vẫn là bàn legacy để so khớp phiên trước. Model không nhận mã kết nối.

Kết quả thêm `synthesis`: mode_chain đúng mọi bước và đúng thứ tự, story_links ít nhất hai cạnh khác nhau và xuất hiện trong căn cứ chặng tương ứng, điểm chuyển/kết quả/hành động/điều tránh, comparisons không được thêm ứng viên ngoài danh sách. Năm tab chỉ dựng DOM bằng textContent. Validator kiểm cấu trúc/đối chiếu, không chứng minh ngữ nghĩa đúng. Sai cấu trúc được viết lại tối đa một lần trong tổng 180 giây; Hủy áp dụng cả lần sửa.

## Hồi quy theo phase

Mốc trước thay đổi: 480 bàn (1900/2024/2026/2100 × 12 tháng × 5 mốc giờ/múi giờ × hai pháp), SHA-256 `d384c9f4d42a94bd80d709eac2c865943ac5ac4f7e86489d84b003edd2b465ea` của chuỗi JSON legacy. Không cập nhật hash chỉ để làm test xanh.

Phase 1 kiểm JSON, tính bất biến, đại diện và vượng suy; Phase 2 thêm nhánh bốn mode; Phase 3 thêm classifier/graph/cross-mode/schema; Phase 4 thêm nhiều thời điểm/phương hướng/fingerprint/validation. Sau mỗi phase chạy lại mốc 480 bàn. Bộ cũ vẫn kiểm đủ 1.080 cấu hình, tám bàn mẫu cổ thư và mốc lịch/giao tiết.

Chạy `node --test tests/*.test.mjs`; kiểm asset bằng `node scripts/verify-assets.mjs`; đóng gói bằng `python scripts/package-local.py`. Các ca AI và DOM hiện dùng runner giả lập; chưa xác nhận chất lượng văn xuôi từ model thật. Ma trận nghiệm thu thực tế ở `AI-EVAL.md`.

## Triển khai

Giữ nguyên domain, relay Worker, model, hạn mức, đăng nhập và mã kết nối nhập tay. Gói public gồm cả `dist/qimen/` và server v4. Publish website không cập nhật tiến trình trên máy người dùng. Server cũ bị chặn có hướng dẫn; không lách kiểm tra để giả như đồng bộ. Không nhân bản thành app mới.
