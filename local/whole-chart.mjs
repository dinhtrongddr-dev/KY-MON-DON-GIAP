import {generateText} from './provider-client.mjs';
import {parseStructuredText} from './codex-client.mjs';
import {aiRouteOf,attachAiRoute} from './ai-client.mjs';
import {NARRATIVE_VERSION,GENERAL_NOTE,atom,unit,validateNarrativeContract,surfacePayload} from '../dist/qimen/ai/narrativePrimitives.mjs';
import {hydrateSurfaceReading,validateSurfaceDraft,validateSurfaceReading} from '../dist/qimen/ai/surfaceReading.mjs';
import {METHOD_AWARE_READING_INSTRUCTIONS,GLOBAL_STRUCTURE_INSTRUCTIONS,MODE_SYNTHESIS_INSTRUCTIONS} from '../dist/qimen/ai/methodPrompt.mjs';

export const REASONING_MODES=Object.freeze(['standard','whole_chart']);
export const WHOLE_CHART_PACKET_VERSION='KM-WHOLE-CHART-3';

export function resolveReasoningMode(value){
  if(value===undefined)return 'standard';
  if(!REASONING_MODES.includes(value))throw new Error('Chế độ luận không hợp lệ.');
  return value;
}

const nameOf=value=>value?.vi||value?.name||value?.label||value||null;
const copy=value=>{
  if(value===undefined)return null;
  try{return JSON.parse(JSON.stringify(value));}catch{return null;}
};
const compactRole=role=>({
  id:role.id,label:role.label,actorId:role.actorId,role:role.role,semanticRole:role.semanticRole,
  palace:role.palace,stem:role.stem,status:role.status,basis:role.basis,source:role.source,
  evidenceId:role.evidenceId,evidenceIds:role.evidenceIds,confidenceLevel:role.confidenceLevel,
  limitations:role.limitations,selectionRule:role.selectionRule,provenance:role.provenance
});
const compactPalace=(p,layer,directionLayer)=>({
  palace:p.number,
  trigram:p.trigram?.vi||p.vi||null,
  han:p.han||null,
  direction:p.direction||null,
  element:p.element||null,
  branches:p.branches||[],
  image:p.image||null,
  deity:nameOf(p.spirit||p.deity),
  star:nameOf(p.star),
  door:nameOf(p.door),
  starId:p.star?.id||null,
  doorId:p.door?.id||null,
  heavenStems:(p.heavenStems||[]).map(nameOf).filter(Boolean),
  earthStem:nameOf(p.earthStem),
  void:Boolean(p.voided??p.void),
  horse:Boolean(p.horse),
  directionMarkers:copy(directionLayer||null),
  carriesQin:Boolean(p.carriesQin),
  dutyStar:Boolean(p.isDutyStar),
  dutyDoor:Boolean(p.isDutyDoor),
  analysis:layer?{
    conditions:copy(layer.conditions),
    strength:copy(layer.strength),
    starDoor:copy(layer.starDoor),
    doorPalace:copy(layer.doorPalace),
    stemPairs:copy(layer.stemPairs)
  }:null
});
const pick=(source,keys)=>Object.fromEntries(keys.filter(key=>source?.[key]!==undefined).map(key=>[key,source[key]]));
export function buildSalienceIndex({chartMeta,palaces,roles,globalStructure}){
  const roleRows=(roles?.deterministic||[]).filter(r=>Number.isInteger(r.palace)).map(r=>({id:r.id,label:r.label,role:r.role,semanticRole:r.semanticRole,palace:r.palace,stem:r.stem,status:r.status}));
  const rolePalaces=new Map();
  for(const row of roleRows){
    const list=rolePalaces.get(row.palace)||[];
    list.push(row.label||row.role||row.id);
    rolePalaces.set(row.palace,list);
  }
  const rows=palaces.map(p=>{
    const roles=rolePalaces.get(p.palace)||[];
    const directionMarkerCount=Object.values(p.directionMarkers||{}).reduce((sum,value)=>sum+(Array.isArray(value)?value.length:0),0);
    const salienceFlags=[
      roles.length?'role':null,
      p.void?'void':null,
      p.horse?'horse':null,
      p.dutyStar?'duty_star':null,
      p.dutyDoor?'duty_door':null,
      ['Sinh Môn','Khai Môn','Thương Môn','Kinh Môn'].includes(p.door)?'door_focus':null,
      ['Lục Hợp','Thái Âm','Cửu Thiên'].includes(p.deity)?'deity_focus':null,
      directionMarkerCount?'direction_marker':null
    ].filter(Boolean);
    return {
      palace:p.palace,trigram:p.trigram,direction:p.direction,deity:p.deity,star:p.star,door:p.door,
      starId:p.starId,doorId:p.doorId,heavenStems:p.heavenStems,earthStem:p.earthStem,
      void:p.void,horse:p.horse,directionMarkers:copy(p.directionMarkers),directionMarkerCount:Object.values(p.directionMarkers||{}).reduce((sum,value)=>sum+(Array.isArray(value)?value.length:0),0),carriesQin:p.carriesQin,dutyStar:p.dutyStar,dutyDoor:p.dutyDoor,
      roles,salienceFlags,
      strength:{star:p.analysis?.strength?.star?.level||null,door:p.analysis?.strength?.door?.level||null,palace:p.analysis?.strength?.palace?.level||null},
      relations:{starDoor:p.analysis?.starDoor?.text||null,doorPalace:p.analysis?.doorPalace?.plainMeaning||null},
      conditions:copy(p.analysis?.conditions||null),
      stemPairs:copy(p.analysis?.stemPairs||null)
    };
  });
  const salientPalaces=rows.filter(row=>row.salienceFlags.length).sort((a,b)=>b.salienceFlags.length-a.salienceFlags.length);
  return {
    kind:'FACT_ONLY_SALIENCE_INDEX',
    purpose:'Sắp xếp các dữ kiện đã tính theo mức liên quan; không tạo kết luận.',
    global:{
      fuYin:Boolean(chartMeta?.fuYin),fanYin:Boolean(chartMeta?.fanYin),
      patterns:copy(globalStructure?.patterns||{}),
      voidBranches:copy(globalStructure?.voidBranches||null),
      horseBranch:copy(globalStructure?.horseBranch||null),
      duty:copy(globalStructure?.duty||null)
    },
    roles:roleRows,
    salientPalaces,
    palaces:rows,
    relationships:copy((roles?.relationships||[]).slice(0,24))
  };
}

export function buildCanonicalChartPacket(prepared){
  if(!prepared?.chart||!prepared?.context)throw new Error('Không có dữ liệu bàn đã tính để luận toàn bàn.');
  const {chart,board,analysis,context}=prepared;
  const allInOne=context.allInOne||{};
  const boardPalaces=Array.isArray(board?.palaces)&&board.palaces.length?board.palaces:chart.palaces||[];
  const chartPalaces=Array.isArray(chart.palaces)?chart.palaces:[];
  const layers=analysis?.palaces||[];
  const layerByPalace=new Map(layers.map(p=>[p.number,p]));
  const directionByPalace=analysis?.directions?.byPalace||{};
  const palaces=boardPalaces.map(p=>{
    const source=chartPalaces.find(x=>x.number===p.number)||p;
    return compactPalace(source,layerByPalace.get(p.number),directionByPalace[p.number]||null);
  });
  return {
    schemaVersion:WHOLE_CHART_PACKET_VERSION,
    authority:'Deterministic Engine đã tính; packet chỉ là bản chiếu dữ liệu, không phải yêu cầu model tự lập lại bàn.',
    question:{
      text:context.question,
      topic:context.selectedTopic,
      domain:allInOne.questionContext?.domain||null,
      domainLabel:allInOne.questionContext?.domainLabel||null,
      mode:allInOne.classification?.mode||allInOne.questionContext?.mode||null,
      intent:allInOne.questionContext?.intent||null,
      desiredOutcome:allInOne.questionContext?.desiredOutcome||null,
      outcomeTarget:copy(allInOne.questionContext?.outcomeTarget),
      timeHorizon:copy(allInOne.questionContext?.timeHorizon),
      userStatements:copy(allInOne.questionContext?.userStatements||[])
    },
    // Deterministic timing metadata. The model may interpret it but may not
    // invent dates or turn an action window into a guaranteed outcome.
    timingFacts:copy(allInOne.timingFacts),
    // Direction markers are deterministic facts for the direction mode; the
    // writer may interpret them but must not turn them into a rank or guarantee.
    directionFacts:copy(analysis?.directions?{
      kind:'FACT_ONLY_DIRECTION_INDEX',
      version:analysis.directions.version||null,
      profile:analysis.directions.profile||null,
      byPalace:analysis.directions.byPalace||{},
      coverage:analysis.directions.coverage||null,
      provenance:analysis.directions.provenance||null,
      limitations:analysis.directions.limitations||[]
    }:null),
    chartMeta:{
      schemaVersion:board?.schemaVersion||null,
      engineVersion:chart.engineVersion||board?.engineVersion||null,
      method:chart.method,
      methodLabel:chart.methodLabel,
      input:copy(chart.input||board?.input),
      utcMs:chart.utcMs,
      pillars:copy(chart.pillars),
      term:copy(chart.term),
      nextTerm:copy(chart.nextTerm),
      dun:copy(chart.dun),
      xun:copy(chart.xun),
      duty:copy(chart.duty),
      fuYin:Boolean(chart.patterns?.starFuYin||chart.patterns?.doorFuYin||board?.fuYin),
      fanYin:Boolean(chart.patterns?.starFanYin||chart.patterns?.doorFanYin||board?.fanYin)
    },
    globalStructure:{
      patterns:copy(chart.patterns||board?.patterns),
      boardPatterns:copy(chart.patterns||board?.patterns),
      analysisPatterns:copy(analysis?.patterns),
      contradictions:copy(analysis?.contradictions||[]),
      voidBranches:copy(chart.voidBranches||board?.voidBranches),
      horseBranch:copy(chart.horseBranch||board?.horseBranch),
      xun:copy(chart.xun),
      duty:copy(chart.duty),
      coverage:copy(analysis?.coverage||null)
    },
    roles:{
      deterministic:copy((analysis?.roles||[]).map(compactRole)),
      relationships:copy(allInOne.graph?.relations||[])
    },
    palaces,
    salienceIndex:buildSalienceIndex({
      chartMeta:{fuYin:Boolean(chart.patterns?.starFuYin||chart.patterns?.doorFuYin||board?.fuYin),fanYin:Boolean(chart.patterns?.starFanYin||chart.patterns?.doorFanYin||board?.fanYin)},
      palaces,
      roles:{deterministic:analysis?.roles||[],relationships:allInOne.graph?.relations||[]},
      globalStructure:{patterns:chart.patterns||board?.patterns,voidBranches:chart.voidBranches||board?.voidBranches,horseBranch:chart.horseBranch||board?.horseBranch,duty:chart.duty}
    }),
    deterministic:{
      packetNote:'Bản chiếu chỉ gồm dữ kiện và quan hệ đã tính; Whole Chart tự diễn giải và tự tổng hợp.',
      analysis:{
        nianming:copy(analysis?.nianming),
        patterns:copy(analysis?.patterns),
        coverage:copy(analysis?.coverage)
      }
    },
    safeguards:{
      noRecalculation:true,
      noBoardMutation:true,
      noInventedActorsDatesMoneyEvents:true,
      noSemanticPrewrite:true,
      certaintyIsConditional:true,
      useOnlyQuestionAndPacketFacts:true
    }
  };
}

function buildDirectWholeChartContract(prepared,packet){
  const context=prepared.context||{},c=context.allInOne||{},classification=c.classification||{};
  const questionContext=c.questionContext||{},mode=classification.mode||packet.question.mode||'strategy';
  const questionType=questionContext.questionType||classification.questionType||mode;
  const focus=(packet.salienceIndex?.salientPalaces||[]).slice(0,6);
  const fallback=(packet.salienceIndex?.palaces||[]).filter(row=>row.palace!==5).slice(0,6);
  const focusRows=focus.length?focus:fallback;
  const roleRows=packet.salienceIndex?.roles||[];
  const timingFacts=packet.timingFacts||{};
  const hasTimingEvidence=Boolean(
    timingFacts.candidates?.length||
    timingFacts.signals?.length||
    (timingFacts.pace?.tendency&&timingFacts.pace.tendency!=='unknown')
  );
  const modeLabels={
    strategy:['Đòn bẩy chính và nút thắt','Chuỗi hành động và nhịp lặp','Nguồn lực, ứng thời và điểm dừng'],
    business:['Giai đoạn giao dịch và cổng chốt','Báo giá, hợp đồng và tiền về','Năng lực thực hiện và mở rộng'],
    negotiation:['Thế và mục tiêu trao đổi','Nhượng bộ có điều kiện','Điểm dừng và thời điểm chốt']
  }[mode]||['Đòn bẩy chính và cách tiếp cận','Cách triển khai và nhịp lặp','Nguồn lực và điều kiện mở rộng'];
  const singleActionLabel=mode==='prediction'?'Diễn biến và dấu hiệu xác nhận':mode==='direction'?'Cách dùng phương hướng và blocker':mode==='timing'?'Lựa chọn và điều kiện chọn':'Bước nên làm tiếp theo';
  const timingLabel=mode==='strategy'?'Ứng thời hành động và dấu hiệu phản hồi':mode==='business'?'Nhịp giao dịch và thời điểm tiền về':mode==='negotiation'?'Thời điểm trao đổi và chốt':'Nhịp thời gian và dấu hiệu theo dõi';
  const palaceClaimIds=row=>row.map(item=>`palace_${item.palace}`);
  const questionClaim={
    id:'question_context',evidenceIds:['question_context'],ruleIds:['deterministic_question'],
    actorIds:[],status:'observed',certainty:'conditional',
    technicalEvidence:JSON.stringify(packet.question)
  };
  const globalClaim={
    id:'global_structure',evidenceIds:['global_structure'],ruleIds:['deterministic_global'],
    actorIds:[],status:'observed',certainty:'conditional',
    technicalEvidence:JSON.stringify({chartMeta:packet.chartMeta,globalStructure:packet.globalStructure,timingFacts:packet.timingFacts,directionFacts:packet.directionFacts,salience:packet.salienceIndex?.global||null})
  };
  const palaceClaims=(packet.salienceIndex?.palaces||[]).map(row=>({
    id:`palace_${row.palace}`,evidenceIds:[`palace_${row.palace}`],ruleIds:['deterministic_palace'],
    actorIds:roleRows.filter(role=>role.palace===row.palace).map(role=>role.id),
    status:'observed',certainty:'conditional',technicalEvidence:JSON.stringify(row)
  }));
  const claims=[questionClaim,globalClaim,...palaceClaims];
  const focusIds=palaceClaimIds(focusRows);
  const baseIds=['question_context','global_structure',...focusIds];
  const roleIds=roleRows.filter(row=>Number.isInteger(row.palace)).map(row=>`palace_${row.palace}`);
  const uniqueIds=ids=>[...new Set(ids)].filter(id=>claims.some(claim=>claim.id===id));
  const makeUnit=(id,label,ids)=>unit(id,label,uniqueIds(ids),[
    atom(`${id}_direct`,'Tự tổng hợp từ các dữ kiện kỹ thuật trong packet theo đúng câu hỏi.',uniqueIds(ids),{required:true})
  ],{conclusion:'conditional',certainty:'conditional'});
  const units=[
    makeUnit('answer','Kết luận chính',baseIds),
    makeUnit('situation','Điều đang tác động',focusIds.length?focusIds:baseIds),
    makeUnit('bottleneck','Điểm cần chuẩn bị trước',roleIds.length?roleIds.slice(0,6):baseIds)
  ];
  if(['strategy','business','negotiation'].includes(mode)){
    units.push(
      makeUnit('action_1',modeLabels[0],baseIds),
      makeUnit('action_2',modeLabels[1],focusIds.length?focusIds:baseIds),
      makeUnit('action_3',modeLabels[2],roleIds.length?roleIds.slice(0,6):baseIds)
    );
  }else{
    units.push(makeUnit('action_1',singleActionLabel,baseIds));
  }
  if(mode==='timing'||hasTimingEvidence||/\b(?:ngay|tuan|thang|30 ngay|thoi diem|khi nao)\b/i.test(String(questionContext.question||context.question||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase())){
    units.push(makeUnit('timing',timingLabel,baseIds));
  }
  const contract={
    version:NARRATIVE_VERSION,kind:'question',
    identity:{topic_id:packet.question.topic||c.resolvedTopic||'general',mode,questionType},
    question:context.question,claims,units,facets:[],showDevelopment:false,
    primaryConclusion:{conclusion:'conditional',certainty:'conditional',stage:'contextual',meaning:'',claimIds:uniqueIds(baseIds)},
    userFacts:questionContext.userStatements||[],
    allowedImplications:['Tự giải nghĩa và nối nhiều dữ kiện kỹ thuật trong cùng bàn thành nhận định có điều kiện.','Khuyến nghị thực hành được phép suy ra từ tổ hợp facts nhưng không phải sự kiện đã xảy ra.'],
    forbiddenImplications:['Không bịa actor cụ thể, ngày cụ thể, tiền cụ thể, hợp đồng đã ký hoặc certainty vượt packet.'],
    note:GENERAL_NOTE
  };
  validateNarrativeContract(contract);
  return contract;
}

const INSTRUCTIONS=`Bạn là người luận Kỳ Môn đang đọc một bàn đã được Deterministic Engine tính sẵn. Đây là lượt suy luận trực tiếp duy nhất: tự đọc facts, tự interpretation, tự tổng hợp và tự viết; không có semantic_frame, action chain hay kết luận soạn sẵn để chờ điền. Hãy viết một bài tiếng Việt tự nhiên, sắc và hữu dụng cho đúng câu hỏi này. Packet là dữ liệu gốc; salienceIndex là chỉ mục sắp xếp facts đã tính, không chứa semantic_frame hay lời khuyên. Hãy tự interpretation trực tiếp từ packet và salienceIndex.

QUYỀN HẠN DỮ LIỆU:
- Packet là nguồn sự thật duy nhất. Không tự tính lại, sửa hoặc đổi vị trí cung, Môn, Tinh, Thần, Can, Dụng Thần, vai trò, quan hệ, ứng kỳ hay verdict điều kiện.
- Có thể nối nhiều cung và nhiều lớp phân tích. Không dịch từng ký hiệu thành danh sách từ khóa; hãy nói cơ chế đời thường mà tổ hợp đó tạo ra.
- Chỉ dùng tên người, công ty, tiền, ngày, mốc và sự kiện mà câu hỏi hoặc packet đã có. Không bịa khách hàng cụ thể, đối tác cụ thể, người duyệt cụ thể, động cơ bí mật, hợp đồng đã ký, xác suất hoặc ngày chắc chắn.
- “Đầu mối”, “doanh nghiệp quan tâm”, “kênh giới thiệu”, “đối tác tiềm năng” có thể dùng như khái niệm chiến lược chung khi được suy ra từ cơ chế; không biến chúng thành một actor cụ thể hay một sự kiện đã xảy ra.
- Phân biệt cơ hội → tiếp cận → phản hồi → phạm vi/báo giá → thỏa thuận → thực hiện → tiền về. Không nhảy cóc từ dấu hiệu sang kết quả.
- Không dùng từ nội bộ như deterministic, packet, claim, evidence, pipeline, planner, validator, actor, schema, model hoặc mã rule trong bài.
- Chỉ nêu thuật ngữ Kỳ Môn khi nó làm rõ cơ chế; nếu nêu, luôn nối ngay với ý nghĩa thực tế. Bài phải đọc như tư vấn có căn cứ, không như bản dịch máy.

${METHOD_AWARE_READING_INSTRUCTIONS}\n\n${GLOBAL_STRUCTURE_INSTRUCTIONS}\n\n${MODE_SYNTHESIS_INSTRUCTIONS}\n\nWHOLE-CHART DEPTH REQUIREMENT:
Không dừng ở lời khuyên chung mà một bàn khác cũng có thể nhận được. Với mỗi khuyến nghị chính, hãy tự xác định một hoặc hai cung/tổ hợp trong packet/salienceIndex làm nó phù hợp đặc biệt với bàn này. Không cần phơi toàn bộ kỹ thuật trong bài, nhưng kết luận phải sinh ra từ dữ liệu bàn này.
Hãy kiểm tra các tổ hợp role + palace, deity + star + door + stems, self/affair relationship, chief structures, movement/void/repetition, Fu Yin/Fan Yin và các cung hỗ trợ hoặc xung đột.

Nếu câu hỏi là chiến lược hoặc kinh doanh, bắt buộc suy ra đủ bảy lớp:
1. PRIMARY LEVER — đòn bẩy lớn nhất là gì và vì sao chính bàn này chỉ vào nó.
2. PRIMARY BOTTLENECK — điểm sẽ chặn tăng trưởng dù cơ hội có tồn tại.
3. EXECUTION MECHANISM — thứ tự bước: mở cửa/tiếp cận → phản hồi cần đo → điều kiện chuyển bước → điểm dừng hoặc mở rộng.
4. REPEATABLE PATTERN — điều cần lặp lại, follow-up, quay lại lead cũ hoặc nhân bản; nếu có Phục Ngâm phải nói rõ nhịp lặp này.
5. RESOURCE REQUIREMENT — năng lực phải có trước khi mở rộng: quy trình, tiêu chuẩn, người, ca, đào tạo, kiểm tra chất lượng, chi phí hoặc dòng tiền tùy dữ liệu.
6. FAILURE MODE — cách chiến lược dễ hỏng, nhất là mở rộng quá rộng hoặc cam kết trước khi tháo nút thắt.
7. PRACTICAL TARGET DECOMPOSITION — nếu câu hỏi có con số mục tiêu, bắt buộc đưa ít nhất một phép chia minh họa quản trị bằng số trực tiếp từ con số người dùng nêu (ví dụ 20 người có thể chia thành 4 doanh nghiệp × 5 người hoặc 5 doanh nghiệp × 4 người). Luôn ghi rõ đây là cách lập kế hoạch minh họa, không phải dự báo từ bàn.

Trong cùng một câu trả lời, ưu tiên tổng hợp chiến lược có cấu trúc hơn là lặp “cần kiểm chứng”. Không thêm các câu kiểu “chưa xác định người ra quyết định”, “không thể kết luận thỏa thuận cụ thể” hoặc “vẫn cần xác minh thực tế” nếu câu đó không trực tiếp giúp trả lời việc người dùng hỏi. Thay vào đó, nêu bước kiểm chứng cụ thể và dấu hiệu hoàn tất.

CONTEXTUAL INFERENCE POLICY:
- Cho phép suy luận thực hành có điều kiện từ tổ hợp và bối cảnh: Lục Hợp + kinh doanh có thể dẫn tới referral/partnership/network; Khai Môn có thể dẫn tới proposal/cuộc gặp/khảo sát/pilot; Dịch Mã hoặc Cửu Thiên có thể dẫn tới chủ động đi thị trường; Thương Môn có thể dẫn tới kiểm soát nhân lực/chi phí; Phục Ngâm có thể dẫn tới follow-up và nhân bản quy trình.
- Đây là inference chiến lược, không phải fact. Chỉ chặn khi bài bịa actor cụ thể, ngày cụ thể, tiền cụ thể, hợp đồng đã xảy ra hoặc certainty vượt packet.
- Tự kiểm tra chart specificity: nếu đổi bàn khác mà phần lớn bài vẫn dùng được, bài còn quá generic; hãy thay bằng insight gắn với các tổ hợp facts nổi bật của packet.

KỶ LUẬT ĐẦU RA:
- Viết ý nghĩa trước, hành động sau; mỗi mục phải có ít nhất một cơ chế và một điều kiện chuyển/điểm dừng.
- Có thể dùng gạch đầu dòng trong text nếu giúp người dùng hành động, nhưng không viết markdown fence.
- Chỉ trả JSON đúng dạng {"sections":[{"id":"...","text":"..."}]} với đúng các id trong surface.units, không thêm trường.`;

const REPAIR_INSTRUCTIONS=`Bản JSON trước chưa đạt kiểm tra dữ kiện. Hãy sửa đúng các lỗi được nêu, giữ nguyên các id section, không thêm section, không đổi kết luận/certainty/điều kiện và không thêm dữ kiện mới. Viết lại tự nhiên hơn nếu cần, bỏ tên vai hoặc mốc không có trong packet. Chỉ trả JSON {"sections":[{"id":"...","text":"..."}]}.`;

function parseDraft(value){
  return parseStructuredText(value?.text??value);
}
function validationMessage(error){
  const rows=Array.isArray(error?.violations)?error.violations:[];
  return rows.slice(0,12).map(v=>({code:v.code||'VALIDATION',unitId:v.unitId||'',reason:v.reason||error.message||'Không đạt kiểm tra.'}));
}

const modelPacketFromCanonical=packet=>{
  const palaces=(packet.palaces||[]).map(p=>({...p,analysis:p.analysis?{
    strength:{star:p.analysis.strength?.star?.level||null,door:p.analysis.strength?.door?.level||null,palace:p.analysis.strength?.palace?.level||null},
    starDoor:p.analysis.starDoor?{kind:p.analysis.starDoor.kind,text:p.analysis.starDoor.text}:null,
    doorPalace:p.analysis.doorPalace?{code:p.analysis.doorPalace.code,classicalLabel:p.analysis.doorPalace.classicalLabel,plainMeaning:p.analysis.doorPalace.plainMeaning}:null,
    conditions:p.analysis.conditions?pick(p.analysis.conditions,['doorPressure','punishment','wonderTombs','stemTombs']):null
  }:null}));
  return {...packet,palaces,deterministic:{
    packetNote:packet.deterministic.packetNote,
    analysis:{patterns:packet.deterministic.analysis?.patterns,coverage:packet.deterministic.analysis?.coverage}
  }};
};

const normalizeFactText=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
function minimalFactAudit(reading,packet){
  const text=Object.values(reading.sections||{}).flatMap(section=>(section.paragraphs||[]).map(paragraph=>paragraph.meaning||'')).join(' ');
  const source=normalizeFactText(packet.question?.text);
  const input=packet.chartMeta?.input||{};
  const allowedDates=[
    input.year&&input.month&&input.day?String(input.day).padStart(2,'0')+'/'+String(input.month).padStart(2,'0')+'/'+input.year:'',
    input.year&&input.month&&input.day?input.year+'-'+String(input.month).padStart(2,'0')+'-'+String(input.day).padStart(2,'0'):'',
    input.month&&input.day?String(input.day).padStart(2,'0')+'/'+String(input.month).padStart(2,'0'):''
  ].filter(Boolean).map(normalizeFactText);
  const violations=[];
  for(const match of normalizeFactText(text).matchAll(/\b(?:\d+(?:[.,]\d+)*|mot|hai|ba|bon|nam|sau|bay|tam|chin|muoi)\s*(?:trieu|ty|vnd|usd|dong|do la)\b/g)){
    if(!source.includes(match[0]))violations.push({code:'INVENTED_MONEY',unitId:'',reason:'Số tiền cụ thể ngoài câu hỏi: '+match[0]});
  }
  for(const match of normalizeFactText(text).matchAll(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b|\b\d{4}-\d{2}-\d{2}\b/g)){
    if(!source.includes(match[0])&&!allowedDates.includes(match[0]))violations.push({code:'INVENTED_TIME',unitId:'',reason:'Mốc ngày cụ thể ngoài câu hỏi hoặc input bàn: '+match[0]});
  }
  if(violations.length){const error=new Error('Whole Chart fact audit failed.');error.violations=violations;throw error;}
  return true;
}

export async function interpretWholeChart(prepared,{signal,runner=generateText}={}){
  signal?.throwIfAborted();
  const packet=buildCanonicalChartPacket(prepared);
  const contract=buildDirectWholeChartContract(prepared,packet);
  const surface=surfacePayload(contract);
  const modelSurface={...surface,units:surface.units.map(({technicalGrounding,...unit})=>({
    ...unit,
    claimIds:contract.units.find(candidate=>candidate.id===unit.id)?.claimIds||[]
  }))};
  const modelPacket=modelPacketFromCanonical(packet);
  const request={packet:modelPacket,surface:modelSurface,sections:modelSurface.units.map(u=>({id:u.id,label:u.label}))};
  const attempt=generated=>{
    signal?.throwIfAborted();
    const draft=parseDraft(generated);
    validateSurfaceDraft(draft,contract);
    const reading=hydrateSurfaceReading(draft,contract);
    validateSurfaceReading(reading,contract);
    minimalFactAudit(reading,packet);
    return {reading,route:aiRouteOf(generated)};
  };
  const generated=await runner(INSTRUCTIONS,request,{signal});
  try{
    const result=attempt(generated);
    return attachAiRoute(result.reading,result.route);
  }catch(firstError){
    signal?.throwIfAborted();
    const repaired=await runner(REPAIR_INSTRUCTIONS,{
      packet:modelPacket,surface:modelSurface,
      draft:typeof generated?.text==='string'?generated.text.slice(0,24000):generated,
      violations:validationMessage(firstError)
    },{signal});
    const result=attempt(repaired);
    return attachAiRoute(result.reading,aiRouteOf(repaired)||aiRouteOf(generated));
  }
}
