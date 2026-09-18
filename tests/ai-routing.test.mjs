import test from 'node:test';
import assert from 'node:assert/strict';
import {runAI,aiRouteOf,AI_ROUTES,REASONING_EFFORT} from '../local/ai-client.mjs';
const schema={type:'object',properties:{answer:{type:'string'}},required:['answer'],additionalProperties:false};

test('AI fallback order is Astra then Gemini, always xhigh',async()=>{
  const calls=[];
  const codexRunner=async(_i,_x,_s,options)=>{calls.push({kind:'codex',model:options.model,effort:options.effort});if(calls.length===1)throw new Error('route down');return {answer:'ok'};};
  const prismRunner=async()=>{calls.push({kind:'prism'});return {answer:'prism'};};
  const value=await runAI('i',{},schema,{codexRunner,prismRunner});
  assert.equal(value.answer,'ok');assert.equal(aiRouteOf(value).id,'gemini');assert.equal(aiRouteOf(value).fallbackIndex,1);
  assert.deepEqual(calls,[{kind:'codex',model:'cx/gpt-6-astra',effort:'xhigh'},{kind:'codex',model:'gemini/gemini-3.6-flash',effort:'xhigh'}]);
  assert.equal(REASONING_EFFORT,'xhigh');assert.equal(AI_ROUTES.length,3);assert.equal(AI_ROUTES[2].effort,'xhigh');
});

test('Prism Astra is used only after both 9router routes fail',async()=>{
  const calls=[];
  const value=await runAI('i',{},schema,{codexRunner:async(_i,_x,_s,o)=>{calls.push(o.model);throw new Error('down');},prismRunner:async()=>{calls.push('prism');return {answer:'ok'};}});
  assert.deepEqual(calls,['cx/gpt-6-astra','gemini/gemini-3.6-flash','prism']);
  assert.equal(aiRouteOf(value).id,'prism-astra');assert.equal(aiRouteOf(value).fallbackIndex,2);assert.equal(aiRouteOf(value).effort,'xhigh');
});

test('routing fails closed after all three routes fail',async()=>{
  const calls=[];
  await assert.rejects(()=>runAI('i',{},schema,{codexRunner:async(_i,_x,_s,o)=>{calls.push(o.model);throw new Error('down');},prismRunner:async()=>{calls.push('prism');throw new Error('maintenance');}}),/Astra, Gemini và Prism Astra/);
  assert.deepEqual(calls,['cx/gpt-6-astra','gemini/gemini-3.6-flash','prism']);
});