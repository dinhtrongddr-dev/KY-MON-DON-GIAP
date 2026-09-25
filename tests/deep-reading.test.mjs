import test from 'node:test';
import assert from 'node:assert/strict';
import {TOPICS,GENERATES,CONTROLS} from '../dist/guide.mjs';
import {elementLink} from '../dist/reading-focus.mjs';
import {prepareReading,validateReading,buildReadingRequest,READING_PROTOCOL,RULE_VERSION} from '../local/reading.mjs';
import {SURFACE_WRITER_INSTRUCTIONS} from '../dist/qimen/ai/surfacePrompt.mjs';
import {interpretReading} from '../local/interpret.mjs';
import {attachAiRoute,aiRouteOf} from '../local/ai-client.mjs';
import {readingFixture,clarificationFixture} from './reading-fixture.mjs';
import {parseStructuredText} from '../local/codex-client.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';
import {CASE_ENGINE_VERSION} from '../dist/qimen/case/engine.mjs';
import {draftFor,acceptFidelity,questionContract,meaningOf,firstParagraph} from './surface-fixture.mjs';
const body={question:'Báo giá sửa chữa đã nộp, tuần sau công ty tôi có được phản hồi không, phản hồi đó là gì?',topic:'contract',method:'chaibu',input:{year:2026,month:9,day:11,hour:10,minute:0,tzOffset:7}};

test('all 25 element directions remain neutral between two business roles',()=>{
  for(const from of Object.keys(GENERATES))for(const to of Object.keys(GENERATES)){
    const expected=from===to?'same':GENERATES[from]===to?'generates':GENERATES[to]===from?'generated_by':CONTROLS[from]===to?'controls':'controlled_by';
    const actual=elementLink(from,to);assert.equal(actual.kind,expected);assert.doesNotMatch(actual.text,/người|việc|thắng|thua/i);
  }
});

test('all topics and both methods have resolved roles, directional links and valid narrative references',()=>{
  for(const topic of TOPICS)for(const method of ['chaibu','maoshan']){
    const p=prepareReading({...body,topic:topic.id,method});
    for(const t of p.context.topics){
      const roles=t.focus.roles;
      assert.equal(t.focus.links.length,roles.length*(roles.length-1)/2);
      for(const link of t.focus.links){
        const from=roles.find(r=>r.id===link.from),to=roles.find(r=>r.id===link.to);
        assert.equal(link.fromPalace,from.palace);assert.equal(link.toPalace,to.palace);
        assert.ok(p.facts[link.id]);assert.equal(link.samePalace,from.palace===to.palace);
      }
      const context={...p.context,topics:[t]};
      const reading=readingFixture({...p,context});
      assert.equal(validateReading(reading,p.facts,topic.id,context),reading);
    }
  }
});

test('ordered stages require distinct explanations, actual assessments and shared concrete evidence',()=>{
  const p=prepareReading(body),valid=readingFixture(p);
  const mutations=[r=>r.summary.text='Một câu rất ngắn.',r=>r.summary.claim_ids=['unknown'],r=>r.development.reverse(),r=>r.development[0].claim_ids=['not-present'],r=>r.development[0].condition='',r=>r.development[0].text=r.development[1].text,r=>r.development[0].interaction_ids=['graph_unknown'],r=>r.alternative.id='',r=>r.bottleneck.resolution='Không rõ.',r=>r.situation=null];
  for(const mutate of mutations){const r=structuredClone(valid);mutate(r);assert.throws(()=>validateReading(r,p.facts,body.topic,p.context));}
  const generic=prepareReading({...body,topic:'general'}),r=readingFixture(generic);
  r.situation.claim_ids=['ref_work_0'];
  assert.throws(()=>validateReading(r,generic.facts,'general',generic.context),/căn cứ/);
});

test('Hỏi Việc audit rejects bold technical basis and accepts bold natural translation',()=>{
  const p=prepareReading(body),bad=readingFixture(p);
  bad.summary.text='Khai Môn là căn cứ. **Khai Môn tại Càn 6 là trục kỹ thuật của sự việc.** '+bad.summary.text;
  assert.throws(()=>validateReading(bad,p.facts,body.topic,p.context),/dịch nghĩa tự nhiên.*căn cứ kỹ thuật/i);
  const good=readingFixture(p);good.summary.text='Khai Môn tại Càn 6 là căn cứ kỹ thuật. **Cách tiếp cận cởi mở có thể giúp tiến thêm một bước nếu điều kiện thực tế đáp ứng.** '+good.summary.text;
  assert.equal(validateReading(good,p.facts,body.topic,p.context),good);
});

test('deterministic evidence and interactions are bound by the app, never by the writer',async()=>{
  const p=prepareReading({...body,question:'Diễn biến tiếp theo của việc ký hợp đồng thế nào?'}),contract=questionContract(p);
  const output=await interpretReading(p,{reviewer:acceptFidelity,runner:async(_i,payload,schema)=>{
    const row=schema.properties.sections.items.properties;
    assert.deepEqual(Object.keys(row).sort(),['id','text']);
    assert.equal(Object.hasOwn(row,'technicalEvidence'),false);assert.equal(Object.hasOwn(row,'claim_ids'),false);
    return draftFor(payload);
  }});
  assert.equal(output.status,'reading');
  for(const u of contract.units.filter(u=>u.interactionIds))
    assert.deepEqual(output.sections[u.id].paragraphs[0].trace.interaction_ids,u.interactionIds);
});

test('missing provenance receives one structured rewrite without changing allowed meaning',async()=>{
  const p=prepareReading(body),seen=[];
  const output=await interpretReading(p,{reviewer:acceptFidelity,runner:async(instructions,payload,schema,{signal})=>{
    seen.push(payload);assert.equal(instructions,SURFACE_WRITER_INSTRUCTIONS);assert.equal(signal.aborted,false);assert.equal(schema.properties.sections.type,'array');
    const r=draftFor(payload);if(seen.length===1)r.sections.find(s=>s.id==='answer').claim_ids=['invented'];return r;
  }});
  assert.equal(seen.length,2);assert.equal(output.status,'reading');assert.equal(seen[0].revision,undefined);
  assert.ok(seen[1].revision.violations.some(v=>v.code==='SECTION_SCHEMA'));
  assert.deepEqual(seen[1].units,seen[0].units);assert.equal(seen[1].question,body.question);
  assert.equal(seen[0].readingGraph,undefined);assert.equal(seen[0].evidence,undefined);
});

test('a second inadequate reading returns verified facts; authentication or transport errors are never retried',async()=>{
  const p=prepareReading(body);let count=0;
  const route={id:'sol',provider:'9router/codex',model:'cx/gpt-5.6-sol',modelId:'gpt-5.6-sol',label:'GPT-5.6 Sol',routeLabel:'9router · ChatGPT',effort:'xhigh',fallbackIndex:0};
  const fallback=await interpretReading(p,{runner:async()=>{count++;return attachAiRoute({},route);}});assert.equal(fallback.status,'verified_fallback');assert.equal(count,2);
  assert.equal(aiRouteOf(fallback)?.modelId,'gpt-5.6-sol');
  assert.doesNotThrow(()=>validateReading(fallback,p.facts,body.topic,p.context));
  count=0;await assert.rejects(interpretReading(p,{runner:async()=>{count++;throw new Error('Không có quyền truy cập model');}}),/quyền truy cập/);assert.equal(count,1);
});

test('cancel during rewrite aborts the same request; late output never succeeds',async()=>{
  const p=prepareReading(body),controller=new AbortController();let count=0;
  await assert.rejects(interpretReading(p,{signal:controller.signal,runner:async(_i,_c,_s,{signal})=>{
    count++;if(count===1)return {};
    controller.abort();assert.equal(signal.aborted,true);return readingFixture(p);
  }}),{name:'AbortError'});assert.equal(count,2);
  count=0;await assert.rejects(interpretReading(p,{signal:controller.signal,runner:async()=>{count++;}}),{name:'AbortError'});assert.equal(count,0);
});

test('materially missing input is clarified before any writer call',async()=>{
  const p=prepareReading({...body,mode:'direction'});let count=0;
  const r=await interpretReading(p,{runner:async()=>{count++;return {};}});
  assert.equal(count,0);assert.deepEqual(r.development,[]);assert.equal(r.status,'needs_clarification');
});

test('v6 request fingerprint binds the planner, mode, Nian Ming-ready contract and shared semantic matrix',async()=>{
  const p=await buildReadingRequest(body);assert.equal(p.request.protocol,6);assert.equal(READING_PROTOCOL,6);assert.equal(RULE_VERSION,'TG-CB-6.3');assert.equal(p.request.caseRules,CASE_ENGINE_VERSION);assert.equal(p.request.nianmingRules,'KM-NIANMING-1.0');
  assert.ok(p.context.topics[0].focus.distinguish.includes('Phân biệt có phản hồi'));
  const writer=buildWriterContext(p.context);assert.equal(writer.semanticMatrix.version,'KM-SEMANTIC-MATRIX-1.1');assert.equal(writer.semanticMatrix.domain.id,'business');assert.ok(writer.semanticMatrix.palaces.length>0);
});

test('mixed family and money question keeps family primary and finance secondary only in semantic translation',()=>{
  const p=prepareReading({...body,question:'Vợ tôi có nên ở nhà chăm con, tôi có đủ tiền và thu nhập không?',topic:'family'}),writer=buildWriterContext(p.context);
  assert.equal(writer.semanticMatrix.domain.id,'children_parenting');assert.equal(writer.semanticMatrix.secondaryDomain.id,'investment_finance');
  assert.equal(p.context.allInOne.resolvedTopic,'family');
});

test('structured parser accepts schema JSON and one fenced JSON block, but not prose around it',()=>{
  assert.deepEqual(parseStructuredText('{\"answer\":\"ok\"}'),{answer:'ok'});
  assert.deepEqual(parseStructuredText('```json\n{\"answer\":\"ok\"}\n```'),{answer:'ok'});
  assert.throws(()=>parseStructuredText('Kết quả: {\"answer\":\"ok\"}'),/chưa hợp lệ/);
});

test('timing audit keeps valid prose, accepts deterministic response dates, and does not mistake ordinal thứ năm for Thursday',()=>{
  const p=prepareReading(body),r=readingFixture(p);
  r.situation.text+=' Yếu tố thứ năm trong chuỗi căn cứ chỉ là thứ tự trình bày, không phải một ngày trong tuần.';
  r.timing.text+=' Mốc 17/09/2026 là cửa sổ kích hoạt để kiểm chứng, không phải ngày bảo đảm kết quả.';
  assert.doesNotThrow(()=>validateReading(r,p.facts,body.topic,p.context));
});

test('invented timing is rewritten from structured feedback and never silently repaired',async()=>{
  const p=prepareReading(body);let count=0;
  const result=await interpretReading(p,{reviewer:acceptFidelity,runner:async(_i,payload)=>{
    count++;const r=draftFor(payload);
    if(count===1)firstParagraph(r).meaning+=' Kết quả sẽ rõ trong 5 ngày.';
    else assert.ok(payload.revision.violations.length);return r;
  }});
  assert.equal(count,2);assert.equal(result.status,'reading');
  assert.doesNotMatch(meaningOf(result),/5 ngày/);
  assert.doesNotThrow(()=>validateReading(result,p.facts,body.topic,p.context));
});

test('persistent invented events end in the exact natural fallback, not a patched AI success',async()=>{
  const p=prepareReading(body);let count=0;
  const result=await interpretReading(p,{reviewer:acceptFidelity,runner:async(_i,payload)=>{
    count++;const r=draftFor(payload);firstParagraph(r).meaning+=' Khoản thu sẽ được xác nhận và chuyển tiền.';return r;
  }});
  assert.equal(count,2);assert.equal(result.status,'verified_fallback');
  assert.doesNotMatch(meaningOf(result),/Khoản thu sẽ được xác nhận/);
  assert.doesNotMatch(meaningOf(result),/deterministic|cap|veto|Kết luận chỉ phản ánh/);
  assert.doesNotThrow(()=>validateReading(result,p.facts,body.topic,p.context));
});

test('repeated verification is a style report, not an automatic rewrite gate',async()=>{
  const p=prepareReading(body);let count=0;
  const result=await interpretReading(p,{reviewer:acceptFidelity,runner:async(_i,payload)=>{
    count++;const r=draftFor(payload);
    for(const section of r.sections)section.text+=' Bạn cần xác minh quyền phê duyệt.';
    return r;
  }});
  assert.equal(count,1);assert.equal(result.status,'reading');
  assert.ok((meaningOf(result).match(/xác minh quyền phê duyệt/g)||[]).length>1);
});

test('a completed event invented in a negotiation answer is blocked before acceptance',async()=>{
  const p=prepareReading({...body,mode:'negotiation',question:'Tôi nên đàm phán điều khoản nào trước để tiến tới thỏa thuận?'});let count=0;
  const result=await interpretReading(p,{reviewer:acceptFidelity,runner:async(_i,payload)=>{
    count++;const r=draftFor(payload);if(count===1)firstParagraph(r).meaning+=' Hợp đồng đã hoàn tất.';return r;
  }});
  assert.equal(count,2);assert.equal(result.status,'reading');assert.doesNotMatch(meaningOf(result),/Hợp đồng đã hoàn tất/);
});

test('certainty rewrite preserves the subject and condition instead of inserting boilerplate',async()=>{
  const p=prepareReading(body);let count=0;
  const base='Nếu người duyệt xác nhận điều khoản cuối, hợp đồng ';
  const reviewer=async(_i,{draft})=>({violations:count===1?[{code:'CERTAINTY_ESCALATION',unitId:'answer',sentence:firstParagraph(draft).meaning,reason:'Điều kiện chưa đủ để bảo đảm thành công.',allowedMeaning:['Kết luận và điều kiện đã duyệt.']}]:[]});
  const result=await interpretReading(p,{reviewer,runner:async(_i,payload)=>{
    count++;const r=draftFor(payload);
    firstParagraph(r).meaning+=' '+base+(count===1?'chắc chắn sẽ thành công.':'nghiêng về khả năng tiến thêm một bước.');
    if(count===2)assert.ok(payload.revision.violations.length);return r;
  }});
  assert.equal(count,2);assert.equal(result.status,'reading');
  assert.ok(meaningOf(result).includes(base+'nghiêng về khả năng'));
  assert.doesNotMatch(meaningOf(result),/chắc chắn sẽ thành công|Kết luận chỉ mô tả xu hướng/);
});
