# Kỳ Môn • Codex trên máy tính

Luồng công khai: website → `https://ky-mon-codex-relay.dinhtrongddr.workers.dev` → tunnel đã cấu hình → server Node local → `codex app-server` → GPT-5.6 Sol → kết quả trên bàn.
Không tạo OpenAI API key, không trích xuất hoặc sao chép token đăng nhập. Cầu nối dùng giao thức App Server chính thức qua stdio, không điều khiển cửa sổ chat đang mở. Tài khoản/model và hạn mức thực tế do Codex quyết định; đây không phải AI chạy offline.

## Cập nhật lên TG-CB-5.0 (All-in-One, website v16)

1. Tải bộ mới tại https://kymon.tkgiongnoi2.chatgpt.site/downloads/ky-mon-ai.zip và giải nén vào thư mục mới. Sao lưu phiên bản server và cấu hình đang dùng.
2. Xác định đúng thư mục/tiến trình đang phục vụ cổng 8765. Nếu dùng server nguyên bản trong gói, chuyển tiến trình sang thư mục mới rồi khởi động lại. Nếu server đã được tùy biến cho relay/tunnel, tích hợp các module mới và giữ nguyên phần cấu hình riêng; không chép đè cả server một cách máy móc.
3. Dùng nguyên bộ `dist/`, đặc biệt toàn bộ thư mục mới `dist/qimen/` và các module `reading-*.mjs`; giữ `dist/vendor/lunar.js`. Bộ chạy: `local/reading.mjs`, `local/interpret.mjs`, `local/codex-client.mjs`, `local/server.mjs`. Không chỉ sửa số rules/protocol trên server cũ: mode, graph, schema, context và validation phải đồng bộ.
4. Server gọi `prepareReading(body)` và `readingIdentity(prepared)` để đối chiếu request trước khi gọi `interpretReading(prepared,{signal})`. Hàm này kiểm tra nội dung và cho phép viết lại tối đa một lần. Phản hồi giữ các trường `model`, `rules`, `protocol`, `chartFingerprint`, `requestFingerprint`, `reading`, `facts`.
5. Giữ nguyên endpoint Worker, tunnel và CORS cho website hiện tại. Mã kết nối nhập bằng tay, không đặt vào URL hoặc mã website. Không mở cổng ra LAN/Internet và không tắt kiểm tra Host/Origin.
6. Khởi động lại đúng server, nhập mã mới trên website rồi bấm Kiểm tra kết nối. `/api/status` qua Worker phải báo `rules: TG-CB-5.0`, `protocol: 5`. Kiểm tra trạng thái thành công chưa chứng minh model đã chạy.
7. Thử các mode với cùng một câu hỏi giả lập. Kiểm tra Luận trọng tâm/Luận sâu, năm tab và căn cứ mặc định thu gọn; Hủy/đổi mode không để lời luận cũ xuất hiện. Timing cần 2–12 thời điểm. Ma trận thử AI thật nằm trong `AI-EVAL.md`; không ghi các ca này đã đạt nếu chỉ chạy mock.

Mức suy luận được đặt `high`, model vẫn là `gpt-5.6-sol`. Nếu Codex/tài khoản không hỗ trợ cấu hình này, báo lỗi để kiểm tra phiên bản/quyền; không tự đổi model hoặc dùng API key. Tổng thời gian tối đa cho cả lượt và phần viết lại là 180 giây, phía web chờ 190 giây. Lỗi đăng nhập/mạng không tự thử lại để tránh tạo thêm lượt.

Giao thức 5 giữ đầu vào `mode`, `actors`, `action`, `candidates` và thêm `depth: standard|deep`. Server tự lập bàn và planner, không tin facts/graph/claims do client chèn. Đầu ra mới gồm `status`, `topic_id`, `mode`, `questionType`, `summary`, `situation`, `development`, `bottleneck`, `actions`, `alternative`, `timing`, `comparisons`, `questions`. Các đoạn văn mang `text` và `claim_ids`; chặng diễn biến có `interaction_ids`, hành động có `recommendation_id`. Không còn `assessments`, `scope` hoặc `synthesis.mode_chain` của v4.

`local/interpret.mjs` gọi `buildWriterContext(prepared.context)` để chỉ gửi planner và dữ kiện đã chọn. `readingSchema(prepared.facts, prepared.context)` và `validateReading(result, prepared.facts, prepared.context.selectedTopic, prepared.context)` bắt buộc nhận context. Không gọi chúng bằng facts đơn lẻ. Fingerprint vẫn khóa toàn bộ context nội bộ, không chỉ bản gửi AI. Không tự viết lại hàm băm ở relay hoặc bỏ validation để tương thích ngược. Backend TG-CB-4.0 trở về trước bị chặn trước khi gửi câu hỏi. Worker chỉ chuyển tiếp JSON nguyên vẹn, không cần key/model mới.

## Chuẩn bị một lần

1. Cài Node.js 22 trở lên từ https://nodejs.org và Codex CLI theo https://learn.chatgpt.com/docs/codex/cli . Nếu dùng npm: `npm install -g @openai/codex`.
2. Mở Terminal/PowerShell, chạy `codex login` và đăng nhập bằng ChatGPT. Có thể CLI đã nhận phiên đăng nhập trên cùng máy, nhưng cầu nối vẫn kiểm tra kiểu tài khoản mỗi lượt. Không chọn đăng nhập API key.
3. Kiểm tra `codex --version`. Codex cần hỗ trợ App Server, GPT-5.6 Sol và restricted read access theo tài liệu hiện hành. Nếu chưa có quyền Sol, cầu nối sẽ báo lỗi và không đổi sang model khác.
4. Giải nén toàn bộ gói, giữ nguyên thư mục `dist` và `local`.

## Mỗi lần dùng

- Windows: mở `START-WINDOWS.cmd`.
- macOS/Linux: trong thư mục vừa giải nén chạy `node local/server.mjs` (hoặc `sh START-MAC.command`).
- Giữ cửa sổ này mở. Sao chép **mã ghép nối** được in ở đây.
- Mở https://kymon.tkgiongnoi2.chatgpt.site . Nhập câu hỏi, ngày giờ, chọn pháp và chủ đề, dán mã ghép nối, bấm **Luận bằng AI**. Giữ tunnel đã kết nối với Worker hoạt động.
- Bản giao diện tại http://127.0.0.1:8765 dùng để kiểm tra tệp cục bộ; endpoint AI trong gói vẫn cố định qua Worker. Không thay bằng URL tunnel tạm hoặc vô hiệu hóa bảo mật trình duyệt.
- Bấm Hủy để ngừng chờ và dừng tiến trình Codex của lượt đó. Mỗi server xử lý một lượt đồng thời. Ctrl+C trong cửa sổ server để đóng hoàn toàn.

## Điều kiện và giới hạn

- Server chỉ nghe trên `127.0.0.1:8765`, không mở cho LAN/Internet. Điện thoại dùng website công khai qua Worker/tunnel đã cấu hình, không dùng địa chỉ localhost của máy tính.
- Server yêu cầu mã ngẫu nhiên mỗi lần khởi động, kiểm tra Host/Origin, chỉ chấp nhận giao diện local và tên miền website đã nêu. Không chia sẻ mã ghép nối hoặc mở cổng server ra Internet.
- Mỗi lượt tạo thread mới; không tiếp tục hội thoại Codex đang mở. Câu hỏi gửi tới Codex/nhà cung cấp model theo tài khoản đã đăng nhập. Cầu nối không lưu câu hỏi/lời luận lên đĩa; chính sách nhật ký của Codex vẫn do Codex quản lý.
- Shell/web search bị tắt cho tiến trình cầu nối; lượt chạy yêu cầu vùng đọc chỉ trong thư mục tạm trống, không cấp ghi hoặc phê duyệt công cụ. Nếu Codex yêu cầu công cụ thì cầu nối dừng lượt đó. Không nới quyền để xử lý lỗi.
- Nếu cài CLI ở vị trí đặc biệt, đặt `QIMEN_CODEX_BIN` thành đường dẫn tuyệt đối đến executable Codex hoặc `codex.js`. Không đặt thành chuỗi lệnh gồm tham số. Windows hỗ trợ npm global bằng cách chạy `codex.js` qua Node, không chuyển câu hỏi vào shell.
- Các kiểm thử đi kèm dùng Codex giả lập để kiểm tra giao thức và server. Cần thử một câu hỏi thật trên máy bạn để xác nhận CLI/model/tài khoản tương thích.

## Bộ quy tắc TG-CB-5.0

Thời Gia, Chuyển Bàn; dùng đúng pháp Tháo bổ/Mao Sơn đã chọn; 23:00 đổi ngày; Trung Ngũ ký Khôn 2 khi xác định đích; Thiên Cầm và can Trung Ngũ cùng chuyển với Thiên Nhuế. Nhật/Thời can tìm trên thiên bàn; Giáp theo nghi ẩn của chính trụ. Quan hệ người–việc xét hành cung. Cùng đọc Môn–Tinh–Thần, Không/Mã, phục/phản ngâm, Môn bức, Lục nghi kích hình và Tam kỳ nhập mộ.

Thuật toán an bàn của v15 giữ nguyên hoàn toàn; kiểm thử khóa SHA-256 của 480 bàn đối chiếu. Các lớp mới đặt trong `dist/qimen/`: Core facade → QimenBoard → Analysis → Question Context/Mode → Evidence Bundles/Graph → Scenario Planner → AI Writer/Audit. Xem `QIMEN-ARCHITECTURE.md` để debug và mở rộng. Bài ưu tiên kết luận, thế sự việc, ba chặng liên kết, nút thắt và hành động; căn cứ kỹ thuật mặc định thu gọn. Độ dài thường 500–800 từ, có lựa chọn Luận sâu. Dữ liệu chưa rõ vẫn được trả lời ngắn, không cố bịa diễn biến.

Các chủ đề hiện đại dùng bảng dụng thần minh bạch của app. Khách hàng, đối thủ, người duyệt để unresolved nếu không có Can Chi đại diện được người dùng xác nhận. Đã tính Tinh vượng suy theo tháng tiết khí (phép Yên Ba Điếu Tẩu Ca), Ngũ bất ngộ thời và các tổ hợp được khai báo. Chưa tính nhập mộ ngoài Tam kỳ, toàn bộ thập can khắc ứng, Phi Bàn/Cửu Thần hoặc ngày ứng nghiệm chắc chắn. Bộ lọc Timing/Direction là heuristic công khai của app, không phải thang điểm cổ điển hoặc xác suất thành công. Căn cứ khớp không chứng minh lời AI đúng.

Nguồn quy ước truyền thống: https://zh.wikisource.org/wiki/煙波釣叟歌 . Tài liệu tích hợp: https://learn.chatgpt.com/docs/app-server và https://learn.chatgpt.com/docs/config-file/config-reference .

## Xử lý lỗi

- Không tìm thấy Codex: kiểm tra cài CLI và PATH, khởi động lại Terminal.
- Chưa đăng nhập ChatGPT: chạy `codex login` trong Terminal rồi thử lại.
- Lỗi model/quota: kiểm tra Sol trong Codex và hạn mức tài khoản; không có chế độ lách hạn mức.
- Lỗi giao thức/sandbox: cập nhật Codex CLI, không bỏ restricted read access.
- Không ghép nối: dùng mã mới nhất, kiểm tra Worker/tunnel đang trỏ tới đúng server mới và CORS vẫn cho phép domain website.
- Căn cứ sai hoặc bài sơ lược: server yêu cầu viết lại một lần trong cùng thời gian chờ; nếu vẫn không đạt, không hiển thị lời luận thiếu căn cứ. Lỗi đăng nhập/mạng không tự thử lại.
