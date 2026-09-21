export const FORMATION_VERSION='KM-FORMATION-3.0';
export const FORMATION_PROFILE='QIMEN_FAQIAO_STRATEGIC_BOUNDED';
export const FORMATION_SOURCE='奇門法竅卷六·吉格注釋';
export const YANYI_SOURCE='遁甲演義卷二·奇門吉格/三詐五假/天三門地四戶';
export const SECRET_COMPENDIUM_SOURCE='奇門遁甲秘笈大全·九遁變化法/論天門地戶';

const GOOD_DOORS=new Set(['kai','xiu','sheng']);
const WONDERS=new Set(['乙','丙','丁']);
const BRANCHES=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const BRANCH_VI=Object.freeze({'子':'Tý','丑':'Sửu','寅':'Dần','卯':'Mão','辰':'Thìn','巳':'Tỵ','午':'Ngọ','未':'Mùi','申':'Thân','酉':'Dậu','戌':'Tuất','亥':'Hợi'});
const BRANCH_PALACE=Object.freeze({'子':1,'丑':8,'寅':8,'卯':3,'辰':4,'巳':4,'午':9,'未':2,'申':2,'酉':7,'戌':6,'亥':6});
const TERM_MONTH_GENERAL=Object.freeze({
  dahan:'子',lichun:'子',yushui:'亥',jingzhe:'亥',chunfen:'戌',qingming:'戌',guyu:'酉',lixia:'酉',
  xiaoman:'申',mangzhong:'申',xiazhi:'未',xiaoshu:'未',dashu:'午',liqiu:'午',chushu:'巳',bailu:'巳',
  qiufen:'辰',hanlu:'辰',shuangjiang:'卯',lidong:'卯',xiaoxue:'寅',daxue:'寅',dongzhi:'丑',xiaohan:'丑'
});
const HEAVEN_GATE_TARGETS=Object.freeze([
  {id:'tai_chong',name:'Thái Xung',branch:'卯'},
  {id:'xiao_ji',name:'Tiểu Cát',branch:'未'},
  {id:'cong_kui',name:'Tòng Khôi',branch:'酉'}
]);
const EARTH_DOOR_TARGETS=Object.freeze([
  {id:'chu',name:'Trừ',offset:1},
  {id:'ding',name:'Định',offset:4},
  {id:'wei',name:'Nguy',offset:7},
  {id:'kai',name:'Khai',offset:10}
]);
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const mod=(n,m)=>((n%m)+m)%m;
const branchAt=i=>BRANCHES[mod(i,12)];
const palaceDirection=(palaces,n)=>palaces.find(p=>p.number===n)?.direction||null;

function stemRows(p,allowed){
  return p.heavenStems.map((s,index)=>({stem:s.han,carried:index>0,pair:p.stemPairs?.[index]||null})).filter(x=>allowed.has(x.stem));
}
function roleIdsForPalace(roles,palace){return roles.filter(r=>r.palace===palace).map(r=>r.id);}
function roleIdsForStems(roles,palace,stems){
  const set=new Set(stems);return roles.filter(r=>r.palace===palace&&set.has(r.stem)).map(r=>r.id);
}
function blockersFor(rows,p,{punishment=false,tomb=false,pressure=false}={}){
  const out=[];
  if(pressure&&p.conditions?.doorPressure)out.push('door_pressure');
  if(tomb&&rows.some(x=>(x.pair?.tomb??x.pair?.wonderTomb)))out.push('stem_tomb');
  if(punishment&&rows.some(x=>x.pair?.punishment))out.push('punishment');
  return [...new Set(out)];
}
function record({id,name,family,p,rows=[],plainMeaning,uses=[],source=FORMATION_SOURCE,variant='primary',blockers=[],
  qualificationStatus='complete',qualificationLimitations=[]}){
  const qualified=blockers.length===0&&qualificationStatus==='complete';
  return freeze({
    id,name,family,palace:p.number,door:p.door.id,spirit:p.spirit.id,
    heavenStems:rows.map(r=>({stem:r.stem,carried:r.carried})),
    earthStem:p.earthStem.han,variant,source,qualified,qualificationStatus,qualificationLimitations,blockers,
    verdictEligible:false,rankingEligible:false,plainMeaning,uses,
    meaning:'Cách cục chiến lược chỉ mô tả kiểu hành động phù hợp với cụm tượng tại cung; không phải xác suất, bên thắng hay bảo đảm thành công.'
  });
}

function threeDeceptions(p){
  if(!GOOD_DOORS.has(p.door.id))return [];
  const rows=stemRows(p,WONDERS);if(!rows.length)return [];
  const map={
    moon:{id:'true_deception',name:'Chân Trá',plainMeaning:'Cụm thuận cho chuẩn bị kín, giảm phô bày và xử lý việc nhạy cảm bằng cách mềm.',uses:['discreet_planning','privacy','conciliation']},
    earth9:{id:'heavy_deception',name:'Trọng Trá',plainMeaning:'Cụm thiên về gom người, nguồn lực và củng cố thế trước khi mở rộng hành động.',uses:['resource_mobilization','consolidation','staging']},
    harmony:{id:'rest_deception',name:'Hưu Trá',plainMeaning:'Cụm thiên về phối hợp, hòa giải, thỏa thuận và công việc cần nhiều bên cùng nhịp.',uses:['cooperation','negotiation','agreement']}
  };
  const spec=map[p.spirit.id];if(!spec)return [];
  const structuralWarnings=blockersFor(rows,p,{punishment:true,tomb:true,pressure:true});
  return [record({...spec,family:'three_deceptions',p,rows,blockers:[],plainMeaning:spec.plainMeaning+(structuralWarnings.length?' Tuy nhiên cung này còn có cản cấu trúc nên không được nâng thành tín hiệu quyết định.':'')})];
}

function fiveFakeQualification(rows,p){
  const candidates=rows.map(x=>({stem:x.stem,tombCoverage:'known',tombBlocked:!!(x.pair?.tomb??x.pair?.wonderTomb)}));
  if(p.conditions?.doorPressure)return {blockers:['door_pressure'],qualificationStatus:'complete',qualificationLimitations:[],candidates};
  if(candidates.some(x=>!x.tombBlocked))return {blockers:[],qualificationStatus:'complete',qualificationLimitations:[],candidates};
  return {blockers:['stem_tomb'],qualificationStatus:'complete',qualificationLimitations:[],candidates};
}

function fiveFakes(p){
  const defs=[
    {id:'heaven_fake',name:'Thiên Giả',door:'jing',stems:new Set(['乙','丙','丁']),spirits:new Set(['heaven9']),
      plainMeaning:'Cụm hợp cho trình bày, xin duyệt, công bố hoặc đưa đề xuất ra nơi có thẩm quyền; hiệu quả phụ thuộc nội dung và điều kiện thực tế.',uses:['presentation','petition','public_signal']},
    {id:'earth_fake',name:'Địa Giả',door:'du',stems:new Set(['丁','己','癸']),spirits:new Set(['earth9','moon','harmony']),
      plainMeaning:'Cụm hợp cho ẩn bớt tín hiệu, nghiên cứu, bảo mật, rút về chuẩn bị hoặc xử lý việc phía sau.',uses:['concealment','research','defensive_preparation']},
    {id:'object_fake',name:'Vật Giả',door:'shang',stems:new Set(['丁','己','癸']),spirits:new Set(['harmony']),
      plainMeaning:'Cụm thiên về thu hồi, sửa chữa, tái sử dụng hoặc giao dịch quanh tài sản/vật việc đã có; cần quản trị hao tổn.',uses:['recovery','repair','reuse','trade']},
    {id:'ghost_fake',name:'Quỷ Giả',door:'si',stems:new Set(['丁','己','癸']),spirits:new Set(['earth9']),
      plainMeaning:'Cụm thiên về đóng việc cũ, dọn tồn đọng, xử lý phần kết thúc hoặc hạ tải; không được diễn giải thành điềm tử vong.',uses:['closure','cleanup','decommission']},
    {id:'human_fake',name:'Nhân Giả',door:'fear',stems:new Set(['壬']),spirits:new Set(['heaven9']),
      plainMeaning:'Cụm thiên về truy tìm thông tin, kiểm chứng, điều tra hoặc làm rõ đối tượng đang khó nắm; không dùng để cáo buộc ai.',uses:['search','verification','investigation']}
  ];
  const out=[];
  for(const d of defs){
    if(p.door.id!==d.door||!d.spirits.has(p.spirit.id))continue;
    const rows=stemRows(p,d.stems);if(!rows.length)continue;
    const qualification=fiveFakeQualification(rows,p);
    const earthVariant=d.id==='earth_fake'
      ?({earth9:'qimen_faqiao_primary_earth9',moon:'qimen_faqiao_variant_moon',harmony:'qimen_faqiao_variant_harmony'}[p.spirit.id])
      :null;
    const variant=earthVariant
      ||(d.id==='ghost_fake'?'qimen_faqiao_primary__same_text_calls_related_shen_jia':'qimen_faqiao_primary');
    const uses=d.id==='earth_fake'&&p.spirit.id==='moon'
      ?['reconnaissance','research','private_inquiry']
      :d.id==='earth_fake'&&p.spirit.id==='harmony'
        ?['safe_withdrawal','avoidance','protected_exit']
        :d.uses;
    const plainMeaning=d.id==='earth_fake'&&p.spirit.id==='moon'
      ?'Biến thể Địa Giả dưới Thái Âm: thiên về dò hỏi kín, nghiên cứu và thu thập thông tin riêng tư; không dùng để xâm phạm quyền riêng tư hay giám sát trái phép.'
      :d.id==='earth_fake'&&p.spirit.id==='harmony'
        ?'Biến thể Địa Giả dưới Lục Hợp: thiên về rút lui an toàn, tránh xung đột và tìm lối thoát có phối hợp; không bảo đảm an toàn thực địa.'
        :d.plainMeaning;
    out.push({...record({...d,family:'five_fakes',p,rows,blockers:qualification.blockers,variant,uses,plainMeaning,
      qualificationStatus:qualification.qualificationStatus,qualificationLimitations:qualification.qualificationLimitations}),
      qualificationCandidates:qualification.candidates});
  }
  return out;
}

function nineEscapes(p){
  const out=[];
  const add=(spec,rows,variant='primary')=>{
    const blockers=blockersFor(rows,p,{punishment:true,tomb:true,pressure:true});
    out.push(record({...spec,family:'nine_escapes',p,rows,blockers,variant}));
  };
  const yi=stemRows(p,new Set(['乙'])),bing=stemRows(p,new Set(['丙'])),ding=stemRows(p,new Set(['丁']));
  if(p.door.id==='sheng'&&bing.length&&p.earthStem.han==='丁')add({
    id:'heaven_escape',name:'Thiên Độn',plainMeaning:'Cụm thuận cho mở việc, trình đề xuất, tiếp cận cấp quyết định hoặc triển khai một bước có tính công khai khi nền tảng đã sẵn.',uses:['launch','petition','advance','public_action']
  },bing);
  if(p.door.id==='kai'&&yi.length&&p.earthStem.han==='己')add({
    id:'earth_escape',name:'Địa Độn',plainMeaning:'Cụm thuận cho xây nền, bố trí nguồn lực, tài sản, cơ sở vật chất hoặc chuẩn bị hậu cần trước khi mở rộng.',uses:['build','property','logistics','stabilize']
  },yi);
  if(p.door.id==='xiu'&&ding.length&&p.spirit.id==='moon')add({
    id:'human_escape',name:'Nhân Độn',plainMeaning:'Cụm thuận cho phối hợp kín đáo, hòa giải, thương lượng và tìm người phù hợp hơn là đối đầu trực diện.',uses:['negotiation','cooperation','relationship','discreet_contact']
  },ding);
  if(p.door.id==='sheng'&&bing.length&&p.spirit.id==='heaven9')add({
    id:'spirit_escape',name:'Thần Độn',plainMeaning:'Cụm thiên về hành động có tầm nhìn, mở phạm vi hoặc triển khai chiến lược cần sự chủ động cao; không mang nghĩa trợ lực siêu nhiên.',uses:['strategic_initiative','expansion','high_visibility_action']
  },bing);
  if(p.door.id==='du'&&yi.length&&p.spirit.id==='earth9')add({
    id:'ghost_escape',name:'Quỷ Độn',plainMeaning:'Cụm thiên về điều tra kín, thu thập thông tin, chuẩn bị hậu trường và giữ kín phương án; không mang nghĩa ma quỷ thực tế.',uses:['intelligence','research','concealment','quiet_preparation']
  },yi);
  if(GOOD_DOORS.has(p.door.id)&&yi.length&&p.number===4)add({
    id:'wind_escape',name:'Phong Độn',plainMeaning:'Cụm thiên về di chuyển, truyền đạt, thay đổi cách tiếp cận và lan tỏa thông tin; cần kiểm tra điều kiện đi lại thực tế.',uses:['movement','communication','adaptation','travel']
  },yi);
  if(GOOD_DOORS.has(p.door.id)&&yi.length&&p.earthStem.han==='辛')add({
    id:'cloud_escape',name:'Vân Độn',plainMeaning:'Cụm thiên về che bớt tín hiệu, chuẩn bị theo lớp và triển khai có độ phủ; phù hợp khi chưa nên phô toàn bộ kế hoạch.',uses:['staging','concealment','gradual_rollout']
  },yi);
  if(GOOD_DOORS.has(p.door.id)&&yi.length&&p.number===1)add({
    id:'dragon_escape',name:'Long Độn',plainMeaning:'Cụm thiên về dòng chảy, vận chuyển, giao thông hoặc công việc phụ thuộc tuyến/kênh; cần kiểm tra điều kiện thực địa.',uses:['logistics','water_or_route','movement','flow']
  },yi);
  if(p.number===8&&p.door.id==='xiu'&&yi.length&&p.earthStem.han==='辛')add({
    id:'tiger_escape',name:'Hổ Độn',plainMeaning:'Cụm thiên về giữ điểm hiểm, bảo vệ ranh giới và kiểm soát rủi ro trước khi tiến; hợp phòng thủ hơn liều mở rộng.',uses:['defense','boundary','risk_control','terrain']
  },yi,'qimen_faqiao_primary');
  if(p.door.id==='sheng'&&bing.length&&p.earthStem.han==='辛')add({
    id:'tiger_escape',name:'Hổ Độn',plainMeaning:'Dị bản Hổ Độn nhấn hành động quyết liệt có kiểm soát trên nền Sinh Môn; vẫn phải ưu tiên an toàn và cản cấu trúc.',uses:['controlled_advance','risk_control','execution']
  },bing,'qimen_faqiao_alternate');
  return out;
}

export function monthGeneralForTerm(termId){
  return TERM_MONTH_GENERAL[termId]||null;
}
export function heavenThreeGates(board,palaces=board.palaces.filter(p=>p.number!==5)){
  const general=monthGeneralForTerm(board.term?.id);
  if(!general)return freeze({status:'unsupported_term',termId:board.term?.id||null,monthGeneral:null,gates:[]});
  const hour=board.pillars.hour.branch.han,hourIndex=BRANCHES.indexOf(hour),generalIndex=BRANCHES.indexOf(general);
  const gates=HEAVEN_GATE_TARGETS.map(t=>{
    const landing=branchAt(hourIndex+(BRANCHES.indexOf(t.branch)-generalIndex));
    const palace=BRANCH_PALACE[landing];
    return {id:t.id,name:t.name,skyBranch:t.branch,monthGeneral:general,hourBranch:hour,landingBranch:landing,landingBranchVi:BRANCH_VI[landing],
      palace,direction:palaceDirection(palaces,palace),verdictEligible:false,rankingEligible:false};
  });
  return freeze({status:'ok',termId:board.term.id,monthGeneral:general,hourBranch:hour,gates,
    source:SECRET_COMPENDIUM_SOURCE,
    meaning:'Thiên Tam Môn là lớp phương vị truyền thống cho xuất hành/đi hướng; không chứng minh tuyến đường an toàn hoặc kết quả thành công.'});
}
export function earthFourDoors(board,palaces=board.palaces.filter(p=>p.number!==5)){
  const hour=board.pillars.hour.branch.han,hourIndex=BRANCHES.indexOf(hour),monthBranch=board.pillars.month?.branch?.han||null;
  const doors=EARTH_DOOR_TARGETS.map(t=>{
    const landing=branchAt(hourIndex+t.offset),palace=BRANCH_PALACE[landing];
    return {id:t.id,name:t.name,offset:t.offset,hourBranch:hour,landingBranch:landing,landingBranchVi:BRANCH_VI[landing],
      palace,direction:palaceDirection(palaces,palace),verdictEligible:false,rankingEligible:false};
  });
  return freeze({status:'ok',hourBranch:hour,monthBranch,doors,source:FORMATION_SOURCE,
    meaning:'Địa Tứ Hộ là lớp phương vị theo chu kỳ Kiến Trừ; chỉ dùng như gợi ý hướng hành động truyền thống, không thay kiểm tra đường đi/thực địa.'});
}

export function analyzeFormations(board,palaces,roles=[]){
  const byPalace={},matches=[];
  for(const p of palaces){
    const actorIds=roleIdsForPalace(roles,p.number);
    const local=[...threeDeceptions(p),...fiveFakes(p),...nineEscapes(p)].map(x=>({
      ...x,actorIds,stemActorIds:roleIdsForStems(roles,p.number,x.heavenStems.map(s=>s.stem))
    }));
    matches.push(...local);
    byPalace[p.number]=freeze({palace:p.number,matches:local,
      meaning:'Cách cục chỉ mô tả kiểu hành động có thể phù hợp tại cung; blocker trực tiếp, Dụng Thần, Strength và dữ kiện thực tế vẫn có quyền ưu tiên cao hơn.'});
  }
  const heavenGates=heavenThreeGates(board,palaces),earthDoors=earthFourDoors(board,palaces);
  const directionalByPalace=Object.fromEntries(palaces.map(p=>[p.number,{
    heavenGates:heavenGates.gates.filter(x=>x.palace===p.number),
    earthDoors:earthDoors.doors.filter(x=>x.palace===p.number)
  }]));
  return freeze({
    version:FORMATION_VERSION,profile:FORMATION_PROFILE,byPalace,matches,
    provenance:{primary:FORMATION_SOURCE,crossChecks:[YANYI_SOURCE,SECRET_COMPENDIUM_SOURCE],variantPolicy:'single_profile_variants_are_metadata_not_votes',
      canonicalChoices:{heavenEscape:'bing + Life Door + earth Ding',earthFake:'Nine Earth primary with Tai Yin / Six Harmony subvariants',tigerEscape:'Yi + Rest + earth Xin + Gen primary; Bing + Life + earth Xin alternate'}},
    directional:{heavenThreeGates:heavenGates,earthFourDoors:earthDoors,byPalace:directionalByPalace},
    coverage:{threeDeceptions:['true_deception','heavy_deception','rest_deception'],fiveFakes:['heaven_fake','earth_fake','object_fake','ghost_fake','human_fake'],
      fiveFakeVariants:{earth_fake:['earth9','moon','harmony']},
      nineEscapes:['heaven_escape','earth_escape','human_escape','spirit_escape','ghost_escape','wind_escape','cloud_escape','dragon_escape','tiger_escape'],
      nineEscapeVariants:{tiger_escape:['qimen_faqiao_primary','qimen_faqiao_alternate'],heaven_escape:['canonical_life_door_only']},
      qualificationCoverage:{wonderTomb:'complete_for_乙丙丁',otherStemTomb:'complete_for_戊己庚辛壬癸_via_KM_TIMING_3_0'},
      heavenThreeGates:3,earthFourDoors:4},
    limitations:[
      'KM-FORMATION-3.0 dùng 奇門法竅 làm profile chính; dị bản từ 遁甲演義/奇門遁甲秘笈大全 được ghi variant thay vì cộng thành cách cục mới.',
      'Tam Trá/Ngũ Giả/Cửu Độn là lớp hành động chiến lược, không phải phiếu độc lập, xác suất, dự báo thắng/thua hoặc bằng chứng ngoài đời.',
      'Cửu Độn bị hạ điều kiện khi phạm Mộ, Hình hoặc Môn bức theo nguồn; Ngũ Giả tránh Mộ/Bức. KM-TIMING-3.0 đã mở deterministic tomb coverage cho cả Tam Kỳ và Lục Nghi hiện trên bàn, nên Kỷ/Quý/Nhâm không còn bị hạ chỉ vì thiếu coverage.',
      'Thiên Độn dùng công thức canonical Bính + Sinh Môn + địa Đinh; chữ “sinh khai” trong một truyền bản KM-FORMATION-3.0 chỉ ghi là dị văn, không tự mở rộng sang Khai Môn. Phong/Vân/Long/Hổ cũng lấy công thức quyển sáu làm profile chính, dị bản quyển một không cộng thành phiếu mới.',
      'Thiên Tam Môn đổi Thiên Nguyệt Tướng tại Trung khí dựa trên tiết khí của board; Địa Tứ Hộ dùng chu kỳ Kiến–Trừ theo chi giờ. Cả hai chỉ là phương vị biểu tượng.',
      'Không tự suy an toàn di chuyển, địa hình, thời tiết, pháp lý, sức khỏe hoặc khả năng thành công từ bất kỳ cách cục/phương vị nào.'
    ]
  });
}
