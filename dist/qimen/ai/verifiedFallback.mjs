export function clarificationReading(context) {
  const c=context.allInOne,empty=()=>({text:'',claim_ids:[]});
  return {status:'needs_clarification',topic_id:c.resolvedTopic,mode:c.classification.mode,questionType:c.questionContext.questionType,
    summary:{text:'Cần làm rõ thông tin ảnh hưởng trực tiếp cách chọn đại diện hoặc sử dụng phương hướng.',claim_ids:[]},
    situation:empty(),development:[],bottleneck:{...empty(),resolution:''},actions:[],alternative:{...empty(),id:''},timing:empty(),comparisons:[],questions:c.questionContext.clarificationQuestions};
}
export function verifiedFallback(context) {
  const c=context.allInOne,g=c.reasoning,empty=()=>({text:'',claim_ids:[]});
  const selected=g.likelyScenario.primaryJudgment.claimIds;
  const ids=[...new Set(selected.flatMap(id=>g.claims.find(x=>x.id===id)?.evidenceIds||[]))].filter(id=>/^p[1-9]$/.test(id));
  const notice='**Chưa có bài luận AI đủ căn cứ sau một lượt sửa.** Phần dưới chỉ gồm dữ kiện do ứng dụng tính và giới hạn đã xác định; chưa kết luận kết quả ngoài thực tế.';
  return {status:'verified_fallback',topic_id:c.resolvedTopic,mode:c.classification.mode,questionType:c.questionContext.questionType,
    summary:{text:notice,claim_ids:[]},situation:{text:ids.map(id=>context.facts[id]).join('\n\n'),claim_ids:selected},
    development:[],bottleneck:{...empty(),resolution:''},actions:[],alternative:{...empty(),id:''},
    timing:{text:'**Chưa xác định ngày xảy ra kết quả.** '+g.likelyScenario.timing.limit,claim_ids:[]},comparisons:[],
    questions:c.questionContext.clarificationQuestions||[]};
}
