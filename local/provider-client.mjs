import {runAI,runAIText,writerProviderFromEnv,attachAiRoute} from './ai-client.mjs';
import {chatgptWebRuntime,discoverChatgptWebModels,runChatgptWebText} from './chatgpt-web-client.mjs';
import {parseStructuredText} from './codex-client.mjs';

export const PROVIDER_INTERFACE_VERSION='QIMEN-AI-PROVIDER-1';

export async function generateStructured(instructions,input,schema,options={}){
 const env=options.env||process.env;
 if(writerProviderFromEnv(env)==='chatgpt2api'){
  const runtime=chatgptWebRuntime(env);
  const schemaInstruction='\n\nReturn ONLY valid JSON matching this JSON Schema. No markdown fences, no commentary.\nJSON Schema:\n'+JSON.stringify(schema);
  const generated=await (options.chatgptTextRunner||runChatgptWebText)(String(instructions||'')+schemaInstruction,input,{signal:options.signal,env,model:runtime.model,effort:runtime.effort});
  const value=parseStructuredText(generated?.text??generated);
  return attachAiRoute(value,Object.freeze({id:'chatgpt-web-structured',provider:'chatgpt2api',model:runtime.model,modelId:runtime.model,label:'ChatGPT Web',routeLabel:'chatgpt2api · local',effort:runtime.effort,fallbackIndex:0}));
 }
 return runAI(instructions,input,schema,options);
}

export async function generateText(instructions,input,options={}){
 return runAIText(instructions,input,options);
}

export function providerCapabilities(env=process.env){
 const writerProvider=writerProviderFromEnv(env);
 let chatgpt2api={enabled:false,transport:'loopback-http',structured:true,text:true,models:'unknown',effectiveModel:'unknown',effectiveEffort:'unknown'};
 try{
  const runtime=chatgptWebRuntime(env);
  chatgpt2api={...chatgpt2api,enabled:runtime.enabled,requestedModel:runtime.model,requestedEffort:runtime.effort};
 }catch(error){
  chatgpt2api={...chatgpt2api,configurationError:error?.code||'AI_CONFIG'};
 }
 return Object.freeze({
  interfaceVersion:PROVIDER_INTERFACE_VERSION,
  structured:Object.freeze({provider:writerProvider,supported:true}),
  text:Object.freeze({provider:writerProvider,supported:true}),
  chatgpt2api:Object.freeze(chatgpt2api)
 });
}

export async function discoverProviderModels({provider='chatgpt2api',...options}={}){
 if(provider!=='chatgpt2api')return {advertisedModels:[],entitlementVerified:false,probed:false,reason:'discovery_not_supported'};
 return discoverChatgptWebModels(options);
}
