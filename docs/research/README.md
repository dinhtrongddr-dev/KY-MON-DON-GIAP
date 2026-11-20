# P1 · Tư liệu chuẩn và benchmark (TG-CB-7.0)

Thư mục này là **căn cứ tham chiếu** cho audit TG-CB-7.0. Phạm vi: Thời gia Kỳ Môn, **chuyển bàn + Sách Bổ (拆补 · 符头定元)** (quyết định 1). Các trường phái khác (置闰, 阴盘, 飞盘) chỉ ghi ra để biết chỗ khác nhau, không triển khai.

| File | Nội dung |
|---|---|
| [thuat-ngu-dung-than.md](thuat-ngu-dung-than.md) | Bảng thuật ngữ Hán–Việt, bảng 用神 theo loại việc, vượng suy |
| [cach-cuc-khac-ung.md](cach-cuc-khac-ung.md) | Thư viện 格局 cát/hung, 四害, 十干克应 trọng yếu, 八门克应, 九星, 八神 |
| [ung-ky-trach-thoi.md](ung-ky-trach-thoi.md) | Luật 应期, 择时, 方位, binh pháp/thương chiến, Kích Thần (激神) từng thần |

Các bảng ở đây là **tóm lược do nhóm biên soạn** từ nguồn dưới đây, không chép nguyên văn. Mỗi luật ghi nguồn chính; chỗ các truyền bản khác nhau được ghi "dị bản".

## 1. Nguồn cổ thư (bản chữ Hán)

| Ký hiệu | Sách | Ghi chú dùng trong audit |
|---|---|---|
| YB | 《烟波钓叟歌》 (bản Wikisource, đối chiếu bản trong 《奇门遁甲统宗》) | Bảng cục số 24 tiết khí, 符头定元, 三奇/六仪, 格局 cơ bản (青龙返首, 飞鸟跌穴, 大格, 刑格, 三奇入墓, 六仪击刑, 五不遇时) |
| YY | 《遁甲演义》 (明·程道生), quyển 2 | 奇门吉格, 三诈五假, 九遁, 天三门地四户 |
| TZ | 《奇门遁甲统宗》 | 十干克应 81 cặp, 八门克应, 九星 trị thời |
| BJ | 《御定奇门宝鉴》 | Quy tắc Trực Phù/Trực Sử chuyển cung, 用神 theo việc, 应期 |
| FQ | 《奇门法窍》 (清·锺岳) | 吉格注释 (quyển 6), mở rộng 入墓 từ Tam Kỳ sang Lục Nghi, binh pháp chủ/khách |
| ZG | 《奇门旨归》 | 应期 (điền thực, xung Không, xung Mộ), 择时 |
| MJ | 《奇门遁甲秘笈大全》 | 九遁变化法, 天门地户; bản hợp tuyển, dùng để đối chiếu dị bản |

## 2. Nguồn hiện đại

| Ký hiệu | Sách | Dùng cho |
|---|---|---|
| ZZC | 张志春《神奇之门》《奇门遁甲预测应用》 | 用神 hiện đại theo việc (cầu tài, công việc, hôn nhân, bệnh, kiện, mất đồ), cách đọc 时干/日干, ứng kỳ thực hành |
| LGB | 刘广斌《奇门预测学》 | Vượng suy, 门迫/宫迫, 应期 theo số cung và tiết khí |
| 阴盘 (王凤麟) | Chỉ để biết khác biệt | Không dùng (quyết định 1) |

## 3. Benchmark app và công cụ (kiểm tra 20/11/2026)

| Công cụ | Phương pháp công bố | Trạng thái | Dùng thế nào |
|---|---|---|---|
| Joey Yap Qi Men | — | Không tìm thấy app chính thức đang phát hành (chỉ có PDF không rõ nguồn) | Không dùng |
| Qi Men Dun Jia 1080Ju (iOS, trả phí) | 拆补 | Đang có trên App Store | Đối chiếu tay các ca biên nếu cần |
| E-Bazi (iOS) | 拆补 / 置闰 | Đang có | Như trên |
| mQimen 奇门排盘 (iPad) | 拆补 / 置闰 / 阴盘 | Đang có; có báo lỗi quanh DST | Như trên |
| 大师奇门 / 南方奇门遁甲 / 奇门遁甲-从真版 (iOS) | 拆补, 置闰, 转盘, 飞盘 | Đang có | Như trên |
| 元亨利贞网 / 问真排盘 / 易奇 | — | Không xác minh được bản web lúc kiểm tra | Không dùng |
| kinqimen (PyPI, mã nguồn mở) | 拆补 / 置闰 | Có trên PyPI, cần build `sxtwl` | Không chạy được trong môi trường audit (không cho cài phụ thuộc biên dịch) |

Vì không có công cụ độc lập nào chạy tự động được, P2 dùng **một bản cài đặt độc lập viết lại từ luật gốc** (`tools/audit/qimen-reference.mjs`): không dùng lunar-javascript, lấy trụ ngày từ số ngày Julius, giờ theo 五鼠遁, tiết khí theo kinh độ Mặt Trời (Meeus). Xem `docs/audit/P2-engine.md`.
