import {generateQimen} from './qimen/core/board.mjs';
import {formatInstantAtOffset, formatOffset} from './qimen/core/calendar.mjs';
import {resolveTimePlace} from './qimen/timePlace.mjs';
import {TOPICS, locateStem, locateRef, relation, palaceConditions} from './guide.mjs';
import {buildTopicFocus, elementLink} from './reading-focus.mjs';
import {buildAnalysisContext} from './qimen/ai/contextBuilder.mjs';
export {readingSchema} from './qimen/schemas/reading.mjs';
import {validateReading} from './qimen/ai/readingAudit.mjs';
export {validateReading,ReadingValidationError} from './qimen/ai/readingAudit.mjs';
import {BASE_WRITER_INSTRUCTIONS} from './qimen/ai/prompts.mjs';
import {synthesisInstructions} from './qimen/ai/prompts.mjs';
import {CASE_ENGINE_VERSION} from './qimen/case/engine.mjs';
import {NIANMING_VERSION} from './qimen/analysis/nianmingEngine.mjs';
export {NIANMING_VERSION};

// One deterministic contract is used by the browser and the AI bridge.
export const RULE_VERSION = 'TG-CB-6.3';
export const READING_PROTOCOL = 6;
const UPGRADE_MESSAGE = `Bộ kết nối AI chưa cùng bộ quy tắc ${RULE_VERSION}. Hãy cập nhật bộ kết nối theo hướng dẫn; chưa thể nhận lời luận khác phiên bản.`;
const named = p => `${p.vi} ${p.number} (${p.element})`;
const yes = flag => flag ? 'có' : 'không';

export function prepareReading(body) {
  if (!body || typeof body.question !== 'string' || !body.question.trim() || body.question.length > 1500) throw new Error('Nhập câu hỏi từ 1 đến 1500 ký tự.');
  if (!['chaibu','maoshan'].includes(body.method)) throw new Error('Pháp định cục không hợp lệ.');
  if (!TOPICS.some(t=>t.id===body.topic)) throw new Error('Nhóm sự việc không hợp lệ.');
  const timePlace=resolveTimePlace(body.input,body.timePlace);
  const chart = generateQimen(timePlace.boardInput, body.method);
  const day = locateStem(chart, chart.pillars.day), hour = locateStem(chart, chart.pillars.hour);
  const facts = {};
  facts.time = `Giờ hỏi dân dụng: ${formatInstantAtOffset(chart.utcMs,chart.input.tzOffset,true)} ${formatOffset(chart.input.tzOffset)}. Tiết ${chart.term.vi}, từ ${formatInstantAtOffset(chart.term.utcMs,chart.input.tzOffset,true)} đến trước ${formatInstantAtOffset(chart.nextTerm.utcMs,chart.input.tzOffset,true)}. Các mốc hiển thị đến phút; phép tính giữ giây của thư viện lịch.`;
  const tp=timePlace.metadata,solar=tp.solar;
  facts.timeplace=tp.mode==='iana_civil'
    ?`KM-TIMEPLACE-2.0: giờ dân dụng được đối chiếu bằng IANA ${tp.iana.timeZone}; offset lịch sử tại thời điểm này ${formatOffset(tp.effectiveOffsetHours)}, ${tp.iana.status==='ambiguous_resolved'?'giờ dân dụng bị lặp đã xác định rõ':'một UTC offset duy nhất'}${tp.iana.disambiguation?` · chọn ${tp.iana.disambiguation==='earlier'?'lần sớm':'lần muộn'}`:''}. ${solar?`Kinh độ ${solar.longitude}°; giờ Mặt Trời biểu kiến chỉ đối chiếu, lệch ${solar.apparentSolarCorrectionMinutes.toFixed(2)} phút so với đồng hồ dân dụng.`:'Không áp dụng hiệu chỉnh Mặt Trời.'}`
    :`KM-TIMEPLACE-2.0: giữ UTC offset cố định ${formatOffset(tp.effectiveOffsetHours)} như hành vi cũ; không tự áp dụng DST/IANA.${solar?` Kinh độ ${solar.longitude}°; giờ Mặt Trời biểu kiến chỉ đối chiếu, lệch ${solar.apparentSolarCorrectionMinutes.toFixed(2)} phút và KHÔNG thay giờ lập bàn.`:''}`;
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
    const c = palaceConditions(p),otherTombs=(c.stemTombs||[]).filter(x=>!c.wonderTombs.includes(x));
    facts['c'+p.number] = `Điều kiện tại ${named(p)}: Môn bức cung ${yes(c.doorPressure)} (Môn khắc cung, không đảo chiều); Lục nghi kích hình trên thiên bàn: ${c.punishment.join(', ')||'không'}; Nhập mộ trên thiên bàn: ${(c.stemTombs||[]).join(', ')||'không'}${otherTombs.length?` (Lục Nghi: ${otherTombs.join(', ')})`:c.wonderTombs.length?' (Tam Kỳ)':''}. Tính cả can ký, nhưng chỉ can được nêu mang điều kiện đó; không gán cho mọi đại diện cùng cung.`;
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
    facts, topics:topicAnchors, warnings, allInOne,timePlace:{version:timePlace.version,request:timePlace.request,metadata:timePlace.metadata},
    conventions:[
      'Thời Gia Kỳ Môn, Chuyển Bàn; dùng đúng pháp đã chọn, không trộn Phi Bàn/Trí Nhuận.',
      'KM-TIMEPLACE-2.0 mặc định giữ UTC offset cố định như trước. Chỉ khi người dùng bật IANA civil mode mới dùng offset lịch sử/DST của vùng; giờ trùng DST phải chọn lần sớm/lần muộn, giờ không tồn tại bị chặn. Tọa độ/giờ Mặt Trời chỉ là metadata đối chiếu và không tự đổi giờ lập bàn.',
      '23:00 đổi ngày. Giáp tìm nghi ẩn theo tuần của chính trụ; Nhật/Thời can ở thiên bàn, quan hệ người–việc xét hành cung.',
      'Trung Ngũ ký Khôn 2 khi xác định đích; Thiên Cầm và can ký sau đó cùng chuyển với Thiên Nhuế.',
      'Lục nghi kích hình: Mậu→3, Kỷ→2, Canh→8, Tân→9, Nhâm/Quý→4. KM-TIMING-3.0 xét Nhập Mộ cho 9 can hiện bàn: Ất→2, Bính→6, Đinh→8, Mậu→6, Kỷ→8, Canh→8, Tân→4, Nhâm→4, Quý→2. Xét riêng từng can thiên bàn, kể cả can ký.',
      'KM-STRUCTURE-2.0 lưu riêng chiều Môn khắc Cung và Cung khắc Môn; tên “Môn bức/Cung bức” có dị bản nên không dùng tên gọi để thay logic ngũ hành. Khai–Hưu–Sinh là ba cát môn theo quy ước; Cảnh dùng tùy việc, không tự động là thuận.',
      'Thập Can Khắc Ứng bao phủ 81 tổ hợp Tam Kỳ/Lục Nghi nhìn thấy trên thiên–địa bàn; chỉ tổ hợp gắn đúng Dụng Thần/vai mới được nâng trọng số. Cách cục thuận/nghịch là điều kiện cấu trúc, không phải xác suất hay kết quả đã xảy ra.',
      'KM-STRENGTH-2.0 tách Cửu Tinh, Bát Môn, Thập Can–Thập Nhị Trường Sinh và môi trường Cung. Không lấy sức của Tinh thay cho Môn/Can; Dụng Thần yếu chỉ làm hạ mức phát huy, không tự biến thành kết quả xấu chắc chắn.',
      'KM-ROLE-2.0 coi Chủ–Khách là tư thế theo sự việc: động/đi trước thiên Khách, tĩnh/hậu ứng thiên Chủ; can giờ chỉ cho thiên hướng hành động. Nội/Ngoại là xu hướng gần–xa/nhanh–chậm. Agency không phải quyền lực thực tế và không dùng để tuyên bố bên thắng/thua.',
      'KM-KEYING-3.0 thêm Bát Môn Khắc Ứng, Môn–Kỳ/Nghi, Tam Kỳ đáo cung và Hòa/Nghĩa/Bức/Chế như lớp điều kiện gắn đúng cung/vai. Cửu Tinh trị thời hiện chỉ lập chỉ mục cổ điển 108 tổ hợp với trọng số verdict bằng 0; không cộng các corpus này như nhiều phiếu độc lập.',
      'KM-FORMATION-3.0 dùng profile 奇門法竅 cho Tam Trá, Ngũ Giả, Cửu Độn; Thiên Tam Môn tính Thiên Nguyệt Tướng theo Trung khí rồi đặt lên chi giờ, Địa Tứ Hộ theo chu kỳ Kiến–Trừ. Formation chỉ mô tả kiểu hành động/phương vị và không đổi evidenceScore, primaryJudgment hay thứ hạng so sánh.',
      'KM-DIRECTION-4.0 bổ sung Địa Tư Môn, Đình Đình/Bạch Gian, Thiên Mã/Thiên Cương, Tam Thắng Cung và Ngũ Bất Kích. Đây là lớp annotation phương vị: không đổi rank, không tạo xác suất, không biến văn quân sự cổ thành chỉ dẫn đối đầu.',
      'KM-NIANMING-1.0 cho phép người dùng tự nhập ngày/năm sinh để lấy can niên trụ làm lớp Niên Mệnh đối chiếu trên bàn hiện tại; chi năm sinh chỉ là tham chiếu phụ. Lớp này không thay Nhật can, không thay KM-YONGSHEN-2.0 và không tham gia evidenceScore/primaryJudgment.',
    ],
    unsupported:[
      'Ứng kỳ chưa tự định ngày chỉ từ Phản/Phục ngâm hoặc từ quan hệ Tinh–Môn khi chưa có can-chi đơn trị; app cũng không tự suy cấp giờ nếu câu hỏi chỉ nêu phạm vi ngày/tháng. Các mốc KM-TIMING-3.0 còn lại chỉ là cửa sổ cần kiểm chứng, không phải ngày bảo đảm sự việc xảy ra.',
      'Dụng Thần dùng KM-YONGSHEN-2.0 theo nhóm câu hỏi và thứ bậc chính/phụ/đối ứng/đối chiếu; đây là quy ước có nguồn đối chiếu, không phải chuẩn duy nhất của mọi phái. Bàn không xác minh tâm ý người khác, bệnh tật, giá tài sản hay tương lai.',
      'KM-KEYING-3.0 đã phủ Bát Môn Khắc Ứng và Tam Kỳ đáo cung; Cửu Tinh trị thời mới chỉ có chỉ mục classical_context_only, chưa có diễn giải hiện đại dùng chốt kết quả. KM-FORMATION-3.0 và KM-DIRECTION-4.0 đã phủ các cách cục/phương vị chiến lược đang có nguồn khóa; các hệ phương vị khác chưa tự suy nếu chưa có profile nguồn riêng.',
      'KM-NIANMING-1.0 chỉ triển khai Niên Mệnh theo can năm sinh làm corroborator. Chưa triển khai toàn bộ phép Bản Mệnh–Hành Niên cổ điển, Nam/Nữ thuận nghịch, Ngũ Hổ độn hoặc Nạp Âm; không được gọi lớp hiện tại là full 本命行年.',
    ],
  };
  return {context, chart, facts, timePlace,board:allInOne.board, analysis:allInOne.analysis};
}

export const INSTRUCTIONS = BASE_WRITER_INSTRUCTIONS;
export const instructionsFor=context=>synthesisInstructions(INSTRUCTIONS,context);

async function digest(value) {
  const bytes = await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));
  return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function readingIdentity(prepared) {
  const chartFingerprint = await digest(prepared.chart);
  const requestFingerprint = await digest({rules:RULE_VERSION,caseRules:CASE_ENGINE_VERSION,nianmingRules:NIANMING_VERSION,chartFingerprint,context:prepared.context});
  return {chartFingerprint,requestFingerprint};
}
export async function buildReadingRequest(body) {
  const prepared = prepareReading(body);
  const identity = await readingIdentity(prepared);
  return {...prepared, ...identity, request:{question:prepared.context.question,topic:prepared.context.selectedTopic,
    mode:prepared.context.allInOne.classification.requested,actors:prepared.context.allInOne.actors,nianming:prepared.context.allInOne.nianmingInput,
    subject:prepared.context.allInOne.questionContext.subject.mapping,
    direction:prepared.context.allInOne.questionContext.direction?{origin:prepared.context.allInOne.questionContext.direction.origin,kind:prepared.context.allInOne.questionContext.direction.kind}:null,
    depth:prepared.context.allInOne.questionContext.depth,action:prepared.context.allInOne.action,candidates:prepared.context.allInOne.comparison?.values||[],
    method:prepared.chart.method,input:prepared.timePlace.originalInput,timePlace:prepared.timePlace.request,protocol:READING_PROTOCOL,rules:RULE_VERSION,caseRules:CASE_ENGINE_VERSION,nianmingRules:NIANMING_VERSION,...identity}};
}
export function assertCompatible(data) {
  if (data?.rules!==RULE_VERSION || data?.protocol!==READING_PROTOCOL || data?.caseRules!==CASE_ENGINE_VERSION || data?.nianmingRules!==NIANMING_VERSION) throw new Error(UPGRADE_MESSAGE);
}
export function validateReadingResponse(data,prepared) {
  assertCompatible(data);
  if (data.chartFingerprint!==prepared.chartFingerprint || data.requestFingerprint!==prepared.requestFingerprint) throw new Error('Lời luận không khớp câu hỏi hoặc bàn đang xem; kết quả đã bị chặn.');
  if (!data.facts || Object.keys(data.facts).length!==Object.keys(prepared.facts).length || Object.entries(prepared.facts).some(([id,text])=>data.facts[id]!==text)) throw new Error('Căn cứ của AI khác bàn đang xem; kết quả đã bị chặn.');
  validateReading(data.reading,prepared.facts,prepared.context.selectedTopic,prepared.context);
  return {...data,facts:prepared.facts};
}
