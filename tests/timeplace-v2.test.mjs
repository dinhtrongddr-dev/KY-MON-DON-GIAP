import test from 'node:test';
import assert from 'node:assert/strict';
import {generateQimen} from '../dist/qimen/core/board.mjs';
import {resolveIanaLocal,resolveTimePlace,equationOfTimeMinutes} from '../dist/qimen/timePlace.mjs';
import {prepareReading,buildReadingRequest} from '../local/reading.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';

const baseInput={year:2026,month:9,day:21,hour:6,minute:23,tzOffset:7};
const body=(input=baseInput,extra={})=>({
  question:'Công việc của tôi tháng này có tiến triển không?',
  topic:'general',mode:'auto',method:'chaibu',input,...extra
});

test('KM-TIMEPLACE-2.0 default fixed-offset path preserves the legacy board exactly',()=>{
  const legacy=generateQimen(baseInput,'chaibu');
  const prepared=prepareReading(body());
  assert.deepEqual(prepared.chart,legacy);
  assert.equal(prepared.timePlace.version,'KM-TIMEPLACE-2.0');
  assert.equal(prepared.timePlace.metadata.mode,'fixed_offset');
  assert.equal(prepared.timePlace.metadata.effectiveOffsetHours,7);
  assert.equal(prepared.timePlace.metadata.solar,null);
});

test('coordinates create solar metadata only and never alter the fixed-offset board',()=>{
  const legacy=generateQimen(baseInput,'chaibu');
  const prepared=prepareReading(body(baseInput,{timePlace:{mode:'fixed_offset',longitude:106.7,latitude:10.8}}));
  assert.deepEqual(prepared.chart,legacy);
  const solar=prepared.timePlace.metadata.solar;
  assert.equal(solar.application,'metadata_only');
  assert.equal(solar.longitude,106.7);
  assert.ok(Number.isFinite(solar.equationOfTimeMinutes));
  assert.ok(Number.isFinite(solar.apparentSolarCorrectionMinutes));
  assert.match(solar.warning,/không tự thay giờ dân dụng/i);
});

test('modern Asia/Ho_Chi_Minh IANA civil time resolves to UTC+07 and matches fixed-offset board',()=>{
  const original={...baseInput,tzOffset:0};
  const resolved=resolveIanaLocal(original,'Asia/Ho_Chi_Minh');
  assert.equal(resolved.offsetHours,7);
  assert.equal(resolved.status,'unique');
  const prepared=prepareReading(body(original,{timePlace:{mode:'iana_civil',timeZone:'Asia/Ho_Chi_Minh'}}));
  assert.equal(prepared.chart.input.tzOffset,7);
  assert.deepEqual(prepared.chart,generateQimen(baseInput,'chaibu'));
  assert.equal(prepared.timePlace.originalInput.tzOffset,0);
});

test('New York repeated DST hour rejects by default and resolves earlier/later explicitly',()=>{
  const input={year:2024,month:11,day:3,hour:1,minute:30,tzOffset:-5};
  assert.throws(()=>resolveIanaLocal(input,'America/New_York'),/xuất hiện hai lần/i);
  const earlier=resolveIanaLocal(input,'America/New_York',{disambiguation:'earlier'});
  const later=resolveIanaLocal(input,'America/New_York',{disambiguation:'later'});
  assert.equal(earlier.offsetHours,-4);
  assert.equal(later.offsetHours,-5);
  assert.equal(earlier.status,'ambiguous_resolved');
  assert.equal(later.status,'ambiguous_resolved');
  assert.equal(later.utcMs-earlier.utcMs,3600000);
});

test('New York spring-forward nonexistent civil time is rejected instead of normalized',()=>{
  const input={year:2024,month:3,day:10,hour:2,minute:30,tzOffset:-5};
  assert.throws(()=>resolveIanaLocal(input,'America/New_York'),/không tồn tại/i);
});

test('timing comparison re-resolves IANA offset for every candidate across DST',()=>{
  const input={year:2024,month:3,day:9,hour:12,minute:0,tzOffset:-5};
  const prepared=prepareReading({
    question:'Ngày nào nên gửi báo giá?',
    topic:'contract',mode:'timing',action:'quote',method:'chaibu',input,
    timePlace:{mode:'iana_civil',timeZone:'America/New_York'},
    candidates:['2024-03-09T12:00','2024-03-11T12:00']
  });
  const rows=prepared.context.allInOne.comparison.candidates;
  assert.equal(rows.length,2);
  assert.equal(rows[0].input.tzOffset,-5);
  assert.equal(rows[1].input.tzOffset,-4);
  assert.equal(rows[0].timePlace.iana.timeZone,'America/New_York');
  assert.equal(rows[1].timePlace.iana.timeZone,'America/New_York');
  assert.match(prepared.context.allInOne.comparison.convention,/resolve lại offset IANA/i);
});

test('reading request preserves original civil input and explicit TimePlace policy for server recomputation',async()=>{
  const original={year:2024,month:7,day:1,hour:12,minute:0,tzOffset:7};
  const prepared=await buildReadingRequest(body(original,{timePlace:{mode:'iana_civil',timeZone:'America/New_York',longitude:-74.006,latitude:40.7128}}));
  assert.equal(prepared.chart.input.tzOffset,-4);
  assert.equal(prepared.request.input.tzOffset,7);
  assert.equal(prepared.request.timePlace.mode,'iana_civil');
  assert.equal(prepared.request.timePlace.timeZone,'America/New_York');
  assert.equal(prepared.request.timePlace.longitude,-74.006);
  const roundtrip=await buildReadingRequest(prepared.request);
  assert.equal(roundtrip.chartFingerprint,prepared.chartFingerprint);
  assert.equal(roundtrip.requestFingerprint,prepared.requestFingerprint);
});

test('writer sees TimePlace as bounded metadata, not a solar-time board rewrite',()=>{
  const prepared=prepareReading(body(baseInput,{timePlace:{mode:'fixed_offset',longitude:106.7,latitude:10.8}}));
  const writer=buildWriterContext(prepared.context).readingGraph;
  assert.equal(writer.timePlace.version,'KM-TIMEPLACE-2.0');
  assert.equal(writer.timePlace.mode,'fixed_offset');
  assert.equal(writer.timePlace.solar.application,'metadata_only');
  assert.ok(Number.isFinite(writer.timePlace.solar.apparentSolarCorrectionMinutes));
  assert.match(writer.timePlace.solar.warning,/không tự thay/i);
  assert.equal(Object.hasOwn(writer.timePlace.solar,'apparentSolarClock'),false);
});

test('invalid coordinates are rejected and equation-of-time calculation remains finite',()=>{
  assert.throws(()=>resolveTimePlace(baseInput,{mode:'fixed_offset',longitude:181}),/Kinh độ/i);
  assert.throws(()=>resolveTimePlace(baseInput,{mode:'fixed_offset',longitude:106.7,latitude:91}),/Vĩ độ/i);
  assert.throws(()=>resolveTimePlace(baseInput,{mode:'fixed_offset',latitude:10.8}),/kinh độ/i);
  assert.ok(Number.isFinite(equationOfTimeMinutes(baseInput)));
});
