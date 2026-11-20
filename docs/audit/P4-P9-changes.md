# P4–P9 · Thay đổi luận, ứng kỳ, chiến lược, Kích Thần, hiệu năng, cấu hình

## P4 · Gate và giọng văn

**Gốc của thiên hướng "trung tính / tích cực một màu"**: `outcomeDimensions` chỉ có trạng thái `positive / conditional / uncertain / unresolved`, còn `primaryJudgment` không bao giờ phát ra kết luận xấu (dù UI, narrative và validation đã có sẵn nhánh `negative`). Trên 36 bàn mẫu câu "ký được hợp đồng A không?", bản cũ cho 25 `conditional` + 11 `unresolved`, không có kết luận xấu nào.

| Thay đổi | File |
|---|---|
| Luật đối xứng: Dụng Thần của tầng dính ≥2 trong 4 hại (Không Vong, Nhập Mộ, Kích Hình, Môn bức), hoặc 1 hại + hung cách nặng, và không có cụm hỗ trợ → `negative`. Có hỗ trợ nhưng chính cụm hỗ trợ cũng dính hại → `conditional_negative`. Tầng thành hình đã `negative` thì các tầng sau cũng `negative` | `dist/qimen/ai/outcomeDimensions.mjs` |
| `answerClass` thêm `negative`, `conditional_negative`; câu chính nói thẳng "không thành theo bàn" | `dist/qimen/ai/primaryJudgment.mjs` |
| Kết luận xấu là hard lock ở mục đầu (`verdict_negative`) và được phép/bắt buộc nói "không thành / bất lợi / nên bỏ" | `dist/qimen/ai/narrativeContract.mjs` |
| Gate tất định `VERDICT_SOFTENED`: kết luận xấu mà bài không có từ kết luận xấu, hoặc có câu làm mềm ("vẫn có cơ hội tốt", "khả quan"…) | `dist/qimen/ai/surfaceReading.mjs` `auditVerdictSoftening` |
| Reviewer: cho phép khung thời gian tương đối (buổi chiều, tuần sau, sau giao tiết…), thêm mã `VERDICT_SOFTENED`, chỉ đòi disclaimer cho y tế/pháp lý/đầu tư/tự hại | `FIDELITY_INSTRUCTIONS` |
| Gate ngày: whitelist mọi ngày engine quy ra (mọi lớp ứng kỳ + biên phạm vi). Ngày lạ báo **theo câu** (`INVENTED_TIME` + câu + danh sách mốc được phép), không còn lỗi chung chung buộc viết lại cả bài. Chế độ so ứng viên vẫn chỉ cho các mốc người dùng nhập | `dist/qimen/ai/readingAudit.mjs`, `synthesisAudit.mjs` |

Phân bố mới trên cùng 36 bàn: 10 `negative`, 7 `conditional_negative`, 15 `conditional`, 4 `unresolved`. Test giọng điệu cân bằng: `tests/tg-cb-7-reading.test.mjs` (4 bàn hung kinh điển phải ra `negative`; mẫu một ngày phải có cả hai chiều).

## P5 · Ứng kỳ nhiều lớp (KM-TIMING-4.0)

`buildTimingLayers` trong `dist/qimen/ai/timingEngine.mjs`. Mỗi mốc có `layer`, `rule`, `reason`, `source`, `confidence` (high/medium/low) và ngày dương lịch theo múi giờ của bàn.

| Lớp | Luật |
|---|---|
| day | Điền thực Không Vong, xung Không, xung Mộ, Mã tinh / xung Mã, hợp→xung / xung→hợp — **mọi luật**, không chỉ luật ưu tiên cao nhất như bản 3.0 |
| xun | Sang tuần Giáp mới thì Dụng Thần ra khỏi Không Vong |
| day/week/month | Số cung Lạc Thư × đơn vị theo vượng suy của Dụng Thần (vượng: ngày, bình: tuần, suy: tháng) |
| term | Dụng Thần suy: tiết khí đầu tiên có chi tháng sinh/đồng hành |
| hour | Câu hỏi trong ngày hoặc nhịp nhanh: khung 2 giờ chạm chi Dụng Thần |

Thêm Không Vong theo tuần ngày (日空, `dayVoidBranches`) cho việc dài hạn. Câu hỏi không nêu thời hạn dùng phạm vi mặc định theo nhịp và vượng suy (14 / 45 / 90 ngày). `candidates` cũ giữ nguyên; khi quét ưu tiên không có mốc mà câu hỏi có thời hạn thì lấy các mốc lớp ngày/tuần có độ tin ≥ medium.

## P6 · Thương chiến (KM-WARFARE-1.0)

`dist/qimen/modes/warfare.mjs`, dùng trong `strategy`, `business`, `negotiation`.

- So lực ta (Nhật can) với đối thủ: đối thủ người dùng nhập, nếu không có thì **Canh** (vai `market_rival` hoặc vị trí Canh trên thiên bàn). Lực = vượng suy cung + cát/hung môn + thần − 0,25 × số hại.
- Chủ/khách tại cung ta: thiên bàn khắc địa bàn = khách lợi (tiên động); ngược lại chủ lợi (hậu động).
- Hư/thực (Không Vong, Đằng Xà, Huyền Vũ, Thái Âm = hư), Cửu Thiên (công), Cửu Địa (thủ), Lục Hợp (đối tác), Mậu (vốn), Sinh Môn (lợi).
- 7 nhánh: tấn công, giành thị phần, ép giá, liên minh, giữ thế, rút lui chiến lược, thăm dò; kèm nhánh dự phòng, **phương** và **giờ** (theo chi của cung hành động).
- Ta đang Không Vong hoặc bị chế (agency constrained) thì giữ nhánh chuẩn bị cũ.
- Writer nhận mục `strategy_play`. Phân bố trên 400 bàn: giành thị phần 107, rút lui 87, tấn công 65, liên minh 52, ép giá 44, thăm dò 28, giữ thế 17.

## P7 · Kích Thần (KM-SPIRIT-ACTIVATION-2.0)

`SPIRIT_PROTOCOLS` trong `dist/qimen/analysis/spiritActivation.mjs`: mỗi thần có mục đích, mục đích hợp, mục đích **cấm**, cách dùng phương (`face` hướng tới, `back` tựa lưng, `project` hướng lực về đối phương), luật giờ (giờ dương/âm của cung, trừ giờ Không Vong) và ghi chú. Không Vong, Nhập Mộ, Kích Hình, Môn bức, Phản Ngâm toàn bàn là **cấm kích cứng**; mục đích bị cấm (ví dụ Đằng Xà/Bạch Hổ/Huyền Vũ cho cầu tài) không bao giờ được đề xuất. Protocol đi tới writer, narrative và thẻ UI.

## P8 · Giảm số vòng gọi AI

| | Trước | Sau |
|---|---|---|
| Lượt tốt nhất | planner (xhigh) + writer (xhigh) + reviewer (xhigh) = 3 | writer (xhigh) + reviewer (**high**) = 2 |
| Khi có lỗi | thêm tối đa 2 × (viết lại **cả bài** + review) = 7 lượt | thêm tối đa 1 lượt **sửa đúng section lỗi** (high, đầu ra ngắn) = 3 lượt |
| Câu còn lỗi sau sửa | viết lại cả bài | cắt đúng câu đó; nếu không cắt được → verified fallback |

- Planner tư vấn thành opt-in (`QIMEN_DELIBERATION=1`).
- Câu đã bị reviewer gắn cờ mà còn nguyên văn sau khi sửa thì bị cắt hoặc rơi về fallback, nên bỏ lượt review thứ hai không mở lỗ hổng.
- Bỏ chuỗi 9router Sol → Gemini khỏi route.
- **Chưa đo trên VPS.** Mục tiêu dưới 3 phút cần kiểm lại bằng một lượt luận thật sau khi deploy.

**Đã dọn (v17.7.0)**: Codex CLI (`local/codex-client.mjs`, helper JSON chuyển sang `local/structured-text.mjs`), gói Windows local (launcher KyMonTray, `START-*`, `LOGIN-WINDOWS.cmd`, script đóng gói, zip tải về), `relay/` (frontend gọi thẳng `ai-origin.kymon.pp.ua`) và script autostart 9router.

## P9 · Cấu hình bằng env (thay bản vá tay trên VPS)

| Mục | Env | File |
|---|---|---|
| Route AI duy nhất `prism` → ChatGPT2API | `QIMEN_DIRECT_MODEL` (mặc định `gpt-6-thinking`), `QIMEN_REASONING_EFFORT` (mặc định `xhigh`), `QIMEN_AUX_REASONING_EFFORT` (mặc định `high`) | `local/ai-client.mjs` |
| Prism helper | `PRISM_MODEL`, `PRISM_REASONING_EFFORT` | `local/prism-client.mjs` |
| Bỏ mã ghép nối | `QIMEN_OPEN_ACCESS=1` (kiểm tra Host/Origin vẫn giữ) | `local/server.mjs` |
| Số lượt sửa | `QIMEN_MAX_REPAIRS` (mặc định 1) | `local/surface-writer.mjs` |

Mẫu: `ops/kymon-vps.env.example`. Phiên bản: luật **TG-CB-7.0**, app **v17.7.0**, protocol vẫn 6 (payload không đổi).
