import {normalizeQuestion,classifyQuestion,classifyTopic} from './classifier.mjs';
import {TOPIC_DOMAINS,domainSemantics,SECTOR_VOCABULARY} from '../modes/semantics.mjs';
const INTENTS=[
  ['contract',/\b(hop dong|dau thau|gi[aà]nh|ky duoc)\b/,'đạt thỏa thuận / hợp đồng'],
  ['reply',/\b(phan hoi|bao gia|co tin|ket qua)\b/,'làm rõ phản hồi và kết quả'],
  ['payment',/\b(thu no|tra no|cong no|tien ve|thanh toan)\b/,'xác định điều kiện tiền thực về'],
  ['search',/\b(tim nguoi|tim do|that lac)\b/,'xác minh đầu mối tìm kiếm'],
  ['relationship',/\b(tinh cam|tinh yeu|nguoi yeu|vo chong)\b/,'hiểu và xử lý quan hệ'],
];
export function buildQuestionContext(question,{mode='auto',topic='general',depth='standard'}={}) {
  if(!['standard','deep'].includes(depth))throw new Error('Mức luận không hợp lệ.');
  const source=question.trim().normalize('NFC'),q=normalizeQuestion(source),classification=classifyQuestion(source,mode);
  let domain=TOPIC_DOMAINS[topic==='general'?classifyTopic(source):topic]||'career';
  if(topic==='general') {
    if(/\b(tim nguoi|tim do|that lac)\b/.test(q))domain='search';
    else if(/\b(tuyen dung|ung vien|nhan su|tuyen nguoi)\b/.test(q))domain='recruitment';
    else if(/\b(du an|tien do|nghiem thu)\b/.test(q)&&!/\b(hop dong|bao gia|dau thau|khach hang)\b/.test(q))domain='project';
  }
  const inferredMode=classifyQuestion(source,'auto').mode;
  const questionType=classification.mode==='strategy'||classification.mode==='negotiation'||classification.mode==='business'&&['strategy','negotiation'].includes(inferredMode)?'strategy':
    ['timing','direction'].includes(classification.mode)?'decision':
    /\b(so sanh|so voi|loi the hon|manh hon|phuong an nao)\b/.test(q)?'comparison':
    /\b(tai sao|nguyen nhan|van de nam|nut that)\b/.test(q)?'diagnosis':
    /\b(co nen|nen chon)\b/.test(q)?'decision':'prediction';
  const intent=INTENTS.find(([,match])=>match.test(q));
  const company=/\b(cong ty|doanh nghiep|doi|ben) (cua )?(toi|minh|chung toi)\b/.test(q);
  const onBehalf=/\b(hoi (ho|thay)|cua (em trai|anh trai|chi gai|ban toi|con toi))\b/.test(q);
  const subject={kind:onBehalf?'on_behalf':company?'self_company':'self',text:onBehalf?'Chủ thể được hỏi thay':company?'Công ty / bên của người hỏi':'Người hỏi',source:source,status:onBehalf?'needs_confirmation':'question_convention'};
  const duration=q.match(/\b(?:trong|sau|vong|toi)\s+(?:(?:vong|khoang)\s+)?(\d+|mot|hai|ba)\s+(ngay|tuan|thang|nam)\b/);
  const relative=q.match(/\b(tuan sau|thang sau|hom nay|ngay mai|tuan nay|thang nay)\b/);
  const timeHorizon=duration?{text:duration[0],amount:Number(duration[1])||({mot:1,hai:2,ba:3}[duration[1]]),unit:({ngay:'day',tuan:'week',thang:'month',nam:'year'}[duration[2]]),status:'explicit_duration'}:
    {text:relative?.[0]||'Chưa nêu thời hạn',amount:null,unit:null,status:relative?'explicit_relative':'unknown'};
  const d=domainSemantics(domain),vocabulary=[...new Set([...d.vocabulary,...SECTOR_VOCABULARY.filter(s=>s.match.test(q)).flatMap(s=>s.terms)])];
  const observed=source.split(/[;\n]+/).map(s=>s.trim()).filter(Boolean);
  const stage=/\b(da gui|da nop|da bao gia)\b/.test(q)?'awaiting_response':/\b(dang thuong luong|dang dam phan)\b/.test(q)?'negotiating':/\b(da ky|da nhan viec)\b/.test(q)?'executing':'not_confirmed';
  const stakeholders=[{role:'self',status:subject.status,source:subject.source},
    {role:'customer',status:/\b(khach|doi tac|nguoi yeu|doi phuong)\b/.test(q)?'mentioned':'possible',source},
    {role:'decisionMaker',status:/\b(nguoi duyet|nguoi quyet dinh|nguoi phe duyet)\b/.test(q)?'mentioned':'possible',source:null},
    {role:'competitor',status:/\b(doi thu|vendor|nha cung cap hien tai)\b/.test(q)?'mentioned':'possible',source:null}];
  return {schemaVersion:'QuestionContext/1',question:source,domain,domainLabel:d.label,mode:classification.mode,classification,questionType,
    intent:intent?.[0]||'understand_event',desiredOutcome:intent?.[2]||'Làm rõ đúng sự việc trong câu hỏi',subject,
    target:{text:source,status:'retain_question_context'},stage,timeHorizon,stakeholders,
    constraints:observed.filter(s=>/\b(khong muon|khong the|chi co|toi da|ngan sach|han chot)\b/.test(normalizeQuestion(s))),
    userStatements:observed,actionability:questionType==='strategy'?'action_sequence':'conditional_assessment',vocabulary,depth,
    limits:['Vai trò biểu tượng không xác minh danh tính hay tâm ý.','Thời hạn câu hỏi không phải ngày ứng nghiệm đã tính.'],
    needsClarification:onBehalf};
}
