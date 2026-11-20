# Kỳ Môn Bàn

Ứng dụng web tĩnh lập bàn **Thời Gia Kỳ Môn Độn Giáp – Chuyển Bàn** từ ngày, giờ, phút và múi giờ.

Domain chính [kymon.pp.ua](https://kymon.pp.ua) được Cloudflare Pages tự động xuất bản từ GitHub `main` của repo [KY-MON-DON-GIAP](https://github.com/dinhtrongddr-dev/KY-MON-DON-GIAP). Bản ChatGPT Sites cũ tạm thời vẫn được giữ làm đường lui, không còn là host production. Bản 16.0.1 cập nhật domain, giữ nguyên lõi và TG-CB-5.0; trạng thái DNS/triển khai và phạm vi chuyển đổi xem `docs/releases/DOMAIN-MIGRATION.md` và `docs/releases/CLOUDFLARE-PAGES.md`.

## Luận bằng AI

Nút Luận bằng AI gọi bộ kết nối trên VPS. Từ TG-CB-7.0, AI đi một route duy nhất qua ChatGPT2API (`127.0.0.1:8787`), model và mức suy luận lấy từ env (`QIMEN_DIRECT_MODEL`, `QIMEN_REASONING_EFFORT`, `QIMEN_AUX_REASONING_EFFORT`); `QIMEN_OPEN_ACCESS=1` bỏ mã ghép nối. Mẫu env: `ops/kymon-vps.env.example`.

Bản 17.7.0 / TG-CB-7.0 (protocol 6): kết luận bất lợi được nói thẳng khi Dụng Thần dính nhiều hại; ứng kỳ nhiều lớp quy ra ngày dương lịch (KM-TIMING-4.0); thương chiến KM-WARFARE-1.0; Kích Thần theo protocol riêng từng thần; một lượt luận gồm 1 lượt viết + 1 lượt kiểm tra + tối đa 1 lượt sửa câu. Báo cáo audit ở `docs/audit/`, tư liệu ở `docs/research/`.

Bản 17.6.3 / TG-CB-6.3 (protocol 6) làm bài luận AI dễ đọc hơn: các câu căn cứ/thuật ngữ Kỳ Môn đứng trước phần dịch nghĩa vẫn được giữ nguyên trong DOM nhưng mặc định ẩn; nút **Hiện căn cứ Kỳ Môn** cho phép bật lại toàn bộ phần kỹ thuật và đổi thành **Ẩn căn cứ Kỳ Môn** khi đang mở. Hỏi Việc và Mệnh dùng cùng cơ chế; prompt tiếp tục bắt cấu trúc kỹ thuật trước → dịch nghĩa sau, không đổi engine lập bàn, deterministic reasoning hay protocol AI.

Core TG-ROTATING-2.0 giữ nguyên. Sáu mode và Auto, so 2-12 thời điểm bằng bàn riêng, tám phương vị và dữ liệu đã lưu vẫn được hỗ trợ. Source phát hành từ GitHub main lên Cloudflare Pages. Kiến trúc hiện tại: `QIMEN-ARCHITECTURE.md`.

Kiểm tra trước khi phát hành: `npm run check`. Triển khai VPS: chép `dist/`, `local/`, `package.json` vào `/opt/kymon` rồi `sudo systemctl restart kymon` (mẫu env: `ops/kymon-vps.env.example`). Gói Windows local đã bỏ từ v17.7.0.

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
