import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCompiledFixtureCorpus,validateSourceSnapshots} from '../dist/qimen/menh/source-validation.mjs';

const compiled=JSON.parse(readFileSync(new URL('./fixtures/km-menh-1.0-golden.json',import.meta.url),'utf8'));
const snapshots=JSON.parse(readFileSync(new URL('./fixtures/km-menh-source-boards/source-snapshots.json',import.meta.url),'utf8'));

test('15 audited source fixtures validate without inventing missing chart data',()=>{
  validateCompiledFixtureCorpus(compiled);
  assert.equal(validateSourceSnapshots(snapshots,compiled),snapshots);
  assert.equal(snapshots.count,15);
  assert.ok(snapshots.snapshots.every(s=>s.completeness==='PARTIAL_RULE_SNAPSHOT'));
});

test('source snapshots cannot add facts absent from the frozen fixture',()=>{
  const broken=structuredClone(snapshots);
  broken.snapshots[0].payload.inventedBirthHour='NOON';
  assert.throws(()=>validateSourceSnapshots(broken,compiled),/was not present in frozen fixture/);
});
test('Z19 remains a source-conflict rejection fixture',()=>{
  const broken=structuredClone(compiled);
  const z19=broken.fixtures.find(f=>f.id==='F-Z19-SOURCE-CONFLICT');
  z19.expect.eligibleAsGolden=true;
  assert.throws(()=>validateSourceSnapshots(snapshots,broken),/Z19 must remain a non-golden source conflict/);
});

test('LWF annual discriminators cannot be promoted to whole-chart profile fixtures',()=>{
  const broken=structuredClone(compiled);
  const fixture=broken.fixtures.find(f=>f.id==='F-LWF03-ANNUAL-TIANPAN-DING-HAI');
  fixture.chartConstructionProfile='ZHANG_ADVANCED_CLASS_LIFETIME';
  assert.throws(()=>validateSourceSnapshots(snapshots,broken),/must remain annual-layer-only/);
});

test('S5 legacy Center-5 fixture cannot be silently normalized to Advanced-Class',()=>{
  const broken=structuredClone(compiled);
  const fixture=broken.fixtures.find(f=>f.id==='F-S5-SHENQI-LEGACY-CENTER5');
  fixture.profile='ZHANG_ADVANCED_CLASS_LIFETIME';
  assert.throws(()=>validateSourceSnapshots(snapshots,broken),/S5 legacy Center-5 isolation changed/);
});
test('LWF-02 keeps explicit cross-profile rejection',()=>{
  const broken=structuredClone(compiled);
  const fixture=broken.fixtures.find(f=>f.id==='F-LWF02-PROFILE-CONFLICT-ISOLATION');
  fixture.expect.silentCrossProfileComparison='ALLOW';
  assert.throws(()=>validateSourceSnapshots(snapshots,broken),/LWF-02 profile-conflict isolation changed/);
});
