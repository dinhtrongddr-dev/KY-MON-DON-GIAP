# KM-SPIRIT-ACTIVATION-1.0

## Mục tiêu

Thêm lớp Bát Thần & phương vị dùng chung cho Hỏi Việc và Mệnh mà không thay đổi thuật toán lập bàn.

## Nguyên tắc

- Bát Thần không được đọc độc lập. Mức kích hoạt xét đồng thời Cung, Thần, Môn, Tinh, Can, lực cung, Không/Mã, Mộ/Hình, cấu trúc và quan hệ với vai mục tiêu/người hỏi.
- Điểm kỹ thuật chỉ dùng nội bộ để sắp mức; UI không hiển thị điểm.
- Thần thuận nhưng cung có nhiều điều kiện cản phải bị hạ mức.
- Thần bản mệnh lấy từ cung Nhật can của Mệnh bàn sinh; không dùng vị trí Bát Thần của thời bàn hiện tại.
- Thần thời bàn được tính lại mỗi khi thời bàn thay đổi.
- Back-facing: phương vị cung đặt sau lưng, mặt nhìn hướng đối diện.
- Thực hành được mô tả như kết nối với biểu tượng/phẩm chất của Bát Thần; không khẳng định giao tiếp với thực thể hay nhận năng lượng chắc chắn.
- AI chỉ giải thích dữ liệu KM-SPIRIT-ACTIVATION-1.0 do engine cung cấp. AI không được tự chọn lại Thần, cung, hướng hoặc mức kích hoạt.

## Module

- `dist/qimen/analysis/spiritActivation.mjs`: mapping phương vị, goal, đánh giá deterministic, natal profile.
- `dist/spirit-activation-ui.mjs`: Hỏi Việc, Mệnh, practice flow, timer, local session store.
- `dist/qimen/semantic/KM_SEMANTIC_MATRIX_1.1.json`: mở rộng hồ sơ 8 Thần, giữ một semantic source.
- `dist/qimen/ai/contextBuilder.mjs`: structured activation data khi câu hỏi yêu cầu dùng Bát Thần/phương vị.
- `dist/qimen/ai/readingAudit.mjs`: chặn AI nói Thần/hướng khác engine.

## Mức hiển thị

1. Rất phù hợp
2. Có thể sử dụng
3. Trung tính
4. Không ưu tiên
5. Không nên kích hoạt lúc này

## Dữ liệu phiên thực hành

Bản 1.0 lưu cục bộ trên trình duyệt, tối đa 100 phiên:
- chart type
- goal category
- palace / spirit / door / star / stem
- back direction / facing direction
- duration
- ba ô ghi chú do người dùng tự nhập

Không lưu câu hỏi gốc.

## Giới hạn

- Chưa tích hợp la bàn thiết bị; engine đã trả `bearing` để mở rộng sau.
- Không dùng activation score làm xác suất hay kết quả dự báo.
- Chưa có thống kê/lịch sử UI nâng cao; dữ liệu local là nền cho 1.2.
