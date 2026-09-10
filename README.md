# Kỳ Môn Bàn

Ứng dụng web tĩnh lập bàn **Thời Gia Kỳ Môn Độn Giáp – Chuyển Bàn** từ ngày, giờ, phút và múi giờ.

## Luận bằng AI

Nút Luận bằng AI kết nối qua endpoint chuyển tiếp cố định tới bộ kết nối do người dùng vận hành. Bộ kết nối gọi `codex app-server` qua stdio với model giữ nguyên `gpt-5.6-sol` và đăng nhập ChatGPT. Không dùng OpenAI API key. Gói cập nhật nằm trong `dist/downloads/ky-mon-ai.zip`; hướng dẫn nguồn: `HUONG-DAN-LOCAL.md`.

Tạo lại gói tải bằng `python scripts/package-local.py` sau mỗi thay đổi. Hai đầu tính lại bàn và khóa SHA-256 của bàn/câu hỏi/căn cứ theo TG-CB-2.0. Server kiểm tra JSON; kiểm thử giao thức dùng mock, chưa thay thế kiểm tra trực tiếp trên tài khoản người dùng. Biên bản công khai: `dist/audit.html`; ma trận đánh giá lời luận: `AI-EVAL.md`.

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
