import {CONTROLS} from '../../guide.mjs';

export const STRUCTURE_VERSION='KM-STRUCTURE-2.0';
export const STRUCTURE_PROFILE='CLASSIC_ROTATING_STANDARD';
export const TEN_STEM_SOURCE='奇門遁甲秘笈大全·十干克應訣';
export const DOOR_RELATION_SOURCE='奇門法竅·門迫宮迫';
export const CLASSIC_PATTERN_SOURCE='遁甲演義卷二 / 奇門遁甲寶鑒';

const STEMS=['戊','乙','丙','丁','己','庚','辛','壬','癸'];
const toneWeight={strong_favorable:1,favorable:0.75,contextual:0.35,mixed:0,hold:-0.35,adverse:-0.75,severe_adverse:-1};

const RAW={
  戊:[
    ['戊','伏吟','hold'],['乙','青龍合靈','contextual'],['丙','青龍返首','strong_favorable'],['丁','青龍耀明','favorable'],
    ['己','貴人入獄','adverse'],['庚','值符飛宮','severe_adverse'],['辛','青龍折足','contextual'],['壬','青龍入天牢','severe_adverse'],['癸','青龍華蓋','contextual']],
  乙:[
    ['戊','利陰害陽','contextual'],['乙','日奇伏吟','hold'],['丙','奇儀順遂','favorable'],['丁','奇儀相佐','favorable'],
    ['己','日奇入霧','adverse'],['庚','日奇被刑','adverse'],['辛','青龍逃走','severe_adverse'],['壬','日奇入地','adverse'],['癸','華蓋逢星','contextual']],
  丙:[
    ['戊','飛鳥跌穴','strong_favorable'],['乙','日月並行','favorable'],['丙','月奇悖師','adverse'],['丁','月奇朱雀','favorable'],
    ['己','火悖入刑','adverse'],['庚','熒入太白','severe_adverse'],['辛','謀事成就','favorable'],['壬','火入天羅','adverse'],['癸','華蓋悖師','adverse']],
  丁:[
    ['戊','青龍轉光','favorable'],['乙','人遁吉格','favorable'],['丙','星隨月轉','mixed'],['丁','奇入太陰','favorable'],
    ['己','火入勾陳','adverse'],['庚','文書阻隔','adverse'],['辛','朱雀入獄','mixed'],['壬','五神互合','favorable'],['癸','朱雀投江','severe_adverse']],
  己:[
    ['戊','犬遇青龍','contextual'],['乙','墓神不明','adverse'],['丙','火悖地戶','adverse'],['丁','朱雀入墓','adverse'],
    ['己','地戶逢鬼','severe_adverse'],['庚','刑格返名','adverse'],['辛','游魂入墓','adverse'],['壬','地網高張','adverse'],['癸','地刑玄武','severe_adverse']],
  庚:[
    ['戊','太白天乙伏宮','severe_adverse'],['乙','太白蓬星','adverse'],['丙','太白入熒','severe_adverse'],['丁','亭亭之格','adverse'],
    ['己','刑格','severe_adverse'],['庚','太白同宮','severe_adverse'],['辛','白虎干格','severe_adverse'],['壬','上格','adverse'],['癸','大格','severe_adverse']],
  辛:[
    ['戊','困龍被傷','adverse'],['乙','白虎猖狂','severe_adverse'],['丙','干合悖師','adverse'],['丁','獄神得奇','favorable'],
    ['己','入獄自刑','adverse'],['庚','白虎出力','severe_adverse'],['辛','伏吟天庭','adverse'],['壬','凶蛇入獄','adverse'],['癸','天牢華蓋','severe_adverse']],
  壬:[
    ['戊','小蛇化龍','favorable'],['乙','小蛇日奇','mixed'],['丙','水蛇入火','adverse'],['丁','干合蛇刑','mixed'],
    ['己','干合蛇刑','adverse'],['庚','太白擒蛇','favorable'],['辛','螣蛇相纏','adverse'],['壬','蛇入地羅','adverse'],['癸','幼女奸淫','adverse']],
  癸:[
    ['戊','天乙會合','contextual'],['乙','華蓋蓬星','favorable'],['丙','華蓋悖師','favorable'],['丁','螣蛇夭矯','severe_adverse'],
    ['己','華蓋地戶','hold'],['庚','太白入網','adverse'],['辛','網蓋天牢','severe_adverse'],['壬','復見螣蛇','adverse'],['癸','天網四張','severe_adverse']],
};

const normalizeName=name=>({
  '幼女奸淫':'quan hệ/uy tín dễ phát sinh rối ren',
  '地戶逢鬼':'trạng thái trì trệ, khó triển khai',
  '地刑玄武':'ràng buộc kín hoặc thủ tục kéo dài',
  '網蓋天牢':'bị khóa bởi nhiều lớp ràng buộc',
  '白虎出力':'xung đột mạnh, không phù hợp ép tiến',
  '白虎干格':'rủi ro va chạm khi cố tiến',
}[name]||null);

const pairMeaning=Object.freeze({
  '戊戊':'Nhịp bị giữ và lặp lại; củng cố hiện trạng tốt hơn ép tiến.','戊乙':'Kết quả phụ thuộc mạnh vào chất lượng cửa và hoàn cảnh phối hợp.','戊丙':'Lực chủ động và triển khai mạnh, nhưng phải hạ mức khi gặp Không, Mộ, Hình hoặc Môn–Cung cản.','戊丁':'Thuận cho tiếp cận, trình bày và được ghi nhận; trở ngại cấu trúc dễ làm phát sinh tranh cãi.','戊己':'Nguồn lực bị bó trong thủ tục hoặc khuôn khổ, khó triển khai tự do.','戊庚':'Trục điều hành bị xáo trộn; việc thuận cũng dễ mất ổn định nếu cố tiến.','戊辛':'Có thể làm khi được hỗ trợ, nhưng dễ hao hụt hoặc vấp lỗi trong khâu triển khai.','戊壬':'Nguồn lực bị khóa hoặc mắc ràng buộc, không thuận mở rộng.','戊癸':'Thiên về che chắn và giữ an toàn; tốt/xấu còn phụ thuộc cửa và trạng thái cung.',
  '乙戊':'Cách tiếp cận mềm hoặc kín có lợi hơn đối đầu; gặp sức ép thì dễ hao tổn.','乙乙':'Trạng thái lặp lại, hợp giữ nền hơn theo đuổi bước tiến danh vị.','乙丙':'Phối hợp và chuyển bước tương đối thuận khi bối cảnh không có cản mạnh.','乙丁':'Thuận cho hồ sơ, trao đổi và phối hợp chi tiết.','乙己':'Thông tin hoặc phương hướng bị mờ; cần mở nút thắt trước khi quyết định.','乙庚':'Dễ phát sinh tranh chấp, giằng co lợi ích hoặc bất đồng giữa các bên.','乙辛':'Dễ thất thoát, rút lui hoặc đứt mạch phối hợp; không nên dựa vào một tín hiệu thuận đơn lẻ.','乙壬':'Trật tự vai trò dễ đảo lộn, kéo theo tranh cãi và khó thống nhất.','乙癸':'Phù hợp ẩn mình, thu hẹp phạm vi và tránh rủi ro hơn là phô trương.',
  '丙戊':'Khả năng hành động và làm rõ đường đi mạnh, thuận biến kế hoạch thành bước cụ thể.','丙乙':'Hai nguồn lực có xu hướng song hành, thuận phối hợp công khai lẫn nội bộ.','丙丙':'Áp lực giấy tờ, chi phí hoặc sai lệch tăng; cần kiểm tra lại phần đã công bố.','丙丁':'Thuận cho thông tin, hồ sơ và mức độ hiển lộ; gặp Sinh Môn được nâng thành cụm triển khai thuận.','丙己':'Khâu hành chính hoặc quy trình dễ bị giữ, khiến văn bản và thực thi chậm lại.','丙庚':'Xung lực mạnh dễ gây hao hụt, va chạm hoặc phá cấu trúc đang có.','丙辛':'Kế hoạch có khả năng khép thành đầu việc cụ thể nếu không có cản trực tiếp.','丙壬':'Bị vướng mạng lưới ràng buộc, tranh cãi hoặc điều kiện từ bên ngoài.','丙癸':'Dễ có nhiễu ngầm và vấn đề lặp lại; cần kiểm tra nguồn gây gián đoạn.',
  '丁戊':'Thuận cho được chú ý, ghi nhận và đẩy một việc đang chuẩn bị sang bước rõ hơn.','丁乙':'Thuận cho phối hợp, quan hệ và lợi ích khi mục tiêu hai phía không xung đột.','丁丙':'Có thể tăng nhanh nhưng biến động cũng lớn; thành quả cần được khóa bằng điều kiện thực tế.','丁丁':'Thông tin hoặc văn bản dễ đến đúng điểm cần thiết, hỗ trợ hoàn tất bước nhỏ.','丁己':'Vướng mắc riêng tư hoặc oán kết dễ làm méo mục tiêu chung.','丁庚':'Hồ sơ, liên lạc hoặc hành trình dễ bị ngăn cách; ưu tiên gỡ điểm nghẽn.','丁辛':'Có khả năng tháo một ràng buộc cũ nhưng vị thế hoặc quy trình có thể đảo chiều.','丁壬':'Thuận cho phối hợp, dàn xếp và xử lý tranh chấp theo quy tắc rõ.','丁癸':'Tin tức, văn bản hoặc trao đổi dễ chìm/mất mạch; cần kênh xác nhận khác.',
  '己戊':'Kết quả phụ thuộc cửa và điều kiện hỗ trợ; nếu bối cảnh xấu dễ tốn công mà ít tiến.','己乙':'Thông tin thiếu sáng rõ, thích hợp thu mình và rà lại nền tảng hơn mở rộng.','己丙':'Dễ có xung đột ngầm hoặc lợi ích riêng làm lệch việc chính.','己丁':'Tranh luận hoặc giấy tờ có thể phải đi qua một vòng sai–sửa trước khi rõ.','己己':'Tắc nghẽn sâu và tự lặp; không thuận ép tiến khi chưa thay điều kiện.','己庚':'Tranh chấp dễ bất lợi cho bên chủ động trước; cần giữ quy trình và bằng chứng.','己辛':'Nhiễu kín và bất ổn nội bộ làm khó việc xác định nguyên nhân.','己壬':'Ràng buộc từ người/việc bên ngoài chồng lên nội bộ, làm tiến độ kéo dài.','己癸':'Nhiều điều kiện kín cùng lúc; cần hạ cam kết và kiểm tra từng lớp ràng buộc.',
  '庚戊':'Cản rất mạnh đối với việc chủ động; giữ thế và giảm cưỡng ép tốt hơn tiến thẳng.','庚乙':'Lùi, thu gọn hoặc đổi cách tiếp cận thường phù hợp hơn tiếp tục tăng áp lực.','庚丙':'Đối đầu mạnh và lợi ích hai phía dễ lệch; cần xác định ai chịu chi phí của việc tiến.','庚丁':'Việc riêng hoặc chi tiết nhạy cảm dễ làm nảy sinh thủ tục; điều kiện thuận có thể giảm bớt.','庚己':'Áp lực quy định, trách nhiệm hoặc tranh chấp tăng mạnh; tránh hành động vượt quy trình.','庚庚':'Va chạm trực diện và cạnh tranh cứng; cần tránh quyết định theo quán tính đối đầu.','庚辛':'Xung lực mạnh dễ gây tổn thất trong đi lại hoặc thực thi; ưu tiên giảm tốc và kiểm soát rủi ro.','庚壬':'Đường đi, thông tin hoặc liên lạc dễ lạc nhịp; cần xác nhận lại kênh và điểm đến.','庚癸':'Cấu trúc khóa rất mạnh; nên dừng mở rộng cho tới khi điều kiện cản được tháo.',
  '辛戊':'Vị thế bị nén; bảo toàn nguồn lực và giữ giới hạn tốt hơn hành động vội.','辛乙':'Xung đột có tính phá vỡ cao; cần ngăn thất thoát và giảm va chạm trực tiếp.','辛丙':'Biến động dễ kéo theo tranh cãi về lợi ích hoặc chi phí; cần tách dữ kiện khỏi suy đoán.','辛丁':'Có cửa tháo gỡ trong thương mại hoặc thủ tục nếu điều kiện thuận được xác nhận.','辛己':'Tự mắc vào khuôn ràng buộc, khiến việc giải thích hoặc khiếu nại khó tiến.','辛庚':'Đối đầu bằng sức dễ làm cả hai bên thiệt; nhượng một bước có điều kiện thường an toàn hơn.','辛辛':'Vấn đề tự lặp và tự củng cố; cần đổi quy trình chứ không chỉ tăng nỗ lực.','辛壬':'Tranh chấp hoặc cạnh tranh kéo dài, bên chủ động trước dễ mất lý thế.','辛癸':'Dễ rơi vào thế bị khóa hoặc hiểu sai đường; cần xác minh trước mọi bước tiếp.',
  '壬戊':'Nguồn nhỏ có khả năng được khuếch đại thành cơ hội lớn hơn nếu quản trị tốt.','壬乙':'Tương tác mềm nhưng lệch nhịp; kết quả phụ thuộc nhiều vào vai và bối cảnh cụ thể.','壬丙':'Áp lực quy định hoặc tranh chấp nối tiếp; không thuận dùng tốc độ để giải quyết.','壬丁':'Văn bản và trách nhiệm dễ đan chéo; có mặt thuận nhưng cần làm rõ liên đới.','壬己':'Rủi ro lớn khi cưỡng tiến; giữ vị thế và xử lý tranh chấp theo quy trình an toàn hơn.','壬庚':'Có khả năng phân định rõ đúng–sai hoặc ranh giới trách nhiệm nếu theo quy trình minh bạch.','壬辛':'Dễ bị cuốn vào rối ren hoặc thông tin không đáng tin; cần kiểm chứng nguồn trực tiếp.','壬壬':'Ràng buộc trong–ngoài cùng lặp lại, khiến việc chuyển bước chậm và dễ vòng lại.','壬癸':'Rủi ro uy tín hoặc chuyện riêng tác động vào việc chính; cần tách phạm vi và giữ kín dữ kiện nhạy cảm.',
  '癸戊':'Có lực hỗ trợ và phối hợp, nhưng Môn–Cung xấu có thể đảo lợi thành rắc rối.','癸乙':'Thiên về ổn định vị thế và giữ nhịp, phù hợp củng cố hơn bứt phá.','癸丙':'Có tín hiệu được hỗ trợ hoặc nhìn nhận tích cực, nhưng vẫn cần xác nhận bằng bước thực tế.','癸丁':'Rủi ro mạnh ở văn bản, tranh chấp hoặc sự cố; ưu tiên phòng ngừa và xác minh.','癸己':'Tin tức và tiến độ dễ bị chặn; thu hẹp hoặc tránh rủi ro có thể phù hợp hơn thúc ép.','癸庚':'Đối đầu cứng làm tranh chấp khó hạ nhiệt; không nên dùng sức ép làm công cụ chính.','癸辛':'Nhiều lớp khóa chồng nhau; không thuận cưỡng tiến khi chưa tháo điều kiện pháp lý/quy trình.','癸壬':'Quan hệ hoặc cam kết dễ lặp lại rối ren cũ; cần làm rõ ranh giới trước khi nối tiếp.','癸癸':'Mạng lưới trở ngại dày, dễ mất người/mất nhịp hoặc kéo dài tranh chấp; ưu tiên an toàn và thu gọn.'
});

const plainByTone={
  strong_favorable:'cấu trúc hỗ trợ mạnh cho việc chuyển bước nếu các điều kiện chính không bị phá',
  favorable:'cấu trúc thiên hỗ trợ, cần đối chiếu Môn–Tinh–Thần và trạng thái cung',
  contextual:'cấu trúc phụ thuộc mạnh vào Môn, trạng thái cung và mục tiêu đang hỏi',
  mixed:'cấu trúc có mặt thuận và nghịch cùng lúc; không dùng riêng để chốt kết quả',
  hold:'cấu trúc thiên giữ/chậm; phù hợp củng cố hơn là ép chuyển bước',
  adverse:'cấu trúc tạo lực cản hoặc sai lệch; cần giảm mức chắc chắn của kết luận thuận',
  severe_adverse:'cấu trúc cản mạnh; nếu nằm đúng Dụng Thần chính phải được ưu tiên xử lý trước khi suy kết quả',
};

export const TEN_STEM_RESPONSES=Object.freeze(Object.fromEntries(
  Object.entries(RAW).flatMap(([heaven,rows])=>rows.map(([earth,name,tone])=>{
    const pair=heaven+earth;
    return [pair,Object.freeze({id:`stem_${pair}`,heaven,earth,name,tone,weight:toneWeight[tone],
      plainMeaning:pairMeaning[pair]||normalizeName(name)||plainByTone[tone],source:TEN_STEM_SOURCE})];
  }))
));

export function tenStemResponse(heaven,earth){
  return TEN_STEM_RESPONSES[heaven+earth]||null;
}
const notablePairs=Object.freeze({
  '戊丙':{id:'green_dragon_returns',name:'Thanh Long phản thủ',tone:'strong_favorable'},
  '丙戊':{id:'bird_falls_nest',name:'Phi Điểu Điệt Huyệt',tone:'strong_favorable'},
  '乙辛':{id:'green_dragon_escapes',name:'Thanh Long đào tẩu',tone:'severe_adverse'},
  '辛乙':{id:'white_tiger_rages',name:'Bạch Hổ xương cuồng',tone:'severe_adverse'},
  '丁癸':{id:'vermilion_bird_river',name:'Chu Tước đầu giang',tone:'severe_adverse'},
  '癸丁':{id:'soaring_snake_twists',name:'Đằng Xà yêu kiểu',tone:'severe_adverse'},
  '庚癸':{id:'great_structure',name:'Đại cách',tone:'severe_adverse'},
  '庚己':{id:'punishment_structure',name:'Hình cách',tone:'severe_adverse'},
  '庚戊':{id:'hidden_palace_structure',name:'Phục cung cách',tone:'severe_adverse'},
  '戊庚':{id:'flying_palace_structure',name:'Phi cung cách',tone:'severe_adverse'},
});

const sanQiDeShiPairs=new Set(['乙己','乙辛','丙戊','丙庚','丁壬','丁癸']);

function roleIdsForStem(roles,stem){
  return roles.filter(r=>r.stem===stem).map(r=>r.id);
}

function doorRelation(p){
  const doorControls=CONTROLS[p.door.element]===p.element;
  const palaceControls=CONTROLS[p.element]===p.door.element;
  return {
    code:doorControls?'door_controls_palace':palaceControls?'palace_controls_door':'neutral',
    doorControlsPalace:doorControls,palaceControlsDoor:palaceControls,
    source:DOOR_RELATION_SOURCE,
    label:doorControls?'Môn khắc Cung':palaceControls?'Cung khắc Môn':'Môn–Cung không tương khắc',
    namingNote:'KM-STRUCTURE-2.0 lưu chiều sinh-khắc thật trước; nhãn “Môn bức/Cung bức” có dị bản nên không dùng tên để thay logic.',
  };
}

function fourHarmsForPalace(p,roles){
  const out=[];
  if(p.voided)out.push({code:'void',kind:'palace',severity:'high',actorIds:roles.map(r=>r.id),source:'hour-xun void'});
  if(p.conditions.doorPressure)out.push({code:'door_pressure',kind:'door_controls_palace',severity:'high',actorIds:roles.map(r=>r.id),source:DOOR_RELATION_SOURCE});
  for(const pair of p.stemPairs){
    const ids=roleIdsForStem(roles,pair.heaven.han);
    if(pair.punishment)out.push({code:'punishment',kind:'stem',severity:'high',stem:pair.heaven.han,carried:!!pair.carried,actorIds:ids,source:'六儀擊刑'});
    if(pair.wonderTomb)out.push({code:'tomb',kind:'stem',severity:'high',stem:pair.heaven.han,carried:!!pair.carried,actorIds:ids,source:'三奇入墓'});
  }
  return out;
}

function classicPatternsForPalace(board,p,stemResponses){
  const matches=[];
  for(const response of stemResponses){
    const n=notablePairs[response.pair];
    if(n)matches.push({...n,pair:response.pair,heavenStem:response.heavenStem,earthStem:response.earthStem,carried:response.carried,
      source:CLASSIC_PATTERN_SOURCE,plainMeaning:plainByTone[n.tone]});
    if(response.pair==='丙丁'&&p.door.id==='sheng')matches.push({id:'tian_dun',name:'Thiên độn',pair:response.pair,tone:'favorable',qualified:true,carried:response.carried,source:CLASSIC_PATTERN_SOURCE,plainMeaning:'Cụm thuận cho triển khai khi điều kiện hành động và nguồn lực cùng phù hợp; không tự bảo đảm kết quả.'});
    if(response.pair==='乙己'&&p.door.id==='kai')matches.push({id:'di_dun',name:'Địa độn',pair:response.pair,tone:'favorable',qualified:true,carried:response.carried,source:CLASSIC_PATTERN_SOURCE,plainMeaning:'Cụm thuận về điều kiện thực địa và mở việc; cần kiểm tra bước thực hiện cụ thể.'});
    if(response.heavenStem==='丁'&&p.door.id==='xiu'&&p.spirit.id==='moon')matches.push({id:'ren_dun',name:'Nhân độn',pair:response.pair,tone:'favorable',qualified:true,carried:response.carried,source:CLASSIC_PATTERN_SOURCE,plainMeaning:'Cụm thuận cho phối hợp kín đáo, chuẩn bị và hòa giải; không đồng nghĩa mục tiêu đã đạt.'});
    if(sanQiDeShiPairs.has(response.pair)){
      const blemished=['乙辛','丙庚','丁癸'].includes(response.pair);
      const chief=p.spirit.id==='chief';
      matches.push({id:'three_wonders_gain_use',name:'Tam Kỳ đắc sử',pair:response.pair,tone:blemished&&!chief?'mixed':'favorable',
        qualified:!blemished||chief,carried:response.carried,source:CLASSIC_PATTERN_SOURCE,
        plainMeaning:blemished&&!chief?'Có điều kiện “đắc sử” nhưng đồng thời vướng một cách xấu; không nâng kết luận nếu chưa có Trực Phù cùng cung.':'Tam Kỳ gặp đúng nghi theo quy ước cổ; dùng như tín hiệu hỗ trợ, không tự chốt thành công.'});
    }
  }
  if(p.number===board.zhiShi?.palace&&p.heavenStems.some(s=>s.han==='丁'))matches.push({
    id:'jade_woman_guards_door',name:'Ngọc Nữ thủ môn',pair:null,tone:'favorable',qualified:true,source:CLASSIC_PATTERN_SOURCE,
    plainMeaning:'Đinh Kỳ cùng cung Trực Sử; dùng như tín hiệu thuận cho phối hợp/việc kín, không tự suy sự kiện.'
  });
  return matches;
}
export function analyzeStructures(board,palaces,roles=[]){
  const byPalace={};
  const allStemResponses=[];
  const allPatterns=[];
  const allFourHarms=[];
  for(const p of palaces){
    const palaceRoles=roles.filter(r=>r.palace===p.number);
    const stemResponses=p.stemPairs.map(pair=>{
      const rule=tenStemResponse(pair.heaven.han,pair.earth.han);
      if(!rule)return null;
      const actorIds=roleIdsForStem(palaceRoles,pair.heaven.han);
      const item={...rule,pair:pair.heaven.han+pair.earth.han,heavenStem:pair.heaven.han,earthStem:pair.earth.han,
        carried:!!pair.carried,actorIds,roleTiers:actorIds.map(id=>roles.find(r=>r.id===id)?.yongshenTier||null).filter(Boolean)};
      allStemResponses.push({...item,palace:p.number});
      return item;
    }).filter(Boolean);
    const door=doorRelation(p);
    const fourHarms=fourHarmsForPalace(p,palaceRoles);
    const patterns=classicPatternsForPalace(board,p,stemResponses);
    allPatterns.push(...patterns.map(x=>({...x,palace:p.number})));
    allFourHarms.push(...fourHarms.map(x=>({...x,palace:p.number})));
    const relevantResponses=stemResponses.filter(x=>x.actorIds.length);
    const adverse=relevantResponses.filter(x=>x.weight<0);
    const favorable=relevantResponses.filter(x=>x.weight>0);
    const priority=Math.max(
      fourHarms.some(x=>x.actorIds.some(id=>roles.find(r=>r.id===id)?.yongshenTier==='primary'))?1:0,
      adverse.some(x=>x.tone==='severe_adverse'&&x.roleTiers.includes('primary'))?1:0,
      adverse.length?0.7:0,
      favorable.length?0.45:0
    );
    byPalace[p.number]={palace:p.number,doorRelation:door,fourHarms,stemResponses,patterns,priority,
      meaning:'Cấu trúc là lớp điều kiện của Dụng Thần; không phải xác suất và không tự biến thành sự kiện ngoài đời.'};
  }
  return Object.freeze({version:STRUCTURE_VERSION,profile:STRUCTURE_PROFILE,byPalace,
    fourHarms:allFourHarms,stemResponses:allStemResponses,patterns:allPatterns,
    coverage:{tenStemResponses:Object.keys(TEN_STEM_RESPONSES).length,fourHarms:['void','door_pressure','punishment','tomb'],
      doorRelations:['door_controls_palace','palace_controls_door'],
      classicPatternFamilies:['6 cách cục cát/hung trọng yếu','4 cách liên quan Canh','Tam Kỳ đắc sử','Ngọc Nữ thủ môn','Thiên/Địa/Nhân độn']},
    limitations:[
      'Thập Can Khắc Ứng là corpus diễn giải truyền thống; tone chỉ dùng xếp ưu tiên nội bộ, không phải xác suất.',
      'Tên Môn bức/Cung bức có dị bản; engine lưu chiều ngũ hành thật và không suy logic từ tên gọi.',
      'Tam Kỳ đắc sử có điều kiện/diễn giải khác nhau giữa truyền bản; các tổ hợp đồng thời phạm cách xấu bị hạ mức.',
      'Bát Môn Khắc Ứng và Tam Kỳ đáo cung đã được tách sang KM-KEYING-3.0 để tránh trộn với 81 Thập Can; Cửu Tinh trị thời ở Phase 9 mới chỉ có chỉ mục classical_context_only. Tam Trá/Ngũ Giả/Cửu Độn vẫn ngoài scope KM-STRUCTURE-2.0.'
    ]});
}
