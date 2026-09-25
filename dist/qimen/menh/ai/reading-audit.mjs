import {formatError} from '../../../reading-format.mjs';
import {buildMenhNarrativeFromContext} from './narrative-contract.mjs';
import {validateSurfaceReading,surfaceParagraphs,SurfaceValidationError,naturalSurfaceFallback} from '../../ai/surfaceReading.mjs';
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
  // Historical v1 readings retain trace checks, never mandatory phrasing.
  const sections=new Set((global.affectedDomains||[]).map(domain=>GLOBAL_SECTION_BY_DOMAIN[domain]).filter(Boolean));
  for(const key of sections){
    if(reading[key]?.text?.trim()&&!reading[key].claim_ids.includes(global.claimId))
      reject(key+': phải gắn GLOBAL_STRUCTURE vì domain này chịu cấu trúc toàn cục.');
  }
}

// Length is a style concern. Required meanings and trace are checked structurally.

function auditDangerousClaims(prose){
  const n=normalize(prose);
  if(/\b(?:km-case|caseguidance|deterministic_golden|derived_regression|source_golden|regression_locked|test_locked|source_locked|sourcecase|sourceref)\b/i.test(n))
    reject('KM-MENH writer không được làm lộ metadata Case Engine nội bộ.');
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
  if(reading?.narrativeVersion)return validateNarrativeMenh(reading,context);
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
  return reading;
}

export function validateNarrativeMenh(reading,context){
  try{
    const contract=buildMenhNarrativeFromContext(context);
    validateSurfaceReading(reading,contract);
    if(reading.status==='verified_fallback'){
      if(JSON.stringify(reading)!==JSON.stringify(naturalSurfaceFallback(contract)))reject('Dự phòng không khớp nhận định đã kiểm chứng.');
      return reading;
    }
    const paragraphs=surfaceParagraphs(reading),prose=paragraphs.map(p=>p.meaning).join(' ');
    auditDangerousClaims(prose);
    const n=normalize(prose);
    // Certainty is checked against the contract by the mandatory fidelity
    // reviewer; negated statements must not fail a keyword-presence gate.
    if(/\b(?:da xay ra|chac chan da|ban da (?:ket hon|ly hon|mat viec|nghi viec|sinh con|co \d+ con|mac benh|phau thuat|mua nha|ban nha))\b/.test(n))
      reject('Không tự nâng xu hướng thành sự kiện ngoài đời.');
    if(context.birthTimeMode==='UNKNOWN'&&/\bgio sinh (?:dung|chinh xac|la)\b/.test(n))
      reject('Không được tự chọn giờ sinh.');
    if(/\b\d+(?:[.,]\d+)*\s*(?:trieu|ty|vnd|usd|dong)\b/.test(n))
      reject('Không được tự tạo số tiền.');
    return reading;
  }catch(error){
    if(error instanceof SurfaceValidationError){const failure=new MenhReadingValidationError(error.message);failure.violations=error.violations;throw failure;}
    throw error;
  }
}
