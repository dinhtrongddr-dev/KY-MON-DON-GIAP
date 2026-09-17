import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {prepareReading} from '../local/reading.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';

export function reasoningDebugSnapshot(prepared,{enabled=false}={}) {
  if(!enabled)return null;
  const c=prepared.context.allInOne,g=c.reasoning;
  const snapshot={questionContext:c.questionContext,actorMap:g.nodes,evidenceBundles:g.evidenceBundles,
    evidenceScores:g.evidenceBundles.map(b=>({id:b.id,...b.relevance})),relationships:g.interactions,
    contradictions:g.conflicts,outcomeDimensions:g.outcomeDimensions,eventStages:g.eventStages,
    primaryJudgment:g.primaryJudgment,recommendations:g.recommendations,timing:g.timing,finalWriterPayload:buildWriterContext(prepared.context)};
  return JSON.parse(JSON.stringify(snapshot).replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g,'[REDACTED]').replace(/Bearer\s+[A-Za-z0-9._-]+/gi,'Bearer [REDACTED]'));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  if(process.env.QIMEN_DEBUG_REASONING!=='1')throw new Error('Debug is off. Set QIMEN_DEBUG_REASONING=1 for an explicit local diagnostic run.');
  const [input,output]=process.argv.slice(2);
  if(!input||!output)throw new Error('Usage: node scripts/debug-reasoning.mjs input.json output.json');
  const data=JSON.parse(await readFile(input,'utf8'));
  await writeFile(output,JSON.stringify(reasoningDebugSnapshot(prepareReading(data.body||data),{enabled:true}),null,2));
  console.log('Local reasoning debug snapshot written; no authentication configuration is collected.');
}
