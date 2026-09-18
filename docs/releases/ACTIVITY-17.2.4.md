# Activity history v17.2.4 — 18/09/2026

## Mục tiêu

Hiển thị ngay trên website tổng **Lập bàn hôm nay**, **Luận AI hôm nay** và lịch sử thời điểm các lượt luận gần đây cho toàn bộ traffic đi qua bridge, nhưng không lưu nội dung câu hỏi.

## Quy tắc đếm

- Lượt Lập bàn tăng khi website gửi `/api/activity/chart` sau một lần người dùng bấm Lập bàn và bàn được tạo thành công.
- Việc tự dựng bàn khi mở trang, đổi múi giờ/phương pháp hoặc chuẩn bị dữ liệu trước khi luận AI không tăng bộ đếm Lập bàn.
- Lượt Luận AI tăng ở bridge sau khi request `/api/read` đã qua xác thực, schema/fingerprint và được chấp nhận để bắt đầu chạy AI.
- Lượt AI được giữ kể cả khi sau đó lỗi, bị hủy, cần bổ sung dữ liệu hoặc rơi vào verified fallback.

## Dữ liệu được lưu

Bridge lưu tối đa 30 ngày và tối đa 10.000 sự kiện trong file state riêng của runtime. Bản ghi lượt luận chỉ gồm thời điểm, trạng thái kết thúc và khi có thì model/route/effort. Bản ghi lập bàn chỉ gồm thời điểm. Không ghi câu hỏi, nội dung bài luận, dữ kiện bàn, mã kết nối, fingerprint, IP hoặc danh tính người dùng.

Relay chỉ chuyển một mã client SHA-256 đã băm để bridge giới hạn spam đối với endpoint ghi lượt Lập bàn; mã này không được ghi vào activity store.

Giao diện dùng múi giờ của trình duyệt để xác định “hôm nay”, hiển thị tối đa 30 lượt luận gần nhất và tự làm mới thống kê chung định kỳ. localStorage chỉ giữ bản tối thiểu trên trình duyệt làm fallback khi endpoint thống kê chung tạm thời không truy cập được.

## Phạm vi

Hai endpoint mới chỉ phục vụ thống kê: `GET /api/activity` và `POST /api/activity/chart`. Chúng bị giới hạn origin tại Worker/bridge; endpoint chart có rate limit theo client. Không thay firewall, Named Tunnel hoặc AI routing.
