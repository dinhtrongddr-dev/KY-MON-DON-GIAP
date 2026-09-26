// Downstream narration primitives. This module never changes a board or judgment.
export const NARRATIVE_VERSION=1;
export const freezeNarrative=value=>{
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    Object.values(value).forEach(freezeNarrative);Object.freeze(value);
  }
  return value;
};
export const unique=items=>[...new Set(items.filter(x=>x!==undefined&&x!==null&&x!==''))];
export const normalizeNarrative=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
export const palaceNumber=value=>typeof value==='number'?value:Number(String(value||'').match(/(\d+)$/)?.[1]||0);
export const PALACE_LABELS={1:'Khảm 1',2:'Khôn 2',3:'Chấn 3',4:'Tốn 4',5:'Trung Ngũ',6:'Càn 6',7:'Đoài 7',8:'Cấn 8',9:'Ly 9'};
export const STEM_LABELS={JIA:'Giáp',YI:'Ất',BING:'Bính',DING:'Đinh',WU:'Mậu',JI:'Kỷ',GENG:'Canh',XIN:'Tân',REN:'Nhâm',GUI:'Quý'};
export const GENERAL_NOTE='Các nhận định mô tả xu hướng từ bàn Kỳ Môn. Quyết định của người khác, thu nhập và các sự kiện đời sống vẫn cần dựa vào tình hình thực tế.';

// Text adapters translate controlled engine messages, not arbitrary AI sentences.
export function plainEngineMeaning(value){
  return String(value||'')
    .replace(/Xử lý điều kiện cản tại Dụng Thần chính trước khi nâng mức kết luận hoặc mở rộng cam kết\./g,'Trước khi chốt, cần tháo được trở ngại ảnh hưởng trực tiếp đến việc này.')
    .replace(/Cấu trúc khóa rất mạnh/g,'Có dấu hiệu cản trở mạnh')
    .replace(/Cung khắc Môn: hoàn cảnh đang hạn chế cách triển khai/g,'Hoàn cảnh hiện tại khiến cách làm dự định khó thực hiện ngay')
    .replace(/Môn khắc Cung: cách triển khai tạo sức ép lên hoàn cảnh/g,'Cách làm dự định có thể tạo thêm sức ép lên những điều kiện đang có')
    .replace(/Tuần Không giới hạn mức thành thực, không phủ định tự động cơ hội hoặc phát sinh/g,'Cơ hội vẫn còn, nhưng chưa đủ điều kiện để thành kết quả cụ thể')
    .replace(/Dùng cấu trúc này để hạ mức chắc chắn và kiểm tra chéo; không cho nó tự lấn át Dụng Thần chính\./g,'Điểm vướng này làm việc khó thuận ngay, nhưng cần xét cùng những điều đang tác động trực tiếp đến quyết định.')
    .replace(/chất lượng cửa/g,'cách thực hiện')
    .replace(/Dụng Thần chính/g,'yếu tố quyết định')
    .replace(/Dụng Thần/g,'yếu tố đang xét')
    .replace(/Tầng ([^,.]+) còn phụ thuộc điều kiện chuyển bước, chưa thể coi đã đạt\./g,'Việc $1 vẫn cần chuẩn bị thêm trước khi chốt.')
    .replace(/tầng |lớp |trục |cụm tượng /gi,'')
    .replace(/primaryJudgment/g,'kết luận chính')
    .replace(/corroborator/g,'yếu tố hỗ trợ')
    .replace(/deterministic/g,'đã tính')
    .replace(/resolver/g,'cách xác định đại diện')
    .replace(/pipeline/g,'quá trình')
    .replace(/activation/g,'thay đổi theo thời điểm')
    .replace(/precedence/g,'thứ tự xét')
    .replace(/capacity band/g,'khả năng phát huy')
    .replace(/profile/g,'phương pháp')
    .replace(/\bcap\b/g,'giới hạn')
    .replace(/\bveto\b/g,'phủ định')
    .replace(/\bclaim\b/g,'nhận định')
    .replace(/\bevidence\b/g,'căn cứ')
    .replace(/go\/no-go/gi,'nhận hoặc từ chối')
    .replace(/đưa phương án có thể kiểm tra/gi,'đề xuất một phương án cụ thể để các bên phản hồi')
    .replace(/tạo một bước tiếp xúc hoặc thực hiện/gi,'thử một bước nhỏ có kết quả quan sát được')
    .replace(/khâu giữ nhịp và tổ chức sự việc/gi,'cách duy trì kế hoạch đều đặn')
    .replace(/chọn cách trao đổi phù hợp với thông tin nhạy cảm/gi,'trao đổi rõ phần quan trọng và giữ giới hạn riêng tư cần thiết')
    .replace(/thông tin gây sức ép hoặc cần làm rõ/gi,'điểm đang tạo áp lực và dữ kiện còn thiếu')
    .replace(/khâu cần tác động, sửa hoặc cạnh tranh/gi,'phần cần sửa hoặc phải xử lý quyết liệt')
    .replace(/\s+/g,' ').trim();
}
export function semanticMeaning(role){
  if(!role)return '';
  const value=String(role.meaning||'');
  const content=value.includes(': ')?value.slice(value.indexOf(': ')+2):value;
  return plainEngineMeaning(content.split(' Liên hệ nổi bật:')[0]);
}
export function atom(id,meaning,claimIds,{kind='interpretation',required=false,...rest}={}){
  return {id,meaning:plainEngineMeaning(meaning),claimIds:unique(claimIds),kind,required,...rest};
}
export function unit(id,label,claimIds,atoms,{conclusion='conditional',certainty='conditional',...extra}={}){
  return {id,label,claimIds:unique(claimIds),atoms:atoms.filter(a=>a.meaning),conclusion,certainty,...extra};
}
export function validateNarrativeContract(contract){
  if(contract.version!==NARRATIVE_VERSION)throw new Error('NARRATIVE_VERSION');
  const ids=new Set(contract.claims.map(c=>c.id)),seen=new Set(),atomIds=new Set();
  if(ids.size!==contract.claims.length)throw new Error('DUPLICATE_NARRATIVE_CLAIM');
  for(const u of contract.units){
    if(!u.id||seen.has(u.id))throw new Error('DUPLICATE_NARRATIVE_UNIT');
    seen.add(u.id);
    if(!u.atoms.length)throw new Error('EMPTY_NARRATIVE_UNIT');
    if(!['conditional','tendency','unknown','observed','recommendation','scope'].includes(u.certainty))throw new Error('INVALID_CERTAINTY');
    if(u.claimIds.some(id=>!ids.has(id)))throw new Error('UNKNOWN_NARRATIVE_CLAIM');
    for(const a of u.atoms){
      if(atomIds.has(a.id))throw new Error('DUPLICATE_NARRATIVE_ATOM');
      atomIds.add(a.id);
      if(a.claimIds.some(id=>!u.claimIds.includes(id)))throw new Error('ATOM_OUTSIDE_CLAIM_SCOPE');
      if(a.kind==='observed'&&!contract.userFacts.includes(a.meaning))throw new Error('INVENTED_OBSERVED_FACT');
    }
    if(u.modifierIds?.length&&u.certainty!=='conditional')throw new Error('GLOBAL_CERTAINTY_CAP');
    if(u.modifierIds?.length&&!u.claimIds.includes('GLOBAL_STRUCTURE'))throw new Error('MISSING_GLOBAL_TRACE');
  }
  if(contract.globalModifier?.active){
    if(!contract.globalModifier.effects.local_positive_signal_cap)throw new Error('GLOBAL_CAP_REMOVED');
    for(const id of contract.globalModifier.appliedTo){
      const u=contract.units.find(x=>x.id===id);
      if(!u||u.certainty!=='conditional'||!u.modifierIds?.length)throw new Error('GLOBAL_MODIFIER_NOT_APPLIED');
    }
  }
  for(const c of contract.claims){
    if(!c.id||!c.evidenceIds.length||!c.ruleIds.length)throw new Error('MISSING_CLAIM_PROVENANCE');
  }
  return contract;
}
function surfaceWriterAtoms(contract,atoms){
  if(contract.kind!=='menh')return atoms;
  const required=atoms.filter(a=>a.required);
  if(required.length)return required;
  const selected=[],seenClaims=new Set();
  for(const a of atoms){
    const key=unique(a.claimIds).filter(id=>id!=='GLOBAL_STRUCTURE').sort().join('|')||a.id;
    if(seenClaims.has(key))continue;
    seenClaims.add(key);selected.push(a);
    if(selected.length===2)return selected;
  }
  for(const a of atoms){
    if(!selected.includes(a))selected.push(a);
    if(selected.length===2)break;
  }
  return selected;
}
export function surfacePayload(contract){
  validateNarrativeContract(contract);
  return {
    version:contract.version,kind:contract.kind,question:contract.question,
    primaryConclusion:{
      conclusion:contract.primaryConclusion.conclusion,
      certainty:contract.primaryConclusion.certainty,
      meaning:contract.primaryConclusion.meaning||''
    },
    units:contract.units.map(({id,label,conclusion,certainty,atoms,stage})=>({
      id,label,conclusion,certainty,
      allowedMeaning:surfaceWriterAtoms(contract,atoms).map(({meaning,kind,required})=>({meaning,kind,required})),
      ...(stage?{stage}:{})
    })),
    allowedFacts:contract.userFacts,
    allowedImplications:contract.allowedImplications,
    forbiddenImplications:contract.forbiddenImplications,
    note:contract.note
  };
}
