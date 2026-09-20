import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveYongshenProfile} from '../dist/qimen/analysis/yongshenResolver.mjs';
import {prepareReading} from '../local/reading.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';

const input={year:2026,month:9,day:20,hour:10,minute:0,tzOffset:7};
const prepare=question=>prepareReading({input,question,topic:'general',mode:'auto',method:'chaibu'});

const row=(p,id)=>[...p.roles,...p.extras].find(r=>r.id===id);

test('KM-YONGSHEN-2.0 profiles assign domain-specific primary and secondary roles',()=>{
  const cases=[
    ['career','opportunity','primary','authority','secondary'],
    ['finance','money','primary','capital','secondary'],
    ['study','learning','primary','document','secondary'],
    ['health','health_issue','primary','health_support','secondary'],
    ['legal','dispute','primary','quote','secondary'],
    ['property','property_asset','primary','property_ground','corroborator'],
    ['search','hidden_clue','primary','blocked_clue','secondary'],
    ['travel','movement','primary','travel_support','secondary'],
  ];
  for(const [domain,primary,pTier,secondary,sTier] of cases){
    const p=resolveYongshenProfile({questionContext:{domain,intent:'understand_event',stakeholders:[]}});
    assert.equal(p.version,'KM-YONGSHEN-2.0');
    assert.equal(row(p,primary).tier,pTier,domain);
    assert.equal(row(p,secondary).tier,sTier,domain);
  }
});
test('relationship keeps Yi/Geng as corroborating axis instead of guessing partner identity or gender',()=>{
  const p=resolveYongshenProfile({questionContext:{domain:'relationship',intent:'relationship',stakeholders:[]}});
  assert.equal(row(p,'contract').tier,'primary');
  assert.equal(row(p,'partner_yi').tier,'corroborator');
  assert.equal(row(p,'partner_geng').tier,'corroborator');
  assert.match(row(p,'partner_yi').purpose,/không tự gán giới tính/i);
  assert.match(row(p,'partner_geng').purpose,/không tự gán giới tính/i);
});

test('finance adds commitment/payment layers only when the question stage needs them',()=>{
  const early=resolveYongshenProfile({questionContext:{domain:'finance',intent:'income',stakeholders:[],outcomeTarget:{stageAsked:'emergence'}}});
  assert.equal(row(early,'contract').tier,'corroborator');
  assert.equal(row(early,'payment'),undefined);
  const late=resolveYongshenProfile({questionContext:{domain:'finance',intent:'payment',stakeholders:[],outcomeTarget:{stageAsked:'cash_realization'}}});
  assert.equal(row(late,'contract').tier,'corroborator');
  assert.equal(row(late,'payment').tier,'operational');
});

test('real reading exposes resolver provenance, tiered roles and keeps domain primaries in evidence',()=>{
  const p=prepare('Công việc của tôi trong tháng này có cơ hội tiến triển không?');
  const a=p.analysis,g=p.context.allInOne.reasoning,w=buildWriterContext(p.context).readingGraph;
  assert.equal(a.yongshenProfile.version,'KM-YONGSHEN-2.0');
  const opportunity=a.roles.find(r=>r.id==='opportunity');
  assert.equal(opportunity.yongshenTier,'primary');
  assert.equal(opportunity.selectionRule.id,'rule_yongshen_v2');
  assert.ok(g.evidenceBundles.some(b=>b.roles.some(r=>r.id==='opportunity'&&r.yongshenTier==='primary')));
  assert.equal(w.usefulGodProfile.version,'KM-YONGSHEN-2.0');
  assert.ok(w.nodes.some(n=>n.id==='opportunity'&&n.yongshenTier==='primary'));
});
test('relationship counterpart is explicit but remains unresolved without a user-supplied representative',()=>{
  const p=prepare('Tình cảm của tôi và người yêu sẽ tiến triển ra sao?');
  const a=p.analysis,g=p.context.allInOne.reasoning;
  const other=a.roles.find(r=>r.id==='customer');
  assert.equal(other.yongshenTier,'counterpart');
  assert.equal(other.status,'unresolved');
  assert.equal(other.palace,null);
  assert.ok(g.nodes.some(n=>n.id==='customer'&&n.palace===null));
  assert.ok(g.relationships.every(e=>e.from!=='customer'&&e.to!=='customer'));
});

test('health resolver exposes symbolic care roles without turning them into medical facts',()=>{
  const p=prepare('Sức khỏe của tôi gần đây cần chú ý điều gì?');
  const issue=p.analysis.roles.find(r=>r.id==='health_issue');
  const support=p.analysis.roles.find(r=>r.id==='health_support');
  assert.equal(issue.yongshenTier,'primary');
  assert.equal(support.yongshenTier,'secondary');
  assert.equal(issue.selectionRule.id,'rule_yongshen_v2');
  assert.match(p.analysis.yongshenProfile.safety,/không xác minh.*chẩn đoán/i);
});

test('family resolver activates only the relatives explicitly named in the question',()=>{
  const child=prepare('Vợ tôi có nên ở nhà chăm con nhỏ đến 2 tuổi không?');
  const childRole=child.analysis.roles.find(r=>r.id==='family_child');
  assert.equal(childRole.yongshenTier,'primary');
  assert.equal(childRole.stem,child.context.allInOne.board.pillars.hour.stem.han);
  assert.ok(!child.analysis.roles.some(r=>r.id==='family_parent'));

  const parents=prepare('Tôi và bố mẹ cần thống nhất điều gì trong gia đình?');
  const parentRole=parents.analysis.roles.find(r=>r.id==='family_parent');
  assert.equal(parentRole.yongshenTier,'secondary');
  assert.equal(parentRole.stem,parents.context.allInOne.board.pillars.year.stem.han);
  assert.ok(!parents.analysis.roles.some(r=>r.id==='family_child'));
});

test('family plus financial-capacity question activates finance as a secondary domain without losing family roles',()=>{
  const p=prepare('Vợ tôi có nên ở nhà chăm con nhỏ đến 2 tuổi không? Tôi là trụ cột kinh tế, tôi có đủ khả năng không?');
  assert.deepEqual(p.analysis.yongshenProfile.secondaryDomains,['finance']);
  assert.equal(p.analysis.roles.find(r=>r.id==='money').yongshenTier,'secondary');
  assert.equal(p.analysis.roles.find(r=>r.id==='money').yongshenDomain,'finance');
  assert.equal(p.analysis.roles.find(r=>r.id==='capital').yongshenTier,'corroborator');
  assert.equal(p.analysis.roles.find(r=>r.id==='family_child').yongshenTier,'primary');
  assert.equal(p.analysis.roles.find(r=>r.id==='customer').label,'Vợ/chồng / người thân được nhắc tới');
  const active=p.context.allInOne.reasoning.nodes.map(n=>n.id);
  assert.ok(active.includes('money'));
  assert.ok(!active.some(id=>id.startsWith('topic_')));
});
