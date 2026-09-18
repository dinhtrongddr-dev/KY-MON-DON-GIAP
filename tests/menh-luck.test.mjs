import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {activeLuckLayer,branchToPalace,buildLuckPeriods,CLOCKWISE_PALACES,luckAtAge,nextClockwisePalace} from '../dist/qimen/menh/luck.mjs';
import {createLuckOverlay} from '../dist/qimen/menh/overlay.mjs';

const corpus=JSON.parse(readFileSync(new URL('./fixtures/km-menh-1.0-golden.json',import.meta.url),'utf8'));
const fixture=id=>corpus.fixtures.find(f=>f.id===id);

test('P3: all 12 birth-year branches map to the frozen eight-palace starts',()=>{
  for(const [branch,palace] of Object.entries(fixture('F-BRANCH-TO-PALACE').cases))
    assert.equal(branchToPalace(branch),palace);
});
test('P3: clockwise palace sequence is frozen and wraps Qian to Kan',()=>{
  const expected=fixture('F-CLOCKWISE-PALACE-SEQUENCE').expect.sequence;
  assert.deepEqual([...CLOCKWISE_PALACES],expected);
  assert.deepEqual(expected.map((p,i)=>nextClockwisePalace(expected[0],i)),expected);
  assert.equal(nextClockwisePalace('QIAN_6',1),'KAN_1');
});
test('P3: Zhang Z16 starts from Si/Xun and advances one palace every 15 years',()=>{
  const f=fixture('F-Z16-LUCK-FROM-SI');
  const actual=buildLuckPeriods(f.input.birthYearBranch).map(({ages,palace})=>({ages,palace}));
  assert.deepEqual(actual,f.expect.periods);
});
test('P3: Wang Jianguo WJG-21 corroborates Hai/Qian then clockwise progression',()=>{
  const f=fixture('F-WJG21-LUCK-FROM-HAI');
  const actual=buildLuckPeriods(f.input.birthYearBranch).slice(0,5).map(({ages,palace})=>({ages,palace}));
  assert.deepEqual(actual,f.expect.firstFivePeriods);
});
test('P3: 5+5+5 boundaries switch exactly at ages 6, 11 and 16',()=>{
  const f=fixture('F-LUCK-5-5-5-BOUNDARIES').cases;
  assert.equal(luckAtAge('ZI',5).activeFiveYearLayer,f.age5);
  assert.equal(luckAtAge('ZI',6).activeFiveYearLayer,f.age6);
  assert.equal(luckAtAge('ZI',10).activeFiveYearLayer,f.age10);
  assert.equal(luckAtAge('ZI',11).activeFiveYearLayer,f.age11);
  assert.equal(luckAtAge('ZI',15).activeFiveYearLayer,f.age15);
  const age16=luckAtAge('ZI',16);
  assert.equal(age16.index,1);
  assert.equal(age16.ageWithinPeriod,1);
  assert.equal(age16.activeFiveYearLayer,f.age16.activeLayer);
  assert.equal(age16.palace,'GEN_8');
});
test('P3: luck overlay is immutable and leaves the natal view byte-equivalent',()=>{
  const natal=Object.freeze({
    schemaVersion:'KMMenhNatal/1',specVersion:'KM-MENH-1.0',
    profileId:'ZHANG_ADVANCED_CLASS_LIFETIME',chartPersistence:'FIXED_NATAL',
    center5Lodging:Object.freeze({policy:'SEMANTIC_LODGING_ONLY'}),
    baseBoard:Object.freeze({schemaVersion:'QimenBoard/1'}),
  });
  const before=JSON.stringify(natal);
  const overlay=createLuckOverlay(natal,{birthYearBranch:'HAI',age:16});
  assert.equal(JSON.stringify(natal),before);
  assert.equal(overlay.period.palace,'KAN_1');
  assert.equal(overlay.period.activeFiveYearLayer,'NINE_STAR');
  assert.equal(overlay.natal,natal);
  assert.ok(Object.isFrozen(overlay));
  assert.ok(Object.isFrozen(overlay.period));
});
test('P3: luck engine rejects age outside the frozen 1-120 scope',()=>{
  assert.throws(()=>luckAtAge('ZI',0),/1 đến 120/);
  assert.throws(()=>luckAtAge('ZI',121),/1 đến 120/);
  assert.equal(activeLuckLayer(15),'TEN_STEM_KE_YING_AND_PALACE_STATE');
});
