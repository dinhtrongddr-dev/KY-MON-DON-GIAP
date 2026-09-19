import {appendFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';

const clean=(value,max=500)=>String(value??'').replace(/[\r\n\t]+/g,' ').trim().slice(0,max);
export function defaultAiDiagnosticPath(){
  const base=process.env.HOME||process.cwd();
  return process.env.QIMEN_AI_ERROR_LOG||resolve(base,'.local/state/kymon/ai-errors.jsonl');
}
export function recordAiDiagnostic(event,{filePath=defaultAiDiagnosticPath()}={}){
  if(!filePath)return;
  const row={
    at:new Date().toISOString(),
    type:clean(event?.type,64)||'ai_error',
    flow:clean(event?.flow,32),
    stage:clean(event?.stage,64),
    attempt:Number.isInteger(event?.attempt)?event.attempt:null,
    route:clean(event?.route,64),
    model:clean(event?.model,96),
    code:clean(event?.code,96),
    fallbackAllowed:Boolean(event?.fallbackAllowed),
    message:clean(event?.message,1000),
  };
  try{
    mkdirSync(dirname(filePath),{recursive:true,mode:0o700});
    appendFileSync(filePath,JSON.stringify(row)+'\n',{encoding:'utf8',mode:0o600});
  }catch{}
}
