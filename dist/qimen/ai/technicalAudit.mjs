import {normalizeQuestion} from './classifier.mjs';
import {RULE_REGISTRY} from '../analysis/ruleRegistry.mjs';
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const palaceNames={'Khảm':1,'Khôn':2,'Chấn':3,'Tốn':4,'Trung Ngũ':5,'Càn':6,'Đoài':7,'Cấn':8,'Ly':9};
const normalize=s=>normalizeQuestion(s.replaceAll('**',''));

// Only explicit assertions are checked here. This is not a general semantic proof.
export function auditTechnicalText(text,claimIds,context) {
  const c=context.allInOne,g=c.reasoning,source=normalize(context.question);
  let located=text.replaceAll('**','');
  for(const [name,n] of Object.entries(palaceNames))located=located.replace(new RegExp(`cung\\s+${name}(?:\\s+${n})?(?=\\s|[.,;:?!]|$)`,'giu'),`cung ${n}`);
  let prose=normalize(located);
  const errors=[];
  prose=prose.replace(/\bcung (?:can|kham|khon|chan|ton|doai|ly) ([1-9])\b/g,'cung $1');
  const claims=claimIds.map(id=>g.claims.find(c=>c.id===id)).filter(Boolean);
  const evidence=new Set(claims.flatMap(cl=>cl.evidenceIds));
  const supported=new Set([...evidence].filter(id=>/^p[1-9]$/.test(id)).map(id=>Number(id.slice(1))));
  if(c.spiritActivation?.recommended?.palace) supported.add(Number(c.spiritActivation.recommended.palace));
  const placements=new Map();
  const add=(name,n)=>{const key=normalize(name);if(!placements.has(key))placements.set(key,new Set());placements.get(key).add(n);};
  for(const p of c.board.palaces){
    if(p.number!==5){for(const name of [p.door?.vi,p.star?.vi,p.spirit?.vi])if(name)add(name,p.number);}
    if(p.carriesQin)add('Thiên Cầm',p.number);
    for(const stem of p.heavenStems)for(const prefix of ['thiên can','can thiên bàn'])add(prefix+' '+stem.vi,p.number);
    add('địa can '+p.earthStem.vi,p.number);
  }
  for(const p of c.analysis.palaces){if(p.voided)add('Tuần Không',p.number);if(p.horse)add('Dịch Mã',p.number);if(p.conditions.doorPressure)add('Môn bức',p.number);}
  for(const term of ['Tuần Không','Dịch Mã','Môn bức'])if(!placements.has(normalize(term)))placements.set(normalize(term),new Set());
  const assertLocation=(name,n,negated=false)=>{
    const actual=placements.get(name)?.has(n)||false;
    if(actual===negated)errors.push(`Sai vị trí ${name} tại cung ${n}.`);
    if(!supported.has(n)&&!negated)errors.push(`Đoạn nhắc cung ${n} nhưng claim không có dữ kiện cung đó.`);
  };
  for(const [name] of placements){
    const term=escape(name);
    const forward=new RegExp(`\\b${term}\\s+(?:(khong)\\s+)?(?:(?:nam|dong|toa|lac|ngu|duoc an)\\s+)?(?:(?:tai|o|vao|thuoc)\\s+)?cung\\s+([1-9])\\b`,'g');
    for(const m of prose.matchAll(forward))assertLocation(name,Number(m[2]),!!m[1]);
    const backward=new RegExp(`\\bcung\\s+([1-9])\\s*(?:(khong)\\s+)?(?:(?:co|mang|gap|gom|la)\\s+|:\\s*)?(?:than |tinh |mon )?${term}\\b`,'g');
    for(const m of prose.matchAll(backward))assertLocation(name,Number(m[1]),!!m[2]);
  }
  const states=[['tuan khong',p=>p.voided],['dich ma',p=>p.horse],['mon buc',p=>p.conditions.doorPressure]];
  for(const [name,check] of states){
    for(const m of prose.matchAll(new RegExp(`\\bcung ([1-9])\\s+(?:(khong)\\s+)?(?:(?:co|gap|pham|bi|mang|roi vao)\\s+)?${name}\\b`,'g'))){
      const p=c.analysis.palaces.find(p=>p.number===Number(m[1]));
      if(Boolean(p&&check(p))===!!m[2])errors.push(`Sai trạng thái ${name} tại cung ${m[1]}.`);
      if(!supported.has(Number(m[1])))errors.push(`Trạng thái cung ${m[1]} chưa có căn cứ trong đoạn.`);
    }
  }
  for(const p of c.analysis.palaces)for(const pair of p.stemPairs)for(const [label,key] of [['nhap mo','wonderTomb'],['kich hinh','punishment']]){
    const re=new RegExp(`\\b(?:can )?${escape(normalize(pair.heaven.vi))}\\s+(?:(khong)\\s+)?(?:(?:bi|pham|dang)\\s+)?${label}\\s+(?:tai |o )?cung ${p.number}\\b`,'g');
    for(const m of prose.matchAll(re))if(Boolean(pair[key])===!!m[1])errors.push(`Sai ${label} của ${pair.heaven.vi} tại cung ${p.number}.`);
  }
  const roleTerms={self:'nguoi hoi|nhat can',event:'thoi can|su viec',customer:'khach hang|doi phuong',competitor:'doi thu',decisionMaker:'nguoi duyet'};
  for(const [id,term] of Object.entries(roleTerms)){
    const role=c.analysis.roles.find(r=>r.id===id);
    for(const m of prose.matchAll(new RegExp(`\\b(?:${term})\\s+(?:(?:nam|dong|toa)\\s+)?(?:o |tai |thuoc )?cung ([1-9])\\b`,'g')))
      if(role?.palace!==Number(m[1]))errors.push(`Vai ${id} không được gán cung ${m[1]}.`);
  }
  if(/\b(?:khach hang|doi phuong|doi thu) (?:la|duoc dai dien boi) thoi can\b/.test(prose))errors.push('Không tự gán đối phương thành Thời can.');
  for(const m of prose.matchAll(/\brule_[a-z0-9_]+\b/g))if(!RULE_REGISTRY[m[0]]||!claims.some(c=>c.ruleIds.includes(m[0])))errors.push(`Quy tắc ${m[0]} không tồn tại hoặc không hỗ trợ đoạn.`);
  for(const m of prose.matchAll(/\b(?:claim_[a-z0-9_]+|graph_[a-z0-9_]+|actor_[a-z0-9_]+)\b/g))if(!claimIds.includes(m[0])&&!evidence.has(m[0]))errors.push(`Tham chiếu ${m[0]} không hỗ trợ đoạn.`);
  const elements={kim:'moc',moc:'tho',tho:'thuy',thuy:'hoa',hoa:'kim'},generates={kim:'thuy',thuy:'moc',moc:'hoa',hoa:'tho',tho:'kim'};
  for(const m of prose.matchAll(/\b(kim|moc|thuy|hoa|tho) (sinh|khac) (kim|moc|thuy|hoa|tho)\b/g))if((m[2]==='sinh'?generates:elements)[m[1]]!==m[3])errors.push('Quan hệ ngũ hành sai chiều.');
  for(const clause of prose.split(/[.!?;\n]+/)){
    if(!/\b(khach hang|doi thu|cong ty|giam doc|nguoi duyet|doi phuong)\b/.test(clause))continue;
    const assertion=clause.match(/\b(?:khach hang|doi thu|cong ty|giam doc|nguoi duyet|doi phuong)\b.{0,30}\b(?:dang|da|se|bi mat)\b.{0,60}\b(?:cho|ky|thieu|giau|mua chuoc|doi y|lua|het tien|pha san|phe duyet|co tinh)\b/);
    if(assertion&&!source.includes(assertion[0])&&!/\b(co the|gia thuyet|neu|chua xac nhan|khong (?:the|nen|duoc) (?:ket luan|khang dinh)|can (?:kiem tra|xac minh|xac nhan))\b/.test(clause))errors.push('Thêm sự kiện hoặc động cơ chưa được người dùng xác nhận.');
  }
  return [...new Set(errors)];
}
