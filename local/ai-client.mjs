import {READING_TIMEOUT_MS} from './structured-text.mjs';
import {runPrism,runPrismText} from './prism-client.mjs';
import {runChatgptWebText,chatgptWebRuntime} from './chatgpt-web-client.mjs';
import {recordAiDiagnostic} from './ai-diagnostics.mjs';

// TG-CB-7.0 (P9): one direct route through the local OpenAI-compatible proxy
// (ChatGPT2API on the VPS at 127.0.0.1:8787, provider id 'prism'). Model and effort
// come from env, so the VPS no longer needs hand patches. The former 9router
// Sol/Gemini chain was removed (P8): it was not used in production.
export const ROUTING_MODE='direct';
export const DEFAULT_DIRECT_MODEL='gpt-6-thinking';
export const DEFAULT_REASONING_EFFORT='xhigh';
export const DEFAULT_AUX_REASONING_EFFORT='high';
const EFFORTS=new Set(['minimal','low','medium','high','xhigh','ultra','auto']);
const effortFrom=(value,fallback)=>{const v=String(value||'').trim().toLowerCase();return EFFORTS.has(v)?v:fallback;};
export function directRoute(env=process.env){
  const model=String(env.QIMEN_DIRECT_MODEL||'').trim()||DEFAULT_DIRECT_MODEL;
  const effort=effortFrom(env.QIMEN_REASONING_EFFORT,DEFAULT_REASONING_EFFORT);
  return Object.freeze({id:'direct',provider:'prism',model,modelId:model,label:model,routeLabel:'ChatGPT2API · VPS',effort});
}
// Decision 4: auxiliary steps (fidelity review, sentence repair, planner) use 'high';
// the main writer keeps the configured effort (xhigh).
export function auxEffort(env=process.env){return effortFrom(env.QIMEN_AUX_REASONING_EFFORT,DEFAULT_AUX_REASONING_EFFORT);}
export const MODEL=directRoute().model;
export const REASONING_EFFORT=directRoute().effort;
export const AI_ROUTES=Object.freeze([directRoute()]);
const aborted=(signal,error)=>signal?.aborted||error?.name==='AbortError'||/Đã hủy|hết thời gian chờ/i.test(error?.message||'');
export function attachAiRoute(value,route){
  if(value&&typeof value==='object')Object.defineProperty(value,'__aiRoute',{value:route,enumerable:false,configurable:true});
  return value;
}
export const aiRouteOf=value=>value?.__aiRoute||null;

function textResult(value,route){
  const base=typeof value==='string'?{text:value}:value;
  if(!base||typeof base.text!=='string'||!base.text.trim()){
    const error=new Error('AI không trả nội dung văn bản cho Writer.');
    Object.defineProperty(error,'code',{value:'AI_MALFORMED_OUTPUT',enumerable:false});
    throw error;
  }
  const metadata=base.metadata&&typeof base.metadata==='object'?base.metadata:{
    provider:route.provider,
    requestedModel:route.modelId,
    reportedModel:null,
    resolvedModel:null,
    effortRequested:route.effort,
    effortTransmitted:route.effort,
    effortReported:null,
    effectiveModelObserved:false,
    effectiveEffortObserved:false
  };
  return attachAiRoute({text:base.text.trim(),metadata:Object.freeze({...metadata})},route);
}

export function writerProviderFromEnv(env=process.env){
  const raw=String(env.QIMEN_WRITER_PROVIDER||'current').trim().toLowerCase();
  if(['chatgpt2api','chatgpt-web','chatgpt_web'].includes(raw))return 'chatgpt2api';
  return 'current';
}

export async function runAI(instructions,input,schema,{signal,env=process.env,prismRunner=runPrism,effort,diagnostics=recordAiDiagnostic}={}){
  signal?.throwIfAborted();
  const base=directRoute(env),route=Object.freeze({...base,effort:effortFrom(effort,base.effort),fallbackIndex:0});
  try{
    const value=await prismRunner(instructions,input,schema,{signal,env,model:route.model,effort:route.effort});
    return attachAiRoute(value,route);
  }catch(error){
    if(aborted(signal,error))throw error;
    diagnostics?.({type:'route_failure',flow:'runtime',stage:'model_call',route:route.id,model:route.modelId,code:error?.code||'AI_ROUTE_ERROR',fallbackAllowed:false,message:error?.message||String(error)});
    throw error;
  }
}
export async function runAIText(instructions,input,{
  signal,
  env=process.env,
  prismTextRunner=runPrismText,
  chatgptTextRunner=runChatgptWebText,
  effort,
  diagnostics=recordAiDiagnostic
}={}){
  const selected=writerProviderFromEnv(env);
  if(selected==='chatgpt2api'){
    signal?.throwIfAborted();
    const runtime=chatgptWebRuntime(env);
    const route=Object.freeze({
      id:'chatgpt-web',
      provider:'chatgpt2api',
      model:runtime.model,
      modelId:runtime.model,
      label:'ChatGPT Web',
      routeLabel:'chatgpt2api · local',
      effort:runtime.effort,
      fallbackIndex:0
    });
    try{
      return textResult(await chatgptTextRunner(instructions,input,{signal,env,model:runtime.model,effort:runtime.effort}),route);
    }catch(error){
      if(aborted(signal,error))throw error;
      diagnostics?.({type:'route_failure',flow:'writer-v2',stage:'text_generation',route:route.id,model:route.modelId,code:error?.code||'AI_ROUTE_ERROR',fallbackAllowed:false,message:error?.message||String(error)});
      throw error;
    }
  }

  const base=directRoute(env),route=Object.freeze({...base,effort:effortFrom(effort,base.effort),fallbackIndex:0});
  signal?.throwIfAborted();
  try{
    return textResult(await prismTextRunner(instructions,input,{signal,env,model:route.model,effort:route.effort}),route);
  }catch(error){
    if(aborted(signal,error))throw error;
    diagnostics?.({type:'route_failure',flow:'writer-v2',stage:'text_generation',route:route.id,model:route.modelId,code:error?.code||'AI_ROUTE_ERROR',fallbackAllowed:false,message:error?.message||String(error)});
    throw error;
  }
}

export {READING_TIMEOUT_MS};