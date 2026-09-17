import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {prepareReading} from '../local/reading.mjs';
import {deliberationSchema,shouldDeliberate} from '../dist/qimen/ai/deliberation.mjs';
globalThis.Solar=createRequire(import.meta.url)('../dist/vendor/lunar.js').Solar;

const base={question:'Trong 30 ngày tới tôi có nhận được hợp đồng A không?',topic:'contract',method:'chaibu',input:{year:2026,month:9,day:17,hour:17,minute:24,tzOffset:7}};

test('prediction, strategy, business and negotiation use a bounded planning pass',()=>{
  for(const mode of ['prediction','strategy','business','negotiation']){
    const p=prepareReading({...base,mode});
    assert.equal(shouldDeliberate(p.context),true);
    const schema=deliberationSchema(p.context);
    assert.equal(schema.additionalProperties,false);
    assert.deepEqual(schema.properties.answer_class.enum,[p.context.allInOne.reasoning.primaryJudgment.answerClass]);
    assert.ok(schema.properties.decisive_claim_ids.items.enum.every(id=>id.startsWith('claim_')));
  }
});

test('timing and direction stay deterministic comparison passes',()=>{
  for(const mode of ['timing','direction']){
    const p=prepareReading({...base,mode,direction:mode==='direction'?{origin:'cửa chính',kind:'movement'}:null,candidates:mode==='timing'?['2026-09-18T09:00','2026-09-19T09:00']:[]});
    assert.equal(shouldDeliberate(p.context),false);
  }
});
