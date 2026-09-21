import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareMenhReading,buildMenhReadingRequest,writerContextForPrepared} from '../local/menh-reading.mjs';
import {MENH_PROTOCOL,MENH_RULE_VERSION} from '../dist/menh-core.mjs';
import {MENH_SPEC_VERSION,MENH_RUNTIME_VERSION,MENH_RECTIFICATION_VERSION} from '../dist/qimen/menh/version.mjs';
import {RECTIFICATION_VALIDATION_CASES,RECTIFICATION_VALIDATION_STATUS,RECTIFICATION_WINDOWS} from '../dist/qimen/menh/rectification.mjs';
import {CASE_ENGINE_VERSION} from '../dist/qimen/case/engine.mjs';

const known={birthDateLocal:'1990-01-01',birthTimeMode:'KNOWN',birthTimeLocal:'09:30',tzOffset:7,age:37,annualYear:2026,sexMetadata:'MALE'};
const events=[
  {kind:'CAREER',year:2015,date:'2015'},
  {kind:'CAREER',year:2018,date:'2018'},
  {kind:'MARRIAGE',year:2020,date:'2020'},
  {kind:'WEALTH',year:2022,date:'2022'},
  {kind:'RELOCATION',year:2024,date:'2024'},
];

test('KM-MENH-1.1 upgrades runtime/protocol while preserving frozen 1.0 spec identity',async()=>{
  assert.equal(MENH_SPEC_VERSION,'KM-MENH-1.0');
  assert.equal(MENH_RUNTIME_VERSION,'KM-MENH-1.1');
  assert.equal(MENH_RULE_VERSION,'KM-MENH-1.1');
  assert.equal(MENH_PROTOCOL,2);
  const p=await buildMenhReadingRequest(known);
  assert.equal(p.result.specVersion,'KM-MENH-1.0');
  assert.equal(p.result.runtimeVersion,'KM-MENH-1.1');
  assert.equal(p.request.rules,'KM-MENH-1.1');
  assert.equal(p.request.protocol,2);
  assert.equal(p.request.caseRules,CASE_ENGINE_VERSION);
});

test('known Mệnh exposes separated Strength/Structure layers without replacing the frozen natal resolver',()=>{
  const p=prepareMenhReading(known),layers=p.result.analysisLayers;
  assert.equal(layers.version,'KM-MENH-ANALYSIS-1.1');
  assert.equal(layers.strengthProfile.version,'KM-STRENGTH-2.0');
  assert.equal(layers.structureProfile.version,'KM-STRUCTURE-2.0');
  assert.equal(p.result.profileId,'ZHANG_ADVANCED_CLASS_LIFETIME');
  assert.ok(Object.keys(layers.byPalace).length===8);
  assert.ok(layers.roles.some(r=>r.id==='menh_self'&&r.yongshenTier==='primary'));
  assert.match(layers.meaning,/không phải xác suất/i);
});

test('writer receives modern structure meanings and bounded TimePlace metadata, not archaic response names',()=>{
  const p=prepareMenhReading({...known,timePlace:{mode:'fixed_offset',longitude:106.7,latitude:10.8}});
  const ctx=writerContextForPrepared(p);
  assert.equal(ctx.runtimeVersion,'KM-MENH-1.1');
  assert.equal(ctx.analysisLayers.version,'KM-MENH-ANALYSIS-1.1');
  assert.equal(ctx.timePlace.solar.application,'metadata_only');
  for(const row of Object.values(ctx.analysisLayers.byPalace)){
    for(const response of row.structure.stemResponses){
      assert.equal(Object.hasOwn(response,'name'),false);
      assert.ok(response.plainMeaning.length>20);
    }
  }
  assert.equal(ctx.restrictions.solarBoardRewrite,false);
  assert.equal(ctx.restrictions.rectificationAccuracyClaim,false);
});

test('modern Ho Chi Minh IANA civil mode resolves +07 and produces the same natal board as fixed UTC+07',()=>{
  const fixed=prepareMenhReading(known);
  const iana=prepareMenhReading({...known,tzOffset:0,timePlace:{mode:'iana_civil',timeZone:'Asia/Ho_Chi_Minh'}});
  assert.equal(iana.technical.timePlace.mode,'iana_civil');
  assert.equal(iana.technical.timePlace.effectiveOffsetHours,7);
  assert.equal(iana.technical.timePlace.timeZone,'Asia/Ho_Chi_Minh');
  assert.deepEqual(iana.result.natal.baseBoard,fixed.result.natal.baseBoard);
});

test('Mệnh coordinates create solar comparison metadata but never alter the fixed-offset natal board',()=>{
  const fixed=prepareMenhReading(known);
  const located=prepareMenhReading({...known,timePlace:{mode:'fixed_offset',longitude:106.7,latitude:10.8}});
  assert.deepEqual(located.result.natal.baseBoard,fixed.result.natal.baseBoard);
  assert.equal(located.technical.timePlace.solar.application,'metadata_only');
  assert.match(located.technical.timePlace.solar.warning,/không tự thay giờ dân dụng/i);
});

test('UNKNOWN IANA mode still preserves all 13 executable candidates for a normal non-DST date',()=>{
  const p=prepareMenhReading({...known,birthTimeMode:'UNKNOWN',birthTimeLocal:null,tzOffset:0,timePlace:{mode:'iana_civil',timeZone:'Asia/Ho_Chi_Minh'}});
  assert.equal(p.candidateCount,13);
  assert.deepEqual(p.technical.timePlace.effectiveOffsets,[7]);
  assert.equal(p.result.stability.autoSelectedBirthHour,null);
  assert.equal(p.result.stability.majorityVerdictAllowed,false);
});

test('Rectification 1.0 is research-only, annual-resolution only and never auto-selects a birth hour',()=>{
  const p=prepareMenhReading({...known,birthTimeMode:'UNKNOWN',birthTimeLocal:null,lifeEvents:events,birthTimeWindow:'ALL'});
  const r=p.rectification;
  assert.equal(r.version,MENH_RECTIFICATION_VERSION);
  assert.equal(r.validationStatus,'RESEARCH_ONLY');
  assert.equal(r.validationCaseCount,1);
  assert.equal(r.accuracyClaimAllowed,false);
  assert.equal(r.autoSelectedBirthHour,null);
  assert.equal(r.majorityVoteAllowed,false);
  assert.equal(r.annualResolutionOnly,true);
  assert.ok(['RESEARCH_LEADING','RESEARCH_TIED'].includes(r.status));
  assert.ok(r.ranked.length>1);
  assert.ok(r.runnerUpId);
});

test('day/month precision inside the same event year does not fabricate extra rectification weight',()=>{
  const yearOnly=prepareMenhReading({...known,birthTimeMode:'UNKNOWN',birthTimeLocal:null,lifeEvents:events,birthTimeWindow:'ALL'});
  const dated=prepareMenhReading({...known,birthTimeMode:'UNKNOWN',birthTimeLocal:null,lifeEvents:[
    {...events[0],month:6,day:15,precision:'DAY',date:'15/06/2015'},
    {...events[1],month:8,day:20,precision:'DAY',date:'20/08/2018'},
    {...events[2],month:12,day:12,precision:'DAY',date:'12/12/2020'},
    {...events[3],month:4,day:3,precision:'DAY',date:'03/04/2022'},
    {...events[4],month:9,day:1,precision:'DAY',date:'01/09/2024'},
  ],birthTimeWindow:'ALL'});
  const score=x=>x.rectification.ranked.map(r=>[r.id,r.supportUnits,r.supportedEvents,r.primaryHits,r.secondaryHits]);
  assert.deepEqual(score(dated),score(yearOnly));
});

test('rectification abstains when minimum event/domain gate is not met',()=>{
  const p=prepareMenhReading({...known,birthTimeMode:'UNKNOWN',birthTimeLocal:null,lifeEvents:[
    {kind:'CAREER',year:2015,date:'2015'},
    {kind:'CAREER',year:2018,date:'2018'},
    {kind:'CAREER',year:2020,date:'2020'},
  ]});
  assert.equal(p.rectification.status,'RESEARCH_INSUFFICIENT');
  assert.equal(p.rectification.leadingCandidateId,null);
});

test('night remembered window matches 23:00–04:59 and does not leak Hai hour',()=>{
  assert.equal(RECTIFICATION_WINDOWS.NIGHT.includes('ZI'),true);
  assert.equal(RECTIFICATION_WINDOWS.NIGHT.includes('CHOU'),true);
  assert.equal(RECTIFICATION_WINDOWS.NIGHT.includes('YIN'),true);
  assert.equal(RECTIFICATION_WINDOWS.NIGHT.includes('HAI'),false);
});

test('remembered time window filters the candidate set even before enough events exist',()=>{
  const p=prepareMenhReading({...known,birthTimeMode:'UNKNOWN',birthTimeLocal:null,lifeEvents:[],birthTimeWindow:'MORNING'});
  assert.equal(p.rectification.status,'NEED_EVENTS');
  assert.ok(p.rectification.candidateCount<p.candidateCount);
  assert.ok(p.rectification.candidateIds.length===p.rectification.candidateCount);
  const families=new Set(p.candidates.filter(c=>p.rectification.candidateIds.includes(c.id)).map(c=>c.family));
  assert.deepEqual([...families].sort(),['CHEN','MAO','SI','WU'].sort());
});

test('blind research fixture count stays aligned with the declared validation-case gate',()=>{
  const fixture=JSON.parse(readFileSync(new URL('./fixtures/menh-rectification-blind.json',import.meta.url),'utf8'));
  assert.equal(fixture.status,'RESEARCH');
  assert.equal(fixture.cases.length,RECTIFICATION_VALIDATION_CASES);
  assert.equal(RECTIFICATION_VALIDATION_STATUS,'RESEARCH_ONLY');
});
