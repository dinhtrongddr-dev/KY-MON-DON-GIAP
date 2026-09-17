# v17.1.0 · TG-CB-6.1 — Bài luận dễ đọc và căn cứ Kỳ Môn

Ngày phát hành: 17/09/2026. Protocol 5 và Core TG-ROTATING-2.0 giữ nguyên.

## Mục tiêu

Bản này đổi cách **viết và hiển thị** lời luận, không đổi phép lập bàn. Tab đầu là **Bài luận**: kết luận có điều kiện xuất hiện trước, sau đó các đoạn đi qua người hỏi, sự việc, cụm tượng liên quan, dấu hiệu toàn bàn, quan hệ cung, phản chứng và bước đối chiếu thực tế. Prompt yêu cầu ghép Môn–Tinh–Thần–Can thành cơ chế theo đúng câu hỏi, không viết từ điển ký hiệu.

## Căn cứ hiển thị

Giao diện chỉ hiển thị dữ kiện Kỳ Môn đã tính: cung, Môn, Tinh, Thần, Can, Không/Mộ/Hình, vượng suy, phục ngâm/phản ngâm và quan hệ giữa các cung. Rule ID, tên file nguồn, planner, schema, verification label và các chi tiết thuật toán vẫn tồn tại bên trong để validate/fail-closed nhưng không còn xuất hiện trong phần căn cứ người dùng.

## Mã ghép nối

Website, local bridge và Windows launcher cùng chấp nhận mã 4–128 ký tự. Mã ghép nối tiếp tục là cấu hình riêng ngoài Git/ZIP; bản phát hành không hard-code mã production.

## Phiên bản

App: **17.1.0**. Reading contract: **TG-CB-6.1**. Từ bản này, mọi thay đổi được phát hành lên production phải tăng version và audit phải có một mục phiên bản mới; lịch sử không bị ghi đè.

## Kiểm tra

- 167 kiểm thử Node đạt.
- 1 kiểm thử Python đạt.
- Mốc 480 bàn và sáu file Core không đổi.
- Có test riêng cho mã 4 ký tự và UI không lộ `rule_*`/`Nguồn:` trong căn cứ.
- Ba lượt model thật qua 9router trong lúc chuẩn bị bản này không được tính là đạt: hai lượt trả nội dung không parse được và một lượt route không hoàn tất. Vì vậy không dùng chúng làm bằng chứng chất lượng văn; cần kiểm lại khi provider ổn định.
