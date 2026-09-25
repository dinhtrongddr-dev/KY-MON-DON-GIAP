import test from 'node:test';
import assert from 'node:assert/strict';
import {buildBlindMaterials,summarizeBlindScores} from '../scripts/ai-reading-blind-review.mjs';
import {buildCanaryReport} from '../scripts/canary-acceptance-report.mjs';

const blind={
 rubric:['focus','clarity','depth','specificity','repetition','certainty','actionability'],
 items:[
  {caseId:'Q01',kind:'question',round:1,variant:'X',valid:true,sections:[{id:'answer',text:'Phương án X.'}]},
  {caseId:'Q01',kind:'question',round:1,variant:'Y',valid:true,sections:[{id:'answer',text:'Phương án Y.'}]}
 ]
};
const key={X:'B/v2-current',Y:'C/v2-chatgpt2api'};

test('blind review preparation hides providers and creates all rubric columns',()=>{
 const built=buildBlindMaterials(blind);
 assert.equal(built.count,2);
 assert.match(built.packet,/phương án X/);
 assert.doesNotMatch(built.packet,/chatgpt2api/);
 assert.match(built.scorecard,/focus\tclarity\tdepth\tspecificity\trepetition\tcertainty\tactionability/);
});

test('blind review summary requires complete valid scores and baseline delta',()=>{
 const built=buildBlindMaterials(blind);
 const lines=built.scorecard.trimEnd().split('\n');
 const filled=[lines[0],...lines.slice(1).map(line=>{
  const cells=line.split('\t'),score=cells[4]==='Y'?'5':'4';
  for(let index=5;index<=11;index++)cells[index]=score;
  return cells.join('\t');
 })].join('\n')+'\n';
 const summary=summarizeBlindScores(blind,key,filled,{baselineAverage:4});
 assert.equal(summary.complete,true);
 assert.equal(summary.selectedCandidate,'Y');
 assert.equal(summary.selectedProvider,'C/v2-chatgpt2api');
 assert.equal(summary.deltaFromBaseline,1);
 assert.equal(summary.pass,true);
 const incomplete=summarizeBlindScores(blind,key,built.scorecard);
 assert.equal(incomplete.pass,false);
 assert.ok(incomplete.blockers.includes('INCOMPLETE_REVIEW'));
});
test('canary report uses metadata only and enforces sample/error gates',()=>{
 const start=Date.parse('2026-09-25T10:50:00Z');
 const activity={events:[
  {type:'reading',at:start+1000,finishedAt:start+11000,status:'completed',route:'chatgpt2api · local',model:'ChatGPT Web'},
  {type:'reading',at:start+2000,finishedAt:start+22000,status:'completed',route:'chatgpt2api · local',model:'ChatGPT Web'}
 ]};
 const style=[{at:'2026-09-25T10:51:00Z',code:'SURFACE_STYLE',stage:'surface_style',attempt:1}];
 const report=buildCanaryReport(activity,style,{since:'2026-09-25T10:50:00Z',minimumSamples:2,
  now:new Date('2026-09-25T11:00:00Z')});
 assert.equal(report.pass,true);
 assert.equal(report.samples.completed,2);
 assert.equal(report.samples.eligibleCompleted,2);
 assert.equal(report.errors.styleSignals,1);
 assert.deepEqual(report.privacy,{rawQuestionsIncluded:false,errorMessagesIncluded:false});
 const blocked=buildCanaryReport(activity,[...style,
  {at:'2026-09-25T10:52:00Z',code:'READING_VALIDATION',stage:'async_job'}],
  {since:'2026-09-25T10:50:00Z',minimumSamples:2,now:new Date('2026-09-25T11:00:00Z')});
 assert.equal(blocked.pass,false);
 assert.ok(blocked.blockers.includes('CRITICAL_ERROR'));
});
