import {runAI,runAIText,writerProviderFromEnv} from './ai-client.mjs';
import {chatgptWebRuntime,discoverChatgptWebModels} from './chatgpt-web-client.mjs';

export const PROVIDER_INTERFACE_VERSION='QIMEN-AI-PROVIDER-1';

export async function generateStructured(instructions,input,schema,options={}){
 return runAI(instructions,input,schema,options);
}

export async function generateText(instructions,input,options={}){
 return runAIText(instructions,input,options);
}

export function providerCapabilities(env=process.env){
 const writerProvider=writerProviderFromEnv(env);
 let chatgpt2api={enabled:false,transport:'loopback-http',structured:false,text:true,models:'unknown',effectiveModel:'unknown',effectiveEffort:'unknown'};
 try{
  const runtime=chatgptWebRuntime(env);
  chatgpt2api={...chatgpt2api,enabled:runtime.enabled,requestedModel:runtime.model,requestedEffort:runtime.effort};
 }catch(error){
  chatgpt2api={...chatgpt2api,configurationError:error?.code||'AI_CONFIG'};
 }
 return Object.freeze({
  interfaceVersion:PROVIDER_INTERFACE_VERSION,
  structured:Object.freeze({provider:'current-chain',supported:true}),
  text:Object.freeze({provider:writerProvider,supported:true}),
  chatgpt2api:Object.freeze(chatgpt2api)
 });
}

export async function discoverProviderModels({provider='chatgpt2api',...options}={}){
 if(provider!=='chatgpt2api')return {advertisedModels:[],entitlementVerified:false,probed:false,reason:'discovery_not_supported'};
 return discoverChatgptWebModels(options);
}
