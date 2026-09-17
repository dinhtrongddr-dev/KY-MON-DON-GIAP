export const DELIBERATION_INSTRUCTIONS=`Bạn đang ở bước lập kế hoạch tổng hợp cho một bài luận Kỳ Môn, chưa phải bước viết câu trả lời cuối. Không dùng công cụ, không truy cập mạng, không tự lập lại bàn. Chỉ làm việc với readingGraph, evidence, presentation và comparisons đã cung cấp.
Mục tiêu: chọn đúng tầng kết quả người dùng hỏi, xác định cụm tượng quyết định, cụm phản chứng/giới hạn, nút chuyển và thứ tự trình bày phù hợp CHẾ ĐỘ. Không được tạo fact, actor, ngày, số tiền, xác suất hoặc sự kiện ngoài planner.
Không viết diễn giải dài. Mỗi note là một câu ngắn mô tả vai trò của căn cứ trong lập luận. Prediction ưu tiên kết quả và điều kiện đổi kết quả; strategy ưu tiên chuỗi quyết định; business ưu tiên pipeline thương vụ; negotiation ưu tiên đòn bẩy/giới hạn; timing/direction ưu tiên so sánh các lựa chọn đã tính.
Đây là dàn ý nội bộ có cấu trúc. Bản viết cuối phải tự kiểm tra lại dàn ý với readingGraph và không coi dàn ý là nguồn dữ kiện mới.`;

const arr=items=>({type:'array',items,uniqueItems:true});
const obj=properties=>({type:'object',additionalProperties:false,required:Object.keys(properties),properties});
const str={type:'string'};
const choice=values=>({type:'string',enum:values});

export function deliberationSchema(context){
  const c=context.allInOne,g=c.reasoning;
  const claimIds=g.claims.map(x=>x.id),recommendationIds=g.recommendations.map(x=>x.id);
  const principal=g.likelyScenario.mainConflict?.claimId||'';
  return obj({
    answer_class:choice([g.primaryJudgment.answerClass]),
    decisive_claim_ids:arr(choice(claimIds)),
    counter_claim_ids:arr(choice(claimIds)),
    bottleneck_claim_id:choice([...new Set(['',principal,...claimIds])]),
    mode_focus:str,
    stage_logic:arr(obj({slot:choice(['answer','current','next','outcome','risk','action','alternative','timing']),claim_ids:arr(choice(claimIds)),note:str})),
    recommendation_ids:arr(choice(recommendationIds.length?recommendationIds:[''])),
    timing_policy:choice(c.classification.mode==='timing'?['computed_comparison']:g.timing?.allowedPredictions?.length?['allowed_prediction']:['not_applicable','scope_only'])
  });
}

export function shouldDeliberate(context){
  return ['prediction','strategy','business','negotiation'].includes(context.allInOne.classification.mode)&&!context.allInOne.questionContext.needsClarification;
}
