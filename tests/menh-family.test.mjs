import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gengParentPattern,parentPairRolesFromPolarity,resolveParentPair} from '../dist/qimen/menh/domains/family.mjs';
import {childrenResolver} from '../dist/qimen/menh/domains/children.mjs';
const c=JSON.parse(readFileSync(new URL('./fixtures/km-menh-1.0-golden.json',import.meta.url),'utf8'));
const f=id=>c.fixtures.find(x=>x.id===id);

test('P5 family: direct Zhang Yang Year-Stem parent pairing stays corroborative',()=>{
  const x=f('F-DIRECT-ZHANG-PARENT-PAIR-YANG'),r=resolveParentPair(x.input);
  for(const k of ['yearStemRole','pairedStem','pairedStemRole','resolverRole','soleParentResolver'])assert.equal(r[k],x.expect[k]);
  assert.equal(r.aggregateResolver,'YEAR_STEM_PARENT_AGGREGATE');
});
test('P5 family: Yin Year-Stem reverses father/mother roles without becoming sole resolver',()=>{
  const x=f('F-PARENT-PAIR-YIN-INVARIANT'),r=parentPairRolesFromPolarity(x.input.yearStemPolarity);
  assert.deepEqual(r,x.expect);
});
test('P5 family: Geng in Qian/Kun is a strong traditional pattern, never a death claim',()=>{
  const x=f('F-GENG-QIAN-KUN-GUARD');
  assert.equal(gengParentPattern('QIAN_6').target,x.cases.GENG_IN_QIAN.target);
  assert.equal(gengParentPattern('KUN_2').target,x.cases.GENG_IN_KUN.target);
  for(const p of ['QIAN_6','KUN_2']){
    const r=gengParentPattern(p);
    assert.equal(r.evidenceClass,x.expect.evidenceClass);
    assert.equal(r.deterministicDeathClaim,x.expect.deterministicDeathClaim);
  }
});
test('P5 children: Hour Stem is primary but shared self-process evidence cannot double-vote',()=>{
  const r=childrenResolver();
  assert.equal(r.primary,'HOUR_STEM');
  assert.equal(r.compareWith,'DAY_STEM');
  assert.equal(r.duplicateEvidenceVote,false);
});
