import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {prepareReading} from '../local/reading.mjs';
import {prepareMenhReading} from '../local/menh-reading.mjs';
import {interpretReading} from '../local/interpret.mjs';
import {interpretMenhReading} from '../local/menh-interpret.mjs';
import {aiRouteOf,runAI} from '../local/ai-client.mjs';
import {runSurfaceText} from '../local/surface-writer.mjs';
import {generateText} from '../local/provider-client.mjs';
import {parseStructuredText} from '../local/codex-client.mjs';
import {buildQuestionNarrativeContract} from '../dist/qimen/ai/narrativeContract.mjs';
import {buildMenhNarrativeContract} from '../dist/qimen/menh/ai/narrative-contract.mjs';
import {naturalSurfaceFallback,auditSurfaceStyle,surfaceParagraphs} from '../dist/qimen/ai/surfaceReading.mjs';
const fixtures=JSON.parse(await readFile(new URL('../tests/fixtures/writer-regression.json',import.meta.url)));
const live=process.argv.includes('--live'),reusePlan=process.argv.includes('--reuse-plan'),only=process.argv.find(x=>x.startsWith('--case='))?.split('=')[1];
const output=new URL('../docs/writer-layer/regression/',import.meta.url);await mkdir(output,{recursive:true});
const structuredViaWriter=async(instructions,payload,schema,options={})=>{
  const schemaHint=JSON.stringify(schema);
  let generated;
  for(let attempt=0;attempt<2;attempt++){
    try{generated=await generateText(instructions+'\n\nTuân thủ JSON Schema sau: '+schemaHint+'\nTrả về duy nhất JSON hợp lệ, không markdown, không giải thích ngoài JSON.',payload,{signal:options.signal});break;}
    catch(error){if(attempt||error?.code!=='UPSTREAM_UNAVAILABLE')throw error;await new Promise(resolve=>setTimeout(resolve,1500));}
  }
  const parsed=parseStructuredText(generated.text);
  return Object.defineProperty(parsed,'__aiRoute',{value:aiRouteOf(generated),enumerable:false,configurable:true});
};
for(const kind of ['menh','question']){
  if(only&&only!==kind)continue;
  const prepared=kind==='menh'?prepareMenhReading(fixtures[kind]):prepareReading(fixtures[kind]);
  const contract=kind==='menh'?buildMenhNarrativeContract(prepared.result,{birthTimeMode:'KNOWN'}):buildQuestionNarrativeContract(prepared.context);
  const start=Date.now();console.log(kind+': '+(live?'live writer + independent fidelity review':'natural fallback'));
  const attempts=[],reviews=[];
  const runner=async(instructions,payload,schema,options)=>{
    if(payload.revision)attempts.at(-1).violations=payload.revision.violations;
    const result=await runSurfaceText(instructions,payload,schema,options);
    attempts.push({model:aiRouteOf(result),paragraphs:surfaceParagraphs(result).length,draft:result});
    return result;
  };
  const reviewer=async(...args)=>{const result=await runAI(...args);reviews.push(result);return result;};
  let previousPlan=null;
  if(reusePlan&&kind==='question'){
    const previous=JSON.parse(await readFile(new URL('question-live.json',output)));
    if(JSON.stringify(previous.fixtureInput)!==JSON.stringify(fixtures.question))throw Error('Cached live plan belongs to a different or unrecorded fixture.');
    previousPlan=previous.reading.planning;
    if(!previousPlan)throw Error('No completed live plan to reuse.');
  }
  const liveStructured=process.env.QIMEN_LIVE_QA_STRUCTURED_PROVIDER==='writer'?structuredViaWriter:runAI;
  const options={runner,planRunner:previousPlan?async()=>previousPlan:liveStructured,reviewer:liveStructured};
  const reading=live?await(kind==='menh'?interpretMenhReading(prepared,options):interpretReading(prepared,options)):naturalSurfaceFallback(contract);
  const filename=kind+(live?'-live':'-fallback');
  const report={generatedAt:new Date().toISOString(),live,fixtureInput:fixtures[kind],planningSource:previousPlan?'previous completed live run of identical fixture':'current run',durationMs:Date.now()-start,status:reading.status,modelUsed:aiRouteOf(reading)||null,attempts,reviews,styleIssues:auditSurfaceStyle(reading),reading};
  await writeFile(new URL(filename+'.json',output),JSON.stringify(report,null,2)+'\n');
  const sections=Object.values(reading.sections).map(s=>'## '+s.label+'\n\n'+s.paragraphs.map(p=>p.meaning+'\n\n<details><summary>Căn cứ Kỳ Môn</summary>\n\n'+p.technicalEvidence+'\n\n</details>').join('\n\n'));
  await writeFile(new URL(filename+'.md',output),'# '+(kind==='menh'?fixtures.menh.fullName:'Nghỉ việc để chăm con')+'\n\n'+sections.join('\n\n')+'\n\n'+reading.note+'\n');
  console.log(JSON.stringify({kind,status:reading.status,paragraphs:surfaceParagraphs(reading).length,durationMs:report.durationMs,styleIssues:report.styleIssues.map(x=>x.code),output:fileURLToPath(new URL(filename+'.json',output))}));
}
