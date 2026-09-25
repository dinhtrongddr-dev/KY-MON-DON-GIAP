import {normalizeQuestion} from './classifier.mjs';

export function timingMentions(text){
  // Preserve Vietnamese accents: "nam ngay" can mean "năm ngay", not "năm ngày".
  const accented=/[\u0300-\u036f]/u.test(text.normalize('NFD'))||/[đĐ]/u.test(text);
  const number=accented?'\\d+|một|hai|ba|bốn|năm|sáu|bảy':'\\d+|mot|hai|ba|bon|nam|sau|bay';
  const unit=accented?'ngày|tuần|tháng':'ngay|tuan|thang';
  const weekday=accented?'thứ (?:hai|ba|tư|năm|sáu|bảy)':'thu (?:hai|ba|tu|nam|sau|bay)';
  const relative=accented?'chủ nhật|cuối tuần|đầu tuần|ngày mai|chiều mai|sáng mai':'chu nhat|cuoi tuan|dau tuan|ngay mai|chieu mai|sang mai';
  const pattern=new RegExp(`(?<![\\p{L}\\d])(?:(?:${number})(?:\\s*[-–]\\s*(?:${number}))?\\s*(?:${unit})(?:\\s+(?:nữa|nua))?|${weekday}|${relative})(?![\\p{L}\\d])`,'giu');
  return [...text.matchAll(pattern)].map(match=>({text:match[0],normalized:normalizeQuestion(match[0]),index:match.index}));
}
