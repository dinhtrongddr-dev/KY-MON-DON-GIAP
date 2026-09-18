const SECTION_KEYS=['overview','self','family','marriage','career','wealth','luck','annual','birthTimeNote'];
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const text=value=>typeof value==='string'&&value.length<=8000;
const normalize=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');

export class MenhReadingValidationError extends Error{
  constructor(message){super(message);this.name='MenhReadingValidationError';}
}
const reject=message=>{throw new MenhReadingValidationError(message);};

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

export function validateMenhReading(reading,context){
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
  auditDangerousClaims(allText.join(' '));
  return reading;
}
