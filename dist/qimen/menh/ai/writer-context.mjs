import {validateMenhResult} from '../audit.mjs';
import {MENH_RULE_VERSION,MENH_PROTOCOL} from '../../../menh-core.mjs';

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};

export function buildMenhWriterContext(result,{birthTimeMode='KNOWN',stability=null}={}){
  validateMenhResult(result);
  const claims=result.claims.map(c=>({
    claimId:c.claimId,type:c.type,domain:c.domain,text:c.text,ruleIds:[...c.ruleIds],evidenceIds:[...c.evidenceIds],
  }));
  const evidenceIds=[...new Set(claims.flatMap(c=>c.evidenceIds))];
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
    annual:result.annual,
    claims,
    evidence:(result.evidence||[]).filter(e=>evidenceIds.includes(e.evidenceId)).map(e=>({evidenceId:e.evidenceId,ruleId:e.ruleId,domain:e.domain,palace:e.palace,mechanism:e.mechanism,effectTag:e.effectTag,severity:e.severity,summary:e.metadata?.summary||null,relation:e.relation||null})),
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
