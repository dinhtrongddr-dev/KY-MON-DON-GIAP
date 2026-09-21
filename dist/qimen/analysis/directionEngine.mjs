import {PALACES,BRANCHES} from '../core/palace.mjs';
import {monthGeneralForTerm} from './formationEngine.mjs';

export const DIRECTION_VERSION='KM-DIRECTION-4.0';
export const DIRECTION_PROFILE='CLASSICAL_DIRECTION_BOUNDED';
export const PRIVATE_DOOR_SOURCE='奇門法竅·地私門';
export const TING_BAI_SOURCE='御定奇門遁甲寶鑒·釋亭亭白奸';
export const THREE_VICTORY_SOURCE='奇門法竅卷二·論三勝宮/論五不擊';
export const DIRECTION_CROSSCHECK='遁甲演義卷二 / 遁甲符應經卷下';

const HANS=BRANCHES.map(x=>x.han);
const BRANCH_VI=Object.freeze(Object.fromEntries(BRANCHES.map(x=>[x.han,x.vi])));
const WONDERS=new Set(['乙','丙','丁']);
const DAN_GUI_HOURS=new Set(['辰','巳','午','未','申','酉']);
const YANG_GUI_LANDING=new Set(['亥','子','丑','寅','卯','辰']);
const MENG_BRANCHES=new Set(['寅','巳','申','亥']);
const GUIREN=Object.freeze({
  甲:['丑','未'],戊:['丑','未'],庚:['丑','未'],
  乙:['子','申'],己:['子','申'],
  丙:['亥','酉'],丁:['亥','酉'],
  壬:['巳','卯'],癸:['巳','卯'],
  辛:['午','寅']
});
const TWELVE_GENERALS=Object.freeze([
  {id:'guiren',name:'Quý Nhân'},{id:'tengshe',name:'Đằng Xà'},{id:'zhuque',name:'Chu Tước'},
  {id:'liuhe',name:'Lục Hợp'},{id:'gouchen',name:'Câu Trần'},{id:'qinglong',name:'Thanh Long'},
  {id:'tiankong',name:'Thiên Không'},{id:'baihu',name:'Bạch Hổ'},{id:'taichang',name:'Thái Thường'},
  {id:'xuanwu',name:'Huyền Vũ'},{id:'taiyin',name:'Thái Âm'},{id:'tianhou',name:'Thiên Hậu'}
]);
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const mod=(n,m)=>((n%m)+m)%m;
const branchIndex=han=>HANS.indexOf(han);
const branchAt=i=>HANS[mod(i,12)];
const branchPalace=han=>{
  const idx=branchIndex(han);
  return Object.values(PALACES).find(p=>p.branches?.includes(idx))?.number??null;
};
const directionFor=(palaces,palace)=>palaces.find(p=>p.number===palace)?.direction||null;

export function overlayLanding(board,targetBranch,palaces=board.palaces.filter(p=>p.number!==5)){
  const general=monthGeneralForTerm(board.term?.id),hour=board.pillars?.hour?.branch?.han;
  if(!general||branchIndex(hour)<0||branchIndex(targetBranch)<0)return null;
  const landing=branchAt(branchIndex(hour)+(branchIndex(targetBranch)-branchIndex(general)));
  const palace=branchPalace(landing);
  return freeze({targetBranch,monthGeneral:general,hourBranch:hour,landingBranch:landing,landingBranchVi:BRANCH_VI[landing],
    palace,direction:directionFor(palaces,palace)});
}

export function earthPrivateDoors(board,palaces=board.palaces.filter(p=>p.number!==5)){
  const dayStem=board.pillars?.day?.stem?.han,hour=board.pillars?.hour?.branch?.han,general=monthGeneralForTerm(board.term?.id);
  const pair=GUIREN[dayStem];
  if(!pair||!general||branchIndex(hour)<0)return freeze({status:'unsupported',doors:[]});
  const guiMode=DAN_GUI_HOURS.has(hour)?'dan_gui':'mu_gui',guiSkyBranch=pair[guiMode==='dan_gui'?0:1];
  const gui=overlayLanding(board,guiSkyBranch,palaces);
  if(!gui)return freeze({status:'unsupported',doors:[]});
  const forward=YANG_GUI_LANDING.has(gui.landingBranch),sign=forward?1:-1,start=branchIndex(gui.landingBranch);
  const wanted=new Set(['liuhe','taiyin','taichang']);
  const doors=TWELVE_GENERALS.map((g,index)=>{
    if(!wanted.has(g.id))return null;
    const landing=branchAt(start+sign*index),palace=branchPalace(landing);
    return {id:g.id,name:g.name,generalIndex:index,landingBranch:landing,landingBranchVi:BRANCH_VI[landing],palace,direction:directionFor(palaces,palace),
      verdictEligible:false,rankingEligible:false,
      plainMeaning:g.id==='liuhe'?'Hướng thiên về phối hợp, kết nối và rút lui có thỏa thuận; không tự bảo đảm kết quả.'
        :g.id==='taiyin'?'Hướng thiên về kín đáo, nghiên cứu và xử lý việc nhạy cảm; phải tôn trọng quyền riêng tư và pháp luật.'
        :'Hướng thiên về ổn định, hậu cần và duy trì nguồn lực; không thay kiểm tra điều kiện thực địa.'};
  }).filter(Boolean);
  return freeze({status:'ok',dayStem,hourBranch:hour,monthGeneral:general,guiMode,guiSkyBranch,guiLandingBranch:gui.landingBranch,
    rotation:forward?'forward':'reverse',doors,source:PRIVATE_DOOR_SOURCE,
    meaning:'Địa Tư Môn là lớp phương vị kín/ổn định theo Quý Nhân–mười hai Thiên Tướng; dùng để mô tả kiểu hành động, không phải bảo đảm an toàn hoặc thành công.'});
}

export function tingTingBaiJian(board,palaces=board.palaces.filter(p=>p.number!==5)){
  const ting=overlayLanding(board,'子',palaces);
  if(!ting)return freeze({status:'unsupported',tingTing:null,baiJian:null});
  const candidates=['寅','午','戌'].map(target=>overlayLanding(board,target,palaces)).filter(Boolean);
  const baiCandidates=candidates.filter(x=>MENG_BRANCHES.has(x.landingBranch));
  const bai=baiCandidates.length===1?baiCandidates[0]:null;
  return freeze({status:bai?'ok':'ambiguous',
    tingTing:{id:'ting_ting',name:'Đình Đình',skyBranch:'子',...ting,verdictEligible:false,rankingEligible:false,
      plainMeaning:'Dùng như trục đứng/điểm tựa phương vị truyền thống; không tự mang nghĩa thắng lợi.'},
    baiJian:bai?{id:'bai_jian',name:'Bạch Gian',skyBranch:bai.targetBranch,...bai,verdictEligible:false,rankingEligible:false,
      plainMeaning:'Dùng như trục hướng ra ngoài/đối diện để đọc thế phương vị; không chuyển thành khuyến nghị đối đầu.'}:null,
    candidateCount:baiCandidates.length,source:TING_BAI_SOURCE,
    variantNote:'KM-DIRECTION-4.0 dùng cách giải của 御定奇門遁甲寶鑒: Thần Hậu (Tý) lâm đâu là Đình Đình; Công Tào/Dần, Thắng Quang/Ngọ, Thiên Khôi/Tuất lâm một trong bốn Mạnh là Bạch Gian. Dị bản theo ngày/tháng trong sách khác chỉ lưu provenance.'});
}

export function heavenHorseAndGang(board,palaces=board.palaces.filter(p=>p.number!==5)){
  const horse=overlayLanding(board,'卯',palaces),gang=overlayLanding(board,'辰',palaces);
  return freeze({status:horse&&gang?'ok':'unsupported',
    heavenHorse:horse?{id:'heaven_horse',name:'Thiên Mã phương',skyBranch:'卯',...horse,verdictEligible:false,rankingEligible:false,
      plainMeaning:'Thái Xung/Mão sau phép Nguyệt Tướng; chỉ là gợi ý hướng di chuyển truyền thống, không chứng minh tuyến đường an toàn.'}:null,
    heavenGang:gang?{id:'heaven_gang',name:'Thiên Cương phương',skyBranch:'辰',...gang,verdictEligible:false,rankingEligible:false,
      plainMeaning:'Thiên Cương/Thìn sau phép Nguyệt Tướng; chỉ dùng như lớp phương vị dự phòng, không thay điều kiện thực địa.'}:null,
    source:PRIVATE_DOOR_SOURCE});
}

const hostCenter=n=>n===5?2:n;
export function threeVictoriesFiveNoStrike(board,palaces=board.palaces.filter(p=>p.number!==5)){
  const tianYiRaw=board.dun==='yang'?board.zhiFu?.palace:board.xun?.instrumentPalace;
  const tianYiPalace=hostCenter(tianYiRaw);
  const tianYi=palaces.find(p=>p.number===tianYiPalace)||null;
  const heaven9=palaces.find(p=>p.spirit?.id==='heaven9')||null;
  const earth9=palaces.find(p=>p.spirit?.id==='earth9')||null;
  const sheng=palaces.find(p=>p.door?.id==='sheng')||null;
  const zhiShiPalace=hostCenter(board.zhiShi?.palace),zhiShi=palaces.find(p=>p.number===zhiShiPalace)||null;
  const shengWonder=sheng?.heavenStems?.find(s=>WONDERS.has(s.han))||null;
  const victories=[
    tianYi&&{id:'victory_tianyi',name:'Thiên Ất cung',palace:tianYi.number,direction:tianYi.direction,qualified:true,
      basis:board.dun==='yang'?'heavenly_zhi_fu':'earth_instrument',
      plainMeaning:'Thế đứng truyền thống gắn với Trực Phù/Thiên Ất; dùng để mô tả vị thế chủ động, không phải cam kết thắng.'},
    heaven9&&{id:'victory_nine_heaven',name:'Cửu Thiên cung',palace:heaven9.number,direction:heaven9.direction,qualified:true,
      plainMeaning:'Thế đứng thiên về tầm nhìn, độ cao và chủ động; không thay đánh giá rủi ro thực tế.'},
    sheng&&{id:'victory_life_door',name:'Sinh Môn hợp Tam Kỳ',palace:sheng.number,direction:sheng.direction,qualified:!!shengWonder,
      wonder:shengWonder?.han||null,
      plainMeaning:shengWonder?'Sinh Môn đồng cung một Tam Kỳ, phù hợp làm điểm tựa hành động trong phạm vi truyền thống.'
        :'Có Sinh Môn nhưng chưa đồng cung Tam Kỳ, nên không đủ điều kiện gọi Tam Thắng thứ ba.'}
  ].filter(Boolean).map(x=>({...x,verdictEligible:false,rankingEligible:false}));
  const noStrike=[
    tianYi&&{id:'no_strike_tianyi',name:'Thiên Ất',palace:tianYi.number,direction:tianYi.direction},
    heaven9&&{id:'no_strike_nine_heaven',name:'Cửu Thiên',palace:heaven9.number,direction:heaven9.direction},
    sheng&&{id:'no_strike_life_door',name:'Sinh Môn',palace:sheng.number,direction:sheng.direction},
    earth9&&{id:'no_strike_nine_earth',name:'Cửu Địa',palace:earth9.number,direction:earth9.direction},
    zhiShi&&{id:'no_strike_duty_door',name:'Trực Sử',palace:zhiShi.number,direction:zhiShi.direction}
  ].filter(Boolean).map(x=>({...x,verdictEligible:false,rankingEligible:false,
    plainMeaning:'Cổ pháp xếp đây vào nhóm không nên đối đầu trực diện. Ứng dụng hiện đại chỉ dùng như cảnh báo tránh ép thế/xung đột; không phải chỉ dẫn chiến đấu.'}));
  return freeze({status:victories.length>=2&&noStrike.length===5?'ok':'partial',dun:board.dun,tianYiRawPalace:tianYiRaw,tianYiPalace,
    victories,noStrike,source:THREE_VICTORY_SOURCE,
    variantNote:'Tam Thắng thứ nhất dùng Thiên bàn Trực Phù ở Dương Độn, địa bàn Lục Nghi ẩn Giáp ở Âm Độn. Ngũ Bất Kích dùng 5 nhóm: Thiên Ất, Cửu Thiên, Sinh Môn, Cửu Địa, Trực Sử; không cộng Trực Phù lần nữa như một phiếu riêng.'});
}

export function directionMarkersForPalace(profile,palace){
  const p=profile?.byPalace?.[palace];if(!p)return [];
  return freeze([
    ...p.privateDoors.map(x=>({id:'private_'+x.id,name:'Địa Tư Môn · '+x.name,family:'earth_private_doors',palace,plainMeaning:x.plainMeaning,uses:['discreet_direction']})),
    ...p.tingBai.map(x=>({id:x.id,name:x.name,family:'tingting_baijian',palace,plainMeaning:x.plainMeaning,uses:['strategic_axis']})),
    ...p.horseGang.map(x=>({id:x.id,name:x.name,family:'heaven_horse_gang',palace,plainMeaning:x.plainMeaning,uses:['directional_overlay']})),
    ...p.victories.filter(x=>x.qualified).map(x=>({id:x.id,name:'Tam Thắng · '+x.name,family:'three_victories',palace,plainMeaning:x.plainMeaning,uses:['supportive_stance']})),
    ...p.noStrike.map(x=>({id:x.id,name:'Ngũ Bất Kích · '+x.name,family:'five_no_strike',palace,plainMeaning:x.plainMeaning,uses:['avoid_direct_confrontation']}))
  ]);
}

export function analyzeStrategicDirections(board,palaces=board.palaces.filter(p=>p.number!==5)){
  const privateDoors=earthPrivateDoors(board,palaces),tingBai=tingTingBaiJian(board,palaces),horseGang=heavenHorseAndGang(board,palaces),
    victory=threeVictoriesFiveNoStrike(board,palaces);
  const byPalace=Object.fromEntries(palaces.map(p=>[p.number,{
    privateDoors:privateDoors.doors.filter(x=>x.palace===p.number),
    tingBai:[tingBai.tingTing,tingBai.baiJian].filter(x=>x?.palace===p.number),
    horseGang:[horseGang.heavenHorse,horseGang.heavenGang].filter(x=>x?.palace===p.number),
    victories:victory.victories.filter(x=>x.palace===p.number),
    noStrike:victory.noStrike.filter(x=>x.palace===p.number)
  }]));
  return freeze({version:DIRECTION_VERSION,profile:DIRECTION_PROFILE,byPalace,
    earthPrivateDoors:privateDoors,tingTingBaiJian:tingBai,heavenHorseGang:horseGang,threeVictoriesFiveNoStrike:victory,
    provenance:{primary:[PRIVATE_DOOR_SOURCE,TING_BAI_SOURCE,THREE_VICTORY_SOURCE],crossCheck:DIRECTION_CROSSCHECK,
      variantPolicy:'one_canonical_formula_per_rule_family_variants_are_metadata'},
    coverage:{earthPrivateDoors:3,tingTing:1,baiJian:1,heavenHorse:1,heavenGang:1,threeVictories:3,fiveNoStrike:5},
    limitations:[
      'KM-DIRECTION-4.0 là lớp phương vị chiến lược; không tham gia evidenceScore, primaryJudgment hoặc rank hiện có.',
      'Địa Tư Môn dùng cách phân 旦貴/暮貴 và thuận-nghịch ghi trong 奇門法竅, không trộn cách chia ngày/đêm của truyền bản Lục Nhâm khác.',
      'Bạch Gian dùng cách giải chuẩn hóa của 御定奇門遁甲寶鑒; dị bản theo ngày/tháng chỉ lưu provenance.',
      'Tam Thắng/Ngũ Bất Kích vốn dùng ngôn ngữ quân sự. App chỉ chuyển thành thế đứng, hỗ trợ hoặc tránh đối đầu trực diện; không cung cấp chỉ dẫn bạo lực.',
      'Không lớp nào chứng minh an toàn tuyến đường, địa hình, pháp lý, sức khỏe, thời tiết hay xác suất thành công.'
    ]});
}
