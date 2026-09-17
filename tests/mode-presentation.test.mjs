import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPresentationProfile} from '../dist/qimen/ai/presentation.mjs';

const context=(mode,{question='Việc này có thành không?',depth='standard',allowedPredictions=[]}={})=>({allInOne:{classification:{mode},questionContext:{question,depth},reasoning:{timing:{allowedPredictions}}}});
const labels=profile=>profile.tabs.map(([,label])=>label);

test('standard prediction is result-first without forced diễn biến or ứng kỳ',()=>{
  const p=buildPresentationProfile(context('prediction'));
  assert.equal(p.layout,'focused');
  assert.equal(p.showDevelopment,false);
  assert.equal(p.showTiming,false);
  assert.deepEqual(labels(p),['Bài luận','Điều cần làm','Căn cứ Kỳ Môn']);
});

test('prediction only adds diễn biến when requested and calls timing ứng kỳ only when supported',()=>{
  const story=buildPresentationProfile(context('prediction',{question:'Diễn biến tiếp theo của việc này ra sao?'}));
  assert.equal(story.showDevelopment,true);assert.ok(labels(story).includes('Diễn biến'));
  const timed=buildPresentationProfile(context('prediction',{allowedPredictions:[{id:'t1'}]}));
  assert.equal(timed.showTiming,true);assert.ok(labels(timed).includes('Ứng kỳ'));
  const deep=buildPresentationProfile(context('prediction',{depth:'deep'}));
  assert.ok(labels(deep).includes('Thời gian & giới hạn'));
});

test('strategy, business and negotiation expose distinct decision surfaces',()=>{
  assert.deepEqual(labels(buildPresentationProfile(context('strategy'))),['Bài luận','Lộ trình','Hành động','Điểm dừng / kích hoạt','Căn cứ Kỳ Môn']);
  assert.deepEqual(labels(buildPresentationProfile(context('business'))),['Bài luận','Pipeline','Bước chốt','Rủi ro & điều kiện','Căn cứ Kỳ Môn']);
  assert.deepEqual(labels(buildPresentationProfile(context('negotiation'))),['Bài luận','Nhịp trao đổi','Đòn bẩy & bước tiếp','Giới hạn / điểm dừng','Căn cứ Kỳ Môn']);
});

test('timing and direction are comparison layouts, not generic event narratives',()=>{
  for(const mode of ['timing','direction']){
    const p=buildPresentationProfile(context(mode));
    assert.equal(p.layout,'focused');assert.equal(p.showDevelopment,false);assert.equal(p.showAlternative,false);
    assert.ok(!labels(p).includes('Diễn biến'));
  }
});
