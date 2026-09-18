import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareMenhReading} from '../local/menh-reading.mjs';
import {interpretMenhReading} from '../local/menh-interpret.mjs';
import {validateMenhReading} from '../dist/qimen/menh/ai/reading-audit.mjs';
import {buildMenhWriterContext} from '../dist/qimen/menh/ai/writer-context.mjs';

const payload={birthDateLocal:'1990-01-01',birthTimeMode:'KNOWN',birthTimeLocal:'09:30',tzOffset:7,age:37,annualYear:2026};
const empty=()=>({text:'',claim_ids:[]});
function valid(ctx){
  const first=ctx.claims[0];
  return {status:'reading',specVersion:ctx.specVersion,profileId:ctx.profileId,
    overview:{text:'Tổng quan có điều kiện từ các căn cứ deterministic đã tính.',claim_ids:[first.claimId]},
    self:empty(),family:empty(),marriage:empty(),career:empty(),wealth:empty(),luck:empty(),annual:empty(),birthTimeNote:empty()};
}
test('Mệnh interpreter repairs one invalid draft and accepts the next claim-bound draft',async()=>{
  const prepared=prepareMenhReading(payload);let calls=0;
  const reading=await interpretMenhReading(prepared,{runner:async(_i,ctx)=>{
    calls++;
    if(calls===1){const bad=valid(ctx);bad.overview.claim_ids=['INVENTED'];return bad;}
    return valid(ctx);
  }});
  assert.equal(calls,2);
  const ctx=buildMenhWriterContext(prepared.result,{birthTimeMode:'KNOWN'});
  assert.equal(validateMenhReading(reading,ctx),reading);
});
test('Mệnh interpreter falls back to deterministic claims after two invalid drafts',async()=>{
  const prepared=prepareMenhReading(payload);let calls=0;
  const reading=await interpretMenhReading(prepared,{runner:async(_i,ctx)=>{
    calls++;const bad=valid(ctx);bad.overview.claim_ids=['INVENTED'];return bad;
  }});
  assert.equal(calls,2);
  assert.equal(reading.profileId,prepared.result.profileId);
  assert.ok(reading.overview.claim_ids.every(id=>prepared.result.claims.some(c=>c.claimId===id)));
  assert.match(reading.self.text,/Nhật can|Bản thân|bản thân/i);
});
test('UNKNOWN deterministic fallback explicitly preserves birth-time uncertainty',async()=>{
  const prepared=prepareMenhReading({...payload,birthTimeMode:'UNKNOWN',birthTimeLocal:null});
  const reading=await interpretMenhReading(prepared,{runner:async(_i,ctx)=>{
    const bad=valid(ctx);bad.overview.claim_ids=['INVENTED'];return bad;
  }});
  assert.match(reading.birthTimeNote.text,/Không nhớ giờ sinh/);
  assert.match(reading.birthTimeNote.text,/không được bỏ phiếu đa số/);
  assert.doesNotMatch(reading.birthTimeNote.text,/giờ sinh (đúng|chính xác) là/i);
});
