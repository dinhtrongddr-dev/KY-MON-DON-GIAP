import {locateStem,locateRef,TOPICS} from '../../guide.mjs';
import {pillarFromGanzhi} from '../core/calendar.mjs';
const ACTOR_KEYS=['customer','competitor','decisionMaker'];
export function normalizeActors(raw={}) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!ACTOR_KEYS.includes(k)))throw new Error('Đại diện bổ sung không hợp lệ.');
  if(Object.values(raw).some(v=>typeof v!=='string'))throw new Error('Can Chi đại diện phải là chuỗi hợp lệ.');
  return Object.fromEntries(ACTOR_KEYS.filter(k=>raw[k]).map(k=>[k,pillarFromGanzhi(raw[k]).han]));
}
export function usefulGods(board,topic='general',actors={},selfPillar=board.pillars.day) {
  const stemRole=(id,label,pillar,status='convention')=>{
    const found=locateStem(board,pillar);return {id,label,palace:found.palace.number,stem:found.effective,status,basis:pillar.han,evidenceId:`actor_${id}`};
  };
  const roles=[stemRole('self','Ta / người hỏi (khi hỏi việc của mình)',selfPillar),stemRole('event','Sự việc',board.pillars.hour)];
  const refs=[['opportunity','Cơ hội mở việc',['door','kai']],['quote','Hồ sơ / báo giá',['door','jing']],
    ['money','Lợi ích / dòng tiền',['door','sheng']],['capital','Vốn bỏ ra',['stem','戊']],
    ['contract','Thỏa thuận / hợp đồng',['spirit','harmony']],['authority','Đầu mối quyền quyết định (biểu tượng)',['spirit','chief']]];
  for(const [id,label,ref] of refs)roles.push({id,label,palace:locateRef(board,ref).number,status:'proxy',basis:ref.join(':'),evidenceId:`actor_${id}`});
  roles.push({...roles[1],id:'service',label:'Sản phẩm / dịch vụ đang hỏi',status:'proxy',evidenceId:'actor_service'});
  for(const [id,label] of [['customer','Khách hàng / đối phương'],['competitor','Đối thủ'],['decisionMaker','Người có quyền duyệt']]) {
    roles.push(actors[id]?stemRole(id,label,pillarFromGanzhi(actors[id]),'user_supplied'):
      {id,label,palace:null,status:'unresolved',basis:'Chưa cung cấp Can Chi đại diện; không tự gán một người từ một sao/thần.',evidenceId:`actor_${id}`});
  }
  for(const [i,ref] of (TOPICS.find(t=>t.id===topic)?.refs||[]).entries())roles.push({id:`topic_${i}`,label:`Dụng thần chuyên đề ${i+1}`,palace:locateRef(board,ref).number,status:'convention',basis:ref.join(':'),evidenceId:`actor_topic_${i}`});
  return roles;
}
