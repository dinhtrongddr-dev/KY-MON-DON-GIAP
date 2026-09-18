import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertClaimTransition,assertNoProhibitedOutput,createClaim,OPTIONAL_TRANSMISSION_DEFAULT_OFF,validateMenhResult,validateOptionalTransmission} from '../dist/qimen/menh/audit.mjs';
import {classifyCandidateDirections,unknownBirthTimeGuard} from '../dist/qimen/menh/stability.mjs';
const c=JSON.parse(readFileSync(new URL('./fixtures/km-menh-1.0-golden.json',import.meta.url),'utf8'));
const f=id=>c.fixtures.find(x=>x.id===id);

test('P7: natal tendency cannot auto-promote to observed event',()=>{
  const x=f('F-S1-TENDENCY-NOT-EVENT');
  assert.equal(x.expect.natalAdverseSymbolismClaimType,'NATAL_TENDENCY');
  assert.throws(()=>assertClaimTransition('NATAL_TENDENCY','OBSERVED_EVENT'),/không được tự nâng/);
  assert.equal(assertClaimTransition('NATAL_TENDENCY','OBSERVED_EVENT',{observedFact:true}),true);
});
test('P7: every frozen prohibited output tag is rejected',()=>{
  const x=f('F-PROHIBITED-OUTPUTS');
  for(const tag of x.reject)assert.throws(()=>assertNoProhibitedOutput([tag]),new RegExp(tag));
});
test('P7: optional transmission remains disabled by default',()=>{
  const x=f('F-OPTIONAL-TRANSMISSION-OFF-BY-DEFAULT');
  assert.deepEqual([...OPTIONAL_TRANSMISSION_DEFAULT_OFF],x.expectDisabled);
  assert.equal(validateOptionalTransmission({}),true);
  assert.throws(()=>validateOptionalTransmission({[x.expectDisabled[0]]:true}),/mặc định phải tắt/);
});
test('P7: rendered claims require ruleIds/evidenceIds and result serializes profile + annual authority',()=>{
  const x=f('F-TRACEABILITY');
  assert.throws(()=>createClaim({claimId:'x',type:'NATAL_TENDENCY',ruleIds:[],evidenceIds:['E1']}),/ruleIds/);
  assert.throws(()=>createClaim({claimId:'x',type:'NATAL_TENDENCY',ruleIds:['R1'],evidenceIds:[]}),/evidenceIds/);
  const claim=createClaim({claimId:'C1',type:'NATAL_TENDENCY',text:'x',ruleIds:['R1'],evidenceIds:['E1']});
  const result={profileId:'ZHANG_ADVANCED_CLASS_LIFETIME',claims:[claim],annual:{annualStemLayerAuthority:'TRANSMISSION_CORROBORATED'}};
  assert.equal(validateMenhResult(result),result);
  assert.equal(x.expect.everyRenderedClaimHasRuleIds,true);
  assert.equal(x.expect.everyRenderedClaimHasEvidenceIds,true);
  assert.equal(x.expect.profileIdSerialized,true);
  assert.equal(x.expect.annualStemLayerAuthoritySerializedWhenAnnualUsed,true);
});
test('P7 UNKNOWN: mixed candidate directions are TIME_SENSITIVE, never majority verdict',()=>{
  const x=f('F-BIRTHTIME-UNKNOWN-STABILITY-NO-VOTE'),r=classifyCandidateDirections(x.input.candidateDirections);
  assert.equal(r.classification,x.expect.classification);
  assert.equal(r.majorityVerdictAllowed,x.expect.majorityVerdictAllowed);
});
test('P7 UNKNOWN: no automatic rectification or exact-hour claim',()=>{
  const x=f('F-BIRTHTIME-UNKNOWN-NO-AUTO-RECTIFICATION'),r=unknownBirthTimeGuard();
  assert.equal(r.autoSelectedBirthHour,x.expect.autoSelectedBirthHour);
  assert.equal(r.exactHourClaimAllowed,x.expect.exactHourClaimAllowed);
  assert.equal(r.rectificationEnabled,x.expect.rectificationEnabled);
});
