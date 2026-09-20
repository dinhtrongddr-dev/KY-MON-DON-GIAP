import test from 'node:test';
import assert from 'node:assert/strict';
import {buildTiming} from '../dist/qimen/ai/timingEngine.mjs';

const context={
  timeHorizon:{code:'duration',amount:14,unit:'day',status:'explicit_duration',text:'trong 14 ngày'},
};
const board={
  input:{year:2026,month:9,day:20,tzOffset:7},
  pillars:{day:{branch:{han:'午'}}},
  dun:'yang',fuYin:false,fanYin:false,
  horseBranch:{han:'寅'},
};
const bundle=(palace,states,actorIds=['event'])=>({
  palace,states,actorIds,evidenceIds:[`p${palace}`,`c${palace}`],
});

test('KM-YINGQI-2.0: Tam kỳ nhập mộ can open a dated response window after Void/Horse are absent',()=>{
  const t=buildTiming(context,board,[bundle(2,[{code:'tomb',detail:'乙'}])]);
  assert.equal(t.version,'KM-YINGQI-2.0');
  assert.equal(t.basis,'deterministic_response_scan_v2');
  assert.equal(t.pace.tendency,'slow');
  assert.deepEqual(t.candidates.slice(0,2).map(x=>[x.display,x.rule,x.branch]),[
    ['21/09/2026','tomb_release','未'],
    ['27/09/2026','tomb_release','丑'],
  ]);
  assert.ok(t.candidates[0].reasons.some(x=>/Mộ/.test(x)));
  assert.equal(t.signals[0].dateRuleImplemented,true);
  assert.ok(t.unsupportedRules.includes('Nhập mộ ngoài Tam kỳ định ngày'));
});

test('KM-YINGQI-2.0: trigger precedence is Void, then Horse, then Tomb',()=>{
  const all=bundle(8,[
    {code:'void'},
    {code:'horse'},
    {code:'tomb',detail:'丁'},
  ],['self','event']);
  const withVoid=buildTiming(context,board,[all]);
  assert.ok(withVoid.candidates.length);
  assert.ok(withVoid.candidates.every(x=>x.rule==='void_release'));

  const horseAndTomb=bundle(8,[{code:'horse'},{code:'tomb',detail:'丁'}],['event']);
  const withHorse=buildTiming(context,board,[horseAndTomb]);
  assert.ok(withHorse.candidates.length);
  assert.ok(withHorse.candidates.every(x=>x.rule==='horse_activation'));
});

test('KM-YINGQI-2.0: inner/outer plate and Fu/Fan Yin affect pace only, not fabricate a date',()=>{
  const fastBoard={...board,fanYin:true};
  const fast=buildTiming(context,fastBoard,[bundle(3,[],['self','event'])]);
  assert.equal(fast.pace.tendency,'fast');
  assert.deepEqual(fast.candidates,[]);
  assert.equal(fast.basis,'question_horizon_only');

  const slowBoard={...board,fuYin:true};
  const slow=buildTiming(context,slowBoard,[bundle(6,[],['self','event'])]);
  assert.equal(slow.pace.tendency,'slow');
  assert.deepEqual(slow.candidates,[]);
  assert.ok(slow.pace.signals.some(x=>x.code==='fu_yin'));
});
