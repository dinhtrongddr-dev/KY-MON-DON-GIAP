import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareReading,buildReadingRequest,READING_PROTOCOL} from '../local/reading.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';
import {normalizeNianmingInput,NIANMING_VERSION,NIANMING_PROFILE} from '../dist/qimen/analysis/nianmingEngine.mjs';

const body={
  question:'Trong 30 ngày tới, tôi có ký được hợp đồng A không?',
  topic:'contract',method:'chaibu',
  input:{year:2026,month:9,day:21,hour:10,minute:0,tzOffset:7}
};

test('KM-NIANMING-1.0 normalizes full date and year-only input but rejects malformed values',()=>{
  assert.deepEqual(normalizeNianmingInput({self:'17/07/1994',subject:'17071994',customer:'1990'}),{self:'1994-07-17',subject:'1994-07-17',customer:'1990'});
  assert.throws(()=>normalizeNianmingInput({self:'31/02/1994'}),/không hợp lệ/i);
  assert.throws(()=>normalizeNianmingInput({unknown:'1994'}),/không hợp lệ/i);
  assert.throws(()=>normalizeNianmingInput({self:'1899'}),/1900/);
});

test('full birth date resolves year pillar by Li Chun and hidden Jia instrument without replacing day stem',()=>{
  const p=prepareReading({...body,nianming:{self:'17/07/1994'}});
  const nm=p.analysis.nianming,person=nm.people.find(x=>x.id==='self');
  assert.equal(nm.version,NIANMING_VERSION);assert.equal(nm.profile,NIANMING_PROFILE);
  assert.equal(person.status,'resolved');assert.equal(person.yearPillar.han,'甲戌');
  assert.equal(person.yearStem,'甲');assert.equal(person.effectiveStem,'己');assert.equal(person.hiddenJia,true);
  assert.equal(person.corroboratorOnly,true);assert.equal(person.verdictEligible,false);assert.equal(person.scoringEligible,false);
  assert.equal(p.analysis.roles.find(r=>r.id==='self').stem,p.context.allInOne.board.pillars.day.stem.han);
  assert.notEqual(p.analysis.roles.find(r=>r.id==='self').basis,person.evidenceId);
});

test('Li Chun boundary day fails closed when birth hour is unavailable',()=>{
  const before=prepareReading({...body,nianming:{self:'03/02/1994'}}).analysis.nianming.people[0];
  const boundary=prepareReading({...body,nianming:{self:'04/02/1994'}}).analysis.nianming.people[0];
  const after=prepareReading({...body,nianming:{self:'05/02/1994'}}).analysis.nianming.people[0];
  assert.equal(before.yearPillar.han,'癸酉');
  assert.equal(boundary.status,'boundary_ambiguous');
  assert.deepEqual(boundary.possiblePillars.map(x=>x.han),['癸酉','甲戌']);
  assert.equal(boundary.palace,null);
  assert.equal(after.yearPillar.han,'甲戌');
});

test('year-only input is usable but explicitly warns about pre-Li-Chun ambiguity',()=>{
  const person=prepareReading({...body,nianming:{self:'1994'}}).analysis.nianming.people[0];
  assert.equal(person.status,'resolved');assert.equal(person.inputPrecision,'year_only');assert.equal(person.yearPillar.han,'甲戌');
  assert.match(person.limitations.join(' '),/trước Lập Xuân/i);
});

test('birth branch is secondary reference while year stem is the current-board locator',()=>{
  const person=prepareReading({...body,nianming:{self:'17/07/1994'}}).analysis.nianming.people[0];
  assert.equal(person.yearBranch,'戌');
  assert.equal(person.branchReference.branch,'戌');
  assert.equal(person.branchReference.palace,6);
  assert.notEqual(person.branchReference.palace,person.palace);
});

test('adding Nian Ming cannot alter Yongshen roles, selected evidence or primary judgment',()=>{
  const base=prepareReading(body),withNm=prepareReading({...body,nianming:{self:'17/07/1994'}});
  const roleShape=p=>p.analysis.roles.map(r=>({id:r.id,palace:r.palace,stem:r.stem,status:r.status,tier:r.yongshenTier,order:r.yongshenOrder}));
  assert.deepEqual(roleShape(withNm),roleShape(base));
  assert.deepEqual(withNm.context.allInOne.reasoning.evidenceBundles,base.context.allInOne.reasoning.evidenceBundles);
  assert.deepEqual(withNm.context.allInOne.reasoning.primaryJudgment,base.context.allInOne.reasoning.primaryJudgment);
  const nmClaim=withNm.context.allInOne.reasoning.claims.find(c=>c.id==='claim_nianming_self');
  assert.equal(nmClaim.status,'corroboration_only');assert.equal(nmClaim.priority,0);assert.deepEqual(nmClaim.ruleIds,['rule_nianming_v1']);
  assert.equal(withNm.context.allInOne.reasoning.likelyScenario.primaryJudgment.claimIds.includes(nmClaim.id),false);
});

test('Nian Ming for an unresolved counterparty does not resolve that actor or become decisive',()=>{
  const p=prepareReading({...body,question:'Khách hàng A có đồng ý ký hợp đồng không?',nianming:{customer:'1988-08-20'}});
  const customer=p.analysis.roles.find(r=>r.id==='customer');
  const person=p.analysis.nianming.people.find(x=>x.id==='customer');
  const claim=p.context.allInOne.reasoning.claims.find(c=>c.id==='claim_nianming_customer');
  assert.equal(customer.status,'unresolved');assert.equal(customer.palace,null);
  assert.equal(person.active,true);assert.equal(person.linkedRoleStatus,'unresolved');
  assert.equal(claim.status,'corroboration_only');
  assert.equal(p.context.allInOne.reasoning.primaryJudgment.claimIds.includes(claim.id),false);
});

test('unmentioned third-party Nian Ming remains displayable metadata but is not exposed as an active AI claim',()=>{
  const p=prepareReading({...body,nianming:{competitor:'1988'}});
  const person=p.analysis.nianming.people.find(x=>x.id==='competitor');
  assert.equal(person.status,'resolved');assert.equal(person.active,false);
  assert.equal(p.context.allInOne.reasoning.claims.some(c=>c.id==='claim_nianming_competitor'),false);
});

test('writer receives derived Nian Ming only and never receives raw birth date',()=>{
  const p=prepareReading({...body,nianming:{self:'17/07/1994'}});
  const writer=buildWriterContext(p.context),json=JSON.stringify(writer);
  assert.equal(writer.readingGraph.nianmingProfile.version,'KM-NIANMING-1.0');
  assert.match(json,/Giáp Tuất/);
  assert.doesNotMatch(json,/17\/07\/1994|1994-07-17/);
  assert.equal(writer.readingGraph.nianmingProfile.policy.primaryOverrideAllowed,false);
  assert.equal(writer.readingGraph.nianmingProfile.policy.evidenceScoreAllowed,false);
});

test('protocol 7 request round-trip binds Nian Ming and changes only request fingerprint, not chart fingerprint',async()=>{
  const base=await buildReadingRequest(body);
  const nm=await buildReadingRequest({...body,nianming:{self:'17/07/1994',customer:'1990'}});
  assert.equal(READING_PROTOCOL,7);assert.equal(nm.request.protocol,7);assert.equal(nm.request.nianmingRules,'KM-NIANMING-1.0');
  assert.equal(nm.chartFingerprint,base.chartFingerprint);
  assert.notEqual(nm.requestFingerprint,base.requestFingerprint);
  assert.deepEqual(nm.request.nianming,{self:'1994-07-17',customer:'1990'});
  const round=await buildReadingRequest(nm.request);
  assert.equal(round.requestFingerprint,nm.requestFingerprint);
});

test('UI contract exposes optional birth/year fields and marks Nian Ming as corroboration, not severity',async()=>{
  const {readFile}=await import('node:fs/promises');
  const [html,app,css]=await Promise.all([
    readFile(new URL('../dist/index.html',import.meta.url),'utf8'),
    readFile(new URL('../dist/app.mjs',import.meta.url),'utf8'),
    readFile(new URL('../dist/styles.css',import.meta.url),'utf8')
  ]);
  for(const id of ['nianming-self','nianming-subject','nianming-customer','nianming-competitor','nianming-decisionMaker'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/Niên Can Chi/);
  assert.match(app,/role-nianming/);assert.match(app,/Niên Mệnh không đổi Nhật can, Dụng Thần chính, màu cảnh báo hoặc kết luận/);
  assert.match(css,/\.nianming-card/);assert.match(css,/\.role-nianming/);
});
