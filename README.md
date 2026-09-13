# Kỳ Môn Bàn

Ứng dụng web tĩnh lập bàn **Thời Gia Kỳ Môn Độn Giáp – Chuyển Bàn** từ ngày, giờ, phút và múi giờ.

## Luận bằng AI

Nút Luận bằng AI kết nối qua endpoint chuyển tiếp cố định tới bộ kết nối do người dùng vận hành. Bộ kết nối gọi `codex app-server` qua stdio với model giữ nguyên `gpt-5.6-sol` và đăng nhập ChatGPT. Không dùng OpenAI API key. Gói cập nhật nằm trong `dist/downloads/ky-mon-ai.zip`; hướng dẫn nguồn: `HUONG-DAN-LOCAL.md`.

All-in-One v15 dùng TG-CB-4.0 (protocol 4). Một Core giữ nguyên v14; QimenBoard JSON và Analysis Engine nằm trong `dist/qimen/`. Sáu mode có quy tắc riêng, Auto phân loại ý định, graph nối đại diện và synthesis ghép diễn biến. Timing so sánh 2–12 thời điểm; Direction so tám phương vị theo mục tiêu. Năm tab kết quả và nút xem dữ kiện không cần AI. Chi tiết: `QIMEN-ARCHITECTURE.md`.

Tạo lại gói bằng `python scripts/package-local.py`; phải đóng kèm toàn bộ `dist/qimen/`. Hai đầu khóa SHA-256 của bàn và toàn bộ ngữ cảnh (mode, graph, ứng viên, đại diện). `local/interpret.mjs` vẫn cho phép sửa bài tối đa một lần trong tổng 180 giây; giữ Hủy, không thử lại lỗi xác thực/mạng, không đổi model hoặc mức suy luận.

Gói này phải được cài vào bộ kết nối trên máy người dùng; publish web không cập nhật server đó. Các kiểm thử giao thức dùng mock, chưa thay thế kiểm tra trực tiếp trên tài khoản. Biên bản công khai: `dist/audit.html`; ma trận đánh giá lời luận: `AI-EVAL.md`. Các ngưỡng độ dài chỉ chống đầu ra quá sơ lược, không chứng minh lời luận đúng hoặc hay.

## Khẩu quyết đã mã hóa

- Tứ trụ đổi theo tiết khí; nhật trụ đổi lúc 23:00.
- Đông Chí đến trước Hạ Chí dùng Dương Độn; Hạ Chí đến trước Đông Chí dùng Âm Độn.
- Hai pháp định nguyên: Tháo bổ theo Phù đầu và Mao Sơn 5 ngày/nguyên.
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

```bash
node --test tests/*.test.mjs
```

Tệp xuất bản nằm trong `dist/`. Lịch Can Chi và tiết khí dùng `lunar-javascript` 1.7.7 theo giấy phép MIT.
