import {normalizeQuestion,classifyQuestion,classifyTopic} from './classifier.mjs';
import {TOPIC_DOMAINS,domainSemantics,SECTOR_VOCABULARY} from '../modes/semantics.mjs';
import {outcomeTarget,isFinancialQuestion} from './outcomeTarget.mjs';
const INTENTS=[
  ['negotiation',/\b(thuong luong|dam phan|nhuong bo|nen noi gi)\b/,'chọn bước thương lượng và điều kiện trao đổi'],
  ['profit',/\b(loi nhuan|co lai|sinh loi|bien lai)\b/,'phân biệt doanh thu với lợi nhuận sau chi phí'],
  ['reply',/\b(phan hoi|co tin|tra loi|hoi am)\b/,'làm rõ phản hồi và điều kiện nhận được thông tin'],
  ['payment',/\b(thu no|tra no|cong no|thanh toan)\b/,'phân biệt cam kết, xử lý thanh toán và tiền thực nhận'],
  ['income',/\b(tien(?! (?:trien|hanh|do)\b)|khoan thu|thu nhap|khoan dang cho)\b/,'phân biệt khoản thu phát sinh với tiền thực nhận'],
  ['contract',/\b(hop dong|dau thau|gi[aà]nh|ky duoc)\b/,'đạt thỏa thuận / hợp đồng'],
  ['project_result',/\b(du an|tien do|nghiem thu)\b/,'xác định giai đoạn và điều kiện hoàn thành dự án'],
  ['career_change',/\b(chuyen viec|doi viec|nhan viec|thang chuc)\b/,'phân biệt cơ hội công việc và thay đổi đã thực hiện'],
  ['family_decision',/\b(gia dinh|cha me|con cai|sinh hoat)\b/,'làm rõ lựa chọn và khả năng phối hợp trong gia đình'],
  ['search',/\b(tim nguoi|tim do|that lac)\b/,'xác minh đầu mối tìm kiếm'],
  ['relationship',/\b(tinh cam|tinh yeu|nguoi yeu|vo chong)\b/,'hiểu và xử lý quan hệ'],
];
export function buildQuestionContext(question,{mode='auto',topic='general',depth='standard',direction=null,subject=null}={}) {
  if(!['standard','deep'].includes(depth))throw new Error('Mức luận không hợp lệ.');
  const source=question.trim().normalize('NFC'),q=normalizeQuestion(source),classification=classifyQuestion(source,mode);
  const clauses=source.split(/[;\n]+|(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean);
  const focus=clauses.filter(s=>s.includes('?')).at(-1)||clauses.at(-1)||source,focusQ=normalizeQuestion(focus);
  const focusTopic=classifyTopic(focus),inferredTopic=focusTopic==='work'?classifyTopic(source):focusTopic;
  const domainText=focusTopic==='work'?q:focusQ;
  let domain=TOPIC_DOMAINS[topic==='general'?inferredTopic:topic]||'career';
  if(topic==='general') {
    if(/\b(tim nguoi|tim do|that lac)\b/.test(domainText))domain='search';
    else if(/\b(tuyen dung|ung vien|nhan su|tuyen nguoi)\b/.test(domainText))domain='recruitment';
    else if(/\b(du an|tien do|nghiem thu)\b/.test(domainText)&&!/\b(hop dong|bao gia|dau thau|khach hang)\b/.test(domainText))domain='project';
    else if(isFinancialQuestion(domainText)&&!/\b(bao gia|hop dong|dau thau)\b/.test(domainText))domain='finance';
  }
  const inferredMode=classifyQuestion(source,'auto').mode;
  const questionType=classification.mode==='strategy'||classification.mode==='negotiation'||classification.mode==='business'&&['strategy','negotiation'].includes(inferredMode)?'strategy':
    ['timing','direction'].includes(classification.mode)?'decision':
    /\b(so sanh|so voi|loi the hon|manh hon|phuong an nao)\b/.test(q)?'comparison':
    /\b(tai sao|nguyen nhan|van de nam|nut that)\b/.test(q)?'diagnosis':
    /\b(co nen|nen chon)\b/.test(q)?'decision':'prediction';
  const intent=INTENTS.find(([,match])=>match.test(focusQ))||INTENTS.find(([,match])=>match.test(q));
  const company=/\b(cong ty|doanh nghiep|doi|ben) (cua )?(toi|minh|chung toi)\b/.test(q);
  const onBehalf=/\b(hoi (ho|thay)|cua (em trai|anh trai|chi gai|ban toi|con toi))\b/.test(q);
  if(subject!==null&&(!subject||typeof subject!=='object'||Array.isArray(subject)||Object.keys(subject).some(k=>!['label','pillar'].includes(k))||typeof subject.label!=='string'||typeof subject.pillar!=='string'||subject.label.length>120))throw new Error('Chủ thể hỏi thay không hợp lệ.');
  const confirmed=onBehalf&&!!subject?.label.trim()&&!!subject?.pillar;
  const subjectContext={kind:onBehalf?'on_behalf':company?'self_company':'self',text:confirmed?subject.label.trim():onBehalf?'Chủ thể được hỏi thay':company?'Công ty / bên của người hỏi':'Người hỏi',source:source,status:onBehalf?(confirmed?'user_supplied':'needs_confirmation'):'question_convention',mapping:confirmed?{label:subject.label.trim(),pillar:subject.pillar}:null};
  let directionContext=null;
  if(classification.mode==='direction'){
    if(direction!==null&&(!direction||typeof direction!=='object'||Array.isArray(direction)||Object.keys(direction).some(k=>!['origin','kind'].includes(k))||typeof direction.origin!=='string'||direction.origin.length>240||!['','movement','seating','facing'].includes(direction.kind)))throw new Error('Điểm quy chiếu hoặc loại phương hướng không hợp lệ.');
    directionContext={origin:direction?.origin.trim()||'',kind:direction?.kind||'',goal:source,timeBasis:'board_time',reference:'Phương vị địa lý đo từ điểm quy chiếu; hướng ngồi là phía lưng/tựa, hướng nhìn là phía mặt nhìn.'};
  }
  const duration=q.match(/\b(?:trong|sau|vong|toi)\s+(?:(?:vong|khoang)\s+)?(\d+|mot|hai|ba)\s+(ngay|tuan|thang|nam)\b/);
  const relative=q.match(/\b(tuan sau|thang sau|hom nay|ngay mai|tuan nay|thang nay)\b/);
  const timeHorizon=duration?{text:duration[0],amount:Number(duration[1])||({mot:1,hai:2,ba:3}[duration[1]]),unit:({ngay:'day',tuan:'week',thang:'month',nam:'year'}[duration[2]]),status:'explicit_duration'}:
    {text:relative?.[0]||'Chưa nêu thời hạn',amount:null,unit:null,status:relative?'explicit_relative':'unknown'};
  timeHorizon.code=relative?({'tuan nay':'this_week','tuan sau':'next_week','thang nay':'this_month','thang sau':'next_month','hom nay':'today','ngay mai':'tomorrow'}[relative[0]]):duration?'duration':'unknown';
  const d=domainSemantics(domain),vocabulary=[...new Set([...d.vocabulary,...SECTOR_VOCABULARY.filter(s=>s.match.test(q)).flatMap(s=>s.terms)])];
  const observed=clauses;
  const stage=/\b(da gui|da nop|da bao gia)\b/.test(q)?'awaiting_response':/\b(dang thuong luong|dang dam phan)\b/.test(q)?'negotiating':/\b(da ky|da nhan viec)\b/.test(q)?'executing':'not_confirmed';
  const stakeholders=[{role:'self',status:subjectContext.status,source:subjectContext.source},
    ...[['customer',/\b(khach|doi tac|nguoi yeu|doi phuong)\b/],['decisionMaker',/\b(nguoi duyet|nguoi quyet dinh|nguoi phe duyet|cap quan ly)\b/],['competitor',/\b(doi thu|vendor|nha cung cap hien tai)\b/]]
      .filter(([,pattern])=>pattern.test(q)).map(([role])=>({role,status:'mentioned',source}))];
  const targetOutcome=outcomeTarget(focusQ,domain,intent?.[0]||'understand_event',timeHorizon);
  const resolvedTopic=topic!=='general'?topic:domain==='finance'&&!['money','investment','debt'].includes(inferredTopic)?'money':inferredTopic;
  return {schemaVersion:'QuestionContext/2',question:source,domain,resolvedTopic,domainLabel:d.label,mode:classification.mode,classification,questionType,
    intent:intent?.[0]||'understand_event',desiredOutcome:intent?.[2]||'Làm rõ đúng sự việc trong câu hỏi',subject:subjectContext,direction:directionContext,
    target:{text:source,status:'retain_question_context'},outcomeTarget:targetOutcome,stage,timeHorizon,stakeholders,
    constraints:observed.filter(s=>/\b(khong muon|khong the|chi co|toi da|ngan sach|han chot)\b/.test(normalizeQuestion(s))),
    userStatements:observed,options:observed.filter(s=>/\b(hay|hoac|phuong an|so voi)\b/.test(normalizeQuestion(s))),actionability:questionType==='strategy'?'action_sequence':'conditional_assessment',vocabulary,depth,
    limits:['Vai trò biểu tượng không xác minh danh tính hay tâm ý.','Thời hạn câu hỏi không phải ngày ứng nghiệm đã tính.'],
    clarificationQuestions:[...(onBehalf&&!confirmed?['Bạn hỏi thay ai và đã xác nhận Can Chi nào đại diện cho người đó?']:[]),...(directionContext&&!directionContext.origin?['Bạn lấy vị trí nào làm điểm quy chiếu phương hướng?']:[]),...(directionContext&&!directionContext.kind?['Bạn cần hướng di chuyển, hướng ngồi (phía lưng/tựa) hay hướng nhìn?']:[])],
    needsClarification:onBehalf&&!confirmed||!!directionContext&&(!directionContext.origin||!directionContext.kind)};
}
