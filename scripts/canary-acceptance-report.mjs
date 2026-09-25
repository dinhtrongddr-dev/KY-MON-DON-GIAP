import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const outputJson=resolve(root,'docs/ai-reading-v2/eval/phase10-canary-report.json');
const outputMd=resolve(root,'docs/ai-reading-v2/eval/phase10-canary-report.md');
const criticalCodes=new Set([
 'READING_VALIDATION','MENH_READING_VALIDATION','SURFACE_CONTRACT',
 'FINGERPRINT_MISMATCH','PROTOCOL_MISMATCH','SECRET_EXPOSURE'
]);
const percentile=(values,p)=>{
 if(!values.length)return null;
 const sorted=[...values].sort((a,b)=>a-b);
 return sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*p)-1)];
};
const iso=value=>{
 if(typeof value==='number')return new Date(value).toISOString();
 const parsed=new Date(value);if(Number.isNaN(parsed.valueOf()))throw Error('Mốc thời gian không hợp lệ: '+value);
 return parsed.toISOString();
};
const after=(value,since)=>new Date(iso(value))>=since;
const countBy=(rows,key)=>{
 const out={};for(const row of rows){const value=String(row[key]??'UNKNOWN');out[value]=(out[value]||0)+1;}return out;
};

export function buildCanaryReport(activityDocument,errorRows,{since,minimumSamples=20,controlledSmokeCount=0,now=new Date()}){
 const sinceDate=new Date(since);if(Number.isNaN(sinceDate.valueOf()))throw Error('Thiếu hoặc sai --since.');
 if(!Number.isInteger(controlledSmokeCount)||controlledSmokeCount<0)throw Error('controlledSmokeCount phải là số nguyên không âm.');
 const events=(activityDocument?.events||[]).filter(event=>event.at&&after(event.at,sinceDate));
 const readings=events.filter(event=>event.type==='reading');
 const completed=readings.filter(event=>['completed','fallback'].includes(event.status));
 const durations=completed.filter(event=>Number.isFinite(event.finishedAt-event.at))
  .map(event=>event.finishedAt-event.at);
 const errors=errorRows.filter(row=>row.at&&after(row.at,sinceDate));
 const critical=errors.filter(row=>criticalCodes.has(String(row.code||'')));
 const fallbackCount=readings.filter(event=>event.status==='fallback').length;
 const failedCount=readings.filter(event=>['error','interrupted','timeout'].includes(event.status)).length;
 const cancelledCount=readings.filter(event=>event.status==='cancelled').length;
 const repairSignals=errors.filter(row=>Number(row.attempt)>1&&
  ['writer_validation','surface_audit'].includes(row.stage));
 const styleSignals=errors.filter(row=>row.code==='SURFACE_STYLE');
 const fallbackRate=readings.length?fallbackCount/readings.length:0;
 const controlledSmoke=Math.min(controlledSmokeCount,completed.length);
 const eligibleCompleted=Math.max(0,completed.length-controlledSmoke);
 const blockers=[
  ...(eligibleCompleted<minimumSamples?['INSUFFICIENT_SAMPLES']:[]),
  ...(critical.length?['CRITICAL_ERROR']:[]),
  ...(failedCount?['FAILED_READING']:[]),
  ...(fallbackRate>.05?['FALLBACK_RATE_ABOVE_5_PERCENT']:[])
 ];
 return {
  generatedAt:now.toISOString(),since:sinceDate.toISOString(),minimumSamples,
  samples:{readingEvents:readings.length,completed:completed.length,controlledSmoke,
   eligibleCompleted,fallback:fallbackCount,failed:failedCount,cancelled:cancelledCount},
  rates:{fallback:Number(fallbackRate.toFixed(4))},
  latencyMs:{p50:percentile(durations,.5),p95:percentile(durations,.95),samples:durations.length},
  routes:countBy(completed,'route'),models:countBy(completed,'model'),
  errors:{total:errors.length,byCode:countBy(errors,'code'),byStage:countBy(errors,'stage'),
   critical:critical.length,repairSignals:repairSignals.length,styleSignals:styleSignals.length},
  privacy:{rawQuestionsIncluded:false,errorMessagesIncluded:false},
  pass:blockers.length===0,blockers
 };
}

export function canaryReportMarkdown(report){
 const lines=['# Phase 10 — Báo cáo canary','',
  '- Từ: '+report.since,
  '- Lượt reading quan sát: '+report.samples.readingEvents,
  '- Hoàn tất tổng: '+report.samples.completed,
  '- Smoke có kiểm soát: '+report.samples.controlledSmoke,
  '- Lượt đủ điều kiện observation: '+report.samples.eligibleCompleted+'/'+report.minimumSamples,
  '- Fallback: '+report.samples.fallback+' ('+(report.rates.fallback*100).toFixed(1)+'%)',
  '- Lỗi/gián đoạn: '+report.samples.failed,
  '- Hủy: '+report.samples.cancelled,
  '- Latency p50/p95: '+(report.latencyMs.p50??'n/a')+' / '+(report.latencyMs.p95??'n/a')+' ms','',
  '## Telemetry','',
  '- Critical errors: '+report.errors.critical,
  '- Repair signals: '+report.errors.repairSignals,
  '- Style signals: '+report.errors.styleSignals,
  '- Error codes: '+JSON.stringify(report.errors.byCode),
  '- Routes: '+JSON.stringify(report.routes),
  '- Models: '+JSON.stringify(report.models),'',
  '## Quyết định','',
  '- Gate: **'+(report.pass?'PASS':'NO-GO')+'**',
  '- Blockers: '+(report.blockers.join(', ')||'không'),
  '- Báo cáo không chứa câu hỏi thô hoặc message lỗi.',''
 ];
 return lines.join('\n');
}

function option(name){
 const prefix='--'+name+'=';const raw=process.argv.find(value=>value.startsWith(prefix));
 return raw?raw.slice(prefix.length):null;
}
async function readErrors(path){
 try{
  const text=await readFile(path,'utf8'),rows=[];
  for(const line of text.split('\n')){
   if(!line.trim())continue;try{rows.push(JSON.parse(line));}catch{}
  }
  return rows;
 }catch(error){if(error.code==='ENOENT')return [];throw error;}
}
async function main(){
 const since=option('since')||process.env.QIMEN_CANARY_SINCE;
 if(!since)throw Error('Dùng --since=<ISO-8601> hoặc QIMEN_CANARY_SINCE.');
 const home=process.env.HOME||'';
 const activityPath=process.env.QIMEN_ACTIVITY_LOG||resolve(home,'.local/state/kymon/activity.json');
 const errorPath=process.env.QIMEN_AI_ERROR_LOG||resolve(home,'.local/state/kymon/ai-errors.jsonl');
 const activity=JSON.parse(await readFile(activityPath,'utf8'));
 const errors=await readErrors(errorPath);
 const report=buildCanaryReport(activity,errors,{since,minimumSamples:Number(option('minimum')||20),
  controlledSmokeCount:Number(option('controlled-smokes')||0)});
 if(process.argv.includes('--write')){
  await writeFile(outputJson,JSON.stringify(report,null,2)+'\n');
  await writeFile(outputMd,canaryReportMarkdown(report));
 }
 console.log(JSON.stringify(report));if(!report.pass)process.exitCode=2;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
