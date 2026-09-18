# Activity history v17.2.4 — 18/09/2026

## Mục tiêu

Hiển thị ngay trên website số lượt **Lập bàn hôm nay** và **Luận AI hôm nay**, đồng thời giữ lịch sử thời điểm của các lượt luận mà không lưu nội dung câu hỏi.

## Quy tắc đếm

- Lượt Lập bàn chỉ tăng khi người dùng bấm nút Lập bàn và bàn được tạo thành công.
- Việc tự dựng bàn khi mở trang, đổi múi giờ/phương pháp hoặc chuẩn bị dữ liệu trước khi luận AI không tăng bộ đếm Lập bàn.
- Lượt Luận AI tăng khi website đã kiểm tra kết nối thành công và gửi yêu cầu `/api/read`.
- Lượt AI được giữ kể cả khi sau đó lỗi, bị hủy, hết thời gian, cần bổ sung dữ liệu hoặc rơi vào verified fallback.

## Dữ liệu được lưu

localStorage `qimen.activity.v1` giữ tối đa 30 ngày và tối đa 500 sự kiện trên đúng trình duyệt đang dùng. Bản ghi lượt luận chỉ gồm thời điểm, trạng thái kết thúc và khi có thì model/route/effort. Bản ghi lập bàn chỉ gồm thời điểm. Không ghi câu hỏi, nội dung bài luận, dữ kiện bàn, mã kết nối hoặc dấu vân tay request.

Giao diện hiển thị hai bộ đếm của ngày địa phương trên thiết bị và tối đa 30 lượt luận gần nhất. Một lượt đang chạy mà trang bị tải lại được đánh dấu `Bị ngắt` thay vì tiếp tục hiển thị như đang chạy.

## Phạm vi

Đây là lịch sử cục bộ theo trình duyệt, không phải thống kê toàn bộ người dùng trên server. Không thêm endpoint telemetry, không thay firewall, Worker, Named Tunnel hoặc AI routing.
