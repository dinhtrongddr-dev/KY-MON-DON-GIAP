import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runChatgptWebText,
  discoverChatgptWebModels,
  chatgptWebRuntime
} from '../local/chatgpt-web-client.mjs';

const env={
  QIMEN_CHATGPT2API_ENABLED:'1',
  CHATGPT2API_BASE_URL:'http://127.0.0.1:3000/v1',
  CHATGPT2API_AUTH_KEY:'test-only-key',
  CHATGPT2API_WRITER_MODEL:'gpt-5',
  CHATGPT2API_REASONING_EFFORT:'xhigh'
};

test('chatgpt2api text client keeps system/user roles and does not claim echoed model as observed',async()=>{
 let request;
 const fetchImpl=async(url,options)=>{
  request={url,options};
  return new Response(JSON.stringify({
   model:'gpt-5',
   choices:[{message:{content:'  Bài luận tiếng Việt tự nhiên.  '}}]
  }),{status:200,headers:{'Content-Type':'application/json'}});
 };
 const result=await runChatgptWebText('Hãy diễn giải tự nhiên.',{question:'Công việc thế nào?'},{env,fetchImpl});
 assert.equal(result.text,'Bài luận tiếng Việt tự nhiên.');
 assert.equal(request.url,'http://127.0.0.1:3000/v1/chat/completions');
 const body=JSON.parse(request.options.body);
 assert.equal(body.model,'gpt-5');
 assert.equal(body.reasoning_effort,'xhigh');
 assert.equal(body.stream,false);
 assert.deepEqual(body.messages.map(x=>x.role),['system','user']);
 assert.match(body.messages[1].content,/Công việc thế nào/);
 assert.equal(result.metadata.requestedModel,'gpt-5');
 assert.equal(result.metadata.reportedModel,'gpt-5');
 assert.equal(result.metadata.resolvedModel,null);
 assert.equal(result.metadata.effectiveModelObserved,false);
 assert.equal(result.metadata.effectiveEffortObserved,false);
});

test('chatgpt2api refuses public endpoints and requires a key only when enabled',()=>{
 assert.throws(()=>chatgptWebRuntime({...env,CHATGPT2API_BASE_URL:'https://example.com/v1'}),error=>error.code==='AI_CONFIG');
 assert.throws(()=>chatgptWebRuntime({...env,CHATGPT2API_AUTH_KEY:''}),error=>error.code==='AI_AUTH');
 const disabled=chatgptWebRuntime({...env,QIMEN_CHATGPT2API_ENABLED:'0',CHATGPT2API_AUTH_KEY:''});
 assert.equal(disabled.enabled,false);
});

test('chatgpt2api maps auth rate limit and unavailable responses without leaking provider bodies',async()=>{
 for(const [status,code] of [[401,'AI_AUTH'],[403,'AI_AUTH'],[429,'AI_RATE_LIMIT'],[503,'AI_UNAVAILABLE']]){
  await assert.rejects(
   runChatgptWebText('i','x',{env,fetchImpl:async()=>new Response('private upstream body',{status})}),
   error=>error.code===code
  );
 }
});

test('chatgpt2api rejects empty or malformed output',async()=>{
 await assert.rejects(
  runChatgptWebText('i','x',{env,fetchImpl:async()=>new Response('{',{status:200,headers:{'Content-Type':'application/json'}})}),
  error=>error.code==='AI_MALFORMED_OUTPUT'
 );
 await assert.rejects(
  runChatgptWebText('i','x',{env,fetchImpl:async()=>new Response(JSON.stringify({choices:[{message:{content:' '}}]}),{status:200,headers:{'Content-Type':'application/json'}})}),
  error=>error.code==='AI_MALFORMED_OUTPUT'
 );
});

test('model discovery is catalog evidence only, not entitlement proof',async()=>{
 const data=await discoverChatgptWebModels({
  env,
  fetchImpl:async()=>new Response(JSON.stringify({object:'list',data:[{id:'gpt-5'},{id:'gpt-5-mini'}]}),{status:200,headers:{'Content-Type':'application/json'}})
 });
 assert.deepEqual(data.advertisedModels,['gpt-5','gpt-5-mini']);
 assert.equal(data.entitlementVerified,false);
 assert.equal(data.probed,false);
});
