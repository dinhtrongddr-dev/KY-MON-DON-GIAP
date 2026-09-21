import {roleStrength} from './strength.mjs';

export const ROLE_VERSION='KM-ROLE-2.0';
export const ROLE_PROFILE='CLASSIC_CONTEXTUAL_HOST_GUEST';

export const INNER_PALACES=Object.freeze({
  yang:new Set([1,8,3,4]),
  yin:new Set([9,2,7,6]),
});

const GUEST_TIME_STEMS=new Set(['甲','乙','丙','丁','戊']);
const HOST_TIME_STEMS=new Set(['己','庚','辛','壬','癸']);

const normalize=value=>(value||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').replaceAll('đ','d').replaceAll('Đ','D').toLowerCase();

export function innerOuterZone(dun,palace){
  if(!palace||!INNER_PALACES[dun])return 'unknown';
  return INNER_PALACES[dun].has(palace)?'inner':'outer';
}

const zoneMeaning=zone=>zone==='inner'
  ?'Nội bàn: xu hướng gần, nhanh và nằm trong phạm vi trực tiếp hơn.'
  :zone==='outer'?'Ngoại bàn: xu hướng xa, chậm hoặc phụ thuộc phạm vi bên ngoài hơn.':'Chưa xác định nội/ngoại bàn.';

function questionPosture(context){
  const q=normalize(context?.question);
  const action='chu dong|lien he|goi|gui|de nghi|dam phan|thuong luong|thuyet phuc|gianh|ung tuyen|xin viec|mua|ban|dau tu|khoi dong|trien khai|chuyen viec|chuyen nha|di gap';
  const active=new RegExp(`\\b(?:toi|minh|chung toi)\\b.{0,28}\\b(?:${action})\\b|\\b(?:co nen|nen|can|muon)\\s+(?:${action})\\b`).test(q);
  const receive=/\b(nhan duoc|duoc moi|duoc de nghi|cho phan hoi|cho tra loi|ho lien he|ho goi|khach(?: hang)? (?:da )?lien he|khach(?: hang)? tim|ben kia chu dong)\b/.test(q);
  if(active&&receive)return 'mixed';
  if(active)return 'initiator';
  if(receive)return 'receiver';
  return 'undetermined';
}

function partyOf(role){
  if(role.id==='self')return 'self';
  if(role.id==='event'||role.id==='service')return 'matter';
  if(['decisionMaker','authority'].includes(role.id))return 'authority';
  if(role.id==='competitor')return 'competitor';
  if(role.yongshenTier==='counterpart'||role.id==='customer')return 'counterpart';
  if(['money','capital','property_asset','property_ground'].includes(role.id))return 'resource';
  if(['execution','payment','movement'].includes(role.id))return 'operational';
  if(role.id.startsWith('family_'))return 'family';
  return 'supporting';
}

export function hostGuestFrame(board,context,roles){
  const stem=board?.pillars?.hour?.stem?.han;
  const timeBias=GUEST_TIME_STEMS.has(stem)?'guest_first_move':HOST_TIME_STEMS.has(stem)?'host_later_response':'unknown';
  const posture=questionPosture(context);
  const counterpartMentioned=roles.some(r=>partyOf(r)==='counterpart'&&(r.status!=='unresolved'||context?.stakeholders?.some(s=>s.role===r.id&&s.status==='mentioned')));
  const selfRole=posture==='initiator'?'guest':posture==='receiver'?'host':'undetermined';
  const counterpartRole=counterpartMentioned?(selfRole==='guest'?'host':selfRole==='host'?'guest':'undetermined'):'unresolved';
  const alignment=selfRole==='undetermined'||timeBias==='unknown'?'undetermined':
    selfRole==='guest'&&timeBias==='guest_first_move'||selfRole==='host'&&timeBias==='host_later_response'?'aligned':'counter_time';
  const actionBias=timeBias==='guest_first_move'?'Thiên về chủ động/đi trước nếu các điều kiện chính cho phép.':
    timeBias==='host_later_response'?'Thiên về giữ thế, quan sát rồi đáp ứng sau tín hiệu rõ.':'Chưa có thiên hướng Chủ–Khách theo can giờ.';
  return {
    sourceFrame:'Động/tiên động/thiên bàn có thể lấy làm Khách; tĩnh/hậu ứng/địa bàn có thể lấy làm Chủ. Vai phải tùy sự việc, không cố định.',
    timeStem:stem,timeBias,questionPosture:posture,selfRole,counterpartRole,alignment,actionBias,
    classicalSource:'奇門遁甲秘笈大全·論主客; 奇門遁甲統宗卷十一',
    limitation:'Chủ–Khách là tư thế/khung hành động, không phải danh tính cố định và không tự quyết định thành bại.'
  };
}

function roleBlockers(role,palace,structures){
  if(!palace)return [];
  const s=structures?.byPalace?.[palace.number];
  const harms=(s?.fourHarms||[]).filter(x=>x.actorIds?.includes(role.id)).map(x=>({code:x.code,severity:x.severity||'high'}));
  const responses=(s?.stemResponses||[]).filter(x=>x.actorIds?.includes(role.id)&&x.weight<0).map(x=>({code:'stem_response',severity:x.tone==='severe_adverse'?'high':'medium',meaning:x.plainMeaning}));
  return [...harms,...responses];
}

function agencyBand(strength,blockers,status){
  if(status==='unresolved')return 'unresolved';
  if(blockers.some(x=>x.severity==='high')&&['yếu','rất yếu'].includes(strength.level))return 'constrained';
  if(blockers.filter(x=>x.severity==='high').length>=2)return 'constrained';
  if(['mạnh','khá mạnh'].includes(strength.level)&&!blockers.some(x=>x.severity==='high'))return 'strong';
  if(strength.level==='rất yếu')return 'constrained';
  return 'usable';
}

const agencyMeaning=band=>({
  strong:'Vai có lực biểu tượng tương đối rõ để chủ động trong phạm vi của mình, nhưng vẫn cần kiểm tra điều kiện thực tế.',
  usable:'Vai có thể tham gia/tác động nhưng cần phối hợp điều kiện và phản hồi từ các bên.',
  constrained:'Vai đang bị giới hạn bởi lực yếu hoặc cấu trúc cản; phù hợp giảm cam kết, gỡ nút thắt hoặc chờ xác nhận.',
  unresolved:'Chưa có đại diện hợp lệ trên bàn; không được suy mạnh/yếu hay quyền chủ động.'
}[band]);

function actionRoleForParty(party,frame){
  if(party==='self')return frame.selfRole;
  if(party==='counterpart')return frame.counterpartRole;
  if(party==='matter')return 'object';
  return 'contextual';
}

function buildRoleRows(board,roles,palaces,structures,frame){
  const palaceMap=new Map(palaces.map(p=>[p.number,p]));
  return roles.map(role=>{
    const palace=role.palace?palaceMap.get(role.palace):null;
    if(!palace)return {
      id:role.id,label:role.label,party:partyOf(role),palace:null,zone:'unknown',zoneMeaning:zoneMeaning('unknown'),
      hostGuest:actionRoleForParty(partyOf(role),frame),agencyBand:'unresolved',agencyMeaning:agencyMeaning('unresolved'),
      strength:null,blockers:[],status:role.status,evidenceIndependence:'unresolved'
    };
    const strength=roleStrength(role,palace.strength);
    const blockers=roleBlockers(role,palace,structures);
    const band=agencyBand(strength,blockers,role.status);
    const zone=innerOuterZone(board.dun,palace.number);
    return {
      id:role.id,label:role.label,party:partyOf(role),palace:palace.number,zone,zoneMeaning:zoneMeaning(zone),
      hostGuest:actionRoleForParty(partyOf(role),frame),agencyBand:band,agencyMeaning:agencyMeaning(band),
      strength:{kind:strength.kind,level:strength.level,band:strength.band,meaning:strength.meaning,stem:strength.stem||null},
      blockers,status:role.status,evidenceIndependence:'independent_until_clustered'
    };
  });
}

function groupSharedPalaces(rows){
  const by=new Map();
  for(const row of rows.filter(r=>r.palace))by.set(row.palace,[...(by.get(row.palace)||[]),row]);
  const clusters=[...by.entries()].filter(([,items])=>items.length>1).map(([palace,items])=>({
    palace,roleIds:items.map(x=>x.id),parties:[...new Set(items.map(x=>x.party))],
    meaning:'Các vai đồng cung dùng chung một cụm điều kiện; không được đếm như các nguồn chứng cứ độc lập.'
  }));
  const shared=new Set(clusters.flatMap(c=>c.roleIds));
  for(const row of rows)if(shared.has(row.id))row.evidenceIndependence='shared_palace_cluster';
  return clusters;
}

function influenceRows(rows,relations){
  const resolved=rows.filter(r=>r.palace!==null);
  const out=[];
  for(let i=0;i<resolved.length;i++)for(let j=i+1;j<resolved.length;j++){
    const a=resolved[i],b=resolved[j];
    if(a.palace===b.palace){
      out.push({from:a.id,to:b.id,effect:'interdependent',direction:'shared_cluster',samePalace:true,
        meaning:'Hai vai cùng chịu một cụm điều kiện; không suy một bên đang áp đảo bên kia.'});
      continue;
    }
    const rel=relations.find(r=>r.from===a.palace&&r.to===b.palace);
    if(!rel)continue;
    if(rel.kind==='same'){
      out.push({from:a.id,to:b.id,effect:'alignment',direction:'mutual',samePalace:false,
        meaning:'Hai vai có hành tương đồng; cần kiểm tra mục tiêu có thực sự cùng hướng hay không.'});
      continue;
    }
    let driver,target,effect;
    if(rel.kind==='generates'){driver=a;target=b;effect='support';}
    else if(rel.kind==='generated_by'){driver=b;target=a;effect='support';}
    else if(rel.kind==='controls'){driver=a;target=b;effect='pressure';}
    else {driver=b;target=a;effect='pressure';}
    const capacity=driver.agencyBand==='strong'&&target.agencyBand==='constrained'?'driver_capacity_advantage':
      driver.agencyBand==='constrained'&&target.agencyBand==='strong'?'driver_capacity_limited':'no_clear_capacity_asymmetry';
    out.push({from:driver.id,to:target.id,effect,direction:'from_to',samePalace:false,capacity,
      meaning:effect==='support'
        ?`${driver.label} có quan hệ biểu tượng hỗ trợ ${target.label}; cần xác nhận nguồn hỗ trợ có thực và được tiếp nhận.`
        :`${driver.label} tạo áp lực biểu tượng lên ${target.label}; đây là chiều tác động, không phải kết luận bên nào thắng.`});
  }
  return out;
}

export function analyzeRoles(board,roles,palaces,structures,relations,questionContext=null){
  const frame=hostGuestFrame(board,questionContext,roles);
  const rows=buildRoleRows(board,roles,palaces,structures,frame);
  const sharedPalaceClusters=groupSharedPalaces(rows);
  const influences=influenceRows(rows,relations);
  const counterpartRows=rows.filter(r=>['customer','competitor','decisionMaker'].includes(r.id));
  return Object.freeze({
    version:ROLE_VERSION,profile:ROLE_PROFILE,
    hostGuest:frame,
    innerOuter:{dun:board.dun,inner:[...INNER_PALACES[board.dun]],outer:[1,2,3,4,6,7,8,9].filter(n=>!INNER_PALACES[board.dun].has(n)),
      convention:'Dương độn: 1/8/3/4 nội; Âm độn: 9/2/7/6 nội. Nội thiên gần/nhanh, ngoại thiên xa/chậm; chỉ là xu hướng.'},
    roles:rows,sharedPalaceClusters,influences,
    multiActor:{
      parties:[...new Set(rows.map(r=>r.party))],
      resolvedCounterparts:counterpartRows.filter(r=>r.palace!==null).map(r=>r.id),
      unresolvedCounterparts:counterpartRows.filter(r=>r.palace===null).map(r=>r.id),
      rule:'Nhiều vai đồng cung không được tính thành nhiều phiếu; người chưa có đại diện xác nhận không được gán cung hoặc sức.'
    },
    limitations:[
      'Chủ–Khách thay đổi theo sự việc và tư thế hành động; không đồng nhất với người tốt/xấu hay bên thắng/thua.',
      'Nội/ngoại bàn chỉ là xu hướng gần–xa/nhanh–chậm, không xác định danh tính hoặc kết quả.',
      'Agency là khả năng biểu tượng của vai trong bàn, không phải quyền lực thực tế, ý chí hoặc năng lực pháp lý đã được xác minh.',
      'Quan hệ sinh/khắc giữa vai là chiều hỗ trợ/áp lực biểu tượng, không phải quan hệ nhân quả ngoài thực tế.'
    ]
  });
}
