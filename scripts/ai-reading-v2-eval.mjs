import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {prepareReading,validateReading} from '../local/reading.mjs';
import {prepareMenhReading} from '../local/menh-reading.mjs';
import {buildQuestionNarrativeContract} from '../dist/qimen/ai/narrativeContract.mjs';
import {buildMenhNarrativeContract} from '../dist/qimen/menh/ai/narrative-contract.mjs';
import {surfacePayload} from '../dist/qimen/ai/narrativePrimitives.mjs';
import {SURFACE_WRITER_INSTRUCTIONS} from '../dist/qimen/ai/surfacePrompt.mjs';
import {parseStructuredText} from '../local/codex-client.mjs';
import {runAIText,aiRouteOf} from '../local/ai-client.mjs';
import {validateSurfaceDraft,hydrateSurfaceReading,auditSurfaceStyle} from '../dist/qimen/ai/surfaceReading.mjs';
import {buildMenhWriterContext} from '../dist/qimen/menh/ai/writer-context.mjs';
import {validateMenhReading} from '../dist/qimen/menh/ai/reading-audit.mjs';

const set=JSON.parse(await readFile(new URL('../tests/fixtures/ai-reading-v2-eval.json',import.meta.url)));
const rounds=Number(process.env.EVAL_ROUNDS||2);
const concurrency=Math.max(1,Number(process.env.EVAL_CONCURRENCY||2));
const outDir=new URL('../docs/ai-reading-v2/eval/',import.meta.url);
await mkdir(outDir,{recursive:true});
const variants=[
  {id:'B',label:'v2-current',env:{...process.env,QIMEN_WRITER_PROVIDER:'current'}},
  {id:'C',label:'v2-chatgpt2api',env:{...process.env,QIMEN_WRITER_PROVIDER:'chatgpt2api',QIMEN_CHATGPT2API_ENABLED:'1'}}
];
function build(c){
  if(c.kind==='question'){
    const prepared=prepareReading(c.input);
    const contract=buildQuestionNarrativeContract(prepared.context);
    return {prepared,contract,payload:surfacePayload(contract)};
  }
  const prepared=prepareMenhReading(c.input);
  const contract=buildMenhNarrativeContract(prepared.result,{birthTimeMode:c.input.birthTimeMode});
  return {prepared,contract,payload:surfacePayload(contract)};
}
function percentile(values,p){
  if(!values.length)return null;
  const a=[...values].sort((x,y)=>x-y);
  return a[Math.min(a.length-1,Math.ceil(p*a.length)-1)];
}
function validateHydrated(c,prepared,contract,draft){
  const reading=hydrateSurfaceReading(draft,contract);
  if(c.kind==='question')validateReading(reading,prepared.facts,prepared.context.selectedTopic,prepared.context);
  else validateMenhReading(reading,buildMenhWriterContext(prepared.result,{birthTimeMode:c.input.birthTimeMode}));
  return reading;
}
async function runOne(task){
  const {c,v,round}=task,{prepared,contract,payload}=build(c);
  const started=Date.now();let result,raw='',draft=null,reading=null,error=null;
  try{
    result=await runAIText(SURFACE_WRITER_INSTRUCTIONS,payload,{env:v.env});
    raw=result.text; draft=parseStructuredText(raw); validateSurfaceDraft(draft,contract);
    reading=validateHydrated(c,prepared,contract,draft);
  }catch(e){error={name:e.name,code:e.code||null,message:e.message};}
  const route=result?aiRouteOf(result):null;
  return {
    caseId:c.id,kind:c.kind,variant:v.id,round,
    latencyMs:Date.now()-started,
    valid:!error,error,
    provider:route?.provider||null,route:route?.id||null,model:route?.modelId||null,effort:route?.effort||null,
    sectionCount:draft?.sections?.length||0,
    styleIssues:draft?auditSurfaceStyle(draft).map(x=>x.code):[],
    sections:draft?.sections||null,
    raw:error?raw.slice(0,4000):undefined
  };
}
const tasks=[];
for(const c of set.cases)for(const v of variants)for(let round=1;round<=rounds;round++)tasks.push({c,v,round});
const results=new Array(tasks.length);let cursor=0,done=0;
async function worker(){
  while(true){
    const i=cursor++;if(i>=tasks.length)return;
    const t=tasks[i];results[i]=await runOne(t);done++;
    console.log(JSON.stringify({done,total:tasks.length,caseId:t.c.id,variant:t.v.id,round:t.round,valid:results[i].valid,latencyMs:results[i].latencyMs,style:results[i].styleIssues}));
  }
}
await Promise.all(Array.from({length:concurrency},worker));
const summary={generatedAt:new Date().toISOString(),rounds,concurrency,caseCount:set.cases.length,variants:{}};
for(const v of variants){
  const rows=results.filter(x=>x.variant===v.id),lat=rows.map(x=>x.latencyMs);
  const style={};for(const r of rows)for(const code of r.styleIssues)style[code]=(style[code]||0)+1;
  summary.variants[v.id]={
    label:v.label,samples:rows.length,valid:rows.filter(x=>x.valid).length,
    invalid:rows.filter(x=>!x.valid).length,p50Ms:percentile(lat,.5),p95Ms:percentile(lat,.95),
    styleIssues:style,models:[...new Set(rows.map(x=>x.model).filter(Boolean))],
    providers:[...new Set(rows.map(x=>x.provider).filter(Boolean))]
  };
}
const blind=results.map(r=>({
  caseId:r.caseId,kind:r.kind,round:r.round,
  variant:r.variant==='B'?'X':'Y',
  valid:r.valid,sections:r.sections
}));
const blindKey={X:'B/v2-current',Y:'C/v2-chatgpt2api'};
await writeFile(new URL('phase9-machine.json',outDir),JSON.stringify({summary,results},null,2)+'\n');
await writeFile(new URL('phase9-blind.json',outDir),JSON.stringify({rubric:['focus','clarity','depth','specificity','repetition','certainty','actionability'],items:blind},null,2)+'\n');
await writeFile(new URL('phase9-blind-key.json',outDir),JSON.stringify(blindKey,null,2)+'\n');
console.log('SUMMARY '+JSON.stringify(summary));
if(results.some(x=>!x.valid))process.exitCode=1;
