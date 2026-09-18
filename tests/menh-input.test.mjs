import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MenhInputError,normalizeBirthInput} from '../dist/qimen/menh/input.mjs';
import {UNKNOWN_DOUBLE_HOUR_FAMILIES,buildBirthTimeCandidates} from '../dist/qimen/menh/candidates.mjs';

const corpus=JSON.parse(readFileSync(new URL('./fixtures/km-menh-1.0-golden.json',import.meta.url),'utf8'));
const fixture=id=>corpus.fixtures.find(f=>f.id===id);

test('P2A: KNOWN rejects a missing birth time with the frozen reason code',()=>{
  const f=fixture('F-BIRTHTIME-KNOWN-REQUIRES-TIME');
  assert.throws(()=>normalizeBirthInput({...f.input,birthDateLocal:'2000-01-01'}),error=>
    error instanceof MenhInputError&&error.code===f.expect.reasonCode);
});
test('P2A: UNKNOWN always nulls a previously entered UI time and injects no default',()=>{
  const f=fixture('F-BIRTHTIME-UNKNOWN-NULLS-TIME');
  const normalized=normalizeBirthInput({birthDateLocal:'2000-01-01',birthTimeMode:f.input.birthTimeMode,birthTimeLocal:f.input.previousUiTime});
  assert.equal(normalized.birthTimeLocal,f.expect.submittedBirthTimeLocal);
  assert.equal(normalized.birthTimeLocal===null,true);
});
test('P2A: UNKNOWN covers all 12 double-hour families with 13 executable boundary candidates',()=>{
  const f=fixture('F-BIRTHTIME-UNKNOWN-CANDIDATE-COVERAGE');
  const result=buildBirthTimeCandidates({birthDateLocal:f.input.civilBirthDate,birthTimeMode:'UNKNOWN',birthTimeLocal:null});
  assert.deepEqual([...UNKNOWN_DOUBLE_HOUR_FAMILIES],f.expect.doubleHourFamilies);
  assert.equal(result.familyCount,f.expect.familyCount);
  assert.ok(result.executableCandidateCount>=f.expect.candidateCountMin);
  assert.ok(result.executableCandidateCount<=f.expect.candidateCountMax);
  assert.equal(new Set(result.candidates.map(c=>c.family)).size,12);
});
test('P2A: UNKNOWN preserves both Zi segments across the 23:00 day-pillar boundary',()=>{
  const f=fixture('F-BIRTHTIME-UNKNOWN-23H-BOUNDARY');
  const result=buildBirthTimeCandidates({birthDateLocal:'2000-01-01',birthTimeMode:'UNKNOWN'});
  const zi=result.candidates.filter(c=>c.family==='ZI');
  assert.equal(zi.length,2);
  assert.deepEqual(zi.map(c=>c.variant),['EARLY_ZI','LATE_ZI']);
  assert.notEqual(zi[0].dayPillarBoundary,zi[1].dayPillarBoundary);
  assert.equal(f.expect.collapseDifferentDayPillars,false);
});
test('P2A: KNOWN creates exactly one candidate from the entered time',()=>{
  const result=buildBirthTimeCandidates({birthDateLocal:'2000-01-01',birthTimeMode:'KNOWN',birthTimeLocal:'09:42',timezone:'Asia/Ho_Chi_Minh'});
  assert.equal(result.executableCandidateCount,1);
  assert.equal(result.candidates[0].birthTimeLocal,'09:42');
  assert.equal(result.candidates[0].timezone,'Asia/Ho_Chi_Minh');
});
