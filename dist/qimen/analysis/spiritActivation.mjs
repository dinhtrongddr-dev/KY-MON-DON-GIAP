import {PALACES} from '../core/palace.mjs';
import {SEMANTIC_MATRIX} from '../semantic/matrix-data.mjs';
import {elementLink} from './relationships.mjs';

export const SPIRIT_ACTIVATION_VERSION='KM-SPIRIT-ACTIVATION-1.0';

const BACKING=Object.freeze({
  1:{sourceDirection:'Bắc',facingDirection:'Nam',bearing:0},
  8:{sourceDirection:'Đông Bắc',facingDirection:'Tây Nam',bearing:45},
  3:{sourceDirection:'Đông',facingDirection:'Tây',bearing:90},
  4:{sourceDirection:'Đông Nam',facingDirection:'Tây Bắc',bearing:135},
  9:{sourceDirection:'Nam',facingDirection:'Bắc',bearing:180},
  2:{sourceDirection:'Tây Nam',facingDirection:'Đông Bắc',bearing:225},
  7:{sourceDirection:'Tây',facingDirection:'Đông',bearing:270},
  6:{sourceDirection:'Tây Bắc',facingDirection:'Đông Nam',bearing:315}
});

export const ACTIVATION_GOALS=Object.freeze([
  {id:'work',label:'Công việc / sự nghiệp',topicId:'work',domainId:'career'},
  {id:'money',label:'Tài chính',topicId:'money',domainId:'investment_finance'},
  {id:'investment',label:'Đầu tư',topicId:'investment',domainId:'investment_finance'},
  {id:'business',label:'Kinh doanh',topicId:'money',domainId:'business'},
  {id:'love',label:'Quan hệ / tình cảm',topicId:'love',domainId:'love_relationship'},
  {id:'family',label:'Gia đình',topicId:'family',domainId:'children_parenting'},
  {id:'negotiation',label:'Đàm phán',topicId:'contract',domainId:'business'},
  {id:'study',label:'Học tập',topicId:'study',domainId:'study_exam'},
  {id:'creativity',label:'Sáng tạo',topicId:'launch',domainId:'business'},
  {id:'meditation',label:'Tĩnh tâm / quan sát bản thân',topicId:'general',domainId:'general_decision'},
  {id:'decision',label:'Ra quyết định',topicId:'general',domainId:'general_decision'},
  {id:'support',label:'Tìm người hỗ trợ',topicId:'social',domainId:'general_decision'},
  {id:'travel',label:'Đi xa / mở rộng',topicId:'travel',domainId:'travel_relocation'},
  {id:'property',label:'Nhà đất',topicId:'property',domainId:'real_estate'},
  {id:'dispute',label:'Giải quyết xung đột',topicId:'dispute',domainId:'legal_dispute'},
  {id:'other',label:'Khác',topicId:'general',domainId:'general_decision'}
]);
const GOAL_BY_ID=new Map(ACTIVATION_GOALS.map(x=>[x.id,x]));
const TOPIC_TO_GOAL=Object.freeze({general:'decision',work:'work',study:'study',money:'money',investment:'investment',contract:'negotiation',social:'support',family:'family',love:'love',debt:'money',property:'property',travel:'travel',health:'meditation',dispute:'dispute',lost:'decision',launch:'creativity'});
const DEITY_BY_NAME=new Map(SEMANTIC_MATRIX.symbols.deities.map(x=>[x.name,x]));

const DOOR_FIT=Object.freeze({
  work:{kai:2,sheng:.7,xiu:.5},money:{sheng:2,kai:.8},investment:{sheng:1.6,kai:.6,du:.4},business:{sheng:1.5,kai:1.4,jing:.6},
  love:{xiu:1.5,kai:.4},family:{xiu:1.4,sheng:.5},negotiation:{xiu:1.5,kai:1,jing:.8},study:{jing:1.4,xiu:.6,du:.5},
  creativity:{jing:1.6,kai:.9},meditation:{xiu:1.6,du:1},decision:{kai:1,xiu:.8,du:.4},support:{xiu:1.3,kai:.7},
  travel:{kai:1.6,xiu:.5},property:{sheng:1.5,kai:.7,si:.3},dispute:{jing:1,fear:.7,xiu:.4},other:{xiu:.5,kai:.5}
});
const STAR_FIT=Object.freeze({
  work:{xin:1.2,fu:1,ren:.7},money:{ren:1,xin:.8},investment:{xin:1.1,ren:.7},business:{xin:1.1,ren:.8,chong:.6},
  love:{fu:.8,ren:.5},family:{ren:.9,fu:.6},negotiation:{xin:1.1,fu:.8},study:{fu:1.5,xin:.7},
  creativity:{ying:1.4,fu:1,chong:.5},meditation:{fu:1,xin:.8,ren:.6},decision:{xin:1.3,fu:.7},support:{fu:.8,ren:.6},
  travel:{chong:1.3,peng:.5},property:{ren:1.2,xin:.5},dispute:{xin:1.1,zhu:.5},other:{xin:.6,fu:.6}
});

const round=value=>Math.round(value*100)/100;
const uniq=items=>[...new Set(items.filter(Boolean))];

export function getBackingDirection(palace){
  const number=Number(typeof palace==='object'?palace?.number:palace);
  const row=BACKING[number],meta=PALACES[number];
  if(!row||!meta)throw new Error('Chỉ có thể xác định back-facing cho 8 cung phương vị.');
  return Object.freeze({
    palace:`${meta.vi} ${number}`,palaceNumber:number,sourceDirection:row.sourceDirection,facingDirection:row.facingDirection,bearing:row.bearing,
    instruction:`Ngồi sao cho phía ${row.sourceDirection} nằm sau lưng, mặt hướng về ${row.facingDirection}.`
  });
}
export function resolveActivationGoal(goal='decision'){
  const raw=typeof goal==='object'?(goal.id||goal.topicId):goal;
  const id=GOAL_BY_ID.has(raw)?raw:(TOPIC_TO_GOAL[raw]||'decision');
  return GOAL_BY_ID.get(id);
}
export function activationGoalForTopic(topicId){return resolveActivationGoal(TOPIC_TO_GOAL[topicId]||topicId||'decision');}

function strengthScore(palace){
  const s=palace?.strength;if(!s)return 0;
  const weights=[s.star?.weight,s.door?.weight,s.palace?.weight,...(s.stems||[]).map(x=>x.capacityWeight)].filter(Number.isFinite);
  if(!weights.length)return 0;
  const avg=weights.reduce((a,b)=>a+b,0)/weights.length;
  return Math.max(-1.2,Math.min(1.2,(avg-.5)*2.4));
}
function relationAdjustment(from,to){
  if(!from||!to)return {score:0,text:null};
  const rel=elementLink(from.element,to.element);
  const score={same:.35,generates:.5,generated_by:.25,controls:-.35,controlled_by:-.45}[rel.kind]||0;
  return {score,text:rel.text};
}
function profileForSpirit(spirit){
  const profile=DEITY_BY_NAME.get(spirit?.vi||spirit?.name||spirit);
  if(!profile)throw new Error('Semantic Matrix chưa có hồ sơ cho Bát Thần '+(spirit?.vi||spirit||''));
  return profile;
}
function structureScore(palace,structure,goal){
  let score=0;const warnings=[],reasons=[];let severe=0;
  if(palace.voided){score-=1.6;severe++;warnings.push('Cung gặp Tuần Không: tín hiệu dễ thiếu lực hoặc chưa thành hình.');}
  if(palace.conditions?.doorPressure||structure?.doorRelation?.doorControlsPalace){score-=1.25;severe++;warnings.push('Môn đang khắc Cung: kênh hành động tạo thêm áp lực cho phương vị này.');}
  const punishment=(palace.conditions?.punishment||[]).length+(structure?.fourHarms||[]).filter(x=>x.code==='punishment').length;
  const tomb=(palace.conditions?.wonderTombs||[]).length+(palace.conditions?.stemTombs||[]).length+(structure?.fourHarms||[]).filter(x=>x.code==='tomb').length;
  if(punishment){score-=Math.min(1.1,.55*punishment);severe++;warnings.push('Có Kích Hình: nên tránh ép nhịp hoặc hành động quá căng.');}
  if(tomb){score-=Math.min(1,.5*tomb);severe++;warnings.push('Có dấu Nhập Mộ: khả năng phát huy bị giữ hoặc chậm.');}
  const adverse=(structure?.stemResponses||[]).filter(x=>x.tone==='adverse'||Number(x.weight)<0);
  const favorable=(structure?.stemResponses||[]).filter(x=>x.tone==='favorable'||Number(x.weight)>0);
  if(adverse.length){score-=Math.min(.8,adverse.reduce((a,x)=>a+Math.min(.35,Math.abs(Number(x.weight)||.2)),0));warnings.push(...adverse.slice(0,2).map(x=>x.plainMeaning));}
  if(favorable.length){score+=Math.min(.6,favorable.reduce((a,x)=>a+Math.min(.25,Math.abs(Number(x.weight)||.15)),0));reasons.push(...favorable.slice(0,2).map(x=>x.plainMeaning));}
  if(palace.horse){
    if(['travel','work','business','creativity'].includes(goal.id)){score+=.55;reasons.push('Dịch Mã tăng tính di chuyển và chủ động, phù hợp mục tiêu cần mở động.');}
    else if(goal.id==='meditation'){score-=.25;warnings.push('Dịch Mã làm nhịp động hơn; nếu tĩnh tâm nên giữ phiên ngắn và đơn giản.');}
  }
  return {score,warnings,reasons,severe};
}
function globalScore(board,goal){
  let score=0;const warnings=[];
  const fu=board?.fuYin||board?.patterns?.starFuYin||board?.patterns?.doorFuYin;
  const fan=board?.fanYin||board?.patterns?.starFanYin||board?.patterns?.doorFanYin;
  if(fu){score+=goal.id==='meditation'?.15:-.35;warnings.push('Toàn bàn có Phục Ngâm: nhịp dễ chậm hoặc lặp; nên dùng để quan sát hơn là kỳ vọng đổi nhanh.');}
  if(fan){score-=.45;warnings.push('Toàn bàn có Phản Ngâm: diễn biến dễ đảo chiều; không nên coi một phiên thực hành là tín hiệu chắc chắn.');}
  return {score,warnings};
}
function levelFor(score,severe){
  if(severe>=3||score<0)return 'Không nên kích hoạt lúc này';
  if(severe>=2||score<1.5)return 'Không ưu tiên';
  if(score<3)return 'Trung tính';
  if(score<5)return 'Có thể sử dụng';
  return 'Rất phù hợp';
}
const LEVEL_RANK=Object.freeze({'Rất phù hợp':5,'Có thể sử dụng':4,'Trung tính':3,'Không ưu tiên':2,'Không nên kích hoạt lúc này':1});

export function evaluateSpiritActivation(board,goal='decision',{analysis=null,selfPalaceNumber=null}={}){
  if(!board?.palaces)throw new Error('Thiếu bàn Kỳ Môn để đánh giá Bát Thần.');
  const resolvedGoal=resolveActivationGoal(goal);
  const selfNumber=selfPalaceNumber??analysis?.roles?.find(x=>x.id==='self')?.palace??null;
  const primaryRole=analysis?.roles?.find(x=>x.yongshenTier==='primary'&&x.palace!=null)||analysis?.roles?.find(x=>x.id==='event'&&x.palace!=null)||null;
  const selfPalace=board.palaces.find(x=>x.number===selfNumber)||null,targetPalace=board.palaces.find(x=>x.number===primaryRole?.palace)||null;
  const global=globalScore(board,resolvedGoal);
  const candidates=board.palaces.filter(p=>p.number!==5&&p.spirit).map(palace=>{
    const profile=profileForSpirit(palace.spirit);
    const spiritFit=Number(profile.activation_affinity?.[resolvedGoal.id]??profile.activation_affinity?.[resolvedGoal.domainId]??0);
    const doorFit=Number(DOOR_FIT[resolvedGoal.id]?.[palace.door?.id]||0);
    const starFit=Number(STAR_FIT[resolvedGoal.id]?.[palace.star?.id]||0);
    const strength=strengthScore(palace);
    const structure=analysis?.structures?.byPalace?.[palace.number]||null;
    const condition=structureScore(palace,structure,resolvedGoal);
    const targetRel=relationAdjustment(palace,targetPalace),selfRel=relationAdjustment(palace,selfPalace);
    const formation=analysis?.formations?.byPalace?.[palace.number]||null;
    const qualified=(formation?.matches||[]).filter(x=>!x.qualificationStatus||x.qualificationStatus==='qualified').length;
    const formationScore=Math.min(.4,qualified*.2);
    const score=round(spiritFit+doorFit+starFit+strength+condition.score+global.score+targetRel.score+selfRel.score+formationScore);
    const backing=getBackingDirection(palace.number),level=levelFor(score,condition.severe);
    const reasons=uniq([
      spiritFit>0?`${palace.spirit.vi}: ${profile.activationTheme||profile.modernMeaning||profile.core_meaning}.`:null,
      doorFit>0?`${palace.door.vi} phù hợp với cách hành động của mục tiêu này.`:null,
      starFit>0?`${palace.star.vi} hỗ trợ phong cách vận hành cần cho mục tiêu.`:null,
      strength>.25?'Tinh/Môn/Cung tại vị trí này đang có lực tương đối khá.':strength<-.25?'Lực của Tinh/Môn/Cung hiện chưa mạnh; cần giảm kỳ vọng.':null,
      targetRel.text&&targetRel.score>0?`Quan hệ với cung mục tiêu: ${targetRel.text}.`:null,
      selfRel.text&&selfRel.score>0?`Quan hệ với cung người hỏi: ${selfRel.text}.`:null,
      ...(condition.reasons||[])
    ]).slice(0,5);
    const warnings=uniq([...condition.warnings,...global.warnings,targetRel.score<0&&targetRel.text?`Với cung mục tiêu: ${targetRel.text}; cần thận trọng khi dùng phương này.`:null,selfRel.score<0&&selfRel.text?`Với cung người hỏi: ${selfRel.text}; phương này tạo thêm sức ép.`:null]).slice(0,6);
    return Object.freeze({
      palace:palace.number,palaceName:`${palace.vi} ${palace.number}`,direction:palace.direction,
      spirit:{id:palace.spirit.id,name:palace.spirit.vi,han:palace.spirit.han},
      door:{id:palace.door.id,name:palace.door.vi},star:{id:palace.star.id,name:palace.star.vi},
      stem:(palace.heavenStems||[]).map(x=>x.vi||x.han).join(' + '),earthStem:palace.earthStem?.vi||palace.earthStem?.han||'',
      backDirection:backing.sourceDirection,faceDirection:backing.facingDirection,instruction:backing.instruction,bearing:backing.bearing,
      activationLevel:level,score,eligible:LEVEL_RANK[level]>=4,reasons,warnings,
      semantic:{coreMeaning:profile.coreMeaning||profile.core_meaning,modernMeaning:profile.modernMeaning||profile.event,strengths:profile.strengths||[],risks:profile.risks||[],bestFor:profile.bestFor||[],avoidFor:profile.avoidFor||[],meditationTheme:profile.meditationTheme||'',activationTheme:profile.activationTheme||'',practiceInstruction:profile.practiceInstruction||'',keywords:(profile.keywords||[]).slice(0,5),relatedLifeAreas:profile.relatedLifeAreas||[]},
      practice:{durationMinutes:Number(profile.practiceDurationMinutes)||10,intention:profile.meditationTheme||profile.activationTheme||'',instruction:profile.practiceInstruction||backing.instruction}
    });
  }).sort((a,b)=>LEVEL_RANK[b.activationLevel]-LEVEL_RANK[a.activationLevel]||b.score-a.score||a.palace-b.palace);
  const recommended=candidates.find(x=>x.eligible)||null;
  return Object.freeze({
    version:SPIRIT_ACTIVATION_VERSION,chartType:'hourly',goal:resolvedGoal,
    recommendedPalace:recommended?.palace??null,recommended:recommended||null,candidates,
    warnings:recommended?[]:['Không có phương vị đạt mức “Có thể sử dụng” trở lên; nên xem như phiên quan sát thay vì kích hoạt.']
  });
}

export function natalSpiritProfile(board,selfPalaceNumber,{analysisLayers=null}={}){
  if(!board?.palaces)throw new Error('Thiếu Mệnh bàn.');
  const palace=board.palaces.find(x=>x.number===Number(selfPalaceNumber));
  if(!palace||palace.number===5||!palace.spirit)throw new Error('Chưa xác định được cung bản mệnh ngoại Trung 5.');
  const profile=profileForSpirit(palace.spirit),backing=getBackingDirection(palace.number),layer=analysisLayers?.byPalace?.[palace.number]||null;
  const condition=structureScore(palace,layer?.structure||null,resolveActivationGoal('meditation'));
  return Object.freeze({
    version:SPIRIT_ACTIVATION_VERSION,chartType:'destiny',palace:palace.number,palaceName:`${palace.vi} ${palace.number}`,direction:palace.direction,
    spirit:{id:palace.spirit.id,name:palace.spirit.vi,han:palace.spirit.han},door:{id:palace.door.id,name:palace.door.vi},star:{id:palace.star.id,name:palace.star.vi},
    stem:(palace.heavenStems||[]).map(x=>x.vi||x.han).join(' + '),earthStem:palace.earthStem?.vi||palace.earthStem?.han||'',
    backDirection:backing.sourceDirection,faceDirection:backing.facingDirection,instruction:backing.instruction,bearing:backing.bearing,
    semantic:{coreMeaning:profile.coreMeaning||profile.core_meaning,modernMeaning:profile.modernMeaning||profile.destiny,strengths:profile.strengths||[],risks:profile.risks||[],bestFor:profile.bestFor||[],avoidFor:profile.avoidFor||[],meditationTheme:profile.meditationTheme||'',activationTheme:profile.activationTheme||'',practiceInstruction:profile.practiceInstruction||'',keywords:(profile.keywords||[]).slice(0,5),relatedLifeAreas:profile.relatedLifeAreas||[]},
    warnings:uniq([...condition.warnings,...globalScore(board,resolveActivationGoal('meditation')).warnings]).slice(0,6),
    practice:{durationMinutes:Number(profile.practiceDurationMinutes)||10,intention:profile.meditationTheme||profile.activationTheme||'',instruction:profile.practiceInstruction||backing.instruction}
  });
}
