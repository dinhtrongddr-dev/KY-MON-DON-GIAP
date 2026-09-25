import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareReading} from '../local/reading.mjs';
import {buildNarrativeContract} from '../dist/qimen/ai/narrativeContract.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';
import {buildPresentationProfile} from '../dist/qimen/ai/presentation.mjs';

const question='Tôi có nên nghỉ việc để chăm con khoảng một năm, tài chính có chịu được không, có bị tụt hậu hoặc khó quay lại nghề không? Tôi cần quyết định gần cuối tháng 10.';
const prepare=q=>prepareReading({question:q,topic:'general',mode:'auto',method:'chaibu',input:{year:2026,month:9,day:22,hour:11,minute:28,tzOffset:7}});
test('narrative contract retains deterministic conclusion and bounds all five real decision facets',()=>{
  const p=prepare(question),g=p.context.allInOne.reasoning,id=g.claims[0].id;
  const related_considerations=['nghỉ việc','tài chính','một năm','tụt hậu','quay lại nghề','cuối tháng 10'].map(label=>({label,why_relevant:'Liên quan trực tiếp tới quyết định.',source:'explicit',source_quote:label,claim_ids:[id]}));
  related_considerations.push({label:'Ngân sách đã đủ',why_relevant:'Không có trong câu hỏi.',source:'explicit',source_quote:'đã tiết kiệm 500 triệu',claim_ids:[id]});
  related_considerations.push({label:'Trao đổi với người thân',why_relevant:'Một việc cần kiểm tra.',source:'check_only',source_quote:'',claim_ids:['invented']});
  const contract=buildNarrativeContract(p.context,{semantic_frame:{related_considerations}});
  assert.equal(contract.primaryConclusion.meaning,g.primaryJudgment.main);
  assert.equal(contract.primaryConclusion.certainty,g.primaryJudgment.answerClass);
  assert.deepEqual(contract.primaryConclusion.claimIds,g.primaryJudgment.claimIds);
  assert.equal(contract.facets.length,7);
  assert.deepEqual(contract.facets.at(-1).claimIds,[]);
  assert.equal(contract.facets.at(-1).authority,'practical_check');
  assert.equal(contract.facets.at(-1).conclusion,null);
  assert.ok(contract.forbiddenImplications.length);
  assert.ok(contract.facets.every(f=>f.claimIds.every(id=>g.claims.some(c=>c.id===id))));
  assert.equal(buildWriterContext(p.context).narrativeContract.question,question);
});
test('decision questions can address facets without a mandatory three-stage timeline',()=>{
  const p=prepare(question),profile=buildPresentationProfile(p.context);
  assert.equal(profile.showDevelopment,false);
  assert.equal(profile.showAlternative,false);
  assert.equal(profile.layout,'focused');
  assert.equal(buildPresentationProfile(prepare('Tôi nên làm gì tiếp theo để giành hợp đồng?').context).showDevelopment,true);
});
