import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {careerResolverContract} from '../dist/qimen/menh/domains/career.mjs';
const c=JSON.parse(readFileSync(new URL('./fixtures/km-menh-1.0-golden.json',import.meta.url),'utf8'));
test('P5 career: self Star/Door + Kai primary comparison + Du corroborator, no numeric score',()=>{
  const x=c.fixtures.find(f=>f.id==='F-CAREER-OPEN-DOOR'),r=careerResolverContract();
  for(const [k,v] of Object.entries(x.expect))assert.equal(r[k],v);
});
