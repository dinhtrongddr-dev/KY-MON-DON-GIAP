import {formatError} from '../../../reading-format.mjs';
const SECTION_KEYS=['overview','self','family','marriage','career','wealth','luck','annual','birthTimeNote'];
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const text=value=>typeof value==='string'&&value.length<=8000;
const normalize=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
const GLOBAL_SECTION_BY_DOMAIN=Object.freeze({SELF:'self',FAMILY:'family',CHILDREN:'family',MARRIAGE:'marriage',CAREER:'career',WEALTH:'wealth'});

export class MenhReadingValidationError extends Error{
  constructor(message){super(message);this.name='MenhReadingValidationError';}
}
const reject=message=>{throw new MenhReadingValidationError(message);};

function auditGlobalStructure(reading,context){
  const global=context.globalStructure;
  if(!global?.active)return;
  if(!global.claimId||!context.allowedClaimIds.includes(global.claimId))
    reject('KM-MENH writer thiếu deterministic GLOBAL_STRUCTURE claim.');
  if(!reading.overview.claim_ids.includes(global.claimId))
    reject('overview phải gắn GLOBAL_STRUCTURE khi có cấu trúc toàn cục ưu tiên cao.');
  const n=normalize(reading.overview.text);
  for(const mechanism of global.mechanisms||[]){
    if(mechanism==='FU_YIN'&&!/\b(phuc ngam|fu_yin)\b/.test(n))
      reject('overview phải nêu Phục Ngâm khi GLOBAL_FU_YIN đang hoạt động.');
    if(mechanism==='FAN_YIN'&&!/\b(phan ngam|fan_yin)\b/.test(n))
      reject('overview phải nêu Phản Ngâm khi GLOBAL_FAN_YIN đang hoạt động.');
  }
  const hasPrecedence=/\b(xet truoc|doc truoc|uu tien|lop[^.!?]{0,50}truoc)\b/.test(n);
  const hasCap=/\b(gioi han|han che|cap|kim|kho phat huy|phat huy[^.!?]{0,40}(cham|khong tron ven)|loi the[^.!?]{0,40}(cham|muon))\b/.test(n);
  if(!hasPrecedence||!hasCap)
    reject('overview phải thể hiện precedence/cap của GLOBAL_STRUCTURE trước tín hiệu cục bộ.');
  if(!(/\bkhong\b[^.!?]{0,120}\b(tuyet doi|veto|quyet dinh|phan quyet|dong nghia|phu dinh)\b/.test(n)||/\btuyet doi\b[^.!?]{0,40}\bkhong\b/.test(n)))
    reject('overview phải nói rõ GLOBAL_STRUCTURE không phải veto/phán quyết xấu tuyệt đối.');
  const sections=new Set((global.affectedDomains||[]).map(domain=>GLOBAL_SECTION_BY_DOMAIN[domain]).filter(Boolean));
  for(const key of sections){
    if(reading[key]?.text?.trim()&&!reading[key].claim_ids.includes(global.claimId))
      reject(key+': phải gắn GLOBAL_STRUCTURE vì domain này chịu cấu trúc toàn cục.');
  }
}

const LONGFORM_MIN=Object.freeze({overview:280,self:500,family:550,marriage:500,career:550,wealth:550,luck:350,annual:350});
function auditLongForm(reading,context){
  if(context.birthTimeMode!=='KNOWN'||context.outputMode!=='COMPREHENSIVE_ONE_SHOT')return;
  const claims=new Set(context.allowedClaimIds||[]);
  const expected={
    overview:claims.size>0,self:claims.has('SELF_CORE'),
    family:[...claims].some(id=>id.startsWith('FAMILY_')||id==='CHILDREN_CORE'),
    marriage:claims.has('MARRIAGE_CORE'),career:claims.has('CAREER_CORE'),wealth:claims.has('WEALTH_CORE'),
    luck:claims.has('LUCK_CURRENT'),annual:claims.has('ANNUAL_CURRENT'),
  };
  let expectedCount=0,actualTotal=0;
  for(const [key,min] of Object.entries(LONGFORM_MIN)){
    if(!expected[key])continue;
    expectedCount++;const len=reading[key]?.text?.trim().length||0;actualTotal+=len;
    if(len<min)reject(key+': bài luận production quá ngắn cho chế độ COMPREHENSIVE_ONE_SHOT ('+len+'/'+min+' ký tự sàn).');
  }
  const requiredTotal=Math.round(6800*(expectedCount/Object.keys(LONGFORM_MIN).length));
  if(actualTotal<requiredTotal)reject('Bài luận production chưa đủ độ sâu long-form ('+actualTotal+'/'+requiredTotal+' ký tự tối thiểu toàn bài).');
}

function auditDangerousClaims(prose){
  const n=normalize(prose);
  if(/\b(xac suat|ty le thanh cong|diem tong menh|diem so van menh)\b[^.!?]{0,60}\d/.test(n)||/\d+(?:[.,]\d+)?\s*%/.test(n))
    reject('KM-MENH writer không được tạo xác suất hoặc điểm tổng mệnh.');
  if(/\b(chet|tu vong|song den|tho den)\b[^.!?]{0,60}\b\d{1,3}\s*tuoi\b/.test(n))
    reject('KM-MENH writer không được dự đoán tuổi chết hoặc tuổi thọ.');
  if(/\b(chac chan|nhat dinh|se)\b[^.!?]{0,80}\b(vo sinh|benh nang|tai nan tu vong)\b/.test(n))
    reject('KM-MENH writer không được tạo khẳng định y tế/tử vong tất định.');
  if(/\bse co\s+\d+\s+(?:nguoi\s+)?con\b|\bse ket hon\s+\d+\s+lan\b/.test(n))
    reject('KM-MENH writer không được dự đoán chính xác số con hoặc số lần kết hôn.');
  if(/\b(cha|me|bo)\b[^.!?]{0,40}\b(se|chac chan|nhat dinh)\b[^.!?]{0,40}\b(chet|mat)\b/.test(n))
    reject('KM-MENH writer không được dự đoán tất định cái chết của cha mẹ.');
}

export function validateMenhReading(reading,context,{enforceLongForm=false}={}){
  const top=['status','specVersion','profileId',...SECTION_KEYS];
  if(!exact(reading,top)||reading.status!=='reading')reject('KM-MENH writer trả sai schema.');
  if(reading.specVersion!==context.specVersion||reading.profileId!==context.profileId)
    reject('KM-MENH writer đổi spec/profile.');
  const allowed=new Set(context.allowedClaimIds);
  const claimById=new Map(context.claims.map(c=>[c.claimId,c]));
  const allText=[];
  for(const key of SECTION_KEYS){
    const section=reading[key];
    if(!exact(section,['text','claim_ids'])||!text(section.text)||!Array.isArray(section.claim_ids))
      reject(key+': section không hợp lệ.');
    const formatting=formatError(section.text);if(formatting)reject(key+': '+formatting);
    if(new Set(section.claim_ids).size!==section.claim_ids.length||section.claim_ids.some(id=>!allowed.has(id)))
      reject(key+': dùng claim id ngoài deterministic context.');
    if(section.text.trim()&&!section.claim_ids.length&&key!=='birthTimeNote')
      reject(key+': đoạn có nội dung nhưng không có claim căn cứ.');
    if(!section.text.trim()&&section.claim_ids.length)reject(key+': claim_ids không được treo trên đoạn rỗng.');
    for(const id of section.claim_ids){
      const claim=claimById.get(id);
      if(claim.type==='NATAL_TENDENCY'&&/\b(da xay ra|da chac chan|chac chan da)\b/.test(normalize(section.text)))
        reject(key+': đã tự nâng NATAL_TENDENCY thành sự kiện.');
    }
    allText.push(section.text);
  }
  if(context.birthTimeMode==='UNKNOWN'){
    const n=normalize(reading.birthTimeNote.text);
    if(!/phu thuoc gio sinh|khong nho gio sinh|on dinh/.test(n))
      reject('UNKNOWN birth time phải có ghi chú độ ổn định/phụ thuộc giờ sinh.');
    if(/gio sinh (dung|chinh xac|la)\s*\d/.test(n))
      reject('Không được tự chọn giờ sinh đúng.');
  }
  auditGlobalStructure(reading,context);
  auditDangerousClaims(allText.join(' '));
  if(enforceLongForm)auditLongForm(reading,context);
  return reading;
}
