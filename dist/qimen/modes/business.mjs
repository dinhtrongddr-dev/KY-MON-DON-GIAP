import {steps,finish,roleState,relationOf} from './shared.mjs';
export function business(a) {
  const ids=['self','customer','decisionMaker','service','quote','money','competitor','contract','opportunity'];
  const pipeline=ids.map(id=>roleState(a,id));
  const check=(id,dimension,question)=>({dimension,role:id,signals:roleState(a,id).friction,question});
  const bottlenecks=[
    check('quote','scope_and_price','Giá và phạm vi đã được đối chiếu cùng tiêu chuẩn chưa?'),
    check('contract','procedure','Còn điều khoản, chứng từ hay bước phê duyệt nào?'),
    check('money','cashflow','Đây là doanh thu kỳ vọng hay tiền thực thu; điều kiện thanh toán là gì?'),
    check('customer','relationship','Ai đang phản hồi và nhu cầu nào đã được xác nhận?'),
    check('decisionMaker','authority','Người trao đổi có quyền duyệt hay chỉ chuyển hồ sơ?'),
  ];
  const chain=steps('business',[
    ['self','Bên mình',['self'],'Nguồn lực, năng lực thực hiện và giới hạn cam kết.'],
    ['customer','Khách hàng',['customer'],'Thế biểu tượng nếu có đại diện; không đoán ý định khi chưa có.'],
    ['decision','Người quyết định',['decisionMaker','authority'],'Tách người liên hệ, biểu tượng quyền lực và người có thẩm quyền thật.'],
    ['service','Sản phẩm / dịch vụ',['service'],'Gắn với việc cụ thể người hỏi đã kể.'],
    ['quote','Báo giá',['quote','capital'],'Tách phạm vi, đơn giá và tổng chi phí.'],
    ['money','Tiền',['money','capital'],'Tách vốn, lợi nhuận, điều kiện thanh toán và tiền về.'],
    ['competitor','Đối thủ',['competitor'],'Không có đại diện thì chưa thể xếp mạnh/yếu.'],
    ['contract','Hợp đồng',['contract','quote'],'Từ đồng ý miệng sang điều khoản được xác nhận.'],
    ['result','Khả năng chốt và bước tiếp',['opportunity','contract','customer'],'Phản hồi → làm rõ → duyệt → ký là các mốc khác nhau, không tự coi đã đạt.'],
  ]);
  return finish('business',a,chain,{pipeline,bottlenecks,initiative:relationOf(a,'self','customer'),
    priceIssueConfirmed:false,competitorComparison:roleState(a,'competitor').status==='unresolved'?'unresolved':'compare_symbolic_positions',
    closing:{status:'requires_real_world_confirmation',gates:['Phạm vi','Người duyệt','Điều khoản','Xác nhận ký']}});
}
