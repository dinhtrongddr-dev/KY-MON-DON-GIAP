import test from 'node:test';
import assert from 'node:assert/strict';
import {runAI,aiRouteOf,AI_ROUTES,REASONING_EFFORT} from '../local/ai-client.mjs';
const schema={type:'object',properties:{answer:{type:'string'}},required:['answer'],additionalProperties:false};
test('AI fallback order is Astra then Gemini, always xhigh',async()=>{
  const calls=[];
  const codexRunner=async(_i,_x,_s,options)=>{calls.push({model:options.model,effort:options.effort});if(calls.length===1)throw new Error('route down');return {answer:'ok'};};
  const value=await runAI('i',{},schema,{codexRunner});
  assert.equal(value.answer,'ok');assert.equal(aiRouteOf(value).id,'gemini');assert.equal(aiRouteOf(value).fallbackIndex,1);
  assert.deepEqual(calls,[{model:'cx/gpt-6-astra',effort:'xhigh'},{model:'gemini/gemini-3.6-flash',effort:'xhigh'}]);
  assert.equal(REASONING_EFFORT,'xhigh');assert.equal(AI_ROUTES.length,2);
});
test('routing fails closed after both supported routes fail',async()=>{
  const calls=[];
  await assert.rejects(()=>runAI('i',{},schema,{codexRunner:async(_i,_x,_s,o)=>{calls.push(o.model);throw new Error('down');}}),/Astra và Gemini/);
  assert.deepEqual(calls,['cx/gpt-6-astra','gemini/gemini-3.6-flash']);
});
