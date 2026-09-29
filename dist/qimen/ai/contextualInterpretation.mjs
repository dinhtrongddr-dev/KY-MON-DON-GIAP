// Contextual interpretation layer.
// Bridges deterministic evidence with human meaning.
// Never decides verdict, certainty or factual outcome.

const SEMANTIC_KNOWLEDGE={
  access:{core:['mở','tiếp cận','tạo cửa vào','kết nối'],
    domains:{business:['mở kênh trao đổi','đưa năng lực ra thị trường','tiếp cận đối tác'],career:['mở cơ hội tiếp xúc'],relationship:['mở giao tiếp']}},
  contact:{core:['trao đổi','liên hệ','duy trì tương tác'],
    domains:{business:['trao đổi nhu cầu','nhận phản hồi'],relationship:['kết nối và chia sẻ']}},
  growth:{core:['phát triển','mở rộng','tạo thêm giá trị'],
    domains:{business:['mở rộng hoạt động','tăng khả năng phát triển'],finance:['tạo thêm nguồn lực']}},
  expertise:{core:['năng lực','chuyên môn','cách làm'],
    domains:{business:['giải pháp','hồ sơ năng lực','khả năng đáp ứng'],career:['kinh nghiệm','khả năng thể hiện']}},
  ambiguity:{core:['chưa rõ','nhiều khả năng','cần làm rõ'],
    domains:{business:['thông tin ban đầu chưa hoàn toàn rõ'],general:['không nên kết luận quá sớm']}}
};

const INTERACTION_HINTS={
  access:['không tự đồng nghĩa kết quả đã hoàn thành'],
  contact:['cần nhìn thêm phản hồi thực tế'],
  growth:['cần xem khả năng duy trì và phát triển'],
  expertise:['nên gắn với năng lực thực tế'],
  ambiguity:['cần giữ mức diễn giải phù hợp']
};

function getDomainMeaning(domain,mechanism){
  const item=SEMANTIC_KNOWLEDGE[mechanism];
  return item?.domains?.[domain]||item?.domains?.business||[];
}

export function buildContextualInterpretation(claims,questionContext={}){
  return (claims||[]).map(claim=>{
    const mechanism=claim.mechanism;
    const semantic=SEMANTIC_KNOWLEDGE[mechanism]||{core:[mechanism],domains:{}};
    return {
      claimId:claim.id,
      mechanism,
      semanticCore:semantic.core,
      contextMeaning:getDomainMeaning(questionContext.domain,mechanism),
      manifestations:claim.realWorldManifestation?.concepts||[],
      supportingFactors:claim.supportingFactors||[],
      limitingFactors:claim.conflicts||[],
      interactionHints:INTERACTION_HINTS[mechanism]||[],
      certaintyBoundary:'Ý nghĩa này dùng để giải thích biểu tượng trong hoàn cảnh câu hỏi, không phải xác nhận sự kiện đã xảy ra.',
      writerGuidance:'Tổng hợp căn cứ thành ý nghĩa đời thực; không tách từng ký hiệu thành từ khóa độc lập.'
    };
  });
}
