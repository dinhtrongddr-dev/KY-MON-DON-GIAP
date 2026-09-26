# Báo cáo A/B suy luận pilot-m01-v11-20260926T1800Z

- Ca: 1; vòng: 1; mẫu: 2
- Hoàn tất: 2; lỗi: 0; verified fallback: 0
- Thắng: A=1, B=0, hòa=0

## Điểm trung bình AI-review

| Chiều | A trực tiếp | B full app |
|---|---:|---:|
| directness | 5 | 3 |
| naturalness | 4 | 3 |
| reasoningCoherence | 4 | 3 |
| specificity | 5 | 2 |
| actionability | 5 | 2 |
| nonRepetition | 4 | 3 |
| calibration | 4 | 5 |

## Ghi chú phương pháp

- A chỉ nhận bàn, ánh xạ vai và hướng dẫn phương pháp trung tính; không nhận Planner, Narrative Contract, gate hay kết luận của app.
- B chạy pipeline đầy đủ của app, gồm lập kế hoạch khi cần, Writer, kiểm tra ngữ nghĩa và fallback có kiểm soát.
- Điểm trong báo cáo là AI-review mù, không được ghi nhận là phiếu người dùng hoặc người chấm.
- Chatgpt2api là transport tài khoản local; báo cáo không tuyên bố đây là giao diện ChatGPT Web.
