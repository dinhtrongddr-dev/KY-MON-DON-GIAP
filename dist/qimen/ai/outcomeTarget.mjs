const FINANCIAL=/\b(tien(?! (?:trien|hanh|do)\b)|khoan thu|thu nhap|thanh toan|cong no|khoan dang cho|loi nhuan|kiem tien)\b/;
export const isFinancialQuestion=q=>FINANCIAL.test(q);
export function outcomeTarget(q,domain,intent,horizon) {
  const finance=domain==='finance';
  let stageAsked=/\b(hoan tat|hoan thanh|xong het|ket thuc)\b/.test(q)?'completion':
    /\b(phat sinh|xuat hien|co phan hoi|co tin|hoi am)\b/.test(q)?'emergence':
    /\b(co hoi)\b/.test(q)?'opportunity':
    finance&&/\b(vao tai khoan|thuc nhan|nhan duoc tien|tien ve|tien vao|thu duoc tien)\b/.test(q)?'cash_realization':
    /\b(dong y|chap thuan|xac nhan|ky|duyet|chot|cam ket)\b/.test(q)?'confirmation':
    /\b(xu ly|trien khai|thuc hien|thanh toan|nen thay doi)\b/.test(q)?'execution':
    intent==='reply'?'emergence':intent==='contract'||intent==='negotiation'?'confirmation':
    intent==='career_change'?'realization':intent==='family_decision'?'execution':finance?'emergence':'formation';
  const objects={finance:'money',business:'agreement',project:'project_result',career:'work',relationship:'relationship',family:'family_decision',study:'learning',search:'search_result',health:'care',legal:'legal_process',property:'property',travel:'journey'};
  const event=finance?(intent==='payment'?'payment':'income_occurrence'):intent==='reply'?'response':intent;
  return {object:objects[domain]||'event',event,stageAsked,realizationAsked:['cash_realization','realization','completion'].includes(stageAsked),
    timeHorizon:horizon.code||horizon.status};
}
