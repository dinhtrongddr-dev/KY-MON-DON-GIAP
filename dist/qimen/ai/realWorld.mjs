import {domainSemantics} from '../modes/semantics.mjs';
const DOORS={kai:'access',xiu:'contact',sheng:'growth',shang:'active_friction',du:'contained_work',jing:'presentation',si:'closure',fear:'communication_pressure'};
const STARS={peng:'resource_flow',ren:'stability',chong:'activation',fu:'expertise',ying:'visibility',rui:'repair',zhu:'expression',xin:'planning',qin:'coordination'};
const DEITIES={chief:'authority',snake:'ambiguity',moon:'discretion',harmony:'coordination',tiger:'pressure',tortoise:'information_gap',earth9:'consolidation',heaven9:'expansion'};
const CAPACITY={resource_flow:'kiểm tra nguồn lực và phần thông tin chưa công khai',stability:'chứng minh khả năng làm ổn định',activation:'tạo một bước tiếp xúc hoặc thực hiện',expertise:'thể hiện năng lực, hồ sơ và cách làm',visibility:'làm rõ tiêu chuẩn và cách trình bày',repair:'xác định điểm cần sửa hoặc bổ sung',expression:'làm rõ điều đang được nói hoặc tranh luận',planning:'đưa phương án có thể kiểm tra',coordination:'làm rõ vai trò phối hợp'};
const SOCIAL={authority:'xác minh người có quyền chấp thuận',ambiguity:'kiểm chứng giả định và tránh hứa vượt dữ kiện',discretion:'chọn cách trao đổi phù hợp với thông tin nhạy cảm',coordination:'xác nhận trách nhiệm và cam kết của từng phía',pressure:'làm rõ giới hạn, tiêu chuẩn và phần không thể nhượng',information_gap:'đối chiếu thông tin từ nguồn trực tiếp',consolidation:'chia bước chắc chắn, theo dõi điều kiện đang giữ',expansion:'kiểm tra quy mô thực hiện trước khi mở rộng'};
export function translateToRealWorld(bundle,context) {
  const d=domainSemantics(context.domain),core=DOORS[bundle.symbols.door.id],capacity=STARS[bundle.symbols.star.id],social=DEITIES[bundle.symbols.deity.id];
  const conditional=bundle.conflicts.some(c=>c.code==='opening_unrealized');
  const objective={access:d.opportunity,contact:'khả năng trao đổi và làm rõ nhu cầu',growth:d.value,active_friction:'khâu cần tác động, sửa hoặc cạnh tranh',contained_work:'phần việc cần làm rõ bên trong',presentation:'thông tin, hồ sơ hoặc cách trình bày',closure:'khâu kết thúc, giữ lại hoặc xử lý việc cũ',communication_pressure:'thông tin gây sức ép hoặc cần làm rõ'}[core];
  const mechanism=conditional?'conditional_access':core;
  const modifiers=bundle.conflicts.map(c=>({code:c.code,dominant:c.dominant,resolution:c.resolution,actorIds:c.actorIds}));
  return {mechanism,domain:context.domain,objective,capacity,social,
    interaction:{opening:objective,means:CAPACITY[capacity],counterpartCondition:SOCIAL[social],modifiers},
    roleContexts:bundle.roles.map(r=>({role:r.id,meaning:r.meaning,status:r.status})),
    manifestation:{status:'hypothesis_to_verify',concepts:[objective,CAPACITY[capacity],SOCIAL[social]],vocabulary:context.vocabulary.slice(0,12)},
    implication:conditional?'Cơ hội biểu tượng cần một điều kiện thực hóa; chưa đủ để nói mục tiêu đã đạt.':
      ['closure','contained_work'].includes(core)?'Cần phân biệt việc đang được giữ / xử lý bên trong với việc đã kết thúc thực tế.':'Cách tiếp cận phải kết hợp năng lực thực hiện, phía liên quan và các điều kiện cản.',
    action:{verb:conditional?'verify_then_activate':core==='communication_pressure'?'clarify_before_commit':core==='closure'?'check_status_before_reopen':'test_next_step',
      focus:CAPACITY[capacity],counterpartCheck:SOCIAL[social],object:objective,
      completionEvidence:conditional?`Một xác nhận thực tế về ${d.agreement}`:`Một phản hồi hoặc kết quả kiểm tra về ${d.vocabulary[0]}`},
    caution:context.domain==='health'?'Không suy bệnh hoặc thay hướng dẫn y tế từ tượng.':context.domain==='finance'?'Không suy giá, lợi nhuận hoặc lệnh mua bán từ tượng.':context.domain==='legal'?'Không suy phán quyết hoặc thay chứng cứ pháp lý từ tượng.':'Không biến cách dịch tượng thành thông tin đã biết về người khác.'};
}
