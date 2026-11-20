import {steps,finish,roleState,relationOf} from './shared.mjs';
import {computeWarfare} from './warfare.mjs';
export function strategy(a) {
  const self=roleState(a,'self'),other=roleState(a,'customer'),link=relationOf(a,'self','customer'),frame=a.roleProfile?.hostGuest;
  const selfAgency=a.roleProfile?.roles?.find(r=>r.id==='self')?.agencyBand;
  // TG-CB-7.0 (P6): offensive, alliance and retreat branches come from the warfare model;
  // the former defensive-only choice remains the fallback when the self role is unresolved.
  const warfare=computeWarfare(a,{focus:'strategy'});
  const legacy=self.friction.length||selfAgency==='constrained'?'prepare_and_verify':link?.kind==='controlled_by'?'reduce_exposure':frame?.timeBias==='host_later_response'&&frame?.questionPosture!=='initiator'?'hold_then_respond':'small_reversible_step';
  // A void (not yet real) or constrained self cannot carry an offensive plan: keep the preparatory branch.
  const useWarfare=!!warfare.sides.self&&!warfare.sides.self.harms.includes('void')&&selfAgency!=='constrained';
  const action=useWarfare?warfare.action.branch:legacy;
  const actionText=useWarfare?`${warfare.action.label}: ${warfare.action.summary}${warfare.action.orientation?' '+warfare.action.orientation:''}${warfare.action.hours.length?' Giờ dùng: '+warfare.action.hours.join(', ')+'.':''}`:
    legacy==='prepare_and_verify'?'Ưu tiên gỡ điều kiện chưa rõ rồi mới mở rộng cam kết.':legacy==='hold_then_respond'?'Giữ thế, chờ tín hiệu đủ rõ rồi đáp ứng bằng một bước nhỏ có thể đảo ngược.':'Ưu tiên bước thử nhỏ, có điểm dừng và cách đo phản hồi.';
  return finish('strategy',a,steps('strategy',[
    ['self','Thế của ta',['self'],'Nguồn lực thực tế trước khi chọn tiến/lui.'],
    ['other','Thế đối phương',['customer'],'Chưa xác định đại diện thì không khẳng định họ yếu/mạnh.'],
    ['advantage','Lợi thế',['self','opportunity'],'Lợi thế nào có thể chuyển thành hành động cụ thể?'],
    ['risk','Bất lợi',['self','customer'],'Chi phí, áp lực và điều kiện chưa kiểm chứng.'],
    ['opening','Điểm phá cục',['opportunity','contract'],'Chọn một khâu có thể thử với rủi ro thấp.'],
    ['action','Hành động đề xuất',['self','event'],actionText],
    ['avoid','Điều cần tránh',['self'],warfare.action.branch==='attack'?'Không dàn mỏng lực; không đánh vào hướng đối thủ đang vượng.':warfare.action.branch==='strategic_retreat'?'Không cố giữ mặt trận đang thua; không dồn thêm vốn vào chỗ bị khắc.':'Không ra quyết định không thể đảo ngược chỉ từ tượng.'],
    ['timing','Thời điểm hành động',['event'],warfare.initiative==='move_first'?'Khách lợi: ra tay trước.':warfare.initiative==='move_second'?'Chủ lợi: để đối phương động trước rồi ứng.':'Điều kiện kích hoạt hành động, không bịa lịch ứng nghiệm.'],
  ]),{initiative:action,roleFrame:frame,selfAgency,selfOther:link,advantages:self.support,disadvantages:self.friction,
    comparison:other.status==='unresolved'?'counterparty_unknown':'symbolic_positions_only',
    warfare,
    options:warfare.ranking.filter(r=>r.score>0).slice(0,3).map(r=>({id:r.id,score:r.score}))});
}
