export const ACTIONS={general:{label:'Mở việc',doors:['kai','sheng','xiu'],roles:['opportunity']},
  quote:{label:'Gửi báo giá / hồ sơ',doors:['jing','kai'],roles:['quote','opportunity']},
  sign:{label:'Ký / thống nhất hợp đồng',doors:['kai','xiu'],roles:['contract','opportunity']},
  meet:{label:'Gặp khách / gọi điện',doors:['xiu','kai'],roles:['contract','opportunity']},
  launch:{label:'Triển khai công việc',doors:['kai','sheng'],roles:['opportunity','event']}};
export function normalizeAction(action='general') {if(!Object.hasOwn(ACTIONS,action))throw new Error('Mục tiêu hành động không hợp lệ.');return action;}
export const RANK_CONVENTION='Bộ lọc tham khảo của app: ưu tiên ít điều kiện cản hơn, sau đó xét số dấu hiệu hợp mục tiêu. Cùng tiêu chí thì đồng hạng. Không phải thang điểm cổ điển, xác suất thành công hoặc chỉ dẫn thay thế điều kiện thực tế.';
export function actionMetrics(p,action) {
  const rules=ACTIONS[normalizeAction(action)],index=rules.doors.indexOf(p.door.id);
  const fit=index<0?0:index===0?2:1,blockers=[],supports=[];
  if(index>=0)supports.push(`${p.door.vi} phù hợp biểu tượng ${rules.label.toLowerCase()}`);
  if(p.voided)blockers.push(`Cung ${p.number}: Tuần Không`);
  if(p.conditions.doorPressure)blockers.push(`Cung ${p.number}: Môn bức`);
  for(const stem of p.stemPairs){if(stem.punishment)blockers.push(`${stem.heaven.vi}${stem.carried?' (can ký)':''}: kích hình`);if(stem.wonderTomb)blockers.push(`${stem.heaven.vi}${stem.carried?' (can ký)':''}: Tam kỳ nhập mộ`);}
  const harmony=['meet','sign'].includes(action)&&p.spirit.id==='harmony';
  if(harmony)supports.push('Lục Hợp hợp mục tiêu phối hợp / thỏa thuận');
  return {fit:fit+(harmony?1:0),blockers,supports,
    note:`${p.star.vi} ${p.strength.star.status} theo tháng tiết khí; đây là mức khí, không tự là tốt. ${p.horse?'Có Dịch Mã; không mặc định là thuận.':''}`};
}
export function rankCandidates(rows) {
  const ordered=[...rows].sort((a,b)=>a.blockers.length-b.blockers.length||b.fit-a.fit||String(a.id).localeCompare(String(b.id),'en'));
  let rank=0,last;
  return ordered.map(r=>{const key=`${r.blockers.length}:${r.fit}`;if(key!==last)rank++;last=key;return {...r,rank};});
}
