# P2 · Audit engine lập bàn (`dist/qimen.mjs`, TG-ROTATING-2.0)

Ngày: 20/11/2026 · Nhánh `audit/tg-cb-7` · Phạm vi: chuyển bàn + Sách Bổ (quyết định 1).

## Kết luận

**Không phát hiện lỗi lập bàn.** 6 file lõi đóng băng giữ nguyên (hash trong `verify-release` không đổi).

## Phương pháp

Không chạy được công cụ độc lập của bên thứ ba (xem `docs/research/README.md` §3), nên dùng bản cài đặt độc lập `tools/audit/qimen-reference.mjs`, viết lại từ luật gốc và **không dùng chung mã hay thư viện lịch** với engine:

| Thành phần | Engine | Bản đối chiếu |
|---|---|---|
| Trụ ngày | lunar-javascript `getDayInGanZhiExact` | Số ngày Julius: `(JDN + 49) mod 60` |
| Trụ giờ | lunar-javascript `getTimeInGanZhi` | 五鼠遁 từ can ngày |
| Tiết khí | lunar-javascript (寿星万年历) | Kinh độ Mặt Trời biểu kiến (Meeus ch.25) + ΔT, chia đôi tìm giờ giao |
| Bàn | dịch chỉ số trên vòng | đi từng cung theo chiều kim đồng hồ |

Script `tools/audit/engine-compare.mjs` so **từng cung**: địa bàn, thiên bàn (kể cả can ký Trung 5), sao, môn, thần, Không Vong, Mã tinh; cùng trụ ngày/giờ, tiết khí, âm/dương độn và cục số. Test `tests/engine-reference.test.mjs` chạy lại mỗi lần `npm test`.

## Kết quả (`node tools/audit/engine-compare.mjs 240`)

| Nhóm | Số ca | Sai lệch |
|---|---|---|
| Ngẫu nhiên 1901–2099, 15 múi giờ (−12 → +14, gồm +5:45, +9:30, +12:45) | 240 | 0 |
| Biên giờ (22:59, 23:00, 23:30, 23:59, 00:00, 00:59, 01:00, 11:00, 12:59, 13:00) × 4 múi | 40 | 0 |
| Biên lịch (29/2 các năm 1904, 2000, 2024, 2096; 31/12; 1/1) | 6 | 0 |
| ±1 phút quanh 24 giờ giao tiết năm 2026 (UTC+7) | 48 | 0 (trụ, bàn); tiết khí kiểm theo lunar-javascript |
| **Tổng** | **334** | **0** |

Giờ giao tiết của engine so với Meeus lệch tối đa **13 phút** (ngoài vùng biên 45 phút). Đây là sai số của công thức Meeus độ chính xác thấp, không phải của engine; ca biên ±1 phút đã có test riêng `tests/calendar-boundaries.test.mjs` theo giờ giao tiết của lunar-javascript.

## Các quy ước đã xác nhận (đúng với YB / 拆补)

- Bảng cục số 24 tiết khí khớp ca quyết 烟波钓叟歌 (`TERM_DEFINITIONS`, `dist/qimen.mjs:82-107`).
- Định nguyên theo 符头: chi Tý Ngọ Mão Dậu → Thượng, Dần Thân Tỵ Hợi → Trung, Thìn Tuất Sửu Mùi → Hạ (`dist/qimen.mjs:191-200`).
- Trung 5 ký Khôn 2 cho sao, môn và Trực Sử; Thiên Nhuế mang can Trung 5 (`hostPalace`, `dist/qimen.mjs:216`).
- Giờ Giáp dùng nghi đầu tuần làm can giờ để định Trực Phù (`dist/qimen.mjs:243`).
- Trực Sử đi theo thứ tự 9 cung (dương thuận, âm nghịch) đúng số bước = can giờ trong tuần (`dist/qimen.mjs:264`).
- Bát Thần khởi tại cung Trực Phù, dương thuận âm nghịch theo vòng 8 cung (`dist/qimen.mjs:273-277`).
- Phục/Phản Ngâm sao và môn theo độ dịch 0 / 4 (`dist/qimen.mjs:291-296`).
- Mã tinh theo tam hợp chi giờ; Không Vong theo tuần giờ.
- Năm đổi ở giờ Lập Xuân, tháng đổi ở giờ giao tiết (chính xác đến phút, mọi múi giờ).

## Điểm cần biết (không phải lỗi, ghi lại để chốt quy ước)

| # | Điểm | Hiện trạng | Đề xuất |
|---|---|---|---|
| E1 | Giờ Tý sớm | Ngày đổi lúc 23:00 giờ địa phương (早子时 tính sang ngày mới) | Giữ; ghi rõ trong hướng dẫn. Trường phái 晚子时 không triển khai |
| E2 | Giờ địa phương | Trụ ngày/giờ theo giờ đồng hồ theo múi nhập, **không** dùng giờ Mặt Trời thật | Giữ (đa số app 拆补 làm vậy); có thể thêm tuỳ chọn kinh độ sau này |
| E3 | Không Vong | Chỉ có 时空 (tuần giờ); không có 日空 | Thêm 日空 ở lớp phân tích (không sửa lõi) cho việc dài hạn — đã làm trong P5 (`timingEngine`) |
| E4 | Phương pháp `maoshan` | Định nguyên 5 ngày/nguyên từ giờ giao tiết | Không thuộc phạm vi; giữ để tương thích |
