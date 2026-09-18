# v17.2.2 · TG-CB-6.2 — sửa kết nối AI trên develop preview

- Cho phép GET /api/status từ trang preview cùng origin khi trình duyệt không gửi header Origin, nhưng chỉ khi Sec-Fetch-Site là same-origin.
- Vẫn chặn request tunnel thiếu Origin từ nguồn không xác nhận và vẫn chặn foreign Origin.
- Preview dùng cùng mã ghép nối đang cấu hình trên VPS thay vì một mã riêng, tránh lệch mã giữa production và preview.
- Không thay đổi Named Tunnel production.
