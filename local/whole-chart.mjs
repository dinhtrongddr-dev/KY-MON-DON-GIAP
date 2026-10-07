import {generateText} from './provider-client.mjs';
import {parseStructuredText} from './codex-client.mjs';
import {aiRouteOf,attachAiRoute} from './ai-client.mjs';
import {buildQuestionNarrativeContract} from '../dist/qimen/ai/narrativeContract.mjs';
import {surfacePayload} from '../dist/qimen/ai/narrativePrimitives.mjs';
import {hydrateSurfaceReading,validateSurfaceDraft} from '../dist/qimen/ai/surfaceReading.mjs';
import {validateReading} from './reading.mjs';

export const REASONING_MODES=Object.freeze(['standard','whole_chart']);
export const WHOLE_CHART_PACKET_VERSION='KM-WHOLE-CHART-2';

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
const compactPalace=(p,layer)=>({
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
const compactReasoning=reasoning=>({
  schemaVersion:reasoning.schemaVersion,
  questionContext:copy(reasoning.questionContext),
  mode:reasoning.mode,
  usefulGodProfile:copy(reasoning.usefulGodProfile),
  structureProfile:copy(reasoning.structureProfile),
  keyingProfile:copy(reasoning.keyingProfile),
  formationProfile:copy(reasoning.formationProfile),
  directionProfile:copy(reasoning.directionProfile),
  nianmingProfile:copy(reasoning.nianmingProfile),
  primaryJudgment:copy(reasoning.primaryJudgment),
  timing:copy(reasoning.timing),
  claims:copy((reasoning.claims||[]).map(cl=>pick(cl,['id','bundleId','actorIds','evidenceIds','mechanism','semanticMeaning','realWorldManifestation','implication','limitations','priority','status']))),
  contextualInterpretation:copy((reasoning.contextualInterpretation||[]).map(row=>pick(row,['claimId','mechanism','semanticCore','symbolRole','coreMeaning','contextMeaning','manifestations','supportingFactors','limitingFactors','contextualSense','certaintyBoundary','writerGuidance']))),
  conflicts:copy(reasoning.conflicts),
  supports:copy(reasoning.supports),
  blockers:copy(reasoning.blockers),
  likelyScenario:copy(pick(reasoning.likelyScenario,['objective','agency','modeDecision','primaryJudgment','sequence','mainConflict','stages','turningPoint','alternative','timing'])),
  recommendations:copy(reasoning.recommendations),
  coverage:copy(reasoning.coverage)
});

export function buildCanonicalChartPacket(prepared){
  if(!prepared?.chart||!prepared?.context)throw new Error('Không có dữ liệu bàn đã tính để luận toàn bàn.');
  const {chart,board,analysis,context,facts}=prepared;
  const allInOne=context.allInOne||{};
  const reasoning=allInOne.reasoning||{};
  const boardPalaces=Array.isArray(board?.palaces)&&board.palaces.length?board.palaces:chart.palaces||[];
  const chartPalaces=Array.isArray(chart.palaces)?chart.palaces:[];
  const layers=analysis?.palaces||[];
  const layerByPalace=new Map(layers.map(p=>[p.number,p]));
  const palaces=boardPalaces.map(p=>{
    const source=chartPalaces.find(x=>x.number===p.number)||p;
    return compactPalace(source,layerByPalace.get(p.number));
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
      contradictions:copy(analysis?.contradictions||reasoning.conflicts),
      voidBranches:copy(chart.voidBranches||board?.voidBranches),
      horseBranch:copy(chart.horseBranch||board?.horseBranch),
      xun:copy(chart.xun),
      duty:copy(chart.duty),
      coverage:copy(analysis?.coverage||reasoning.coverage)
    },
    roles:{
      deterministic:copy((analysis?.roles||[]).map(compactRole)),
      relationships:copy(reasoning.relationships||allInOne.graph?.relations||[])
    },
    palaces,
    deterministic:{
      packetNote:'Bản chiếu board nằm ở chartMeta và palaces; dữ kiện diễn giải nằm trong reasoning và surface plan.',
      plan:copy(allInOne.plan||null),
      reasoning:compactReasoning(reasoning),
      analysis:{
        yongshenProfile:copy(analysis?.yongshenProfile),
        nianming:copy(analysis?.nianming),
        patterns:copy(analysis?.patterns),
        coverage:copy(analysis?.coverage),
        note:'Chi tiết cấu trúc, Môn×Can, cách cục và phương vị nằm trong palaces.analysis, reasoning.claims/contextualInterpretation và surface plan.'
      }
    },
    safeguards:{
      noRecalculation:true,
      noBoardMutation:true,
      noInventedActorsDatesMoneyEvents:true,
      certaintyIsConditional:true,
      useOnlyQuestionAndPacketFacts:true
    }
  };
}

const INSTRUCTIONS=`Bạn là người luận Kỳ Môn đang đọc một bàn đã được Deterministic Engine tính sẵn. Hãy tự tổng hợp toàn bộ bàn theo câu hỏi thực tế, liên hệ các cung và các vai trò có trong packet, rồi viết một bài tiếng Việt tự nhiên, hữu dụng và có chiều sâu.

QUYỀN HẠN DỮ LIỆU:
- Packet là nguồn sự thật duy nhất. Không tự tính lại, sửa hoặc đổi vị trí cung, Môn, Tinh, Thần, Can, Dụng Thần, vai trò, quan hệ, ứng kỳ hay kết luận điều kiện.
- Có thể nối nhiều cung và nhiều lớp phân tích để giải thích cơ chế, diễn biến, điểm mở, điểm cản và cách hành động.
- Chỉ dùng tên người, công ty, tiền, ngày, mốc và sự kiện mà câu hỏi hoặc packet đã có. Không bịa khách hàng, đối tác, người duyệt, động cơ bí mật hay hợp đồng đã xảy ra.
- Không gọi một vai là “khách hàng”, “đối tác”, “người duyệt” nếu câu hỏi hoặc packet không xác định vai đó; khi chưa xác định, dùng cách nói trung tính như “bên liên quan”, “đầu mối”, “phía cần phản hồi”.
- Phân biệt cơ hội, đầu mối, phản hồi, thỏa thuận, thực hiện và kết quả đã xác nhận. Không biến dấu hiệu hoặc cửa sổ kiểm chứng thành sự kiện chắc chắn.
- Không dùng từ nội bộ như deterministic, packet, claim, evidence, pipeline, planner, validator, actor, schema, model hoặc mã rule trong bài.
- Trả lời ý nghĩa trước; chỉ nêu thuật ngữ Kỳ Môn khi thật sự giúp người đọc hiểu, không dịch từng biểu tượng thành danh sách từ khóa.
- Khuyến nghị phải gắn với cơ chế trong bàn và nói rõ điều kiện kiểm chứng. Không chẩn đoán y tế, kết luận tử vong, số con, số lần kết hôn hoặc khẳng định tất định.
- Chỉ trả JSON đúng dạng {"sections":[{"id":"...","text":"..."}]} với đúng các id trong surface.units, không markdown, không lời dẫn, không thêm trường.`;

const REPAIR_INSTRUCTIONS=`Bản JSON trước chưa đạt kiểm tra dữ kiện. Hãy sửa đúng các lỗi được nêu, giữ nguyên các id section, không thêm section, không đổi kết luận/certainty/điều kiện và không thêm dữ kiện mới. Viết lại tự nhiên hơn nếu cần, bỏ tên vai hoặc mốc không có trong packet. Chỉ trả JSON {"sections":[{"id":"...","text":"..."}]}.`;

function parseDraft(value){
  return parseStructuredText(value?.text??value);
}
function validationMessage(error){
  const rows=Array.isArray(error?.violations)?error.violations:[];
  return rows.slice(0,12).map(v=>({code:v.code||'VALIDATION',unitId:v.unitId||'',reason:v.reason||error.message||'Không đạt kiểm tra.'}));
}

export async function interpretWholeChart(prepared,{signal,runner=generateText}={}){
  signal?.throwIfAborted();
  const contract=buildQuestionNarrativeContract(prepared.context);
  const surface=surfacePayload(contract);
  const packet=buildCanonicalChartPacket(prepared);
  const modelSurface={...surface,units:surface.units.map(({technicalGrounding,...unit})=>({
    ...unit,
    claimIds:contract.units.find(candidate=>candidate.id===unit.id)?.claimIds||[]
  }))};
  const request={packet,surface:modelSurface,sections:modelSurface.units.map(u=>({id:u.id,label:u.label}))};
  const attempt=generated=>{
    signal?.throwIfAborted();
    const draft=parseDraft(generated);
    validateSurfaceDraft(draft,contract);
    const reading=hydrateSurfaceReading(draft,contract);
    validateReading(reading,prepared.facts,prepared.context.selectedTopic,prepared.context);
    return {reading,route:aiRouteOf(generated)};
  };
  const generated=await runner(INSTRUCTIONS,request,{signal});
  try{
    const result=attempt(generated);
    return attachAiRoute(result.reading,result.route);
  }catch(firstError){
    signal?.throwIfAborted();
    const repaired=await runner(REPAIR_INSTRUCTIONS,{
      packet,
      surface:modelSurface,
      draft:typeof generated?.text==='string'?generated.text.slice(0,24000):generated,
      violations:validationMessage(firstError)
    },{signal});
    const result=attempt(repaired);
    return attachAiRoute(result.reading,aiRouteOf(repaired)||aiRouteOf(generated));
  }
}
