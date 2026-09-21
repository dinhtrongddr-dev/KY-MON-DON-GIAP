import {validateBoard,freezeData} from '../schemas/board.mjs';
import {validateAnalysis} from '../schemas/analysis.mjs';
import {palaceConditions,specialPatterns} from './specialPatterns.mjs';
import {seasonalStrength} from './strength.mjs';
import {palaceRelationships,elementLink} from './relationships.mjs';
import {usefulGods,normalizeActors} from './usefulGod.mjs';
import {resolveYongshenProfile} from './yongshenResolver.mjs';
import {analyzeStructures} from './structureEngine.mjs';
import {analyzeRoles} from './roleEngine.mjs';
import {analyzeKeying} from './keyingEngine.mjs';
import {analyzeFormations} from './formationEngine.mjs';
export function analyzeBoard(board,{topic='general',actors={},selfPillar=board.pillars.day,questionContext=null}={}) {
  validateBoard(board);
  const yongshenProfile=resolveYongshenProfile({topic,questionContext});
  const roles=usefulGods(board,topic,normalizeActors(actors),selfPillar,questionContext,yongshenProfile);
  const palaces=board.palaces.filter(p=>p.number!==5).map(p=>({...p,conditions:palaceConditions(p),strength:seasonalStrength(board,p),
    starDoor:elementLink(p.star.element,p.door.element),doorPalace:elementLink(p.door.element,p.element),
    stemPairs:p.heavenStems.map((s,i)=>({heaven:s,earth:p.earthStem,carried:i>0,relation:elementLink(s.element,p.earthStem.element),
      punishment:palaceConditions(p).punishment.includes(s.vi),wonderTomb:palaceConditions(p).wonderTombs.includes(s.vi)}))}));
  const structures=analyzeStructures(board,palaces,roles);
  const keying=analyzeKeying(board,palaces,roles);
  const formations=analyzeFormations(board,palaces,roles);
  const relations=palaceRelationships(board);
  const roleProfile=analyzeRoles(board,roles,palaces,structures,relations,questionContext);
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
    roles,yongshenProfile,palaces,structures,keying,formations,roleProfile,relations,patterns:specialPatterns(board),contradictions,
    hostGuest:{host:self.palace,guest:event.palace,...roleProfile.hostGuest,legacyReference:'host=self palace / guest=event palace chỉ giữ tương thích; KM-ROLE-2.0 dùng Chủ–Khách theo ngữ cảnh.'},
    coverage:{computed:['Nhật/Thời can và Giáp ẩn','KM-YONGSHEN-2.0 theo domain và thứ bậc Dụng Thần','KM-STRUCTURE-2.0: 81 Thập Can Khắc Ứng + Tứ hại + cách cục ưu tiên','KM-STRENGTH-2.0: Tinh/Môn/Can/Cung tách mô hình + Thập Nhị Trường Sinh','KM-ROLE-2.0: Chủ–Khách theo ngữ cảnh + Nội/Ngoại + agency + nhiều vai','KM-KEYING-3.0: 64 Môn×Môn + 72 Môn×Kỳ/Nghi + 24 Tam Kỳ đáo cung + 108 chỉ mục Cửu Tinh trị thời + Hòa/Nghĩa/Bức/Chế','KM-FORMATION-3.0: Tam Trá + Ngũ Giả + Cửu Độn + Thiên Tam Môn + Địa Tứ Hộ','64 quan hệ cung có chiều','Không/Mã','hai chiều Môn–Cung','kích hình từng can','Tam kỳ nhập mộ Ất→2/Bính→6/Đinh→8','các lớp phản/phục ngâm','Ứng kỳ v2: nhịp Nội/Ngoại + Không/Mã/Mộ','mâu thuẫn'],
      unsupported:['Nhập mộ các can ngoài Tam kỳ','Diễn giải hiện đại đầy đủ cho 108 Cửu Tinh trị thời (Phase 9 chỉ index classical_context_only)','Địa Tư Môn / Đình Đình–Bạch Gian / Tam Thắng Cung–Ngũ Bất Kích','Ứng kỳ bằng Hình/Can/Môn hoặc Phản/Phục ngâm định ngày','Phi Bàn / Cửu Thần','Tâm ý hoặc quyền quyết định thực tế khi chưa được xác nhận']}}));
}
