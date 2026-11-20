import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareMenhReading} from '../local/menh-reading.mjs';
import {interpretMenhReading} from '../local/menh-interpret.mjs';
import {validateMenhReading} from '../dist/qimen/menh/ai/reading-audit.mjs';
import {buildMenhWriterContext} from '../dist/qimen/menh/ai/writer-context.mjs';
import {draftFor,acceptFidelity,meaningOf,firstParagraph} from './surface-fixture.mjs';
const payload={birthDateLocal:'1990-01-01',birthTimeMode:'KNOWN',birthTimeLocal:'09:30',tzOffset:7,age:37,annualYear:2026};
test('Mệnh interpreter rewrites one invalid claim-bound draft with structured feedback',async()=>{
  const prepared=prepareMenhReading(payload);let calls=0;
  const reading=await interpretMenhReading(prepared,{reviewer:acceptFidelity,runner:async(_i,ctx)=>{
    calls++;const r=draftFor(ctx);
    if(calls===1)r.sections[0].claim_ids=['INVENTED'];
    else assert.ok(ctx.revision.violations.some(v=>v.code==='SECTION_SCHEMA'));
    return r;
  }});
  assert.equal(calls,2);assert.equal(reading.status,'reading');
  const ctx=buildMenhWriterContext(prepared.result,{birthTimeMode:'KNOWN'});
  assert.equal(validateMenhReading(reading,ctx),reading);
});
test('Mệnh fallback is natural, traceable, and independently recomputable after two failures',async()=>{
  const prepared=prepareMenhReading(payload);let calls=0;
  const reading=await interpretMenhReading(prepared,{runner:async(_i,ctx)=>{
    calls++;const r=draftFor(ctx);r.sections[0].claim_ids=['INVENTED'];return r;
  }});
  assert.equal(calls,2);assert.equal(reading.status,'verified_fallback');
  assert.equal(reading.identity.profileId,prepared.result.profileId);
  const ctx=buildMenhWriterContext(prepared.result,{birthTimeMode:'KNOWN'});
  assert.equal(validateMenhReading(reading,ctx),reading);
  assert.doesNotMatch(meaningOf(reading),/deterministic|\\bcap\\b|\\bveto\\b|GLOBAL_STRUCTURE|KM-/);
  firstParagraph(reading).meaning+=' Bạn đã kết hôn.';
  assert.throws(()=>validateMenhReading(reading,ctx));
});
test('UNKNOWN fallback preserves uncertainty without selecting an exact birth hour',async()=>{
  const prepared=prepareMenhReading({...payload,birthTimeMode:'UNKNOWN',birthTimeLocal:null});
  const reading=await interpretMenhReading(prepared,{runner:async()=>({})});
  const note=reading.sections.birthTimeNote.paragraphs[0].meaning;
  assert.match(note,/Không nhớ giờ sinh/);assert.match(note,/chưa xác nhận giờ sinh thật/);
  assert.doesNotMatch(note,/giờ sinh (đúng|chính xác) là/i);
});
