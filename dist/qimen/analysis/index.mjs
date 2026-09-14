import {validateBoard,freezeData} from '../schemas/board.mjs';
import {validateAnalysis} from '../schemas/analysis.mjs';
import {palaceConditions,specialPatterns} from './specialPatterns.mjs';
import {seasonalStrength} from './strength.mjs';
import {palaceRelationships,elementLink} from './relationships.mjs';
import {usefulGods,normalizeActors} from './usefulGod.mjs';
export function analyzeBoard(board,{topic='general',actors={},selfPillar=board.pillars.day,questionContext=null}={}) {
  validateBoard(board);
  const roles=usefulGods(board,topic,normalizeActors(actors),selfPillar,questionContext);
  const palaces=board.palaces.filter(p=>p.number!==5).map(p=>({...p,conditions:palaceConditions(p),strength:seasonalStrength(board,p),
    starDoor:elementLink(p.star.element,p.door.element),doorPalace:elementLink(p.door.element,p.element),
    stemPairs:p.heavenStems.map((s,i)=>({heaven:s,earth:p.earthStem,carried:i>0,relation:elementLink(s.element,p.earthStem.element),
      punishment:palaceConditions(p).punishment.includes(s.vi),wonderTomb:palaceConditions(p).wonderTombs.includes(s.vi)}))}));
  const contradictions=[];
  for(const p of palaces) {
    const add=(kind,text)=>contradictions.push({id:`conflict_${p.number}_${kind}`,palace:p.number,kind,text});
    const opening=['kai','sheng','xiu'].includes(p.door.id);
    if(opening&&(p.voided||p.conditions.doorPressure))add('opening_blocked','Có cửa thuận theo quy ước nhưng gặp Không hoặc Môn bức; chưa thể kết luận cơ hội thành hiện thực.');
    if(p.horse&&(board.fuYin||p.voided))add('movement_held','Có dấu hiệu động đồng thời có điều kiện giữ/chậm; Mã không tự bảo đảm có tin hay có kết quả.');
    if(opening&&board.fanYin)add('opening_reversal','Cửa mở việc đi cùng phản ngâm; cần phân biệt tiến thêm một bước với quyết định cuối.');
  }
  const self=roles.find(r=>r.id==='self'),event=roles.find(r=>r.id==='event');
  return freezeData(validateAnalysis({schemaVersion:'QimenAnalysis/1',boardVersion:board.schemaVersion,
    roles,palaces,relations:palaceRelationships(board),patterns:specialPatterns(board),contradictions,
    hostGuest:{host:self.palace,guest:event.palace,convention:'Cung ta–sự việc là trục tham khảo; không mặc định sự việc là đối phương. Chủ tĩnh / khách động là cách chọn hành động, không phải danh tính khách hàng.'},
    coverage:{computed:['Nhật/Thời can và Giáp ẩn','dụng thần','64 quan hệ cung có chiều','Tinh vượng suy theo tháng tiết khí','Không/Mã','Môn bức','kích hình từng can','Tam kỳ nhập mộ','các lớp phản/phục ngâm','tổ hợp can đã khai báo','mâu thuẫn'],
      unsupported:['Nhập mộ các can ngoài Tam kỳ','Thập can khắc ứng đầy đủ','Phép ứng kỳ định ngày chắc chắn','Phi Bàn / Cửu Thần','Tâm ý hoặc quyền quyết định thực tế khi chưa được xác nhận']}}));
}
