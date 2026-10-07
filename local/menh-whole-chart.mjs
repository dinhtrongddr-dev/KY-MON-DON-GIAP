import {parseStructuredText} from './codex-client.mjs';
import {aiRouteOf,attachAiRoute,READING_TIMEOUT_MS} from './ai-client.mjs';
import {runSurfaceText} from './surface-writer.mjs';
import {buildMenhWriterContext} from '../dist/qimen/menh/ai/writer-context.mjs';
import {buildMenhWholeChartContract} from '../dist/qimen/menh/ai/whole-chart-contract.mjs';
import {validateMenhReading} from '../dist/qimen/menh/ai/reading-audit.mjs';
import {validateSurfaceDraft,hydrateSurfaceReading,validateSurfaceReading} from '../dist/qimen/ai/surfaceReading.mjs';
import {METHOD_AWARE_READING_INSTRUCTIONS,GLOBAL_STRUCTURE_INSTRUCTIONS} from '../dist/qimen/ai/methodPrompt.mjs';
import {tenStemResponse} from '../dist/qimen/analysis/structureEngine.mjs';

export const MENH_WHOLE_CHART_PACKET_VERSION='KM-MENH-WHOLE-CHART-1';
const pick=(value,keys)=>Object.fromEntries(keys.filter(k=>value?.[k]!==undefined).map(k=>[k,value[k]]));
const entity=value=>value?pick(value,['id','han','vi','element']):null;
const level=value=>value?pick(value,['element','level','status']):null;
const palaceNumber=value=>typeof value==='number'?value:Number(String(value||'').match(/(\\d+)$/)?.[1]||0);
function chartFacts(board,layers){
  if(!board)return null;
  return {
    method:board.method,methodLabel:board.method==='chaibu'?'Tháo bổ · Phù đầu':'Mao Sơn · 5 ngày/nguyên',
    dun:board.dun,ju:board.ju,yuan:board.yuan,term:entity(board.term),xun:board.xun,fuHead:board.fuHead,
    pillars:board.pillars,zhiFu:{star:entity(board.zhiFu?.star),palace:board.zhiFu?.palace},
    zhiShi:{door:entity(board.zhiShi?.door),palace:board.zhiShi?.palace},
    patterns:{...board.patterns},fuYin:board.fuYin,fanYin:board.fanYin,
    voidBranches:(board.voidBranches||[]).map(entity),horseBranch:entity(board.horseBranch),
    palaces:(board.palaces||[]).map(p=>{
      const row=layers?.byPalace?.[p.number];
      return {
        palace:p.number,name:p.vi,direction:p.direction,element:p.element,
        deity:entity(p.spirit),star:entity(p.star),door:entity(p.door),
        heavenStems:(p.heavenStems||[]).map(entity),earthStem:entity(p.earthStem),
        carriesQin:p.carriesQin===true,void:p.voided===true,horse:p.horse===true,
        isDutyStar:p.isDutyStar===true,isDutyDoor:p.isDutyDoor===true,
        strength:row?{star:level(row.strength?.star),door:level(row.strength?.door),palace:level(row.strength?.palace),
          stems:(row.strength?.stems||[]).map(s=>({stem:s.stem,carried:s.carried,longevity:pick(s.longevity,['id','vi','band']),palaceSupport:pick(s.palaceSupport,['kind','text'])}))}:null,
        structure:row?{
          doorRelation:pick(row.structure?.doorRelation,['code','doorControlsPalace','palaceControlsDoor','label']),
          fourHarms:(row.structure?.fourHarms||[]).map(s=>pick(s,['code','kind','severity','stem','carried','actorIds','tombScope'])),
          stemResponses:(row.structure?.stemResponses||[]).map(s=>({...pick(s,['pair','heavenStem','earthStem','carried','tone','actorIds']),classicalName:tenStemResponse(s.heavenStem,s.earthStem)?.name||null})),
          patterns:(row.structure?.patterns||[]).map(s=>pick(s,['id','name','tone','qualified','blockers','pair','source']))
        }:null
      };
    })
  };
}

export function buildMenhCanonicalPacket(prepared){
  const result=prepared.result,board=result.natal?.baseBoard,chart=chartFacts(board,result.analysisLayers);
  const roles=(result.analysisLayers?.roles||[]).map(r=>pick(r,['id','label','palace','stem','yongshenTier']));
  const roleRelations=(result.evidence||[]).filter(e=>e.relation).map(e=>({
    id:e.evidenceId,domain:e.domain,mechanism:e.mechanism,palace:palaceNumber(e.palace),
    relation:pick(e.relation,['kind','text']),roleFacts:pick(e.metadata,['roles','gengPalace'])
  }));
  const focalNumbers=[...new Set([
    roles.find(r=>r.id==='menh_self')?.palace,board?.zhiFu?.palace,board?.zhiShi?.palace,
    ...(chart?.palaces||[]).filter(p=>['kai','sheng','xiu','du'].includes(p.door?.id)||p.horse||p.void||p.structure?.fourHarms?.length||p.structure?.patterns?.length).map(p=>p.palace),
    palaceNumber(result.luck?.palace),palaceNumber(result.annual?.annualStemPalace)
  ].filter(Boolean))];
  return {
    schemaVersion:MENH_WHOLE_CHART_PACKET_VERSION,
    input:pick(prepared.input,['fullName','birthPlace','birthDateLocal','birthTimeMode','birthTimeLocal','tzOffset','age','annualYear','sexMetadata']),
    method:{system:'Thời Gia Chuyển Bàn',natalProfile:result.profileId,sourceEngineVersion:result.natal?.sourceEngineVersion,center5Lodging:result.natal?.center5Lodging},
    chart,roles,roleRelations,periods:{luck:result.luck||null,annual:result.annual||null},
    salienceIndex:{kind:'FACT_ONLY_SALIENCE_INDEX',roles,global:chart?{patterns:chart.patterns,zhiFu:chart.zhiFu,zhiShi:chart.zhiShi}:null,
      salientPalaces:focalNumbers.map(n=>chart?.palaces.find(p=>p.palace===n)).filter(Boolean)},
    unknownBirthTime:prepared.input.birthTimeMode==='UNKNOWN'?{
      candidateCount:prepared.candidateCount,stability:pick(result.stability,['stableClaimIds','unstableClaimIds']),
      candidates:(prepared.candidates||[]).map(c=>({id:c.id,time:c.time,family:c.family,chart:chartFacts(c.board,null)})),
      stableReferences:(result.claims||[]).map(c=>pick(c,['claimId','domain','evidenceIds']))
    }:null,
    safeguards:{noRecalculation:true,noSemanticFrame:true,noPrewrittenConclusion:true,noAutoSelectedBirthHour:true}
  };
}

const PROMPT=`Bạn là người luận Mệnh Kỳ Môn đang đọc một bàn đã được engine tính sẵn. Đây là lượt suy luận trực tiếp duy nhất: tự đọc toàn bộ facts, tự interpretation, tự tổng hợp và tự viết. Không có planner, semantic_frame, action chain hoặc kết luận soạn sẵn. Hãy viết một bài tiếng Việt tự nhiên, sắc, có cơ chế riêng của đúng lá số này; không viết kiểu dịch từng ký hiệu.

NGUỒN SỰ THẬT VÀ PHƯƠNG PHÁP:
- Packet là nguồn sự thật duy nhất. Không tự lập lại bàn, không sửa vị trí cung, Môn, Tinh, Thần, Can, Dụng Thần, vai trò hoặc quan hệ.
- Lá số này dùng Thời Gia Chuyển Bàn, âm/dương cục, Tháo Bổ theo Phù Đầu do engine ghi trong packet. Tháo Bổ là phương pháp định cục, không phải một tầng diễn giải để tự bịa thêm.
- Phải đọc global structure, Cửu Tinh Phục Ngâm/Phản Ngâm, Bát Môn Phục Ngâm/Phản Ngâm nếu packet có ghi, Không Vong, Dịch Mã, Nhập Mộ, Tam Kỳ nhập mộ, Thanh Long phản thủ và các quan hệ Can/Can khi packet có facts tương ứng. Không được thêm cách cục nếu packet không ghi.
- Được nối nhiều cung, vai trò, tầng vận và thời điểm; không được gán một ý nghĩa cho một ký hiệu rồi lặp lại ở mọi mục. Mỗi kết luận chính phải có một cơ chế phối hợp cụ thể trong facts.
- Nếu có kỳ môn thuật ngữ, nói ngay hệ quả đời thường. Không dùng từ nội bộ như packet, claim, evidence, planner, validator, model, schema trong bài.

CÁCH LUẬN MỆNH:
- Mở bằng cơ chế trục của toàn lá số: lực mở ra, lực kéo lại, nơi tạo đòn bẩy và nút thắt. Sau đó nối Bản thân với các cung gia đình/con cái, hôn nhân, sự nghiệp, tài vận; không coi chúng là bảy bài độc lập.
- Phân biệt rõ bản chất natal, giai đoạn vận và năm đang xét. Không lấy một dấu hiệu của năm để kết luận cả đời.
- Với mỗi mục: (1) nêu ý nghĩa trực tiếp, (2) chỉ ra 1–3 tổ hợp facts làm căn cứ, (3) chuyển thành biểu hiện/thử thách cụ thể, (4) nêu cách dùng lực và điều kiện cần tránh. Độ dài và nhịp câu phải thay đổi; bỏ các câu mở đầu lặp “có xu hướng”.
- Hãy tìm mâu thuẫn hữu ích giữa các cung thay vì làm phẳng thành lời khuyên an toàn. Đặc biệt xem vai trò Mệnh và cung chủ, Quan hệ Nhật Can, các cung có Khai/Sinh/Hưu, các cung có Thương/Kinh/Tử/Đỗ, cung Dịch Mã/Không Vong/Nhập Mộ và Phục Ngâm toàn bàn.
- Cho phép suy luận thực hành có điều kiện từ tổ hợp facts; đó là interpretation hợp lệ, không phải hallucination. Không bịa tên người, sự kiện đã xảy ra, ngày cụ thể, số tiền, xác suất, chẩn đoán, tuổi thọ, số con hoặc số lần hôn nhân.
- Tự kiểm tra chart specificity: nếu đổi bàn khác mà hơn nửa nội dung vẫn dùng được, hãy viết lại để bám vào cơ chế và cung nổi bật của packet.

CÁC BẢN MỤC BẮT BUỘC:
- Tổng thể: trục lực mở/kéo lại và một câu kết luận định hướng.
- Bản thân: cách vận hành, điểm mạnh thật, vòng lặp dễ mắc và cách phá vòng lặp.
- Gia đình và con cái; Hôn nhân; Sự nghiệp; Tài vận: mỗi mục phải nối vào trục tổng thể, chỉ ra cơ chế riêng chứ không chép lời khuyên chung.
- Giai đoạn hiện tại: đọc tầng vận đúng khoảng tuổi ghi trong periods.luck, chỉ nêu điều kiện chuyển nhịp.
- Năm đang xét: chỉ dùng periods.annual, nói cơ hội, điểm nghẽn và dấu hiệu theo dõi; không biến thành sự kiện chắc chắn.
- Nếu có mục tiêu số lượng hoặc kế hoạch, được đưa phép chia minh họa quản trị, nhưng phải ghi rõ đó là kế hoạch minh họa chứ không phải dự báo từ bàn.

ĐẦU RA:
Chỉ trả JSON đúng dạng {"sections":[{"id":"...","text":"..."}]} với đúng id trong sections. Không thêm markdown fence hay trường khác.`;

const REPAIR=`Bản JSON trước không đạt kiểm tra. Sửa đúng lỗi được nêu, giữ nguyên toàn bộ id section, không đổi dữ kiện hoặc mức chắc chắn, không bịa thêm. Nếu một câu chỉ là suy luận thực hành thì giữ lại nhưng diễn đạt có điều kiện và bám facts; không thu bài về các câu mẫu chung chung. Chỉ trả JSON {"sections":[{"id":"...","text":"..."}]}.`;

function parseDraft(value){
  if(value&&Array.isArray(value.sections))return value;
  if(typeof value?.text==='string')return parseStructuredText(value.text);
  if(typeof value==='string')return parseStructuredText(value);
  throw new Error('Writer không trả object sections.');
}
function auditFacts(reading,packet){
  const text=Object.values(reading.sections||{}).flatMap(s=>(s.paragraphs||[]).map(p=>p.meaning||'')).join(' ');
  const n=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
  const source=String(packet.input?.birthDateLocal||'').toLowerCase();
  const violations=[];
  const moneyPattern=/(?:[0-9]+(?:[.,][0-9]+)*|mot|hai|ba|bon|nam|sau|bay|tam|chin|muoi)[ ]*(?:trieu|ty|vnd|usd|dong|do la)/g;
  for(const m of n.matchAll(moneyPattern))violations.push({code:'INVENTED_MONEY',reason:'Số tiền cụ thể không có trong dữ kiện.'});
  const datePattern=/(?:[0-9]{1,2}[/][0-9]{1,2}(?:[/][0-9]{2,4})?|[0-9]{4}-[0-9]{2}-[0-9]{2})/g;
  for(const m of n.matchAll(datePattern))if(!source.includes(m[0]))violations.push({code:'INVENTED_TIME',reason:'Mốc ngày cụ thể không có trong dữ kiện.'});
  const technicalLabels=[...new Set((packet.chart?.palaces||[]).flatMap(x=>[x.door?.vi,x.star?.vi,x.deity?.vi]).filter(Boolean))];
  for(const sentence of sentences){
    if(!/[?]\s*(?:không|khong)\b/.test(sentence))continue;
    if(technicalLabels.some(label=>sentence.includes(String(label).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase())))
      violations.push({code:'SELF_CORRECTION',reason:'Bài còn để lại câu hỏi/tự sửa về một ký hiệu kỹ thuật; cần kiểm tra facts trước khi xuất.'});
  }
  return violations;
}
function validationMessage(error){
  return JSON.stringify(error?.violations||[{code:'VALIDATION',reason:error?.message||String(error)}]).slice(0,12000);
}

export async function interpretMenhWholeChart(prepared,{runner=runSurfaceText,budgetMs=READING_TIMEOUT_MS,signal}={}){
  signal?.throwIfAborted();
  const context=buildMenhWriterContext(prepared.result,{birthTimeMode:prepared.input.birthTimeMode,stability:prepared.result.stability||null,timePlace:prepared.technical?.timePlace||null,rectification:prepared.rectification||null});
  const contract=buildMenhWholeChartContract(context);
  const packet=buildMenhCanonicalPacket(prepared);
  const sections=contract.units.map(u=>({id:u.id,label:u.label}));
  const request={packet,sections};
  const run=async(instructions,payload)=>runner(instructions,payload,undefined,{signal});
  let generated=await run(PROMPT,request);
  for(let attempt=0;attempt<2;attempt++){
    signal?.throwIfAborted();
    try{
      const draft=parseDraft(generated);
      validateSurfaceDraft(draft,contract);
      const reading=hydrateSurfaceReading(draft,contract);
      validateSurfaceReading(reading,contract);
      validateMenhReading(reading,context);
      const violations=auditFacts(reading,packet);
      if(violations.length){const e=new Error('Fact audit failed');e.violations=violations;throw e;}
      return attachAiRoute(reading,aiRouteOf(generated));
    }catch(error){
      if(attempt===1)throw error;
      generated=await run(REPAIR,{packet,sections,draft:typeof generated?.text==='string'?generated.text.slice(0,22000):generated,violations:validationMessage(error)});
    }
  }
}
