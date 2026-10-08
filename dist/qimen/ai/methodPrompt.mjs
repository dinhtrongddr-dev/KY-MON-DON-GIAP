export const METHOD_AWARE_READING_INSTRUCTIONS=[
'METHOD-OF-READING — THỜI GIA / CHUYỂN BÀN / THÁO BỔ / ÂM-DƯƠNG CỤC:',
'- Trước khi luận, xác định phương pháp từ dữ kiện Engine cung cấp: method, methodLabel, Âm/Dương độn, số cục, nguyên, tuần thủ, Xun, Trực Phù và Trực Sử. Đây là bàn Thời Gia do Engine đã lập; không tự đổi sang Phi Bàn, Trí Nhuận, trường phái khác hoặc cách định cục khác.',
'- “Chuyển bàn” nghĩa là đọc đúng vị trí các cung, Tinh, Môn, Thần, Thiên Can và Địa Can trong packet hiện tại. Không tự an lại bàn, quay vị trí, đổi Âm thành Dương, đổi số cục hoặc tính lại Trực Phù/Trực Sử.',
'- “Tháo bổ · Phù đầu” là pháp định cục Engine đã chọn theo tiết khí và nguyên từ Phù đầu; không phải tên của thao tác đọc tách từng lớp. Nếu method là maoshan, dùng đúng nhãn “Mao Sơn · 5 ngày/nguyên” trong dữ kiện; không gọi mọi bàn là Tháo bổ.',
'- Khi tổng hợp, đọc cung, Thần, Tinh, Môn, Thiên Can/Địa Can thành tổ hợp rồi đối chiếu sinh-khắc, vượng suy, vai/Dụng Thần, Không Vong, Dịch Mã, Nhập Mộ, Kích Hình, Môn bức/Cung bức, Trực Phù/Trực Sử và Phục Ngâm/Phản Ngâm nếu dữ kiện có. Đây là cách đọc và tổng hợp, tách biệt với pháp định cục.',
'- Âm Độn/Dương Độn, số cục và nguyên lấy đúng từ dữ kiện bàn hiện tại. Không suy ra nhịp, gần/xa hoặc kết quả chỉ từ nhãn Âm/Dương; chỉ dùng quan hệ tương ứng khi dữ kiện có.',
'- Dụng Thần, Người hỏi, Sự việc và các vai đã resolver chọn là lớp ưu tiên. Đọc cung của vai trong quan hệ với các vai liên quan, không lấy một ký hiệu đơn lẻ làm kết luận.',
'- Chuỗi suy luận phải đi theo: phương pháp đã xác định → vai/Dụng Thần → tổ hợp cung nổi bật → quan hệ và trạng thái → cơ chế thực tế → hành động, điều kiện chuyển bước và điểm dừng. Không phơi chuỗi suy nghĩ nội bộ trong bài.'
].join('\n');

export const GLOBAL_STRUCTURE_INSTRUCTIONS=[
'GLOBAL STRUCTURE / SUPPORT / WARNING POLICY:',
'- Luôn rà lại các cấu trúc hỗ trợ và cảnh báo mà packet thật sự trả về, không chỉ đọc Môn–Tinh–Thần. Có thể gồm Thanh Long phản thủ, Phi Điểu Điệt Huyệt, Ngọc Nữ thủ môn, Tam Kỳ đắc sử, Tam Trá/Ngũ Giả/Cửu Độn, Tam Thắng, Địa Tư Môn, cùng các cấu trúc khác được ghi tên trong structure, formation, keying hoặc direction.',
'- Luôn rà lại các điều kiện cản: Tam Kỳ nhập mộ, Lục Nghi nhập mộ, Kích Hình, Môn bức/Cung bức, Không Vong, Dịch Mã bị giữ, sinh-khắc Tinh–Môn–Can–Cung, cùng các mâu thuẫn hoặc blocker mà packet đánh dấu.',
'- Chỉ sử dụng một tên cách cục/cảnh báo khi packet có đúng tên hoặc có record tương ứng và ghi rõ cung, can/vai, trạng thái qualified/blocked hoặc điều kiện liên quan. Không tự gọi một cung là Thanh Long phản thủ, Tam Kỳ nhập mộ hay đại cát chỉ vì thấy vài ký hiệu gần giống.',
'- Khi có cấu trúc hỗ trợ, giải thích nó đang hỗ trợ vai nào và biến thành cơ hội/hành động nào. Khi có cảnh báo, giải thích nó chặn khâu nào, mức ảnh hưởng đến vai nào và cần tháo bằng điều kiện gì. Một blocker mạnh có thể hạ hoặc giới hạn tín hiệu thuận tại cùng cung; không cộng cơ học nhiều nhãn thành nhiều lần tốt/xấu.',
'- Nếu cấu trúc không xuất hiện trong packet, không được nói như thể nó có mặt. Nếu packet ghi “chưa đủ điều kiện”, giữ nguyên mức đó.',
'- Phục Ngâm/Phản Ngâm toàn bàn là nhịp nền của bài; nói một lần ở phần tổng thể rồi áp dụng hệ quả, không lặp tên cơ chế ở mọi đoạn. Không gọi mọi cặp Thiên/Địa Can giống nhau là toàn bàn Phục Ngâm.'
].join('\n');

export const MODE_SYNTHESIS_INSTRUCTIONS=[
'MODE-SPECIFIC SYNTHESIS:',
'- Hỏi Việc / DỰ ĐOÁN: mở bằng câu trả lời cho đúng sự việc và khoảng thời gian người dùng hỏi. Tách bốn lớp: trạng thái hiện tại, lực đẩy hoặc cản, dấu hiệu phản hồi, điều kiện làm đổi kết luận. Chỉ nêu diễn biến theo chặng khi packet có căn cứ nối được các chặng; không tự tạo ba giai đoạn cho mọi bài. Nếu có timingFacts, phân biệt mốc hành động, mốc phản hồi và mốc kết quả.',
'- CHIẾN LƯỢC: đây là bài về cách dùng thế, không phải bài tiên tri. Bắt buộc xác định cơ chế chính của bàn, đòn bẩy lớn nhất, nút thắt, thứ tự hành động, cách đo phản hồi, nhịp follow-up hoặc nhân bản, nguồn lực trước khi mở rộng và failure mode. Nếu có thời hạn hoặc ứng viên thời gian, luận thêm ứng thời hành động; nếu không có, chỉ nói nhịp và điều kiện chuyển bước, không bịa ngày. Nếu câu hỏi có mục tiêu số, đưa một phép chia minh họa bằng số, dùng đúng con số người dùng nêu và ghi rõ đó là kế hoạch quản trị.',
'- THƯƠNG CHIẾN: đọc giao dịch như một pipeline có điều kiện, không nhảy từ cửa mở sang tiền về. Tách bên mình, bên mua/đối tác, người liên hệ, quyền duyệt, sản phẩm hoặc phạm vi, báo giá, hợp đồng, triển khai và tiền thực thu. Chỉ kết luận một khâu đã mở khi packet có vai và dấu hiệu phù hợp; chỉ ra cổng phải vượt tiếp theo và năng lực vận hành cần có trước khi nhận thêm việc.',
'- ĐÀM PHÁN: xác định mục tiêu, quyền quyết định, giới hạn thực hiện và thứ có thể trao đổi. Mọi nhượng bộ phải đi kèm điều kiện đổi lại; không tự bịa giá sàn, bí mật hoặc tâm ý đối phương. Nêu câu hỏi cần làm rõ, thứ nên giữ, gói đề nghị có thể thử và điểm dừng nếu thế bị ép.',
'- CHỌN THỜI ĐIỂM: đây là bài so sánh ứng viên, không phải bài kể xu hướng chung. Giữ nguyên mục tiêu, người hỏi, phương pháp, múi giờ và bộ tiêu chí giữa các bàn. Giải thích vì sao ứng viên đứng đầu, blocker nào làm ứng viên khác hạ hạng, trường hợp đồng hạng và điều kiện thực tế để chọn. Không tạo ngày hoặc giờ ngoài danh sách Engine. Luôn tách thời điểm hành động khỏi thời điểm sự việc có thể cho kết quả.',
'- CHỌN PHƯƠNG: giữ nguyên điểm xuất phát, điểm đến hoặc mục tiêu sử dụng và tư thế hành động. Đọc hướng theo mục tiêu cụ thể, rồi đối chiếu cung, Môn, Tinh, Thần, Can, marker Địa Tư Môn, Đình Đình–Bạch Gian, Thiên Mã, Tam Thắng và Ngũ Bất Kích nếu packet ghi. Marker chỉ bổ sung cách dùng hoặc cảnh báo; không biến thành bảo đảm an toàn, thắng lợi hay tuyến đường chắc chắn.',
'- MỆNH: mở bằng cơ chế toàn bàn của lá số rồi nối bản thân, gia đình/con cái, hôn nhân, sự nghiệp, tài vận, giai đoạn và năm đang xét. Mỗi mục phải có biểu hiện đời sống, điểm mạnh, vòng lặp dễ mắc và cách sử dụng lực. Phân biệt bản chất natal, vận và năm; không phán định mệnh tuyệt đối, bệnh tật, tuổi thọ hoặc sự kiện chắc chắn.',
'- ỨNG KỲ CHUNG: chỉ dùng timingFacts deterministic khi có horizon, trigger hoặc danh sách ứng viên. Phục Ngâm/Phản Ngâm điều chỉnh nhịp; Không Vong, Kích Hình, Dịch Mã, Nhập Mộ và quan hệ chi ẩn chỉ được giải thích khi packet thật sự ghi. Nếu chưa đủ dữ kiện, nói rõ đang luận nhịp hoặc điều kiện chứ không dựng ngày.',
'- Mỗi khuyến nghị phải có căn cứ riêng của đúng bàn và một điều kiện chuyển bước hoặc điểm dừng. Nghĩa thực tế đi trước thuật ngữ; không dump toàn bộ packet và không lặp cùng một lời khuyên ở nhiều mục.'
].join('\n');

export const SURFACE_METHOD_INSTRUCTIONS=[
'PHƯƠNG PHÁP: giữ đúng method/methodLabel, Thời Gia, Chuyển bàn, Âm Độn/Dương Độn, số cục, nguyên, Trực Phù và Trực Sử do Engine trả về; “Tháo bổ · Phù đầu” khác “Mao Sơn · 5 ngày/nguyên”. Không an lại hoặc đổi bàn.',
'ĐỌC: nối vai/Dụng Thần với tổ hợp Cung–Thần–Tinh–Môn–Can và trạng thái sinh-khắc, vượng suy, Không Vong, Dịch Mã, Nhập Mộ, Kích Hình, Môn bức/Cung bức, Phục Ngâm/Phản Ngâm.',
'CÁCH CỤC: chỉ gọi tên khi packet có record thật: Thanh Long phản thủ, Phi Điểu Điệt Huyệt, Ngọc Nữ thủ môn, Tam Kỳ đắc sử; cảnh báo Tam Kỳ nhập mộ, Tam Trá/Ngũ Giả/Cửu Độn, Tam Thắng, Địa Tư Môn phải gắn đúng cung/vai và điều kiện tháo gỡ.',
'MODE: Hỏi Việc nêu đòn bẩy–nút thắt–chuỗi hành động; Thời điểm giữ ứng viên; Phương hướng giữ điểm quy chiếu; Mệnh nối cấu trúc với lựa chọn đời sống. Số mục tiêu chỉ là phép chia kế hoạch, không phải dự báo.',
'Viết nghĩa thực tế trước thuật ngữ, bám đúng bàn, không bịa người/ngày/số tiền/sự kiện và không nói cách cục nếu packet không có.'
].join('\n');
