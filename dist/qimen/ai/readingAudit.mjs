import {RESULT_KEYS,STAGES} from '../schemas/reading.mjs';
import {normalizeQuestion} from './classifier.mjs';
import {buildWriterContext} from './writerContext.mjs';
import {auditTechnicalText} from './technicalAudit.mjs';
import {verifiedFallback} from './verifiedFallback.mjs';
import {formatError,plainReadingText} from '../../reading-format.mjs';
import {createQimenBoard} from '../core/board.mjs';
import {pillarFromGanzhi} from '../core/calendar.mjs';
import {analyzeBoard} from '../analysis/index.mjs';
import {auditSynthesis} from './synthesisAudit.mjs';
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
function negatesCertainty(prefix) {
  // A caution about certainty is not a promise; stop its scope at a new clause.
  const clause=prefix.split(/[.!?;]|\b(?:nhung|tuy nhien|song)\b/).at(-1);
  return /\bkhong (?:the|nen|duoc) (?:khang dinh|ket luan|noi)(?: rang)?\s*$/.test(clause)||
    /\b(?:chua|khong) (?:co )?du can cu de (?:khang dinh|ket luan|noi)(?: rang)?\s*$/.test(clause)||
    /\bkhong (?:nen|duoc|the) (?:dien giai|coi|xem) [^.!?;]{1,160} (?:la|thanh)(?: dau hieu)?\s*$/.test(clause);
}
function auditClaims(passages,context,rows=[]) {
  const prose=passages.join(' '),normalized=normalizeQuestion(prose),source=normalizeQuestion(context.question);
  if(/\b(?:km-case|caseguidance|deterministic_golden|derived_regression|source_golden|regression_locked|test_locked|source_locked|sourcecase|sourceref)\b/i.test(normalized))reject('Bài luận làm lộ metadata Case Engine nội bộ.');
  const certainty=[...normalized.matchAll(/\b(chac chan (se|thang|trung|ky duoc|thanh cong|that bai|co loi|nhan duoc)|dam bao (thang|loi nhuan|thanh cong)|nhat dinh (thang|thanh cong))\b/g)];
  if(/\b(ty le (thanh cong|thang)|xac suat)\b[^.!?]{0,50}\d|\d+(?:[.,]\d+)?\s*%\s*(thanh cong|chien thang)/.test(normalized)||certainty.some(m=>!negatesCertainty(normalized.slice(0,m.index))))reject('Không được tạo xác suất hoặc kết quả chắc chắn từ tượng.');
  for(const m of normalized.matchAll(/\d+(?:[.,]\d+)?\s*(?:trieu|ty|vnd|usd|dong)\b/g)){
    if(/[/:]/.test(normalized[m.index-1]||''))continue;
    if(!source.includes(m[0]))reject('Bài luận tự thêm số tiền không có trong câu hỏi.');
  }
  const sourceDates=context.question.match(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g)||[];
  const rowDates=rows.flatMap(row=>(row.label.match(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g)||[]).flatMap(value=>[value,value.replace(/\/\d{2,4}$/,'')]));
  const responseDates=(context.allInOne.reasoning.timing?.candidates||[]).flatMap(row=>[row.display,row.display?.replace(/\/\d{4}$/,'')]).filter(Boolean);
  const allowedDates=new Set([...sourceDates,...rowDates,...responseDates]);
  for(const m of prose.matchAll(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g))if(!allowedDates.has(m[0]))reject('Bài luận tự thêm ngày chính xác ngoài dữ liệu được phép.');
}
function auditComparison(reason,row,context) {
  const c=context.allInOne;
  let board=c.board,analysis=c.analysis,numbers=[row.palace];
  if(c.classification.mode==='timing'){
    const candidate=c.comparison.candidates.find(x=>x.id===row.id);
    // A candidate's prose must be checked against its own instant and representative.
    board=createQimenBoard(candidate.input,c.board.method);
    const selfPillar=c.questionContext.subject.mapping?pillarFromGanzhi(c.questionContext.subject.mapping.pillar):c.board.pillars.day;
    analysis=analyzeBoard(board,{topic:c.resolvedTopic,actors:c.actors,selfPillar});
    numbers=candidate.details.map(x=>x.number);
  }
  const scoped={question:context.question,allInOne:{board,analysis,reasoning:{claims:[{id:row.id,evidenceIds:numbers.map(n=>`p${n}`),ruleIds:[]}]}}};
  const errors=auditTechnicalText(reason,[row.id],scoped);if(errors.length)reject(`So sánh ${row.id}: ${errors.join(' ')}`);
  const formatting=formatError(reason,{allowComparisonEmphasis:true});if(formatting)reject(`So sánh ${row.id}: ${formatting}`);
}
export function validateReading(r,facts,selectedTopic='general',context) {
  const c=context?.allInOne,g=c?.reasoning;
  if(g&&r?.status==='verified_fallback'){
    if(JSON.stringify(r)!==JSON.stringify(verifiedFallback(context)))reject('Phần dữ kiện dự phòng không khớp dữ liệu đã tính.');
    return r;
  }
  if(!g||!exact(r,RESULT_KEYS)||!['reading','needs_clarification'].includes(r.status))reject('AI trả kết quả chưa đúng cấu trúc luận có căn cứ.');
  if(r.topic_id!==c.resolvedTopic||(selectedTopic!=='general'&&r.topic_id!==selectedTopic)||r.mode!==c.classification.mode||r.questionType!==c.questionContext.questionType)reject('AI luận lệch nhóm sự việc, chế độ hoặc ý định hỏi.');
  const clarification=r.status==='needs_clarification',allowed=new Set(g.claims.map(x=>x.id));
  const compact=buildWriterContext(context).layout==='concise'&&Array.isArray(r.development)&&r.development.length===0;
  const comparisonMode=['timing','direction'].includes(c.classification.mode);
  const section=(slot,s,extra=[],min=clarification?0:35)=>{
    if(!exact(s,['text','claim_ids',...extra])||!text(s.text,min)||!Array.isArray(s.claim_ids)||!unique(s.claim_ids)||s.claim_ids.length>6||s.claim_ids.some(id=>!allowed.has(id))||(!clarification&&s.text&&!s.claim_ids.length)||!s.text&&s.claim_ids.length)reject(`${slot}: đoạn luận thiếu căn cứ hoặc dùng kết luận ngoài planner.`);
    for(const id of s.claim_ids)if(g.claims.find(cl=>cl.id===id).evidenceIds.some(e=>!Object.hasOwn(facts,e)))reject(`${slot}: kết luận có căn cứ không tồn tại trong bàn.`);
    const errors=auditTechnicalText(s.text,s.claim_ids,context);if(errors.length)reject(`${slot}: ${errors.join(' ')}`);
    const formatting=formatError(s.text,{allowComparisonEmphasis:comparisonMode});if(formatting)reject(`${slot}: ${formatting}`);
  };
  section('summary',r.summary,[],clarification?10:60);section('situation',r.situation,[],compact?0:undefined);section('bottleneck',r.bottleneck,['resolution']);section('alternative',r.alternative,['id'],compact?0:undefined);section('timing',r.timing,[],compact?0:undefined);
  if(!Array.isArray(r.questions)||r.questions.length>3||r.questions.some(q=>!text(q,4,500)))reject('Câu hỏi làm rõ không hợp lệ.');
  for(const k of ['development','actions','comparisons'])if(!Array.isArray(r[k]))reject('Thiếu phần diễn biến hoặc hành động.');
  if(clarification){
    if(!r.questions.length||r.development.length||r.actions.length||r.comparisons.length||[r.situation,r.bottleneck,r.alternative,r.timing].some(s=>s.text||s.claim_ids.length)||r.bottleneck.resolution||r.alternative.id)reject('Chưa rõ chủ thể thì chưa dựng diễn biến hoặc kết quả.');
    auditClaims([r.summary.text,...r.questions],context);
    for(const q of r.questions){const errors=auditTechnicalText(q,[],context);if(errors.length)reject(errors.join(' '));if(formatError(q))reject(formatError(q));}
    return r;
  }
  if(g.questionContext.needsClarification)reject('Thiếu chủ thể hoặc điểm quy chiếu/cách dùng hướng; cần làm rõ trước khi dựng kịch bản.');
  if(!g.likelyScenario.primaryJudgment.claimIds.every(id=>r.summary.claim_ids.includes(id)))reject('Kết luận đầu chưa dựa trên đại diện chính.');
  if(!compact&&(r.development.length!==3||r.development.some((s,i)=>s?.stage!==STAGES[i])))reject('Diễn biến phải đủ ba chặng theo đúng thứ tự.');
  for(const [i,s] of r.development.entries()){
    section(`development.${s.stage||i}`,s,['stage','condition','interaction_ids'],70);
    const planned=g.likelyScenario.stages[i];
    if(!text(s.condition,25,1400)||!s.claim_ids.some(id=>planned.claimIds.includes(id)))reject('Chặng diễn biến thiếu điều kiện chuyển hoặc căn cứ phù hợp.');
    if(!Array.isArray(s.interaction_ids)||!unique(s.interaction_ids)||s.interaction_ids.some(id=>!planned.relationshipIds.includes(id))||planned.relationshipIds.some(id=>!s.interaction_ids.includes(id)))reject('Chặng diễn biến chưa nối đúng quan hệ đã chọn.');
  }
  if(!text(r.bottleneck.resolution,30,1800))reject('Nút thắt chưa có điều kiện tháo gỡ để kiểm chứng.');
  const principal=g.likelyScenario.mainConflict;
  if(principal&&!r.bottleneck.claim_ids.includes(principal.claimId))reject('Nút thắt bỏ qua điều kiện đang chi phối.');
  if(principal&&!/\b(chua|neu|dieu kien|xac nhan|kiem tra|phu thuoc)\b/.test(normalizeQuestion(r.bottleneck.text+' '+r.summary.text)))reject('Tượng trái chiều chưa được diễn giải có điều kiện.');
  if(!(compact&&!r.alternative.text&&!r.alternative.id)&&(r.alternative.id!==g.likelyScenario.alternative.id||!r.alternative.claim_ids.some(id=>g.likelyScenario.alternative.claimIds.includes(id))))reject('Nhánh khác không khớp điều kiện đã lập.');
  if(r.actions.length<(compact?1:2)||r.actions.length>4||!unique(r.actions.map(a=>a.recommendation_id)))reject('Cần các hành động khác nhau phù hợp độ phức tạp.');
  for(const a of r.actions)if(!exact(a,['recommendation_id','text'])||!text(a.text,40,1800)||!g.recommendations.some(x=>x.id===a.recommendation_id))reject('Hành động chưa gắn căn cứ hoặc quá chung chung.');
  const rows=c.comparison?.ranking||c.plan.computed.ranking||[],rowIds=rows.map(x=>x.id);
  if(r.comparisons.length>12||!unique(r.comparisons.map(x=>x.id))||r.comparisons.some(x=>!exact(x,['id','reason'])||!rowIds.includes(x.id)||!text(x.reason,50,1800)))reject('So sánh dùng thời điểm hoặc phương hướng chưa được tính.');
  if(c.classification.mode==='timing'&&r.comparisons.length!==rows.length||c.classification.mode==='direction'&&r.comparisons.length<2||!['timing','direction'].includes(c.classification.mode)&&r.comparisons.length)reject('Chưa đối chiếu đủ ứng viên theo chế độ.');
  for(const comparison of r.comparisons)auditComparison(comparison.reason,rows.find(row=>row.id===comparison.id),context);
  const sections=[r.summary,r.situation,...r.development,r.bottleneck,r.alternative,r.timing];
  const used=new Set(sections.flatMap(s=>s.claim_ids)),coreClaimCount=g.claims.filter(c=>c.status!=='corroboration_only').length;if(used.size<Math.min(compact?1:3,coreClaimCount))reject('Bài luận chưa phối hợp đủ các cụm tượng trọng tâm.');
  const passages=[...sections.map(s=>s.text),...r.actions.map(a=>a.text)].filter(Boolean);
  for(let i=0;i<passages.length;i++)for(let j=i+1;j<passages.length;j++)if(passages[i].trim()===passages[j].trim()||repeated(passages[i],passages[j]))reject('Các phần đang lặp ý hoặc lặp đoạn; cần viết lại cho mỗi chặng.');
  // Audit every user-visible string, even when it sits outside the prose budget.
  const prose=[...passages,r.bottleneck.resolution,...r.development.map(s=>s.condition)].join(' ');
  const semanticPassages=[...['summary','situation','bottleneck','alternative','timing'].map(slot=>({slot,text:r[slot].text,claimIds:r[slot].claim_ids})),
    ...r.development.flatMap(s=>[{slot:s.stage,text:s.text,claimIds:s.claim_ids},{slot:'condition',text:s.condition,claimIds:s.claim_ids}]),
    {slot:'resolution',text:r.bottleneck.resolution,claimIds:r.bottleneck.claim_ids},
    ...r.actions.map(a=>({slot:'action',text:a.text,claimIds:[g.recommendations.find(x=>x.id===a.recommendation_id).claimId]})),
    ...r.comparisons.map(a=>({slot:'comparison',text:a.reason,claimIds:[]})),...r.questions.map(text=>({slot:'question',text,claimIds:[]}))];
  const synthesisErrors=auditSynthesis(semanticPassages,context);if(synthesisErrors.length)reject(synthesisErrors.join(' '));
  auditClaims([prose,...r.comparisons.map(r=>r.reason),...r.questions],context,rows);
  for(const [value,ids] of [[r.bottleneck.resolution,r.bottleneck.claim_ids],...r.development.map(s=>[s.condition,s.claim_ids]),...r.actions.map(a=>[a.text,[g.recommendations.find(x=>x.id===a.recommendation_id).claimId]]),...r.questions.map(q=>[q,[]])]){
    const errors=auditTechnicalText(value,ids,context);if(errors.length)reject(errors.join(' '));
    if(formatError(value,{allowComparisonEmphasis:comparisonMode}))reject(formatError(value,{allowComparisonEmphasis:comparisonMode}));
  }
  const budget=buildWriterContext(context).length,count=words(plainReadingText(prose)).length;
  if(count<budget.minWords)reject('Bài luận còn quá sơ lược; cần làm rõ cơ chế và diễn biến thay vì thêm lời chung chung.');
  if(count>budget.maxWords)reject('Bài luận vượt độ dài đã chọn; rút gọn phần lặp và giữ trọng tâm.');
  return r;
}
