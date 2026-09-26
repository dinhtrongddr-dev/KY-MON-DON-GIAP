# Báo cáo A/B suy luận pilot-four-v5-20260926T1345Z

- Ca: 4; vòng: 1; mẫu: 8
- Hoàn tất: 8; lỗi: 0; verified fallback: 0
- Thắng: A=4, B=0, hòa=0

## Điểm trung bình AI-review

| Chiều | A trực tiếp | B full app |
|---|---:|---:|
| directness | 4.25 | 3 |
| naturalness | 3.75 | 3 |
| reasoningCoherence | 4 | 2.75 |
| specificity | 5 | 2 |
| actionability | 5 | 3.25 |
| nonRepetition | 3.5 | 2 |
| calibration | 4.5 | 4 |

## Ghi chú phương pháp

- A chỉ nhận bàn, ánh xạ vai và hướng dẫn phương pháp trung tính; không nhận Planner, Narrative Contract, gate hay kết luận của app.
- B chạy pipeline đầy đủ của app, gồm lập kế hoạch khi cần, Writer, kiểm tra ngữ nghĩa và fallback có kiểm soát.
- Điểm trong báo cáo là AI-review mù, không được ghi nhận là phiếu người dùng hoặc người chấm.
- Chatgpt2api là transport tài khoản local; báo cáo không tuyên bố đây là giao diện ChatGPT Web.
