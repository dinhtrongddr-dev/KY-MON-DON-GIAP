function abortError(){const e=new Error('Đã hủy lượt luận.');e.name='AbortError';return e;}
function pause(ms,signal){
  return new Promise((resolve,reject)=>{
    if(signal?.aborted)return reject(abortError());
    const timer=setTimeout(done,ms);
    const onAbort=()=>{clearTimeout(timer);signal?.removeEventListener?.('abort',onAbort);reject(abortError());};
    function done(){signal?.removeEventListener?.('abort',onAbort);resolve();}
    signal?.addEventListener?.('abort',onAbort,{once:true});
  });
}
export function createReadingJobClient({endpoint,getToken,onRunning,onReconnect,pollMs=1800,hiddenPollMs=5000}){
  const headers=body=>({'X-Qimen-Token':getToken(),...(body?{'Content-Type':'application/json'}:{})});
  async function request(path,{method='GET',body=null,signal}={}){
    let response;
    try{response=await fetch(endpoint+path,{method,headers:headers(body),...(body?{body:JSON.stringify(body)}:{}),signal,credentials:'omit',cache:'no-store'});}
    catch(e){if(e.name==='AbortError'||signal?.aborted)throw e;const err=new Error('Mất kết nối tạm thời.');err.retryable=true;throw err;}
    let data;try{data=await response.json();}catch{const err=new Error('Kết nối AI trả dữ liệu không đọc được.');err.retryable=response.ok;throw err;}
    if(typeof data?.error==='string'&&data.error.trim()){const err=new Error(data.error);err.status=response.status;throw err;}
    if(!response.ok){const err=new Error('AI báo lỗi.');err.status=response.status;throw err;}
    return data;
  }
  async function start(path,body,signal){
    let reconnecting=false;
    while(true){
      try{
        const data=await request(path,{method:'POST',body,signal});
        return data?.jobId?{jobId:data.jobId,reused:Boolean(data.reused)}:{legacyResult:data};
      }catch(e){
        if(e.name==='AbortError'||signal?.aborted)throw e;
        if(!e.retryable)throw e;
        if(!reconnecting){reconnecting=true;onReconnect?.();}
        await pause(globalThis.document?.hidden?hiddenPollMs:pollMs,signal);
      }
    }
  }
  async function wait(jobId,signal){
    let reconnecting=false;
    while(true){
      if(signal?.aborted)throw abortError();
      try{
        const data=await request('/api/jobs/'+encodeURIComponent(jobId),{signal});
        reconnecting=false;
        if(data.status==='completed')return data.result;
        if(data.status==='error'||data.status==='cancelled')throw new Error(data.error||'Lượt luận không hoàn tất.');
        onRunning?.();
      }catch(e){
        if(e.name==='AbortError'||signal?.aborted)throw e;
        if(!e.retryable)throw e;
        if(!reconnecting){reconnecting=true;onReconnect?.();}
      }
      await pause(globalThis.document?.hidden?hiddenPollMs:pollMs,signal);
    }
  }
  async function cancel(jobId){
    if(!jobId)return;
    try{await request('/api/jobs/'+encodeURIComponent(jobId),{method:'DELETE'});}catch{}
  }
  return {start,wait,cancel};
}
