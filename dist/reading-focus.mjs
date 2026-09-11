import {GENERATES, CONTROLS} from './guide.mjs';

// Reading lenses describe business/life questions, not new placement rules or predictions.
export const TOPIC_LENSES = {
  work: {roles:['Cơ hội công việc','Đầu mối quyết định'], distinguish:'Phân biệt được liên hệ, qua vòng đánh giá và có quyết định chính thức.'},
  study: {roles:['Việc học và nền tảng','Bài làm và hồ sơ','Văn thư và chứng chỉ'], distinguish:'Nối năng lực hiện tại, khâu ôn còn thiếu và điều kiện đánh giá; không suy điểm thi từ tượng.'},
  money: {roles:['Lợi ích và tăng trưởng','Vốn bỏ ra'], distinguish:'Phân biệt doanh thu, lợi nhuận và tiền thực thu; xem nguồn lực bỏ ra có được thu hồi hay không.'},
  investment: {roles:['Kỳ vọng lợi ích','Vốn chịu rủi ro'], distinguish:'Chỉ phân tích cách kiểm chứng rủi ro, thanh khoản và giả định; không biến diễn biến thành đường giá hoặc lệnh mua bán.'},
  contract: {roles:['Cơ hội nhận việc','Hồ sơ và báo giá','Thỏa thuận và phối hợp'], distinguish:'Phân biệt có phản hồi, được thương lượng tiếp, được duyệt và ký hợp đồng. Nối cơ hội với hồ sơ, phạm vi, giá và điều kiện chốt; người duyệt phải xác nhận ngoài thực tế, không mặc định từ một thần.'},
  social: {roles:['Trao đổi và tiếp cận','Phối hợp'], distinguish:'Nối cách liên hệ, điểm chưa thống nhất và cam kết thực hiện; không suy động cơ bí mật.'},
  family: {roles:['Kết nối gia đình','Đối thoại'], distinguish:'Xác định người hỏi và việc chung; phân biệt bất đồng về nhu cầu với hành vi quan sát được. Chưa rõ đại diện người thân thì hỏi lại.'},
  love: {roles:['Kết nối và thỏa thuận'], distinguish:'Nối tình huống đã kể, nhu cầu trao đổi và điều kiện tiếp tục; không dự đoán nội tâm, ngoại tình hoặc gán đại diện theo giới tính.'},
  debt: {roles:['Khoản tiền','Khả năng tạo dòng tiền','Cam kết thanh toán'], distinguish:'Phân biệt lời hẹn, xác nhận chứng từ, lịch chuyển và tiền thực về; không coi hứa trả là đã trả.'},
  property: {roles:['Khả năng sử dụng và khai thác','Cơ hội giao dịch'], distinguish:'Nối nhu cầu, điều kiện thực địa, hồ sơ và điều khoản; đây không phải đánh giá pháp lý hoặc định giá tài sản.'},
  travel: {roles:['Di chuyển và thay đổi','Mục tiêu chuyến đi'], distinguish:'Nối chuẩn bị, điểm chuyển tiếp và mục tiêu chuyến đi; Dịch Mã không dự báo tai nạn hoặc bảo đảm an toàn.'},
  health: {roles:['Biểu tượng điều đang lo','Biểu tượng chăm sóc'], distinguish:'Chỉ hỗ trợ chuẩn bị thông tin và trao đổi với nhân viên y tế; không tạo kịch bản diễn tiến bệnh hoặc trì hoãn chăm sóc.'},
  dispute: {roles:['Điểm tranh luận','Chứng từ','Khả năng đối thoại'], distinguish:'Nối bất đồng, kiểm chứng hồ sơ và điều kiện hòa giải; không dự đoán thắng kiện hoặc kết luận ai vi phạm.'},
  lost: {roles:['Điểm khuất cần rà lại','Thông tin còn thiếu'], distinguish:'Nối lộ trình đã biết, các bước kiểm tra và dấu hiệu tìm thấy; không bịa vị trí vật hoặc cáo buộc người lấy.'},
  launch: {roles:['Mở việc','Thông tin và hồ sơ','Hình ảnh và tiếp cận'], distinguish:'Nối chuẩn bị, tiếp cận người dùng và phản hồi thực tế; tách được chú ý với tạo doanh thu.'},
};

// Neutral direction: unlike guide.relation, this also works between two topic anchors.
export function elementLink(from, to) {
  if (!Object.hasOwn(GENERATES,from) || !Object.hasOwn(GENERATES,to)) throw new Error('Ngũ hành không hợp lệ.');
  if (from===to) return {kind:'same',text:`${from} cùng hành ${to}`};
  if (GENERATES[from]===to) return {kind:'generates',text:`${from} sinh ${to}`};
  if (GENERATES[to]===from) return {kind:'generated_by',text:`${from} được ${to} sinh`};
  if (CONTROLS[from]===to) return {kind:'controls',text:`${from} khắc ${to}`};
  return {kind:'controlled_by',text:`${from} bị ${to} khắc`};
}

export function buildTopicFocus(topic, day, hour, chart, facts) {
  const lens=TOPIC_LENSES[topic.id];
  if (!lens || lens.roles.length!==topic.anchors.length) throw new Error('Thiếu khung luận của chủ đề.');
  const roles=[
    {id:'day',label:'Người hỏi (khi hỏi việc của chính mình)',palace:day.palace.number,evidenceId:'day'},
    {id:'hour',label:'Bối cảnh sự việc',palace:hour.palace.number,evidenceId:'hour'},
    ...topic.anchors.map((a,i)=>({id:`anchor_${i}`,label:lens.roles[i],palace:a.palace,evidenceId:a.evidenceId})),
  ];
  const links=[];
  for(let i=0;i<roles.length;i++) for(let j=i+1;j<roles.length;j++) {
    const from=roles[i],to=roles[j],p=chart.palaces.find(p=>p.number===from.palace),q=chart.palaces.find(p=>p.number===to.palace);
    const link=elementLink(p.element,q.element),id=`link_${topic.id}_${i}_${j}`;
    facts[id]=`${from.label} tại ${p.vi} ${p.number} → ${to.label} tại ${q.vi} ${q.number}: ${link.text}; ${p.number===q.number?'đồng cung':'khác cung'}. Đây là quan hệ hành cung, không phải thứ tự thời gian hoặc kết luận thành/bại.`;
    links.push({id,from:from.id,to:to.id,fromPalace:p.number,toPalace:q.number,kind:link.kind,samePalace:p.number===q.number});
  }
  return {distinguish:lens.distinguish,roles,links,relevantPalaces:[...new Set(roles.map(r=>r.palace))]};
}
