import {resolveContradictions} from './contradictions.mjs';
import {relevantActorIds} from './actorRelevance.mjs';
import {aggregateRoleStrength} from './strength.mjs';
const symbol=s=>s?{id:s.id,han:s.han,vi:s.vi,element:s.element}:null;
export function buildEvidenceBundles(analysis,context,graph,modePlan={}) {
  const relevant=new Set(relevantActorIds(context,analysis.roles,modePlan));
  const bundles=[];
  for(const p of analysis.palaces) {
    const roles=analysis.roles.filter(r=>r.palace===p.number&&relevant.has(r.id));if(!roles.length)continue;
    const actorIds=roles.map(r=>r.id),states=[],layers=analysis.patterns.layers,structure=analysis.structures?.byPalace?.[p.number]||null;
    const add=(code,ids=actorIds,detail=null)=>states.push({code,actorIds:ids,detail});
    if(p.voided)add('void');if(p.horse)add('horse');if(p.conditions.doorPressure)add('door_pressure');
    if(structure?.doorRelation?.palaceControlsDoor)add('palace_pressure');
    if(layers.starFanYin||layers.doorFanYin)add('fan_yin',actorIds,{stars:layers.starFanYin,doors:layers.doorFanYin});
    if(layers.starFuYin||layers.doorFuYin)add('fu_yin',actorIds,{stars:layers.starFuYin,doors:layers.doorFuYin});
    for(const r of roles.filter(r=>r.stem)) {
      const own=p.stemPairs.find(s=>s.heaven.han===r.stem);
      if(own?.punishment)add('punishment',[r.id],r.stem);if(own?.wonderTomb)add('tomb',[r.id],r.stem);
    }
    const edges=graph.relations.filter(e=>actorIds.includes(e.from)||actorIds.includes(e.to));
    const special=analysis.patterns.matches.map((m,i)=>({...m,evidenceId:`special_${i}`})).filter(m=>m.palace===p.number);
    const b={id:`bundle_${p.number}`,palace:p.number,element:p.element,actorIds,
      roles:roles.map(r=>({id:r.id,meaning:r.semanticRole,status:r.status,stem:r.stem||null,
        yongshenTier:r.yongshenTier||null,yongshenOrder:r.yongshenOrder||null,yongshenPurpose:r.yongshenPurpose||null,yongshenDomain:r.yongshenDomain||null,yongshenWeight:r.yongshenWeight||0})),
      symbols:{door:symbol(p.door),star:symbol(p.star),deity:symbol(p.spirit),heavenStems:p.heavenStems.map(s=>({han:s.han,vi:s.vi,element:s.element})),earthStem:{han:p.earthStem.han,vi:p.earthStem.vi,element:p.earthStem.element}},
      strength:p.strength.star,strengthProfile:p.strength,capacityStrength:aggregateRoleStrength(roles,p.strength),states,
      fourHarms:structure?.fourHarms||[],
      stemResponses:(structure?.stemResponses||[]).map(r=>({...r,evidenceId:`structure_${p.number}_${r.pair}_${r.carried?'carried':'main'}`})),
      structurePatterns:(structure?.patterns||[]).map((r,i)=>({...r,evidenceId:`structure_pattern_${p.number}_${i}`})),
      doorRelation:structure?.doorRelation||null,structurePriority:structure?.priority||0,
      specialPatterns:special.map(m=>({name:m.name,carried:m.carried,evidenceId:m.evidenceId})),
      structuralRelations:{starDoor:p.starDoor,doorPalace:p.doorPalace,stemPairs:p.stemPairs},
      relationshipIds:edges.map(e=>e.id),evidenceIds:[`p${p.number}`,`c${p.number}`,`mix${p.number}`,`strength_${p.number}`,`structure_${p.number}`,...roles.map(r=>r.evidenceId),...(states.some(s=>['fan_yin','fu_yin'].includes(s.code))?['patterns']:[]),...special.map(m=>m.evidenceId)]};
    b.conflicts=resolveContradictions(b,context);bundles.push(b);
  }
  return bundles;
}
