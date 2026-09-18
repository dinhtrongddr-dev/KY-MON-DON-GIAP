import {normalizeQuestion} from './classifier.mjs';
import {plainReadingText} from '../../reading-format.mjs';
const normalized=text=>normalizeQuestion(plainReadingText(text));
const TAGS={
  opportunity:/\b(co hoi|duong mo)\b/,money:/\b(khoan thu|dong tien|nguon thu)\b/,payment:/\b(thanh toan|thuc nhan|tai khoan)\b/,
  authority:/\b(phe duyet|tham quyen|nguoi duyet)\b/,condition:/\b(dieu kien|phu thuoc)\b/,
  void:/\b(tuan khong|chua thuc hoa)\b/,movement:/\b(dich ma|di chuyen)\b/,execution:/\b(trien khai|thuc hien|xu ly)\b/,
  verification:/\b(xac minh|xac nhan|kiem tra|lam ro)\b/,timing:/\b(ung ky|thoi han|thoi diem)\b/,
};
export const semanticTags=text=>Object.entries(TAGS).filter(([,r])=>r.test(normalized(text))).map(([tag])=>tag);
function conditionalPrefix(text,index) {
  const prefix=text.slice(0,index).split(/[.!?;]|\b(?:nhung|tuy nhien)\b/).at(-1);
  return /\b(neu|chi khi|gia su|co the|chua|khong (?:the|nen|duoc)|khong dong nghia|chua dong nghia)\b/.test(prefix);
}
function auditRepetition(passages,g) {
  const topics=new Map();
  const paragraphs=passages.filter(p=>p.slot!=='question'&&p.slot!=='comparison').flatMap(p=>p.text.split(/\n\s*\n/).map(text=>({...p,text})));
  for(const p of paragraphs) {
    const q=normalized(p.text);
    if(!/\b(can|phai|hay|nen)\b[^.!?]{0,50}\b(xac minh|kiem tra|xac nhan|lam ro)\b/.test(q))continue;
    const tag=/\b(thanh toan|cam ket|phan hoi|quyen|phe duyet)\b/.test(q)?'payment_verification':'verification';
    // A different citation alone is not a new insight: the prose must name its mechanism.
    const insights=Object.entries({resource:/nguon luc|von/,scope:/pham vi|tieu chuan|khoi luong/,cost:/chi phi|bien lai/,pressure:/khac|suc ep/,support:/sinh ho|ho tro/,void:/tuan khong/,movement:/dich ma/,execution:/thuc hien|trien khai/,realization:/thuc nhan|tai khoan/}).filter(([,r])=>r.test(q)).map(([id])=>id);
    const evidence=(p.claimIds||[]).flatMap(id=>g.claims.find(c=>c.id===id)?.evidenceIds||[]);
    const rows=topics.get(tag)||[];rows.push({insights,evidence,slot:p.slot});topics.set(tag,rows);
  }
  for(const [tag,rows] of topics){
    const seenInsights=new Set(),seenEvidence=new Set();let redundant=0;
    for(const row of rows){
      const novel=row.insights.some(x=>!seenInsights.has(x))&&row.evidence.some(x=>!seenEvidence.has(x));
      if(!novel)redundant++;
      row.insights.forEach(x=>seenInsights.add(x));row.evidence.forEach(x=>seenEvidence.add(x));
    }
    if(rows.length>=3&&redundant>=2)return [`Các phần lặp ý ${tag} từ ba lần mà không thêm cơ chế/căn cứ mới; gộp cảnh báo và dành mỗi phần cho một bước khác.`];
  }
  return [];
}
export function auditSynthesis(passages,context) {
  const c=context.allInOne,g=c.reasoning,qc=g.questionContext,source=normalized(context.question),issues=[];
  const candidates=c.comparison?.candidates||[];
  const candidateDates=new Set(candidates.map(c=>`${c.input.year}-${String(c.input.month).padStart(2,'0')}-${String(c.input.day).padStart(2,'0')}`));
  const candidateDisplayDates=new Set(candidates.flatMap(c=>{const short=`${String(c.input.day).padStart(2,'0')}/${String(c.input.month).padStart(2,'0')}`;return [short,`${short}/${c.input.year}`];}));
  const has=id=>g.nodes.some(n=>n.id===id);
  const actors=[['customer',/\b(khach hang|khach se|khach da)\b/],['payer',/\b(nguoi tra tien|ben tra tien|ben thanh toan|nguoi chuyen tien|ben chuyen khoan)\b/],
    ['authority',/\b(nguoi co quyen (?:phe duyet|chap thuan)|nguoi phe duyet|nguoi duyet|cap phe duyet|giam doc)\b/]];
  for(const p of passages){
    const q=normalized(p.text);if(!q)continue;
    for(const [id,pattern] of actors)if(pattern.test(q)&&!pattern.test(source)&&!has(id)&&!(id==='authority'&&has('decisionMaker')))
      issues.push(`Đoạn ${p.slot} tự thêm vai ${id} ngoài actor map và câu hỏi.`);
    for(const match of q.matchAll(/\b(?:\d+(?:[.,]\d+)*|mot|hai|ba|bon|nam|sau|bay|tam|chin|muoi)\s*(?:trieu|ty|vnd|usd|dong|do la)\b/g)){
      if(/[/:]/.test(q[match.index-1]||''))continue;
      if(!source.includes(match[0]))issues.push(`Bài luận tự thêm số tiền ngoài dữ liệu: ${match[0]}.`);
    }
    const timings=/\b(?:\d+|mot|hai|ba|bon|nam|sau|bay)(?:\s*[-–]\s*(?:\d+|mot|hai|ba))?\s*(?:ngay|tuan|thang)(?:\s+nua)?\b|\bthu (?:hai|ba|tu|nam|sau|bay)\b|\b(?:chu nhat|cuoi tuan|dau tuan|ngay mai|chieu mai|sang mai)\b/g;
    for(const match of q.matchAll(timings)){
      const before=q.slice(0,match.index);
      const orderPhrase=match[0]==='thu tu'&&/^thứ\s+tự(?=\s|[.,;:!?]|$)/iu.test(p.text.slice(match.index));
      const ordinalWeekday=/^thu\s+(?:hai|ba|tu|nam|sau|bay)\b/.test(match[0])&&/\b(?:moc|lua chon|ung vien|phuong an|thoi diem|buoc|hang|muc|nhom|truong hop|lan|xep|dung|giu|thuoc)\s*$/.test(before);
      if(orderPhrase||ordinalWeekday)continue;
      const prefix=before.split(/[.!?;]/).at(-1);
      const denied=/\b(chua|khong (?:the|co|nen|duoc))\b/.test(prefix)&&!/\b(neu|nhung|tuy nhien)\b/.test(prefix);
      const forecasts=/\b(se|xay ra|ung vao|tien ve|nhan tien|tien vao)\b/.test(prefix);
      if(!denied&&(forecasts||!source.includes(match[0]))&&!g.timing.allowedPredictions.includes(match[0]))issues.push(`Mốc ứng kỳ ngoài Timing Engine: ${match[0]}; không được tự định ngày hoặc số ngày.`);
    }
    for(const match of q.matchAll(/\b\d{4}-\d{2}-\d{2}\b|\bngay \d{1,2} thang \d{1,2}(?: nam \d{4})?\b/g)){
      const scope=Object.values(g.timing.window||{}).includes(match[0])&&/\b(khoang hoi|pham vi|cua so|thoi han)\b/.test(q)&&!/\b(se|xay ra|tien ve)\b/.test(q);
      const comparison=p.slot==='comparison'&&candidateDates.has(match[0]);
      if(!scope&&!comparison&&!source.includes(match[0]))issues.push('Ngày cụ thể ngoài dữ liệu thời gian được phép.');
    }
    const calendarDates=[...q.matchAll(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g)];
    const onlyTimingCandidates=c.classification.mode==='timing'&&calendarDates.length&&calendarDates.every(m=>candidateDisplayDates.has(m[0]));
    const futureIndex=q.search(/\b(se|chac chan|nhat dinh)\b/);
    const futurePrefix=futureIndex>=0?q.slice(0,futureIndex).split(/[.!?;]/).at(-1):'';
    const negatedFuture=/\b(?:khong phai(?: la)?|khong dong nghia|khong the|khong nen|khong duoc|chua|khong co can cu de)\b[^.!?;]{0,120}$/.test(futurePrefix);
    const unconditionalFuture=futureIndex>=0&&!conditionalPrefix(q,futureIndex)&&!negatedFuture;
    if(calendarDates.length&&!['comparison','question'].includes(p.slot)&&unconditionalFuture&&!onlyTimingCandidates)issues.push('Khoảng lịch câu hỏi không phải ngày dự báo kết quả.');
    if(onlyTimingCandidates&&unconditionalFuture&&/\b(?:se|chac chan|nhat dinh)\b[^.!?;]{0,80}\b(?:ky duoc|thanh cong|duoc ky|duoc phe duyet|duoc thanh toan|nhan duoc|tien ve|hoan tat|hoan thanh)\b/.test(q))issues.push('Ứng viên chọn thời điểm không phải ngày bảo đảm kết quả.');
    for(const match of q.matchAll(/\b(?:khach hang|doi tac|khoan thu|hop dong(?: moi)?|tien|ban)\s+(?:da|dang|se)\s+(?:duoc )?(?:dong y|chuyen tien|nhan|xac nhan|ky|thanh toan|phe duyet|vao tai khoan)[^.!?;]*/g)){
      if(!conditionalPrefix(q,match.index)&&!source.includes(match[0].replace(/[,.]$/,'')))issues.push('Bài luận tự khẳng định sự kiện ngoài điều người dùng đã kể.');
    }
    for(const match of q.matchAll(/\b(?:ban da dat muc tieu|(?:thoa thuan|hop dong|du an|cong viec) da (?:hoan tat|hoan thanh|thanh cong)|moi dieu kien da (?:duoc )?dap ung|(?:ban |su viec |du an )?chac chan (?:dat|thanh cong|hoan tat|hoan thanh))[^.!?;]*/g)){
      if(!conditionalPrefix(q,match.index)&&!source.includes(match[0]))issues.push('Tự nâng giai đoạn thành đạt mục tiêu/hoàn tất, trái nhận định có điều kiện của planner.');
    }
    if(qc.domain==='finance'&&g.primaryJudgment.answerClass==='conditional_positive'){
      for(const match of q.matchAll(/\b(?:khong (?:co |biet (?:co )?)?(?:tien|khoan thu|phat sinh)|chac chan (?:tien|co tien|nhan tien))\b/g))
        if(!conditionalPrefix(q,match.index))issues.push('Kết luận trái primaryJudgment hoặc đồng nhất phát sinh với thực nhận.');
      if(p.slot==='summary'&&qc.outcomeTarget.stageAsked==='emergence'&&!/\b(co (?:tin hieu|dau hieu|tuong|kha nang)|(?:thien|nghieng) ve co)\b/.test(q))
        issues.push('Kết luận phải trả lời trực tiếp tín hiệu phát sinh theo primaryJudgment trước khi nêu giới hạn thực nhận.');
    }
  }
  return [...new Set([...issues,...auditRepetition(passages,g)])];
}
