import {runCodex,READING_TIMEOUT_MS} from './codex-client.mjs';
import {runPrism} from './prism-client.mjs';

export const ROUTING_MODE='fallback-chain';
export const MODEL='astra → gemini → prism-astra';
export const REASONING_EFFORT='xhigh';
export const AI_ROUTES=Object.freeze([
  Object.freeze({id:'astra',provider:'9router/codex',model:'cx/gpt-6-astra',modelId:'gpt-6-astra',label:'GPT-6 Astra',routeLabel:'9router · Codex',effort:'xhigh'}),
  Object.freeze({id:'gemini',provider:'9router/gemini',model:'gemini/gemini-3.6-flash',modelId:'gemini-3.6-flash',label:'Gemini 3.6 Flash',routeLabel:'9router · Gemini',effort:'xhigh'}),
  Object.freeze({id:'prism-astra',provider:'prism',model:'gpt-6-astra',modelId:'gpt-6-astra',label:'GPT-6 Astra',routeLabel:'Prism fallback',effort:'xhigh'})
]);
const aborted=(signal,error)=>signal?.aborted||error?.name==='AbortError'||/Đã hủy|hết thời gian chờ/i.test(error?.message||'');
export function attachAiRoute(value,route){
  if(value&&typeof value==='object')Object.defineProperty(value,'__aiRoute',{value:route,enumerable:false,configurable:true});
  return value;
}
export const aiRouteOf=value=>value?.__aiRoute||null;
export async function runAI(instructions,input,schema,{signal,codexRunner=runCodex,prismRunner=runPrism}={}){
  const failures=[];
  for(const [index,route] of AI_ROUTES.entries()){
    signal?.throwIfAborted();
    try{
      const value=route.provider==='prism'
        ?await prismRunner(instructions,input,schema,{signal})
        :await codexRunner(instructions,input,schema,{signal,model:route.model,effort:route.effort});
      return attachAiRoute(value,Object.freeze({...route,fallbackIndex:index}));
    }catch(error){
      if(aborted(signal,error))throw error;
      failures.push({id:route.id,message:error?.message||String(error)});
    }
  }
  const error=new Error('Cả Astra, Gemini và Prism Astra đều chưa hoàn tất lượt luận. Hãy thử lại sau.');
  Object.defineProperty(error,'routeFailures',{value:failures,enumerable:false});
  throw error;
}
export {READING_TIMEOUT_MS};