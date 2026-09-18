# AI routing v17.2.3 — 18/09/2026

## Phạm vi

Bản này giữ nguyên Core TG-ROTATING-2.0, TG-CB-6.2 và protocol 5. Không publish production/main trong bước này.

## Thay đổi

- Route ChatGPT đầu tiên trên 9router đổi từ GPT-6 Astra sang `cx/gpt-5.6-sol`.
- GPT-5.6 Sol, Gemini 3.6 Flash và Prism Astra đều tiếp tục dùng mức suy luận `xhigh`.
- Prism giữ nguyên model `gpt-6-astra`, endpoint loopback và cơ chế fallback hiện có.
- Khi một model trả cấu trúc nhưng không vượt validator Kỳ Môn, lượt sửa giới hạn bắt đầu từ route kế tiếp thay vì gọi lại route vừa tạo bài lỗi.
- Nếu lượt sửa vẫn không đạt, `verified_fallback` giữ metadata của model vừa tạo bản nháp để server/UI vẫn hiện model, route và effort.
- Ở Chọn thời điểm và Chọn phương hướng, fallback vẫn render bảng so sánh xác định từ các bàn đã tính; không còn trạng thái chỉ hiện dữ kiện chung như thể kết quả bằng 0.

## Kiểm thử

Có kiểm thử riêng cho thứ tự Sol → Gemini → Prism, chuyển route khi sửa validation, giữ `modelUsed` trên fallback và render bảng Chọn thời điểm khi AI không vượt validator.

## Sửa validator Chọn thời điểm

- Cho phép ngày ứng viên ở cả dạng `dd/mm/yyyy` và `dd/mm` khi chúng đúng danh sách đã nhập; ngày ngoài danh sách vẫn bị chặn.
- Không còn hiểu nhầm giờ kiểu `14:00 đồng hạng` thành số tiền, hoặc các cụm `mốc thứ ba`, `xếp thứ hai`, `thứ tự phù hợp` thành ứng kỳ theo thứ trong tuần.
- Chế độ timing/direction cho phép nhấn tối đa ba cụm xếp hạng ngắn, nhưng vẫn chặn cách nhấn làm mất điều kiện hoặc biến xếp hạng thành kết quả chắc chắn.
- Chi tiết kỹ thuật của từng bàn ứng viên phải nằm trong đúng `comparisons[].reason`; phần chung không được gán nhầm Tuần Không/Mộ/Hình của ứng viên khác.

## Xác minh live

Ngày 18/09/2026 đã gọi thật qua Quick Tunnel của dev preview với ba thời điểm gửi báo giá. Kết quả HTTP 200 trong 65 giây, `status=reading`, `mode=timing`, đủ 3 comparisons và `modelUsed=GPT-5.6 Sol / 9router · ChatGPT / xhigh`. Sau đó `npm run check` đạt 180 kiểm thử Node, 1 Python và toàn bộ release verification.
