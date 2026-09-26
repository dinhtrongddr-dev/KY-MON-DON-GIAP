import {buildMenhWriterContext} from './writer-context.mjs';
import {NARRATIVE_VERSION,freezeNarrative,unique,atom,unit,semanticMeaning,plainEngineMeaning,palaceNumber,PALACE_LABELS,STEM_LABELS,GENERAL_NOTE,validateNarrativeContract} from '../../ai/narrativePrimitives.mjs';
import {palaceEvidence} from '../../ai/narrativeEvidence.mjs';
const SECTIONS={SELF:'self',FAMILY:'family',CHILDREN:'family',MARRIAGE:'marriage',CAREER:'career',WEALTH:'wealth'};
const LABELS={overview:'Tổng thể',self:'Bản thân',family:'Gia đình và con cái',marriage:'Hôn nhân',career:'Sự nghiệp',wealth:'Tài vận',luck:'Giai đoạn hiện tại',annual:'Năm đang xét',birthTimeNote:'Khi chưa rõ giờ sinh'};
const MAIN={
  SELF_CORE:['SELF_DAY_STEM'],FAMILY_PARENTS:['PARENT_YEAR_STEM'],CHILDREN_CORE:['CHILD_HOUR_STEM'],
  MARRIAGE_CORE:['MARR_SELF','MARR_XIU','MARR_LIU_HE','MARR_YI_GENG','MARR_DAY_PAIR'],
  CAREER_CORE:['CAREER_SELF_VOCATION','CAREER_KAI'],WEALTH_CORE:['WEALTH_SHENG'],
  LUCK_CURRENT:['LUCK_ACTIVE_PERIOD'],ANNUAL_CURRENT:['ANNUAL_STEM','ANNUAL_BRANCH']
};
const RELATION={
  generates:'Phần hỗ trợ có thể tiếp sức cho bạn; cần phân biệt nguồn lực đang có với điều mới chỉ trông đợi.',
  generated_by:'Bạn phải dành công sức nuôi dưỡng việc này; nên tính cả sức bền của mình khi nhận thêm trách nhiệm.',
  same:'Có sự tương hợp, thuận cho việc duy trì và phối hợp nếu hai bên cùng giữ cam kết.',
  controls:'Yêu cầu từ phía này tạo sức ép lên bạn; cần cân bằng trách nhiệm với khả năng đáp ứng.',
  controlled_by:'Bạn thiên về chủ động sắp xếp hơn là chờ hoàn cảnh nâng đỡ; cách làm phải vừa với nguồn lực mình có.'
};
function claimSection(c){
  return c.claimId==='LUCK_CURRENT'?'luck':c.claimId==='ANNUAL_CURRENT'?'annual':SECTIONS[c.domain];
}
function lifeMeaning(value,claim){
  const text=String(value||'').replace(/Kênh /g,'').replace(/kiểm soát truy cập/g,'giữ ranh giới').replace(/Hiển lộ/g,'Thể hiện rõ').replace(/hiển lộ/g,'thể hiện rõ').replace(/mở giá trị mới/g,'tạo thêm giá trị').replace(/[.!?]$/,'');
  const phrase=text.charAt(0).toLowerCase()+text.slice(1);
  const prefix={SELF_CORE:'Bạn có xu hướng ',FAMILY_PARENTS:'Nề nếp gia đình thiên về ',CHILDREN_CORE:'Việc chăm sóc con nghiêng về ',MARRIAGE_CORE:'Trong đời sống chung, điều đáng chú ý là xu hướng ',CAREER_CORE:'Trong công việc, hướng phù hợp là ',WEALTH_CORE:'Việc tạo dựng nguồn lực thiên về ',LUCK_CURRENT:'Ưu tiên của giai đoạn này là ',ANNUAL_CURRENT:'Nhịp sống trong năm thiên về '}[claim.claimId]||'Xu hướng đáng chú ý là ';
  return prefix+phrase+'.';
}
function trimLifeLead(text){
  return String(text||'').replace(/^(?:Bạn có xu hướng|Ưu tiên của giai đoạn này là|Nhịp sống trong năm thiên về)\s+/,'').replace(/[.!?]+$/,'').trim();
}
function lowerFirst(text){return text?text.charAt(0).toLowerCase()+text.slice(1):'';}
function naturalRisk(text){return lowerFirst(text).replace(/\bkiểm soát\b/gi,'muốn kiểm soát mọi thứ').replace(/\bkhẩu thiệt\b/gi,'lời nói gây va chạm').replace(/\bnhiễu\b/gi,'quyết định bị nhiễu').replace(/\bhoảng\b/gi,'hoảng hốt').replace(/,\s*/g,' hoặc ');}
function lifeSynthesisAtoms(c,atoms,ctx){
  const ids=[c.claimId],sourceEvidenceIds=unique(atoms.flatMap(a=>a.sourceEvidenceIds||[]));
  const byRole=role=>atoms.find(a=>a.role===role);
  if(c.claimId==='SELF_CORE'){
    const core=byRole('operatingStyle')||atoms[0];if(!core)return [];
    const weak=/yếu/i.test(core.supportLevel||''),risk=naturalRisk(core.caution||'suy tính quá lâu');
    return [atom('self_integrated_pattern','Bạn thiên về '+trimLifeLead(core.meaning)+(weak?', nhưng điểm mạnh này không phải lúc nào cũng tự chuyển thành kết quả':'')+'. Nếu '+risk+', việc tiếp tục phân tích có thể làm chậm quyết định. Cách cân bằng là chốt tiêu chí, làm một bước nhỏ rồi điều chỉnh theo phản hồi thực tế.',ids,{sourceEvidenceIds,required:true,kind:'life_synthesis'})];
  }
  if(c.claimId==='LUCK_CURRENT'&&ctx.luck){
    const parts=['palaceContext','actionChannel','operatingStyle'].map(byRole).filter(Boolean),meanings=unique(parts.map(a=>trimLifeLead(a.meaning))).slice(0,3),risk=naturalRisk(parts.find(a=>a.caution)?.caution||'giữ trạng thái cũ quá lâu');
    if(meanings.length<2)return [];
    return [atom('luck_integrated_pattern','Trong giai đoạn '+ctx.luck.ageStart+'–'+ctx.luck.ageEnd+' tuổi, các ưu tiên nên đi cùng nhau: '+meanings.join('; ')+'. Điểm mạnh là xây nền bền hơn, nhưng cần đặt mốc xem lại để việc củng cố không biến thành '+risk+'.',ids,{sourceEvidenceIds,required:true,kind:'life_synthesis'})];
  }
  if(c.claimId==='ANNUAL_CURRENT'){
    const context=byRole('palaceContext'),action=byRole('actionChannel'),style=byRole('operatingStyle');if(!context||!action)return [];
    const risks=unique([context.caution,action.caution,style?.caution].filter(Boolean).map(naturalRisk)).slice(0,2);
    return [atom('annual_integrated_pattern','Trong năm đang xét, xung lực '+trimLifeLead(context.meaning)+' đi cùng cách phản ứng '+trimLifeLead(action.meaning)+'. Vì vậy, nên tách việc cần làm ngay khỏi việc cần thêm dữ liệu, rồi mới tăng tốc; cách này giúp giảm những mặt trái như '+(risks.join('; ')||'phản ứng quá nhanh')+'.',ids,{sourceEvidenceIds,required:true,kind:'life_synthesis'})];
  }
  return [];
}
function roleAtoms(c,ctx){
  const ids=[c.claimId],out=[];
  const semantic=ctx.semanticMatrix.claims.find(x=>x.claimId===c.claimId);
  const linked=ctx.evidence.filter(e=>c.evidenceIds.includes(e.evidenceId));
  const preferred=MAIN[c.claimId]||[];
  for(const [i,eid] of preferred.entries()){
    const e=linked.find(x=>x.evidenceId===eid);if(!e)continue;
    const n=palaceNumber(e.palace),p=semantic?.palaces.find(x=>x.palace===n);
    const prefix=c.claimId+'_'+eid;
    const roles=c.claimId==='CAREER_CORE'&&i===0?['operatingStyle','actionChannel']:
      c.claimId==='SELF_CORE'?['operatingStyle','actionChannel','hiddenFactor','heavenStemExpression']:
      ['palaceContext','actionChannel','operatingStyle'];
    if(p)for(const roleName of roles){
      const r=roleName==='heavenStemExpression'?p[roleName]?.primary:p[roleName];
      const meaning=semanticMeaning(r);if(!meaning)continue;
      const point=atom(prefix+'_'+roleName,lifeMeaning(meaning,c),ids,{sourceEvidenceIds:[eid],role:roleName,secondary:i>0});
      if(r.shadow)point.caution=plainEngineMeaning(r.shadow);
      if(r.strength?.level)point.supportLevel=r.strength.level;
      out.push(point);
    }
    if(e.relation&&RELATION[e.relation.kind]){
      const subject={FAMILY_PARENTS:'Gia đình gốc',CHILDREN_CORE:'Việc chăm sóc con',MARRIAGE_CORE:'Đời sống chung',CAREER_CORE:'Công việc',WEALTH_CORE:'Nguồn lực tài chính',LUCK_CURRENT:'Giai đoạn này',ANNUAL_CURRENT:'Năm đang xét'}[c.claimId]||'Điều đang xét';
      const relation={generates:subject+' có phần nâng đỡ bạn; sức hỗ trợ ấy phát huy đến đâu còn tùy cách thu xếp thực tế.',generated_by:'Bạn cần dành sức cho '+subject.toLowerCase()+'; nên tính cả khả năng duy trì lâu dài.',same:subject+' có sự tương hợp với bạn, thuận để phối hợp và duy trì nếu cùng giữ cam kết.',controls:subject+' có thể tạo sức ép, đòi hỏi bạn cân bằng trách nhiệm với sức mình.',controlled_by:'Với '+subject.toLowerCase()+', bạn thiên về chủ động sắp xếp; cách làm cần vừa với nguồn lực đang có.'}[e.relation.kind];
      out.push(atom(prefix+'_relation',relation,ids,{sourceEvidenceIds:[eid],required:true}));
    }
  }
  // Several representatives may corroborate the same point. Merge their trace;
  // they are not independent reasons for a stronger or longer conclusion.
  const merged=[];
  for(const a of out){
    const previous=merged.find(x=>x.meaning===a.meaning&&x.role===a.role);
    if(previous){previous.sourceEvidenceIds=unique([...previous.sourceEvidenceIds,...a.sourceEvidenceIds]);previous.required ||= a.required;}
    else merged.push(a);
  }
  return [...merged,...lifeSynthesisAtoms(c,merged,ctx)];
}
function evidenceText(c,ctx){
  if(c.claimId==='GLOBAL_STRUCTURE'){
    const labels=ctx.globalStructure.mechanisms.map(x=>x==='FU_YIN'?'Phục Ngâm':'Phản Ngâm');
    return labels.join(' và ')+': nhịp lặp lại hoặc đổi chiều đã được xét khi giới hạn mức phát huy của những dấu hiệu thuận.';
  }
  const support=ctx.claimSupport.find(s=>s.claimId===c.claimId);
  const nums=unique((support?.palaces||[]).map(palaceNumber).filter(Boolean));
  const rows=nums.map(n=>palaceEvidence(ctx.boardFacts?.palaces.find(p=>p.number===n),ctx.analysisLayers?.byPalace?.[n])).filter(Boolean);
  for(const e of ctx.evidence.filter(e=>c.evidenceIds.includes(e.evidenceId)))if(e.relation?.text)rows.push(e.relation.text+'.');
  if(c.claimId==='LUCK_CURRENT'&&ctx.luck){
    rows.unshift('Đại vận '+ctx.luck.ageStart+'–'+ctx.luck.ageEnd+' tại '+PALACE_LABELS[palaceNumber(ctx.luck.palace)]+'.');
    rows.push((ctx.luckPhaseWindows||[]).map(w=>w.ageStart+'–'+w.ageEnd+': '+({NINE_STAR:'Tinh',EIGHT_DOOR:'Môn',TEN_STEM_KE_YING_AND_PALACE_STATE:'Can và trạng thái cung'}[w.layer])).join('; ')+'.');
  }
  if(c.claimId==='ANNUAL_CURRENT'&&ctx.annual)rows.unshift('Can lưu niên '+STEM_LABELS[ctx.annual.annualStem]+' ở '+PALACE_LABELS[palaceNumber(ctx.annual.annualStemPalace)]+' trên Thiên bàn; chi tại '+PALACE_LABELS[palaceNumber(ctx.annual.annualBranchPalace)]+' là căn cứ phụ.');
  if(c.domain==='MARRIAGE')rows.unshift('Đại diện: Nhật can, Hưu Môn, Lục Hợp, Ất–Canh và can ngũ hợp của Nhật can; xét phối hợp, không lấy riêng một ký hiệu.');
  if(c.domain==='FAMILY')rows.unshift('Đại diện gia đình: Niên can; Càn xét phía cha, Khôn xét phía mẹ; can ngũ hợp là căn cứ phụ.');
  if(c.domain==='CHILDREN')rows.unshift('Đại diện con cái: Thời can, xét quan hệ với cung bản thân.');
  if(c.domain==='CAREER')rows.unshift('Tính chất công việc: Tinh và Môn ở cung bản thân. Cơ hội: Khai Môn so với bản thân; Đỗ Môn là căn cứ phụ.');
  if(c.domain==='WEALTH')rows.unshift('Nguồn lực: Sinh Môn so với bản thân; Mậu bổ sung góc vốn, không suy số tiền.');
  return unique(rows).join('\n\n');
}
export function buildMenhNarrativeContract(result,options={}){
  return buildMenhNarrativeFromContext(buildMenhWriterContext(result,options));
}
export function buildMenhNarrativeFromContext(ctx){
  const global=ctx.globalStructure;
  const affected=c=>global.active&&global.affectedDomains.includes(c.domain);
  const claims=ctx.claims.map(c=>({
    id:c.claimId,evidenceIds:c.evidenceIds,ruleIds:c.ruleIds,domain:c.domain,
    certainty:affected(c)?'conditional':'tendency',
    modifierIds:affected(c)?global.evidenceIds:[],
    technicalEvidence:evidenceText(c,ctx)
  }));
  const units=[],groups=new Map();
  for(const c of ctx.claims){
    const section=claimSection(c);if(!section||c.claimId==='FAMILY_PARENT_PAIR_ROLE')continue;
    const row=groups.get(section)||{ids:[],atoms:[],modifiers:[]};
    row.ids.push(c.claimId);row.atoms.push(...roleAtoms(c,ctx));
    if(affected(c)){row.ids.push(global.claimId);row.modifiers.push(...global.evidenceIds);}
    groups.set(section,row);
  }
  const self=groups.get('self'),overviewAtoms=[];
  const selfSynthesis=self?.atoms.find(a=>a.kind==='life_synthesis'&&a.required);
  if(self?.atoms.length&&!selfSynthesis){
    const first=self.atoms.find(a=>a.role==='operatingStyle')||self.atoms[0];
    overviewAtoms.push({...first,id:'overview_character',required:true});
    if(first.caution)overviewAtoms.push(atom('overview_balance','Điểm cần tự quản là '+first.caution.charAt(0).toLowerCase()+first.caution.slice(1).replace(/[.!?]$/,'')+'.',first.claimIds,{required:true}));
  }
  if(global.active)overviewAtoms.push(atom('global_pace',
    global.mechanisms.includes('FU_YIN')&&global.mechanisms.includes('FAN_YIN')
      ?'Nhịp chung không đi thẳng một mạch: các điểm thuận cần thời gian tích lũy, và cách làm thường phải được sửa lại khi hoàn cảnh đổi chiều.'
      :global.mechanisms.includes('FU_YIN')
        ?'Những điểm thuận vẫn có giá trị, nhưng thường phát huy chậm hơn và dễ quay lại vấn đề cũ.'
        :'Hoàn cảnh dễ đổi chiều; nên chừa khoảng linh hoạt để điều chỉnh cách làm.',
    [global.claimId],{required:true,kind:'constraint'}));
  const overviewIds=unique(overviewAtoms.flatMap(a=>a.claimIds));
  if(overviewAtoms.length)units.push(unit('overview',LABELS.overview,overviewIds,overviewAtoms,{
    certainty:global.active?'conditional':'tendency',conclusion:'natal_tendency',modifierIds:global.active?global.evidenceIds:[]
  }));
  for(const [id,row] of groups){
    if(!row.atoms.length)continue;
    if(id==='luck'&&ctx.luck)row.atoms.unshift(atom('luck_period',
      'Giai đoạn '+ctx.luck.ageStart+'–'+ctx.luck.ageEnd+' tuổi là nền để hiểu những ưu tiên hiện tại, không phải lịch sự kiện.',
      ['LUCK_CURRENT'],{required:true,kind:'scope'}));
    if(id==='wealth'){
      const e=ctx.evidence.find(e=>e.evidenceId==='WEALTH_INNER_OUTER');
      const meaning={
        DEVELOPMENT_OR_ENTERPRISE_AWAY_FROM_ORIGIN:'Có thể phát triển qua môi trường hoặc nguồn cơ hội ngoài nền quen thuộc.',
        DEVELOPMENT_AWAY_FROM_ORIGIN:'Mở rộng ra ngoài môi trường quen thuộc là một hướng đáng cân nhắc.',
        LOCAL_OR_ANCESTRAL_BASE_MORE_SUPPORTIVE:'Nền sẵn có ở địa phương hoặc gia đình là một phần hỗ trợ đáng giữ.',
        ANCESTRAL_LOCAL_ASSETS_HARDER_TO_RETAIN:'Việc giữ nguồn lực sẵn có cần được chăm chút, không nên mặc nhiên coi chúng sẽ luôn còn nguyên.'
      }[e?.effectTag];
      if(meaning)row.atoms.push(atom('wealth_environment',meaning,['WEALTH_CORE'],{sourceEvidenceIds:[e.evidenceId]}));
    }
    const scopedIds=unique(row.ids),modifiers=unique(row.modifiers);
    units.push(unit(id,LABELS[id],scopedIds,row.atoms,{
      certainty:modifiers.length?'conditional':'tendency',conclusion:id==='luck'||id==='annual'?'period_tendency':'natal_tendency',modifierIds:modifiers
    }));
  }
  if(ctx.birthTimeMode==='UNKNOWN'){
    const ids=ctx.claims.map(c=>c.claimId);
    if(!units.length)units.push(unit('overview',LABELS.overview,ids,[atom('unknown_overview',
      'Chưa rõ giờ sinh nên chưa đủ cơ sở để viết một bài mệnh riêng cho bạn. Những nhận định thay đổi theo giờ được giữ lại để so sánh, không chọn một giờ thay bạn.',ids,{required:true})],{certainty:'unknown',conclusion:'unresolved'}));
    units.push(unit('birthTimeNote',LABELS.birthTimeNote,[],[atom('birth_time_uncertain',
      'Không nhớ giờ sinh: chỉ giữ những điểm ổn định qua các giờ. Việc lọc giờ theo chuyện đã trải qua giúp thu hẹp hướng nghiên cứu, chưa xác nhận giờ sinh thật.',[],{required:true,kind:'scope'})],{certainty:'unknown',conclusion:'unresolved'}));
  }
  const contract={
    version:NARRATIVE_VERSION,kind:'menh',identity:{specVersion:ctx.specVersion,profileId:ctx.profileId,birthTimeMode:ctx.birthTimeMode},
    question:'Giải thích mệnh theo các chủ đề đời sống.',claims,units,userFacts:[],
    primaryConclusion:{conclusion:'natal_tendency',certainty:global.active?'conditional':'tendency'},
    globalModifier:{active:global.active,mechanisms:global.mechanisms,effects:{
      pace:global.mechanisms.includes('FU_YIN')?'slower_or_repetitive':'variable',
      realization:global.active?'requires_adjustment':'subject_to_local_conditions',
      local_positive_signal_cap:global.active
    },appliedTo:units.filter(u=>u.modifierIds?.length).map(u=>u.id),evidenceIds:global.evidenceIds},
    allowedImplications:['Tổng hợp các ý được cấp thành nhận xét đời sống; ví dụ phải rõ là minh họa.','Điểm mạnh và điểm cần tự quản có thể cùng tồn tại.'],
    forbiddenImplications:['Không đổi xu hướng thành sự kiện đã xảy ra.','Không dự báo bệnh, tử vong, số con, số lần kết hôn, xác suất hoặc số tiền.','Không đoán giờ sinh.'],
    note:GENERAL_NOTE
  };
  validateNarrativeContract(contract);return freezeNarrative(contract);
}
