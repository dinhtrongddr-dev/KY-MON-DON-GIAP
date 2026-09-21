import test from 'node:test';
import assert from 'node:assert/strict';
import {hostGuestFrame,innerOuterZone} from '../dist/qimen/analysis/roleEngine.mjs';
import {prepareReading} from '../local/reading.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';

const input={year:2026,month:9,day:21,hour:6,minute:23,tzOffset:7};
const prepare=(question,extra={})=>prepareReading({input,question,topic:'general',mode:'auto',method:'chaibu',...extra});

test('KM-ROLE-2.0 inner/outer mapping matches Yang/Yin Dun convention without changing timing meaning',()=>{
  for(const p of [1,8,3,4])assert.equal(innerOuterZone('yang',p),'inner');
  for(const p of [9,2,7,6])assert.equal(innerOuterZone('yang',p),'outer');
  for(const p of [9,2,7,6])assert.equal(innerOuterZone('yin',p),'inner');
  for(const p of [1,8,3,4])assert.equal(innerOuterZone('yin',p),'outer');
});

test('Host/Guest is contextual: initiating question makes self Guest; receiving question makes self Host',()=>{
  const roles=[{id:'self',status:'convention'},{id:'customer',status:'user_supplied',yongshenTier:'counterpart'}];
  const guest=hostGuestFrame({pillars:{hour:{stem:{han:'乙'}}}},{question:'Tôi chủ động liên hệ để đàm phán với khách hàng.',stakeholders:[{role:'customer',status:'mentioned'}]},roles);
  assert.equal(guest.timeBias,'guest_first_move');
  assert.equal(guest.questionPosture,'initiator');
  assert.equal(guest.selfRole,'guest');
  assert.equal(guest.counterpartRole,'host');
  assert.equal(guest.alignment,'aligned');

  const host=hostGuestFrame({pillars:{hour:{stem:{han:'辛'}}}},{question:'Họ liên hệ trước và tôi chờ phản hồi tiếp theo.',stakeholders:[{role:'customer',status:'mentioned'}]},roles);
  assert.equal(host.timeBias,'host_later_response');
  assert.equal(host.questionPosture,'receiver');
  assert.equal(host.selfRole,'host');
  assert.equal(host.counterpartRole,'guest');
  assert.equal(host.alignment,'aligned');

  const counter=hostGuestFrame({pillars:{hour:{stem:{han:'辛'}}}},{question:'Tôi chủ động liên hệ để đàm phán với khách hàng.',stakeholders:[{role:'customer',status:'mentioned'}]},roles);
  assert.equal(counter.alignment,'counter_time');
});

test('unresolved counterpart stays without palace, agency or invented Host/Guest power',()=>{
  const p=prepare('Tôi nên chủ động liên hệ khách hàng để đàm phán hợp đồng không?',{mode:'strategy'});
  const customer=p.analysis.roleProfile.roles.find(r=>r.id==='customer');
  assert.equal(customer.palace,null);
  assert.equal(customer.agencyBand,'unresolved');
  assert.equal(customer.strength,null);
  assert.ok(p.analysis.roleProfile.multiActor.unresolvedCounterparts.includes('customer'));
  assert.match(customer.agencyMeaning,/không được suy mạnh\/yếu/i);
});

test('known counterpart receives its own role dynamics and directional influence without a winner label',()=>{
  const p=prepare('Tôi nên chủ động liên hệ khách hàng để đàm phán hợp đồng không?',{mode:'strategy',actors:{customer:'壬子'}});
  const rp=p.analysis.roleProfile;
  const self=rp.roles.find(r=>r.id==='self'),customer=rp.roles.find(r=>r.id==='customer');
  assert.equal(self.hostGuest,'guest');
  assert.equal(customer.hostGuest,'host');
  assert.equal(customer.status,'user_supplied');
  assert.notEqual(customer.agencyBand,'unresolved');
  const pressure=rp.influences.find(i=>i.from==='customer'&&i.to==='self'&&i.effect==='pressure');
  assert.ok(pressure);
  assert.match(pressure.meaning,/không phải kết luận bên nào thắng/i);
  assert.equal(Object.hasOwn(pressure,'winner'),false);
});

test('multiple roles in one palace are one evidence cluster, not independent votes',()=>{
  const p=prepare('Tôi nên chủ động liên hệ khách hàng để đàm phán hợp đồng không?',{mode:'strategy',actors:{customer:'壬子'}});
  const g=p.context.allInOne.reasoning;
  const shared=g.roleProfile.sharedPalaceClusters.find(c=>c.roleIds.includes('self')&&c.roleIds.includes('capital'));
  assert.ok(shared);
  assert.match(shared.meaning,/không được đếm.*độc lập/i);
  assert.equal(g.roleProfile.roles.find(r=>r.id==='self').evidenceIndependence,'shared_palace_cluster');
  assert.equal(g.evidenceBundles.filter(b=>b.actorIds.includes('self')||b.actorIds.includes('capital')).filter(b=>b.palace===shared.palace).length,1);
});

test('three user-supplied external actors remain separate parties with explicit mappings',()=>{
  const p=prepare('Tôi phải làm gì để giành hợp đồng?',{mode:'business',actors:{customer:'壬子',competitor:'丁卯',decisionMaker:'乙丑'}});
  const g=p.context.allInOne.reasoning;
  for(const id of ['customer','competitor','decisionMaker']){
    const row=g.roleProfile.roles.find(r=>r.id===id);
    assert.ok(row,id);
    assert.notEqual(row.palace,null,id);
    assert.notEqual(row.agencyBand,'unresolved',id);
    assert.ok(g.roleProfile.multiActor.resolvedCounterparts.includes(id),id);
  }
  assert.equal(g.roleProfile.roles.find(r=>r.id==='customer').party,'counterpart');
  assert.equal(g.roleProfile.roles.find(r=>r.id==='competitor').party,'competitor');
  assert.equal(g.roleProfile.roles.find(r=>r.id==='decisionMaker').party,'authority');
});

test('writer receives role posture/agency but no probability or winner field',()=>{
  const p=prepare('Tôi nên chủ động liên hệ khách hàng để đàm phán hợp đồng không?',{mode:'strategy',actors:{customer:'壬子'}});
  const w=buildWriterContext(p.context).readingGraph;
  assert.equal(w.roleProfile.version,'KM-ROLE-2.0');
  assert.equal(w.roleProfile.hostGuest.selfRole,'guest');
  assert.ok(w.nodes.some(n=>n.id==='self'&&n.zone&&n.agencyBand));
  const raw=JSON.stringify(w.roleProfile);
  assert.doesNotMatch(raw,/"winner"/i);
  assert.doesNotMatch(raw,/"probability"/i);
  assert.doesNotMatch(raw,/"score"/i);
});

test('strategy mode can use Role posture without overriding direct blockers',()=>{
  const p=prepare('Tôi nên chủ động liên hệ khách hàng để đàm phán hợp đồng không?',{mode:'strategy',actors:{customer:'壬子'}});
  const g=p.context.allInOne.reasoning;
  assert.equal(g.roleProfile.hostGuest.timeBias,'guest_first_move');
  assert.equal(g.roleProfile.hostGuest.questionPosture,'initiator');
  assert.ok(['prepare_and_verify','reduce_exposure','small_reversible_step','hold_then_respond'].includes(g.likelyScenario.modeDecision.inputs.initiative));
  const self=g.roleProfile.roles.find(r=>r.id==='self');
  if(self.agencyBand==='constrained')assert.equal(g.likelyScenario.modeDecision.inputs.initiative,'prepare_and_verify');
  assert.ok(g.recommendations.every(r=>r.postureGuidance));
});
