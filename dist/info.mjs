import {createActivityLog} from './activity-log.mjs';
import {AI_RELAY_ORIGIN} from './site-config.mjs';

createActivityLog({pollMs:60_000});

const put=(id,text)=>{const el=document.getElementById(id);if(el)el.textContent=text;};
async function refreshStatus(){
  try{
    const response=await fetch(AI_RELAY_ORIGIN+'/api/status',{credentials:'omit',cache:'no-store'});
    if(!response.ok)throw new Error('unavailable');
    const data=await response.json();
    put('system-ai-status','Đang hoạt động');
    put('system-ai-route',[data.router,data.model,data.reasoningEffort].filter(Boolean).join(' · '));
    put('system-ai-rules',[data.rules,data.protocol!=null?'protocol '+data.protocol:''].filter(Boolean).join(' · '));
    put('system-menh-rules',[data.menhRules,data.menhProtocol!=null?'protocol '+data.menhProtocol:''].filter(Boolean).join(' · '));
  }catch{
    put('system-ai-status','Chưa lấy được trạng thái server');
    put('system-ai-route','—');put('system-ai-rules','—');put('system-menh-rules','—');
  }
}
refreshStatus();
