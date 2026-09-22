import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateReadingMs,readingProgressText} from '../dist/ai-progress-estimate.mjs';

test('AI ETA uses recent completed reading durations and ignores failed/running entries',()=>{
  const activity={snapshot:()=>({recentReadings:[
    {at:0,finishedAt:120000,status:'completed'},
    {at:0,finishedAt:180000,status:'fallback'},
    {at:0,finishedAt:240000,status:'clarification'},
    {at:0,finishedAt:500000,status:'error'},
    {at:0,finishedAt:null,status:'running'}
  ]})};
  assert.equal(estimateReadingMs(activity),180000);
});

test('AI ETA falls back cleanly and renders an expected completion window',()=>{
  assert.equal(estimateReadingMs(null,{fallbackMs:210000}),210000);
  const text=readingProgressText({startedAt:new Date(2026,8,22,9,0,0).getTime(),now:new Date(2026,8,22,9,0,30).getTime(),estimateMs:180000});
  assert.match(text,/Đã chờ 30 giây/);assert.match(text,/Dự kiến xong khoảng/);
});

test('AI ETA marks work that is taking longer than its expected window',()=>{
  const startedAt=new Date(2026,8,22,9,0,0).getTime();
  const text=readingProgressText({startedAt,now:startedAt+300000,estimateMs:120000});
  assert.match(text,/Lâu hơn dự kiến/);assert.match(text,/vẫn đang xử lý/);
});
