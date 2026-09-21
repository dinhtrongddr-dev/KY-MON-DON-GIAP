import {steps,finish,roleState,relationOf} from './shared.mjs';
export function strategy(a) {
  const self=roleState(a,'self'),other=roleState(a,'customer'),link=relationOf(a,'self','customer'),frame=a.roleProfile?.hostGuest;
  const selfAgency=a.roleProfile?.roles?.find(r=>r.id==='self')?.agencyBand;
  const action=self.friction.length||selfAgency==='constrained'?'prepare_and_verify':link?.kind==='controlled_by'?'reduce_exposure':frame?.timeBias==='host_later_response'&&frame?.questionPosture!=='initiator'?'hold_then_respond':'small_reversible_step';
  return finish('strategy',a,steps('strategy',[
    ['self','Thế của ta',['self'],'Nguồn lực thực tế trước khi chọn tiến/lui.'],
    ['other','Thế đối phương',['customer'],'Chưa xác định đại diện thì không khẳng định họ yếu/mạnh.'],
    ['advantage','Lợi thế',['self','opportunity'],'Lợi thế nào có thể chuyển thành hành động cụ thể?'],
    ['risk','Bất lợi',['self','customer'],'Chi phí, áp lực và điều kiện chưa kiểm chứng.'],
    ['opening','Điểm phá cục',['opportunity','contract'],'Chọn một khâu có thể thử với rủi ro thấp.'],
    ['action','Hành động đề xuất',['self','event'],action==='prepare_and_verify'?'Ưu tiên gỡ điều kiện chưa rõ rồi mới mở rộng cam kết.':action==='hold_then_respond'?'Giữ thế, chờ tín hiệu đủ rõ rồi đáp ứng bằng một bước nhỏ có thể đảo ngược.':'Ưu tiên bước thử nhỏ, có điểm dừng và cách đo phản hồi.'],
    ['avoid','Điều cần tránh',['self'],'Không ra quyết định không thể đảo ngược chỉ từ tượng.'],
    ['timing','Thời điểm hành động',['event'],'Điều kiện kích hoạt hành động, không bịa lịch ứng nghiệm.'],
  ]),{initiative:action,roleFrame:frame,selfAgency,selfOther:link,advantages:self.support,disadvantages:self.friction,
    comparison:other.status==='unresolved'?'counterparty_unknown':'symbolic_positions_only',
    options:[{id:'act',requires:'Đủ dữ kiện, bước nhỏ có thể dừng.'},{id:'wait',requires:'Có thời hạn chờ và nguồn xác nhận, không chờ vô hạn.'}]});
}
