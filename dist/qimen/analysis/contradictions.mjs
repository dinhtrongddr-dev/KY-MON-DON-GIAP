import {domainSemantics} from '../modes/semantics.mjs';
export function resolveContradictions(bundle,context) {
  const d=domainSemantics(context.domain),has=code=>bundle.states.some(s=>s.code===code),conflicts=[];
  const add=(code,support,blocker,dominant,resolution,actorIds=bundle.actorIds)=>conflicts.push({code,support,blocker,dominant,resolution,actorIds});
  const opening=['kai','sheng','xiu'].includes(bundle.symbols.door.id);
  if(has('void'))add(opening?'opening_unrealized':'unconfirmed_state',opening?d.opportunity:'Tượng mô tả một khả năng chưa được xác nhận',
    'Tuần Không: chưa thể đồng nhất hình tượng với kết quả thực','realization_condition',`Cần một xác nhận quan sát được về ${d.agreement}; phân biệt quan tâm, trao đổi và cam kết thực.`);
  if(has('door_pressure'))add('action_environment_mismatch',d.opportunity,'Môn khắc cung: cách triển khai gặp sức cản của hoàn cảnh','execution_condition',
    `Đối chiếu cách thực hiện với ${d.vocabulary.slice(0,3).join(', ')}; thay khâu không phù hợp trước khi tăng cam kết.`);
  for(const state of bundle.states.filter(s=>['tomb','punishment'].includes(s.code)))add(state.code,
    'Năng lực hoặc ý định của vai đang xét',state.code==='tomb'?'Can đại diện Tam kỳ nhập mộ: khả năng bị giữ lại':'Can đại diện kích hình: cách triển khai có ràng buộc',
    'actor_specific_condition','Kiểm tra nguồn lực, phạm vi trách nhiệm và điều kiện khiến vai này chưa thực hiện được việc.',state.actorIds);
  if(has('fan_yin'))add('reversal',opening?d.opportunity:'Có khả năng thay đổi hiện trạng','Phản ngâm ở lớp đã tính: diễn biến có thể quay lại bước trước','decision_stability',
    `Xác nhận lại ${d.agreement} sau lần điều chỉnh; phản hồi ban đầu chưa phải quyết định cuối.`);
  if(has('fu_yin'))add('persistence','Khả năng duy trì hoặc làm chắc việc đang có','Phục ngâm ở lớp đã tính: khó suy ngay thành một bước đột phá','activation_condition',
    `Cần thay đổi một điều kiện cụ thể của ${d.vocabulary[0]} và quan sát phản hồi; không chờ vô thời hạn.`);
  if(has('horse')&&(has('void')||has('fu_yin')))add('movement_held',d.movement,'Có tượng động nhưng điều kiện thực hiện chưa rõ','realization_condition',
    'Xác nhận đầu mối, mục đích và điều kiện của bước di chuyển hoặc thay đổi trước khi coi đó là tiến triển.');
  return conflicts;
}
