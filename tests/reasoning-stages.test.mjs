import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareReading,readingIdentity} from '../local/reading.mjs';
import {buildQuestionContext} from '../dist/qimen/ai/questionContext.mjs';
import {buildReadingEvidenceGraph} from '../dist/qimen/ai/reasoningPlanner.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/income-emergence-2026-09-16.json',import.meta.url)));
const prepare=(question=fixture.body.question,extra={})=>prepareReading({...fixture.body,question,...extra});
const graph=p=>p.context.allInOne.reasoning;

test('finance_income_emergence: frozen target chart has a goal-led conditional positive judgment',async()=>{
  const p=prepare(),g=graph(p),q=g.questionContext,e=fixture.expected;
  assert.equal((await readingIdentity(p)).chartFingerprint,fixture.chartFingerprint);
  for(const key of ['domain','intent'])assert.equal(q[key],e[key]);
  assert.equal(q.outcomeTarget.stageAsked,e.stageAsked);assert.equal(q.outcomeTarget.realizationAsked,false);
  for(const id of ['self','event'])for(const key of ['palace','stem'])assert.equal(g.nodes.find(n=>n.id===id)[key],e[id][key]);
  assert.equal(g.outcomeDimensions.income_emergence.status,e.income_emergence);
  assert.ok(e.cash_realization.includes(g.outcomeDimensions.cash_realization.status));
  assert.equal(g.primaryJudgment.answerClass,e.answerClass);
  assert.ok(g.primaryJudgment.strongestSupport.includes('p3'));assert.ok(g.primaryJudgment.strongestLimit.includes('c8'));
  assert.equal(g.evidenceBundles[0].palace,3);
  assert.ok(!g.nodes.some(n=>e.forbiddenActors.includes(n.id)));
  assert.ok(!q.stakeholders.some(n=>e.forbiddenActors.includes(n.role)));
  assert.match(g.primaryJudgment.distinction,/phát sinh.*thực nhận/);
});

for(const [group,question,domain,intent,stage] of [
  ['finance_cash_realization','Tiền có vào tài khoản trong tuần này không?','finance','income','cash_realization'],
  ['finance_payment','Có khách hàng đồng ý thanh toán không?','finance','payment','confirmation'],
  ['finance_completion','Khoản đang chờ có hoàn tất không?','finance','income','completion'],
  ['finance_opportunity','Có cơ hội kiếm tiền không?','finance','income','opportunity'],
  ['business_contract','Tôi có ký được hợp đồng không?','business','contract','confirmation'],
  ['business_reply','Khách hàng đã nhận báo giá. Khi nào có phản hồi?','business','reply','emergence'],
  ['project_result','Dự án có hoàn tất nghiệm thu không?','project','project_result','completion'],
  ['career_change','Tôi có chuyển việc được không?','career','career_change','realization'],
  ['relationship','Tình cảm của tôi và người yêu sẽ tiến triển ra sao?','relationship','relationship','formation'],
  ['family_decision','Gia đình có nên thay đổi nơi sinh hoạt không?','family','family_decision','execution'],
])test(`${group}: context and processed writer preserve the stage being asked`,()=>{
  const p=prepare(question),g=graph(p),q=g.questionContext,w=buildWriterContext(p.context);
  assert.equal(q.domain,domain);assert.equal(q.intent,intent);assert.equal(q.outcomeTarget.stageAsked,stage);
  assert.equal(g.eventStages.stages.length,7);assert.equal(w.readingGraph.primaryJudgment.answerClass,g.primaryJudgment.answerClass);
  assert.equal(g.eventStages.observed.status,'user_report_only');
  assert.ok(g.eventStages.stages.every(s=>s.observed!==true),'chart support is not an observed event');
  for(const d of Object.values(g.outcomeDimensions)){
    assert.ok(d.reason);assert.ok(d.confidenceLevel);assert.ok(Array.isArray(d.conditions));
    for(const id of [...d.supportingEvidenceIds,...d.limitingEvidenceIds])assert.ok(Object.hasOwn(p.facts,id),id);
  }
});

test('void_modifier: removing only self void does not change the positive emergence or its relevance',()=>{
  const p=prepare(),a=structuredClone(p.analysis),c=p.context.allInOne;
  const original=graph(p),without=()=>buildReadingEvidenceGraph(a,c.questionContext,c.plan,c.graph,c.board);
  a.palaces.find(p=>p.number===8).voided=false;
  const changed=without();
  assert.equal(original.outcomeDimensions.income_emergence.status,'positive');
  assert.equal(changed.outcomeDimensions.income_emergence.status,'positive');
  assert.equal(original.evidenceBundles.find(b=>b.palace===8).relevance.score,changed.evidenceBundles.find(b=>b.palace===8).relevance.score);
  for(const b of original.evidenceBundles)for(const key of ['questionRelevance','actorRelevance','goalRelevance','stageRelevance','structuralStrength','corroboration','modifierImportance','conflictPriority'])assert.equal(typeof b.relevance[key],'number');
  const selfVoid=original.conflicts.find(c=>c.actorIds.includes('self')&&c.code==='opening_unrealized');
  assert.notEqual(selfVoid.affectedDimension,'income_emergence');assert.ok(selfVoid.evidenceIds.includes('c8'));
  assert.ok(!/thanh toán|người có quyền chấp thuận/.test(selfVoid.resolution));
  const self=original.evidenceBundles.find(b=>b.actorIds.includes('self'));
  assert.equal(self.translation.social,'self_agency');
});

for(const [name,type,effect] of [['counterflow','control','pressure'],['supporting_flow','generate','support']])test(`${name}: matter-to-self relationships change transitions and actions`,()=>{
  const p=prepare(),c=p.context.allInOne,edge=c.graph.relations.find(e=>e.from==='event'&&e.to==='self');
  assert.ok(edge);
  const changed={...c.graph,relations:c.graph.relations.map(e=>e.id===edge.id?{...e,type,samePalace:false}:e)};
  const g=buildReadingEvidenceGraph(p.analysis,c.questionContext,c.plan,changed,c.board);
  assert.equal(g.interactions.find(i=>i.edgeId===edge.id).effect,effect);
  assert.ok(g.eventStages.transitions.some(t=>t.relationshipIds.includes(edge.id)&&t.effects.includes(effect)));
  assert.ok(g.recommendations.some(r=>r.sourceEvidenceIds.includes(edge.id)));
  assert.ok(g.recommendations.every(r=>r.action&&r.reason&&r.targetBlocker&&r.expectedEffect));
});

test('timing: explicit horizon scans deterministic Void/Horse response candidates without promising outcomes',()=>{
  const t=graph(prepare()).timing;
  assert.equal(t.window.start,'2026-09-14');assert.equal(t.window.end,'2026-09-20');
  assert.equal(t.timingConfidence,'medium');assert.equal(t.basis,'deterministic_response_scan_v2');
  assert.equal(t.version,'KM-YINGQI-2.0');assert.equal(t.pace.tendency,'slow');
  assert.deepEqual(t.candidates.map(x=>x.display),['17/09/2026','18/09/2026','19/09/2026']);
  assert.ok(t.candidates.every(x=>x.rule==='void_release'&&x.reasons.some(r=>/Không/.test(r))));
  assert.ok(t.allowedPredictions.includes('17/09/2026'));assert.match(t.limit,/không phải ngày bảo đảm/i);
  const next=graph(prepare('Tháng sau có tiền phát sinh không?')).timing;
  assert.equal(next.window.start,'2026-10-01');assert.equal(next.window.end,'2026-10-31');
  const unknown=graph(prepare('Tôi có khoản tiền phát sinh không?')).timing;
  assert.equal(unknown.window,null);assert.deepEqual(unknown.candidates,[]);assert.equal(unknown.timingConfidence,'low');
});

test('deep reasoning adds coverage without a mandatory long word quota or raw board',()=>{
  const p=prepare(undefined,{depth:'deep'}),w=buildWriterContext(p.context);
  assert.ok(w.length.minWords<=180);assert.ok(!w.length.target.includes('900'));
  assert.ok(w.readingGraph.outcomeDimensions);assert.equal(w.readingGraph.eventStages.stages.length,7);
  assert.equal(w.board,undefined);assert.equal(w.allInOne,undefined);
  assert.ok(w.readingGraph.claims.every(c=>c.semanticTags.length));
});

test('actor metadata and supplied identities retain explicit provenance without guessing identities',()=>{
  const g=graph(prepare('Khách hàng có đồng ý thanh toán không?',{actors:{customer:'壬子'}}));
  assert.equal(g.nodes.find(n=>n.id==='customer').status,'user_supplied');
  for(const n of g.nodes){assert.equal(n.actorId,n.id);assert.ok(n.source);assert.ok(n.evidenceIds.length);assert.ok(n.confidenceLevel);assert.equal(typeof n.relevance,'number');}
  const q=buildQuestionContext('Tôi đã gửi báo giá; khách chưa trả lời. Có phản hồi trong tuần không?');
  assert.equal(q.intent,'reply');assert.equal(q.outcomeTarget.stageAsked,'emergence');
});

test('a universal useful-god location alone cannot make every income chart positive',()=>{
  const states=new Set();
  for(let hour=0;hour<24;hour+=2){const p=prepare(undefined,{input:{...fixture.body.input,hour}});states.add(graph(p).outcomeDimensions.income_emergence.status);}
  assert.ok(states.size>1,'Sinh Mon exists on every board; goal and event must be combined');
});

test('actual reported confirmations do not change an emergence question into a payment question',()=>{
  const c=buildQuestionContext('Tôi đã nhận một khoản tiền hôm qua. Tuần này có khoản thu mới phát sinh không?');
  assert.equal(c.outcomeTarget.stageAsked,'emergence');
  const q=buildQuestionContext('Khách đã thanh toán khoản cũ. Tuần này có cơ hội ký hợp đồng mới không?');
  assert.equal(q.intent,'contract');assert.equal(q.outcomeTarget.stageAsked,'opportunity');
});

test('relationship activation and obstruction use actual cluster modifiers, not palace opposition alone',()=>{
  const p=prepare(),c=p.context.allInOne,a=structuredClone(p.analysis),event=a.palaces.find(p=>p.number===3);
  event.horse=true;event.voided=false;
  let g=buildReadingEvidenceGraph(a,c.questionContext,c.plan,c.graph,c.board);
  assert.ok(g.eventStages.transitions.some(t=>t.effects.includes('activation')));
  event.conditions.doorPressure=true;
  g=buildReadingEvidenceGraph(a,c.questionContext,c.plan,c.graph,c.board);
  assert.ok(g.interactions.some(i=>i.affectsGoal&&i.effects.includes('obstruction')));
  assert.ok(g.outcomeDimensions.income_formation.limitingEvidenceIds.includes('c3'));
});
