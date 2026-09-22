# Kỳ Môn Bàn

Ứng dụng web tĩnh lập bàn **Thời Gia Kỳ Môn Độn Giáp – Chuyển Bàn** từ ngày, giờ, phút và múi giờ.

Domain chính [kymon.pp.ua](https://kymon.pp.ua) được Cloudflare Pages tự động xuất bản từ GitHub `main` của repo [KY-MON-DON-GIAP](https://github.com/dinhtrongddr-dev/KY-MON-DON-GIAP). Bản ChatGPT Sites cũ tạm thời vẫn được giữ làm đường lui, không còn là host production. Bản 16.0.1 cập nhật domain, giữ nguyên lõi và TG-CB-5.0; trạng thái DNS/triển khai và phạm vi chuyển đổi xem `docs/releases/DOMAIN-MIGRATION.md` và `docs/releases/CLOUDFLARE-PAGES.md`.

## Luận bằng AI

Nút Luận bằng AI kết nối qua endpoint chuyển tiếp cố định tới bộ kết nối do người dùng vận hành. Trên cấu hình VPS hiện tại, route ChatGPT đi qua 9router local; Prism là fallback local riêng và không thay đổi cấu hình upstream. Gói cập nhật nằm trong `dist/downloads/ky-mon-ai.zip`; hướng dẫn nguồn: `HUONG-DAN-LOCAL.md`.

Bản 17.6.0 / TG-CB-6.3 (protocol 6) đơn giản hóa trải nghiệm Hỏi Việc và Mệnh: trang chính chỉ giữ nhập liệu, Luận AI, Tứ Trụ, Bàn Kỳ Môn, luận từng cung và Ngũ hành; hướng dẫn/server/thông tin hệ thống được tách thành chỉ mục riêng. Kết nối AI dùng trạng thái ×/✓ ngay trong ô mã, điều hướng Bàn↔AI dùng một bong bóng nổi, Niên Mệnh và Can Chi đại diện được hợp nhất theo từng người liên quan. Engine deterministic, KM-TIMING-3.0, KM-CASE-1.0, KM-VALIDATION-1.0 và các guardrail của v17.5.0 không đổi.

Core TG-ROTATING-2.0 giữ nguyên. Sáu mode và Auto, so 2-12 thời điểm bằng bàn riêng, tám phương vị và dữ liệu đã lưu vẫn được hỗ trợ. Source phát hành từ GitHub main lên Cloudflare Pages. Kiến trúc hiện tại: `QIMEN-ARCHITECTURE.md`.

Chạy `npm run prepare:windows` trước `npm run package:local`. Bước chuẩn bị kiểm SHA-256 của launcher và tải hoặc dùng lại đúng cloudflared 2026.9.0 đã xác minh. Đóng gói phải có đủ Windows/tunnel và toàn bộ `dist/qimen/`; thiếu tệp hoặc sai checksum sẽ dừng, giữ nguyên ZIP cũ. Hai đầu khóa SHA-256 của bàn và toàn bộ ngữ cảnh (mode, graph, ứng viên, đại diện). `local/interpret.mjs` cho phép sửa bài tối đa một lần trong tổng 600 giây, phía web chờ 610 giây; giữ Hủy, không thử lại lỗi xác thực, và khi bài đã trả nhưng không vượt validator thì lượt sửa tiếp tục trên chính model vừa dùng. Chỉ lỗi hết hạn mức mới cho phép chuyển sang model dự phòng.

Gói này phải được cài vào bộ kết nối trên máy người dùng; publish web không cập nhật server đó. Ngày 14/09/2026 đã kiểm tra một lượt AI thật qua website, Worker và tunnel: 146,326 giây, kết quả qua xác thực và hiển thị đủ năm tab. Kiểm thử giao thức tự động dùng mock; chưa hoàn tất toàn bộ ma trận chất lượng AI trong `AI-EVAL.md`. Bằng chứng và phạm vi kiểm tra: `docs/releases/BASELINE-2026-09-14.md`. Các ngưỡng độ dài chỉ chống đầu ra quá sơ lược, không chứng minh lời luận đúng hoặc hay.

## Khẩu quyết đã mã hóa

- Tứ trụ đổi theo tiết khí; nhật trụ đổi lúc 23:00.
- Đông Chí đến trước Hạ Chí dùng Dương Độn; Hạ Chí đến trước Đông Chí dùng Âm Độn.
- Profile sản phẩm hiện chốt Tháo Bổ theo Phù đầu; engine vẫn giữ fixture Mao Sơn cho kiểm thử/tương thích lịch sử nhưng UI và request mới của app luôn dùng `chaibu`.
- Tam Kỳ Lục Nghi đi theo `Mậu–Kỷ–Canh–Tân–Nhâm–Quý–Đinh–Bính–Ất`.
- Giáp Tý ẩn Mậu, Giáp Tuất ẩn Kỷ, Giáp Thân ẩn Canh, Giáp Ngọ ẩn Tân, Giáp Thìn ẩn Nhâm, Giáp Dần ẩn Quý.
- Trực Phù theo thời can; Trực Sử theo thời cung; Trung Ngũ ký Khôn 2 khi định đích; Thiên Cầm và can ký cùng chuyển với Thiên Nhuế.
- Bàn hiển thị đủ địa bàn, thiên bàn, Cửu Tinh, Bát Môn, Bát Thần, Tuần Không, Dịch Mã, Môn bức, Lục nghi kích hình và Tam kỳ nhập mộ.

## Hướng dẫn nhập môn

- Ngũ hành có màu riêng; Kim dùng chữ vàng, không tô nền lên ký hiệu trong bàn.
- Ô sự việc và 16 nhóm chủ đề đi kèm ví dụ, điểm đại diện cần xem và câu hỏi đối chiếu thực tế.
- Hướng dẫn xác định cung Nhật can, Thời can trên thiên bàn; Giáp tra nghi ẩn theo tuần của từng trụ. Nút hướng dẫn chọn trực tiếp cung trên bàn.
- Bảng tương sinh/tương khắc hai chiều và sáu bước đọc bàn cơ bản.
- Câu hỏi không lưu tự động. Khi bấm Luận bằng AI, câu hỏi và dữ liệu bàn được gửi qua bộ kết nối; phản hồi sai phiên bản hoặc sai bàn bị chặn. Lời luận AI không phải dự đoán chắc chắn.
- Không dùng bàn thay thế dữ liệu đầu tư, chẩn đoán y tế hay tư vấn pháp lý.

## Chạy kiểm thử

Yêu cầu Node.js 22 hoặc 24 và Python 3.10 trở lên. Repo không có thư viện npm cần cho app lúc chạy; thư viện lịch đã được lưu kèm. `lunar.js` giữ CommonJS trên Node; riêng Worker dùng ES module.

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm run prepare:windows
npm run verify:package
```

`npm run check` chạy kiểm thử lõi, AI contract, giao diện giả lập, bridge, relay, đóng gói và kiểm tra manifest lõi/tài nguyên. Nó không gọi AI thật, không cần tài khoản và không deploy. Có workflow Windows/Linux với Node 22/24 trong `.github/workflows/verify.yml`. Trên Windows, `npm run build:launcher` biên dịch C# và kiểm tra icon ở thư mục tạm; bản executable đã khóa checksum vẫn được giữ.

## Bản gốc và nâng cấp

Bản nguồn độc lập ở `E:/kymon-site`, nguồn cũ giữ trong remote `sites-upstream`; `origin` trỏ tới repo GitHub đã chọn. Quy trình backup, phục hồi, upload GitHub và nâng cấp từ tag: `docs/releases/GITHUB-BASELINE.md`. Bộ quy tắc và mức độ bằng chứng: `docs/releases/RULE-COVERAGE.md`. Không đưa mã ghép nối, khóa relay hoặc hồ sơ đăng nhập vào Git. Mã ứng dụng chưa có giấy phép nguồn mở; xem `THIRD-PARTY-NOTICES.md` trước khi công khai repo.

Tệp xuất bản nằm trong `dist/`. Lịch Can Chi và tiết khí dùng `lunar-javascript` 1.7.7 theo giấy phép MIT.
