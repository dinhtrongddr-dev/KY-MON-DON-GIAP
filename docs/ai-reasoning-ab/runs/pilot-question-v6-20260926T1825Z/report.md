# Báo cáo A/B suy luận pilot-question-v6-20260926T1825Z

- Ca: 3; vòng: 1; mẫu: 6
- Hoàn tất: 6; lỗi: 0; verified fallback: 0
- Thắng: A=3, B=0, hòa=0

## Điểm trung bình AI-review

| Chiều | A trực tiếp | B full app |
|---|---:|---:|
| directness | 4.67 | 2.67 |
| naturalness | 4 | 2.33 |
| reasoningCoherence | 4.33 | 2.67 |
| specificity | 5 | 2 |
| actionability | 5 | 2.67 |
| nonRepetition | 3.67 | 2.33 |
| calibration | 4.67 | 3.67 |

## Ghi chú phương pháp

- A chỉ nhận bàn, ánh xạ vai và hướng dẫn phương pháp trung tính; không nhận Planner, Narrative Contract, gate hay kết luận của app.
- B chạy pipeline đầy đủ của app, gồm lập kế hoạch khi cần, Writer, kiểm tra ngữ nghĩa và fallback có kiểm soát.
- Điểm trong báo cáo là AI-review mù, không được ghi nhận là phiếu người dùng hoặc người chấm.
- Chatgpt2api là transport tài khoản local; báo cáo không tuyên bố đây là giao diện ChatGPT Web.
