import {buildMenhNarrativeFromContext} from './narrative-contract.mjs';
import {atom,freezeNarrative,validateNarrativeContract} from '../../ai/narrativePrimitives.mjs';
import {palaceEvidence} from '../../ai/narrativeEvidence.mjs';

// Renderer contract only. The direct model receives the chart packet, not this
// contract's meanings or domain-by-domain synthesis tasks.
export function buildMenhWholeChartContract(context){
  const base=buildMenhNarrativeFromContext(context);
  const chartClaims=(context.boardFacts?.palaces||[]).map(p=>({
    id:'natal_palace_'+p.number,domain:'NATAL_CHART',
    evidenceIds:['natal_palace_'+p.number],ruleIds:[context.natalMeta.sourceEngineVersion||context.ruleVersion],
    certainty:'tendency',
    technicalEvidence:palaceEvidence(p,context.analysisLayers?.byPalace?.[p.number])
  }));
  const ids=chartClaims.map(c=>c.id);
  const units=base.units.map(u=>({
    ...u,claimIds:[...new Set([...u.claimIds,...ids])],
    atoms:[...u.atoms,atom(u.id+'_whole_chart_sources','Đối chiếu các cung trên cùng Mệnh bàn.',ids,{kind:'grounded_synthesis'})]
  }));
  const contract={...base,claims:[...base.claims,...chartClaims],units,
    identity:{...base.identity,reasoningMode:'whole_chart'}};
  validateNarrativeContract(contract);
  return freezeNarrative(contract);
}
