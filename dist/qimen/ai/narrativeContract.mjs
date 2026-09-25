const bounded=value=>typeof value==='string'&&value.trim().length>0&&value.length<=700;
const normalized=value=>String(value||'').normalize('NFC').toLocaleLowerCase('vi').replace(/\s+/g,' ').trim();

// The semantic planner chooses topics to discuss, never new chart conclusions.
export function buildNarrativeContract(context,deliberation=null){
  const g=context.allInOne.reasoning,q=context.allInOne.questionContext,primary=g.primaryJudgment;
  const byId=new Map(g.claims.map(claim=>[claim.id,claim]));
  const candidates=deliberation?.semantic_frame?.related_considerations;
  const facets=[],seen=new Set();
  for(const item of Array.isArray(candidates)?candidates.slice(0,12):[]){
    if(!bounded(item?.label)||!bounded(item.why_relevant)||!['explicit','entailed','check_only'].includes(item.source))continue;
    if(item.source==='explicit'&&(!bounded(item.source_quote)||!normalized(context.question).includes(normalized(item.source_quote))))continue;
    const key=normalized(item.label);if(seen.has(key))continue;seen.add(key);
    const ids=[...new Set(Array.isArray(item.claim_ids)?item.claim_ids:[])].filter(id=>byId.has(id)).slice(0,6);
    const claims=ids.map(id=>byId.get(id));
    facets.push({id:`facet_${facets.length+1}`,label:item.label,source:item.source,
      sourceQuote:item.source==='explicit'?item.source_quote:null,
      authority:ids.length?'conditional_interpretation':'practical_check',
      conclusion:null,meaning:item.why_relevant,claimIds:ids,
      supportingPoints:claims.map(c=>({claimId:c.id,meaning:c.implication,evidenceIds:c.evidenceIds})),
      limitingPoints:claims.flatMap(c=>(c.conflicts||[]).map(limit=>({claimId:c.id,meaning:limit.resolution,evidenceIds:limit.evidenceIds||[]}))),
    });
    if(facets.length===8)break;
  }
  return {version:'KM-NARRATIVE-1.0',question:context.question,answerType:q.questionType,
    primaryConclusion:{meaning:primary.main,certainty:primary.answerClass,condition:primary.condition,claimIds:[...primary.claimIds]},
    facets,
    allowedImplications:[
      'Diễn giải có điều kiện từ đúng claim, giữ nguyên kết luận và mức chắc chắn.',
      'Khía cạnh không có claim chỉ là điều cần tự kiểm tra khi ra quyết định.',
      'explicit là lời người hỏi; entailed là đánh đổi có điều kiện; check_only chưa phải dữ kiện.',
    ],
    forbiddenImplications:[...primary.forbiddenClaims,
      'Không dùng khía cạnh phụ để đổi Dụng Thần hoặc kết luận chính.',
      'Không biến thời hạn người hỏi thành ngày dự báo; không khẳng định đủ tiền, tụt hậu hay quay lại nghề nếu chưa có dữ kiện thực tế.',
    ],
    technicalEvidence:g.claims.map(c=>({claimId:c.id,evidenceIds:[...c.evidenceIds]})),
  };
}
