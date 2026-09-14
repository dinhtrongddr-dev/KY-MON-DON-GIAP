import {RESULT_KEYS,STAGES} from '../schemas/reading.mjs';
import {normalizeQuestion} from './classifier.mjs';
import {buildWriterContext} from './writerContext.mjs';
export class ReadingValidationError extends Error {constructor(message){super(message);this.name='ReadingValidationError';}}
const reject=message=>{throw new ReadingValidationError(message);};
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const text=(s,min=1,max=5000)=>typeof s==='string'&&s.trim().length>=min&&s.length<=max;
const unique=items=>new Set(items).size===items.length;
const words=s=>s.trim().split(/\s+/).filter(Boolean);
function repeated(a,b){
  const x=words(normalizeQuestion(a)),y=words(normalizeQuestion(b));
  if(x.length<20||y.length<20)return false;
  const grams=w=>new Set(w.slice(0,-3).map((_,i)=>w.slice(i,i+4).join(' '))),gx=grams(x),gy=grams(y);
  return [...gx].filter(g=>gy.has(g)).length/Math.min(gx.size,gy.size)>0.82;
}
export function validateReading(r,facts,selectedTopic='general',context) {
  const c=context?.allInOne,g=c?.reasoning;
  if(!g||!exact(r,RESULT_KEYS)||!['reading','needs_clarification'].includes(r.status))reject('AI trả kết quả chưa đúng cấu trúc luận có căn cứ.');
  if(r.topic_id!==c.resolvedTopic||(selectedTopic!=='general'&&r.topic_id!==selectedTopic)||r.mode!==c.classification.mode||r.questionType!==c.questionContext.questionType)reject('AI luận lệch nhóm sự việc, chế độ hoặc ý định hỏi.');
  const clarification=r.status==='needs_clarification',allowed=new Set(g.claims.map(x=>x.id));
  const section=(s,extra=[],min=clarification?0:35)=>{
    if(!exact(s,['text','claim_ids',...extra])||!text(s.text,min)||!Array.isArray(s.claim_ids)||!unique(s.claim_ids)||s.claim_ids.length>6||s.claim_ids.some(id=>!allowed.has(id))||(!clarification&&!s.claim_ids.length))reject('Đoạn luận thiếu căn cứ hoặc dùng kết luận ngoài planner.');
    for(const id of s.claim_ids)if(g.claims.find(cl=>cl.id===id).evidenceIds.some(e=>!Object.hasOwn(facts,e)))reject('Kết luận có căn cứ không tồn tại trong bàn.');
  };
  section(r.summary,[],clarification?10:60);section(r.situation);section(r.bottleneck,['resolution']);section(r.alternative,['id']);section(r.timing);
  if(!Array.isArray(r.questions)||r.questions.length>3||r.questions.some(q=>!text(q,4,500)))reject('Câu hỏi làm rõ không hợp lệ.');
  for(const k of ['development','actions','comparisons'])if(!Array.isArray(r[k]))reject('Thiếu phần diễn biến hoặc hành động.');
  if(clarification){
    if(!r.questions.length||r.development.length||r.actions.length||r.comparisons.length||[r.situation,r.bottleneck,r.alternative,r.timing].some(s=>s.text||s.claim_ids.length)||r.bottleneck.resolution||r.alternative.id)reject('Chưa rõ chủ thể thì chưa dựng diễn biến hoặc kết quả.');
    return r;
  }
  if(g.questionContext.needsClarification)reject('Chưa xác nhận chủ thể hỏi thay; cần làm rõ trước khi dựng kịch bản.');
  if(!g.likelyScenario.primaryJudgment.claimIds.every(id=>r.summary.claim_ids.includes(id)))reject('Kết luận đầu chưa dựa trên đại diện chính.');
  if(r.development.length!==3||r.development.some((s,i)=>s?.stage!==STAGES[i]))reject('Diễn biến phải đủ ba chặng theo đúng thứ tự.');
  for(const [i,s] of r.development.entries()){
    section(s,['stage','condition','interaction_ids'],70);
    const planned=g.likelyScenario.stages[i];
    if(!text(s.condition,25,1400)||!s.claim_ids.some(id=>planned.claimIds.includes(id)))reject('Chặng diễn biến thiếu điều kiện chuyển hoặc căn cứ phù hợp.');
    if(!Array.isArray(s.interaction_ids)||!unique(s.interaction_ids)||s.interaction_ids.some(id=>!planned.relationshipIds.includes(id))||planned.relationshipIds.some(id=>!s.interaction_ids.includes(id)))reject('Chặng diễn biến chưa nối đúng quan hệ đã chọn.');
  }
  if(!text(r.bottleneck.resolution,30,1800))reject('Nút thắt chưa có điều kiện tháo gỡ để kiểm chứng.');
  const principal=g.likelyScenario.mainConflict;
  if(principal&&!r.bottleneck.claim_ids.includes(principal.claimId))reject('Nút thắt bỏ qua điều kiện đang chi phối.');
  if(principal&&!/\b(chua|neu|dieu kien|xac nhan|kiem tra|phu thuoc)\b/.test(normalizeQuestion(r.bottleneck.text+' '+r.summary.text)))reject('Tượng trái chiều chưa được diễn giải có điều kiện.');
  if(r.alternative.id!==g.likelyScenario.alternative.id||!r.alternative.claim_ids.some(id=>g.likelyScenario.alternative.claimIds.includes(id)))reject('Nhánh khác không khớp điều kiện đã lập.');
  if(r.actions.length<2||r.actions.length>4||!unique(r.actions.map(a=>a.recommendation_id)))reject('Cần hai đến bốn hành động khác nhau.');
  for(const a of r.actions)if(!exact(a,['recommendation_id','text'])||!text(a.text,40,1800)||!g.recommendations.some(x=>x.id===a.recommendation_id))reject('Hành động chưa gắn căn cứ hoặc quá chung chung.');
  const rows=c.comparison?.ranking||c.plan.computed.ranking||[],rowIds=rows.map(x=>x.id);
  if(r.comparisons.length>12||!unique(r.comparisons.map(x=>x.id))||r.comparisons.some(x=>!exact(x,['id','reason'])||!rowIds.includes(x.id)||!text(x.reason,50,1800)))reject('So sánh dùng thời điểm hoặc phương hướng chưa được tính.');
  if(c.classification.mode==='timing'&&r.comparisons.length!==rows.length||c.classification.mode==='direction'&&r.comparisons.length<2||!['timing','direction'].includes(c.classification.mode)&&r.comparisons.length)reject('Chưa đối chiếu đủ ứng viên theo chế độ.');
  const sections=[r.summary,r.situation,...r.development,r.bottleneck,r.alternative,r.timing];
  const used=new Set(sections.flatMap(s=>s.claim_ids));if(used.size<Math.min(3,g.claims.length))reject('Bài luận chưa phối hợp đủ các cụm tượng trọng tâm.');
  const passages=[...sections.map(s=>s.text),...r.actions.map(a=>a.text)];
  for(let i=0;i<passages.length;i++)for(let j=i+1;j<passages.length;j++)if(passages[i].trim()===passages[j].trim()||repeated(passages[i],passages[j]))reject('Các phần đang lặp ý hoặc lặp đoạn; cần viết lại cho mỗi chặng.');
  const prose=passages.join(' '),normalized=normalizeQuestion(prose),source=normalizeQuestion(context.question);
  if(/\b(ty le (thanh cong|thang)|xac suat)\b[^.!?]{0,50}\d|\d+(?:[.,]\d+)?\s*%\s*(thanh cong|chien thang)|\b(chac chan (se|thang|trung|ky duoc)|dam bao (thang|loi nhuan))\b/.test(normalized))reject('Không được tạo xác suất hoặc kết quả chắc chắn từ tượng.');
  for(const m of normalized.matchAll(/\d+(?:[.,]\d+)?\s*(?:trieu|ty|vnd|usd|dong)\b/g))if(!source.includes(m[0]))reject('Bài luận tự thêm số tiền không có trong câu hỏi.');
  const allowedDates=[context.question,...rows.map(x=>x.label)].join(' ');
  for(const m of prose.matchAll(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g))if(!allowedDates.includes(m[0]))reject('Bài luận tự thêm ngày chính xác ngoài dữ liệu được phép.');
  const budget=buildWriterContext(context).length,count=words([prose,r.bottleneck.resolution,...r.development.map(s=>s.condition)].join(' ')).length;
  if(count<budget.minWords)reject('Bài luận còn quá sơ lược; cần làm rõ cơ chế và diễn biến thay vì thêm lời chung chung.');
  if(count>budget.maxWords)reject('Bài luận vượt độ dài đã chọn; rút gọn phần lặp và giữ trọng tâm.');
  return r;
}
