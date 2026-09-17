import {askedDimension,dimensionKeys} from './outcomeDimensions.mjs';
export function buildPrimaryJudgment(dimensions,eventStages,selected,context) {
  const key=askedDimension(context),target=dimensions[key],finance=context.domain==='finance',keys=dimensionKeys(context);
  const realization=dimensions[keys[5]],positive=target.status==='positive';
  const answerClass=context.needsClarification?'needs_clarification':positive?'conditional_positive':target.status==='conditional'?'conditional':'unresolved';
  const label=eventStages.stages.find(s=>s.dimension===key).label.toLowerCase();
  const main=positive?`Có tín hiệu ${label}; nhận định ở tầng đang hỏi thiên về có.`:
    target.status==='conditional'?`Tầng ${label} còn phụ thuộc điều kiện chuyển bước, chưa thể coi đã đạt.`:`Tầng ${label} chưa có hỗ trợ đủ rõ để kết luận kết quả.`;
  const early=['opportunity','emergence','formation'].includes(context.outcomeTarget.stageAsked);
  const distinction=finance&&early?(positive&&realization.status!=='positive'?'Tượng phát sinh khoản thu mạnh hơn tượng thực nhận; có phát sinh không có nghĩa tiền đã vào tay.':'Khả năng phát sinh khoản thu và tiền thực nhận là hai tầng riêng.'):
    finance?'Phát sinh hoặc cam kết khoản thu chưa đồng nghĩa tiền đã thực nhận và hoàn tất.':context.intent==='reply'?'Có phản hồi chưa đồng nghĩa chấp thuận hoặc ký hợp đồng.':'Tiến triển ở một khâu chưa đồng nghĩa đạt kết quả cuối.';
  const strongestSupport=target.supportingEvidenceIds;
  const strongestLimit=[...new Set([...target.limitingEvidenceIds,...(early?realization.limitingEvidenceIds:[])])];
  const claimIds=selected.filter(b=>strongestSupport.includes(`p${b.palace}`)||strongestLimit.includes(`c${b.palace}`)||b.actorIds.includes('self')||b.actorIds.includes('event')).map(b=>`claim_${b.palace}`);
  return {answerClass,stageAsked:context.outcomeTarget.stageAsked,dimension:key,main,distinction,strongestSupport,strongestLimit,
    condition:target.conditions[0]||eventStages.transitions.find(t=>t.from==='EMERGENCE')?.condition,
    expectedSequence:eventStages.stages.map(s=>({stage:s.stage,label:s.label,status:s.status,evidenceIds:[...new Set([...s.supportingEvidenceIds,...s.limitingEvidenceIds])]})),
    claimIds,questionType:context.questionType,
    forbiddenClaims:['Không biến hỗ trợ biểu tượng thành sự kiện đã xảy ra.','Không tự thêm người, số tiền hoặc ngày dự báo.',
      ...(finance&&early&&positive?['Không phủ định phát sinh chỉ vì tầng thực nhận còn bị giới hạn.']:[]),
      'Không suy danh tính hoặc quyền phê duyệt từ Trực Phù.'],
    confidenceMeaning:'Mức phù hợp giữa cụm tượng và câu hỏi, không phải xác suất dự báo.'};
}
