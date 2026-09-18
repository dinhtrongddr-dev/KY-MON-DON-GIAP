import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fiveCombinationCounterpart,resolveAbstractStem,resolvePillarStem} from '../dist/qimen/menh/resolvers.mjs';

const corpus=JSON.parse(readFileSync(new URL('./fixtures/km-menh-1.0-golden.json',import.meta.url),'utf8'));
const fixture=id=>corpus.fixtures.find(f=>f.id===id);

test('P2: five-stem combinations match the frozen fixture',()=>{
  for(const [stem,expected] of Object.entries(fixture('F-FIVE-STEM-COMBOS').cases))
    assert.equal(fiveCombinationCounterpart(stem),expected);
});
test('P2: six Jia hidden instruments match the frozen fixture',()=>{
  for(const [pillar,expected] of Object.entries(fixture('F-SIX-JIA-HIDDEN-INSTRUMENTS').cases)){
    const [,branch]=pillar.split('_');
    assert.equal(resolvePillarStem('JIA',branch),expected);
  }
});
test('P2: abstract Jia resolves to the Zhi-Fu proxy without inventing a branch',()=>{
  const f=fixture('F-ABSTRACT-JIA-PROXY');
  assert.equal(resolveAbstractStem(f.input.stem),f.expect.resolved);
  assert.throws(()=>resolvePillarStem('JIA',null),/trụ Giáp cần/);
});
