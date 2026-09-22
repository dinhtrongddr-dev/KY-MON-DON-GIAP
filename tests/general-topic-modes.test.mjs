import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
globalThis.Solar=createRequire(import.meta.url)('../dist/vendor/lunar.js').Solar;
const {prepareReading}=await import('../dist/reading-core.mjs');

const input={year:2026,month:9,day:22,hour:13,minute:10,tzOffset:7};
const modes=['prediction','strategy','business','negotiation','timing','direction'];

test('general topic supports every explicit Hỏi Việc mode without requiring a topic-specific lens',()=>{
  for(const mode of modes){
    const body={question:'Tôi cần đánh giá sự việc này như thế nào?',topic:'general',mode,method:'chaibu',input};
    if(mode==='timing'){body.candidates=['2026-09-23T09:00','2026-09-24T14:00'];body.action='general';}
    if(mode==='direction'){body.direction={origin:'Cửa chính',kind:'movement'};body.action='general';}
    const prepared=prepareReading(body);
    assert.equal(prepared.context.allInOne.classification.mode,mode,mode);
    assert.equal(prepared.context.topics[0].id,'general',mode);
    assert.equal(prepared.context.topics[0].focus.roles.length,2,mode);
  }
});
