import test from 'node:test';
import assert from 'node:assert/strict';
import {runPrism,PRISM_MODEL,PRISM_REASONING_EFFORT} from '../local/prism-client.mjs';

const env={PRISM_PROXY_BASE_URL:'http://127.0.0.1:8787/v1',PRISM_PROXY_API_KEY:'local-test-key'};

test('Prism runner is fixed to Astra xhigh and parses bounded JSON',async()=>{
 let request;
 const fetchImpl=async(url,options)=>{request={url,options};return new Response(JSON.stringify({choices:[{message:{content:'```json\n{"ok":true}\n```'}}]}),{status:200,headers:{'Content-Type':'application/json'}});};
 const result=await runPrism('SYSTEM',{question:'test'},{type:'object',required:['ok']},{fetchImpl,env});
 assert.deepEqual(result,{ok:true});
 assert.equal(PRISM_MODEL,'gpt-6-astra');assert.equal(PRISM_REASONING_EFFORT,'xhigh');
 assert.equal(request.url,'http://127.0.0.1:8787/v1/chat/completions');
 const body=JSON.parse(request.options.body);
 assert.equal(body.model,'gpt-6-astra');assert.equal(body.reasoning_effort,'xhigh');assert.equal(body.stream,false);
});

test('Prism runner refuses non-loopback endpoint and missing local key',async()=>{
 const never=async()=>assert.fail('fetch must not run');
 await assert.rejects(runPrism('',{}, {},{fetchImpl:never,env:{...env,PRISM_PROXY_BASE_URL:'https://example.com/v1'}}),/chỉ được phép chạy local/);
 await assert.rejects(runPrism('',{}, {},{fetchImpl:never,env:{...env,PRISM_PROXY_API_KEY:''}}),/Thiếu cấu hình Prism/);
});

test('Prism runner reports maintenance without leaking provider body',async()=>{
 await assert.rejects(runPrism('',{}, {},{env,fetchImpl:async()=>new Response('private',{status:503})}),/bảo trì|suy giảm/);
});