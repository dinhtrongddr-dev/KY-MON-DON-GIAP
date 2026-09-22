import {MODES} from '../modes/shared.mjs';
export const normalizeQuestion=q=>q.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/\s+/g,' ').trim();
// Explainable intent routing, separate from domain/topic and from AI generation.
const INTENTS=[
  ['timing',/chon (ngay|gio|thoi diem)|ngay nao (nen|gui|ky|gap|goi|trien khai)|gio nao|khi nao nen|thoi diem nao/,'Câu hỏi yêu cầu chọn thời điểm hành động.'],
  ['direction',/huong nao|phuong huong|phuong vi|di huong|chon huong/,'Câu hỏi yêu cầu so sánh phương hướng.'],
  ['negotiation',/dam phan|thuong luong|nhuong|deal gia|nen noi gi|xu ly doi tac/,'Câu hỏi tập trung trao đổi điều kiện với đối phương.'],
  ['strategy',/\bco nen\b|nen hay khong|co nen .* hay|phai lam gi|nen lam gi|lam the nao|chien luoc|tien hay lui|chu dong hay|phuong an|can chuan bi|cach nao de/,'Câu hỏi tập trung lựa chọn hành động hoặc quyết định nên/không nên.'],
  ['prediction',/co .*khong|ket qua|phan hoi|dien bien|khi nao|bao gio|co thanh|co nhan duoc/,'Câu hỏi tập trung kết quả hoặc diễn biến.'],
  ['business',/doi thu|dau thau|bao gia|kinh doanh|khach hang|hop dong|du an|dong tien/,'Câu hỏi tập trung các bên hoặc khâu giao dịch.'],
];
export function classifyQuestion(question,requested='auto') {
  if(!MODES.includes(requested))throw new Error('Chế độ luận không hợp lệ.');
  const q=normalizeQuestion(question),matches=INTENTS.filter(([,r])=>r.test(q));
  if(/\bphuong huong (kinh doanh|phat trien|xu ly|hanh dong|su nghiep)\b/.test(q)&&!/(di huong|ngoi|quay mat|phuong vi|dong nam|tay bac)/.test(q)){
    const index=matches.findIndex(([id])=>id==='direction');if(index>=0)matches.splice(index,1);
    matches.unshift(['strategy',null,'Phương hướng ở đây là cách hành động, chưa phải phương vị địa lý.']);
  }
  // A competitor comparison is business even when phrased as a yes/no question.
  if(/doi thu/.test(q)&&/loi the|manh|hon|so voi/.test(q)&&!matches.some(([id])=>['strategy','negotiation','timing'].includes(id)))matches.unshift(['business',null,'Câu hỏi so sánh vị thế đối thủ.']);
  const mode=requested==='auto'?(matches[0]?.[0]||'prediction'):requested;
  return {requested,mode,reason:requested==='auto'?(matches[0]?.[2]||'Chưa rõ ý định; tạm đọc diễn biến, bạn có thể đổi chế độ.'):'Theo chế độ bạn chọn.',
    alternatives:[...new Set(matches.map(m=>m[0]))].filter(m=>m!==mode),fallback:!matches.length&&requested==='auto',ambiguous:requested==='auto'&&(!matches.length||matches.some(([id])=>id==='timing')&&matches.some(([id])=>id==='direction'))};
}
const DOMAINS=[['health',/\b(suc khoe|benh|dieu tri|dau nguc|kho tho)\b/],['investment',/\b(dau tu|co phieu|chung khoan|tien ao|coin)\b/],['dispute',/\b(khoi kien|kien tung|tranh chap|toa an)\b/],
  ['contract',/bao gia|hop dong|dau thau|du an/],['debt',/doi no|tra no|thu hoi no/],['work',/\b(cong viec|su nghiep|viec lam|xin viec|chuyen viec|doi viec|nhan viec|thang chuc|thang tien)\b/],['study',/hoc|thi cu|chung chi/],['love',/\b(tinh cam|tinh yeu|nguoi yeu|hen ho)\b/],
  ['family',/\b(gia dinh|cha me|bo me|vo chong|vo toi|chong toi|ban doi|nguoi ban doi|con cai|con nho|em be|cham con|nuoi con|cham be|nuoi be|thai san|o nha cham)\b/],['property',/nha dat|bat dong san|mua nha/],['lost',/mat do|tim do|tim nguoi|that lac/],
  ['travel',/di xa|chuyen di|du lich/],['launch',/khai truong|ra mat/],['money',/tien|loi nhuan|kinh doanh|thu nhap|doanh thu|dong tien|tai chinh|chi phi/],['social',/ban be|quan he xa hoi/]];
const NON_MONEY_TIEN=/\b(?:tien trien|tien hanh|tien do|tien toi|tien lui|tien bo|tien phong|tien doan|tien quyet|uu tien|thang tien)\b/g;
export function classifyTopics(question) {
  const q=normalizeQuestion(question),moneySafe=q.replace(NON_MONEY_TIEN,' ');
  return DOMAINS.filter(([id,r])=>new RegExp(`\\b(?:${r.source})\\b`).test(id==='money'?moneySafe:q)).map(([id])=>id);
}
export function classifyTopic(question) {return classifyTopics(question)[0]||'general';}
