export const DELIBERATION_INSTRUCTIONS=`Bạn đang ở bước lập kế hoạch tổng hợp cho một bài luận Kỳ Môn, chưa phải bước viết câu trả lời cuối. Không dùng công cụ, không truy cập mạng, không tự lập lại bàn. Chỉ làm việc với question, readingGraph, evidence, presentation và comparisons đã cung cấp.
Mục tiêu 1 — hiểu sự việc theo nghĩa, không theo từ khóa: trước khi chọn claim, hãy tái dựng semantic_frame của câu hỏi. Xác định quyết định trung tâm, điều người dùng nói rõ, các đánh đổi ngầm hợp lý và 2–6 vấn đề LIÊN QUAN TRỰC TIẾP trong cùng bối cảnh mà một người ra quyết định thông minh nên cân nhắc. Có thể suy ra các vấn đề liên quan dù người dùng không dùng đúng từ khóa của domain, nhưng chỉ ở dạng khía cạnh cần cân nhắc/kiểm tra, không được biến thành fact đã xảy ra.
Mục tiêu 2 — tổng hợp Kỳ Môn: chọn đúng tầng kết quả người dùng hỏi, xác định cụm tượng quyết định, cụm phản chứng/giới hạn, nút chuyển và thứ tự trình bày phù hợp CHẾ ĐỘ. Không được tạo actor có vị trí cung, ngày, số tiền, xác suất, tâm ý, nguyên nhân hay sự kiện ngoài planner.
Phân loại từng related_consideration bằng source: explicit = người dùng nói thẳng; entailed = hệ quả trực tiếp của lựa chọn đang hỏi; check_only = vấn đề hợp lý nên kiểm tra thêm nhưng chưa có dữ kiện. check_only tuyệt đối không được viết như sự thật. Ví dụ một quyết định gia đình có thể liên quan nguồn lực chăm sóc, độ bền thu nhập, phân công trách nhiệm, phương án quay lại công việc hoặc mốc rà soát — nhưng chỉ nêu mục nào thực sự liên quan câu hỏi cụ thể.
Không mở rộng sang chủ đề xa chỉ để bài dài hơn. related_considerations phải giải thích vì sao liên quan đến core_decision; scope_guard ghi rõ những điều không được suy thành fact.
Không viết diễn giải dài. Mỗi note là một câu ngắn mô tả vai trò của căn cứ trong lập luận. Prediction ưu tiên kết quả và điều kiện đổi kết quả; strategy ưu tiên chuỗi quyết định; business ưu tiên pipeline thương vụ; negotiation ưu tiên đòn bẩy/giới hạn; timing/direction ưu tiên so sánh các lựa chọn đã tính.
Đây là dàn ý nội bộ có cấu trúc. Trả đúng JSON theo output schema; không Markdown, không tiêu đề, không code fence, không thêm khóa ngoài schema. Bản viết cuối phải tự kiểm tra lại dàn ý với readingGraph và không coi semantic_frame hay deliberation là nguồn dữ kiện mới.`;

const arr=items=>({type:'array',items});
const obj=properties=>({type:'object',additionalProperties:false,required:Object.keys(properties),properties});
const str={type:'string'};
const choice=values=>({type:'string',enum:values});

export function deliberationSchema(context){
  const c=context.allInOne,g=c.reasoning;
  const claimIds=g.claims.map(x=>x.id),recommendationIds=g.recommendations.map(x=>x.id);
  const principal=g.likelyScenario.mainConflict?.claimId||'';
  return obj({
    semantic_frame:obj({
      core_decision:str,
      explicit_points:arr(str),
      implied_tradeoffs:arr(str),
      related_considerations:arr(obj({label:str,why_relevant:str,source:choice(['explicit','entailed','check_only'])})),
      scope_guard:arr(str)
    }),
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
