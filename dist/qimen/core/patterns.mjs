import {STEMS} from './palace.mjs';
const controls={Mộc:'Thổ',Thổ:'Thủy',Thủy:'Hỏa',Hỏa:'Kim',Kim:'Mộc'};
export const PATTERN_SOURCE='https://zh.wikisource.org/wiki/煙波釣叟歌';
// Bounded, explicit combinations. A matching symbol is not a predicted event.
export function specialPatterns(board) {
  const day=STEMS.findIndex(s=>s.han===board.dayGan),hour=STEMS.findIndex(s=>s.han===board.hourGan);
  const wuBuYuShi=day%2===hour%2 && controls[STEMS[hour].element]===STEMS[day].element;
  const matches=[];
  const pairs={'癸丁':'Đằng Xà yêu kiểu','丁癸':'Chu Tước đầu giang','乙辛':'Thanh Long đào tẩu','辛乙':'Bạch Hổ xương cuồng',
    '庚丙':'Thái Bạch nhập Huỳnh','丙庚':'Huỳnh nhập Thái Bạch'};
  for(const p of board.palaces.filter(p=>p.number!==5)) for(const [index,stem] of p.heavenStems.entries()) {
    const pair=stem.han+p.earthStem.han;
    const add=(id,name)=>matches.push({id,palace:p.number,heavenStem:stem.han,earthStem:p.earthStem.han,carried:index>0,name,source:PATTERN_SOURCE});
    if(pairs[pair])add(pair,pairs[pair]);
    if(stem.han==='丙' && p.earthStem.han==='丁' && p.door.id==='sheng')add('tian_dun','Thiên độn');
    if(stem.han==='乙' && p.earthStem.han==='己' && p.door.id==='kai')add('di_dun','Địa độn');
    if(stem.han==='丁' && p.door.id==='xiu' && p.spirit.id==='moon')add('ren_dun','Nhân độn');
  }
  return {layers:board.patterns,wuBuYuShi,matches,source:PATTERN_SOURCE,
    coverage:'Sáu tổ hợp can, Thiên/Địa/Nhân độn và Ngũ bất ngộ thời; không phải toàn bộ thập can khắc ứng.'};
}
