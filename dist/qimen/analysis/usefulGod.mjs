import {locateStem,locateRef,TOPICS} from '../../guide.mjs';
import {pillarFromGanzhi} from '../core/calendar.mjs';
import {TOPIC_DOMAINS,semanticRoles} from '../modes/semantics.mjs';
import {selectionProvenance} from './ruleRegistry.mjs';
import {relevantActorIds} from './actorRelevance.mjs';
import {resolveYongshenProfile,yongshenMeta} from './yongshenResolver.mjs';
const ACTOR_KEYS=['customer','competitor','decisionMaker'];
export function normalizeActors(raw={}) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!ACTOR_KEYS.includes(k)))throw new Error('Đại diện bổ sung không hợp lệ.');
  if(Object.values(raw).some(v=>typeof v!=='string'))throw new Error('Can Chi đại diện phải là chuỗi hợp lệ.');
  return Object.fromEntries(ACTOR_KEYS.filter(k=>raw[k]).map(k=>[k,pillarFromGanzhi(raw[k]).han]));
}
export function usefulGods(board,topic='general',actors={},selfPillar=board.pillars.day,questionContext=null,yongshenProfile=null) {
  const profile=yongshenProfile||resolveYongshenProfile({topic,questionContext});
  const stemRole=(id,label,pillar,status='convention')=>{
    const found=locateStem(board,pillar);return {id,label,palace:found.palace.number,stem:found.effective,status,basis:pillar.han,evidenceId:`actor_${id}`};
  };
  const roles=[stemRole('self','Ta / người hỏi (khi hỏi việc của mình)',selfPillar),stemRole('event','Sự việc',board.pillars.hour)];
  if(questionContext?.subject.kind==='on_behalf'){
    if(questionContext.subject.mapping){roles[0].label=questionContext.subject.text;roles[0].status='user_supplied';}
    else{roles[0].palace=null;roles[0].stem=null;roles[0].status='unresolved';roles[0].basis='Chưa xác nhận Can Chi đại diện người được hỏi thay.';}
  }
  const refs=[['opportunity','Cơ hội mở việc',['door','kai']],['quote','Hồ sơ / báo giá',['door','jing']],
    ['money','Lợi ích / dòng tiền',['door','sheng']],['capital','Vốn bỏ ra',['stem','戊']],
    ['contract','Thỏa thuận / hợp đồng',['spirit','harmony']],['authority','Đầu mối quyền quyết định (biểu tượng)',['spirit','chief']]];
  for(const [id,label,ref] of refs)roles.push({id,label,palace:locateRef(board,ref).number,stem:ref[0]==='stem'?ref[1]:null,status:'proxy',basis:ref.join(':'),evidenceId:`actor_${id}`});
  roles.push({...roles[1],id:'service',label:'Sản phẩm / dịch vụ đang hỏi',status:'proxy',evidenceId:'actor_service'});
  const domain=questionContext?.domain||TOPIC_DOMAINS[topic]||'general';
  const customerLabel={business:'Khách hàng / đối tác',relationship:'Người yêu / phía quan hệ',family:'Vợ/chồng / người thân được nhắc tới',legal:'Đối phương / bên liên quan',social:'Người liên hệ / phía liên quan',recruitment:'Ứng viên / phía tuyển dụng'}[domain]||'Phía liên quan';
  for(const [id,label] of [['customer',customerLabel],['competitor','Đối thủ / bên cạnh tranh'],['decisionMaker','Người có quyền duyệt']]) {
    roles.push(actors[id]?stemRole(id,label,pillarFromGanzhi(actors[id]),'user_supplied'):
      {id,label,palace:null,status:'unresolved',basis:'Chưa cung cấp Can Chi đại diện; không tự gán một người từ một sao/thần.',evidenceId:`actor_${id}`});
  }
  for(const [i,ref] of (TOPICS.find(t=>t.id===topic)?.refs||[]).entries())roles.push({id:`topic_${i}`,label:`Dụng thần chuyên đề ${i+1}`,palace:locateRef(board,ref).number,status:'convention',basis:ref.join(':'),evidenceId:`actor_topic_${i}`});
  roles.push({id:'execution',label:'Khâu thực hiện',palace:board.zhiShi.palace,status:'proxy',basis:'Trực Sử (Môn)',evidenceId:'actor_execution'});
  roles.push({...roles.find(r=>r.id==='execution'),id:'payment',label:'Khâu xử lý thanh toán',evidenceId:'actor_payment'});
  const moving=board.palaces.find(p=>p.horse);
  roles.push({id:'movement',label:'Dấu hiệu thay đổi',palace:moving?.number??null,status:moving?'proxy':'unresolved',basis:'Dịch Mã theo chi giờ',evidenceId:'actor_movement'});
  for(const spec of profile.extras){
    if(spec.pillar){
      const pillar=board.pillars[spec.pillar],found=locateStem(board,pillar);
      roles.push({id:spec.id,label:spec.label,palace:found.palace.number,stem:found.effective,status:'resolver',
        basis:`KM-YONGSHEN-2.0:pillar:${spec.pillar}:${pillar.han}`,evidenceId:`actor_${spec.id}`});
      continue;
    }
    const found=locateRef(board,spec.ref);
    roles.push({id:spec.id,label:spec.label,palace:found?.number??null,stem:spec.ref[0]==='stem'?spec.ref[1]:null,
      status:found?'resolver':'unresolved',basis:`KM-YONGSHEN-2.0:${spec.ref.join(':')}`,evidenceId:`actor_${spec.id}`});
  }
  const meanings=semanticRoles(questionContext?.domain||TOPIC_DOMAINS[topic]);
  const enrichedRoles=roles.map(r=>({...r,...(yongshenMeta(profile,r.id)||{})}));
  const active=new Set(relevantActorIds(questionContext,enrichedRoles));
  return enrichedRoles.map(r=>({...r,...selectionProvenance(r),actorId:r.id,role:meanings[r.id]||r.label,source:r.basis,stem:r.stem||null,
    evidenceIds:[r.evidenceId,...(r.palace?[`p${r.palace}`]:[])],confidenceLevel:r.status==='unresolved'?'unresolved':r.status==='user_supplied'?'user_supplied':'convention',
    relevance:active.has(r.id)?(['self','event','money'].includes(r.id)?1:r.yongshenWeight||0.7):0,
    semanticRole:meanings[r.id]||r.label,provenance:r.status==='user_supplied'?'user_mapping':r.status==='unresolved'?'unknown':r.resolverVersion?'yongshen_resolver':'interpretation_convention'}));
}
