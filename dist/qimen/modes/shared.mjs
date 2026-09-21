export const MODE_LABELS={auto:'Tự động',prediction:'Dự đoán',strategy:'Chiến lược',business:'Thương chiến',negotiation:'Đàm phán',timing:'Chọn thời điểm',direction:'Chọn phương hướng'};
export const MODES=Object.keys(MODE_LABELS);
export function roleState(analysis,id) {
  const role=analysis.roles.find(r=>r.id===id);
  if(!role||role.palace===null)return {id,label:role?.label||id,palace:null,status:'unresolved',support:[],friction:[],movement:[],evidenceIds:role?[role.evidenceId]:[]};
  const p=analysis.palaces.find(p=>p.number===role.palace),support=[],friction=[],movement=[];
  if(['kai','sheng','xiu'].includes(p.door.id))support.push('Cửa thuận theo quy ước, còn tùy mục tiêu');
  if(p.voided)friction.push('Tuần Không: cần kiểm tra điều kiện hiện thực hóa');
  if(p.conditions.doorPressure)friction.push('Môn bức: cách hành động có thể xung với hoàn cảnh');
  // Only a located stem inherits its own punishment/tomb, never its neighbour's.
  const stem=p.stemPairs.find(s=>s.heaven.han===role.stem);
  if(stem?.punishment)friction.push('Can đại diện gặp kích hình');
  if(stem?.tomb??stem?.wonderTomb)friction.push(`Can đại diện ${stem.wonderTomb?'Tam kỳ':'Lục nghi'} nhập mộ`);
  if(['si','du'].includes(p.door.id))friction.push('Cửa giữ / đóng: cần xét việc có đòi hỏi mở mới không');
  if(p.horse)movement.push('Dịch Mã');
  if(analysis.patterns.layers.starFanYin||analysis.patterns.layers.doorFanYin)movement.push('Phản ngâm: theo dõi khả năng đổi hướng');
  if(analysis.patterns.layers.starFuYin||analysis.patterns.layers.doorFuYin)movement.push('Phục ngâm: theo dõi khâu giữ nguyên');
  return {id,label:role.label,palace:role.palace,status:role.status,support,friction,movement,starStrength:p.strength.star.status,
    evidenceIds:[role.evidenceId,`p${p.number}`,`c${p.number}`,`strength_${p.number}`]};
}
export function relationOf(analysis,from,to) {
  const a=analysis.roles.find(r=>r.id===from),b=analysis.roles.find(r=>r.id===to);
  return a?.palace&&b?.palace?analysis.relations.find(r=>r.from===a.palace&&r.to===b.palace):null;
}
export function steps(mode,items) {
  return items.map(([key,title,roleIds,focus])=>({id:`mode_${mode}_${key}`,key,title,roleIds,focus}));
}
export function finish(mode,analysis,chain,computed) {
  const roleIds=[...new Set(chain.flatMap(s=>s.roleIds))],states=roleIds.map(id=>roleState(analysis,id));
  return {mode,label:MODE_LABELS[mode],ruleSet:`app-${mode}-1`,chain,roleIds,states,computed,
    unresolved:states.filter(s=>s.status==='unresolved').map(s=>s.id),
    caution:'Các nhánh là quy tắc diễn giải minh bạch của app, không phải xác suất thành bại đã được kiểm chứng.'};
}
