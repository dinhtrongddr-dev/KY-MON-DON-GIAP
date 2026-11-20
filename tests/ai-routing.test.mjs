import test from 'node:test';
import assert from 'node:assert/strict';
import {runAI,runAIText,aiRouteOf,AI_ROUTES,directRoute,auxEffort,DEFAULT_DIRECT_MODEL} from '../local/ai-client.mjs';
const schema={type:'object',properties:{answer:{type:'string'}},required:['answer'],additionalProperties:false};

// TG-CB-7.0 (P9): one direct route; model and effort come from env (VPS hand patch moved to source).
test('direct route reads QIMEN_DIRECT_MODEL and QIMEN_REASONING_EFFORT with safe defaults',()=>{
  assert.equal(AI_ROUTES.length,1);assert.equal(AI_ROUTES[0].provider,'prism');
  assert.deepEqual({model:directRoute({}).model,effort:directRoute({}).effort},{model:DEFAULT_DIRECT_MODEL,effort:'xhigh'});
  assert.equal(DEFAULT_DIRECT_MODEL,'gpt-6-thinking');
  const r=directRoute({QIMEN_DIRECT_MODEL:'gpt-x',QIMEN_REASONING_EFFORT:'HIGH'});
  assert.equal(r.model,'gpt-x');assert.equal(r.effort,'high');
  assert.equal(directRoute({QIMEN_REASONING_EFFORT:'bogus'}).effort,'xhigh');
  assert.equal(auxEffort({}),'high');assert.equal(auxEffort({QIMEN_AUX_REASONING_EFFORT:'medium'}),'medium');
});

test('structured calls go to the proxy with the configured model; effort can be lowered per call',async()=>{
  const calls=[];
  const prismRunner=async(_i,_x,_s,o)=>{calls.push({model:o.model,effort:o.effort});return {answer:'ok'};};
  const env={QIMEN_DIRECT_MODEL:'gpt-6-thinking',QIMEN_REASONING_EFFORT:'xhigh'};
  const main=await runAI('i',{},schema,{env,prismRunner,diagnostics:()=>{}});
  const aux=await runAI('i',{},schema,{env,prismRunner,effort:'high',diagnostics:()=>{}});
  assert.equal(main.answer,'ok');assert.equal(aiRouteOf(main).id,'direct');assert.equal(aiRouteOf(aux).effort,'high');
  assert.deepEqual(calls,[{model:'gpt-6-thinking',effort:'xhigh'},{model:'gpt-6-thinking',effort:'high'}]);
});

test('errors fail closed after one attempt and are reported to diagnostics',async()=>{
  const calls=[],diagnostics=[];
  await assert.rejects(()=>runAI('i',{},schema,{env:{},prismRunner:async()=>{calls.push(1);throw new Error('invalid output');},diagnostics:e=>diagnostics.push(e)}),/invalid output/);
  assert.equal(calls.length,1);assert.equal(diagnostics.length,1);assert.equal(diagnostics[0].fallbackAllowed,false);
});

test('text writer uses the same direct route and returns route metadata',async()=>{
  const value=await runAIText('i',{},{env:{QIMEN_DIRECT_MODEL:'m1'},prismTextRunner:async(_i,_x,o)=>`model=${o.model};effort=${o.effort}`,diagnostics:()=>{}});
  assert.equal(value.text,'model=m1;effort=xhigh');assert.equal(aiRouteOf(value).modelId,'m1');
});
