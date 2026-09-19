import test from 'node:test';
import assert from 'node:assert/strict';
import {runAI,aiRouteOf,AI_ROUTES,REASONING_EFFORT} from '../local/ai-client.mjs';
const schema={type:'object',properties:{answer:{type:'string'}},required:['answer'],additionalProperties:false};
const quota=(message='quota')=>{const e=new Error(message);Object.defineProperty(e,'code',{value:'AI_QUOTA_EXHAUSTED'});Object.defineProperty(e,'fallbackAllowed',{value:true});return e;};

test('AI fallback order is Sol then Gemini only when Sol quota is exhausted',async()=>{
  const calls=[],diagnostics=[];
  const codexRunner=async(_i,_x,_s,options)=>{calls.push({kind:'codex',model:options.model,effort:options.effort});if(calls.length===1)throw quota('Sol hết hạn mức');return {answer:'ok'};};
  const prismRunner=async()=>{calls.push({kind:'prism'});return {answer:'prism'};};
  const value=await runAI('i',{},schema,{codexRunner,prismRunner,diagnostics:e=>diagnostics.push(e)});
  assert.equal(value.answer,'ok');assert.equal(aiRouteOf(value).id,'gemini');assert.equal(aiRouteOf(value).fallbackIndex,1);
  assert.deepEqual(calls,[{kind:'codex',model:'cx/gpt-5.6-sol',effort:'xhigh'},{kind:'codex',model:'gemini/gemini-3.6-flash',effort:'xhigh'}]);
  assert.equal(diagnostics[0].code,'AI_QUOTA_EXHAUSTED');assert.equal(diagnostics[0].fallbackAllowed,true);
  assert.equal(REASONING_EFFORT,'xhigh');assert.equal(AI_ROUTES.length,3);assert.equal(AI_ROUTES[0].modelId,'gpt-5.6-sol');assert.equal(AI_ROUTES[2].effort,'xhigh');
});

test('non-quota Sol errors fail closed and never jump to Gemini',async()=>{
  const calls=[],diagnostics=[];
  await assert.rejects(()=>runAI('i',{},schema,{codexRunner:async(_i,_x,_s,o)=>{calls.push(o.model);throw new Error('invalid output');},prismRunner:async()=>{calls.push('prism');return {answer:'wrong'};},diagnostics:e=>diagnostics.push(e)}),/invalid output/);
  assert.deepEqual(calls,['cx/gpt-5.6-sol']);assert.equal(diagnostics.length,1);assert.equal(diagnostics[0].fallbackAllowed,false);
});

test('Prism Astra is used only when both Sol and Gemini explicitly exhaust quota',async()=>{
  const calls=[];
  const value=await runAI('i',{},schema,{codexRunner:async(_i,_x,_s,o)=>{calls.push(o.model);throw quota(o.model+' quota');},prismRunner:async()=>{calls.push('prism');return {answer:'ok'};},diagnostics:()=>{}});
  assert.deepEqual(calls,['cx/gpt-5.6-sol','gemini/gemini-3.6-flash','prism']);
  assert.equal(aiRouteOf(value).id,'prism-astra');assert.equal(aiRouteOf(value).fallbackIndex,2);assert.equal(aiRouteOf(value).effort,'xhigh');
});

test('routeStartIndex can retry the same previously selected fallback route',async()=>{
  const calls=[];
  const value=await runAI('i',{},schema,{routeStartIndex:1,codexRunner:async(_i,_x,_s,o)=>{calls.push(o.model);return {answer:'ok'};},prismRunner:async()=>{calls.push('prism');return {answer:'prism'};},diagnostics:()=>{}});
  assert.equal(aiRouteOf(value).id,'gemini');assert.deepEqual(calls,['gemini/gemini-3.6-flash']);
});

test('routing fails after every available route reports quota exhaustion',async()=>{
  const calls=[];
  await assert.rejects(()=>runAI('i',{},schema,{codexRunner:async(_i,_x,_s,o)=>{calls.push(o.model);throw quota();},prismRunner:async()=>{calls.push('prism');throw quota();},diagnostics:()=>{}}),error=>error.code==='AI_ALL_QUOTA_EXHAUSTED');
  assert.deepEqual(calls,['cx/gpt-5.6-sol','gemini/gemini-3.6-flash','prism']);
});
