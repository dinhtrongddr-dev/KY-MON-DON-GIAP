# Kỳ Môn • Codex trên máy tính

## Bản tích hợp Windows 17.1.0 ngày 17/09/2026

Đây là v17.1.0 / TG-CB-6.1, protocol 5, đã tích hợp với launcher và relay hiện có. Chạy shortcut **Ky Mon Local** hoặc `START-WINDOWS.cmd`; launcher khởi động server, tunnel và cập nhật đích Worker. Khi cần đăng nhập, dùng `LOGIN-WINDOWS.cmd` để đăng nhập chính thức vào hồ sơ riêng `%LOCALAPPDATA%\KyMonCodex\codex-home`.

Codex CLI 0.154 dùng permission profile thay cho trường `readOnly.access` cũ. Cầu nối chọn `qimen-reader`, chỉ cho đọc thư mục tạm trống của từng lượt, tắt mạng công cụ và dùng sandbox Windows `elevated`. Cầu nối kiểm tra cấu hình hiệu lực trước khi gửi câu hỏi và dừng nếu cấu hình mở rộng quyền hoặc dùng `sandbox_mode` cũ. Không cần thay Codex CLI toàn máy. Nếu Windows yêu cầu thiết lập sandbox, hoàn tất thiết lập chính thức; không chuyển sang full access.

Mã ghép nối lấy từ tệp cấu hình riêng `%LOCALAPPDATA%\KyMonCodex\pairing-code.txt`, dài 4–128 ký tự, được launcher truyền vào server; nhập bằng tay trên giao diện. Gói tải xuống không chứa mã này, khóa quản trị relay hoặc thông tin đăng nhập. Giữ nguyên các tệp cấu hình riêng khi cập nhật.

## Trạng thái AI và ghi nhớ mã · cập nhật 16/09/2026

- Ô **Mã kết nối AI** hiển thị đầy đủ ký tự để dễ kiểm tra và sao chép.
- Chọn **Ghi nhớ mã trên thiết bị này** để trình duyệt tự điền mã ở lần mở sau. Mã được lưu trong localStorage của chính trình duyệt và địa chỉ trang đang dùng. Bỏ chọn xóa mã đã lưu ngay, vẫn giữ mã trong ô nhập cho lượt hiện tại. Xóa hết ô nhập cũng xóa mã đã lưu.
- Khi kiểm tra kết nối hoặc luận AI, vòng xoay và **Đã chờ … giây** cho biết trang đang chờ xử lý. Đây là thời gian đã chờ, không phải phần trăm hoàn thành hoặc xác nhận máy chủ vẫn đang chạy. Bấm **Hủy** để dừng; biểu tượng tắt khi hoàn tất, lỗi, hết thời gian hoặc thay đổi dữ liệu.
- Nếu trình duyệt không cho phép ghi nhớ, thông báo xuất hiện dưới tùy chọn; bạn vẫn nhập mã và kết nối như thường.

Bản 17.1.0 dùng TG-CB-6.1 / protocol 5, giữ nguyên lõi lập bàn. Thêm kiểm tra dữ kiện trong văn, nguồn/giới hạn của ánh xạ, bài ngắn theo câu hỏi, chữ đậm an toàn, đầu vào phương hướng và phần dữ kiện dự phòng sau một lượt sửa không đạt. Nguồn chính là GitHub, host Cloudflare Pages tại kymon.pp.ua. Bộ kết nối hiện dùng GPT-6 Astra/ultra theo yêu cầu. Tầng luận mới phân biệt bảy giai đoạn, giữ judgment do mã quyết định và evidence trace theo tab. Kết quả thử thực, đối chiếu trước/sau và giới hạn tại `docs/releases/REASONING-UPGRADE-2026-09-16.md`.

Luồng công khai: website → `https://ky-mon-codex-relay.dinhtrongddr.workers.dev` → tunnel đã cấu hình → server Node local → `codex app-server` → GPT-6 Astra → kết quả trên bàn.
Không tạo OpenAI API key, không trích xuất hoặc sao chép token đăng nhập. Cầu nối dùng giao thức App Server chính thức qua stdio, không điều khiển cửa sổ chat đang mở. Tài khoản/model và hạn mức thực tế do Codex quyết định; đây không phải AI chạy offline.

## Cập nhật lên TG-CB-6.1 (All-in-One, website v17.1)

1. Tải bộ mới tại https://kymon.pp.ua/downloads/ky-mon-ai.zip và giải nén vào thư mục mới. Sao lưu phiên bản server và cấu hình đang dùng.
2. Xác định đúng thư mục/tiến trình đang phục vụ cổng 8765. Nếu dùng server nguyên bản trong gói, chuyển tiến trình sang thư mục mới rồi khởi động lại. Nếu server đã được tùy biến cho relay/tunnel, tích hợp các module mới và giữ nguyên phần cấu hình riêng; không chép đè cả server một cách máy móc.
3. Dùng nguyên bộ `dist/`, đặc biệt toàn bộ thư mục mới `dist/qimen/` và các module `reading-*.mjs`; giữ `dist/vendor/lunar.js`. Bộ chạy: `local/reading.mjs`, `local/interpret.mjs`, `local/codex-client.mjs`, `local/server.mjs`. Không chỉ sửa số rules/protocol trên server cũ: mode, graph, schema, context và validation phải đồng bộ.
4. Server gọi `prepareReading(body)` và `readingIdentity(prepared)` để đối chiếu request trước khi gọi `interpretReading(prepared,{signal})`. Hàm này kiểm tra nội dung và cho phép viết lại tối đa một lần. Phản hồi giữ các trường `model`, `rules`, `protocol`, `chartFingerprint`, `requestFingerprint`, `reading`, `facts` và bổ sung `reasoningEffort`.
5. Giữ nguyên endpoint Worker, tunnel và CORS cho website hiện tại. Mã kết nối nhập bằng tay, không đặt vào URL hoặc mã website. Không mở cổng ra LAN/Internet và không tắt kiểm tra Host/Origin.
6. Khởi động lại đúng server, nhập mã mới trên website rồi bấm Kiểm tra kết nối. `/api/status` qua Worker phải báo `rules: TG-CB-6.1`, `protocol: 5`, `model: gpt-6-astra`, `reasoningEffort: ultra`. Kiểm tra trạng thái thành công chưa chứng minh model đã chạy.
7. Thử các mode với cùng một câu hỏi giả lập. Kiểm tra Luận trọng tâm/Luận sâu, năm tab và căn cứ mặc định thu gọn; Hủy/đổi mode không để lời luận cũ xuất hiện. Timing cần 2–12 thời điểm. Ma trận thử AI thật nằm trong `AI-EVAL.md`; không ghi các ca này đã đạt nếu chỉ chạy mock.

Mức suy luận được đặt `ultra`, mức cao nhất mà Codex `model/list` trên tài khoản hiện tại cung cấp cho `gpt-6-astra`. Nếu Codex/tài khoản không hỗ trợ cấu hình này, báo lỗi để kiểm tra phiên bản/quyền; không tự hạ mức, đổi model hoặc dùng API key. Tổng thời gian tối đa cho cả lượt và phần viết lại là 600 giây, phía web chờ 610 giây. Lỗi đăng nhập/mạng không tự thử lại để tránh tạo thêm lượt.

Giao thức 5 giữ đầu vào `mode`, `actors`, `action`, `candidates` và thêm `depth: standard|deep`. Server tự lập bàn và planner, không tin facts/graph/claims do client chèn. Đầu ra mới gồm `status`, `topic_id`, `mode`, `questionType`, `summary`, `situation`, `development`, `bottleneck`, `actions`, `alternative`, `timing`, `comparisons`, `questions`. Các đoạn văn mang `text` và `claim_ids`; chặng diễn biến có `interaction_ids`, hành động có `recommendation_id`. Không còn `assessments`, `scope` hoặc `synthesis.mode_chain` của v4.

`local/interpret.mjs` gọi `buildWriterContext(prepared.context)` để chỉ gửi planner và dữ kiện đã chọn. `readingSchema(prepared.facts, prepared.context)` và `validateReading(result, prepared.facts, prepared.context.selectedTopic, prepared.context)` bắt buộc nhận context. Không gọi chúng bằng facts đơn lẻ. Fingerprint vẫn khóa toàn bộ context nội bộ, không chỉ bản gửi AI. Không tự viết lại hàm băm ở relay hoặc bỏ validation để tương thích ngược. Backend TG-CB-4.0 trở về trước bị chặn trước khi gửi câu hỏi. Worker chỉ chuyển tiếp JSON nguyên vẹn, không cần key/model mới.

## Chuẩn bị một lần

1. Cài Node.js 22 trở lên từ https://nodejs.org và Codex CLI theo https://learn.chatgpt.com/docs/codex/cli . Nếu dùng npm: `npm install -g @openai/codex`.
2. Mở Terminal/PowerShell, chạy `codex login` và đăng nhập bằng ChatGPT. Có thể CLI đã nhận phiên đăng nhập trên cùng máy, nhưng cầu nối vẫn kiểm tra kiểu tài khoản mỗi lượt. Không chọn đăng nhập API key.
3. Kiểm tra `codex --version`. Codex cần hỗ trợ App Server, GPT-6 Astra và restricted read access theo tài liệu hiện hành. Nếu chưa có quyền Astra, cầu nối sẽ báo lỗi và không đổi sang model khác.
4. Giải nén toàn bộ gói, giữ nguyên thư mục `dist` và `local`.

## Mỗi lần dùng

- Windows: mở `START-WINDOWS.cmd`.
- macOS/Linux: trong thư mục vừa giải nén chạy `node local/server.mjs` (hoặc `sh START-MAC.command`).
- Giữ cửa sổ này mở. Sao chép **mã ghép nối** được in ở đây.
- Mở https://kymon.pp.ua . Nhập câu hỏi, ngày giờ, chọn pháp và chủ đề, dán mã ghép nối, bấm **Luận bằng AI**. Giữ tunnel đã kết nối với Worker hoạt động.
- Bản giao diện tại http://127.0.0.1:8765 dùng để kiểm tra tệp cục bộ; endpoint AI trong gói vẫn cố định qua Worker. Không thay bằng URL tunnel tạm hoặc vô hiệu hóa bảo mật trình duyệt.
- Bấm Hủy để ngừng chờ và dừng tiến trình Codex của lượt đó. Mỗi server xử lý một lượt đồng thời. Ctrl+C trong cửa sổ server để đóng hoàn toàn.

## Điều kiện và giới hạn

- Server chỉ nghe trên `127.0.0.1:8765`, không mở cho LAN/Internet. Điện thoại dùng website công khai qua Worker/tunnel đã cấu hình, không dùng địa chỉ localhost của máy tính.
- Server dùng mã ghép nối từ cấu hình riêng (hoặc mã ngẫu nhiên nếu chạy độc lập), kiểm tra Host/Origin, chỉ chấp nhận giao diện local và tên miền website đã nêu. Không chia sẻ mã ghép nối hoặc mở cổng server ra Internet.
- Mỗi lượt tạo thread mới; không tiếp tục hội thoại Codex đang mở. Câu hỏi gửi tới Codex/nhà cung cấp model theo tài khoản đã đăng nhập. Cầu nối không lưu câu hỏi/lời luận lên đĩa; chính sách nhật ký của Codex vẫn do Codex quản lý.
- Shell/web search bị tắt cho tiến trình cầu nối; lượt chạy yêu cầu vùng đọc chỉ trong thư mục tạm trống, không cấp ghi hoặc phê duyệt công cụ. Nếu Codex yêu cầu công cụ thì cầu nối dừng lượt đó. Không nới quyền để xử lý lỗi.
- Nếu cài CLI ở vị trí đặc biệt, đặt `QIMEN_CODEX_BIN` thành đường dẫn tuyệt đối đến executable Codex hoặc `codex.js`. Không đặt thành chuỗi lệnh gồm tham số. Windows hỗ trợ npm global bằng cách chạy `codex.js` qua Node, không chuyển câu hỏi vào shell.
- Các kiểm thử đi kèm dùng Codex giả lập để kiểm tra giao thức và server. Cần thử một câu hỏi thật trên máy bạn để xác nhận CLI/model/tài khoản tương thích.

## Bộ quy tắc TG-CB-6.1

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

## Domain riêng 16.0.1

Địa chỉ chính được cấu hình là https://kymon.pp.ua. Domain cũ vẫn được chấp nhận chính xác trong giai đoạn chuyển đổi. DNS/HTTPS, Worker và bộ kết nối local phải cập nhật đồng bộ; đổi mã nguồn không tự thay DNS. Xem `docs/releases/DOMAIN-MIGRATION.md`.
