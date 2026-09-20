import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createBridge} from '../local/server.mjs';
import {buildReadingRequest,prepareReading,validateReadingResponse} from '../local/reading.mjs';
import {readingFixture} from './reading-fixture.mjs';

const origin='https://kymon.pp.ua';
const relay='https://ky-mon-codex-relay.dinhtrongddr.workers.dev';
const payload={question:'Trong 30 ngay toi toi co nhan duoc hop dong A khong?',topic:'contract',mode:'prediction',method:'chaibu',input:{year:2026,month:9,day:14,hour:9,minute:0,tzOffset:7}};

async function start(t,options={}) {
  const {server}=createBridge({token:'integration-token',...options});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>{server.closeAllConnections();server.close();});
  return (path,{headers={},body,onData}={})=>new Promise((resolve,reject)=>{
    const req=request({host:'127.0.0.1',port:server.address().port,path,method:body?'POST':'GET',headers:{Host:'integration.trycloudflare.com',Origin:origin,'X-Qimen-Token':'integration-token',...(body?{'Content-Type':'application/json'}:{}),...headers}},res=>{
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

test('the official website can reach protocol 5 through the existing tunnel',async t=>{
  const call=await start(t);
  const result=await call('/api/status');
  assert.equal(result.status,200);
  assert.equal(JSON.parse(result.text).rules,'TG-CB-6.3');
  assert.equal(JSON.parse(result.text).protocol,5);
  assert.equal((await call('/api/status',{headers:{Origin:'https://foreign.example'}})).status,403);
  assert.equal((await call('/api/status',{headers:{Origin:''}})).status,403);
  assert.equal((await call('/api/status',{headers:{Origin:'','Sec-Fetch-Site':'same-origin'}})).status,200);
  assert.equal((await call('/api/status',{headers:{Host:'foreign.example'}})).status,403);
});


test('a shared result gets a public unguessable web link that opens without the pairing code',async t=>{
  const shareDir=await mkdtemp(join(tmpdir(),'qimen-share-test-'));t.after(()=>rm(shareDir,{recursive:true,force:true}));
  const call=await start(t,{shareDir});
  const payload={schemaVersion:'QimenShare/1',kind:'question',report:{reportType:'Hỏi việc',generatedAt:'20/09/2026 10:30',model:'GPT-5.6 Sol / high',inputFields:[{label:'Sự việc cần hỏi',value:'<script>alert(1)</script> hợp đồng SNP'}],board:{palaces:[{number:1,title:'Khảm 1',subtitle:'Bắc · Thủy',spirit:{vi:'Trực Phù'},star:{vi:'Thiên Tâm'},heaven:{vi:'Giáp'},door:{vi:'Khai Môn'},earth:{vi:'Mậu'}}],flags:['Trực Phù: Thiên Tâm']},contextSections:[{title:'Luận tượng',text:'Nội dung đối chiếu'}],analysisSections:[],aiSections:[{title:'Bài luận',paragraphs:[[{text:'Kết quả đã chia sẻ.',bold:true}]]}]}};
  assert.equal((await call('/api/share',{body:payload,headers:{'X-Qimen-Token':'wrong'}})).status,401);
  const created=await call('/api/share',{body:payload});assert.equal(created.status,201);
  const data=JSON.parse(created.text);assert.match(data.id,/^[A-Za-z0-9_-]{20,64}$/);assert.equal(data.url,'https://integration.trycloudflare.com/s/'+data.id);assert.ok(Date.parse(data.expiresAt)>Date.parse(data.createdAt));
  const page=await call('/s/'+data.id,{headers:{Origin:'','X-Qimen-Token':''}});
  assert.equal(page.status,200);assert.match(page.headers['content-type'],/^text\/html/);assert.match(page.headers['x-robots-tag'],/noindex/);
  assert.match(page.text,/Kỳ Môn Hỏi Việc/);assert.match(page.text,/Kết quả đã chia sẻ/);assert.match(page.text,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);assert.doesNotMatch(page.text,/<script>alert\(1\)<\/script>/);
  assert.equal((await call('/s/'+data.id,{headers:{Origin:'','X-Qimen-Token':'wrong'}})).status,200);
});

test('slow tunnel readings preserve one complete validated protocol 5 JSON document',async t=>{
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
