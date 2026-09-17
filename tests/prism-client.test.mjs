import test from 'node:test';
import assert from 'node:assert/strict';
import {runPrism} from '../local/prism-client.mjs';

const env={
 QIMEN_MODEL:'gpt-6-astra',
 QIMEN_REASONING_EFFORT:'xhigh',
 PRISM_PROXY_BASE_URL:'http://127.0.0.1:8787/v1',
 PRISM_PROXY_API_KEY:'local-test-key'
};

test('Prism runner sends one bounded JSON-only request and parses the result',async()=>{
 let request;
 const fetchImpl=async(url,options)=>{
  request={url,options};
  return new Response(JSON.stringify({choices:[{message:{content:'```json\n{"ok":true}\n```'}}]}),{status:200,headers:{'Content-Type':'application/json'}});
 };
 const result=await runPrism('SYSTEM RULES',{question:'test'},{type:'object',required:['ok']},{fetchImpl,env});
 assert.deepEqual(result,{ok:true});
 assert.equal(request.url,'http://127.0.0.1:8787/v1/chat/completions');
 assert.equal(request.options.headers.Authorization,'Bearer local-test-key');
 const body=JSON.parse(request.options.body);
 assert.equal(body.model,'gpt-6-astra');
 assert.equal(body.reasoning_effort,'xhigh');
 assert.equal(body.stream,false);
 assert.equal(body.messages.length,1);
 assert.equal(body.messages[0].role,'user');
 assert.match(body.messages[0].content,/SYSTEM RULES/);
 assert.match(body.messages[0].content,/JSON SCHEMA:/);
 assert.match(body.messages[0].content,/"question":"test"/);
});

test('Prism runner refuses unsafe endpoints, unsupported models and silent effort downgrades',async()=>{
 const never=async()=>assert.fail('fetch must not run');
 await assert.rejects(runPrism('',{}, {},{fetchImpl:never,env:{...env,PRISM_PROXY_BASE_URL:'https://example.com/v1'}}),/chỉ được phép chạy local/);
 await assert.rejects(runPrism('',{}, {},{fetchImpl:never,env:{...env,QIMEN_MODEL:'gpt-5'}}),/gpt-6-astra/);
 await assert.rejects(runPrism('',{}, {},{fetchImpl:never,env:{...env,QIMEN_REASONING_EFFORT:'ultra'}}),/low, medium, high hoặc xhigh/);
 await assert.rejects(runPrism('',{}, {},{fetchImpl:never,env:{...env,PRISM_PROXY_API_KEY:''}}),/PRISM_PROXY_API_KEY/);
});

test('Prism runner maps access, capacity and transport failures without leaking provider bodies',async()=>{
 await assert.rejects(runPrism('',{}, {},{env,fetchImpl:async()=>new Response('secret',{status:401})}),/khóa truy cập/);
 await assert.rejects(runPrism('',{}, {},{env,fetchImpl:async()=>new Response('secret',{status:429})}),/hạn mức|phiên Prism/);
 await assert.rejects(runPrism('',{}, {},{env,fetchImpl:async()=>new Response('private upstream detail',{status:502})}),/HTTP 502/);
 await assert.rejects(runPrism('',{}, {},{env,fetchImpl:async()=>{throw new Error('private socket detail');}}),/Không kết nối được Prism proxy local/);
});
