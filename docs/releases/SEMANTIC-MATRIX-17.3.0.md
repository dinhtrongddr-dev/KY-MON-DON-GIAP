# v17.3.0 · TG-CB-6.3 — KM Semantic Matrix 1.0

Ngày: 19/09/2026

## Phạm vi

- Giữ nguyên Core TG-ROTATING-2.0 và deterministic KM-MENH-1.0.
- Tích hợp nguyên bản `KM_SEMANTIC_MATRIX_1.0.json` làm nguồn nghĩa dùng chung cho Hỏi Việc và Mệnh.
- Matrix chạy sau lớp xác định Dụng Thần/chủ thể; không tự đổi resolver hoặc claim deterministic.
- Hỏi Việc áp từ vựng theo domain câu hỏi; Mệnh áp domain theo claim đang luận.
- UI cung cấp tối đa ba từ khóa và câu dịch nghĩa nhanh theo từng cung.

## Writer AI

- `semanticMatrix` được đưa vào writer context để Cung–Môn–Tinh–Thần–Can dùng cùng nguồn nghĩa với UI.
- Convergence chỉ nhấn một ý khi nhiều thành phần trùng tag; contrast dùng dạng “có X nhưng Y”; state modifier chỉ điều chỉnh cách biểu hiện.
- Dấu `**...**` chỉ được phép bao câu/cụm dịch nghĩa tự nhiên.
- Validator chặn tô đậm căn cứ kỹ thuật như cung/số cung, Niên/Nhật/Thời can, Thiên–Địa bàn, Môn, Tinh, Thần, Trực Phù/Trực Sử, Không/Mã, Phục Ngâm/Phản Ngâm và tên can.
- Mệnh bỏ auto-bold theo regex kỹ thuật; chỉ render bold do writer chủ động đánh dấu và đã qua validator.

## Tương thích

- App: `17.3.0`
- Hỏi Việc rules: `TG-CB-6.3`
- Protocol: `5` (schema giao tiếp không đổi)
- Semantic matrix: `KM-SEMANTIC-MATRIX-1.0`
