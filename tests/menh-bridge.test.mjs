import test from 'node:test';
import assert from 'node:assert/strict';
import {request as httpRequest} from 'node:http';
import {createBridge} from '../local/server.mjs';
import {buildMenhReadingRequest,validateMenhReadingResponse,MENH_RULE_VERSION,MENH_PROTOCOL} from '../local/menh-reading.mjs';
import {READING_PROTOCOL} from '../local/reading.mjs';
import {CASE_ENGINE_VERSION} from '../dist/qimen/case/engine.mjs';

const payload={birthDateLocal:'1990-01-01',birthTimeMode:'KNOWN',birthTimeLocal:'09:30',tzOffset:7,age:37,annualYear:2026,sexMetadata:'MALE'};
import {draftFor,acceptFidelity} from './surface-fixture.mjs';
const readingFromContext=draftFor;
const fetchLocal=(url,options={})=>new Promise((resolve,reject)=>{
  const req=httpRequest(url,options,res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve(new Response(res.statusCode===204?null:Buffer.concat(chunks),{status:res.statusCode,headers:res.headers})));});
  req.on('error',reject);req.end(options.body);
});

test('bridge recomputes KM-MENH, checks fingerprints and preserves existing service identity',async t=>{
  let calls=0;
  const {server}=createBridge({token:'menh-test-token',reviewer:acceptFidelity,runner:async(_instructions,ctx)=>{calls++;return readingFromContext(ctx);}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>{server.closeAllConnections();server.close();});
  const url='http://127.0.0.1:'+server.address().port;
  const headers={Host:'127.0.0.1:8765','X-Qimen-Token':'menh-test-token',Origin:'https://kymon.pp.ua','Content-Type':'application/json'};
  const status=await(await fetchLocal(url+'/api/status',{headers})).json();
  assert.equal(status.menhRules,MENH_RULE_VERSION);assert.equal(status.menhProtocol,MENH_PROTOCOL);
  assert.equal(status.rules,'TG-CB-6.3');assert.equal(status.protocol,READING_PROTOCOL);assert.equal(status.caseRules,CASE_ENGINE_VERSION);

  const prepared=await buildMenhReadingRequest(payload);
  const legacy=await fetchLocal(url+'/api/menh/read',{method:'POST',headers,body:JSON.stringify(payload)});
  assert.equal(legacy.status,409);assert.equal(calls,0);

  const ok=await fetchLocal(url+'/api/menh/read',{method:'POST',headers,body:JSON.stringify(prepared.request)});
  assert.equal(ok.status,200);
  const data=await ok.json();
  assert.equal(validateMenhReadingResponse(data,prepared),data);
  assert.equal(data.menhRules,MENH_RULE_VERSION);assert.equal(data.menhProtocol,MENH_PROTOCOL);assert.equal(data.caseRules,CASE_ENGINE_VERSION);assert.equal(calls,1);

  for(const bad of [{deterministicFingerprint:'wrong'},{requestFingerprint:'wrong'},{birthTimeLocal:'11:30'},{rules:'KM-MENH-9.9'},{protocol:9},{caseRules:'KM-CASE-0.9'}]){
    const response=await fetchLocal(url+'/api/menh/read',{method:'POST',headers,body:JSON.stringify({...prepared.request,...bad})});
    assert.equal(response.status,409);
  }
  assert.equal(calls,1);
  assert.equal((await fetchLocal(url+'/menh.html',{headers})).status,200);
  assert.equal((await fetchLocal(url+'/menh-reading-core.mjs',{headers})).status,200);
  assert.equal((await fetchLocal(url+'/qimen/menh/ai/schema.mjs',{headers})).status,200);
  assert.equal((await fetchLocal(url+'/qimen/semantic/matrix.mjs',{headers})).status,200);
  assert.equal((await fetchLocal(url+'/qimen/semantic/matrix-data.mjs',{headers})).status,200);
});
