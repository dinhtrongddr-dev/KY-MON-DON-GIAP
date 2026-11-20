# P3 · Audit bộ quy tắc luận

Phạm vi: `dist/qimen/analysis/*`, `dist/qimen/core/patterns.mjs`, `dist/guide.mjs` (bảng điều kiện), `dist/qimen/semantic/`. Đối chiếu với `docs/research/` (ký hiệu nguồn YB, YY, TZ, FQ, ZG, ZZC, LGB).

Phân loại: **ĐÚNG** · **SAI** · **THIẾU** · **DỊ BẢN** (các truyền bản khác nhau, giữ nhưng ghi rõ) · **MÂU THUẪN** (hai chỗ trong code không khớp nhau).

## 1. Đã kiểm, đúng nguồn

| Mục | Vị trí | Nguồn |
|---|---|---|
| Kích Hình Lục Nghi (Mậu 3, Kỷ 2, Canh 8, Tân 9, Nhâm 4, Quý 4) | `dist/guide.mjs:52` | YB |
| Tam Kỳ nhập Mộ (Ất 2, Bính 6, Đinh 8) | `dist/guide.mjs:54` | YY q.2, FQ |
| Lục Nghi nhập Mộ (Mậu 6, Kỷ 8, Canh 8, Tân 4, Nhâm 4, Quý 2) | `dist/guide.mjs:58` | FQ |
| Môn bức = môn khắc cung | `dist/guide.mjs:62`, `structureEngine.mjs` `doorRelation` | TZ |
| Ngũ bất ngộ thời (can giờ khắc can ngày, cùng âm dương) | `dist/qimen/core/patterns.mjs:7` | YB |
| 6 cặp hung cách (Ất+Tân, Tân+Ất, Đinh+Quý, Quý+Đinh, Bính+Canh, Canh+Bính) | `core/patterns.mjs:9`, `structureEngine.mjs` `notablePairs` | YB |
| Thanh Long phản thủ, Phi Điểu điệt huyệt, Đại cách, Hình cách, Phục/Phi cung cách | `structureEngine.mjs` `notablePairs` | YB |
| Tam Kỳ đắc sử (6 cặp; cặp phạm hung bị hạ mức) | `structureEngine.mjs` `sanQiDeShiPairs` | YY |
| Thiên/Địa/Nhân độn | `structureEngine.mjs`, `core/patterns.mjs:15-17` | YY |
| Cửu độn, Tam Trá, Ngũ Giả, Thiên môn Địa hộ, Nguyệt tướng theo trung khí | `formationEngine.mjs` | YY, FQ, MJ |
| Vượng suy Cửu Tinh theo ca quyết | `strength.mjs` `STAR_STATUS` | YB |
| Vượng suy cung theo ngũ hành chung | `strength.mjs` `PALACE_STATUS` | LGB |
| Thập nhị Trường Sinh (khởi điểm 10 can, dương thuận âm nghịch) | `strength.mjs` `LONGEVITY_START` | chuẩn |
| Mã tinh theo tam hợp chi giờ | `dist/qimen.mjs:209-214` | ZZC |
| 81 cặp Thập Can Khắc Ứng có đủ trong corpus | `structureEngine.mjs` `TEN_STEM_RESPONSES` | TZ |
| Phục/Phản Ngâm theo độ dịch sao và môn | `dist/qimen.mjs:291-296` | YB |
| Bảng 用神 theo 13 lĩnh vực | `yongshenResolver.mjs` `PROFILES` | ZZC, BJ |

## 2. Đã sửa trong P3

| # | Loại | Vấn đề | Sửa |
|---|---|---|---|
| R1 | THIẾU | Không có **Tiểu cách** (Canh + Nhâm) | Thêm vào `notablePairs` (`structureEngine.mjs`) |
| R2 | THIẾU | Không có **Tuế / Nguyệt / Nhật / Thời cách** (Canh đè can trụ) | Thêm `PILLAR_STRUCTURES`; bỏ qua trụ có can Giáp (ẩn) và trụ Canh |
| R3 | THIẾU | Không có **Tam Kỳ thăng điện** (Ất Chấn, Bính Ly, Đinh Đoài) | Thêm `WONDER_ASCENDS`; không đủ điều kiện khi cung Không Vong |
| R4 | THIẾU | Hỏi kinh doanh/hợp đồng không có **Canh = đối thủ** mặc định (chỉ có khi người dùng tự nhập Can Chi đối thủ) | Thêm extra `market_rival` (Canh, corroborator) vào hồ sơ `business` (`yongshenResolver.mjs`) |

Test: `tests/tg-cb-7-rules.test.mjs`.

## 3. Ghi nhận, không sửa (cần chủ dự án chốt)

| # | Loại | Vị trí | Mô tả | Đề xuất |
|---|---|---|---|---|
| R5 | DỊ BẢN | `strength.mjs` `DOOR_STATUS` | Bát Môn dùng bảng riêng (đồng = Vượng, ta sinh = Tướng, ta khắc = Hưu, khắc ta = Tù, sinh ta = Phế). LGB và đa số sách hiện đại dùng bảng ngũ hành chung như cung (lệnh sinh môn = Tướng) | Giữ để không đổi hàng loạt kết luận; nếu chuyển, phải chạy lại toàn bộ fixture |
| R6 | MÂU THUẪN | `dist/guide.mjs:58` và `strength.mjs` `stemLongevity` | Bảng mộ ghi Ất mộ Khôn (2, theo ca quyết Tam Kỳ), nhưng Trường Sinh âm nghịch cho Ất mộ ở Tuất (Càn 6). Comment dòng 55-57 nói hai bảng cùng quy ước, thực tế khác nhau ở Ất | Giữ Khôn theo YY/FQ; sửa comment cho đúng (đã sửa ở nhánh này) |
| R7 | THIẾU | `dist/qimen.mjs` (lõi đóng băng) | Chỉ có Không Vong tuần giờ, không có tuần ngày (日空) | Không sửa lõi; P5 tính 日空 trong `timingEngine` cho việc dài hạn |
| R8 | DỊ BẢN | `structureEngine.mjs` Ngọc Nữ thủ môn | Dùng "Đinh thiên bàn ở cung Trực Sử"; dị bản "Trực Sử lâm địa bàn Đinh" | Giữ, đã ghi trong `docs/research/cach-cuc-khac-ung.md` |
| R9 | THIẾU | `structureEngine.mjs` | Chưa có Bột cách (dị bản nhiều), Thiên võng tứ trương (Quý+Quý), Địa võng (Nhâm+Nhâm) như cách riêng; hiện chỉ có trong corpus 81 cặp | Để ở corpus; không nâng thành cách riêng vì dễ trùng Phục Ngâm |
| R10 | Thiên lệch | `formationEngine.mjs` `record()` | Mọi cách cục `verdictEligible:false` — cách cục không bao giờ ảnh hưởng kết luận. Hung cách nặng ở dụng thần chính chỉ tăng `priority`, không kéo kết luận xuống | Xử lý ở P4: gate `VERDICT_SOFTENED` và luật đối xứng (dụng thần chính dính ≥2 hại hoặc hung cách nặng → bắt buộc nói rõ bất lợi) |
| R11 | THIẾU | `usefulGod.mjs` | Không có hồ sơ riêng cho thương chiến (vốn, sản phẩm, khách, đối thủ, đối tác, người quyết) | Xử lý ở P6 |

## 4. Semantic matrix

`dist/qimen/semantic/KM_SEMANTIC_MATRIX_1.1.json` là lớp diễn giải đời thường (không có luật lập bàn). Không thấy mâu thuẫn với các bảng trên; không sửa.
