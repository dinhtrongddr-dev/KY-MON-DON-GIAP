import {generateQimen} from '../core/board.mjs';
import {BRANCHES,PALACES} from '../core/palace.mjs';
import {locateStem} from '../../guide.mjs';
import {elementLink} from './relationships.mjs';

export const NIANMING_VERSION='KM-NIANMING-1.0';
export const NIANMING_PROFILE='BIRTH_YEAR_CORROBORATOR_ONLY';
export const NIANMING_SOURCE='遁甲演義卷一·本命行年';
export const NIANMING_PERSON_IDS=Object.freeze(['self','subject','customer','competitor','decisionMaker']);

const PERSON_META=Object.freeze({
  self:{label:'Người hỏi',linkedRoleId:'self'},
  subject:{label:'Người được hỏi thay',linkedRoleId:'self'},
  customer:{label:'Khách hàng / phía liên quan',linkedRoleId:'customer'},
  competitor:{label:'Đối thủ / bên cạnh tranh',linkedRoleId:'competitor'},
  decisionMaker:{label:'Người có quyền duyệt',linkedRoleId:'decisionMaker'}
});
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const validDate=(y,m,d)=>{
  const x=new Date(Date.UTC(y,m-1,d));
  return x.getUTCFullYear()===y&&x.getUTCMonth()+1===m&&x.getUTCDate()===d;
};
function parseBirthValue(value){
  const s=String(value??'').trim();
  if(!s)return null;
  let m=s.match(/^(\d{4})$/);
  if(m){
    const year=Number(m[1]);
    if(year<1900||year>2100)throw new Error('Năm sinh Niên Mệnh phải nằm trong 1900–2100.');
    return {canonical:String(year),precision:'year_only',year,month:null,day:null};
  }
  m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/)||s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if(!m)throw new Error('Ngày sinh Niên Mệnh phải là DD/MM/YYYY, YYYY-MM-DD hoặc chỉ YYYY.');
  const iso=s.includes('-');
  const year=Number(iso?m[1]:m[3]),month=Number(m[2]),day=Number(iso?m[3]:m[1]);
  if(year<1900||year>2100||!validDate(year,month,day))throw new Error('Ngày sinh Niên Mệnh không hợp lệ.');
  return {canonical:`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,precision:'full_date',year,month,day};
}
export function normalizeNianmingInput(raw={}){
  if(raw==null)return freeze({});
  if(typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!NIANMING_PERSON_IDS.includes(k)))throw new Error('Dữ liệu Niên Mệnh không hợp lệ.');
  const out={};
  for(const id of NIANMING_PERSON_IDS){
    if(raw[id]==null||raw[id]==='')continue;
    const value=typeof raw[id]==='object'&&!Array.isArray(raw[id])?raw[id].birth:raw[id];
    const parsed=parseBirthValue(value);
    if(parsed)out[id]=parsed.canonical;
  }
  return freeze(out);
}
function yearPillarAt({year,month,day,hour,minute,tzOffset}){
  return generateQimen({year,month,day,hour,minute,tzOffset},'chaibu').pillars.year;
}
function deriveBirthYearPillar(value,tzOffset){
  const parsed=parseBirthValue(value);
  if(parsed.precision==='year_only'){
    const pillar=yearPillarAt({year:parsed.year,month:7,day:1,hour:12,minute:0,tzOffset});
    return freeze({status:'resolved',precision:'year_only',pillar,
      limitations:['Chỉ nhập năm dương lịch: quy ước lấy niên trụ giữa năm. Người sinh trước Lập Xuân có thể thuộc niên trụ Kỳ Môn của năm trước; nên nhập đủ ngày sinh để kiểm tra.']});
  }
  const early=yearPillarAt({...parsed,hour:0,minute:0,tzOffset});
  const late=yearPillarAt({...parsed,hour:23,minute:59,tzOffset});
  if(early.han!==late.han){
    return freeze({status:'boundary_ambiguous',precision:'full_date',pillar:null,possiblePillars:[early,late],
      limitations:['Ngày sinh trùng ngày đổi niên trụ quanh Lập Xuân. Không có giờ sinh nên KM-NIANMING-1.0 không tự chọn niên trụ.']});
  }
  return freeze({status:'resolved',precision:'full_date',pillar:early,limitations:[]});
}
function branchReference(branchHan){
  const branchIndex=BRANCHES.findIndex(b=>b.han===branchHan);
  const palace=Object.values(PALACES).find(p=>p.number!==5&&p.branches?.includes(branchIndex));
  return palace?{branch:branchHan,palace:palace.number,direction:palace.direction,element:palace.element}:null;
}
function personActive(id,questionContext){
  if(id==='self')return questionContext?.subject?.kind!=='on_behalf';
  if(id==='subject')return questionContext?.subject?.kind==='on_behalf';
  if(['customer','competitor','decisionMaker'].includes(id))return !!questionContext?.stakeholders?.some(s=>s.role===id);
  return false;
}
function linkedRoleFor(id,roles,questionContext){
  if(id==='self'&&questionContext?.subject?.kind==='on_behalf')return null;
  if(id==='subject'&&questionContext?.subject?.kind!=='on_behalf')return null;
  return roles.find(r=>r.id===PERSON_META[id].linkedRoleId)||null;
}
function modernSnapshot(palace,effectiveStem){
  const pair=palace.stemPairs?.find(x=>x.heaven.han===effectiveStem)||null;
  const stemStrength=palace.strength?.stems?.find(x=>x.stem===effectiveStem)||null;
  return {
    door:{id:palace.door.id,vi:palace.door.vi,element:palace.door.element},
    star:{id:palace.star.id,vi:palace.star.vi,element:palace.star.element},
    spirit:{id:palace.spirit.id,vi:palace.spirit.vi},
    states:{void:!!palace.voided,horse:!!palace.horse,doorPressure:!!palace.conditions?.doorPressure,
      punishment:!!pair?.punishment,wonderTomb:!!pair?.wonderTomb,tomb:!!(pair?.tomb??pair?.wonderTomb)},
    stemStrength:stemStrength?{weight:stemStrength.capacityWeight,band:stemStrength.longevity?.band||null,meaning:stemStrength.longevity?.meaning||null,
      longevity:stemStrength.longevity?{id:stemStrength.longevity.id,vi:stemStrength.longevity.vi,meaning:stemStrength.longevity.meaning}:null}:null
  };
}
export function analyzeNianming(board,palaces,roles=[],raw={},questionContext=null){
  const normalized=normalizeNianmingInput(raw);
  const people=[];
  for(const id of NIANMING_PERSON_IDS){
    const birth=normalized[id];if(!birth)continue;
    const derived=deriveBirthYearPillar(birth,board.input?.tzOffset??7);
    const meta=PERSON_META[id],active=personActive(id,questionContext),linkedRole=linkedRoleFor(id,roles,questionContext);
    if(derived.status!=='resolved'){
      people.push({id,label:meta.label,status:derived.status,active,inputPrecision:derived.precision,
        yearPillar:null,yearStem:null,effectiveStem:null,palace:null,branchReference:null,linkedRoleId:linkedRole?.id||null,
        evidenceId:`nianming_${id}`,corroboratorOnly:true,verdictEligible:false,scoringEligible:false,
        limitations:derived.limitations,possiblePillars:derived.possiblePillars?.map(p=>({han:p.han,vi:p.vi}))||[]});
      continue;
    }
    const located=locateStem(board,derived.pillar.han),palace=palaces.find(p=>p.number===located.palace.number);
    const linkedPalace=linkedRole?.palace?palaces.find(p=>p.number===linkedRole.palace):null;
    const eventRole=roles.find(r=>r.id==='event'),eventPalace=eventRole?.palace?palaces.find(p=>p.number===eventRole.palace):null;
    people.push({id,label:meta.label,status:'resolved',active,inputPrecision:derived.precision,
      yearPillar:{han:derived.pillar.han,vi:derived.pillar.vi},yearStem:derived.pillar.stem.han,
      yearBranch:derived.pillar.branch.han,effectiveStem:located.effective,hiddenJia:derived.pillar.stem.han==='甲',
      palace:palace.number,branchReference:branchReference(derived.pillar.branch.han),linkedRoleId:linkedRole?.id||null,
      linkedRoleStatus:linkedRole?.status||null,
      linkedRoleRelation:linkedPalace?elementLink(palace.element,linkedPalace.element):null,
      eventRelation:eventPalace?elementLink(palace.element,eventPalace.element):null,
      snapshot:modernSnapshot(palace,located.effective),evidenceId:`nianming_${id}`,
      corroboratorOnly:true,verdictEligible:false,scoringEligible:false,
      limitations:[...derived.limitations,'Niên Mệnh chỉ là lớp đối chiếu; không thay Nhật can, Dụng Thần chính, vai chính hoặc kết luận deterministic.']});
  }
  const byPalace=Object.fromEntries(palaces.map(p=>[p.number,people.filter(x=>x.status==='resolved'&&x.palace===p.number)]));
  return freeze({version:NIANMING_VERSION,profile:NIANMING_PROFILE,people,byPalace,
    inputCount:Object.keys(normalized).length,resolvedCount:people.filter(x=>x.status==='resolved').length,
    policy:{tier:'corroborator',primaryOverrideAllowed:false,yongshenOverrideAllowed:false,evidenceScoreAllowed:false,
      probabilityAllowed:false,writerReceivesBirthDate:false,retentionAllowed:false},
    source:NIANMING_SOURCE,
    limitations:[
      'KM-NIANMING-1.0 dùng can của niên trụ sinh đặt lên thiên bàn hiện tại; chi năm sinh chỉ là tham chiếu phụ.',
      'Ngày sinh chỉ dùng để xác định niên trụ. Writer không nhận ngày sinh thô.',
      'Nếu chỉ nhập năm, người sinh trước Lập Xuân có thể thuộc niên trụ trước; engine ghi cảnh báo thay vì coi dữ liệu là chính xác tuyệt đối.',
      'Nếu ngày sinh trùng ngày đổi niên trụ quanh Lập Xuân và không có giờ sinh, trạng thái là boundary_ambiguous và không tự chọn.',
      'Niên Mệnh không biến người liên quan đang unresolved thành Dụng Thần chính đã được xác nhận.'
    ]});
}
