import test from 'node:test';import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createQimenBoard} from '../dist/qimen/core/board.mjs';
import {analyzeBoard} from '../dist/qimen/analysis/index.mjs';
import {analyzeMode} from '../dist/qimen/modes/index.mjs';
globalThis.Solar=createRequire(import.meta.url)('../dist/vendor/lunar.js').Solar;
const board=createQimenBoard({year:2026,month:9,day:10,hour:10,minute:0,tzOffset:7});
const analysis=analyzeBoard(board,{topic:'contract'});
test('four modes produce different computed plans from one unchanged board',()=>{
  const before=JSON.stringify(board),plans=['prediction','strategy','business','negotiation'].map(m=>analyzeMode(m,analysis));
  assert.equal(new Set(plans.map(p=>JSON.stringify(p.computed))).size,4);
  assert.deepEqual(plans.map(p=>p.chain.length),[8,8,9,9]);assert.equal(JSON.stringify(board),before);
  assert.equal(plans[2].computed.competitorComparison,'unresolved');assert.equal(plans[3].computed.concessions.priceFloor,null);
  assert.equal(plans[3].computed.posture,'discover_authority_and_needs');
});
test('computed strategies respond to actual conditions and resolved counterparties, not just labels',()=>{
  const known=analyzeBoard(board,{actors:{customer:'甲子',competitor:'乙丑'}});
  assert.notEqual(analyzeMode('negotiation',known).computed.posture,'discover_authority_and_needs');
  assert.equal(analyzeMode('business',known).computed.competitorComparison,'compare_symbolic_positions');
  const changed=JSON.parse(JSON.stringify(known));changed.palaces.forEach(p=>p.voided=true);
  assert.equal(analyzeMode('strategy',changed).computed.initiative,'prepare_and_verify');
  assert.ok(analyzeMode('prediction',changed).computed.blockers.length>0);
});
