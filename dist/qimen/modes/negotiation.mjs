import {steps,finish,roleState,relationOf} from './shared.mjs';
import {computeWarfare} from './warfare.mjs';
export function negotiation(a) {
  const self=roleState(a,'self'),other=roleState(a,'customer'),link=relationOf(a,'self','customer');
  const warfare=computeWarfare(a,{focus:'negotiation'});
  // TG-CB-7.0 (P6): a clear upper hand allows pressing on price; retreat maps to walk-away.
  const legacyPosture=!link?'discover_authority_and_needs':link.kind==='controlled_by'?'protect_walkaway':self.friction.length?'clarify_before_conceding':'exchange_conditional_concessions';
  // Without a located counterparty, discovering needs and authority stays first.
  const posture=!link?(warfare.action.branch==='alliance'?'bring_intermediary':legacyPosture):
    warfare.action.branch==='squeeze_price'&&!self.friction.length?'press_terms':warfare.action.branch==='strategic_retreat'?'protect_walkaway':warfare.action.branch==='alliance'?'bring_intermediary':legacyPosture;
  return finish('negotiation',a,steps('negotiation',[
    ['self','Ta',['self'],'Mục tiêu và giới hạn của người hỏi.'],
    ['other','Đối phương',['customer'],'Những gì đã biết, chưa biết và cần hỏi trực tiếp.'],
    ['goals','Mục tiêu hai bên',['event','customer'],'Không mặc định hai bên đều chỉ muốn giảm giá.'],
    ['power','Quyền lực',['decisionMaker','authority','self'],'Phân biệt sức ép với thẩm quyền thực tế.'],
    ['weakness','Điểm yếu',['self','customer'],'Nêu rủi ro của mình trước; không suy bí mật đối phương.'],
    ['give','Điểm có thể nhượng',['quote','service'],'Chỉ nhượng có điều kiện đổi lại, do người hỏi xác nhận giới hạn.'],
    ['hold','Điểm không nên nhượng',['capital','contract'],'Không đoán giá sàn; bảo vệ khả năng thực hiện, chứng từ và điều khoản thiết yếu.'],
    ['tactic','Chiến thuật',['self','contract'],posture==='press_terms'?'Ta đang có thế: giữ giá, đưa điều kiện của mình trước, chỉ nhượng khi đối phương trả lại điều kiện tương xứng.':
      posture==='bring_intermediary'?'Dùng trung gian / đối tác (Lục Hợp) để đàm phán thay vì đối đầu trực tiếp.':
      posture==='protect_walkaway'?'Thế đang bất lợi: chuẩn bị phương án rút, không nhượng thêm để giữ thương vụ.':
      posture==='discover_authority_and_needs'?'Hỏi rõ nhu cầu và người duyệt trước khi đề nghị đổi điều kiện.':'Đề nghị từng gói điều kiện, xác nhận đổi lại bằng văn bản.'],
    ['time','Thời điểm',['event'],'Chỉ chốt khi nhu cầu, thẩm quyền và giới hạn được làm rõ.'],
  ]),{posture,warfare,powerRelation:link,roleFrame:a.roleProfile?.hostGuest,selfAgency:a.roleProfile?.roles?.find(r=>r.id==='self')?.agencyBand,otherAgency:a.roleProfile?.roles?.find(r=>r.id==='customer')?.agencyBand,knownWeaknesses:self.friction,otherKnown:other.status!=='unresolved',
    concessions:{exchangeOnly:true,priceFloor:null,requires:['Chi phí thực','Phạm vi tối thiểu','Giới hạn người hỏi chấp nhận']},
    stopConditions:['Yêu cầu vượt khả năng thực hiện','Chưa xác nhận quyền duyệt','Nhượng bộ không có điều kiện đổi lại']});
}
