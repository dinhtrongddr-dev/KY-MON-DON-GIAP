import {MODES} from '../modes/shared.mjs';
export function synthesisSchema(facts,context) {
  const str={type:'string'},array=items=>({type:'array',items});
  const object=properties=>({type:'object',additionalProperties:false,required:Object.keys(properties),properties});
  const stepIds=context?.allInOne.plan.chain.map(s=>s.id)||Object.keys(facts).filter(id=>id.startsWith('mode_'));
  const graphIds=context?.allInOne.graph.relations.map(r=>r.id)||Object.keys(facts).filter(id=>id.startsWith('graph_'));
  const comparisonIds=Object.keys(facts).filter(id=>/^(timing|direction)_\d+$/.test(id));
  return object({mode:{type:'string',enum:MODES.filter(m=>m!=='auto')},
    mode_chain:array(object({step_id:{type:'string',enum:stepIds},text:str,evidence_ids:array({type:'string',enum:Object.keys(facts)})})),
    story_links:array(object({stage:{type:'string',enum:['current','next','outcome']},graph_id:{type:'string',enum:graphIds},explanation:str})),
    comparisons:array(object({id:comparisonIds.length?{type:'string',enum:comparisonIds}:str,reason:str})),
    turningPoint:str,likelyOutcome:str,timing:str,recommendedActions:array(str),avoid:array(str)});
}
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const text=(s,min=1,max=2400)=>typeof s==='string'&&s.trim().length>=min&&s.length<=max;
export function validateSynthesis(result,facts,context,reject) {
  const s=result.synthesis;
  if(!exact(s,['mode','mode_chain','story_links','comparisons','turningPoint','likelyOutcome','timing','recommendedActions','avoid'])||!MODES.includes(s.mode)||s.mode==='auto')reject('Thiếu cấu trúc tổng hợp theo chế độ.');
  const ctx=context?.allInOne;
  if(ctx&&s.mode!==ctx.classification.mode)reject('AI luận lệch chế độ đã chọn.');
  for(const key of ['turningPoint','likelyOutcome','timing'])if(!text(s[key]))reject('Thiếu điểm chuyển, kết quả hoặc phạm vi ứng kỳ.');
  for(const key of ['recommendedActions','avoid'])if(!Array.isArray(s[key])||s[key].length>4||s[key].some(v=>!text(v,1,1200)))reject('Chiến lược đề xuất không hợp lệ.');
  if(!Array.isArray(s.mode_chain)||!Array.isArray(s.story_links)||!Array.isArray(s.comparisons))reject('Thiếu chuỗi luận hoặc liên kết câu chuyện.');
  if(result.status==='needs_clarification') {
    if(s.mode_chain.length||s.story_links.length||s.comparisons.length)reject('Chưa rõ chủ thể thì chưa viết kịch bản hoặc chuỗi kết quả.');
    return;
  }
  if(s.recommendedActions.length<2||!s.avoid.length)reject('Thiếu hành động hoặc điều cần tránh.');
  const compareIds=Object.keys(facts).filter(id=>/^(timing|direction)_\d+$/.test(id));
  if(s.comparisons.length>12||new Set(s.comparisons.map(x=>x.id)).size!==s.comparisons.length||s.comparisons.some(x=>!exact(x,['id','reason'])||!compareIds.includes(x.id)||!text(x.reason,80,1800)))reject('AI viện dẫn thời điểm / hướng ngoài danh sách đã tính.');
  if(s.mode==='timing'&&s.comparisons.length!==compareIds.length||s.mode==='direction'&&s.comparisons.length<2||!['timing','direction'].includes(s.mode)&&s.comparisons.length)reject('Chưa so sánh đủ thời điểm / phương hướng theo chế độ.');
  const chain=ctx?.plan.chain;
  if(s.mode_chain.length!==(chain?.length||s.mode_chain.length)||s.mode_chain.length<3||s.mode_chain.length>12)reject('Chuỗi luận chưa đủ các khâu của chế độ.');
  for(const [i,step] of s.mode_chain.entries()) {
    if(!exact(step,['step_id','text','evidence_ids'])||!text(step.text,80,2200)||
      !Object.hasOwn(facts,step.step_id)||!step.step_id.startsWith(`mode_${s.mode}_`)||
      (chain&&step.step_id!==chain[i].id)||!Array.isArray(step.evidence_ids)||step.evidence_ids.length<2||step.evidence_ids.length>6||
      new Set(step.evidence_ids).size!==step.evidence_ids.length||!step.evidence_ids.includes(step.step_id)||
      step.evidence_ids.some(id=>!Object.hasOwn(facts,id)))reject('Khâu luận sai thứ tự, quá sơ lược hoặc thiếu căn cứ.');
    if(chain) {
      const roles=chain[i].roleIds.map(id=>ctx.analysis.roles.find(r=>r.id===id));
      const allowed=new Set(roles.flatMap(r=>[r.evidenceId,...(r.palace?[`p${r.palace}`,`c${r.palace}`,`strength_${r.palace}`]:[])]));
      if(!step.evidence_ids.some(id=>allowed.has(id)))reject('Khâu luận chưa dùng đại diện đúng trọng tâm.');
    }
  }
  const edges=ctx?.graph.relations;
  if(s.story_links.length<2||s.story_links.length>6||new Set(s.story_links.map(l=>l.graph_id)).size<2)reject('Câu chuyện chưa nối ít nhất hai quan hệ khác nhau.');
  for(const link of s.story_links)if(!exact(link,['stage','graph_id','explanation'])||!['current','next','outcome'].includes(link.stage)||!text(link.explanation,80,1800)||
    !Object.hasOwn(facts,link.graph_id)||!link.graph_id.startsWith('graph_')||(edges&&!edges.some(e=>e.id===link.graph_id))||
    !result.development.find(d=>d.stage===link.stage)?.evidence_ids?.includes(link.graph_id))reject('Câu chuyện dùng liên kết không có trong graph hoặc chưa gắn với chặng diễn biến.');
}
