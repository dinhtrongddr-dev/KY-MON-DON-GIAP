const DONE=new Set(['completed','fallback','clarification']);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const two=value=>String(value).padStart(2,'0');
const clock=ms=>{const d=new Date(ms);return two(d.getHours())+':'+two(d.getMinutes());};

export function estimateReadingMs(activity,{fallbackMs=180000}={}){
  let rows=[];try{rows=activity?.snapshot?.().recentReadings||[];}catch{}
  const durations=rows.filter(x=>DONE.has(x.status)&&Number.isFinite(x.at)&&Number.isFinite(x.finishedAt)&&x.finishedAt>x.at)
    .map(x=>x.finishedAt-x.at).filter(ms=>ms>=15000&&ms<=600000).slice(0,12).sort((a,b)=>a-b);
  if(!durations.length)return fallbackMs;
  const middle=Math.floor(durations.length/2),median=durations.length%2?durations[middle]:(durations[middle-1]+durations[middle])/2;
  return clamp(median,45000,480000);
}

export function readingProgressText({startedAt,now=Date.now(),estimateMs=180000}){
  const elapsed=Math.max(0,Math.floor((now-startedAt)/1000)),low=startedAt+Math.max(30000,estimateMs*.75),high=startedAt+Math.max(90000,estimateMs*1.25);
  if(now>high)return `Đã chờ ${elapsed} giây · Lâu hơn dự kiến; AI vẫn đang xử lý.`;
  return `Đã chờ ${elapsed} giây · Dự kiến xong khoảng ${clock(low)}–${clock(high)}.`;
}
