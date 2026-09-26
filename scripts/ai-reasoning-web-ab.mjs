import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {prepareReading} from '../local/reading.mjs';
import {prepareMenhReading} from '../local/menh-reading.mjs';
import {interpretReading} from '../local/interpret.mjs';
import {interpretMenhReading} from '../local/menh-interpret.mjs';
import {runSurfaceText} from '../local/surface-writer.mjs';
import {runAIText,runAI,aiRouteOf} from '../local/ai-client.mjs';
import {surfaceParagraphs} from '../dist/qimen/ai/surfaceReading.mjs';
import {buildNeutralBaselineInput,inspectNeutralBaselineInput,NEUTRAL_BASELINE_INSTRUCTIONS} from '../local/neutral-baseline.mjs';

const fixture=JSON.parse(await readFile(new URL('../tests/fixtures/ai-reading-v2-eval.json',import.meta.url)));
const rounds=Math.max(1,Number(process.env.EVAL_ROUNDS||1));
const selected=new Set(String(process.env.EVAL_CASES||'').split(',').map(x=>x.trim()).filter(Boolean));
const cases=selected.size?fixture.cases.filter(c=>selected.has(c.id)):fixture.cases;
if(!cases.length)throw new Error('Không tìm thấy case được chọn.');
const runId=(process.env.EVAL_RUN_ID||new Date().toISOString()).replace(/[:.]/g,'-');
const outputRoot=resolve(process.env.EVAL_OUTPUT_ROOT||'docs/ai-reasoning-ab/runs');
const outDir=join(outputRoot,runId);
await mkdir(outputRoot,{recursive:true});
await mkdir(outDir,{recursive:false});

const writerEnv={...process.env,QIMEN_WRITER_PROVIDER:'chatgpt2api',QIMEN_CHATGPT2API_ENABLED:'1'};
const sha=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const diagnostics=[];
const recordDiagnostic=row=>diagnostics.push({...row,at:new Date().toISOString()});
function prepare(c){return c.kind==='question'?prepareReading(c.input):prepareMenhReading(c.input);}
function visibleReading(reading){
 return surfaceParagraphs(reading).map(p=>p.meaning.trim()).filter(Boolean).join('\n\n');
}
function routeInfo(value){
 const route=aiRouteOf(value);
 return route?{id:route.id,provider:route.provider,model:route.modelId,effort:route.effort,fallbackIndex:route.fallbackIndex}:null;
}
async function runDirect(c,prepared){
 const input=buildNeutralBaselineInput(c,prepared),audit=inspectNeutralBaselineInput(input),started=Date.now();
 const result=await runAIText(NEUTRAL_BASELINE_INSTRUCTIONS,input,{env:writerEnv,diagnostics:recordDiagnostic});
 return {variant:'A',label:'chatweb-direct-neutral',text:result.text,status:'completed',
  latencyMs:Date.now()-started,route:routeInfo(result),inputAudit:{...audit,sha256:sha(input)}};
}
async function runApp(c,prepared){
 const started=Date.now(),rawDrafts=[],fidelityReviews=[];
 const runner=async(...args)=>{const draft=await runSurfaceText(...args);rawDrafts.push(draft);return draft;};
 const reviewer=async(...args)=>{const report=await runAI(...args);fidelityReviews.push(report);return report;};
 const reading=await (c.kind==='question'
  ?interpretReading(prepared,{runner,planRunner:runAI,reviewer,diagnostics:recordDiagnostic})
  :interpretMenhReading(prepared,{runner,reviewer,diagnostics:recordDiagnostic}));
 return {variant:'B',label:'app-full-pipeline',text:visibleReading(reading),status:reading.status,
  latencyMs:Date.now()-started,route:routeInfo(reading),rawDrafts,fidelityReviews,
  planningUsed:Boolean(reading.planning),planning:reading.planning||null,sectionCount:surfaceParagraphs(reading).length};
}
async function capture(fn,base){
 try{return {...base,...await fn()};}
 catch(error){return {...base,status:'failed',error:{name:error.name,code:error.code||null,message:error.message},text:''};}
}
const rows=[];
for(const c of cases)for(let round=1;round<=rounds;round++){
 const prepared=prepare(c),base={caseId:c.id,kind:c.kind,round,question:c.kind==='question'?c.input.question:'Lá số Mệnh '+c.input.birthDateLocal};
 const a=await capture(()=>runDirect(c,prepared),{...base,variant:'A'});
 console.log(JSON.stringify({caseId:c.id,round,variant:'A',status:a.status,latencyMs:a.latencyMs||null}));
 const b=await capture(()=>runApp(c,prepared),{...base,variant:'B'});
 console.log(JSON.stringify({caseId:c.id,round,variant:'B',status:b.status,latencyMs:b.latencyMs||null}));
 rows.push(a,b);
 await writeFile(join(outDir,'machine.partial.json'),JSON.stringify({runId,rows,diagnostics},null,2)+'\n');
}

const dimensions=['directness','naturalness','reasoningCoherence','specificity','actionability','nonRepetition','calibration'];
const reviewSchema={
 type:'object',additionalProperties:false,required:['preferred','scores','findings'],
 properties:{
  preferred:{type:'string',enum:['X','Y','TIE']},
  scores:{type:'object',additionalProperties:false,required:['X','Y'],properties:{
   X:{type:'object',additionalProperties:false,required:dimensions,properties:Object.fromEntries(dimensions.map(x=>[x,{type:'integer',minimum:1,maximum:5}]))},
   Y:{type:'object',additionalProperties:false,required:dimensions,properties:Object.fromEntries(dimensions.map(x=>[x,{type:'integer',minimum:1,maximum:5}]))}
  }},
  findings:{type:'array',items:{type:'object',additionalProperties:false,required:['code','winner','reason'],properties:{
   code:{type:'string'},winner:{type:'string',enum:['X','Y','TIE']},reason:{type:'string'}
  }}}
 }
};
const REVIEW_INSTRUCTIONS=`Bạn là giám khảo biên tập độc lập. So sánh hai bài luận Kỳ Môn đã ẩn nguồn, không tự luận lại bàn và không ưu tiên độ dài. Chấm 1-5 cho: trả lời trực tiếp, tự nhiên như hội thoại ChatGPT, mạch suy luận, bám riêng ca, khả năng hành động, không lặp, và mức chắc chắn phù hợp. Phạt văn mẫu, lặp cùng cảnh báo, nhảy từ biểu tượng sang sự kiện thật, hoặc lời khuyên chung chung. Chọn X, Y hoặc TIE. Findings phải nêu khác biệt quan sát được; không đoán hệ thống phía sau.`;

const reviews=[],blindItems=[],blindKey=[];
for(const c of cases)for(let round=1;round<=rounds;round++){
 const pair=rows.filter(r=>r.caseId===c.id&&r.round===round);
 if(pair.some(r=>r.status==='failed'))continue;
 const flip=(sha(c.id+':'+round).charCodeAt(0)%2)===1;
 const x=pair.find(r=>r.variant===(flip?'B':'A')),y=pair.find(r=>r.variant===(flip?'A':'B'));
 const item={caseId:c.id,kind:c.kind,round,prompt:x.question,X:x.text,Y:y.text};
 blindItems.push(item);blindKey.push({caseId:c.id,round,X:x.variant,Y:y.variant});
 try{
  const started=Date.now();
  const result=await runAI(REVIEW_INSTRUCTIONS,item,reviewSchema,{diagnostics:recordDiagnostic});
  reviews.push({caseId:c.id,round,status:'completed',latencyMs:Date.now()-started,...result});
  console.log(JSON.stringify({caseId:c.id,round,review:'completed',preferred:result.preferred}));
 }catch(error){
  reviews.push({caseId:c.id,round,status:'failed',error:{name:error.name,code:error.code||null,message:error.message}});
 }
}
function originalWinner(review){
 const key=blindKey.find(x=>x.caseId===review.caseId&&x.round===review.round);
 if(!key||review.preferred==='TIE')return review.preferred||null;
 return key[review.preferred];
}
const completedReviews=reviews.filter(x=>x.status==='completed');
const wins={A:0,B:0,TIE:0};
for(const r of completedReviews)wins[originalWinner(r)]++;
const aggregate={};
for(const variant of ['A','B']){
 aggregate[variant]=Object.fromEntries(dimensions.map(d=>{
  const values=[];
  for(const r of completedReviews){
   const key=blindKey.find(x=>x.caseId===r.caseId&&x.round===r.round);
   const blind=key.X===variant?'X':'Y';values.push(r.scores[blind][d]);
  }
  return [d,values.length?Number((values.reduce((a,b)=>a+b,0)/values.length).toFixed(2)):null];
 }));
}
const summary={
 runId,generatedAt:new Date().toISOString(),caseCount:cases.length,rounds,samples:rows.length,
 transportNote:'A uses the local chatgpt2api account transport; it is a direct neutral prompt, not a claim of ChatGPT web UI parity.',
 completed:rows.filter(x=>x.status!=='failed').length,failed:rows.filter(x=>x.status==='failed').length,
 verifiedFallbacks:rows.filter(x=>x.status==='verified_fallback').length,wins,aggregate,
 diagnosticCounts:Object.fromEntries([...new Set(diagnostics.map(x=>x.type))].map(type=>[type,diagnostics.filter(x=>x.type===type).length]))
};
function report(){
 const lines=['# Báo cáo A/B suy luận '+runId,'',`- Ca: ${cases.length}; vòng: ${rounds}; mẫu: ${rows.length}`,`- Hoàn tất: ${summary.completed}; lỗi: ${summary.failed}; verified fallback: ${summary.verifiedFallbacks}`,`- Thắng: A=${wins.A}, B=${wins.B}, hòa=${wins.TIE}`,'','## Điểm trung bình AI-review','',
 '| Chiều | A trực tiếp | B full app |','|---|---:|---:|',
 ...dimensions.map(d=>`| ${d} | ${aggregate.A[d]??'-'} | ${aggregate.B[d]??'-'} |`),
 '','## Ghi chú phương pháp','',
 '- A chỉ nhận bàn, ánh xạ vai và hướng dẫn phương pháp trung tính; không nhận Planner, Narrative Contract, gate hay kết luận của app.',
 '- B chạy pipeline đầy đủ của app, gồm lập kế hoạch khi cần, Writer, kiểm tra ngữ nghĩa và fallback có kiểm soát.',
 '- Điểm trong báo cáo là AI-review mù, không được ghi nhận là phiếu người dùng hoặc người chấm.',
 '- Chatgpt2api là transport tài khoản local; báo cáo không tuyên bố đây là giao diện ChatGPT Web.'
 ];
 return lines.join('\n')+'\n';
}
await writeFile(join(outDir,'manifest.json'),JSON.stringify({runId,cases:cases.map(c=>c.id),rounds,dimensions,instructionHash:sha(NEUTRAL_BASELINE_INSTRUCTIONS)},null,2)+'\n');
await writeFile(join(outDir,'machine.json'),JSON.stringify({summary,rows,diagnostics},null,2)+'\n');
await writeFile(join(outDir,'blind.json'),JSON.stringify({rubric:dimensions,items:blindItems},null,2)+'\n');
await writeFile(join(outDir,'blind-key.json'),JSON.stringify(blindKey,null,2)+'\n');
await writeFile(join(outDir,'ai-review.json'),JSON.stringify(reviews,null,2)+'\n');
await writeFile(join(outDir,'report.md'),report());
console.log('REPORT '+JSON.stringify({outDir,summary}));
if(summary.failed)process.exitCode=1;
