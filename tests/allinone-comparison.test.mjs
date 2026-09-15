import test from 'node:test';import assert from 'node:assert/strict';
import {prepareReading,buildReadingRequest,validateReading} from '../local/reading.mjs';
import {generateQimen} from '../dist/qimen/core/board.mjs';
import {rankCandidates} from '../dist/qimen/modes/actionRules.mjs';
import {readingFixture} from './reading-fixture.mjs';
const body={question:'Ngày nào nên gửi báo giá?',mode:'timing',action:'quote',topic:'contract',method:'chaibu',input:{year:2026,month:9,day:10,hour:10,minute:0,tzOffset:7},candidates:['2026-09-14T09:00','2026-09-15T14:00','2026-09-16T10:30']};
test('timing computes multiple distinct boards with one preserved core and a fixed self representative',()=>{
  for(const method of ['chaibu','maoshan']) {
    const p=prepareReading({...body,method}),c=p.context.allInOne.comparison;
    assert.equal(c.candidates.length,3);assert.equal(new Set(c.candidates.map(x=>x.dateTime)).size,3);
    for(const candidate of c.candidates){
      const legacy=generateQimen(candidate.input,method);
      assert.deepEqual(candidate.board.pillars,legacy.pillars);assert.equal(candidate.board.ju,legacy.dun.ju);
      assert.deepEqual(candidate.board.palaces.map(x=>x.heavenStems),legacy.palaces.map(x=>x.heavenStems.map(s=>s.han)));
      assert.equal(candidate.rolePalaces.find(r=>r.id==='self').basis,p.chart.pillars.day.han);
    }
    assert.equal(validateReading(readingFixture(p),p.facts,'contract',p.context).comparisons.length,3);
  }
});
test('changing candidates/action changes request identity but not the question board',async()=>{
  const p=await buildReadingRequest(body);
  const roundtrip=await buildReadingRequest(p.request);assert.equal(roundtrip.requestFingerprint,p.requestFingerprint);
  for(const change of [{action:'meet'},{candidates:['2026-09-14T09:01',...body.candidates.slice(1)]}]) {
    const other=await buildReadingRequest({...body,...change});assert.equal(other.chartFingerprint,p.chartFingerprint);assert.notEqual(other.requestFingerprint,p.requestFingerprint);
  }
});
test('candidate validation rejects missing, duplicate, impossible dates and unbounded work',()=>{
  for(const candidates of [undefined,[],['2026-09-14T09:00'],Array(13).fill('2026-09-14T09:00'),
    ['2026-09-14T09:00','2026-09-14 09:00'],['2026-02-30T09:00','2026-09-14T09:00'],['invalid','2026-09-14T09:00']])assert.throws(()=>prepareReading({...body,candidates}));
  assert.throws(()=>prepareReading({...body,action:'invented'}));
});
test('direction compares all eight directions with explicit tie ranks and no centre direction',()=>{
  const p=prepareReading({...body,mode:'direction',direction:{origin:'Văn phòng',kind:'movement'}}),rows=p.context.allInOne.plan.computed.ranking;
  assert.equal(rows.length,8);assert.ok(rows.every(r=>r.palace!==5));
  assert.equal(new Set(rows.map(r=>r.label)).size,8);
  const tied=rankCandidates([{id:'a',blockers:[],fit:2},{id:'b',blockers:[],fit:2},{id:'c',blockers:['x'],fit:3}]);
  assert.deepEqual(tied.map(r=>r.rank),[1,1,2]);
  const valid=readingFixture(p);assert.equal(validateReading(valid,p.facts,'contract',p.context),valid);
  valid.comparisons[0].id='direction_5';assert.throws(()=>validateReading(valid,p.facts,'contract',p.context));
});
test('AI cannot omit other candidate comparisons or add a fabricated time',()=>{
  const p=prepareReading(body);
  for(const mutate of [r=>r.comparisons.pop(),r=>r.comparisons[0].id='timing_99']) {
    const r=readingFixture(p);mutate(r);assert.throws(()=>validateReading(r,p.facts,'contract',p.context));
  }
});
