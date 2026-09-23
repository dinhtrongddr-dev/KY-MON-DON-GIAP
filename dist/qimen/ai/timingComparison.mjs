import {createQimenBoard} from '../core/board.mjs';
import {formatInstantAtOffset} from '../core/calendar.mjs';
import {resolveTimePlace} from '../timePlace.mjs';
import {analyzeBoard} from '../analysis/index.mjs';
import {ACTIONS,actionMetrics,rankCandidates,RANK_CONVENTION} from '../modes/actionRules.mjs';
export function compareTimes(base,rawCandidates,{action='general',topic='general',actors={},selfPillar=base.pillars.day,timePlace=null}={}) {
  if(!Array.isArray(rawCandidates)||rawCandidates.length<2||rawCandidates.length>12)throw new Error('Chọn từ 2 đến 12 thời điểm để so sánh.');
  const inputs=rawCandidates.map(value=>{
    if(typeof value!=='string')throw new Error('Thời điểm ứng viên không hợp lệ.');
    const m=value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})$/);
    if(!m)throw new Error('Nhập thời điểm theo ngày và giờ, đủ đến phút.');
    const [,year,month,day,hour,minute]=m.map(Number);return {year,month,day,hour,minute,tzOffset:base.input.tzOffset};
  });
  const resolved=inputs.map(input=>resolveTimePlace(input,timePlace));
  const values=rawCandidates.map(s=>s.replace(' ','T'));
  if(new Set(values).size!==values.length)throw new Error('Các thời điểm so sánh không được trùng nhau.');
  const candidates=resolved.map((tp,i)=>{
    const input=tp.boardInput;
    // Base reuse avoids recalculating an identical instant. Each other candidate is computed once.
    const b=JSON.stringify(input)===JSON.stringify(base.input)?base:createQimenBoard(input,base.method);
    const a=analyzeBoard(b,{topic,actors,selfPillar});
    const roles=['self',...ACTIONS[action].roles],numbers=[...new Set(roles.map(id=>a.roles.find(r=>r.id===id).palace))];
    const targetNumbers=[...new Set(ACTIONS[action].roles.map(id=>a.roles.find(r=>r.id===id).palace))];
    const details=numbers.map(n=>{const p=a.palaces.find(p=>p.number===n);return {number:n,metrics:actionMetrics(p,action)};});
    const blockers=[...new Set(details.flatMap(d=>d.metrics.blockers))];
    if(a.patterns.wuBuYuShi)blockers.push('Ngũ bất ngộ thời của bàn ứng viên');
    const supports=details.filter(d=>targetNumbers.includes(d.number)).flatMap(d=>d.metrics.supports);
    const formationMarkers=targetNumbers.flatMap(n=>(a.formations.byPalace[n]?.matches||[]).filter(m=>m.qualified).map(m=>({id:m.id,name:m.name,family:m.family,palace:n,plainMeaning:m.plainMeaning,uses:m.uses}))).slice(0,8);
    return {id:`timing_${i+1}`,input:b.input,dateTime:b.dateTime,label:formatInstantAtOffset(b.utcMs,b.input.tzOffset,true),timePlace:tp.metadata,
      blockers,supports,formationMarkers,fit:details.filter(d=>targetNumbers.includes(d.number)).reduce((sum,d)=>sum+d.metrics.fit,0),
      note:`${b.dun==='yang'?'Dương':'Âm'} Độn ${b.ju} cục · ${b.yuan}. ${b.fanYin?'Có phản ngâm; xem khả năng điều chỉnh.':''}${b.fuYin?' Có phục ngâm; xem khâu cần giữ/chậm.':''}`,
      board:{schemaVersion:'QimenCandidateSnapshot/1',dateTime:b.dateTime,method:b.method,dun:b.dun,ju:b.ju,pillars:b.pillars,
        term:{vi:b.term.vi,utcMs:b.term.utcMs},patterns:b.patterns,
        palaces:b.palaces.map(p=>({number:p.number,element:p.element,door:p.door?.vi||null,star:p.star.vi,spirit:p.spirit?.vi||null,
          heavenStems:p.heavenStems.map(s=>s.han),earthStem:p.earthStem.han,voided:p.voided,horse:p.horse}))},
      rolePalaces:roles.map(id=>{const r=a.roles.find(r=>r.id===id);return {id,palace:r.palace,basis:r.basis};}),details};
  });
  return {action,values,candidates,ranking:rankCandidates(candidates.map(({board,details,rolePalaces,...rest})=>rest)),
    convention:RANK_CONVENTION+' Giữ đại diện đã chọn ở bàn hỏi xuyên các ứng viên: Nhật trụ khi hỏi việc mình, hoặc Can Chi được xác nhận khi hỏi thay (Giáp dùng cùng nghi ẩn); Thời can thuộc từng bàn ứng viên. Không đổi người hỏi theo ngày ứng viên. KM-TIMEPLACE-2.0 resolve lại offset IANA cho từng ứng viên khi IANA mode được bật; fixed-offset mode giữ nguyên offset cũ. Giờ Mặt Trời không tự áp vào bàn.'};
}


const DATE_SCAN_HOURS=Object.freeze([0,2,4,6,8,10,12,14,16,18,20,22]);
const two=n=>String(n).padStart(2,'0');
function parseTimingDate(value){
  if(typeof value!=='string')throw new Error('Ngày ứng viên không hợp lệ.');
  const m=value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m)throw new Error('Nhập ngày theo định dạng YYYY-MM-DD.');
  const [,year,month,day]=m.map(Number),probe=new Date(Date.UTC(year,month-1,day));
  if(probe.getUTCFullYear()!==year||probe.getUTCMonth()!==month-1||probe.getUTCDate()!==day)throw new Error('Ngày ứng viên không tồn tại.');
  return {year,month,day,value};
}
function localCandidateValue(input){return `${input.year}-${two(input.month)}-${two(input.day)}T${two(input.hour)}:${two(input.minute)}`;}
export function selectBestTimesForDates(base,rawDates,{action='general',topic='general',actors={},selfPillar=base.pillars.day,timePlace=null}={}){
  if(!Array.isArray(rawDates)||rawDates.length<2||rawDates.length>12)throw new Error('Chọn từ 2 đến 12 ngày để so sánh.');
  const dates=rawDates.map(parseTimingDate);
  if(new Set(dates.map(x=>x.value)).size!==dates.length)throw new Error('Các ngày so sánh không được trùng nhau.');
  const selections=dates.map(date=>{
    const viable=[],errors=[];
    for(const hour of DATE_SCAN_HOURS){
      const value=`${date.value}T${two(hour)}:00`;
      try{
        resolveTimePlace({year:date.year,month:date.month,day:date.day,hour,minute:0,tzOffset:base.input.tzOffset},timePlace);
        viable.push(value);
      }catch(error){errors.push(error);}
    }
    if(viable.length<2)throw errors[0]||new Error('Không tìm được đủ khung giờ dân dụng hợp lệ trong ngày đã chọn.');
    const scan=compareTimes(base,viable,{action,topic,actors,selfPillar,timePlace});
    const bestRank=scan.ranking[0]?.rank;
    const tied=scan.ranking.filter(row=>row.rank===bestRank).sort((a,b)=>a.input.hour-b.input.hour||a.input.minute-b.input.minute);
    const best=tied[0];
    if(!best)throw new Error('Không tìm được khung giờ phù hợp để so sánh trong ngày đã chọn.');
    return {date:date.value,value:localCandidateValue(best.input),scannedSlots:viable.length,tiedBestSlots:tied.length};
  });
  return {
    mode:'date_scan',
    slotHours:[...DATE_SCAN_HOURS],
    values:selections.map(x=>x.value),
    selections
  };
}
