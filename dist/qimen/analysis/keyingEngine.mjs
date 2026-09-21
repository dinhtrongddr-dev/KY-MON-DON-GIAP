import {elementLink} from './relationships.mjs';

export const KEYING_VERSION='KM-KEYING-3.0';
export const KEYING_PROFILE='CLASSIC_KEYING_ROLE_BOUNDED';
export const EIGHT_DOOR_SOURCE='奇門遁甲秘笈大全·八門克應';
export const THREE_WONDER_SOURCE='奇門遁甲秘笈大全·三奇到宮克應吉凶';
export const STAR_HOUR_SOURCE='遁甲演義·九星十二時克應';
export const DOOR_PALACE_SOURCE='遁甲演義 / 御定奇門遁甲寶鑒·門迫宮迫';

const toneWeight={strong_favorable:1,favorable:.7,contextual:.25,mixed:0,hold:-.25,adverse:-.65,severe_adverse:-1};
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};

const HOME_DOOR=Object.freeze({1:'xiu',2:'si',3:'shang',4:'du',6:'kai',7:'fear',8:'sheng',9:'jing'});
const DOOR_VI=Object.freeze({kai:'Khai',xiu:'Hưu',sheng:'Sinh',shang:'Thương',du:'Đỗ',jing:'Cảnh',si:'Tử',fear:'Kinh'});
const STAR_VI=Object.freeze({peng:'Thiên Bồng',rui:'Thiên Nhuế',chong:'Thiên Xung',fu:'Thiên Phụ',qin:'Thiên Cầm',xin:'Thiên Tâm',zhu:'Thiên Trụ',ren:'Thiên Nhậm',ying:'Thiên Anh'});
const BRANCH_VI=Object.freeze({'子':'Tý','丑':'Sửu','寅':'Dần','卯':'Mão','辰':'Thìn','巳':'Tỵ','午':'Ngọ','未':'Mùi','申':'Thân','酉':'Dậu','戌':'Tuất','亥':'Hợi'});

const pair=(tone,plainMeaning)=>Object.freeze({tone,weight:toneWeight[tone],plainMeaning});
const D=Object.freeze({
  kai:Object.freeze({
    kai:pair('favorable','Cửa mở gặp nền mở: thuận tiếp cận, công khai và triển khai việc chính nếu các điều kiện khác không cản.'),
    xiu:pair('strong_favorable','Mở việc gặp nền hòa: thuận gặp người, thương lượng, giao dịch và mở kênh hợp tác.'),
    sheng:pair('strong_favorable','Mở việc gặp nền tăng trưởng: thuận mở cơ hội, tìm nguồn lực và đưa việc sang bước phát triển.'),
    shang:pair('adverse','Mở việc gặp nền va chạm: thay đổi hoặc di chuyển dễ phát sinh hao tổn; cần giảm cưỡng ép.'),
    du:pair('adverse','Mở việc gặp nền đóng: hồ sơ, thông tin hoặc quyền tiếp cận dễ bị chặn hay thất lạc.'),
    jing:pair('mixed','Mở việc gặp nền hiển lộ: có cơ hội gặp người/được thấy nhưng văn bản và cách trình bày dễ thành điểm vướng.'),
    si:pair('mixed','Mở việc gặp nền kết thúc: thường phải xử lý phần cũ, tranh chấp hoặc lo ngại trước khi mở được bước mới.'),
    fear:pair('adverse','Mở việc gặp nền kinh động: dễ phát sinh nghi ngờ, khẩu thiệt hoặc tranh luận; không nên coi “có cửa” là đã thông.')
  }),
  xiu:Object.freeze({
    kai:pair('strong_favorable','Giữ nhịp hòa gặp nền mở: thuận mở cửa hàng, tiếp cận quý nhân, cầu tài hoặc khởi động mềm.'),
    xiu:pair('favorable','Hòa gặp hòa: thuận điều đình, cầu người và củng cố; tốt hơn tiến quá gấp.'),
    sheng:pair('favorable','Hòa gặp tăng trưởng: lợi ích có thể đến chậm nhưng có đường nuôi dưỡng và tích lũy.'),
    shang:pair('mixed','Hòa gặp va chạm: có thể có tin vui ở một mặt nhưng đổi việc/cầu tài dễ không như ý.'),
    du:pair('adverse','Hòa gặp đóng: tiền hoặc vật thất lạc/khó truy; kênh phối hợp không thông.'),
    jing:pair('adverse','Hòa gặp hiển lộ: văn thư, ấn tín hoặc lời nói dễ không đến đúng lúc và sinh khẩu thiệt.'),
    si:pair('adverse','Hòa gặp kết thúc: việc giấy tờ, đi xa hoặc vấn đề sức khỏe tượng trưng cần thận trọng, không ép tiến.'),
    fear:pair('adverse','Hòa gặp kinh động: dễ hao tài, lo sợ hoặc tranh luận; ưu tiên ổn định lại thông tin.')
  }),
  sheng:Object.freeze({
    kai:pair('strong_favorable','Tăng trưởng gặp nền mở: thuận gặp người, mở cơ hội và tìm nguồn lực.'),
    xiu:pair('favorable','Tăng trưởng gặp nền hòa: thuận tìm lợi ích qua hợp tác, chăm sóc và tích lũy.'),
    sheng:pair('favorable','Tăng trưởng gặp tăng trưởng: thuận cầu tài hoặc mở rộng có kiểm soát.'),
    shang:pair('adverse','Tăng trưởng gặp va chạm: người/đường đi dễ biến động; cần tính chi phí thay đổi.'),
    du:pair('adverse','Tăng trưởng gặp nền đóng: có nguy cơ hao nguồn lực vì thông tin kín hoặc hành động không minh bạch.'),
    jing:pair('contextual','Tăng trưởng gặp hiển lộ: giấy tờ/truyền thông trở thành điều kiện chính; cần kiểm tra nội dung trước khi mở rộng.'),
    si:pair('adverse','Tăng trưởng gặp nền kết thúc: tài sản, thủ tục hoặc sức khỏe tượng trưng dễ thành lực cản; không suy “sinh” là tự cứu mọi việc.'),
    fear:pair('mixed','Tăng trưởng gặp kinh động: có thể vẫn có lợi ích nhưng đi kèm tranh luận, chậm hồi phục hoặc tranh chấp tài sản.')
  }),
  shang:Object.freeze({
    kai:pair('adverse','Va chạm gặp nền mở: mở việc/di chuyển vẫn dễ hao lực; cần giảm kỳ vọng từ một cửa thuận.'),
    xiu:pair('adverse','Va chạm gặp nền hòa: nhờ người hoặc cầu danh dễ không đạt như mong muốn; phải xử lý xung đột trước.'),
    sheng:pair('contextual','Va chạm gặp tăng trưởng: thay đổi tài sản hoặc công việc có thể xảy ra nhưng chi phí chuyển đổi cao.'),
    shang:pair('severe_adverse','Va chạm chồng va chạm: tăng nguy cơ tổn hao, xung đột hoặc quyết định quá gấp.'),
    du:pair('severe_adverse','Va chạm gặp nền đóng: biến động dễ đi vào bế tắc, tranh chấp hoặc xử lý bắt buộc.'),
    jing:pair('adverse','Va chạm gặp hiển lộ: văn bản/lời nói dễ làm mâu thuẫn công khai hơn.'),
    si:pair('severe_adverse','Va chạm gặp nền kết thúc: không thuận cưỡng hành, nhất là việc cần an toàn hoặc ổn định.'),
    fear:pair('severe_adverse','Va chạm gặp kinh động: dễ tăng lo sợ, tranh chấp và tổn hao; ưu tiên hạ xung lực.')
  }),
  du:Object.freeze({
    kai:pair('mixed','Đóng gặp nền mở: có thể tiếp cận người có quyền nhưng thường phải chịu chi phí/đi vòng trước khi thông.'),
    xiu:pair('favorable','Đóng gặp nền hòa: thích hợp tìm lợi ích nhỏ, nghiên cứu và giải quyết kín đáo.'),
    sheng:pair('adverse','Đóng gặp tăng trưởng: tài sản/nguồn lực dễ bị khóa hoặc phát sinh hao hụt vì kênh không thông.'),
    shang:pair('adverse','Đóng gặp va chạm: tranh chấp nội bộ hoặc tài sản dễ làm tổn hao.'),
    du:pair('adverse','Đóng chồng đóng: bế tắc tự củng cố; cần mở nút thông tin hoặc quyền truy cập trước.'),
    jing:pair('adverse','Đóng gặp hiển lộ: hồ sơ/ấn tín dễ bị trì hoãn hoặc kẹt ở khâu công khai.'),
    si:pair('adverse','Đóng gặp nền kết thúc: dễ mất giấy tờ/tài sản hoặc phát sinh chi phí xử lý phần cũ.'),
    fear:pair('adverse','Đóng gặp kinh động: lo ngại, khẩu thiệt hoặc tranh chấp xuất hiện quanh phần chưa rõ.')
  }),
  jing:Object.freeze({
    kai:pair('favorable','Hiển lộ gặp nền mở: thuận công bố, xin duyệt, trình hồ sơ hoặc được nhìn thấy đúng chỗ.'),
    xiu:pair('adverse','Hiển lộ gặp nền hòa: văn bản hoặc thông tin dễ thất lạc/kéo dài tranh luận.'),
    sheng:pair('favorable','Hiển lộ gặp tăng trưởng: truyền thông/hồ sơ có thể hỗ trợ lợi ích và tiến độ nếu nội dung đúng.'),
    shang:pair('adverse','Hiển lộ gặp va chạm: dễ sinh khẩu thiệt trong người thân/đối tác hoặc hao tài vì lời nói.'),
    du:pair('mixed','Hiển lộ gặp nền đóng: tài liệu có thể bị mất/chặn; sau khi xử lý phần thất thoát mới ổn.'),
    jing:pair('adverse','Hiển lộ chồng hiển lộ: việc chưa khởi động đã dễ lộ lo ngại, dư luận hoặc áp lực hình ảnh.'),
    si:pair('adverse','Hiển lộ gặp nền kết thúc: văn thư/tài sản dễ kéo vào tranh chấp hoặc thủ tục đóng việc.'),
    fear:pair('severe_adverse','Hiển lộ gặp kinh động: lời nói/kiện tụng hoặc thông tin tiêu cực dễ kéo dài.')
  }),
  si:Object.freeze({
    kai:pair('favorable','Kết thúc gặp nền mở: có cửa xử lý hồ sơ cũ, tìm người có quyền hoặc khép việc theo thủ tục.'),
    xiu:pair('adverse','Kết thúc gặp nền hòa: cầu tài hoặc mở việc mới không thuận; chỉ hợp thu gọn/giải quyết hậu sự của việc cũ.'),
    sheng:pair('mixed','Kết thúc gặp tăng trưởng: có thể thu hồi một phần lợi ích nhưng phải tách rõ kết thúc với tái sinh.'),
    shang:pair('severe_adverse','Kết thúc gặp va chạm: tranh chấp/biến động dễ tăng mạnh; tránh cưỡng tiến.'),
    du:pair('adverse','Kết thúc gặp nền đóng: hao tài hoặc vấn đề tồn đọng dễ kéo dài.'),
    jing:pair('mixed','Kết thúc gặp hiển lộ: giấy tờ/tài sản có thể phải ra công khai; thường có căng thẳng trước khi ổn.'),
    si:pair('severe_adverse','Kết thúc chồng kết thúc: trì trệ mạnh; ưu tiên đóng, thanh lý hoặc dừng phần không còn hiệu quả.'),
    fear:pair('severe_adverse','Kết thúc gặp kinh động: lo sợ, tranh chấp hoặc vấn đề sức khỏe tượng trưng dễ kéo dài.')
  }),
  fear:Object.freeze({
    kai:pair('mixed','Kinh động gặp nền mở: có thể gặp người giải quyết nhưng trước đó dễ có lo sợ, tranh luận hoặc thủ tục.'),
    xiu:pair('mixed','Kinh động gặp nền hòa: cầu tài/khẩu thiệt có thể chậm rồi dịu; cần kiên nhẫn.'),
    sheng:pair('mixed','Kinh động gặp tăng trưởng: lợi ích có thể xuất hiện nhưng đi kèm lo ngại hoặc áp lực sinh hoạt.'),
    shang:pair('severe_adverse','Kinh động gặp va chạm: dễ lộ mâu thuẫn, tranh chấp hoặc hành động gây tổn hao.'),
    du:pair('mixed','Kinh động gặp nền đóng: có mất mát/lo sợ nhưng mức nguy cơ còn phụ thuộc dữ kiện thực tế; cần xác minh.'),
    jing:pair('severe_adverse','Kinh động gặp hiển lộ: khẩu thiệt hoặc kiện tụng dễ kéo dài và thành công khai.'),
    si:pair('severe_adverse','Kinh động gặp nền kết thúc: bất ổn quanh nhà/tài sản/phần việc cũ dễ sinh thị phi.'),
    fear:pair('severe_adverse','Kinh động chồng kinh động: lo âu, tranh luận và nhiễu thông tin tăng; không nên ra quyết định từ phản ứng đầu tiên.')
  })
});

const S=Object.freeze({
  kai:Object.freeze({
    '戊':pair('favorable','Mở việc gặp Mậu: thuận tài danh và nguồn lực nếu hồ sơ/quyền tiếp cận rõ.'),
    '乙':pair('favorable','Mở việc gặp Ất: có thể tìm lợi ích nhỏ hoặc xử lý chi tiết thuận.'),
    '丙':pair('favorable','Mở việc gặp Bính: thuận gặp người có quyền, công khai và được ghi nhận.'),
    '丁':pair('favorable','Mở việc gặp Đinh: tin tức, văn thư hoặc phản hồi từ xa dễ đến.'),
    '己':pair('mixed','Mở việc gặp Kỷ: đầu việc dễ còn phân tán hoặc chưa ổn định.'),
    '庚':pair('adverse','Mở việc gặp Canh: đường đi/tranh chấp chia đôi hướng; cần chọn một quy trình rõ.'),
    '辛':pair('contextual','Mở việc gặp Tân: chi tiết, người phụ hoặc hành trình cần xác minh kỹ.'),
    '壬':pair('adverse','Mở việc gặp Nhâm: đi xa/mở rộng dễ hao hụt hoặc sai nhịp.'),
    '癸':pair('adverse','Mở việc gặp Quý: dễ thất thoát nhỏ hoặc vướng thông tin kín.')
  }),
  xiu:Object.freeze({
    '戊':pair('favorable','Hòa gặp Mậu: nguồn lực có xu hướng dễ phối hợp.'),
    '乙':pair('mixed','Hòa gặp Ất: việc nhỏ dễ hơn việc lớn; không nên nâng cam kết quá nhanh.'),
    '丙':pair('favorable','Hòa gặp Bính: văn bản và trao đổi có xu hướng dễ thống nhất.'),
    '丁':pair('favorable','Hòa gặp Đinh: thuận dừng tranh chấp, làm dịu và thu xếp.'),
    '己':pair('adverse','Hòa gặp Kỷ: tình hình kín và chưa sáng, cần xác minh.'),
    '庚':pair('mixed','Hòa gặp Canh: tranh chấp giấy tờ có thể khóa rồi mở; chưa nên coi là đã giải quyết.'),
    '辛':pair('mixed','Hòa gặp Tân: phần cần sửa có thể dịu nhưng đồ thất lạc/thông tin mất chưa chắc tìm được.'),
    '壬':pair('adverse','Hòa gặp Nhâm: dễ bị kéo vào tranh luận hoặc liên đới.'),
    '癸':pair('adverse','Hòa gặp Quý: dễ bị kéo vào tranh luận hoặc liên đới kín.')
  }),
  sheng:Object.freeze({
    '戊':pair('strong_favorable','Tăng trưởng gặp Mậu: thuận cầu tài, giao dịch và tiếp cận nguồn lực.'),
    '乙':pair('favorable','Tăng trưởng gặp Ất: tiến độ có thể chậm nhưng xu hướng nuôi dưỡng vẫn còn.'),
    '丙':pair('strong_favorable','Tăng trưởng gặp Bính: thuận hồ sơ, danh vị, liên hệ và các bước mở rộng rõ ràng.'),
    '丁':pair('strong_favorable','Tăng trưởng gặp Đinh: thuận cho trao đổi, tài lợi và đi lại nếu không có cản trực tiếp.'),
    '己':pair('favorable','Tăng trưởng gặp Kỷ: có dấu hiệu được hỗ trợ/bảo hộ nhưng vẫn cần kiểm tra điều kiện.'),
    '庚':pair('adverse','Tăng trưởng gặp Canh: tài sản dễ tranh chấp, hao hụt hoặc thất lạc.'),
    '辛':pair('mixed','Tăng trưởng gặp Tân: có vấn đề cần sửa/chăm sóc trước khi chuyển thuận.'),
    '壬':pair('mixed','Tăng trưởng gặp Nhâm: tài vật có thể thất lạc rồi tìm lại; không nên bỏ quy trình kiểm soát.'),
    '癸':pair('mixed','Tăng trưởng gặp Quý: một số việc vẫn thuận nhưng cam kết/hôn nhân tượng trưng dễ khó chốt.')
  }),
  shang:Object.freeze({
    '戊':pair('adverse','Va chạm gặp Mậu: mất mát hoặc phần đã rời tay khó lấy lại.'),
    '乙':pair('adverse','Va chạm gặp Ất: cầu tài khó và dễ phát sinh hao hụt.'),
    '丙':pair('adverse','Va chạm gặp Bính: đi lại/triển khai dễ mất công hoặc tổn thất.'),
    '丁':pair('adverse','Va chạm gặp Đinh: văn bản/ấn tín dễ thiếu tin cậy hoặc sai chi tiết.'),
    '己':pair('adverse','Va chạm gặp Kỷ: hao tài và sức lực; cần thu hẹp phạm vi.'),
    '庚':pair('severe_adverse','Va chạm gặp Canh: tranh chấp dễ tăng cấp; không thuận đối đầu cứng.'),
    '辛':pair('adverse','Va chạm gặp Tân: quan hệ dễ tích tụ oán hoặc bất mãn kín.'),
    '壬':pair('adverse','Va chạm gặp Nhâm: dễ bị liên đới bởi việc sai phạm/thất thoát của người khác.'),
    '癸':pair('severe_adverse','Va chạm gặp Quý: tranh tụng dễ oan khuất hoặc khó làm rõ; cần bằng chứng ngoài tượng.')
  }),
  du:Object.freeze({
    '戊':pair('mixed','Đóng gặp Mậu: việc công khai khó thành nhưng cách kín/thu gọn có thể giữ được nguồn lực.'),
    '乙':pair('adverse','Đóng gặp Ất: tìm lợi ích kín dễ phát sinh mập mờ hoặc tranh chấp.'),
    '丙':pair('adverse','Đóng gặp Bính: văn bản/hợp đồng dễ thất lạc hoặc sai tuyến.'),
    '丁':pair('adverse','Đóng gặp Đinh: giấy tờ hoặc khiếu nại dễ kéo vào tranh tụng.'),
    '己':pair('severe_adverse','Đóng gặp Kỷ: mưu kín gây hại dễ phản tác dụng và sinh thị phi.'),
    '庚':pair('severe_adverse','Đóng gặp Canh: tranh tụng dễ dẫn tới xử lý bất lợi; tránh vượt quy trình.'),
    '辛':pair('severe_adverse','Đóng gặp Tân: va chạm và tranh tụng dễ gây tổn hại rõ.'),
    '壬':pair('severe_adverse','Đóng gặp Nhâm: nguy cơ dính việc không minh bạch hoặc thất thoát tăng.'),
    '癸':pair('severe_adverse','Đóng gặp Quý: nhiều việc cùng bị khóa; cần tháo từng nút thay vì ép tiến.')
  }),
  jing:Object.freeze({
    '戊':pair('mixed','Hiển lộ gặp Mậu: tài sản/lợi ích dễ thành điểm tranh luận; đi xa lại có thể thuận hơn tùy việc.'),
    '乙':pair('adverse','Hiển lộ gặp Ất: tranh tụng hoặc thỏa thuận dễ chưa thành.'),
    '丙':pair('adverse','Hiển lộ gặp Bính: văn bản quá gấp dễ sinh lỗi hoặc bất lợi.'),
    '丁':pair('adverse','Hiển lộ gặp Đinh: ấn tín/hồ sơ dễ kéo theo thị phi nếu công bố chưa đúng lúc.'),
    '己':pair('adverse','Hiển lộ gặp Kỷ: dễ bị kéo vào thủ tục hoặc tranh chấp liên đới.'),
    '庚':pair('adverse','Hiển lộ gặp Canh: tự đẩy mình vào tranh luận; cần giảm phát ngôn đối đầu.'),
    '辛':pair('adverse','Hiển lộ gặp Tân: tranh luận cá nhân/quan hệ dễ nổi lên thành công khai.'),
    '壬':pair('adverse','Hiển lộ gặp Nhâm: dễ bị liên đới bởi thất thoát hoặc việc không minh bạch.'),
    '癸':pair('adverse','Hiển lộ gặp Quý: người phụ/khâu yếu dễ chịu tổn hại; cần kiểm tra trách nhiệm.')
  }),
  si:Object.freeze({
    '戊':pair('adverse','Kết thúc gặp Mậu: lợi ích dễ không minh bạch hoặc khó sử dụng ngay.'),
    '乙':pair('adverse','Kết thúc gặp Ất: việc cầu xin/đề nghị dễ không thành.'),
    '丙':pair('adverse','Kết thúc gặp Bính: thông tin dễ làm tăng lo ngại hoặc nghi vấn.'),
    '丁':pair('adverse','Kết thúc gặp Đinh: người lớn tuổi/khâu yếu cần được chú ý, không suy thành bệnh thật.'),
    '己':pair('severe_adverse','Kết thúc gặp Kỷ: tranh chấp hoặc vấn đề sức khỏe tượng trưng dễ kéo dài.'),
    '庚':pair('severe_adverse','Kết thúc gặp Canh: sinh nở/khởi tạo tượng trưng có áp lực cao; không dùng làm chẩn đoán.'),
    '辛':pair('adverse','Kết thúc gặp Tân: mất mát/thất lạc khó truy hồi nếu thiếu bằng chứng.'),
    '壬':pair('adverse','Kết thúc gặp Nhâm: tranh tụng dễ tự làm lộ điểm yếu.'),
    '癸':pair('adverse','Kết thúc gặp Quý: cam kết/hôn nhân tượng trưng dễ không thuận.')
  }),
  fear:Object.freeze({
    '戊':pair('adverse','Kinh động gặp Mậu: dễ hao tài và tin tức bị chặn.'),
    '乙':pair('adverse','Kinh động gặp Ất: cầu tài khó; cần kiểm tra lại giả định lợi ích.'),
    '丙':pair('adverse','Kinh động gặp Bính: văn bản/ấn tín dễ gây lo ngại hoặc tranh luận.'),
    '丁':pair('adverse','Kinh động gặp Đinh: tranh tụng/lời nói dễ kéo liên đới.'),
    '己':pair('adverse','Kinh động gặp Kỷ: sự cố nhỏ dễ thành tranh cãi; cần quản lý bằng chứng.'),
    '庚':pair('severe_adverse','Kinh động gặp Canh: đi lại/triển khai dễ tổn hao hoặc gặp tranh chấp mạnh.'),
    '辛':pair('adverse','Kinh động gặp Tân: tranh tụng quan hệ dễ tăng.'),
    '壬':pair('severe_adverse','Kinh động gặp Nhâm: thủ tục/kiện tụng hoặc áp lực sức khỏe tượng trưng tăng mạnh.'),
    '癸':pair('adverse','Kinh động gặp Quý: đồ thất lạc/thông tin mất khó truy nếu không có kênh kiểm chứng.')
  })
});

const WONDER=Object.freeze({
  '乙':Object.freeze({
    6:pair('favorable','Ất Kỳ đến Càn: cổ tượng thiên về tài sản, nguồn lực và người hỗ trợ từ bên ngoài.'),
    1:pair('favorable','Ất Kỳ đến Khảm: cổ tượng thiên về dòng tiền/tin hiệu đến sau một nhịp ngắn.'),
    8:pair('favorable','Ất Kỳ đến Cấn: cổ tượng thiên về thêm nguồn lực, người hoặc vật hỗ trợ sau thời gian tích lũy.'),
    3:pair('favorable','Ất Kỳ đến Chấn: cổ tượng thiên về tài vật đến qua hoạt động/di chuyển; vẫn cần kiểm chứng thực tế.'),
    4:pair('favorable','Ất Kỳ đến Tốn: cổ tượng thiên về mở rộng quan hệ và nguồn lực qua giao tiếp/di chuyển.'),
    9:pair('favorable','Ất Kỳ đến Ly: cổ tượng thiên về lợi ích được hiển lộ; không biến thành lời hứa “phát tài”.'),
    2:pair('favorable','Ất Kỳ đến Khôn: cổ tượng thiên về tài vật/văn thư đến qua người và hậu cần.'),
    7:pair('favorable','Ất Kỳ đến Đoài: cổ tượng thiên về giao dịch, tài sản và tin vui qua giao tiếp.')
  }),
  '丙':Object.freeze({
    6:pair('favorable','Bính Kỳ đến Càn: cổ tượng thiên về tài sản, văn thư và cơ hội từ quan hệ bên ngoài.'),
    1:pair('favorable','Bính Kỳ đến Khảm: cổ tượng thiên về nguồn lực sinh từ hoàn cảnh biến động; cần kiểm soát rủi ro.'),
    8:pair('favorable','Bính Kỳ đến Cấn: cổ tượng thiên về tài vật và vị thế tích lũy dần.'),
    3:pair('strong_favorable','Bính Kỳ đến Chấn: cổ tượng thiên về động lực mạnh, tin/hoạt động mở đường cho nguồn lực.'),
    4:pair('favorable','Bính Kỳ đến Tốn: cổ tượng thiên về tin vui, giao tiếp và cơ hội tài chính đến nhanh.'),
    9:pair('favorable','Bính Kỳ đến Ly: cổ tượng thiên về tăng trưởng qua hiển lộ/danh tiếng.'),
    2:pair('favorable','Bính Kỳ đến Khôn: cổ tượng thiên về tài vật/hậu cần tăng qua người hoặc tổ chức.'),
    7:pair('favorable','Bính Kỳ đến Đoài: cổ tượng thiên về giao dịch và tài sản qua tiếp xúc, lời nói hoặc văn bản.')
  }),
  '丁':Object.freeze({
    6:pair('favorable','Đinh Kỳ đến Càn: cổ tượng thiên về thu lợi qua việc xử lý cụ thể, đất/tài sản hoặc hành động dứt điểm.'),
    1:pair('strong_favorable','Đinh Kỳ đến Khảm: cổ tượng thiên về việc vui, hòa hợp và phối hợp thuận.'),
    8:pair('favorable','Đinh Kỳ đến Cấn: cổ tượng thiên về tăng người/nguồn lực và tích lũy tài sản.'),
    3:pair('favorable','Đinh Kỳ đến Chấn: cổ tượng thiên về quan hệ và nguồn lực đến qua hoạt động/kết nối.'),
    4:pair('severe_adverse','Đinh Kỳ đến Tốn: nguồn cổ ghi ứng tượng tổn thất; app chỉ dùng như cảnh báo giảm chắc chắn, không suy tai họa cụ thể.'),
    9:pair('favorable','Đinh Kỳ đến Ly: cổ tượng thiên về lợi ích qua hiển lộ, kỹ năng hoặc xử lý vấn đề.'),
    2:pair('severe_adverse','Đinh Kỳ đến Khôn: nguồn cổ ghi hao tài; app chỉ dùng như cảnh báo nguồn lực, không suy sự kiện cụ thể.'),
    7:pair('favorable','Đinh Kỳ đến Đoài: cổ tượng thiên về văn thư, tài sản và kết quả giao dịch.')
  })
});

export function doorDoorResponse(heavenDoorId,earthDoorId){
  const row=D[heavenDoorId]?.[earthDoorId];if(!row)return null;
  return freeze({id:`door_door_${heavenDoorId}_${earthDoorId}`,heavenDoor:heavenDoorId,earthDoor:earthDoorId,
    heavenDoorVi:DOOR_VI[heavenDoorId],earthDoorVi:DOOR_VI[earthDoorId],source:EIGHT_DOOR_SOURCE,...row,
    verdictEligible:false,meaning:'Bát Môn Khắc Ứng là lớp điều kiện; không tự thay kết luận hiện tại.'});
}
export function doorStemResponse(doorId,stem){
  const row=S[doorId]?.[stem];if(!row)return null;
  return freeze({id:`door_stem_${doorId}_${stem}`,door:doorId,doorVi:DOOR_VI[doorId],stem,source:EIGHT_DOOR_SOURCE,...row,
    verdictEligible:false,meaning:'Môn + Kỳ/Nghi chỉ bổ sung cách biểu hiện của đúng vai/cung đang xét.'});
}
export function threeWonderPalaceResponse(stem,palace){
  const row=WONDER[stem]?.[palace];if(!row)return null;
  return freeze({id:`wonder_palace_${stem}_${palace}`,stem,palace,source:THREE_WONDER_SOURCE,...row,
    verdictEligible:false,meaning:'Tam Kỳ đáo cung là lớp ứng tượng cổ; không dùng riêng để dự báo tiền, bệnh, hôn nhân hoặc tai họa.'});
}

export function doorPalaceClass(doorElement,palaceElement){
  const relation=elementLink(doorElement,palaceElement);
  const map={
    same:{code:'same_element',classicalLabel:'Tỷ hòa',plainMeaning:'Môn và Cung cùng hành: điều kiện tương đồng, nhưng không tự chứng minh thuận lợi.'},
    generates:{code:'he',classicalLabel:'Hòa',plainMeaning:'Môn sinh Cung: cổ gọi Hòa; cửa bỏ lực nuôi môi trường, thuận hay hao còn tùy đúng mục tiêu.'},
    generated_by:{code:'yi',classicalLabel:'Nghĩa',plainMeaning:'Cung sinh Môn: cổ gọi Nghĩa; môi trường nâng cửa, giúp chức năng của Môn dễ phát huy hơn.'},
    controls:{code:'door_controls_palace',classicalLabel:'Bức/迫',plainMeaning:'Môn khắc Cung: cửa ép môi trường; cát môn bị ép thì việc thuận khó trọn, hung môn có thể làm lực cản rõ hơn.'},
    controlled_by:{code:'palace_controls_door',classicalLabel:'Chế/制',plainMeaning:'Cung khắc Môn: môi trường chế cửa; cần đọc chiều khắc thật thay vì suy từ tên dị bản.'}
  };
  return freeze({...map[relation.kind],relation:relation.kind,source:DOOR_PALACE_SOURCE,
    namingNote:'Các truyền bản có dị danh Môn bức/Cung bức; KM-KEYING-3.0 lấy chiều ngũ hành làm chuẩn, nhãn cổ chỉ để tham chiếu.'});
}

const STAR_IDS=Object.keys(STAR_VI);
const BRANCHES=Object.keys(BRANCH_VI);
export const STAR_HOUR_INDEX=freeze(Object.fromEntries(STAR_IDS.flatMap(star=>BRANCHES.map(branch=>[
  `${star}_${branch}`,{
    id:`star_hour_${star}_${branch}`,star,starVi:STAR_VI[star],branch,branchVi:BRANCH_VI[branch],
    source:STAR_HOUR_SOURCE,sourceSection:`九星${branch}時克應`,scope:'classical_context_only',weight:0,tone:'contextual',
    verdictEligible:false,
    plainMeaning:`${STAR_VI[star]} tại giờ ${BRANCH_VI[branch]} có mục Khắc Ứng riêng trong cổ thư. KM-KEYING-3.0 chỉ đánh dấu corpus này để audit; không chuyển trực tiếp ứng tượng mai táng/xuất hành cổ thành dự báo hiện đại.`
  }
]))));
export function starHourResponse(starId,hourBranch){return STAR_HOUR_INDEX[`${starId}_${hourBranch}`]||null;}

function actorIdsForStem(roles,stem){return roles.filter(r=>r.stem===stem).map(r=>r.id);}
export function analyzeKeying(board,palaces,roles=[]){
  const hourBranch=board.pillars.hour.branch.han,byPalace={},allDoorDoor=[],allDoorStem=[],allWonders=[],allStarHour=[];
  for(const p of palaces){
    const palaceRoles=roles.filter(r=>r.palace===p.number),actorIds=palaceRoles.map(r=>r.id);
    const earthDoor=HOME_DOOR[p.number],doorDoor=doorDoorResponse(p.door.id,earthDoor);
    const doorStems=p.heavenStems.map((stem,index)=>{
      const row=doorStemResponse(p.door.id,stem.han);if(!row)return null;
      return {...row,carried:index>0,actorIds:actorIdsForStem(palaceRoles,stem.han)};
    }).filter(Boolean);
    const wonders=p.heavenStems.filter(s=>['乙','丙','丁'].includes(s.han)).map((stem,index)=>{
      const row=threeWonderPalaceResponse(stem.han,p.number);if(!row)return null;
      return {...row,carried:p.heavenStems.indexOf(stem)>0,actorIds:actorIdsForStem(palaceRoles,stem.han)};
    }).filter(Boolean);
    const starHour=starHourResponse(p.star.id,hourBranch);
    const doorPalace=doorPalaceClass(p.door.element,p.element);
    const relevant=[doorDoor,...doorStems.filter(x=>x.actorIds.length),...wonders.filter(x=>x.actorIds.length)];
    const priority=Math.max(0,...relevant.map(x=>Math.abs(x.weight||0)));
    byPalace[p.number]=freeze({version:KEYING_VERSION,palace:p.number,doorDoor:{...doorDoor,actorIds},doorStems,wonders,
      starHour:{...starHour,actorIds},doorPalace:{...doorPalace,actorIds},priority,
      meaning:'Khắc Ứng chỉ điều chỉnh cách đọc của đúng vai/cung; không phải phiếu độc lập, xác suất hay sự kiện thực tế.'});
    allDoorDoor.push({...doorDoor,palace:p.number,actorIds});
    allDoorStem.push(...doorStems.map(x=>({...x,palace:p.number})));
    allWonders.push(...wonders.map(x=>({...x,palace:p.number})));
    allStarHour.push({...starHour,palace:p.number,actorIds});
  }
  return freeze({version:KEYING_VERSION,profile:KEYING_PROFILE,byPalace,doorDoor:allDoorDoor,doorStem:allDoorStem,wonders:allWonders,starHour:allStarHour,
    coverage:{doorDoor:64,doorStem:72,threeWonderPalace:24,starHourIndex:Object.keys(STAR_HOUR_INDEX).length,doorPalaceClasses:['Tỷ hòa','Hòa','Nghĩa','Bức/迫','Chế/制']},
    limitations:[
      'Bát Môn Khắc Ứng và Tam Kỳ đáo cung được hiện đại hóa thành điều kiện luận; tone chỉ xếp mức chú ý nội bộ, không phải xác suất.',
      'Cửu Tinh trị thời phủ đủ chỉ mục 9×12 nhưng giữ classical_context_only vì văn bản cổ chứa ứng tượng mai táng/xuất hành rất đặc thù; chưa dùng để chốt kết quả hiện đại.',
      'Tên Môn bức/Cung bức có dị bản; engine luôn lấy chiều sinh/khắc ngũ hành thật làm chuẩn.',
      'Không cộng Bát Môn + Tam Kỳ + Thập Can như ba phiếu độc lập khi cùng mô tả một cung/vai.'
    ]});
}
