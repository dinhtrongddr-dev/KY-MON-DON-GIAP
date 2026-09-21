import test from 'node:test';
import assert from 'node:assert/strict';
import {buildTiming,TIMING_VERSION} from '../dist/qimen/ai/timingEngine.mjs';

const context={timeHorizon:{code:'duration',amount:14,unit:'day',status:'explicit_duration',text:'trong 14 ngày'}};
const board={
  input:{year:2026,month:9,day:20,tzOffset:7},
  pillars:{day:{branch:{han:'午'}}},
  dun:'yang',fuYin:false,fanYin:false,
  horseBranch:{han:'寅'},
};
const bundle=(palace,states,{actorIds=['event'],roles=[]}={})=>({
  palace,states,actorIds,roles,evidenceIds:[`p${palace}`,`c${palace}`,`structure_${palace}`],
});

test('Phase 13 dates a Six-Register tomb outside the old Three-Wonder-only scope',()=>{
  const t=buildTiming(context,board,[bundle(6,[{code:'tomb',detail:'戊'}])]);
  assert.equal(t.version,TIMING_VERSION);
  assert.equal(t.basis,'deterministic_response_scan_v3');
  assert.deepEqual(t.candidates.slice(0,2).map(x=>[x.display,x.rule,x.branch]),[
    ['24/09/2026','tomb_release','戌'],
    ['30/09/2026','tomb_release','辰'],
  ]);
  assert.equal(t.signals.find(x=>x.code==='tomb').dateRuleImplemented,true);
});

test('Phase 13 gives Kích Hình its own deterministic response rule',()=>{
  const t=buildTiming(context,board,[bundle(3,[{code:'punishment',detail:'戊'}])]);
  assert.ok(t.candidates.length);
  assert.ok(t.candidates.every(x=>x.rule==='punishment_response'));
  assert.equal(t.candidates[0].display,'27/09/2026');
  assert.equal(t.candidates[0].branch,'丑');
  assert.match(t.candidates[0].reasons[0],/Kích Hình/);
  assert.equal(t.signals.find(x=>x.code==='punishment').dateRuleImplemented,true);
});

test('Phase 13 resolves a Six-Register hidden-branch clash into the classical harmony target',()=>{
  const roles=[{id:'event',stem:'戊',yongshenTier:'primary'}];
  const t=buildTiming(context,board,[bundle(9,[],{roles})]);
  assert.ok(t.instrumentResponses.some(x=>x.stem==='戊'&&x.relation==='clash'&&x.targetBranch==='丑'));
  assert.ok(t.candidates.length);
  assert.ok(t.candidates.every(x=>x.rule==='instrument_branch_response'));
  assert.equal(t.candidates[0].display,'27/09/2026');
  assert.equal(t.candidates[0].branch,'丑');
});

test('Phase 13 priority is explicit: Void then Kích Hình before Horse/Tomb',()=>{
  const states=[
    {code:'void'},
    {code:'punishment',detail:'戊'},
    {code:'horse'},
    {code:'tomb',detail:'戊'},
  ];
  const withVoid=buildTiming(context,board,[bundle(3,states)]);
  assert.ok(withVoid.candidates.every(x=>x.rule==='void_release'));
  const withoutVoid=buildTiming(context,board,[bundle(3,states.slice(1))]);
  assert.ok(withoutVoid.candidates.every(x=>x.rule==='punishment_response'));
});

test('Phase 13 still refuses to fabricate dates from Fu/Fan Yin or vague Star-Door response wording',()=>{
  const t=buildTiming(context,{...board,fuYin:true},[bundle(6,[])]);
  assert.deepEqual(t.candidates,[]);
  assert.ok(t.pace.signals.some(x=>x.code==='fu_yin'&&x.dateRuleImplemented===false));
  assert.ok(t.unsupportedRules.some(x=>/Tinh–Môn/.test(x)));
  assert.ok(t.unsupportedRules.some(x=>/Phản\/Phục/.test(x)));
});
