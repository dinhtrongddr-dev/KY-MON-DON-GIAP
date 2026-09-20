import {elementLink} from './relationships.mjs';

export const STRENGTH_VERSION='KM-STRENGTH-2.0';
export const STRENGTH_PROFILE='CLASSIC_SEASONAL_SEPARATE_MODELS';

const MONTH_ELEMENT={'寅':'Mộc','卯':'Mộc','巳':'Hỏa','午':'Hỏa','申':'Kim','酉':'Kim','亥':'Thủy','子':'Thủy','辰':'Thổ','戌':'Thổ','丑':'Thổ','未':'Thổ'};
const BRANCHES=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

const STAR_STATUS={same:'tướng',generates:'vượng',generated_by:'phế',controls:'hưu',controlled_by:'tù'};
const STAR_WEIGHT={'vượng':1,'tướng':0.85,'hưu':0.5,'tù':0.3,'phế':0.15};

const DOOR_STATUS={same:'vượng',generates:'tướng',controls:'hưu',controlled_by:'tù',generated_by:'phế'};
const DOOR_WEIGHT={'vượng':1,'tướng':0.82,'hưu':0.5,'tù':0.28,'phế':0.15};

const PALACE_STATUS={same:'vượng',generated_by:'tướng',generates:'hưu',controls:'tù',controlled_by:'tử'};
const PALACE_WEIGHT={'vượng':1,'tướng':0.8,'hưu':0.5,'tù':0.3,'tử':0.12};
const humanLevel=weight=>weight>=0.8?'mạnh':weight>=0.6?'khá mạnh':weight>=0.4?'trung bình':weight>=0.2?'yếu':'rất yếu';

export const LONGEVITY_STAGES=Object.freeze(['trường_sinh','mộc_dục','quan_đới','lâm_quan','đế_vượng','suy','bệnh','tử','mộ','tuyệt','thai','dưỡng']);
const LONGEVITY_HAN=['長生','沐浴','冠帶','臨官','帝旺','衰','病','死','墓','絕','胎','養'];
const LONGEVITY_VI=['Trường Sinh','Mộc Dục','Quan Đới','Lâm Quan','Đế Vượng','Suy','Bệnh','Tử','Mộ','Tuyệt','Thai','Dưỡng'];
const LONGEVITY_WEIGHT=[0.72,0.45,0.68,0.9,1,0.48,0.3,0.15,0.22,0.1,0.35,0.55];
const LONGEVITY_BAND=['growing','unstable','maturing','strong','peak','declining','weak','inactive','stored','exhausted','emerging','preparing'];
const LONGEVITY_MEANING=[
  'Khí đang hình thành và có đà phát triển.','Khí mới hình thành nhưng chưa ổn định, dễ bị môi trường làm lệch.',
  'Khí đang định hình, có thể dùng nhưng vẫn cần củng cố.','Khí đủ lực để đảm nhiệm và chuyển thành hành động.',
  'Khí ở mức phát huy mạnh nhất trong chu kỳ, nhưng không tự thắng các điều kiện cản trực tiếp.','Khí đã qua đỉnh, vẫn dùng được nhưng sức duy trì giảm.',
  'Khí yếu, cần hỗ trợ hoặc giảm tải trước khi giao vai trò quyết định.','Khí rất thấp ở chu kỳ này; không nên dùng riêng làm trục khẳng định.',
  'Khí thiên về cất giữ/khóa lại; phù hợp thu hồi, bảo toàn hoặc chờ mở khóa hơn ép tiến.','Khí gần như tách khỏi chu kỳ đang vận hành; cần nguồn kích hoạt khác.',
  'Khí mới manh nha, chưa đủ để coi là kết quả đã thành hình.','Khí đang được nuôi và chuẩn bị, hợp tích lũy hơn đòi kết quả ngay.'
];

const LONGEVITY_START=Object.freeze({'甲':'亥','乙':'午','丙':'寅','丁':'酉','戊':'寅','己':'酉','庚':'巳','辛':'子','壬':'申','癸':'卯'});
const isYangStem=stem=>['甲','丙','戊','庚','壬'].includes(stem);
const mod=(n,m)=>((n%m)+m)%m;

export function stemLongevity(stem,branch){
  const start=BRANCHES.indexOf(LONGEVITY_START[stem]),at=BRANCHES.indexOf(branch);
  if(start<0||at<0)throw new Error('Can/Chi không hợp lệ cho Thập Nhị Trường Sinh.');
  const index=isYangStem(stem)?mod(at-start,12):mod(start-at,12);
  return {stem,branch,index,id:LONGEVITY_STAGES[index],han:LONGEVITY_HAN[index],vi:LONGEVITY_VI[index],
    weight:LONGEVITY_WEIGHT[index],band:LONGEVITY_BAND[index],meaning:LONGEVITY_MEANING[index],
    direction:isYangStem(stem)?'thuận':'nghịch',
    source:'Khâm Định Cổ Kim Đồ Thư Tập Thành · Trường Sinh; dương thuận âm nghịch'};
}

export function seasonalStrength(board,palace) {
  const monthBranch=board.pillars.month.branch.han,monthElement=MONTH_ELEMENT[monthBranch];
  const starRelation=elementLink(palace.star.element,monthElement);
  const doorRelation=palace.door?elementLink(palace.door.element,monthElement):null;
  const palaceRelation=elementLink(palace.element,monthElement);
  const stems=palace.heavenStems.map((stem,index)=>{
    const life=stemLongevity(stem.han,monthBranch);
    const palaceSupport=elementLink(stem.element,palace.element);
    return {stem:stem.han,element:stem.element,carried:index>0,longevity:life,palaceSupport,
      capacityWeight:Number((0.75*life.weight+0.25*({same:0.8,generated_by:1,generates:0.55,controls:0.45,controlled_by:0.2}[palaceSupport.kind]??0.5)).toFixed(3)),
      convention:'Pha Can theo chi tháng + quan hệ Can–Cung; không phải cùng công thức với Cửu Tinh/Bát Môn.'};
  });
  const starStatus=STAR_STATUS[starRelation.kind],doorStatus=doorRelation?DOOR_STATUS[doorRelation.kind]:null,palaceStatus=PALACE_STATUS[palaceRelation.kind];
  return {
    version:STRENGTH_VERSION,profile:STRENGTH_PROFILE,monthBranch,monthElement,
    palaceMonthRelation:palaceRelation,doorMonthRelation:doorRelation,
    star:{element:palace.star.element,status:starStatus,weight:STAR_WEIGHT[starStatus],level:humanLevel(STAR_WEIGHT[starStatus]),
      convention:'Cửu Tinh theo Yên Ba Điếu Tẩu Ca: đồng hành=tướng, sinh tháng=vượng, tháng sinh=phế, khắc tháng=hưu, tháng khắc=tù.',
      source:'https://zh.wikisource.org/wiki/煙波釣叟歌'},
    door:doorRelation?{element:palace.door.element,status:doorStatus,weight:DOOR_WEIGHT[doorStatus],level:humanLevel(DOOR_WEIGHT[doorStatus]),
      convention:'Bát Môn dư khí theo mùa: đương thời=vượng, môn sinh tháng=tướng, môn khắc tháng=hưu, tháng khắc môn=tù, tháng sinh môn=phế.',
      source:'奇門遁甲統宗卷十一 / 御定奇門遁甲寶鑒·釋氣應'}:null,
    palace:{element:palace.element,status:palaceStatus,weight:PALACE_WEIGHT[palaceStatus],level:humanLevel(PALACE_WEIGHT[palaceStatus]),
      convention:'Mức môi trường theo ngũ hành cung so với khí tháng; đây là lớp tổng hợp của app, không thay thế công thức Tinh/Môn.',
      source:'app_synthesis_five_phase_season_relation'},
    stems,
    convention:'KM-STRENGTH-2.0 giữ riêng mô hình Tinh, Môn, Can và môi trường cung; không dùng một bảng chung cho tất cả.',
    sources:[
      'https://zh.wikisource.org/wiki/煙波釣叟歌',
      'https://ctext.org/wiki.pl?chapter=473804&if=gb',
      'https://ctext.org/wiki.pl?chapter=250961&if=gb',
      'https://zh.wikisource.org/wiki/Page:Gujin_Tushu_Jicheng,_Volume_041_(1700-1725).djvu/86'
    ]
  };
}

const basisKind=role=>{
  const b=role.basis||'';
  if(b.includes(':star:'))return 'star';
  if(b.includes(':door:'))return 'door';
  if(b.includes(':stem:')||role.stem)return 'stem';
  if(['opportunity','quote','money','execution','payment'].includes(role.id))return 'door';
  if(['learning','health_issue','health_support','property_ground'].includes(role.id))return 'star';
  return role.stem?'stem':'cluster';
};

export function roleStrength(role,palaceStrength){
  const kind=basisKind(role);
  if(kind==='stem'){
    const row=palaceStrength.stems.find(s=>s.stem===role.stem);
    if(row)return {roleId:role.id,kind:'stem',weight:row.capacityWeight,level:humanLevel(row.capacityWeight),status:row.longevity.vi,band:row.longevity.band,
      meaning:row.longevity.meaning,stem:row.stem,longevity:row.longevity,palaceSupport:row.palaceSupport};
  }
  if(kind==='door'&&palaceStrength.door)return {roleId:role.id,kind:'door',weight:palaceStrength.door.weight,level:palaceStrength.door.level,status:palaceStrength.door.status,
    band:palaceStrength.door.weight>=0.8?'strong':palaceStrength.door.weight>=0.45?'usable':'weak',
    meaning:palaceStrength.door.weight>=0.8?'Môn đang có khí mùa đủ mạnh để phát huy chức năng.':palaceStrength.door.weight>=0.45?'Môn dùng được nhưng cần điều kiện hỗ trợ.':'Môn đang yếu theo mùa; không nên dùng riêng để nâng kết luận.'};
  if(kind==='star')return {roleId:role.id,kind:'star',weight:palaceStrength.star.weight,level:palaceStrength.star.level,status:palaceStrength.star.status,
    band:palaceStrength.star.weight>=0.8?'strong':palaceStrength.star.weight>=0.45?'usable':'weak',
    meaning:palaceStrength.star.weight>=0.8?'Tinh có khí mùa mạnh.':palaceStrength.star.weight>=0.45?'Tinh còn lực sử dụng nhưng không ở mức mạnh.':'Tinh yếu theo mùa; tác dụng biểu tượng cần được hạ trọng số.'};
  const weight=Number((0.35*palaceStrength.star.weight+0.4*(palaceStrength.door?.weight??0.5)+0.25*palaceStrength.palace.weight).toFixed(3));
  return {roleId:role.id,kind:'cluster',weight,level:humanLevel(weight),status:'tổng hợp',band:weight>=0.78?'strong':weight>=0.45?'usable':'weak',
    meaning:weight>=0.78?'Cụm cung có đủ khí mùa để biểu tượng phát huy rõ.':weight>=0.45?'Cụm cung có lực trung bình; cần bằng chứng cấu trúc và quan hệ hỗ trợ.':'Cụm cung yếu theo mùa; không nên phóng đại một ký hiệu thuận.'};
}

export function aggregateRoleStrength(roles,palaceStrength){
  const rows=roles.map(r=>roleStrength(r,palaceStrength));
  const primaries=rows.filter(row=>roles.find(r=>r.id===row.roleId)?.yongshenTier==='primary');
  const source=primaries.length?primaries:rows;
  const weight=source.length?Math.max(...source.map(r=>r.weight)):Number((0.35*palaceStrength.star.weight+0.4*(palaceStrength.door?.weight??0.5)+0.25*palaceStrength.palace.weight).toFixed(3));
  return {weight:Number(weight.toFixed(3)),level:humanLevel(weight),band:weight>=0.78?'strong':weight>=0.45?'usable':'weak',roles:rows,
    basis:primaries.length?'primary_yongshen_strength':'active_role_strength',
    meaning:'Mức lực dùng để xếp ưu tiên giải thích; không phải xác suất thành công.'};
}
