export const YONGSHEN_VERSION='KM-YONGSHEN-2.0';

const tier=(name,weight)=>Object.freeze({name,weight});
export const YONGSHEN_TIERS=Object.freeze({
  primary:tier('primary',1),
  secondary:tier('secondary',0.8),
  counterpart:tier('counterpart',0.75),
  corroborator:tier('corroborator',0.6),
  operational:tier('operational',0.5),
});

const role=(id,tierName,purpose,sourceDomain=null)=>({id,tier:tierName,purpose,sourceDomain});
const extra=(id,label,ref,tierName,purpose)=>({id,label,ref,tier:tierName,purpose});

const PROFILES=Object.freeze({
  general:{
    roles:[role('event','primary','Mục tiêu sự việc'),role('opportunity','secondary','Cửa mở bước tiếp theo'),role('execution','operational','Khâu triển khai')],
  },
  business:{
    roles:[role('opportunity','primary','Cơ hội giao dịch'),role('quote','secondary','Hồ sơ, phạm vi và báo giá'),
      role('contract','secondary','Khả năng hình thành thỏa thuận'),role('money','secondary','Lợi ích và dòng tiền'),
      role('authority','corroborator','Biểu tượng quyền quyết định'),role('capital','corroborator','Nguồn lực bỏ ra')],
  },
  project:{
    roles:[role('event','primary','Mục tiêu dự án'),role('execution','secondary','Khâu triển khai'),
      role('contract','secondary','Điều kiện phối hợp/bàn giao'),role('opportunity','corroborator','Cửa chuyển giai đoạn'),role('authority','corroborator','Thẩm quyền')],
  },
  career:{
    roles:[role('opportunity','primary','Công việc, vị trí hoặc cơ hội nghề nghiệp'),role('authority','secondary','Cấp quản lý/quyền quyết định'),
      role('event','secondary','Việc đang hỏi'),role('execution','operational','Khâu thực hiện')],
    extras:[extra('learning','Năng lực học hỏi / chuyên môn',['star','fu'],'corroborator','Năng lực, hướng dẫn và chuyên môn')],
  },
  recruitment:{
    roles:[role('opportunity','primary','Cửa tuyển dụng/nhận việc'),role('authority','secondary','Người/quy trình quyết định'),
      role('contract','secondary','Cam kết tuyển dụng'),role('event','corroborator','Vị trí hoặc nhu cầu đang hỏi')],
  },  finance:{
    roles:[role('money','primary','Khả năng tạo lợi ích hoặc khoản thu'),role('capital','secondary','Vốn/nguồn lực'),
      role('event','corroborator','Sự việc tạo ra khoản thu')],
  },
  relationship:{
    roles:[role('event','primary','Mối quan hệ đang hỏi'),role('contract','primary','Khả năng kết nối/hòa hợp')],
    extras:[extra('relationship_rest','Hưu Môn · nhịp hòa hoãn',['door','xiu'],'secondary','Khả năng nghỉ, hòa và đối thoại'),
      extra('partner_yi','Trục quan hệ Ất',['stem','乙'],'corroborator','Một đầu của trục Ất–Canh; không tự gán giới tính hay danh tính'),
      extra('partner_geng','Trục quan hệ Canh',['stem','庚'],'corroborator','Một đầu của trục Ất–Canh; không tự gán giới tính hay danh tính')],
  },
  family:{
    roles:[role('event','primary','Quyết định/sự việc trong gia đình'),role('contract','primary','Khả năng phối hợp giữa người thân'),role('execution','operational','Khâu tổ chức thực tế')],
    extras:[extra('family_rest','Hưu Môn · hòa khí',['door','xiu'],'secondary','Nhịp sinh hoạt, nghỉ và hòa giải')],
  },
  study:{
    roles:[role('event','corroborator','Kỳ học/kỳ thi đang hỏi')],
    extras:[extra('learning','Thiên Phụ · học tập',['star','fu'],'primary','Học tập, kiến thức và hướng dẫn'),
      extra('document','Cảnh Môn · bài vở/biểu đạt',['door','jing'],'secondary','Bài thi, trình bày và hồ sơ'),
      extra('ding_document','Đinh · văn thư/chi tiết',['stem','丁'],'corroborator','Văn thư, chi tiết và phần cần tinh chỉnh')],
  },
  health:{
    roles:[role('self','primary','Chủ thể sức khỏe đang hỏi'),role('event','corroborator','Vấn đề đã được người dùng nêu')],
    extras:[extra('health_issue','Thiên Nhuế · vấn đề cần chăm sóc',['star','rui'],'primary','Biểu tượng truyền thống của phần cần chăm sóc/sửa chữa'),
      extra('health_support','Thiên Tâm · hỗ trợ/y dược',['star','xin'],'secondary','Biểu tượng hỗ trợ, xử lý và y dược')],
  },  legal:{
    roles:[role('event','primary','Vụ việc/tranh chấp đang hỏi'),role('authority','secondary','Thẩm quyền cần kiểm chứng'),
      role('quote','secondary','Hồ sơ/văn bản'),role('contract','corroborator','Khả năng hòa giải/thỏa thuận')],
    extras:[extra('dispute','Kinh Môn · tranh luận/khẩu thiệt',['door','fear'],'primary','Tranh luận, khiếu nại và xung đột lời nói'),
      extra('geng_obstacle','Canh · trở lực/đối kháng',['stem','庚'],'corroborator','Trục trở lực; không tự gán cho một người cụ thể')],
  },
  property:{
    roles:[role('capital','secondary','Ngân sách/nguồn vốn'),role('quote','secondary','Hồ sơ/thông tin giao dịch'),role('contract','secondary','Điều khoản giao dịch')],
    extras:[extra('property_asset','Sinh Môn · tài sản/khai thác',['door','sheng'],'primary','Khả năng khai thác và giá trị sử dụng của tài sản'),
      extra('property_ground','Thiên Nhậm · nền đất/sự ổn định',['star','ren'],'corroborator','Nền tảng, tính ổn định và phần thực địa')],
  },
  search:{
    roles:[role('event','primary','Người/vật đang tìm'),role('movement','secondary','Khả năng đã di chuyển')],
    extras:[extra('hidden_clue','Huyền Vũ · dấu vết kín',['spirit','tortoise'],'primary','Dấu vết bị che, thông tin thiếu hoặc cần kiểm chứng'),
      extra('blocked_clue','Đỗ Môn · chỗ bị che/kẹt',['door','du'],'secondary','Vị trí hoặc đường tiếp cận bị che/chặn')],
  },
  travel:{
    roles:[role('movement','primary','Dấu hiệu di chuyển'),role('event','secondary','Mục tiêu chuyến đi'),role('opportunity','corroborator','Cửa tiếp cận')],
    extras:[extra('travel_support','Cửu Thiên · đi xa/mở rộng',['spirit','heaven9'],'secondary','Đi xa, mở rộng phạm vi và dịch chuyển')],
  },
  social:{
    roles:[role('contract','primary','Khả năng kết nối/hợp tác'),role('event','secondary','Quan hệ/sự việc đang hỏi'),role('opportunity','corroborator','Cửa tiếp cận')],
    extras:[extra('social_rest','Hưu Môn · giao tiếp hòa hoãn',['door','xiu'],'secondary','Giao tiếp, nghỉ và hòa hoãn')],
  },
});

const hasStakeholder=(context,id)=>context?.stakeholders?.some(s=>s.role===id&&s.status==='mentioned');

const pillarExtra=(id,label,pillar,tierName,purpose)=>({id,label,pillar,tier:tierName,purpose});
const normalizedQuestion=context=>(context?.question||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').replaceAll('đ','d').replaceAll('Đ','D').toLowerCase();

function contextualExtras(profile,context){
  const extras=[...(profile.extras||[])],q=normalizedQuestion(context);
  if(context?.domain==='family'){
    if(/\b(cha me|bo me|phu huynh|ong ba|truong boi)\b/.test(q))extras.push(pillarExtra('family_parent','Cha mẹ / trưởng bối','year','secondary','Niên can làm trục trưởng bối/cha mẹ theo quy ước Lục Thân'));
    if(/\b(anh chi em|anh trai|chi gai|em trai|em gai|dong boi)\b/.test(q))extras.push(pillarExtra('family_peer','Anh chị em / đồng bối','month','secondary','Nguyệt can làm trục đồng bối theo quy ước Lục Thân'));
    if(/\b(con cai|con nho|em be|cham con|nuoi con|cham be|nuoi be|thai san|con toi)\b/.test(q))extras.push(pillarExtra('family_child','Con cái / hậu bối','hour','primary','Thời can làm trục con cái/hậu bối; không tự phân giới tính'));
  }
  return extras;
}

function secondaryContext(domain,context){
  const q=normalizedQuestion(context),domains=[],roles=[];
  if(!['finance','business','property'].includes(domain)&&/\b(tien|tai chinh|thu nhap|chi phi|kinh te|dong tien|nguon thu|tru cot kinh te)\b/.test(q)){
    domains.push('finance');
    roles.push(role('money','secondary','Domain phụ tài chính: khả năng tạo/duy trì nguồn thu','finance'));
    roles.push(role('capital','corroborator','Domain phụ tài chính: nguồn lực/vốn có thể huy động','finance'));
  }
  return {domains,roles};
}

function contextualRoles(profile,context,secondaryRoles=[]){
  const roles=[...(profile.roles||[]),...secondaryRoles];
  const domain=context?.domain||'general';
  const intent=context?.intent||'understand_event';
  if(['business','relationship','family','legal','social'].includes(domain)&&hasStakeholder(context,'customer'))
    roles.push(role('customer','counterpart','Phía liên quan đã được nhắc tới; chỉ có cung khi người dùng cung cấp đại diện hợp lệ'));
  if(hasStakeholder(context,'decisionMaker'))
    roles.push(role('decisionMaker','counterpart','Người có quyền quyết định đã được nhắc tới; không tự suy Can Chi'));
  if(domain==='finance'&&['payment','income'].includes(intent)){
    roles.push(role('contract','corroborator','Cam kết liên quan khoản thu'));
    if(['confirmation','execution','cash_realization','completion'].includes(context?.outcomeTarget?.stageAsked))
      roles.push(role('payment','operational','Khâu xử lý/thực nhận'));
  }
  return roles;
}

export function resolveYongshenProfile({topic='general',questionContext=null}={}){
  const domain=questionContext?.domain||({
    contract:'business',money:'finance',investment:'finance',debt:'finance',work:'career',study:'study',love:'relationship',
    family:'family',property:'property',lost:'search',travel:'travel',launch:'business',social:'social',health:'health',dispute:'legal'
  }[topic]||'general');
  const base=PROFILES[domain]||PROFILES.general;
  const secondary=secondaryContext(domain,questionContext);
  const roles=contextualRoles(base,questionContext,secondary.roles);
  const seen=new Set();
  const ordered=roles.filter(r=>!seen.has(r.id)&&seen.add(r.id)).map((r,index)=>({...r,order:index+1}));
  const extras=contextualExtras(base,questionContext).map((r,index)=>({...r,order:ordered.length+index+1}));
  return {version:YONGSHEN_VERSION,domain,secondaryDomains:secondary.domains,intent:questionContext?.intent||'understand_event',
    roles:ordered,extras,sourcePolicy:'multi_source_domain_convention',
    safety:'Dụng Thần xác định vai biểu tượng để luận; không xác minh danh tính, động cơ, chẩn đoán, kết quả hay xác suất ngoài thực tế.'};
}

export function yongshenMeta(profile,id){
  const row=[...profile.roles,...profile.extras].find(r=>r.id===id);
  if(!row)return null;
  return {resolverVersion:profile.version,yongshenTier:row.tier,yongshenOrder:row.order,
    yongshenPurpose:row.purpose,yongshenDomain:row.sourceDomain||profile.domain,yongshenWeight:YONGSHEN_TIERS[row.tier]?.weight??0.4};
}
