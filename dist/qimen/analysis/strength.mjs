import {elementLink} from './relationships.mjs';
const MONTH_ELEMENT={'寅':'Mộc','卯':'Mộc','巳':'Hỏa','午':'Hỏa','申':'Kim','酉':'Kim','亥':'Thủy','子':'Thủy','辰':'Thổ','戌':'Thổ','丑':'Thổ','未':'Thổ'};
// Nine-star seasonal method in Yan Bo Diao Sou Ge is NOT ordinary element strength.
const STAR_STATUS={same:'tướng',generates:'vượng',generated_by:'phế',controls:'hưu',controlled_by:'tù'};
export function seasonalStrength(board,palace) {
  const monthElement=MONTH_ELEMENT[board.pillars.month.branch.han];
  return {monthBranch:board.pillars.month.branch.han,monthElement,
    palaceMonthRelation:elementLink(palace.element,monthElement),
    doorMonthRelation:palace.door?elementLink(palace.door.element,monthElement):null,
    star:{element:palace.star.element,status:STAR_STATUS[elementLink(palace.star.element,monthElement).kind]},
    convention:'Cửu Tinh theo Yên Ba Điếu Tẩu Ca; tháng tiết khí, Thìn–Tuất–Sửu–Mùi quy Thổ. Không dùng bảng này cho Can/Môn/cung; không áp phép Thổ vượng 18 ngày.',
    source:'https://zh.wikisource.org/wiki/煙波釣叟歌'};
}
