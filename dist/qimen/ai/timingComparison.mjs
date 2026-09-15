import {createQimenBoard} from '../core/board.mjs';
import {formatInstantAtOffset} from '../core/calendar.mjs';
import {analyzeBoard} from '../analysis/index.mjs';
import {ACTIONS,actionMetrics,rankCandidates,RANK_CONVENTION} from '../modes/actionRules.mjs';
export function compareTimes(base,rawCandidates,{action='general',topic='general',actors={},selfPillar=base.pillars.day}={}) {
  if(!Array.isArray(rawCandidates)||rawCandidates.length<2||rawCandidates.length>12)throw new Error('Chọn từ 2 đến 12 thời điểm để so sánh.');
  const inputs=rawCandidates.map(value=>{
    if(typeof value!=='string')throw new Error('Thời điểm ứng viên không hợp lệ.');
    const m=value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})$/);
    if(!m)throw new Error('Nhập thời điểm theo ngày và giờ, đủ đến phút.');
    const [,year,month,day,hour,minute]=m.map(Number);return {year,month,day,hour,minute,tzOffset:base.input.tzOffset};
  });
  const values=rawCandidates.map(s=>s.replace(' ','T'));
  if(new Set(values).size!==values.length)throw new Error('Các thời điểm so sánh không được trùng nhau.');
  const candidates=inputs.map((input,i)=>{
    // Base reuse avoids recalculating an identical instant. Each other candidate is computed once.
    const b=JSON.stringify(input)===JSON.stringify(base.input)?base:createQimenBoard(input,base.method);
    const a=analyzeBoard(b,{topic,actors,selfPillar});
    const roles=['self',...ACTIONS[action].roles],numbers=[...new Set(roles.map(id=>a.roles.find(r=>r.id===id).palace))];
    const targetNumbers=[...new Set(ACTIONS[action].roles.map(id=>a.roles.find(r=>r.id===id).palace))];
    const details=numbers.map(n=>{const p=a.palaces.find(p=>p.number===n);return {number:n,metrics:actionMetrics(p,action)};});
    const blockers=[...new Set(details.flatMap(d=>d.metrics.blockers))];
    if(a.patterns.wuBuYuShi)blockers.push('Ngũ bất ngộ thời của bàn ứng viên');
    const supports=details.filter(d=>targetNumbers.includes(d.number)).flatMap(d=>d.metrics.supports);
    return {id:`timing_${i+1}`,input:b.input,dateTime:b.dateTime,label:formatInstantAtOffset(b.utcMs,b.input.tzOffset,true),
      blockers,supports,fit:details.filter(d=>targetNumbers.includes(d.number)).reduce((sum,d)=>sum+d.metrics.fit,0),
      note:`${b.dun==='yang'?'Dương':'Âm'} Độn ${b.ju} cục · ${b.yuan}. ${b.fanYin?'Có phản ngâm; xem khả năng điều chỉnh.':''}${b.fuYin?' Có phục ngâm; xem khâu cần giữ/chậm.':''}`,
      board:{schemaVersion:'QimenCandidateSnapshot/1',dateTime:b.dateTime,method:b.method,dun:b.dun,ju:b.ju,pillars:b.pillars,
        term:{vi:b.term.vi,utcMs:b.term.utcMs},patterns:b.patterns,
        palaces:b.palaces.map(p=>({number:p.number,element:p.element,door:p.door?.vi||null,star:p.star.vi,spirit:p.spirit?.vi||null,
          heavenStems:p.heavenStems.map(s=>s.han),earthStem:p.earthStem.han,voided:p.voided,horse:p.horse}))},
      rolePalaces:roles.map(id=>{const r=a.roles.find(r=>r.id===id);return {id,palace:r.palace,basis:r.basis};}),details};
  });
  return {action,values,candidates,ranking:rankCandidates(candidates.map(({board,details,rolePalaces,...rest})=>rest)),
    convention:RANK_CONVENTION+' Giữ đại diện đã chọn ở bàn hỏi xuyên các ứng viên: Nhật trụ khi hỏi việc mình, hoặc Can Chi được xác nhận khi hỏi thay (Giáp dùng cùng nghi ẩn); Thời can thuộc từng bàn ứng viên. Không đổi người hỏi theo ngày ứng viên. Múi giờ cố định; chưa áp giờ mùa hè hoặc chân thái dương.'};
}
