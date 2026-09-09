# Kỳ Môn • Codex trên máy tính

Luồng: trình duyệt → server Node local → `codex app-server` → GPT-5.6 Sol → kết quả trên bàn.
Không tạo OpenAI API key, không trích xuất hoặc sao chép token đăng nhập. Cầu nối dùng giao thức App Server chính thức qua stdio, không điều khiển cửa sổ chat đang mở. Tài khoản/model và hạn mức thực tế do Codex quyết định; đây không phải AI chạy offline.

## Chuẩn bị một lần

1. Cài Node.js 22 trở lên từ https://nodejs.org và Codex CLI theo https://learn.chatgpt.com/docs/codex/cli . Nếu dùng npm: `npm install -g @openai/codex`.
2. Mở Terminal/PowerShell, chạy `codex login` và đăng nhập bằng ChatGPT. Có thể CLI đã nhận phiên đăng nhập trên cùng máy, nhưng cầu nối vẫn kiểm tra kiểu tài khoản mỗi lượt. Không chọn đăng nhập API key.
3. Kiểm tra `codex --version`. Codex cần hỗ trợ App Server, GPT-5.6 Sol và restricted read access theo tài liệu hiện hành. Nếu chưa có quyền Sol, cầu nối sẽ báo lỗi và không đổi sang model khác.
4. Giải nén toàn bộ gói, giữ nguyên thư mục `dist` và `local`.

## Mỗi lần dùng

- Windows: mở `START-WINDOWS.cmd`.
- macOS/Linux: trong thư mục vừa giải nén chạy `node local/server.mjs` (hoặc `sh START-MAC.command`).
- Giữ cửa sổ này mở. Sao chép **mã ghép nối** được in ở đây.
- Mở http://127.0.0.1:8765 trên chính máy đó. Nhập câu hỏi, ngày giờ, chọn pháp và chủ đề, dán mã ghép nối, bấm **Luận bằng AI**.
- Có thể dùng website https://kymon.tkgiongnoi2.chatgpt.site cùng mã ghép nối khi bản web có nút local. Trình duyệt có thể yêu cầu/chặn truy cập localhost từ HTTPS; khi đó dùng bản local phía trên. Không vô hiệu hóa bảo mật trình duyệt.
- Bấm Hủy để ngừng chờ và dừng tiến trình Codex của lượt đó. Mỗi server xử lý một lượt đồng thời. Ctrl+C trong cửa sổ server để đóng hoàn toàn.

## Điều kiện và giới hạn

- Server chỉ nghe trên `127.0.0.1:8765`, không mở cho LAN/Internet. Điện thoại không dùng được địa chỉ local của máy tính. Muốn dùng điện thoại cần thiết kế kết nối riêng; chưa có trong bản này.
- Server yêu cầu mã ngẫu nhiên mỗi lần khởi động, kiểm tra Host/Origin, chỉ chấp nhận giao diện local và tên miền website đã nêu. Không chia sẻ mã ghép nối hoặc mở cổng server ra Internet.
- Mỗi lượt tạo thread mới; không tiếp tục hội thoại Codex đang mở. Câu hỏi gửi tới Codex/nhà cung cấp model theo tài khoản đã đăng nhập. Cầu nối không lưu câu hỏi/lời luận lên đĩa; chính sách nhật ký của Codex vẫn do Codex quản lý.
- Shell/web search bị tắt cho tiến trình cầu nối; lượt chạy yêu cầu vùng đọc chỉ trong thư mục tạm trống, không cấp ghi hoặc phê duyệt công cụ. Nếu Codex yêu cầu công cụ thì cầu nối dừng lượt đó. Không nới quyền để xử lý lỗi.
- Nếu cài CLI ở vị trí đặc biệt, đặt `QIMEN_CODEX_BIN` thành đường dẫn tuyệt đối đến executable Codex hoặc `codex.js`. Không đặt thành chuỗi lệnh gồm tham số. Windows hỗ trợ npm global bằng cách chạy `codex.js` qua Node, không chuyển câu hỏi vào shell.
- Các kiểm thử đi kèm dùng Codex giả lập để kiểm tra giao thức và server. Cần thử một câu hỏi thật trên máy bạn để xác nhận CLI/model/tài khoản tương thích.

## Bộ quy tắc TG-CB-1.0

Thời Gia, Chuyển Bàn; dùng đúng pháp Tháo bổ/Mao Sơn đã chọn; 23:00 đổi ngày; Trung Ngũ ký Khôn 2; Thiên Cầm cùng Thiên Nhuế. Nhật/Thời can tìm trên thiên bàn; Giáp theo nghi ẩn của chính trụ. Quan hệ người–việc xét hành cung. Môn bức cung khi Môn khắc hành cung. Cùng đọc Môn–Tinh–Thần, Không/Mã và phục/phản ngâm.

Các chủ đề hiện đại dùng bảng dụng thần minh bạch của app. Hỏi thay người khác có thể cần làm rõ đại diện. Chưa tính đầy đủ nhập mộ, lục nghi kích hình, thập can khắc ứng, vượng suy Cửu Tinh và ứng kỳ. Không tuyên bố đây là toàn bộ chuẩn mọi phái. Server kiểm tra mã căn cứ tồn tại, không chứng minh mọi câu diễn giải AI là đúng.

Nguồn quy ước truyền thống: https://zh.wikisource.org/wiki/煙波釣叟歌 . Tài liệu tích hợp: https://learn.chatgpt.com/docs/app-server và https://learn.chatgpt.com/docs/config-file/config-reference .

## Xử lý lỗi

- Không tìm thấy Codex: kiểm tra cài CLI và PATH, khởi động lại Terminal.
- Chưa đăng nhập ChatGPT: chạy `codex login` trong Terminal rồi thử lại.
- Lỗi model/quota: kiểm tra Sol trong Codex và hạn mức tài khoản; không có chế độ lách hạn mức.
- Lỗi giao thức/sandbox: cập nhật Codex CLI, không bỏ restricted read access.
- Không ghép nối: dùng mã mới nhất, đúng máy, và bản local nếu website HTTPS bị trình duyệt chặn.
- Căn cứ sai hoặc JSON chưa đúng: cầu nối không hiển thị lời luận đó; thử lại một lần và giữ câu hỏi cụ thể.
