import {domainSemantics} from '../modes/semantics.mjs';
function voidResolution(bundle,context) {
  const ids=bundle.actorIds,finance=context.domain==='finance';
  if(ids.includes('payment'))return {dimension:finance?'payment_processing':'execution',resolution:'Khâu xử lý còn điều kiện chưa hoàn tất; chỉ ghi nhận thực nhận khi có dấu vết giao dịch thực tế.'};
  if(ids.includes('event'))return {dimension:finance?'income_formation':'formation',resolution:'Khả năng của sự việc còn ở dạng chưa vững; cần một đầu việc hoặc tiến triển cụ thể để thành hình.'};
  if(ids.includes('self'))return {dimension:finance?'cash_realization':'realization',resolution:'Vị thế của người hỏi chưa ổn định ở khâu nhận kết quả; xác định phần nguồn lực và bước chủ động mình thực sự làm được.'};
  if(ids.includes('money')||ids.includes('capital'))return {dimension:finance?'cash_realization':'realization',resolution:'Tượng nguồn lực có nhưng chưa thành nguồn lực sử dụng được; tách khoản dự kiến khỏi khoản đã thực có.'};
  if(ids.includes('contract'))return {dimension:finance?'payment_commitment':'confirmation',resolution:'Nội dung gắn kết chưa thành cam kết rõ; cần thống nhất phạm vi và trách nhiệm trước bước thực hiện.'};
  return {dimension:finance?'cash_realization':'realization',resolution:'Đường mở còn cần một bước thực hiện cụ thể; sự hiện diện của cơ hội chưa xác nhận kết quả cuối.'};
}
export function resolveContradictions(bundle,context) {
  const d=domainSemantics(context.domain),has=code=>bundle.states.some(s=>s.code===code),conflicts=[];
  const finance=context.domain==='finance',execution=finance?'payment_processing':'execution';
  const add=(code,support,blocker,dominant,resolution,dimension,effect,severity='medium',actorIds=bundle.actorIds)=>conflicts.push({
    id:`${bundle.id}_${code}_${actorIds.join('_')}`,code,support,blocker,dominant,resolution,actorIds,
    affectedDimension:dimension,affectedDimensions:[dimension,...(['cash_realization','realization','payment_processing'].includes(dimension)?['completion']:[])],
    effect,severity,evidenceIds:[`p${bundle.palace}`,`c${bundle.palace}`,...(['reversal','persistence'].includes(code)?['patterns']:[])],
    context:{domain:context.domain,stageAsked:context.outcomeTarget?.stageAsked||null,door:bundle.symbols.door.id,star:bundle.symbols.star.id,deity:bundle.symbols.deity.id,relationshipIds:bundle.relationshipIds}});
  const opening=['kai','sheng','xiu'].includes(bundle.symbols.door.id);
  if(has('void')){
    const roles=bundle.actorIds.filter(id=>['self','event','money','capital','contract','payment','opportunity'].includes(id));
    const seen=new Set();
    for(const id of roles.length?roles:[bundle.actorIds[0]]){
      const v=voidResolution({...bundle,actorIds:[id]},context),key=v.dimension+v.resolution;
      if(seen.has(key))continue;seen.add(key);
      add(opening?'opening_unrealized':'unconfirmed_state',opening?d.opportunity:'Khả năng chưa thành hình chắc',
        'Tuần Không giới hạn mức thành thực, không phủ định tự động cơ hội hoặc phát sinh','realization_condition',v.resolution,v.dimension,'not_yet_realized','high',[id]);
    }
  }
  if(has('door_pressure'))add('action_environment_mismatch',d.opportunity,'Môn khắc cung: cách triển khai gặp sức cản của hoàn cảnh','execution_condition',
    `Điều chỉnh cách làm cho phù hợp ${d.vocabulary[0]}; thử một bước nhỏ trước khi tăng quy mô.`,execution,'obstruction','high');
  for(const state of bundle.states.filter(s=>['tomb','punishment'].includes(s.code)))add(state.code,'Năng lực của vai đang xét',
    state.code==='tomb'?'Can đại diện Tam kỳ nhập mộ: khả năng bị giữ lại':'Can đại diện kích hình: cách triển khai có ràng buộc',
    'actor_specific_condition',state.code==='tomb'?'Giải phóng phần nguồn lực đang bị giữ ở vai này trước khi giao thêm việc.':'Sửa phạm vi hoặc cách thực hiện đang tạo sức ép cho vai này.',
    execution,'obstruction','high',state.actorIds);
  if(has('fan_yin'))add('reversal',opening?d.opportunity:'Khả năng thay đổi hiện trạng','Phản ngâm: có thể quay lại bước trước','decision_stability',
    `Giữ phương án điều chỉnh khi ${d.agreement} thay đổi; chỉ chuyển bước với thông tin còn nhất quán.`,finance?'payment_commitment':'confirmation','instability');
  if(has('fu_yin'))add('persistence','Khả năng duy trì và làm chắc việc đang có','Phục ngâm: khó suy ngay thành bước đột phá','activation_condition',
    `Thay đổi một điều kiện của ${d.vocabulary[0]} để thử khả năng chuyển bước.`,execution,'needs_activation');
  if(has('horse')&&(has('void')||has('fu_yin')))add('movement_held',d.movement,'Có tượng động nhưng khả năng triển khai còn bị giữ','realization_condition',
    'Chọn một thay đổi nằm trong khả năng của vai này, theo dõi tác dụng của bước thử trước khi mở rộng.',execution,'conditional_activation');
  return conflicts;
}
