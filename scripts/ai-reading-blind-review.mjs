import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const evalDir=resolve(root,'docs/ai-reading-v2/eval');
const blindPath=resolve(evalDir,'phase9-blind.json');
const keyPath=resolve(evalDir,'phase9-blind-key.json');
const packetPath=resolve(evalDir,'phase10-blind-review.md');
const scorecardPath=resolve(evalDir,'phase10-blind-scorecard.tsv');
const summaryJsonPath=resolve(evalDir,'phase10-blind-summary.json');
const summaryMdPath=resolve(evalDir,'phase10-blind-summary.md');

export const RUBRICS=Object.freeze([
 ['focus','Đúng trọng tâm'],['clarity','Dễ hiểu'],['depth','Chiều sâu'],
 ['specificity','Cụ thể với câu hỏi'],['repetition','Không lặp'],
 ['certainty','Mức chắc chắn phù hợp'],['actionability','Hành động hữu ích']
]);
const mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
const fixed=value=>value==null?null:Number(value.toFixed(3));
const rowId=(item,index)=>'R'+String(index+1).padStart(3,'0');

function assertBlind(blind){
 if(!blind||!Array.isArray(blind.items)||!blind.items.length)throw Error('Bộ chấm mù trống.');
 if(blind.items.some(item=>!item.valid||!Array.isArray(item.sections)||!item.sections.length))
  throw Error('Bộ chấm mù có mẫu chưa hợp lệ hoặc thiếu nội dung.');
 return blind.items;
}
export function buildBlindMaterials(blind){
 const items=assertBlind(blind);
 const packet=[
  '# Phase 10 — Phiếu chấm mù AI Reading v2','',
  'Không mở phase9-blind-key.json trước khi chấm xong. Mỗi mẫu chấm 1–5 cho đủ bảy tiêu chí; không đoán provider.','',
  'Thang điểm: 1 = không đạt; 2 = yếu; 3 = dùng được nhưng còn rõ vấn đề; 4 = tốt; 5 = rất tốt.','',
  ...RUBRICS.map(([id,label])=>'- **'+id+'** — '+label),''
 ];
 const header=['review_id','case_id','kind','round','candidate',...RUBRICS.map(([id])=>id),'comment'];
 const rows=[header.join('\t')];
 items.forEach((item,index)=>{
  const id=rowId(item,index);
  packet.push('## '+id+' · '+item.caseId+' · '+item.kind+' · lượt '+item.round+' · phương án '+item.variant,'');
  for(const section of item.sections){
   packet.push('### '+section.id,'',String(section.text||'').trim(),'');
  }
  rows.push([id,item.caseId,item.kind,item.round,item.variant,...RUBRICS.map(()=>'-'),'-'].join('\t'));
 });
 return {packet:packet.join('\n').trim()+'\n',scorecard:rows.join('\n')+'\n',count:items.length};
}

function parseScorecard(tsv){
 const lines=String(tsv).replaceAll('\r','').split('\n').filter(Boolean);
 if(!lines.length)throw Error('Scorecard trống.');
 const expected=['review_id','case_id','kind','round','candidate',...RUBRICS.map(([id])=>id),'comment'];
 const header=lines.shift().split('\t');
 if(JSON.stringify(header)!==JSON.stringify(expected))throw Error('Header scorecard đã thay đổi.');
 return lines.map((line,index)=>{
  const cells=line.split('\t');while(cells.length<expected.length)cells.push('');
  const row=Object.fromEntries(expected.map((name,i)=>[name,cells[i]??'']));
  row.line=index+2;return row;
 });
}
export function summarizeBlindScores(blind,key,tsv,{baselineAverage=null}={}){
 const items=assertBlind(blind),expected=new Map(items.map((item,index)=>[rowId(item,index),item]));
 const rows=parseScorecard(tsv),seen=new Set(),scored=[];
 for(const row of rows){
  const item=expected.get(row.review_id);
  if(!item)throw Error('Scorecard có review_id lạ: '+row.review_id+'.');
  if(seen.has(row.review_id))throw Error('Scorecard lặp '+row.review_id+'.');seen.add(row.review_id);
  if([row.case_id,row.kind,String(row.round),row.candidate].join('|')!==
    [item.caseId,item.kind,String(item.round),item.variant].join('|'))throw Error('Metadata '+row.review_id+' không khớp bộ mù.');
  const raw=RUBRICS.map(([id])=>{const value=String(row[id]||'').trim();return value==='-'?'':value;});
  if(raw.every(value=>!value))continue;
  if(raw.some(value=>!value))throw Error(row.review_id+' phải chấm đủ bảy tiêu chí.');
  const scores=Object.fromEntries(RUBRICS.map(([id],i)=>{
   const value=Number(raw[i]);if(!Number.isInteger(value)||value<1||value>5)throw Error(row.review_id+'/'+id+' phải từ 1 đến 5.');
   return [id,value];
  }));
  scored.push({id:row.review_id,candidate:item.variant,scores});
 }
 const byCandidate={};
 for(const candidate of [...new Set(items.map(item=>item.variant))]){
  const group=scored.filter(row=>row.candidate===candidate);
  const rubric=Object.fromEntries(RUBRICS.map(([id])=>[id,fixed(mean(group.map(row=>row.scores[id])))]));
  byCandidate[candidate]={provider:key[candidate]||'UNKNOWN',samples:group.length,
   rubric,average:fixed(mean(group.flatMap(row=>Object.values(row.scores))))};
 }
 const ranked=Object.entries(byCandidate).filter(([,value])=>value.samples)
  .sort((a,b)=>(b[1].average??-1)-(a[1].average??-1));
 const selected=ranked[0]?.[0]||null,selectedAverage=selected?byCandidate[selected].average:null;
 const complete=scored.length===items.length&&seen.size===items.length;
 const baseline=baselineAverage!==null&&Number.isFinite(Number(baselineAverage))?Number(baselineAverage):null;
 const delta=baseline==null||selectedAverage==null?null:fixed(selectedAverage-baseline);
 const blockers=[...(!complete?['INCOMPLETE_REVIEW']:[]),
  ...(selectedAverage!=null&&selectedAverage<4?['AVERAGE_BELOW_4']:[]),
  ...(baseline==null?['BASELINE_AVERAGE_REQUIRED']:delta<0.7?['DELTA_BELOW_0_7']:[])];
 return {generatedAt:new Date().toISOString(),expectedSamples:items.length,scoredSamples:scored.length,
  complete,byCandidate,selectedCandidate:selected,selectedProvider:selected?byCandidate[selected].provider:null,
  selectedAverage,baselineAverage:baseline,deltaFromBaseline:delta,pass:blockers.length===0,blockers};
}
export function blindSummaryMarkdown(summary){
 const lines=['# Phase 10 — Kết quả chấm mù','',
  '- Đã chấm: **'+summary.scoredSamples+'/'+summary.expectedSamples+'**',
  '- Hoàn tất: **'+(summary.complete?'có':'chưa')+'**',''];
 for(const [candidate,value] of Object.entries(summary.byCandidate)){
  lines.push('## Phương án '+candidate,'',
   '- Số mẫu: '+value.samples,'- Điểm trung bình: '+(value.average??'chưa có'));
  for(const [id,label] of RUBRICS)lines.push('- '+label+': '+(value.rubric[id]??'chưa có'));
  lines.push('');
 }
 lines.push('## Quyết định','',
  '- Phương án cao nhất: '+(summary.selectedCandidate||'chưa có'),
  '- Provider (chỉ mở sau chấm): '+(summary.selectedProvider||'chưa có'),
  '- Baseline: '+(summary.baselineAverage??'chưa nhập'),
  '- Chênh baseline: '+(summary.deltaFromBaseline??'chưa tính'),
  '- Release gate: **'+(summary.pass?'PASS':'NO-GO')+'**',
  '- Blockers: '+(summary.blockers.join(', ')||'không'),'');
 return lines.join('\n');
}

function option(name){
 const prefix='--'+name+'=';const raw=process.argv.find(value=>value.startsWith(prefix));
 return raw?raw.slice(prefix.length):null;
}
async function main(){
 const command=process.argv[2]||'prepare';
 const blind=JSON.parse(await readFile(blindPath,'utf8'));
 if(command==='prepare'){
  const built=buildBlindMaterials(blind);
  await writeFile(packetPath,built.packet);await writeFile(scorecardPath,built.scorecard);
  console.log(JSON.stringify({prepared:built.count,packet:packetPath,scorecard:scorecardPath}));return;
 }
 if(command==='summarize'){
  const key=JSON.parse(await readFile(keyPath,'utf8'));
  const tsv=await readFile(scorecardPath,'utf8');
  const summary=summarizeBlindScores(blind,key,tsv,{baselineAverage:option('baseline-average')});
  await writeFile(summaryJsonPath,JSON.stringify(summary,null,2)+'\n');
  await writeFile(summaryMdPath,blindSummaryMarkdown(summary));
  console.log(JSON.stringify(summary));if(!summary.pass)process.exitCode=2;return;
 }
 throw Error('Dùng prepare hoặc summarize.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
