import test from 'node:test';
import assert from 'node:assert/strict';
import {createReadingJobClient} from '../dist/reading-job-client.mjs';

const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});

test('job client survives a temporary mobile network loss and later returns the completed result',async t=>{
  const original={fetch:globalThis.fetch,document:globalThis.document};
  t.after(()=>{globalThis.fetch=original.fetch;globalThis.document=original.document;});
  globalThis.document={hidden:false};
  let polls=0,reconnects=0,running=0;
  globalThis.fetch=async url=>{
    if(url.endsWith('/api/read/start'))return response({jobId:'abcdefghijklmnopqrstuvwx',status:'running'},202);
    if(url.includes('/api/jobs/')){
      polls++;
      if(polls===1)throw new TypeError('network lost');
      if(polls===2)return response({jobId:'abcdefghijklmnopqrstuvwx',status:'running'});
      return response({jobId:'abcdefghijklmnopqrstuvwx',status:'completed',result:{reading:{status:'completed'},ok:true}});
    }
    throw new Error('unexpected '+url);
  };
  const client=createReadingJobClient({endpoint:'https://relay.example',getToken:()=> 'token',pollMs:1,hiddenPollMs:1,onReconnect(){reconnects++;},onRunning(){running++;}});
  const started=await client.start('/api/read/start',{request:'x'});
  assert.equal(started.jobId,'abcdefghijklmnopqrstuvwx');
  const result=await client.wait(started.jobId,new AbortController().signal);
  assert.deepEqual(result,{reading:{status:'completed'},ok:true});
  assert.equal(reconnects,1);assert.equal(running,1);assert.equal(polls,3);
});

test('job client cancel uses the explicit DELETE job endpoint',async t=>{
  const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});
  let method,path;
  globalThis.fetch=async(url,options)=>{path=url;method=options.method;return response({status:'cancelling'},202);};
  const client=createReadingJobClient({endpoint:'https://relay.example',getToken:()=> 'token',pollMs:1});
  await client.cancel('abcdefghijklmnopqrstuvwx');
  assert.equal(method,'DELETE');assert.match(path,/\/api\/jobs\/abcdefghijklmnopqrstuvwx$/);
});
