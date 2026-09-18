import {validateMenhResult} from '../audit.mjs';
import {MENH_RULE_VERSION,MENH_PROTOCOL} from '../../../menh-core.mjs';

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const PALACE_CODE=Object.freeze({1:'KAN_1',2:'KUN_2',3:'ZHEN_3',4:'XUN_4',5:'CENTER_5',6:'QIAN_6',7:'DUI_7',8:'GEN_8',9:'LI_9'});
const stem=s=>s?{han:s.han,vi:s.vi,element:s.element}:null;
const entity=x=>x?{id:x.id,han:x.han,vi:x.vi,element:x.element||null,quality:x.quality||null,meaning:x.meaning||null}:null;
function boardFacts(result,birthTimeMode){
  if(birthTimeMode!=='KNOWN')return null;
  const board=result.natal?.baseBoard;if(!board)return null;
  return {
    dun:board.dun,ju:board.ju,yuan:board.yuan,fuYin:board.fuYin===true,fanYin:board.fanYin===true,patterns:{...(board.patterns||{})},
    zhiFu:{star:entity(board.zhiFu?.star),palace:board.zhiFu?.palace??null},
    zhiShi:{door:entity(board.zhiShi?.door),palace:board.zhiShi?.palace??null},
    voidBranches:(board.voidBranches||[]).map(x=>({han:x.han,vi:x.vi})),
    horseBranch:board.horseBranch?{han:board.horseBranch.han,vi:board.horseBranch.vi}:null,
    palaces:(board.palaces||[]).map(p=>({code:PALACE_CODE[p.number]||String(p.number),number:p.number,name:p.vi,direction:p.direction,element:p.element,
      heavenStems:(p.heavenStems||[]).map(stem),earthStem:stem(p.earthStem),star:entity(p.star),door:entity(p.door),spirit:entity(p.spirit),
      carriesQin:p.carriesQin===true,void:p.voided===true,horse:p.horse===true,isDutyStar:p.isDutyStar===true,isDutyDoor:p.isDutyDoor===true})),
  };
}
function luckPhaseWindows(luck){
  if(!luck)return null;const start=luck.ageStart;
  return [
    {ageStart:start,ageEnd:start+4,layer:'NINE_STAR'},
    {ageStart:start+5,ageEnd:start+9,layer:'EIGHT_DOOR'},
    {ageStart:start+10,ageEnd:luck.ageEnd,layer:'TEN_STEM_KE_YING_AND_PALACE_STATE'},
  ];
}

export function buildMenhWriterContext(result,{birthTimeMode='KNOWN',stability=null}={}){
  validateMenhResult(result);
  const claims=result.claims.map(c=>({
    claimId:c.claimId,type:c.type,domain:c.domain,text:c.text,ruleIds:[...c.ruleIds],evidenceIds:[...c.evidenceIds],
  }));
  const evidenceIds=[...new Set(claims.flatMap(c=>c.evidenceIds))];
  const visibleEvidence=(result.evidence||[]).filter(e=>evidenceIds.includes(e.evidenceId));
  const globalHardEvidence=visibleEvidence.filter(e=>e.priorityClass==='GLOBAL_HARD_STRUCTURE');
  const globalClaim=claims.find(c=>c.claimId==='GLOBAL_STRUCTURE')||null;
  const affectedDomains=[...new Set(globalHardEvidence.flatMap(e=>e.affectedDomains||[]))];
  const evidenceById=new Map(visibleEvidence.map(e=>[e.evidenceId,e]));
  const claimSupport=claims.map(c=>{
    const linked=c.evidenceIds.map(id=>evidenceById.get(id)).filter(Boolean);
    const palaces=new Set();
    for(const e of linked){
      if(e.palace&&e.palace!=='GLOBAL')palaces.add(e.palace);
      if(e.metadata?.gengPalace)palaces.add(e.metadata.gengPalace);
    }
    return {claimId:c.claimId,palaces:[...palaces],evidenceIds:[...c.evidenceIds]};
  });
  return freeze({
    protocol:MENH_PROTOCOL,
    ruleVersion:MENH_RULE_VERSION,
    specVersion:result.specVersion,
    profileId:result.profileId,
    birthTimeMode,
    natalMeta:{
      sourceEngineVersion:result.natal?.sourceEngineVersion||null,
      center5Lodging:result.natal?.center5Lodging||null,
    },
    domains:result.domains,
    luck:result.luck,
    luckPhaseWindows:luckPhaseWindows(result.luck),
    annual:result.annual,
    outputMode:'COMPREHENSIVE_ONE_SHOT',
    boardFacts:boardFacts(result,birthTimeMode),
    claims,
    claimSupport,
    evidence:visibleEvidence.map(e=>({
      evidenceId:e.evidenceId,ruleId:e.ruleId,domain:e.domain,palace:e.palace,mechanism:e.mechanism,effectTag:e.effectTag,
      severity:e.severity,priorityClass:e.priorityClass,affectedDomains:[...(e.affectedDomains||[])],summary:e.metadata?.summary||null,relation:e.relation||null,
      detail:{
        palaceNumber:e.metadata?.palaceNumber??null,
        vertical:e.metadata?.vertical||null,
        gengPalace:e.metadata?.gengPalace||null,
        period:e.metadata?.period||null,
        roles:e.metadata?.roles||null,
      },
    })),
    globalStructure:Object.freeze({
      active:globalHardEvidence.length>0,
      claimId:globalClaim?.claimId||null,
      evidenceIds:Object.freeze(globalHardEvidence.map(e=>e.evidenceId)),
      mechanisms:Object.freeze(globalHardEvidence.map(e=>e.mechanism)),
      affectedDomains:Object.freeze(affectedDomains),
      favorableLocalSignalsMayBeCapped:globalHardEvidence.length>0,
      automaticBadFateVeto:false,
    }),
    allowedClaimIds:claims.map(c=>c.claimId),
    allowedEvidenceIds:evidenceIds,
    stability:birthTimeMode==='UNKNOWN'?stability:null,
    sourceTrace:[...(result.sourceTrace||[])],
    restrictions:Object.freeze({
      rebuildChart:false,
      inventRule:false,
      promoteOptionalTransmission:false,
      alterProfile:false,
      alterEvidence:false,
      overallScore:false,
      probability:false,
      deterministicEventClaims:false,
    }),
  });
}
