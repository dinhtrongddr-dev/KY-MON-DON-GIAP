import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createBridge} from '../local/server.mjs';
import {buildReadingRequest,prepareReading,validateReadingResponse,READING_PROTOCOL,NIANMING_VERSION} from '../local/reading.mjs';
import {readingFixture} from './reading-fixture.mjs';
import {CASE_ENGINE_VERSION} from '../dist/qimen/case/engine.mjs';
import {createOutcomeRegistry} from '../local/outcome-registry.mjs';
import {OUTCOME_REGISTRY_VERSION,VALIDATION_VERSION} from '../dist/qimen/validation/protocol.mjs';

const origin='https://kymon.pp.ua';
const relay='https://ky-mon-codex-relay.dinhtrongddr.workers.dev';
const payload={question:'Trong 30 ngay toi toi co nhan duoc hop dong A khong?',topic:'contract',mode:'prediction',method:'chaibu',input:{year:2026,month:9,day:14,hour:9,minute:0,tzOffset:7}};

async function start(t,options={}) {
  const {server}=createBridge({token:'integration-token',...options});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>{server.closeAllConnections();server.close();});
  return (path,{headers={},body,onData,method}={})=>new Promise((resolve,reject)=>{
    const verb=method||(body?'POST':'GET');
    const req=request({host:'127.0.0.1',port:server.address().port,path,method:verb,headers:{Host:'integration.trycloudflare.com',Origin:origin,'X-Qimen-Token':'integration-token',...(body?{'Content-Type':'application/json'}:{}),...headers}},res=>{
      const chunks=[];res.on('data',c=>{chunks.push(c);onData?.(c);});res.on('error',reject);
      res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,text:Buffer.concat(chunks).toString('utf8')}));
    });
    req.on('error',reject);req.end(body?JSON.stringify(body):undefined);
  });
}

test('pairing code accepts four characters and rejects shorter values',()=>{
  assert.doesNotThrow(()=>createBridge({token:'abcd'}));
  assert.throws(()=>createBridge({token:'abc'}),/4 đến 128/);
});

test('existing manual pairing configuration works across bridge restarts',()=>{
  const previous=process.env.QIMEN_PAIRING_TOKEN;
  process.env.QIMEN_PAIRING_TOKEN='existing-config-token';
  try{assert.equal(createBridge().token,'existing-config-token');assert.equal(createBridge().token,'existing-config-token');}
  finally{if(previous===undefined)delete process.env.QIMEN_PAIRING_TOKEN;else process.env.QIMEN_PAIRING_TOKEN=previous;}
});

test('the official website can reach the current question protocol through the existing tunnel',async t=>{
  const call=await start(t);
  const result=await call('/api/status');
  assert.equal(result.status,200);
  assert.equal(JSON.parse(result.text).rules,'TG-CB-6.3');
  assert.equal(JSON.parse(result.text).protocol,READING_PROTOCOL);
  assert.equal(JSON.parse(result.text).caseRules,CASE_ENGINE_VERSION);
  assert.equal(JSON.parse(result.text).nianmingRules,NIANMING_VERSION);
  assert.equal(JSON.parse(result.text).validationRules,VALIDATION_VERSION);
  assert.equal(JSON.parse(result.text).outcomeRegistryRules,OUTCOME_REGISTRY_VERSION);
  assert.equal((await call('/api/status',{headers:{Origin:'https://foreign.example'}})).status,403);
  assert.equal((await call('/api/status',{headers:{Origin:'','Sec-Fetch-Site':'cross-site'}})).status,403);
  assert.equal((await call('/api/status',{headers:{Origin:''}})).status,200);
  assert.equal((await call('/api/status',{headers:{Origin:'','Sec-Fetch-Site':'same-origin'}})).status,200);
  assert.equal((await call('/api/status',{headers:{Origin:'','User-Agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'}})).status,200);
  assert.equal((await call('/api/validation/report',{headers:{Origin:''}})).status,200);
  assert.equal((await call('/api/validation/report',{headers:{Origin:'','X-Qimen-Token':'wrong'}})).status,401);
  assert.equal((await call('/api/status',{headers:{Host:'foreign.example'}})).status,403);
});


test('a shared result gets a public unguessable web link that opens without the pairing code',async t=>{
  const shareDir=await mkdtemp(join(tmpdir(),'qimen-share-test-'));t.after(()=>rm(shareDir,{recursive:true,force:true}));
  const call=await start(t,{shareDir});
  const payload={schemaVersion:'QimenShare/1',kind:'question',report:{reportType:'Hỏi việc',generatedAt:'20/09/2026 10:30',model:'GPT-5.6 Sol / high',inputFields:[{label:'Sự việc cần hỏi',value:'<script>alert(1)</script> hợp đồng SNP'}],board:{palaces:[{number:1,title:'Khảm 1',subtitle:'Bắc · Thủy',spirit:{vi:'Trực Phù'},star:{vi:'Thiên Tâm'},heaven:{vi:'Giáp'},door:{vi:'Khai Môn'},earth:{vi:'Mậu'}}],flags:['Trực Phù: Thiên Tâm']},contextSections:[{title:'Luận tượng',text:'Nội dung đối chiếu'}],analysisSections:[],aiSections:[{title:'Bài luận',paragraphs:[[{text:'Kết quả đã chia sẻ.',bold:true}]]}]},snapshot:{version:1,className:'result',html:'<p id="question-summary">Kết quả đã chia sẻ.</p><div class="qimen-board">Bàn Kỳ Môn</div>'}};
  assert.equal((await call('/api/share',{body:payload,headers:{'X-Qimen-Token':'wrong'}})).status,401);
  const created=await call('/api/share',{body:payload});assert.equal(created.status,201);
  const data=JSON.parse(created.text);assert.match(data.id,/^[A-Za-z0-9_-]{20,64}$/);assert.equal(data.url,'https://integration.trycloudflare.com/s/'+data.id);assert.ok(Date.parse(data.expiresAt)>Date.parse(data.createdAt));
  const page=await call('/s/'+data.id,{headers:{Origin:'','X-Qimen-Token':''}});
  assert.equal(page.status,302);assert.equal(page.headers.location,'https://integration.trycloudflare.com/?share='+data.id);assert.match(page.headers['x-robots-tag'],/noindex/);
  const shared=await call('/api/share/'+data.id,{headers:{Origin:origin,'X-Qimen-Token':''}});
  assert.equal(shared.status,200);const sharedData=JSON.parse(shared.text);assert.equal(sharedData.kind,'question');assert.equal(sharedData.snapshot.html,payload.snapshot.html);assert.equal(sharedData.report,undefined);
  assert.equal((await call('/s/'+data.id,{headers:{Origin:'','X-Qimen-Token':'wrong'}})).status,302);
});

test('question bridge fails closed when KM-CASE or KM-NIANMING compatibility is missing or stale',async t=>{
  const prepared=await buildReadingRequest(payload),call=await start(t);
  const missingCase={...prepared.request};delete missingCase.caseRules;
  assert.equal((await call('/api/read',{body:missingCase})).status,409);
  assert.equal((await call('/api/read',{body:{...prepared.request,caseRules:'KM-CASE-0.9'}})).status,409);
  const missingNianming={...prepared.request};delete missingNianming.nianmingRules;
  assert.equal((await call('/api/read',{body:missingNianming})).status,409);
  assert.equal((await call('/api/read',{body:{...prepared.request,nianmingRules:'KM-NIANMING-0.9'}})).status,409);
});


test('Phase 12 validation registry is opt-in, sanitized and separate from normal AI reads',async t=>{
  const body={input:{year:2026,month:9,day:16,hour:7,minute:46,tzOffset:7},question:'Trong tuần này tôi có khoản tiền vào được phát sinh không?',topic:'general',mode:'auto',method:'chaibu'};
  const prepared=await buildReadingRequest(body),answer=readingFixture(prepareReading(body));
  let clock=Date.parse('2026-09-16T00:50:00Z');
  const outcomeRegistry=createOutcomeRegistry({now:()=>clock});
  const call=await start(t,{outcomeRegistry,runner:async()=>answer});
  const before=JSON.parse((await call('/api/validation/report')).text);
  assert.equal(before.report.totals.records,0);

  const read=await call('/api/read',{body:prepared.request});
  assert.equal(read.status,200);
  assert.equal(JSON.parse((await call('/api/validation/report')).text).report.totals.records,0);

  const registered=await call('/api/validation/register',{body:{request:prepared.request,track:'BLIND_HOLDOUT',evaluationUnitRef:'contract-unit-001'}});
  assert.equal(registered.status,201);
  const data=JSON.parse(registered.text);
  assert.equal(data.validationRules,VALIDATION_VERSION);
  assert.equal(data.outcomeRegistryRules,OUTCOME_REGISTRY_VERSION);
  assert.equal(data.record.snapshot.track,'BLIND_HOLDOUT');
  assert.equal(JSON.stringify(data.record).includes(body.question),false);

  const duplicate=await call('/api/validation/register',{body:{request:prepared.request,track:'MONITORING',evaluationUnitRef:'contract-unit-001'}});
  assert.equal(duplicate.status,200);assert.equal(JSON.parse(duplicate.text).reused,true);

  clock=Date.parse('2026-09-18T01:00:00Z');
  const outcome=await call('/api/validation/outcome',{body:{recordId:data.record.id,outcome:{outcomeClass:'OBSERVED',observedAt:'2026-09-18T00:00:00Z',sourceKind:'system_record',sourceRef:'crm:test-outcome',humanReviewed:true,independentOfReading:true}}});
  assert.equal(outcome.status,200);
  assert.equal(JSON.parse(outcome.text).record.outcome.verificationStatus,'VERIFIED_BENCHMARK');
  clock=Date.parse('2026-09-21T00:00:00Z');
  const report=JSON.parse((await call('/api/validation/report')).text).report;
  assert.equal(report.totals.records,1);assert.equal(report.totals.verifiedBenchmark,1);
  assert.equal(report.selective.directionalScored,1);assert.equal(report.selective.matched,1);
  assert.equal(report.reportability.predictiveValidityClaimAllowed,false);
});

test('slow tunnel readings preserve one complete validated current-protocol JSON document',async t=>{
  const prepared=await buildReadingRequest(payload),answer=readingFixture(prepareReading(payload));
  const call=await start(t,{keepAliveAfterMs:5,keepAliveEveryMs:5,runner:async()=>{await new Promise(resolve=>setTimeout(resolve,40));return answer;}});
  const result=await call('/api/read',{body:prepared.request});
  assert.equal(result.status,200);
  assert.match(result.text,/^ +\{/);
  assert.deepEqual(validateReadingResponse(JSON.parse(result.text),prepared).reading,answer);
});

test('a provider error after tunnel keepalive completes as JSON and releases the next reading',async t=>{
  const prepared=await buildReadingRequest(payload);
  let release,calls=0;
  const keepaliveReceived=new Promise(resolve=>release=resolve);
  const call=await start(t,{keepAliveAfterMs:5,keepAliveEveryMs:5,runner:async()=>{
    calls++;
    await keepaliveReceived;
    throw new Error('Provider usage limit reached.');
  }});
  let result;
  await assert.doesNotReject(async()=>{
    result=await call('/api/read',{body:prepared.request,onData:release});
  },'an AI failure must not truncate the response');
  assert.equal(result.status,200);
  assert.match(result.text,/^ +\{/);
  assert.deepEqual(JSON.parse(result.text),{error:'Provider usage limit reached.'});
  assert.equal(calls,1,'provider errors must not be retried');
  const next=await call('/api/read',{body:prepared.request});
  assert.equal(next.status,502);
  assert.deepEqual(JSON.parse(next.text),{error:'Provider usage limit reached.'});
  assert.equal(calls,2);
});

test('local preview serves every browser-imported Case Engine module as JavaScript',async t=>{
  const call=await start(t);
  for(const path of ['/qimen/case/engine.mjs','/qimen/case/library.mjs']){
    const result=await call(path,{headers:{Host:'127.0.0.1:8765',Origin:''}});
    assert.equal(result.status,200,path);
    assert.match(result.headers['content-type'],/^text\/javascript/);
    assert.doesNotMatch(result.text,/"error"\s*:/);
  }
});

test('local UI can contact the relay while pairing remains manually entered',async t=>{
  const call=await start(t);
  const page=await call('/',{headers:{Host:'127.0.0.1:8765',Origin:''}});
  assert.equal(page.status,200);
  const connect=page.headers['content-security-policy']?.split(';').find(x=>x.trim().startsWith('connect-src'));
  assert.ok(connect?.includes(relay));
  assert.ok(!page.text.includes('integration-token'));
  const remotePage=await call('/');
  assert.equal(remotePage.status,302);
  assert.equal(remotePage.headers.location,origin+'/');
});

test('repeated wrong pairing attempts are throttled separately for each relay client',async t=>{
  const call=await start(t),client='a'.repeat(64);
  for(let n=0;n<7;n++)assert.equal((await call('/api/status',{headers:{'X-Qimen-Token':'wrong','X-Qimen-Client':client}})).status,401);
  assert.equal((await call('/api/status',{headers:{'X-Qimen-Token':'wrong','X-Qimen-Client':client}})).status,429);
  assert.equal((await call('/api/status',{headers:{'X-Qimen-Client':'b'.repeat(64)}})).status,200);
});

test('async reading job survives client disconnect semantics and can be reattached without a second AI call',async t=>{
  const prepared=await buildReadingRequest(payload),answer=readingFixture(prepareReading(payload));
  let release,calls=0;const gate=new Promise(resolve=>release=resolve);
  const call=await start(t,{runner:async()=>{calls++;await gate;return answer;}});
  const first=await call('/api/read/start',{body:prepared.request});assert.equal(first.status,202);
  const started=JSON.parse(first.text);assert.match(started.jobId,/^[A-Za-z0-9_-]{20,64}$/);assert.equal(started.reused,false);
  const duplicate=await call('/api/read/start',{body:prepared.request});assert.equal(duplicate.status,202);
  const duplicateData=JSON.parse(duplicate.text);assert.equal(duplicateData.jobId,started.jobId);assert.equal(duplicateData.reused,true);
  const running=await call('/api/jobs/'+started.jobId);assert.equal(JSON.parse(running.text).status,'running');assert.equal(calls,1);
  release();
  let finished;
  for(let i=0;i<50;i++){finished=JSON.parse((await call('/api/jobs/'+started.jobId)).text);if(finished.status!=='running')break;await new Promise(r=>setTimeout(r,5));}
  assert.equal(finished.status,'completed');assert.equal(calls,1);
  assert.deepEqual(validateReadingResponse(finished.result,prepared).reading,answer);
});

test('async reading job can be explicitly cancelled instead of depending on a dropped HTTP connection',async t=>{
  const prepared=await buildReadingRequest(payload);
  let aborted=false;
  const call=await start(t,{runner:async(_instructions,_input,_schema,{signal}={})=>new Promise((resolve,reject)=>{
    signal?.addEventListener('abort',()=>{aborted=true;reject(Object.assign(new Error('aborted'),{name:'AbortError'}));},{once:true});
  })});
  const first=JSON.parse((await call('/api/read/start',{body:prepared.request})).text);
  const cancelled=await call('/api/jobs/'+first.jobId,{method:'DELETE'});assert.equal(cancelled.status,202);
  let state;
  for(let i=0;i<50;i++){state=JSON.parse((await call('/api/jobs/'+first.jobId)).text);if(state.status!=='running')break;await new Promise(r=>setTimeout(r,5));}
  assert.equal(aborted,true);assert.equal(state.status,'cancelled');
});
