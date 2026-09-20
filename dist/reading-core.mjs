import {generateQimen} from './qimen/core/board.mjs';
import {formatInstantAtOffset, formatOffset} from './qimen/core/calendar.mjs';
import {TOPICS, locateStem, locateRef, relation, palaceConditions} from './guide.mjs';
import {buildTopicFocus, elementLink} from './reading-focus.mjs';
import {buildAnalysisContext} from './qimen/ai/contextBuilder.mjs';
export {readingSchema} from './qimen/schemas/reading.mjs';
import {validateReading} from './qimen/ai/readingAudit.mjs';
export {validateReading,ReadingValidationError} from './qimen/ai/readingAudit.mjs';
import {BASE_WRITER_INSTRUCTIONS} from './qimen/ai/prompts.mjs';
import {synthesisInstructions} from './qimen/ai/prompts.mjs';

// One deterministic contract is used by the browser and the AI bridge.
export const RULE_VERSION = 'TG-CB-6.3';
export const READING_PROTOCOL = 5;
const UPGRADE_MESSAGE = `Bộ kết nối AI chưa cùng bộ quy tắc ${RULE_VERSION}. Hãy cập nhật bộ kết nối theo hướng dẫn; chưa thể nhận lời luận khác phiên bản.`;
const named = p => `${p.vi} ${p.number} (${p.element})`;
const yes = flag => flag ? 'có' : 'không';

export function prepareReading(body) {
  if (!body || typeof body.question !== 'string' || !body.question.trim() || body.question.length > 1500) throw new Error('Nhập câu hỏi từ 1 đến 1500 ký tự.');
  if (!['chaibu','maoshan'].includes(body.method)) throw new Error('Pháp định cục không hợp lệ.');
  if (!TOPICS.some(t=>t.id===body.topic)) throw new Error('Nhóm sự việc không hợp lệ.');
  const chart = generateQimen(body.input, body.method);
  const day = locateStem(chart, chart.pillars.day), hour = locateStem(chart, chart.pillars.hour);
  const facts = {};
  facts.time = `Giờ hỏi dân dụng: ${formatInstantAtOffset(chart.utcMs,chart.input.tzOffset,true)} ${formatOffset(chart.input.tzOffset)}. Tiết ${chart.term.vi}, từ ${formatInstantAtOffset(chart.term.utcMs,chart.input.tzOffset,true)} đến trước ${formatInstantAtOffset(chart.nextTerm.utcMs,chart.input.tzOffset,true)}. Các mốc hiển thị đến phút; phép tính giữ giây của thư viện lịch.`;
  facts.pillars = `Năm ${chart.pillars.year.vi}; tháng ${chart.pillars.month.vi}; ngày ${chart.pillars.day.vi}; giờ ${chart.pillars.hour.vi}. Năm đổi ở Lập Xuân, tháng đổi ở 12 tiết, nhật trụ đổi lúc 23:00 địa phương; không phải tháng âm lịch.`;
  facts.method = `${chart.methodLabel}; ${chart.dun.label} ${chart.dun.ju} cục, ${chart.dun.yuan}. ${chart.method==='chaibu' ? `Phù đầu ${chart.fuHead.vi}.` : `Qua ${chart.term.elapsedDays.toFixed(6)} ngày từ giao tiết; đổi nguyên sau đúng 120 và 240 giờ, Hạ nguyên kéo dài đến tiết tiếp theo.`}`;
  facts.day = `Nhật trụ ${chart.pillars.day.vi}; Nhật can ${chart.pillars.day.stem.vi}, tìm ${day.effective} trên thiên bàn cung ${named(day.palace)}. Chỉ quy ước Nhật can là người hỏi khi hỏi việc của chính mình; hỏi thay cần xác định lại đại diện.`;
  facts.hour = `Thời trụ ${chart.pillars.hour.vi}; Thời can ${chart.pillars.hour.stem.vi}, tìm ${hour.effective} trên thiên bàn cung ${named(hour.palace)}, điểm tham khảo bối cảnh sự việc; không thay mọi dụng thần chuyên đề.`;
  facts.relation = `So hành CUNG Nhật can → CUNG Thời can: ${relation(day.palace.element,hour.palace.element)}. ${day.palace.number===hour.palace.number?'Hai đại diện cùng cung.':'Hai đại diện khác cung.'} Đây là quan hệ giữa hành cung, không phải hành của hai can; tự nó không kết luận thành/bại.`;
  facts.duty = `Tuần thủ ${chart.xun.head.vi} ẩn ${chart.xun.instrument.vi}, gốc địa bàn cung ${chart.xun.instrumentPalace}; giờ thứ ${chart.xun.hourOffset+1}/10 trong tuần. Trực Phù TINH: ${chart.duty.star.vi} cung ${chart.duty.starPalace}; Trực Sử: ${chart.duty.door.vi} cung ${chart.duty.doorPalace}. Đích trước ký cung: tinh ${chart.duty.rawStarPalace}, môn ${chart.duty.rawDoorPalace}; 5 ký 2. Không nhầm Trực Phù tinh với thần Trực Phù.`;
  facts.patterns = `Toàn lớp Cửu Tinh: phục ngâm ${yes(chart.patterns.starFuYin)}, phản ngâm ${yes(chart.patterns.starFanYin)}. Toàn lớp Bát Môn: phục ngâm ${yes(chart.patterns.doorFuYin)}, phản ngâm ${yes(chart.patterns.doorFanYin)}. Không gọi mọi thiên/địa can giống nhau là toàn bàn phục ngâm.`;
  const qinPalace = chart.palaces.find(p=>p.carriesQin);
  facts.p5 = `Trung Ngũ: địa can ${chart.earth[5].vi}; không có Môn/Thần độc lập. Thiên Cầm và can ký đang theo Thiên Nhuế tại cung ${named(qinPalace)}, không cố định ở Khôn sau khi chuyển.`;
  for (const p of chart.palaces.filter(p=>p.number!==5)) {
    facts['p'+p.number] = `${named(p)}: ${p.door.vi} (${p.door.element}); ${p.star.vi} (${p.star.element}); thần ${p.spirit.vi}; thiên can ${p.heavenStems.map(s=>s.vi).join(' + ')}, địa can ${p.earthStem.vi}; Tuần Không theo tuần giờ ${yes(p.voided)}; Dịch Mã theo chi giờ ${yes(p.horse)}; ${p.carriesQin?'mang Thiên Cầm và can ký từ Trung Ngũ':'không mang Thiên Cầm'}.`;
    const c = palaceConditions(p);
    facts['c'+p.number] = `Điều kiện tại ${named(p)}: Môn bức cung ${yes(c.doorPressure)} (Môn khắc cung, không đảo chiều); Lục nghi kích hình trên thiên bàn: ${c.punishment.join(', ')||'không'}; Tam kỳ nhập mộ: ${c.wonderTombs.join(', ')||'không'}. Tính cả can ký, nhưng chỉ can được nêu mang điều kiện đó; không gán cho mọi đại diện cùng cung. Không bao hàm nhập mộ các can ngoài Tam kỳ.`;
    facts['mix'+p.number] = `Phối hợp tại ${named(p)}: ${p.spirit.vi} + ${p.star.vi} + ${p.door.vi}. Hành Tinh → Môn: ${elementLink(p.star.element,p.door.element).text}; Môn → cung: ${elementLink(p.door.element,p.element).text}. Đây là các quan hệ ngũ hành, chưa phải phép tính vượng suy hoặc phán tốt/xấu của tổ hợp.`;
  }
  const allInOne=buildAnalysisContext(chart,body,facts);
  const topics = TOPICS.filter(t=>t.id===allInOne.resolvedTopic);
  const topicAnchors = topics.map(topic => ({...topic, anchors:topic.refs.map((ref,i)=>{
    const p = locateRef(chart,ref);
    if (!p) throw new Error('Không tìm thấy dụng thần trên bàn.');
    const label = ref[0]==='stem' ? `can ${ref[1]}` : ref[0]==='horse' ? 'Dịch Mã' : p[ref[0]].vi;
    const evidenceId = `ref_${topic.id}_${i}`;
    facts[evidenceId] = `Dụng thần tham khảo cho ${topic.name}: ${label} ở ${named(p)}. Nhật can → cung này: ${relation(day.palace.element,p.element)}. Dùng kèm p${p.number} và c${p.number}; chỉ áp dụng khi đại diện Nhật can đã phù hợp câu hỏi.`;
    return {label,palace:p.number,evidenceId};
  })}));
  for (const topic of topicAnchors) topic.focus=buildTopicFocus(topic,day,hour,chart,facts);
  const warnings = [];
  if (Math.min(chart.utcMs-chart.term.utcMs, chart.nextTerm.utcMs-chart.utcMs) <= 120000) warnings.push('Giờ nhập cách giao tiết không quá 2 phút. Xác nhận phút, múi giờ và nguồn lịch trước khi luận; hai phía giao tiết có thể khác bàn.');
  if (chart.input.hour===22 && chart.input.minute===59 || chart.input.hour===23 && chart.input.minute===0) warnings.push('Sát mốc đổi ngày 23:00; sai một phút có thể đổi Nhật trụ, Thời trụ và nguyên.');
  if (chart.method==='maoshan' && [5,10].some(d=>Math.abs(chart.term.elapsedDays-d)*86400000<=120000)) warnings.push('Sát mốc đổi nguyên Mao Sơn sau 120/240 giờ kể từ giao tiết.');
  if (warnings.length) facts.boundary = warnings.join(' ');
  const context = {
    rules:RULE_VERSION, question:body.question.trim().normalize('NFC'), selectedTopic:body.topic,
    facts, topics:topicAnchors, warnings, allInOne,
    conventions:[
      'Thời Gia Kỳ Môn, Chuyển Bàn; dùng đúng pháp đã chọn, không trộn Phi Bàn/Trí Nhuận.',
      'Giờ dân dụng theo UTC offset cố định do người dùng nhập; chưa hiệu chỉnh chân thái dương hoặc tự áp dụng giờ mùa hè lịch sử.',
      '23:00 đổi ngày. Giáp tìm nghi ẩn theo tuần của chính trụ; Nhật/Thời can ở thiên bàn, quan hệ người–việc xét hành cung.',
      'Trung Ngũ ký Khôn 2 khi xác định đích; Thiên Cầm và can ký sau đó cùng chuyển với Thiên Nhuế.',
      'Lục nghi kích hình: Mậu→3, Kỷ→2, Canh→8, Tân→9, Nhâm/Quý→4. Tam kỳ nhập mộ: Ất→2, Bính→6, Đinh→8. Xét riêng từng can thiên bàn, kể cả can ký.',
      'KM-STRUCTURE-2.0 lưu riêng chiều Môn khắc Cung và Cung khắc Môn; tên “Môn bức/Cung bức” có dị bản nên không dùng tên gọi để thay logic ngũ hành. Khai–Hưu–Sinh là ba cát môn theo quy ước; Cảnh dùng tùy việc, không tự động là thuận.',
      'Thập Can Khắc Ứng bao phủ 81 tổ hợp Tam Kỳ/Lục Nghi nhìn thấy trên thiên–địa bàn; chỉ tổ hợp gắn đúng Dụng Thần/vai mới được nâng trọng số. Cách cục thuận/nghịch là điều kiện cấu trúc, không phải xác suất hay kết quả đã xảy ra.',
      'KM-STRENGTH-2.0 tách Cửu Tinh, Bát Môn, Thập Can–Thập Nhị Trường Sinh và môi trường Cung. Không lấy sức của Tinh thay cho Môn/Can; Dụng Thần yếu chỉ làm hạ mức phát huy, không tự biến thành kết quả xấu chắc chắn.',
    ],
    unsupported:[
      'Ứng kỳ v2 mới định mốc theo Không → Mã → Tam kỳ nhập mộ trong phạm vi thời gian người dùng nêu; chưa định ngày bằng Hình, Can/Môn, Phản/Phục ngâm hoặc nhập mộ ngoài Tam kỳ. Không tự tính hoặc tuyên bố đã loại trừ các mục này.',
      'Dụng Thần dùng KM-YONGSHEN-2.0 theo nhóm câu hỏi và thứ bậc chính/phụ/đối ứng/đối chiếu; đây là quy ước có nguồn đối chiếu, không phải chuẩn duy nhất của mọi phái. Bàn không xác minh tâm ý người khác, bệnh tật, giá tài sản hay tương lai.',
      'KM-STRUCTURE-2.0 chưa bao phủ toàn bộ Bát Môn khắc ứng, Cửu Tinh trị thời, Tam Kỳ đáo cung và Tam Trá/Ngũ Giả/Cửu Độn; không tự suy các corpus này khi chưa có rule deterministic tương ứng.',
    ],
  };
  return {context, chart, facts, board:allInOne.board, analysis:allInOne.analysis};
}

export const INSTRUCTIONS = BASE_WRITER_INSTRUCTIONS;
export const instructionsFor=context=>synthesisInstructions(INSTRUCTIONS,context);

async function digest(value) {
  const bytes = await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));
  return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function readingIdentity(prepared) {
  const chartFingerprint = await digest(prepared.chart);
  const requestFingerprint = await digest({rules:RULE_VERSION,chartFingerprint,context:prepared.context});
  return {chartFingerprint,requestFingerprint};
}
export async function buildReadingRequest(body) {
  const prepared = prepareReading(body);
  const identity = await readingIdentity(prepared);
  return {...prepared, ...identity, request:{question:prepared.context.question,topic:prepared.context.selectedTopic,
    mode:prepared.context.allInOne.classification.requested,actors:prepared.context.allInOne.actors,
    subject:prepared.context.allInOne.questionContext.subject.mapping,
    direction:prepared.context.allInOne.questionContext.direction?{origin:prepared.context.allInOne.questionContext.direction.origin,kind:prepared.context.allInOne.questionContext.direction.kind}:null,
    depth:prepared.context.allInOne.questionContext.depth,action:prepared.context.allInOne.action,candidates:prepared.context.allInOne.comparison?.values||[],
    method:prepared.chart.method,input:prepared.chart.input,protocol:READING_PROTOCOL,rules:RULE_VERSION,...identity}};
}
export function assertCompatible(data) {
  if (data?.rules!==RULE_VERSION || data?.protocol!==READING_PROTOCOL) throw new Error(UPGRADE_MESSAGE);
}
export function validateReadingResponse(data,prepared) {
  assertCompatible(data);
  if (data.chartFingerprint!==prepared.chartFingerprint || data.requestFingerprint!==prepared.requestFingerprint) throw new Error('Lời luận không khớp câu hỏi hoặc bàn đang xem; kết quả đã bị chặn.');
  if (!data.facts || Object.keys(data.facts).length!==Object.keys(prepared.facts).length || Object.entries(prepared.facts).some(([id,text])=>data.facts[id]!==text)) throw new Error('Căn cứ của AI khác bàn đang xem; kết quả đã bị chặn.');
  validateReading(data.reading,prepared.facts,prepared.context.selectedTopic,prepared.context);
  return {...data,facts:prepared.facts};
}
