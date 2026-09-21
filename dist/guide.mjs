import {sexagenaryIndex, STEMS} from './qimen.mjs';

export const GENERATES = {Mộc:'Hỏa', Hỏa:'Thổ', Thổ:'Kim', Kim:'Thủy', Thủy:'Mộc'};
export const CONTROLS = {Mộc:'Thổ', Thổ:'Thủy', Thủy:'Hỏa', Hỏa:'Kim', Kim:'Mộc'};
export const TOPICS = [
  {id:'general', name:'Tổng quát · chưa rõ nhóm', refs:[], example:'Trong tháng này, việc A của tôi có tiến triển không?', read:'Bắt đầu từ cung Nhật can và Thời can; ghi nhận điểm thuận và vướng trước khi chọn thêm dụng thần.', check:'Chia việc lớn thành một mục tiêu có thể kiểm chứng và một hạn chót.'},
  {id:'work', name:'Công việc · xin việc · thăng tiến', refs:[['door','kai'],['spirit','chief']], example:'Trong 30 ngày tới tôi có nhận được vị trí A không?', read:'Khai Môn gợi công việc/cơ hội; Trực Phù bổ sung tượng người quyết định. So cung Khai với cung Nhật can rồi xem Môn–Tinh–Thần tại đó.', check:'Đối chiếu yêu cầu tuyển dụng, năng lực, người duyệt và lịch phản hồi; không nghỉ việc chỉ vì một bàn.'},
  {id:'study', name:'Học hành · thi cử · chứng chỉ', refs:[['star','fu'],['door','jing'],['stem','丁']], example:'Kỳ thi chứng chỉ tháng tới, tôi cần chú ý điểm gì khi chuẩn bị?', read:'Thiên Phụ gợi học tập; Cảnh Môn và Đinh bổ sung tượng bài vở, văn thư. Xem các cung này liên hệ thế nào với Nhật can.', check:'Dựa kết quả thi thử, kiến thức còn thiếu và thời gian ôn. Bàn không thay thế đánh giá học lực.'},
  {id:'money', name:'Tiền tài · kinh doanh · doanh thu', refs:[['door','sheng'],['stem','戊']], example:'Hoạt động kinh doanh A trong tháng tới có thuận lợi về dòng tiền không?', read:'Sinh Môn là điểm tham khảo về sinh trưởng/lợi ích; Mậu thường được dùng làm tượng vốn. Phân biệt có doanh thu với thực nhận tiền.', check:'Kiểm tra biên lợi nhuận, vốn lưu động, công nợ và chi phí thực tế; không coi gặp Sinh là chắc có lãi.'},
  {id:'investment', name:'Đầu tư · cổ phiếu · coin', refs:[['door','sheng'],['stem','戊']], example:'Với khoản đầu tư A trong 20 ngày tới, tôi đang bỏ qua rủi ro nào?', read:'Chỉ dùng tượng vốn và lợi ích để tự đặt câu hỏi về kế hoạch. App không suy giá, chọn đồng coin, xếp hạng tài sản hay phát tín hiệu mua/bán từ bàn.', check:'Đánh giá bằng dữ liệu độc lập. Không dùng quẻ để quyết định số tiền, đòn bẩy hoặc cam kết lợi nhuận.'},
  {id:'contract', name:'Hợp đồng · đấu thầu · nhận dự án', refs:[['door','kai'],['door','jing'],['spirit','harmony']], example:'Trong 30 ngày tới công ty tôi có ký hợp đồng tạp vụ với công ty A không?', read:'Khai: cơ hội dự án; Cảnh: hồ sơ, văn bản; Lục Hợp: phối hợp/thỏa thuận. So từng cung với Nhật can, rồi xem Thời can để đọc bối cảnh chung.', check:'Nếu tượng phối hợp thuận nhưng văn thư vướng, ghi giả thuyết “cần làm rõ hồ sơ”, không kết luận trúng thầu. Kiểm tra báo giá, phạm vi, người ký, điều kiện thanh toán.'},
  {id:'social', name:'Quan hệ xã hội · quý nhân · hợp tác', refs:[['door','xiu'],['spirit','harmony']], example:'Tôi nên chú ý điều gì khi hợp tác với người A tháng này?', read:'Hưu gợi giao tiếp hòa hoãn, Lục Hợp gợi kết nối. Đọc như câu hỏi về cách phối hợp; không dùng một Thần để phán người khác lừa dối.', check:'Hỏi rõ trách nhiệm, kỳ vọng, cách phản hồi và việc mỗi bên có thể thực hiện.'},
  {id:'family', name:'Gia đình · cha mẹ · con cái', refs:[['spirit','harmony'],['door','xiu']], example:'Gia đình tôi nên tháo gỡ bất đồng về việc A trong tháng này thế nào?', read:'Lục Hợp và Hưu là gợi ý nhập môn cho hòa giải. Hỏi cho ai phải nói rõ; Nhật can không tự động đại diện mọi thành viên, cần thêm cách chọn đại diện khi luận riêng người thân.', check:'Lắng nghe từng người và kiểm chứng thông tin. Không suy ai có lỗi, bệnh tật hoặc tai họa từ bàn.'},
  {id:'love', name:'Tình cảm · hôn nhân', refs:[['spirit','harmony']], example:'Tôi và người A cần làm rõ điều gì trước khi bàn chuyện lâu dài?', read:'Lục Hợp gợi mối kết nối, không chứng minh có hôn nhân hay còn tình cảm. Không gán Ất/Canh theo giới tính một cách máy móc; cách lấy đại diện khác nhau giữa phái và bối cảnh.', check:'Dựa trên trao đổi trực tiếp, sự đồng thuận và hành vi thực tế. Không kết luận ngoại tình hoặc chia tay từ tượng.'},
  {id:'debt', name:'Thu hồi công nợ · thanh toán', refs:[['stem','戊'],['door','sheng'],['spirit','harmony']], example:'Khoản công nợ A có thể được thanh toán trước ngày đã hẹn không?', read:'Mậu: tiền/vốn; Sinh: khả năng tạo lợi ích; Lục Hợp: cam kết. Phân biệt lời hẹn với tiền về, xem thêm Thời can của việc thu nợ.', check:'Xác nhận số dư, chứng từ, đầu mối và lịch trả bằng văn bản; quẻ không xác định khả năng thanh toán.'},
  {id:'property', name:'Nhà đất · thuê nhà · chuyển chỗ ở', refs:[['door','sheng'],['door','kai']], example:'Việc thuê mặt bằng A trong tháng tới có điểm gì cần cân nhắc?', read:'Sinh gợi khai thác, sinh trưởng; Khai gợi mở việc tại nơi mới. Đây là bàn hỏi việc, không thay cho bàn phong thủy đo hướng nhà.', check:'Kiểm tra thực địa, giấy tờ, điều kiện thuê/mua, chi phí và hạ tầng bằng nguồn chuyên môn.'},
  {id:'travel', name:'Đi lại · công tác · chuyển việc xa', refs:[['horse','horse'],['door','kai']], example:'Chuyến công tác A tuần tới có khâu nào cần chuẩn bị kỹ?', read:'Dịch Mã chỉ tượng động; đọc thêm Khai và cung Thời can. Mã không phải bảo đảm chuyến đi an toàn hay thành công.', check:'Xác nhận lịch, phương tiện, giấy tờ và thông tin an toàn từ nguồn chính thức.'},
  {id:'health', name:'Sức khỏe · chăm sóc bản thân', refs:[['star','rui'],['star','xin']], example:'Tôi cần chuẩn bị gì để đi khám và chăm sóc bản thân tốt hơn?', read:'Thiên Nhuế/Thiên Tâm có liên tưởng truyền thống tới bệnh và y dược. Chỉ giải thích biểu tượng, không chẩn đoán, tiên lượng, chọn thuốc hoặc quyết định thời điểm điều trị.', check:'Có lo ngại sức khỏe thì trao đổi với nhân viên y tế; không trì hoãn khám hoặc điều trị vì bàn.'},
  {id:'dispute', name:'Tranh chấp · khiếu nại · hòa giải', refs:[['door','fear'],['door','jing'],['spirit','harmony']], example:'Tôi cần làm rõ hồ sơ gì để hòa giải bất đồng A?', read:'Kinh gợi tranh luận, Cảnh gợi văn bản, Lục Hợp gợi hòa giải. Đây không phải dự đoán thắng kiện hoặc kết luận hành vi trái luật.', check:'Bảo toàn chứng từ, xác minh thời hạn và hỏi chuyên gia pháp lý phù hợp.'},
  {id:'lost', name:'Thất lạc đồ · tìm kiếm', refs:[['door','du'],['spirit','tortoise']], example:'Tôi cần rà lại những đâu để tìm món đồ A bị thất lạc hôm nay?', read:'Đỗ/Huyền Vũ dùng như liên tưởng vật khuất, thông tin thiếu. Không phải định vị thật; không dùng để cáo buộc trộm cắp hoặc tìm người mất tích.', check:'Lập lại lộ trình, hỏi nơi đã đến, kiểm tra camera hợp pháp; trường hợp khẩn cấp liên hệ cơ quan chức năng.'},
  {id:'launch', name:'Khai trương · ra mắt · truyền thông', refs:[['door','kai'],['door','jing'],['star','ying']], example:'Đợt ra mắt dịch vụ A tháng tới cần ưu tiên chuẩn bị điều gì?', read:'Khai: mở việc; Cảnh và Thiên Anh: thông tin, hình ảnh. Xem có đồng thuận giữa mục tiêu và khả năng triển khai không.', check:'Kiểm tra nguồn lực, nội dung, khách hàng thử nghiệm và chỉ tiêu đo lường. Một bàn không tự chọn ra ngày tốt nhất.'},
];

export function relation(from, to) {
  if (!Object.hasOwn(GENERATES, from) || !Object.hasOwn(GENERATES, to)) throw new Error('Ngũ hành không hợp lệ.');
  if (from === to) return 'Cùng hành · tỷ hòa';
  if (GENERATES[from] === to) return 'Người sinh việc · cần bỏ nguồn lực';
  if (GENERATES[to] === from) return 'Việc sinh người · tượng hỗ trợ';
  if (CONTROLS[from] === to) return 'Người khắc việc · tượng kiểm soát';
  return 'Việc khắc người · tượng áp lực';
}

export function locateStem(chart, pillar) {
  const text = typeof pillar === 'string' ? pillar : pillar?.han;
  if (typeof text !== 'string' || ![1,2].includes(text.length) || !STEMS.some(s=>s.han===text[0])) throw new Error('Can cần tìm không hợp lệ.');
  if (text.length === 2) sexagenaryIndex(text);
  if (text === '甲') throw new Error('Tìm Giáp cần đủ Can Chi để xác định nghi ẩn của chính trụ.');
  const effective = text[0] === '甲' ? ['戊','己','庚','辛','壬','癸'][Math.floor(sexagenaryIndex(text)/10)] : text[0];
  const matches=chart.palaces.filter(p=>p.number!==5 && p.heavenStems.some(s=>s.han===effective));
  if(matches.length!==1) throw new Error('Can cần tìm không nằm duy nhất trên thiên bàn.');
  return {effective, palace:matches[0]};
}

export function locateRef(chart, [kind,id]) {
  if (kind==='stem') return locateStem(chart,id).palace;
  if (kind==='horse') return chart.palaces.find(p=>p.horse);
  return chart.palaces.find(p=>p[kind]?.id===id);
}

// Scope: heavenly stems, including the stem travelling with Tian Qin.
// Source: 煙波釣叟歌, 六儀擊刑 / 三奇入墓 / 門制其宮.
export const PUNISHMENT_PALACES = Object.freeze({'戊':3,'己':2,'庚':8,'辛':9,'壬':4,'癸':4});
// 遁甲演義卷2 / 奇門法竅: 乙奇墓坤2、丙奇墓乾6、丁奇墓艮8。
export const THREE_WONDERS_TOMBS = Object.freeze({'乙':2,'丙':6,'丁':8});
// KM-TIMING-3.0 profile: visible stem tomb palaces derived from the same
// yin/yang Twelve-Life-Stage convention already used by KM-STRENGTH-2.0.
// Qimen Fa Qiao explicitly extends tomb reading from the Three Wonders to the Six Registers.
export const VISIBLE_STEM_TOMBS = Object.freeze({'乙':2,'丙':6,'丁':8,'戊':6,'己':8,'庚':8,'辛':4,'壬':4,'癸':2});
export function palaceConditions(palace) {
  if (palace.number === 5) return {doorPressure:false, punishment:[], wonderTombs:[], stemTombs:[]};
  return {
    doorPressure: CONTROLS[palace.door.element] === palace.element,
    punishment: palace.heavenStems.filter(s=>PUNISHMENT_PALACES[s.han]===palace.number).map(s=>s.vi),
    wonderTombs: palace.heavenStems.filter(s=>THREE_WONDERS_TOMBS[s.han]===palace.number).map(s=>s.vi),
    stemTombs: palace.heavenStems.filter(s=>VISIBLE_STEM_TOMBS[s.han]===palace.number).map(s=>s.vi),
  };
}
