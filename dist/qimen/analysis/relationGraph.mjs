export function relationGraph(analysis,roleIds) {
  const nodes=roleIds.map(id=>analysis.roles.find(r=>r.id===id)).filter(Boolean).map(r=>{
    const p=analysis.palaces.find(p=>p.number===r.palace),own=p?.stemPairs.find(s=>s.heaven.han===r.stem),dynamic=analysis.roleProfile?.roles?.find(x=>x.id===r.id);
    return {...r,element:p?.element??null,door:p?.door.id??null,star:p?.star.id??null,deity:p?.spirit.id??null,
      strength:p?.strength.star??null,party:dynamic?.party||null,zone:dynamic?.zone||'unknown',hostGuest:dynamic?.hostGuest||'undetermined',
      agencyBand:dynamic?.agencyBand||'unresolved',agencyMeaning:dynamic?.agencyMeaning||null,evidenceIndependence:dynamic?.evidenceIndependence||null,
      specialStates:p?{void:p.voided,horse:p.horse,doorPressure:p.conditions.doorPressure,punishment:own?.punishment||false,tomb:!!(own?.tomb??own?.wonderTomb)}:null};
  });
  const relations=[];
  const types={generates:'generate',generated_by:'generated_by',controls:'control',controlled_by:'controlled_by',same:'same'};
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++) {
    const from=nodes[i],to=nodes[j];if(from.palace===null||to.palace===null)continue;
    const rel=analysis.relations.find(r=>r.from===from.palace&&r.to===to.palace);
    relations.push({id:`graph_${from.id}_${to.id}`,from:from.id,to:to.id,type:types[rel.kind],text:rel.text,
      fromPalace:from.palace,toPalace:to.palace,samePalace:rel.samePalace,opposite:rel.opposite,
      evidenceIds:[from.evidenceId,to.evidenceId,`p${from.palace}`,`p${to.palace}`]});
  }
  return {nodes,relations,meaning:'Quan hệ biểu tượng có chiều giữa các vai; không phải quan hệ nhân quả hoặc thứ tự thời gian đã được chứng minh.'};
}
