import {steps,finish} from './shared.mjs';
import {normalizeAction,ACTIONS,actionMetrics,rankCandidates,RANK_CONVENTION} from './actionRules.mjs';
import {directionMarkersForPalace} from '../analysis/directionEngine.mjs';
export function direction(a,{action='general',direction=null}={}) {
  action=normalizeAction(action);
  const ranking=direction?.origin&&direction?.kind?rankCandidates(a.palaces.map(p=>({id:`direction_${p.number}`,palace:p.number,label:`${p.direction} · ${p.vi} ${p.number}`,...actionMetrics(p,action),directionMarkers:directionMarkersForPalace(a.directions,p.number)}))):[];
  return finish('direction',a,steps('direction',[
    ['goal','Mục tiêu và điểm xuất phát',['self','event'],'Người hỏi xác nhận điểm xuất phát, khả năng di chuyển và mục tiêu.'],
    ['favorable','Hướng thuận tương đối',['self',...ACTIONS[action].roles],'Đọc nhóm xếp đầu với các điều kiện thực địa.'],
    ['adverse','Hướng cần dè chừng',['self',...ACTIONS[action].roles],'Chỉ rõ điều kiện cản, không gọi một hướng luôn xấu.'],
    ['action','Cách dùng phương vị',['self','event'],'Chỉ hành động khi phù hợp thực tế và an toàn; không tự suy vị trí khách hàng.'],
  ]),{action,ranking,convention:RANK_CONVENTION,origin:direction?.origin||null,kind:direction?.kind||null,reference:direction?.reference||null});
}
