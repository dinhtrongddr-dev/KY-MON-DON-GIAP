import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {createInterface} from 'node:readline';
import {request as httpRequest} from 'node:http';
import {prepareReading,validateReading,INSTRUCTIONS,readingSchema} from '../local/reading.mjs';
import {createBridge} from '../local/server.mjs';
import {runCodex,MODEL} from '../local/codex-client.mjs';
const payload={question:'Trong 30 ngày tới tôi có nhận được hợp đồng A không?',topic:'contract',method:'chaibu',input:{year:2026,month:9,day:9,hour:15,minute:30,tzOffset:7}};
const answer={status:'reading',topic_id:'contract',summary:'Kết quả giả lập kiểm thử.',assumptions:[],assessments:[{title:'Đọc hai cung',interpretation:'Nội dung giả lập.',evidence_ids:['day','hour','relation']}],questions:[],next_steps:[]};
test('server recomputes chart, rejects missing question and invented evidence',()=>{
 const {facts,context}=prepareReading({...payload,facts:{day:'client-forged'}});
 assert.notEqual(facts.day,'client-forged');assert.equal(context.rules,'TG-CB-1.0');
 assert.equal(validateReading(answer,facts),answer);
 assert.throws(()=>prepareReading({...payload,question:''}));
 assert.throws(()=>prepareReading({...payload,method:'invented'}));
 assert.throws(()=>validateReading({...answer,assessments:[{...answer.assessments[0],evidence_ids:['p99']}]},facts));
});
test('loopback API checks pairing, Host, Origin and request shape',async t=>{
 const fetch=(url,options={})=>new Promise((resolve,reject)=>{
   const req=httpRequest(url,options,res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve(new Response(res.statusCode===204?null:Buffer.concat(chunks),{status:res.statusCode,headers:res.headers})));});
   req.on('error',reject);req.end(options.body);
 });
 let called=0;
 const {server}=createBridge({token:'test-pair-token',runner:async()=>{called++;return answer;}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>{server.closeAllConnections();server.close();});
 const url=`http://127.0.0.1:${server.address().port}`;
 const headers={Host:'127.0.0.1:8765','X-Qimen-Token':'test-pair-token',Origin:'https://kymon.tkgiongnoi2.chatgpt.site','Content-Type':'application/json'};
 assert.equal((await fetch(url+'/api/status',{headers:{Host:headers.Host}})).status,401);
 assert.equal((await fetch(url+'/api/status',{headers:{...headers,Origin:'https://evil.example'}})).status,403);
 assert.equal((await fetch(url+'/api/status',{headers:{...headers,Host:'evil.example'}})).status,403);
 const preflight=await fetch(url+'/api/read',{method:'OPTIONS',headers});assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),headers.Origin);
 const read=await fetch(url+'/api/read',{method:'POST',headers,body:JSON.stringify(payload)});assert.equal(read.status,200);assert.equal((await read.json()).model,MODEL);assert.equal(called,1);
 assert.equal((await fetch(url+'/api/read',{method:'POST',headers,body:'{broken'})).status,400);assert.equal(called,1);
 assert.equal((await fetch(url+'/local/server.mjs',{headers})).status,404);
 assert.equal((await fetch(url+'/',{headers})).status,200);
});
function mockCodex(auth='chatgpt',tool=false){
 const seen=[];
 const spawnProcess=(binary,args,options)=>{
   assert.equal(options.shell,false);assert.equal(options.env.OPENAI_API_KEY,undefined);assert.equal(options.env.CODEX_API_KEY,undefined);
   const p=new EventEmitter();p.stdin=new PassThrough();p.stdout=new PassThrough();p.stderr=new PassThrough();p.kill=()=>{p.stdin.end();p.stdout.end();p.emit('exit',0);};
   const send=m=>p.stdout.write(JSON.stringify(m)+'\n');
   createInterface({input:p.stdin}).on('line',line=>{
     const m=JSON.parse(line);seen.push(m);
     if(m.method==='initialize')send({id:m.id,result:{}});
     if(m.method==='account/read')send({id:m.id,result:{account:{type:auth}}});
     if(m.method==='thread/start'){assert.equal(m.params.model,'gpt-5.6-sol');assert.equal(m.params.sandbox,'readOnly');send({id:m.id,result:{thread:{id:'test-thread'}}});}
     if(m.method==='turn/start'){
       assert.equal(m.params.sandboxPolicy.access.type,'restricted');assert.equal(m.params.approvalPolicy,'never');
       send({id:m.id,result:{turn:{id:'test-turn'}}});
       if(tool)send({method:'item/started',params:{item:{type:'commandExecution'}}});
       else{send({method:'item/completed',params:{item:{type:'agentMessage',text:JSON.stringify(answer)}}});send({method:'turn/completed',params:{turn:{status:'completed'}}});}
     }
   });
   return p;
 };
 return {spawnProcess,seen};
}
test('Codex JSONL handshake and structured answer, without a live model call',async()=>{
 const {context,facts}=prepareReading(payload);const mock=mockCodex();
 const result=await runCodex(INSTRUCTIONS,context,readingSchema(facts),mock);assert.deepEqual(result,answer);
 assert.deepEqual(mock.seen.filter(m=>m.method).map(m=>m.method),['initialize','initialized','account/read','thread/start','turn/start']);
});
test('Codex bridge refuses API-key authentication and unexpected tool execution',async()=>{
 const {context,facts}=prepareReading(payload);
 await assert.rejects(runCodex(INSTRUCTIONS,context,readingSchema(facts),mockCodex('apiKey')),/đăng nhập đúng tài khoản/);
 await assert.rejects(runCodex(INSTRUCTIONS,context,readingSchema(facts),mockCodex('chatgpt',true)),/công cụ/);
});
