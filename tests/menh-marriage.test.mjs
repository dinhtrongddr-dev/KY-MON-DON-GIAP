import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {marriageInspectSet,marriageResolverBundle,REQUIRED_MARRIAGE_RESOLVERS} from '../dist/qimen/menh/domains/marriage.mjs';
const c=JSON.parse(readFileSync(new URL('./fixtures/km-menh-1.0-golden.json',import.meta.url),'utf8'));
const f=id=>c.fixtures.find(x=>x.id===id);

test('P5 marriage: all five required resolvers remain active and none is universal sole primary',()=>{
  const x=f('F-MARRIAGE-BUNDLE-REQUIRED'),r=marriageResolverBundle({dayStem:'DING'});
  assert.deepEqual([...REQUIRED_MARRIAGE_RESOLVERS],x.expect.requiredResolvers);
  assert.equal(r.universalSolePrimary,x.expect.universalSolePrimary);
});
test('P5 marriage: Xin keeps Bing five-combination counterpart as active spouse evidence',()=>{
  const x=f('F-SQ16-E4-FIVE-COMBINATION-SPOUSE-ACTIVE'),r=marriageResolverBundle(x.input);
  assert.equal(r.fiveCombinationCounterpart,x.expect.fiveCombinationCounterpart);
  assert.equal(r.counterpartRemainsActiveSpouseEvidence,x.expect.counterpartRemainsActiveSpouseEvidence);
  assert.equal(r.counterpartUniversalSolePrimary,x.expect.counterpartUniversalSolePrimary);
});
test('P5 marriage: LWF-06 inspects Liu He, Yi/Geng and Ren/Ding together',()=>{
  const x=f('F-LWF06-MARRIAGE-MULTI-RESOLVER'),day=x.input.pillars[2].split('_')[0];
  assert.deepEqual([...marriageInspectSet(day)],x.expect.inspect);
  assert.equal(marriageResolverBundle({dayStem:day}).universalSolePrimary,x.expect.singleResolverDecisionAllowed);
});
