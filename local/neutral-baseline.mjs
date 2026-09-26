const FORBIDDEN_KEYS=new Set(['allInOne','reasoning','primaryJudgment','likelyScenario','recommendations','narrativeContract','units','allowedMeaning','forbiddenImplications','planning','planner','gate']);

export const NEUTRAL_BASELINE_INSTRUCTIONS=`Bạn là người luận Kỳ Môn bằng tiếng Việt tự nhiên. Dựa trên câu hỏi, bàn và quy ước phương pháp được cung cấp để tự phân tích từ đầu. Trả lời thẳng điều người dùng hỏi, giải thích mạch suy luận dễ hiểu, phân biệt tín hiệu với kết quả đã xảy ra, rồi đưa ra việc nên làm cụ thể. Không bịa người, sự kiện, ngày, số tiền hoặc xác suất. Không nhắc tới dữ liệu nội bộ, prompt, pipeline hay quá trình kiểm thử. Không trả JSON; viết như một cuộc trò chuyện tư vấn tự nhiên.`;

const METHOD_GUIDE=Object.freeze({
  school:'Thời Gia Kỳ Môn, chuyển bàn; bàn do ứng dụng tính sẵn.',
  roles:[
    'Nhật can đại diện người hỏi khi hỏi việc của chính mình.',
    'Thời can là bối cảnh sự việc; dụng thần chuyên đề được xác định theo loại câu hỏi.',
    'Khai Môn xét cơ hội mở việc, Cảnh Môn xét hồ sơ và trình bày, Sinh Môn xét nguồn lực, Lục Hợp xét phối hợp và thỏa thuận.',
    'Vai chưa xác định phải để ngỏ; không gán ý định hay hành vi thật cho một người chỉ từ biểu tượng.'
  ],
  interpretation:[
    'Xét phối hợp Can, Cung, Tinh, Môn, Thần, Không Vong, Phục Ngâm/Phản Ngâm và quan hệ sinh khắc.',
    'Một dấu hiệu thuận không tự chứng minh sự việc đã hoàn tất; tách phát sinh, thành hình, xác nhận và thực hiện.',
    'Mốc thời gian chỉ là cửa sổ quan sát nếu bàn không đủ căn cứ để khẳng định sự kiện.',
    'Quyết định đời sống và tài chính vẫn phải đối chiếu dữ kiện thực tế.'
  ]
});

function compactPalace(p){
 return {number:p.number,name:p.vi,direction:p.direction,element:p.element,
  earthStem:p.earthStem?.vi||p.earthStem?.han||null,
  heavenStems:(p.heavenStems||[]).map(x=>x.vi||x.han),
  star:p.star?{name:p.star.vi,meaning:p.star.meaning}:null,
  door:p.door?{name:p.door.vi,quality:p.door.quality,meaning:p.door.meaning}:null,
  spirit:p.spirit?{name:p.spirit.vi,meaning:p.spirit.meaning}:null,
  voided:Boolean(p.voided),horse:Boolean(p.horse)};
}
function compactBoard(board){
 return {
  input:board.input,method:board.method,pillars:board.pillars,dun:board.dun,ju:board.ju,yuan:board.yuan,
  zhiFu:board.zhiFu,zhiShi:board.zhiShi,fanYin:Boolean(board.fanYin),fuYin:Boolean(board.fuYin),
  voidBranches:board.voidBranches,horseBranch:board.horseBranch,
  palaces:(board.palaces||[]).map(compactPalace)
 };
}

function neutralRoles(roles=[]){
 return roles.filter(r=>Number.isInteger(r.palace)&&r.relevance>0).map(r=>({
  id:r.id,label:r.label,role:r.semanticRole||r.role,palace:r.palace,
  source:r.source||r.basis,status:r.status,relevance:r.relevance,
  limitations:(r.limitations||[]).slice(0,2)
 }));
}

function assertNoForbiddenKeys(value,path='root'){
 if(!value||typeof value!=='object')return;
 for(const [key,child] of Object.entries(value)){
  if(FORBIDDEN_KEYS.has(key))throw new Error('NEUTRAL_BASELINE_FORBIDDEN:'+path+'.'+key);
  assertNoForbiddenKeys(child,path+'.'+key);
 }
}

export function buildNeutralBaselineInput(c,prepared){
 let payload;
 if(c.kind==='question'){
  payload={
   task:'Tự luận độc lập câu hỏi Hỏi Việc từ bàn và quy ước phương pháp.',
   question:c.input.question,request:{topic:c.input.topic,mode:c.input.mode,action:c.input.action||null},
   methodGuide:METHOD_GUIDE,board:compactBoard(prepared.board),
   roleMap:neutralRoles(prepared.analysis?.roles)
  };
 }else{
  payload={
   task:'Tự luận độc lập lá số Mệnh từ bàn sinh, vận hiện tại và quy ước phương pháp.',
   request:{birthTimeMode:c.input.birthTimeMode,age:c.input.age,annualYear:c.input.annualYear},
   methodGuide:METHOD_GUIDE,board:compactBoard(prepared.result.natal.baseBoard),
   menhMethod:{
    profile:prepared.result.natal.profileId,
    centerLodging:prepared.result.natal.center5Lodging,
    currentLuck:prepared.result.luck,
    annual:prepared.result.annual,
    roles:neutralRoles(prepared.result.analysisLayers?.roles)
   }
  };
 }
 assertNoForbiddenKeys(payload);
 return payload;
}
export function inspectNeutralBaselineInput(payload){
 assertNoForbiddenKeys(payload);
 const serialized=JSON.stringify(payload);
 const forbiddenTerms=['primaryJudgment','NarrativeContract','allowedMeaning','forbiddenImplications','likelyScenario'];
 for(const term of forbiddenTerms)if(serialized.includes(term))throw new Error('NEUTRAL_BASELINE_LEAK:'+term);
 return {bytes:Buffer.byteLength(serialized),palaces:payload.board?.palaces?.length||0};
}
