import {STAGE_KEYS,dimensionKeys,askedDimension} from './outcomeDimensions.mjs';
import {normalizeQuestion} from './classifier.mjs';
const LABELS={
  finance:['Cơ hội thu','Phát sinh khoản thu','Khoản thu thành hình','Cam kết khoản thu','Xử lý khoản thu','Tiền thực nhận','Hoàn tất'],
  business:['Cơ hội giao dịch','Có đầu mối hoặc phản hồi','Nội dung giao dịch thành hình','Thỏa thuận được chốt','Thực hiện thỏa thuận','Kết quả giao dịch','Hoàn tất giao dịch'],
  project:['Khả năng mở việc','Đầu việc xuất hiện','Phạm vi thành hình','Thống nhất yêu cầu','Triển khai','Kết quả bàn giao','Hoàn tất dự án'],
  career:['Cơ hội công việc','Có đầu mối mới','Vai trò thành hình','Thỏa thuận làm việc','Bắt đầu thực hiện','Thay đổi có kết quả','Ổn định và hoàn tất'],
  relationship:['Khả năng kết nối','Có tương tác','Quan hệ tiến triển','Thống nhất mong muốn','Thực hiện điều đã thống nhất','Chuyển biến thực tế','Khép lại vấn đề đang hỏi'],
  family:['Khả năng trao đổi','Nhu cầu được nêu','Phương án thành hình','Người thân thống nhất','Thực hiện phương án','Thay đổi sinh hoạt','Hoàn tất việc gia đình'],
};
const DEFAULT=['Khả năng','Phát sinh','Thành hình','Xác nhận','Thực hiện','Kết quả thực tế','Hoàn tất'];
function observedStage(context) {
  const assertions=context.userStatements.filter(s=>!/[?]/.test(s)&&! /\b(co .*khong|chua|khong|neu|se|du kien|dang cho)\b/.test(normalizeQuestion(s)));
  const patterns=[['COMPLETION',/\bda (hoan tat|hoan thanh)\b/],['REALIZATION',/\b(da nhan duoc tien|tien da vao tai khoan)\b/],['EXECUTION',/\bda (trien khai|bat dau|nhan viec)\b/],['CONFIRMATION',/\bda (ky|dong y|chot)\b/],['FORMATION',/\bda (gui|nop|bao gia)\b/]];
  const found=patterns.find(([,pattern])=>assertions.some(s=>pattern.test(normalizeQuestion(s))));
  return {stage:found?.[0]||null,status:'user_report_only',source:found?assertions.filter(s=>found[1].test(normalizeQuestion(s))):[],verifiedByChart:false};
}
export function buildEventStages(dimensions,context,interactions) {
  const keys=dimensionKeys(context),labels=LABELS[context.domain]||DEFAULT;
  const stages=keys.map((key,i)=>({stage:STAGE_KEYS[i],dimension:key,label:labels[i],status:dimensions[key].status,
    supportingEvidenceIds:dimensions[key].supportingEvidenceIds,limitingEvidenceIds:dimensions[key].limitingEvidenceIds,
    conditions:dimensions[key].conditions,observed:false}));
  const relevant=interactions.filter(i=>i.affectsGoal&&!i.samePalace);
  const transitions=stages.slice(1).map((s,i)=>{
    const links=i>=1?relevant:relevant.filter(r=>r.effects.some(effect=>['support','activation'].includes(effect)));
    return {from:stages[i].stage,to:s.stage,condition:s.conditions[0]||`Xuất hiện dấu hiệu riêng của bước ${s.label.toLowerCase()}.`,
      relationshipIds:links.map(r=>r.edgeId),effects:[...new Set(links.flatMap(r=>r.effects))],
      evidenceIds:[...new Set([...s.supportingEvidenceIds,...s.limitingEvidenceIds,...links.flatMap(r=>r.evidenceIds)])],
      basis:'conditional_sequence_not_predicted_chronology'};
  });
  return {schemaVersion:'EventStages/1',askedDimension:askedDimension(context),observed:observedStage(context),stages,transitions,
    distinction:'Tầng được tượng hỗ trợ khác với giai đoạn đã xảy ra; chuỗi là điều kiện chuyển, không phải lịch tương lai đã biết.'};
}
