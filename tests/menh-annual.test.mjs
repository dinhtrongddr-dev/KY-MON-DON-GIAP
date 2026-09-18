import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAnnualOverlay,locateAnnualStemFromSnapshot,resolveAnnualIdentity} from '../dist/qimen/menh/annual.mjs';
const c=JSON.parse(readFileSync(new URL('./fixtures/km-menh-1.0-golden.json',import.meta.url),'utf8'));
const f=id=>c.fixtures.find(x=>x.id===id);

test('P6 annual: LWF-03/04/08 discriminate Tian-pan active stem without asserting whole-chart profile',()=>{
  for(const id of ['F-LWF03-ANNUAL-TIANPAN-DING-HAI','F-LWF04-ANNUAL-TIANPAN-BING-CHEN','F-LWF08-ANNUAL-TIANPAN-BING-ZI']){
    const x=f(id),r=locateAnnualStemFromSnapshot({annualPillar:x.input.annualPillar,heavenPlateStemPalace:x.observedNatal.heavenPlateStemPalace});
    assert.equal(r.annualStemPalace,x.expect.annualStemPalace);
    assert.equal(r.layerUsed,x.expect.layerUsed);
    assert.equal(x.expect.mustNotAssertWholeChartProfile,true);
    assert.equal(r.annualStemLayerAuthority,'TRANSMISSION_CORROBORATED');
  }
});
test('P6 annual: Jia-Shen resolves to Geng and Branch Shen maps to Kun-2',()=>{
  const x=f('F-ANNUAL-JIA-SHEN'),r=resolveAnnualIdentity(x.input.annualPillar);
  assert.equal(r.resolvedStem,x.expect.resolvedStem);
  assert.equal(r.annualBranchPalace,x.expect.annualBranchPalace);
  assert.equal(r.stemPriority,'PRIMARY');
  assert.equal(r.branchPriority,'SECONDARY');
});
test('P6 annual: annual processing creates an immutable overlay and does not mutate natal',()=>{
  const x=f('F-ANNUAL-NATAL-IMMUTABLE');
  const stem=(han)=>Object.freeze({han});
  const palaces=[
    {number:1,heavenStems:[stem('戊')]},{number:2,heavenStems:[stem('己')]},{number:3,heavenStems:[stem('丁')]},
    {number:4,heavenStems:[stem('乙')]},{number:5,heavenStems:[]},{number:6,heavenStems:[stem('丙')]},
    {number:7,heavenStems:[stem('辛')]},{number:8,heavenStems:[stem('庚')]},{number:9,heavenStems:[stem('壬')]},
  ].map(Object.freeze);
  const natal=Object.freeze({schemaVersion:'KMMenhNatal/1',specVersion:'KM-MENH-1.0',profileId:'ZHANG_ADVANCED_CLASS_LIFETIME',
    chartPersistence:'FIXED_NATAL',center5Lodging:Object.freeze({policy:'SEMANTIC_LODGING_ONLY'}),
    baseBoard:Object.freeze({schemaVersion:'QimenBoard/1',palaces:Object.freeze(palaces)})});
  const before=JSON.stringify(natal),overlay=createAnnualOverlay(natal,{annualPillar:'DING_HAI'});
  assert.equal(JSON.stringify(natal),before);
  assert.equal(overlay.natalMutation,x.expect.annualProcessingMutatesNatalChart);
  assert.equal(overlay.overlayType,'ANNUAL');
  assert.equal(overlay.annual.annualStemPalace,'ZHEN_3');
  assert.ok(Object.isFrozen(overlay));
});
