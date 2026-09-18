import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildSelfCoreEvidence,createEvidence,createGlobalHardEvidence,dedupeEvidence,evidenceDedupeKey,resolveSelfIdentity} from '../dist/qimen/menh/evidence.mjs';
import {synthesizeEvidence} from '../dist/qimen/menh/synthesis.mjs';

const corpus=JSON.parse(readFileSync(new URL('./fixtures/km-menh-1.0-golden.json',import.meta.url),'utf8'));
const fixture=id=>corpus.fixtures.find(f=>f.id===id);
const palace=(number,element)=>({number,element});

test('P4: Z16 resolves Day Stem as self and requires Zhi Fu/Zhi Shi baseline',()=>{
  const f=fixture('F-Z16-DAY-STEM-SELF'),actual=resolveSelfIdentity({pillars:f.input.pillars});
  assert.equal(actual.selfStem,f.expect.selfStem);
  assert.equal(actual.selfResolver,f.expect.selfResolver);
  assert.equal(actual.requireZhiFuZhiShiBaseline,f.expect.requireZhiFuZhiShiBaseline);
});
test('P4: self core contains Day, Zhi Fu, Zhi Shi and one Hour-Day baseline',()=>{
  const evidence=buildSelfCoreEvidence({
    dayStemPalace:palace(7,'Kim'),hourStemPalace:palace(4,'Mộc'),
    zhiFuPalace:palace(1,'Thủy'),zhiShiPalace:palace(9,'Hỏa'),
  });
  assert.deepEqual(evidence.map(e=>e.mechanism).sort(),[
    'DAY_STEM_PALACE','HOUR_STEM_VS_DAY_STEM','ZHI_FU_VS_SELF','ZHI_SHI_VS_SELF'
  ].sort());
  const hour=evidence.find(e=>e.mechanism==='HOUR_STEM_VS_DAY_STEM');
  assert.equal(hour.ruleId,'KMZ-SELF-003');
  assert.equal(hour.aliasCount,1);
});
test('P4: Hour Stem baseline is reusable for children but never becomes a second evidence vote',()=>{
  const f=fixture('F-Z17-HOUR-DAY-BASELINE');
  assert.equal(f.expect.hourStemUsedForChildren,true);
  assert.equal(f.expect.hourStemAlsoUsedInSelfProcessBaseline,true);
  assert.equal(f.expect.duplicateEvidenceVote,false);
  const key=evidenceDedupeKey({domain:'SELF',palace:'4',mechanism:'HOUR_STEM_VS_DAY_STEM'});
  const one=createEvidence({evidenceId:'HOUR_GENERAL',ruleId:'KMZ-SELF-003',sourceTier:'A1',provenance:'DIRECT_ZHANG',
    domain:'SELF',palace:'4',mechanism:'HOUR_STEM_VS_DAY_STEM',effectTag:'GENERAL_PROCESS_BASELINE',
    severity:'INFO',priorityClass:'SELF_CORE',dedupeKey:key});
  const alias=createEvidence({evidenceId:'HOUR_CHILD_ALIAS',ruleId:'KMZ-CHILD-001',sourceTier:'A1',provenance:'DIRECT_ZHANG',
    domain:'SELF',palace:'4',mechanism:'HOUR_STEM_VS_DAY_STEM',effectTag:'GENERAL_PROCESS_BASELINE',
    severity:'INFO',priorityClass:'SELF_CORE',dedupeKey:key});
  const deduped=dedupeEvidence([one,alias]);
  assert.equal(deduped.length,1);
  assert.equal(deduped[0].rawVoteWeight,1);
  assert.equal(deduped[0].aliasCount,2);
});
test('P4: same-palace aliases are deduped instead of inflating confidence',()=>{
  const f=fixture('F-EVIDENCE-DEDUP');
  const list=f.input.evidence.map((x,i)=>createEvidence({
    evidenceId:'ALIAS_'+i,ruleId:'KMZ-EVID-001',sourceTier:'DERIVED',provenance:'DERIVED_INVARIANT',
    domain:'SELF',palace:x.palace,mechanism:x.mechanism,effectTag:'ALIAS',severity:'INFO',priorityClass:'SELF_CORE',
  }));
  const out=dedupeEvidence(list);
  assert.equal(out.length,1);
  assert.equal(out[0].aliasCount,2);
  assert.equal(out[0].rawVoteWeight,1);
  assert.equal(f.expect.rawCountConfidenceInflation,false);
});
test('P4: Z18 global hard evidence precedes and can cap favorable local evidence without veto',()=>{
  const f=fixture('F-Z18-GLOBAL-HARD-PRECEDENCE');
  const hard=createGlobalHardEvidence({
    evidenceId:'FU_YIN_GLOBAL',ruleId:'KMZ-GLOBAL-001',sourceTier:'A1',provenance:'DIRECT_ZHANG',
    mechanism:'FU_YIN',effectTag:'GLOBAL_CONSTRAINT',severity:'HARD',sourceBacked:true,affectedDomains:['SELF']
  });
  const favorable=createEvidence({
    evidenceId:'KAI_MEN_LOCAL',ruleId:'KMZ-SELF-001',sourceTier:'A1',provenance:'DIRECT_ZHANG',
    domain:'SELF',palace:'7',mechanism:'KAI_MEN_LOCAL',effectTag:'LOCAL_SUPPORT',severity:'SOFT',
    priorityClass:'SELF_CORE',favorable:true,
  });
  const result=synthesizeEvidence([favorable,hard],{domain:'SELF'});
  assert.equal(result.globalHardStructureEvaluatedBeforeDomainSynthesis,f.expect.globalHardStructureEvaluatedBeforeDomainSynthesis);
  assert.equal(result.favorableLocalSignalsMayBeCapped,f.expect.favorableLocalSignalsMayBeCapped);
  assert.equal(result.automaticBadFateVeto,f.expect.automaticBadFateVeto);
  assert.equal(result.rawVoteCounting,f.expect.rawVoteCounting);
  assert.equal(result.evidence.find(e=>e.evidenceId==='KAI_MEN_LOCAL').synthesisStatus,'CAPPED_BY_GLOBAL_HARD');
});
test('P4: global hard structure fails closed without source, severity or affected domains',()=>{
  const base={evidenceId:'X',ruleId:'KMZ-GLOBAL-001',sourceTier:'A1',provenance:'DIRECT_ZHANG',
    mechanism:'FU_YIN',effectTag:'GLOBAL_CONSTRAINT',severity:'HARD',sourceBacked:true,affectedDomains:['SELF']};
  assert.throws(()=>createGlobalHardEvidence({...base,sourceBacked:false}),/phải có nguồn/);
  assert.throws(()=>createGlobalHardEvidence({...base,severity:'MEDIUM'}),/HIGH hoặc HARD/);
  assert.throws(()=>createGlobalHardEvidence({...base,affectedDomains:[]}),/khai báo domain/);
});
