import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runAIText,
  aiRouteOf,
  writerProviderFromEnv
} from '../local/ai-client.mjs';
import {
  generateStructured,
  generateText,
  providerCapabilities
} from '../local/provider-client.mjs';

const quota=()=>{
 const error=new Error('quota');
 Object.defineProperty(error,'code',{value:'AI_QUOTA_EXHAUSTED'});
 Object.defineProperty(error,'fallbackAllowed',{value:true});
 return error;
};

test('writer provider defaults to current chain and chatgpt2api selection is explicit',()=>{
 assert.equal(writerProviderFromEnv({}),'current');
 assert.equal(writerProviderFromEnv({QIMEN_WRITER_PROVIDER:'chatgpt2api'}),'chatgpt2api');
 assert.equal(providerCapabilities({}).text.provider,'current');
});

test('current text route keeps quota-only Sol to Gemini fallback',async()=>{
 const calls=[];
 const result=await runAIText('i',{question:'q'},{
  env:{},
  diagnostics:()=>{},
  codexTextRunner:async(_i,_x,o)=>{
   calls.push(o.model);
   if(calls.length===1)throw quota();
   return 'Văn bản tự nhiên';
  },
  prismTextRunner:async()=>{assert.fail('Prism should not be reached');}
 });
 assert.deepEqual(calls,['cx/gpt-5.6-sol','gemini/gemini-3.6-flash']);
 assert.equal(result.text,'Văn bản tự nhiên');
 assert.equal(aiRouteOf(result).id,'gemini');
});

test('current text route fails closed on non-quota errors',async()=>{
 const calls=[];
 await assert.rejects(()=>runAIText('i','x',{
  env:{},
  diagnostics:()=>{},
  codexTextRunner:async(_i,_x,o)=>{calls.push(o.model);throw Object.assign(new Error('auth'),{code:'AI_AUTH'});},
  prismTextRunner:async()=>{calls.push('prism');return 'wrong';}
 }),error=>error.code==='AI_AUTH');
 assert.deepEqual(calls,['cx/gpt-5.6-sol']);
});

test('chatgpt2api writer does not silently downgrade to current providers',async()=>{
 const calls=[];
 const env={
  QIMEN_WRITER_PROVIDER:'chatgpt2api',
  QIMEN_CHATGPT2API_ENABLED:'1',
  CHATGPT2API_BASE_URL:'http://127.0.0.1:3000/v1',
  CHATGPT2API_AUTH_KEY:'test',
  CHATGPT2API_WRITER_MODEL:'gpt-5',
  CHATGPT2API_REASONING_EFFORT:'xhigh'
 };
 await assert.rejects(()=>runAIText('i','x',{
  env,
  diagnostics:()=>{},
  chatgptTextRunner:async()=>{calls.push('chatgpt2api');throw Object.assign(new Error('rate'),{code:'AI_RATE_LIMIT'});},
  codexTextRunner:async()=>{calls.push('codex');return 'wrong';},
  prismTextRunner:async()=>{calls.push('prism');return 'wrong';}
 }),error=>error.code==='AI_RATE_LIMIT');
 assert.deepEqual(calls,['chatgpt2api']);
});

test('chatgpt2api writer carries conservative provider metadata',async()=>{
 const env={
  QIMEN_WRITER_PROVIDER:'chatgpt2api',
  QIMEN_CHATGPT2API_ENABLED:'1',
  CHATGPT2API_BASE_URL:'http://127.0.0.1:3000/v1',
  CHATGPT2API_AUTH_KEY:'test',
  CHATGPT2API_WRITER_MODEL:'gpt-5',
  CHATGPT2API_REASONING_EFFORT:'xhigh'
 };
 const result=await generateText('i','x',{
  env,
  diagnostics:()=>{},
  chatgptTextRunner:async()=>({text:'Kết quả',metadata:{provider:'chatgpt2api',requestedModel:'gpt-5',reportedModel:'gpt-5',resolvedModel:null,effortRequested:'xhigh',effortTransmitted:'xhigh',effortReported:null,effectiveModelObserved:false,effectiveEffortObserved:false}})
 });
 assert.equal(result.text,'Kết quả');
 assert.equal(aiRouteOf(result).provider,'chatgpt2api');
 assert.equal(result.metadata.resolvedModel,null);
});

test('structured provider interface preserves legacy runner contract',async()=>{
 const schema={type:'object',properties:{answer:{type:'string'}},required:['answer']};
 const result=await generateStructured('i',{},schema,{
  diagnostics:()=>{},
  codexRunner:async()=>({answer:'ok'}),
  prismRunner:async()=>({answer:'no'})
 });
 assert.equal(result.answer,'ok');
});
