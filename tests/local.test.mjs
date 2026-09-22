import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {createInterface} from 'node:readline';
import {request as httpRequest} from 'node:http';
import {join,resolve} from 'node:path';
import {prepareReading,validateReading,INSTRUCTIONS,readingSchema,RULE_VERSION,READING_PROTOCOL,buildReadingRequest,validateReadingResponse} from '../local/reading.mjs';
import {createBridge} from '../local/server.mjs';
import {runCodex,MODEL,REASONING_EFFORT} from '../local/codex-client.mjs';
import {MODEL as ROUTED_MODEL,REASONING_EFFORT as ROUTED_EFFORT} from '../local/ai-client.mjs';
import {readingFixture} from './reading-fixture.mjs';
const payload={question:'Trong 30 ngày tới tôi có nhận được hợp đồng A không?',topic:'contract',method:'chaibu',input:{year:2026,month:9,day:9,hour:15,minute:30,tzOffset:7}};
const answer=readingFixture(prepareReading(payload));
test('server recomputes chart, rejects missing question and invented evidence',()=>{
 const {facts,context}=prepareReading({...payload,facts:{day:'client-forged'}});
 assert.notEqual(facts.day,'client-forged');assert.equal(context.rules,RULE_VERSION);
 assert.equal(validateReading(answer,facts,payload.topic,context),answer);
 assert.throws(()=>prepareReading({...payload,question:''}));
 assert.throws(()=>prepareReading({...payload,method:'invented'}));
 const p=prepareReading(payload);assert.equal(validateReading(answer,p.facts,payload.topic,p.context),answer);
 assert.throws(()=>validateReading({...answer,summary:{...answer.summary,claim_ids:['claim_99']}},p.facts,payload.topic,p.context));
});
test('loopback API checks pairing, Host, Origin and request shape',async t=>{
 const fetch=(url,options={})=>new Promise((resolve,reject)=>{
   const req=httpRequest(url,options,res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve(new Response(res.statusCode===204?null:Buffer.concat(chunks),{status:res.statusCode,headers:res.headers})));});
   req.on('error',reject);req.end(options.body);
 });
 let called=0,charts=0,readingStatus=null;
 const activityStore={recordChart(){charts++;return 'c1';},startReading(){readingStatus='running';return 'r1';},finishReading(_id,{status}){readingStatus=status;},summary(){return {date:'2026-09-18',chartCount:charts,readingCount:readingStatus?1:0,recentReadings:readingStatus?[{at:Date.now(),status:readingStatus,model:'',route:'',effort:''}]:[]};}};
 const {server}=createBridge({token:'test-pair-token',activityStore,runner:async()=>{called++;return answer;}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>{server.closeAllConnections();server.close();});
 const url=`http://127.0.0.1:${server.address().port}`;
 const headers={Host:'127.0.0.1:8765','X-Qimen-Token':'test-pair-token',Origin:'https://kymon.pp.ua','Content-Type':'application/json'};
 const publicHeaders={Host:headers.Host,Origin:headers.Origin};
 let activity=await(await fetch(url+'/api/activity?tzOffset=7',{headers:publicHeaders})).json();assert.equal(activity.activity.chartCount,0);assert.equal(activity.activity.readingCount,0);
 assert.equal((await fetch(url+'/api/activity/chart?tzOffset=7',{method:'POST',headers:publicHeaders})).status,200);
 activity=await(await fetch(url+'/api/activity?tzOffset=7',{headers:publicHeaders})).json();assert.equal(activity.activity.chartCount,1);
 assert.equal((await fetch(url+'/api/activity',{headers:{...publicHeaders,Origin:'https://evil.example'}})).status,403);
 assert.equal((await fetch(url+'/api/status',{headers:{Host:headers.Host}})).status,401);
 assert.equal((await fetch(url+'/api/status',{headers:{...headers,Origin:'https://evil.example'}})).status,403);
 assert.equal((await fetch(url+'/api/status',{headers:{...headers,Host:'evil.example'}})).status,403);
 const preflight=await fetch(url+'/api/read',{method:'OPTIONS',headers});assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),headers.Origin);
 const legacy=await fetch(url+'/api/read',{method:'POST',headers,body:JSON.stringify(payload)});assert.equal(legacy.status,409);assert.equal(called,0);
 assert.equal((await fetch(url+'/api/read',{method:'POST',headers,body:'{broken'})).status,400);assert.equal(called,0);
 const prepared=await buildReadingRequest(payload);
 const v2=await fetch(url+'/api/read',{method:'POST',headers,body:JSON.stringify(prepared.request)});assert.equal(v2.status,200);
 const data=await v2.json();assert.equal(data.model,ROUTED_MODEL);assert.equal(data.reasoningEffort,ROUTED_EFFORT);assert.deepEqual(validateReadingResponse(data,prepared).reading.summary,answer.summary);assert.equal(called,1);assert.equal(readingStatus,'completed');
 activity=await(await fetch(url+'/api/activity?tzOffset=7',{headers:publicHeaders})).json();assert.equal(activity.activity.readingCount,1);
 for(const bad of [{rules:'TG-CB-1.0'},{chartFingerprint:'wrong'},{question:'Một sự việc khác.'},{input:{...payload.input,minute:31}},{protocol:1}]){
   assert.equal((await fetch(url+'/api/read',{method:'POST',headers,body:JSON.stringify({...prepared.request,...bad})})).status,409);
 }
 assert.equal(called,1);
 const status=await(await fetch(url+'/api/status',{headers})).json();assert.equal(status.protocol,READING_PROTOCOL);assert.equal(status.rules,RULE_VERSION);assert.equal(status.reasoningEffort,ROUTED_EFFORT);
 assert.equal((await fetch(url+'/reading-core.mjs',{headers})).status,200);
 assert.equal((await fetch(url+'/ai-progress-estimate.mjs',{headers})).status,200);
 assert.equal((await fetch(url+'/spirit-activation-ui.mjs',{headers})).status,200);
 assert.equal((await fetch(url+'/assets/meditating-side.png',{headers})).status,200);
 assert.equal((await fetch(url+'/qimen/analysis/spiritActivation.mjs',{headers})).status,200);
 assert.equal((await fetch(url+'/qimen/ai/contextBuilder.mjs',{headers})).status,200);
 assert.equal((await fetch(url+'/qimen/ui-controls.mjs',{headers})).status,200);
 for(const file of ['/guide.html','/server.html','/info.html','/info.mjs'])assert.equal((await fetch(url+file,{headers})).status,200,file);
 assert.equal((await fetch(url+'/qimen/ai/secret.env',{headers})).status,404);
 assert.equal((await fetch(url+'/qimen/ai/%2e%2e/%2e%2e/local/server.mjs',{headers})).status,404);
 assert.equal((await fetch(url+'/local/server.mjs',{headers})).status,404);
 assert.equal((await fetch(url+'/',{headers})).status,200);
});
function mockCodex(auth='chatgpt',tool=false,{models,alterConfig,hold=false,result=answer,turnError}={}){
 const seen=[];
 let notifyStarted;const started=new Promise(resolve=>{notifyStarted=resolve;});
 const spawnProcess=(binary,args,options)=>{
   assert.equal(options.shell,false);assert.equal(options.env.OPENAI_API_KEY,undefined);assert.equal(options.env.CODEX_API_KEY,undefined);assert.equal(options.env.QIMEN_PAIRING_TOKEN,undefined);
   if(process.platform==='win32')assert.equal(options.env.CODEX_HOME,process.env.QIMEN_CODEX_HOME?resolve(process.env.QIMEN_CODEX_HOME):join(process.env.LOCALAPPDATA,'KyMonCodex','codex-home'));
   assert.ok(args.includes('default_permissions="qimen-reader"'));
   assert.ok(!args.some(arg=>arg.startsWith('sandbox_mode=')));
   assert.ok(args.includes('permissions.qimen-reader.network.enabled=false'));
   assert.ok(args.includes('permissions.qimen-reader.filesystem={'+JSON.stringify(options.cwd.replaceAll('\\','/'))+'="read"}'));
   const p=new EventEmitter();p.stdin=new PassThrough();p.stdout=new PassThrough();p.stderr=new PassThrough();p.exitCode=null;p.kill=()=>{if(p.exitCode===null){p.exitCode=0;p.stdin.end();p.stdout.end();setImmediate(()=>p.emit('exit',0));}};
   const send=m=>p.stdout.write(JSON.stringify(m)+'\n');
   createInterface({input:p.stdin}).on('line',line=>{
     const m=JSON.parse(line);seen.push(m);
     if(m.method==='initialize')send({id:m.id,result:{}});
     if(m.method==='account/read')send({id:m.id,result:{account:{type:auth}}});
     if(m.method==='config/read'){
       const config={default_permissions:'qimen-reader',sandbox_mode:null,permissions:{'qimen-reader':{extends:null,workspace_roots:null,filesystem:{[options.cwd.replaceAll('\\','/')]: 'read',glob_scan_max_depth:null},network:{enabled:false}}},windows:{sandbox:'elevated'}};
       alterConfig?.(config);send({id:m.id,result:{config}});
     }
     if(m.method==='model/list')send({id:m.id,result:{data:models??[{id:MODEL,model:MODEL,supportedReasoningEfforts:[{reasoningEffort:'ultra'}]}],nextCursor:null}});
     if(m.method==='thread/start'){assert.equal(m.params.model,'gpt-6-astra');assert.equal(m.params.sandbox,undefined);send({id:m.id,result:{thread:{id:'test-thread'},model:MODEL,sandbox:{type:'readOnly',networkAccess:false}}});}
     if(m.method==='turn/start'){
       assert.equal(m.params.effort,'ultra');
       assert.equal(m.params.sandboxPolicy,undefined);assert.equal(m.params.approvalPolicy,'never');
       send({id:m.id,result:{turn:{id:'test-turn'}}});
       if(turnError){send({method:'error',params:{error:turnError,willRetry:true}});return;}
       if(hold){setImmediate(notifyStarted);return;}
       if(tool)send({method:'item/started',params:{item:{type:'commandExecution'}}});
       else{send({method:'item/completed',params:{item:{type:'agentMessage',text:JSON.stringify(result)}}});send({method:'turn/completed',params:{turn:{status:'completed'}}});}
     }
   });
   return p;
 };
 return {spawnProcess,seen,started};
}
test('Codex JSONL handshake and structured answer, without a live model call',async()=>{
 const {context,facts}=prepareReading(payload);const mock=mockCodex();
 const result=await runCodex(INSTRUCTIONS,context,readingSchema(facts,context),mock);assert.deepEqual(result,answer);
 assert.deepEqual(mock.seen.filter(m=>m.method).map(m=>m.method),['initialize','initialized','account/read','config/read','model/list','thread/start','turn/start']);
 assert.equal(mock.seen.find(m=>m.method==='turn/start').params.input[0].text,JSON.stringify(context));
 assert.deepEqual(mock.seen.find(m=>m.method==='turn/start').params.outputSchema,readingSchema(facts,context));
});
test('Codex refuses a missing model or unsupported ultra effort before a turn',async()=>{
 for(const models of [[],[{id:MODEL,model:MODEL,supportedReasoningEfforts:[{reasoningEffort:'high'},{reasoningEffort:'max'}]}]]){
   const mock=mockCodex('chatgpt',false,{models});
   await assert.rejects(runCodex(INSTRUCTIONS,{}, {},mock),/GPT-6 Astra/);
   assert.ok(!mock.seen.some(m=>m.method==='turn/start'));
 }
});
test('Codex rejects legacy or broadened filesystem configuration before sending the question',async()=>{
 for(const alterConfig of [c=>{c.sandbox_mode='read-only';},c=>{c.permissions['qimen-reader'].filesystem[':root']='read';},c=>{c.permissions['qimen-reader'].extends=':read-only';},c=>{c.permissions['qimen-reader'].network.enabled=true;}]){
   const mock=mockCodex('chatgpt',false,{alterConfig});
   await assert.rejects(runCodex(INSTRUCTIONS,{}, {},mock),/quyền|sandbox/);
   assert.ok(!mock.seen.some(m=>m.method==='thread/start'));
 }
});
test('invalid claim identifiers reach the validator unchanged instead of being relabeled',async()=>{
 const invalid=structuredClone(answer);invalid.summary.claim_ids=['invented-claim'];
 const mock=mockCodex('chatgpt',false,{result:invalid});
 const result=await runCodex(INSTRUCTIONS,{}, {},mock);
 assert.deepEqual(result,invalid);
});
test('cancellation interrupts the active turn before ending its dedicated process',async()=>{
 const mock=mockCodex('chatgpt',false,{hold:true}),controller=new AbortController();
 const pending=runCodex(INSTRUCTIONS,{}, {},{...mock,signal:controller.signal});
 await mock.started;controller.abort();await assert.rejects(pending,/hủy/);
 assert.deepEqual(mock.seen.find(m=>m.method==='turn/interrupt')?.params,{threadId:'test-thread',turnId:'test-turn'});
});
test('quota failure is reported clearly without forwarding provider details or retrying',async()=>{
 const mock=mockCodex('chatgpt',false,{turnError:{codexErrorInfo:'usageLimitExceeded',message:'private-provider-detail'}});
 await assert.rejects(runCodex(INSTRUCTIONS,{}, {},mock),error=>/^Tài khoản.*đã hết hạn mức/.test(error.message)&&!error.message.includes('private-provider-detail'));
 assert.equal(mock.seen.filter(m=>m.method==='turn/start').length,1);
});
test('Codex bridge refuses API-key authentication and unexpected tool execution',async()=>{
 const {context,facts}=prepareReading(payload);
 await assert.rejects(runCodex(INSTRUCTIONS,context,readingSchema(facts,context),mockCodex('apiKey')),/đăng nhập đúng tài khoản/);
 await assert.rejects(runCodex(INSTRUCTIONS,context,readingSchema(facts,context),mockCodex('chatgpt',true)),/công cụ/);
});
test('pre-aborted AI invocation never launches a process',async()=>{
 const controller=new AbortController();controller.abort();
 await assert.rejects(runCodex(INSTRUCTIONS,{}, {},{signal:controller.signal,spawnProcess(){assert.fail('must not start');}}),/hủy/);
});
