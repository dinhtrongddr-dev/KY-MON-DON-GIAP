const LOOPBACK_HOSTS=new Set(['127.0.0.1','localhost','::1']);

export const CHATGPT_WEB_DEFAULT_BASE_URL='http://127.0.0.1:3000/v1';
export const CHATGPT_WEB_DEFAULT_MODEL='gpt-5-6';
export const CHATGPT_WEB_DEFAULT_EFFORT='xhigh';

function codedError(message,code,{fallbackAllowed=false,status=null}={}){
 const error=new Error(message);
 Object.defineProperty(error,'code',{value:code,enumerable:false});
 Object.defineProperty(error,'fallbackAllowed',{value:fallbackAllowed,enumerable:false});
 if(status!=null)Object.defineProperty(error,'status',{value:status,enumerable:false});
 return error;
}

export function chatgptWebRuntime(env=process.env){
 const enabled=/^(?:1|true|yes|on)$/i.test(String(env.QIMEN_CHATGPT2API_ENABLED||'').trim());
 const base=String(env.CHATGPT2API_BASE_URL||CHATGPT_WEB_DEFAULT_BASE_URL).trim().replace(/\/$/,'');
 const apiKey=String(env.CHATGPT2API_AUTH_KEY||'').trim();
 const model=String(env.CHATGPT2API_WRITER_MODEL||CHATGPT_WEB_DEFAULT_MODEL).trim()||CHATGPT_WEB_DEFAULT_MODEL;
 const effort=String(env.CHATGPT2API_REASONING_EFFORT||CHATGPT_WEB_DEFAULT_EFFORT).trim()||CHATGPT_WEB_DEFAULT_EFFORT;
 let url;
 try{url=new URL(base);}catch{throw codedError('CHATGPT2API_BASE_URL không hợp lệ.','AI_CONFIG');}
 if(url.protocol!=='http:'||!LOOPBACK_HOSTS.has(url.hostname)||url.port!=='3000'||url.pathname.replace(/\/$/,'')!=='/v1'){
  throw codedError('chatgpt2api chỉ được phép nối loopback tại http://127.0.0.1:3000/v1.','AI_CONFIG');
 }
 if(enabled&&!apiKey)throw codedError('Đã bật chatgpt2api nhưng thiếu CHATGPT2API_AUTH_KEY.','AI_AUTH');
 return {enabled,base,apiKey,model,effort};
}

function normalizeTextInput(input){
 if(typeof input==='string')return input;
 try{return JSON.stringify(input);}catch{throw codedError('Dữ liệu Writer không thể tuần tự hóa.','AI_MALFORMED_INPUT');}
}

function statusError(status){
 if(status===401||status===403)return codedError('chatgpt2api từ chối khóa truy cập local.','AI_AUTH',{status});
 if(status===408||status===504)return codedError('chatgpt2api hết thời gian xử lý.','AI_TIMEOUT',{status});
 if(status===429)return codedError('chatgpt2api đang giới hạn lượt gọi.','AI_RATE_LIMIT',{status});
 if(status>=500)return codedError('chatgpt2api hoặc upstream đang tạm thời không sẵn sàng.','AI_UNAVAILABLE',{status});
 return codedError('chatgpt2api chưa hoàn tất lượt Writer (HTTP '+status+').','AI_ROUTE_ERROR',{status});
}

export async function runChatgptWebText(instructions,input,{signal,fetchImpl=fetch,env=process.env,model,effort}={}){
 signal?.throwIfAborted();
 const runtime=chatgptWebRuntime(env);
 if(!runtime.enabled)throw codedError('Provider chatgpt2api chưa được bật.','AI_PROVIDER_DISABLED');
 const requestedModel=String(model||runtime.model||'').trim()||runtime.model;
 const requestedEffort=String(effort||runtime.effort||'').trim()||runtime.effort;
 let response;
 try{
  response=await fetchImpl(runtime.base+'/chat/completions',{
   method:'POST',
   headers:{'Content-Type':'application/json','Authorization':'Bearer '+runtime.apiKey},
   body:JSON.stringify({
    model:requestedModel,
    reasoning_effort:requestedEffort,
    stream:false,
    messages:[
     {role:'system',content:String(instructions||'')},
     {role:'user',content:normalizeTextInput(input)}
    ]
   }),
   signal
  });
 }catch(error){
  if(signal?.aborted||error?.name==='AbortError')throw codedError('Đã hủy hoặc hết thời gian chờ AI.','AI_CANCELLED');
  throw codedError('Không kết nối được chatgpt2api local. Kiểm tra service port 3000 rồi thử lại.','AI_NETWORK');
 }
 if(!response.ok)throw statusError(response.status);
 let data;
 try{data=await response.json();}catch{throw codedError('chatgpt2api trả phản hồi không phải JSON hợp lệ.','AI_MALFORMED_OUTPUT');}
 const text=data?.choices?.[0]?.message?.content;
 if(typeof text!=='string'||!text.trim())throw codedError('chatgpt2api không trả nội dung văn bản cho Writer.','AI_MALFORMED_OUTPUT');
 return {
  text:text.trim(),
  metadata:Object.freeze({
   provider:'chatgpt2api',
   requestedModel,
   reportedModel:typeof data?.model==='string'&&data.model.trim()?data.model.trim():null,
   resolvedModel:null,
   effortRequested:requestedEffort,
   effortTransmitted:requestedEffort,
   effortReported:null,
   effectiveModelObserved:false,
   effectiveEffortObserved:false
  })
 };
}

export async function discoverChatgptWebModels({signal,fetchImpl=fetch,env=process.env}={}){
 signal?.throwIfAborted();
 const runtime=chatgptWebRuntime(env);
 if(!runtime.enabled)throw codedError('Provider chatgpt2api chưa được bật.','AI_PROVIDER_DISABLED');
 let response;
 try{
  response=await fetchImpl(runtime.base+'/models',{
   method:'GET',
   headers:{'Authorization':'Bearer '+runtime.apiKey},
   signal
  });
 }catch(error){
  if(signal?.aborted||error?.name==='AbortError')throw codedError('Đã hủy truy vấn catalog chatgpt2api.','AI_CANCELLED');
  throw codedError('Không đọc được catalog chatgpt2api local.','AI_NETWORK');
 }
 if(!response.ok)throw statusError(response.status);
 let data;
 try{data=await response.json();}catch{throw codedError('Catalog chatgpt2api không phải JSON hợp lệ.','AI_MALFORMED_OUTPUT');}
 const rows=Array.isArray(data?.data)?data.data:[];
 return {
  advertisedModels:rows.map(row=>String(row?.id||'').trim()).filter(Boolean),
  entitlementVerified:false,
  probed:false
 };
}
