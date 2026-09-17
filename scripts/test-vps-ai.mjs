import {prepareReading} from '../local/reading.mjs';
import {interpretReading} from '../local/interpret.mjs';
import {MODEL,ROUTING_MODE,REASONING_EFFORT} from '../local/codex-client.mjs';

const payload={
  question:'Kiểm tra kết nối AI trên VPS; hãy luận ngắn gọn đúng theo dữ kiện bàn.',
  topic:'general',
  method:'chaibu',
  input:{year:2026,month:9,day:17,hour:14,minute:0,tzOffset:7},
};

const prepared=prepareReading(payload);
const started=Date.now();
try{
  const reading=await interpretReading(prepared);
  console.log(JSON.stringify({
    ok:true,
    router:ROUTING_MODE,
    modelRoute:MODEL,
    reasoningEffort:REASONING_EFFORT,
    readingStatus:reading.status,
    elapsedSeconds:Math.round((Date.now()-started)/1000),
  },null,2));
}catch(error){
  console.error(JSON.stringify({
    ok:false,
    router:ROUTING_MODE,
    modelRoute:MODEL,
    reasoningEffort:REASONING_EFFORT,
    error:error?.message||String(error),
  },null,2));
  process.exitCode=1;
}
