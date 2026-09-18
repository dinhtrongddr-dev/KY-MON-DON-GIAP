import {locateStem,palaceConditions} from '../../guide.mjs';
import {seasonalStrength} from '../analysis/strength.mjs';
import {createEvidence,createGlobalHardEvidence,dedupeEvidence} from './evidence.mjs';
import {createClaim} from './audit.mjs';
import {fiveCombinationCounterpart} from './resolvers.mjs';
import {resolveParentPair,gengParentPattern} from './domains/family.mjs';
import {marriageResolverBundle} from './domains/marriage.mjs';
import {careerResolverContract} from './domains/career.mjs';
import {wealthInnerOuterTendency,wealthRelationSemantics,wealthResolverContract} from './domains/wealth.mjs';
import {createLuckOverlay} from './overlay.mjs';
import {createAnnualOverlay} from './annual.mjs';
import {synthesizeEvidence} from './synthesis.mjs';
import {validateNatalView} from './schema.mjs';

const PALACE_CODE=Object.freeze({1:'KAN_1',2:'KUN_2',3:'ZHEN_3',4:'XUN_4',6:'QIAN_6',7:'DUI_7',8:'GEN_8',9:'LI_9'});
const STEM_CANON=Object.freeze({'甲':'JIA','乙':'YI','丙':'BING','丁':'DING','戊':'WU','己':'JI','庚':'GENG','辛':'XIN','壬':'REN','癸':'GUI'});
const STEM_HAN=Object.freeze(Object.fromEntries(Object.entries(STEM_CANON).map(([han,key])=>[key,han])));
const BRANCH_CANON=Object.freeze({'子':'ZI','丑':'CHOU','寅':'YIN','卯':'MAO','辰':'CHEN','巳':'SI','午':'WU','未':'WEI','申':'SHEN','酉':'YOU','戌':'XU','亥':'HAI'});
const ALL_DOMAINS=Object.freeze(['SELF','FAMILY','CHILDREN','MARRIAGE','CAREER','WEALTH']);
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const code=palace=>PALACE_CODE[palace?.number]||'CENTER_5';
const named=palace=>`${palace.vi} ${palace.number} (${palace.element})`;
const relationText=relation=>relation?.text||'không có quan hệ';
const canonicalStem=han=>STEM_CANON[han]||null;
const canonicalBranch=han=>BRANCH_CANON[han]||null;

export function verticalAnalyzeNatalPalace(board,palace){
  if(!palace||palace.number===5)throw new Error('KM-MENH: vertical analysis cần cung ngoại Trung 5.');
  const conditions=palaceConditions(palace);
  return freeze({
    palace:code(palace),palaceNumber:palace.number,palaceName:palace.vi,palaceElement:palace.element,
    seasonStrength:seasonalStrength(board,palace),
    star:palace.star,door:palace.door,deity:palace.spirit,
    heavenStem:Object.freeze((palace.heavenStems||[]).map(s=>s.han)),
    earthStem:palace.earthStem?.han||null,
    stemPattern:Object.freeze((palace.heavenStems||[]).map(s=>`${s.han}/${palace.earthStem?.han||''}`)),
    void:palace.voided===true,tomb:Object.freeze([...conditions.wonderTombs]),
    punishment:Object.freeze([...conditions.punishment]),doorPressure:conditions.doorPressure===true,
    horse:palace.horse===true,
    specialStructures:Object.freeze([]),
  });
}
function locate(board,pillarOrStem){
  return locateStem(board,pillarOrStem).palace;
}
function locateCanonical(board,canon){
  if(canon==="JIA")return palaceByNumber(board,board.zhiFu.palace);
  return locate(board,STEM_HAN[canon]);
}
function doorPalace(board,id){
  const p=board.palaces.find(x=>x.number!==5&&x.door?.id===id);
  if(!p)throw new Error('KM-MENH: không tìm thấy Môn '+id+'.');
  return p;
}
function spiritPalace(board,id){
  const p=board.palaces.find(x=>x.number!==5&&x.spirit?.id===id);
  if(!p)throw new Error('KM-MENH: không tìm thấy Thần '+id+'.');
  return p;
}
function palaceByNumber(board,number){
  const p=board.palaces.find(x=>x.number===number);
  if(!p)throw new Error('KM-MENH: thiếu cung '+number+'.');
  return p;
}
function summaryVertical(v){
  const flags=[
    v.void?'Tuần Không':null,
    v.horse?'Dịch Mã':null,
    v.doorPressure?'Môn bức':null,
    v.tomb.length?`Tam kỳ nhập mộ: ${v.tomb.join(', ')}`:null,
    v.punishment.length?`Kích hình: ${v.punishment.join(', ')}`:null,
  ].filter(Boolean);
  return `${v.palaceName} ${v.palaceNumber}: ${v.star.vi}, ${v.door.vi}, ${v.deity.vi}; thiên can ${v.heavenStem.join('+')}, địa can ${v.earthStem}; Cửu Tinh ${v.seasonStrength.star.status}${flags.length?'; '+flags.join('; '):''}.`;
}
function makeEvidence({id,ruleId,domain,palace,mechanism,effectTag,priorityClass='DOMAIN_PRIMARY',sourceTier='A1',provenance='DIRECT_ZHANG',severity='INFO',favorable=false,metadata={},relation=null}){
  return createEvidence({evidenceId:id,ruleId,sourceTier,provenance,domain,palace:code(palace),mechanism,effectTag,
    severity,priorityClass,favorable,relation,metadata:{...metadata,palaceNumber:palace?.number??null,summary:metadata.summary||null}});
}
function relation(from,to){
  const a=from.element,b=to.element;
  const generates={'Mộc':'Hỏa','Hỏa':'Thổ','Thổ':'Kim','Kim':'Thủy','Thủy':'Mộc'};
  const controls={'Mộc':'Thổ','Thổ':'Thủy','Thủy':'Hỏa','Hỏa':'Kim','Kim':'Mộc'};
  if(a===b)return {kind:'same',text:`${a} cùng hành ${b}`};
  if(generates[a]===b)return {kind:'generates',text:`${a} sinh ${b}`};
  if(generates[b]===a)return {kind:'generated_by',text:`${a} được ${b} sinh`};
  if(controls[a]===b)return {kind:'controls',text:`${a} khắc ${b}`};
  return {kind:'controlled_by',text:`${a} bị ${b} khắc`};
}
function globalEvidence(board){
  const out=[];
  if(board.fuYin)out.push(createGlobalHardEvidence({
    evidenceId:'GLOBAL_FU_YIN',ruleId:'KMZ-GLOBAL-001',sourceTier:'A1',provenance:'DIRECT_ZHANG',
    mechanism:'FU_YIN',effectTag:'GLOBAL_CONSTRAINT',severity:'HIGH',sourceBacked:true,affectedDomains:ALL_DOMAINS,
    metadata:{summary:'Toàn bàn có Phục Ngâm; đây là cấu trúc nền cần xét trước tín hiệu cục bộ, không phải phán quyết xấu tuyệt đối.'},
  }));
  if(board.fanYin)out.push(createGlobalHardEvidence({
    evidenceId:'GLOBAL_FAN_YIN',ruleId:'KMZ-GLOBAL-001',sourceTier:'A1',provenance:'DIRECT_ZHANG',
    mechanism:'FAN_YIN',effectTag:'GLOBAL_REVERSAL',severity:'HIGH',sourceBacked:true,affectedDomains:ALL_DOMAINS,
    metadata:{summary:'Toàn bàn có Phản Ngâm; đây là cấu trúc nền biến động/đảo chiều, không tự quyết định kết quả mọi domain.'},
  }));
  return out;
}
function claim({claimId,type='NATAL_TENDENCY',text,domain,ruleIds,evidenceIds}){
  return createClaim({claimId,type,text,domain,ruleIds,evidenceIds});
}

export function analyzeNatalView(natalView,{age=null,annualPillar=null,sexMetadata=null}={}){
  validateNatalView(natalView);
  const board=natalView.baseBoard;
  const day=locate(board,board.pillars.day),hour=locate(board,board.pillars.hour),year=locate(board,board.pillars.year);
  const zhiFu=palaceByNumber(board,board.zhiFu.palace),zhiShi=palaceByNumber(board,board.zhiShi.palace);
  const selfVertical=verticalAnalyzeNatalPalace(board,day);
  const hourVertical=verticalAnalyzeNatalPalace(board,hour);
  const globalHardEvidence=globalEvidence(board);
  const evidence=[...globalHardEvidence];
  const claims=[];
  if(globalHardEvidence.length){
    const mechanisms=globalHardEvidence.map(e=>e.mechanism==='FU_YIN'?'Phục Ngâm':e.mechanism==='FAN_YIN'?'Phản Ngâm':e.mechanism).join(' + ');
    claims.push(claim({
      claimId:'GLOBAL_STRUCTURE',domain:'GLOBAL',
      text:`Toàn bàn có ${mechanisms}. Đây là cấu trúc nền ưu tiên cao: phải xét trước các tín hiệu cục bộ và có thể giới hạn/cap mặt thuận của chúng trong các domain bị ảnh hưởng; không phải một veto xấu tuyệt đối hay bằng chứng sự kiện chắc chắn.`,
      ruleIds:['KMZ-GLOBAL-001'],evidenceIds:globalHardEvidence.map(e=>e.evidenceId),
    }));
  }

  const selfEvidence=[
    makeEvidence({id:'SELF_DAY_STEM',ruleId:'KMZ-SELF-001',domain:'SELF',palace:day,mechanism:'DAY_STEM_PALACE',effectTag:'SELF_IDENTITY',priorityClass:'SELF_CORE',metadata:{summary:summaryVertical(selfVertical),vertical:selfVertical}}),
    makeEvidence({id:'SELF_ZHI_FU',ruleId:'KMZ-SELF-002',domain:'SELF',palace:zhiFu,mechanism:'ZHI_FU_VS_SELF',effectTag:'ZHI_FU_BASELINE',priorityClass:'SELF_CORE',relation:relation(zhiFu,day),metadata:{summary:`Trực Phù ${board.zhiFu.star.vi} ở ${named(zhiFu)}; so với cung Nhật can: ${relationText(relation(zhiFu,day))}.`}}),
    makeEvidence({id:'SELF_ZHI_SHI',ruleId:'KMZ-SELF-002',domain:'SELF',palace:zhiShi,mechanism:'ZHI_SHI_VS_SELF',effectTag:'ZHI_SHI_BASELINE',priorityClass:'SELF_CORE',relation:relation(zhiShi,day),metadata:{summary:`Trực Sử ${board.zhiShi.door.vi} ở ${named(zhiShi)}; so với cung Nhật can: ${relationText(relation(zhiShi,day))}.`}}),
    makeEvidence({id:'SELF_HOUR_DAY',ruleId:'KMZ-SELF-003',domain:'SELF',palace:hour,mechanism:'HOUR_STEM_VS_DAY_STEM',effectTag:'GENERAL_PROCESS_BASELINE',priorityClass:'SELF_CORE',relation:relation(hour,day),metadata:{summary:`Thời can ở ${named(hour)} so với Nhật can ở ${named(day)}: ${relationText(relation(hour,day))}.`,vertical:hourVertical}}),
  ];
  evidence.push(...selfEvidence);
  claims.push(claim({claimId:'SELF_CORE',domain:'SELF',text:`Nhật can ${board.pillars.day.stem.vi} đặt bản thân tại ${named(day)}. ${summaryVertical(selfVertical)} Trực Phù và Trực Sử được đối chiếu riêng; Thời can ở ${named(hour)} là trục diễn biến đời sống bổ sung, không phải một lá phiếu thứ hai.`,ruleIds:['KMZ-SELF-001','KMZ-SELF-002','KMZ-SELF-003'],evidenceIds:selfEvidence.map(e=>e.evidenceId)}));

  const yearCanon=canonicalStem(board.pillars.year.stem.han),parentPair=resolveParentPair({yearStem:yearCanon});
  const pairedPalace=locateCanonical(board,parentPair.pairedStem);
  const qian=palaceByNumber(board,6),kun=palaceByNumber(board,2);
  const familyEvidence=[
    makeEvidence({id:'PARENT_YEAR_STEM',ruleId:'KMZ-PARENT-001',domain:'FAMILY',palace:year,mechanism:'YEAR_STEM_PARENT_AGGREGATE',effectTag:'PARENT_AGGREGATE',metadata:{summary:`Niên can ${board.pillars.year.stem.vi} ở ${named(year)} là đại diện tổng hợp cha mẹ/gốc gia đình.`}}),
    makeEvidence({id:'PARENT_QIAN',ruleId:'KMZ-PARENT-002',domain:'FAMILY',palace:qian,mechanism:'QIAN_FATHER',effectTag:'FATHER_CORROBORATOR',priorityClass:'DOMAIN_CORROBORATORS',metadata:{summary:`Càn 6 (${named(qian)}) là lớp đối chiếu phía cha.`}}),
    makeEvidence({id:'PARENT_KUN',ruleId:'KMZ-PARENT-003',domain:'FAMILY',palace:kun,mechanism:'KUN_MOTHER',effectTag:'MOTHER_CORROBORATOR',priorityClass:'DOMAIN_CORROBORATORS',metadata:{summary:`Khôn 2 (${named(kun)}) là lớp đối chiếu phía mẹ.`}}),
    makeEvidence({id:'PARENT_PAIRED_STEM',ruleId:'KMZ-PARENT-005',domain:'FAMILY',palace:pairedPalace,mechanism:'YEAR_STEM_FIVE_COMBINATION',effectTag:'PARENT_PAIR_CORROBORATOR',priorityClass:'DOMAIN_CORROBORATORS',sourceTier:'B',provenance:'DIRECT_ZHANG_AUXILIARY',metadata:{summary:`Niên can ${parentPair.yearStemRole}; can hợp ${parentPair.pairedStem} ở ${named(pairedPalace)} chỉ là corroborator cho ${parentPair.pairedStemRole}.`,roles:parentPair}}),
  ];
  for(const p of [qian,kun]){
    if((p.heavenStems||[]).some(s=>s.han==='庚')){
      const pattern=gengParentPattern(code(p));
      familyEvidence.push(makeEvidence({id:`PARENT_GENG_${p.number}`,ruleId:'KMZ-PARENT-004',domain:'FAMILY',palace:p,mechanism:'GENG_QIAN_KUN',effectTag:'TRADITIONAL_STRONG_PATTERN',priorityClass:'DOMAIN_CORROBORATORS',severity:'HIGH',metadata:{summary:`Canh tại ${named(p)} là mô thức truyền thống mạnh về ${pattern.target}; chỉ biểu thị áp lực/rủi ro, không suy tử vong.`,pattern}}));
    }
  }
  const parentRoleEvidence=createEvidence({evidenceId:'PARENT_PAIR_ROLE',ruleId:'KMZ-PARENT-005',sourceTier:'B',provenance:'DIRECT_ZHANG_AUXILIARY',domain:'FAMILY',palace:'GLOBAL',mechanism:'YEAR_STEM_POLARITY_PAIR_ROLES',effectTag:'PARENT_PAIR_ROLE_CORROBORATOR',severity:'INFO',priorityClass:'DOMAIN_CORROBORATORS',metadata:{summary:`Niên can ${parentPair.yearStem} ${parentPair.yearStemPolarity}: ${parentPair.yearStemRole}; can hợp ${parentPair.pairedStem}: ${parentPair.pairedStemRole}; chỉ là corroborator.`}});
  evidence.push(...familyEvidence,parentRoleEvidence);
  claims.push(claim({claimId:'FAMILY_PARENTS',domain:'FAMILY',text:`Gia đình/cha mẹ lấy Niên can tại ${named(year)} làm trục tổng hợp; Càn 6 và Khôn 2 là lớp đối chiếu cha/mẹ. Quy tắc can hợp của Niên can chỉ bổ sung vai trò (${parentPair.yearStemRole} / ${parentPair.pairedStemRole}), không thay thế ba lớp chính.`,ruleIds:['KMZ-PARENT-001','KMZ-PARENT-002','KMZ-PARENT-003','KMZ-PARENT-005'],evidenceIds:familyEvidence.map(e=>e.evidenceId)}));
  claims.push(claim({claimId:'FAMILY_PARENT_PAIR_ROLE',domain:'FAMILY',text:`Niên can ${parentPair.yearStem} thuộc ${parentPair.yearStemPolarity}: vai trò truyền thống là ${parentPair.yearStemRole}; can hợp ${parentPair.pairedStem} là ${parentPair.pairedStemRole}. Đây chỉ là corroborator, không phải bộ giải duy nhất.`,ruleIds:['KMZ-PARENT-005'],evidenceIds:['PARENT_PAIR_ROLE']}));

  const childEvidence=makeEvidence({id:'CHILD_HOUR_STEM',ruleId:'KMZ-CHILD-001',domain:'CHILDREN',palace:hour,mechanism:'HOUR_STEM_CHILDREN',effectTag:'CHILDREN_PRIMARY',metadata:{summary:`Thời can ${board.pillars.hour.stem.vi} ở ${named(hour)} là significator con cái; so với Nhật can: ${relationText(relation(hour,day))}.`,vertical:hourVertical}});
  evidence.push(childEvidence);
  claims.push(claim({claimId:'CHILDREN_CORE',domain:'CHILDREN',text:`Con cái lấy Thời can ở ${named(hour)} làm trục, đối chiếu với bản thân tại ${named(day)}. Lớp này không cho phép suy số con, giới tính, vô sinh hay kết cục y tế chắc chắn.`,ruleIds:['KMZ-CHILD-001','KMZ-OUTPUT-002'],evidenceIds:['CHILD_HOUR_STEM','SELF_DAY_STEM']}));

  const xiu=doorPalace(board,'xiu'),liuHe=spiritPalace(board,'harmony'),yi=locate(board,'乙'),geng=locate(board,'庚');
  const dayCanon=canonicalStem(board.pillars.day.stem.han),marriage=marriageResolverBundle({dayStem:dayCanon,sexMetadata});
  const counterpart=locateCanonical(board,marriage.fiveCombinationCounterpart);
  const marriageEvidence=[
    makeEvidence({id:'MARR_SELF',ruleId:'KMZ-MARR-001',domain:'MARRIAGE',palace:day,mechanism:'DAY_STEM',effectTag:'SELF_IN_MARRIAGE',metadata:{summary:`Nhật can ở ${named(day)}.`}}),
    makeEvidence({id:'MARR_XIU',ruleId:'KMZ-MARR-001',domain:'MARRIAGE',palace:xiu,mechanism:'XIU_MEN',effectTag:'FAMILY_CONTAINER',metadata:{summary:`Hưu Môn ở ${named(xiu)}.`}}),
    makeEvidence({id:'MARR_LIU_HE',ruleId:'KMZ-MARR-001',domain:'MARRIAGE',palace:liuHe,mechanism:'LIU_HE',effectTag:'UNION_SYMBOL',metadata:{summary:`Lục Hợp ở ${named(liuHe)}.`}}),
    makeEvidence({id:'MARR_YI_GENG',ruleId:'KMZ-MARR-003',domain:'MARRIAGE',palace:yi,mechanism:'YI_GENG',effectTag:'TRADITIONAL_PARTNER_AXIS',priorityClass:'DOMAIN_CORROBORATORS',metadata:{summary:`Trục Ất/Canh: Ất ở ${named(yi)}, Canh ở ${named(geng)}.`,gengPalace:code(geng)}}),
    makeEvidence({id:'MARR_DAY_PAIR',ruleId:'KMZ-MARR-002',domain:'MARRIAGE',palace:counterpart,mechanism:'DAY_STEM_FIVE_COMBINATION_COUNTERPART',effectTag:'SPOUSE_PAIR_CORROBORATOR',priorityClass:'DOMAIN_CORROBORATORS',metadata:{summary:`Can hợp của Nhật can ${dayCanon} là ${marriage.fiveCombinationCounterpart}, ở ${named(counterpart)}; vẫn không thay thế Hưu/Lục Hợp/Ất-Canh.`}}),
  ];
  evidence.push(...marriageEvidence);
  claims.push(claim({claimId:'MARRIAGE_CORE',domain:'MARRIAGE',text:`Hôn nhân được đọc bằng bundle bắt buộc: bản thân ${named(day)}, Hưu Môn ${named(xiu)}, Lục Hợp ${named(liuHe)}, trục Ất–Canh và can hợp của Nhật can (${marriage.fiveCombinationCounterpart}) tại ${named(counterpart)}. Không ký hiệu nào được dùng làm “phối ngẫu duy nhất”.`,ruleIds:['KMZ-MARR-001','KMZ-MARR-002','KMZ-MARR-003'],evidenceIds:marriageEvidence.map(e=>e.evidenceId)}));

  const kai=doorPalace(board,'kai'),du=doorPalace(board,'du'),careerContract=careerResolverContract();
  const careerEvidence=[
    makeEvidence({id:'CAREER_SELF_VOCATION',ruleId:'KMZ-CAREER-001',domain:'CAREER',palace:day,mechanism:'SELF_STAR_DOOR',effectTag:'VOCATION_NATURE',metadata:{summary:`Cung bản thân có ${day.star.vi} + ${day.door.vi}: mô tả tính chất nghề nghiệp/vai trò làm việc.`}}),
    makeEvidence({id:'CAREER_KAI',ruleId:'KMZ-CAREER-002',domain:'CAREER',palace:kai,mechanism:'KAI_MEN_VS_SELF',effectTag:'INSTITUTION_OPPORTUNITY',relation:relation(kai,day),metadata:{summary:`Khai Môn ở ${named(kai)} so với bản thân: ${relationText(relation(kai,day))}.`}}),
    makeEvidence({id:'CAREER_DU',ruleId:'KMZ-CAREER-003',domain:'CAREER',palace:du,mechanism:'DU_MEN',effectTag:'OBSTRUCTION_CORROBORATOR',priorityClass:'DOMAIN_CORROBORATORS',metadata:{summary:`Đỗ Môn ở ${named(du)} là corroborator cho kỹ thuật/kín/bế tắc tùy cấu trúc.`}}),
  ];
  evidence.push(...careerEvidence);
  claims.push(claim({claimId:'CAREER_CORE',domain:'CAREER',text:`Sự nghiệp: tính chất nghề nhìn từ ${day.star.vi} + ${day.door.vi} ở cung bản thân; Khai Môn tại ${named(kai)} là trục cơ hội/tổ chức và ${relationText(relation(kai,day))}; Đỗ Môn tại ${named(du)} chỉ là lớp bổ sung. Không chấm điểm thành công nghề nghiệp.`,ruleIds:['KMZ-CAREER-001','KMZ-CAREER-002','KMZ-CAREER-003'],evidenceIds:careerEvidence.map(e=>e.evidenceId)}));

  const sheng=doorPalace(board,'sheng'),wu=locate(board,'戊'),wealth=wealthRelationSemantics({shengElement:sheng.element,selfElement:day.element});
  const innerOuter=wealthInnerOuterTendency({dun:board.dun,selfPalace:code(day),shengPalace:code(sheng)});
  const wealthContract=wealthResolverContract();
  const wealthEvidence=[
    makeEvidence({id:'WEALTH_SHENG',ruleId:'KMZ-WEALTH-001',domain:'WEALTH',palace:sheng,mechanism:'SHENG_MEN_VS_SELF',effectTag:wealth.semantic,relation:relation(sheng,day),metadata:{summary:`Sinh Môn ở ${named(sheng)}, tinh đồng cung ${sheng.star.vi}; so với bản thân: ${relationText(relation(sheng,day))} → ${wealth.semantic}.`}}),
    makeEvidence({id:'WEALTH_CAPITAL',ruleId:'KMZ-WEALTH-002',domain:'WEALTH',palace:wu,mechanism:'WU_OR_JIA_ZI_WU',effectTag:'CAPITAL_CORROBORATOR',priorityClass:'DOMAIN_CORROBORATORS',metadata:{summary:`Mậu/Giáp Tý Mậu ở ${named(wu)} là corroborator vốn/nguồn lực, không phải số tiền.`}}),
    makeEvidence({id:'WEALTH_INNER_OUTER',ruleId:'KMZ-WEALTH-003',domain:'WEALTH',palace:sheng,mechanism:'SHENG_SELF_INNER_OUTER',effectTag:innerOuter.tendency,priorityClass:'DOMAIN_CORROBORATORS',metadata:{summary:`Nội/ngoại: bản thân ${innerOuter.selfZone}, Sinh Môn ${innerOuter.shengZone} → ${innerOuter.tendency}; chỉ là xu hướng phát triển.`}}),
  ];
  evidence.push(...wealthEvidence);
  claims.push(claim({claimId:'WEALTH_CORE',domain:'WEALTH',text:`Tài vận lấy Sinh Môn tại ${named(sheng)} làm chính; quan hệ với bản thân là ${wealth.semantic}. Mậu tại ${named(wu)} chỉ bổ sung góc vốn/nguồn lực. Nội–ngoại cho xu hướng “${innerOuter.tendency}”, không suy thành sự kiện di cư hay số tiền chắc chắn.`,ruleIds:['KMZ-WEALTH-001','KMZ-WEALTH-002','KMZ-WEALTH-003'],evidenceIds:wealthEvidence.map(e=>e.evidenceId)}));

  let luck=null,annual=null;
  const birthYearBranch=canonicalBranch(board.pillars.year.branch.han);
  if(age!=null){
    luck=createLuckOverlay(natalView,{birthYearBranch,age});
    const p=palaceByNumber(board,Number(luck.period.palace.split('_')[1]));
    const e=makeEvidence({id:'LUCK_ACTIVE_PERIOD',ruleId:'KMZ-LUCK-001',domain:'SELF',palace:p,mechanism:'FIFTEEN_YEAR_PERIOD',effectTag:luck.period.activeFiveYearLayer,priorityClass:'LUCK_PERIOD_BACKGROUND',sourceTier:'A1',metadata:{summary:`Tuổi ${age}: vận ${luck.period.ageStart}–${luck.period.ageEnd} tại ${luck.period.palace}; lớp 5 năm ${luck.period.activeFiveYearLayer}.`,period:luck.period}});
    evidence.push(e);
    claims.push(claim({claimId:'LUCK_CURRENT',type:'PERIOD_ACTIVATION',domain:'SELF',text:`Tuổi ${age} nằm trong đại vận ${luck.period.ageStart}–${luck.period.ageEnd} tại ${luck.period.palace}; lớp đang nhấn là ${luck.period.activeFiveYearLayer}. Đây là nền thời kỳ, không tự tạo sự kiện.`,ruleIds:['KMZ-LUCK-001','KMZ-LUCK-002','KMZ-LUCK-003','KMZ-LUCK-004'],evidenceIds:['LUCK_ACTIVE_PERIOD']}));
  }
  if(annualPillar){
    annual=createAnnualOverlay(natalView,{annualPillar,luckOverlay:luck});
    const stemPalace=palaceByNumber(board,Number(annual.annual.annualStemPalace.split('_')[1]));
    const branchPalace=palaceByNumber(board,Number(annual.annual.annualBranchPalace.split('_')[1]));
    const annualEvidence=[
      makeEvidence({id:'ANNUAL_STEM',ruleId:'KMZ-YEAR-001',domain:'SELF',palace:stemPalace,mechanism:'ANNUAL_STEM_TIAN_PAN',effectTag:'PRIMARY_ANNUAL_ACTIVATION',priorityClass:'ANNUAL_ACTIVATION',sourceTier:'C2',provenance:'TRANSMISSION_ZHANG_LINE_LWF',metadata:{summary:`Lưu niên can ${annual.annual.resolvedStem} ở ${annual.annual.annualStemPalace} trên Thiên bàn (implementation default; transmission corroborated).`}}),
      makeEvidence({id:'ANNUAL_BRANCH',ruleId:'KMZ-YEAR-003',domain:'SELF',palace:branchPalace,mechanism:'ANNUAL_BRANCH_PALACE',effectTag:'SECONDARY_ANNUAL_ACTIVATION',priorityClass:'ANNUAL_ACTIVATION',metadata:{summary:`Lưu niên chi ở ${annual.annual.annualBranchPalace}, vai trò thứ cấp.`}}),
    ];
    evidence.push(...annualEvidence);
    claims.push(claim({claimId:'ANNUAL_CURRENT',type:'PERIOD_ACTIVATION',domain:'SELF',text:`Lưu niên ${annualPillar}: can đã giải thành ${annual.annual.resolvedStem} tại ${annual.annual.annualStemPalace} trên Thiên bàn là lớp chính; chi tại ${annual.annual.annualBranchPalace} là lớp phụ. Đây là kích hoạt trên bàn natal cố định, không phải sự kiện chắc chắn.`,ruleIds:['KMZ-YEAR-001','KMZ-YEAR-002','KMZ-YEAR-003','KMZ-YEAR-004'],evidenceIds:annualEvidence.map(e=>e.evidenceId)}));
  }

  const unique=dedupeEvidence(evidence);
  const syntheses=freeze(Object.fromEntries(ALL_DOMAINS.map(domain=>[domain,synthesizeEvidence(unique,{domain})])));
  return freeze({
    evidence:unique,
    claims:Object.freeze(claims),
    syntheses,
    birthYearBranch,
    dayStem:dayCanon,
    selfPalace:code(day),
    selfVertical,
    luck:luck?.period||null,
    annual:annual?.annual||null,
    domainContracts:freeze({marriage,career:careerContract,wealth:wealthContract}),
  });
}
