import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMenhReadingRequest,prepareMenhReading} from '../local/menh-reading.mjs';
import {CASE_ENGINE_VERSION} from '../dist/qimen/case/engine.mjs';

const known={birthDateLocal:'1990-01-01',birthTimeMode:'KNOWN',birthTimeLocal:'09:30',tzOffset:7,age:37,annualYear:2026,sexMetadata:'MALE'};
const unknown={birthDateLocal:'1990-01-01',birthTimeMode:'UNKNOWN',birthTimeLocal:null,tzOffset:7,age:37,annualYear:2026};

test('KM-MENH runtime builds real known-time claims with traceable evidence',()=>{
  const p=prepareMenhReading(known);
  assert.equal(p.candidateCount,1);
  assert.equal(p.result.profileId,'ZHANG_ADVANCED_CLASS_LIFETIME');
  assert.deepEqual(p.result.claims.map(c=>c.claimId),[
    'GLOBAL_STRUCTURE','SELF_CORE','FAMILY_PARENTS','FAMILY_PARENT_PAIR_ROLE','CHILDREN_CORE',
    'MARRIAGE_CORE','CAREER_CORE','WEALTH_CORE','LUCK_CURRENT','ANNUAL_CURRENT'
  ]);
  const evidenceIds=new Set(p.result.evidence.map(e=>e.evidenceId));
  assert.ok(p.result.evidence.length>=20);
  for(const claim of p.result.claims)for(const id of claim.evidenceIds)assert.ok(evidenceIds.has(id),claim.claimId+' -> '+id);
  assert.equal(p.result.annual.annualStemLayerAuthority,'TRANSMISSION_CORROBORATED');
  assert.equal(p.result.luck.ageStart,31);
  assert.equal(p.result.luck.ageEnd,45);
});
test('KM-MENH runtime resolves abstract Jia parent counterpart without locating bare Jia',()=>{
  const p=prepareMenhReading(known);
  const role=p.result.claims.find(c=>c.claimId==='FAMILY_PARENT_PAIR_ROLE');
  assert.match(role.text,/can hợp JIA/);
  assert.deepEqual(role.evidenceIds,['PARENT_PAIR_ROLE']);
});
test('UNKNOWN birth time computes 13 candidates and keeps only exact cross-candidate stability',()=>{
  const p=prepareMenhReading(unknown),s=p.result.stability;
  assert.equal(p.candidateCount,13);
  assert.equal(s.candidateCount,13);
  assert.equal(s.autoSelectedBirthHour,null);
  assert.equal(s.majorityVerdictAllowed,false);
  assert.equal(s.rectificationEnabled,false);
  assert.ok(s.stableFindings.some(x=>x.claimId==='FAMILY_PARENT_PAIR_ROLE'));
  assert.ok(s.stableFindings.some(x=>x.claimId==='LUCK_CURRENT'));
  assert.ok(s.timeSensitiveFindings.some(x=>x.claimId==='SELF_CORE'));
  assert.ok(s.timeSensitiveFindings.some(x=>x.claimId==='MARRIAGE_CORE'));
  assert.equal(p.result.claims.some(x=>x.claimId==='SELF_CORE'),false);
});
test('KM-MENH request fingerprints change when birth data changes',async()=>{
  const a=await buildMenhReadingRequest(known);
  const b=await buildMenhReadingRequest({...known,birthTimeLocal:'11:30'});
  assert.notEqual(a.deterministicFingerprint,b.deterministicFingerprint);
  assert.notEqual(a.requestFingerprint,b.requestFingerprint);
  assert.equal(a.request.rules,'KM-MENH-1.1');
  assert.equal(a.request.protocol,3);
  assert.equal(a.request.caseRules,CASE_ENGINE_VERSION);
  assert.equal(a.result.specVersion,'KM-MENH-1.0');
  assert.equal(a.result.runtimeVersion,'KM-MENH-1.1');
});
