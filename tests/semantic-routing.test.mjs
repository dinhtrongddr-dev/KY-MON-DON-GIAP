import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {buildQuestionContext} from '../dist/qimen/ai/questionContext.mjs';
import {prepareReading} from '../local/reading.mjs';
import {deliberationSchema} from '../dist/qimen/ai/deliberation.mjs';
globalThis.Solar=createRequire(import.meta.url)('../dist/vendor/lunar.js').Solar;

const question='Vợ tôi có nên ở nhà chăm con đến khi 2 tuổi không? Tôi là trụ cột về kinh tế, tôi đủ khả năng không?';

test('family childcare decision routes to strategy instead of generic prediction',()=>{
  const q=buildQuestionContext(question,{topic:'general',mode:'auto'});
  assert.equal(q.domain,'family');
  assert.equal(q.resolvedTopic,'family');
  assert.equal(q.mode,'strategy');
  assert.equal(q.questionType,'strategy');
  assert.equal(q.intent,'family_decision');
  assert.ok(q.stakeholders.some(s=>s.role==='customer'&&s.status==='mentioned'));
});

test('age milestone is preserved as an explicit decision horizon without fake calendar dates',()=>{
  const q=buildQuestionContext(question,{topic:'general',mode:'auto'});
  assert.equal(q.timeHorizon.status,'explicit_milestone');
  assert.equal(q.timeHorizon.code,'milestone_age');
  assert.equal(q.timeHorizon.targetAge,2);
  const p=prepareReading({question,topic:'general',mode:'auto',method:'chaibu',input:{year:2026,month:9,day:17,hour:20,minute:15,tzOffset:7}});
  assert.equal(p.context.allInOne.reasoning.timing.window,null);
  assert.match(p.context.allInOne.reasoning.timing.limit,/2 tuoi|2 tuổi|mốc/i);
});

test('unknown vocabulary stays neutral instead of being forced into career',()=>{
  const q=buildQuestionContext('Tôi có nên tiếp tục phương án này thêm một thời gian không?',{topic:'general',mode:'auto'});
  assert.equal(q.domain,'general');
  assert.equal(q.resolvedTopic,'general');
  assert.equal(q.mode,'strategy');
});

test('planning schema lets the model expand directly related considerations without turning them into facts',()=>{
  const p=prepareReading({question,topic:'general',mode:'auto',method:'chaibu',input:{year:2026,month:9,day:17,hour:20,minute:15,tzOffset:7}});
  const schema=deliberationSchema(p.context);
  const frame=schema.properties.semantic_frame;
  assert.ok(frame);
  assert.equal(frame.additionalProperties,false);
  assert.deepEqual(frame.properties.related_considerations.items.properties.source.enum,['explicit','entailed','check_only']);
  assert.ok(schema.required.includes('semantic_frame'));
});
