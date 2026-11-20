// TG-CB-7.0 (P6): Kỳ Môn binh pháp / thương chiến model shared by the strategy,
// business and negotiation modes. Sources: 奇門法竅 (chủ/khách, tiên/hậu động),
// 遁甲演義 (Cửu Thiên/Cửu Địa), 張志春 (Canh = đối thủ, Mậu = vốn, Lục Hợp = đối tác).
// Output is an interpretive action plan, never a probability of winning.
export const WARFARE_VERSION='KM-WARFARE-1.0';

const CONTROLS={Mộc:'Thổ',Thổ:'Thủy',Thủy:'Hỏa',Hỏa:'Kim',Kim:'Mộc'};
const GENERATES={Mộc:'Hỏa',Hỏa:'Thổ',Thổ:'Kim',Kim:'Thủy',Thủy:'Mộc'};
const STATUS_POWER={'vượng':1,'tướng':0.85,'hưu':0.5,'tù':0.3,'phế':0.15,'tử':0.12};
const GOOD_DOORS=new Set(['kai','xiu','sheng']);
const HUNG_DOORS=new Set(['si','fear','shang']);
const HOLLOW_SPIRITS=new Set(['snake','tortoise','moon']);
const BRANCH_VI=['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];
const hourRange=i=>{const s=(i*2+23)%24;return `${BRANCH_VI[i]} (${String(s).padStart(2,'0')}:00–${String((s+1)%24).padStart(2,'0')}:59)`;};

export const BRANCHES=Object.freeze({
  attack:{label:'Tấn công / ra tay trước',summary:'Ta mạnh hơn đối thủ và thời thế thuận khách: chủ động ra tay trước, dồn lực vào một mũi.'},
  capture_share:{label:'Giành thị phần',summary:'Cửa lợi (Sinh Môn) có lực và đối thủ đang vướng: mở rộng bán hàng, chiếm phần thị trường đối thủ bỏ trống.'},
  squeeze_price:{label:'Đàm phán ép giá',summary:'Ta khắc được phía đối tác/khách và họ không có thế dựa: giữ giá, đòi điều kiện tốt hơn.'},
  alliance:{label:'Liên minh',summary:'Đối thủ mạnh hơn nhưng đối tác (Lục Hợp) sinh trợ ta: bắt tay đối tác/trung gian thay vì đối đầu một mình.'},
  hold:{label:'Giữ thế, hậu động',summary:'Thời thế lợi chủ: giữ vị trí, tích lực, để đối phương động trước rồi mới ứng.'},
  strategic_retreat:{label:'Rút lui chiến lược',summary:'Ta suy, đối thủ vượng và khắc ta: rút khỏi mặt trận này, bảo toàn vốn, chờ thời khác.'},
  probe:{label:'Thăm dò bằng bước nhỏ',summary:'Lực hai bên chưa phân rõ: thử một bước nhỏ có thể rút lại để đo phản ứng.'},
});

function palaceOf(a,roleId){
  const role=a.roles.find(r=>r.id===roleId);
  if(!role||role.palace==null)return null;
  const p=a.palaces.find(x=>x.number===role.palace);
  return p?{role,palace:p}:null;
}
function harms(p,stem){
  const out=[];
  if(p.voided)out.push('void');
  if(p.conditions?.doorPressure)out.push('door_pressure');
  const pair=(p.stemPairs||[]).find(s=>s.heaven.han===stem);
  if(pair?.punishment)out.push('punishment');
  if(pair?.tomb??pair?.wonderTomb)out.push('tomb');
  return out;
}
export function sidePower(a,roleId){
  const hit=palaceOf(a,roleId);
  if(!hit)return null;
  const {role,palace:p}=hit,list=harms(p,role.stem);
  const base=STATUS_POWER[p.strength?.palace?.status]??STATUS_POWER[p.strength?.star?.status]??0.5;
  const door=GOOD_DOORS.has(p.door?.id)?0.2:HUNG_DOORS.has(p.door?.id)?-0.2:0;
  const spirit=['chief','heaven9','earth9'].includes(p.spirit?.id)?0.1:p.spirit?.id==='tiger'?-0.05:0;
  const power=Math.max(0,Math.min(1.5,base+door+spirit-0.25*list.length));
  return {roleId,palace:p.number,direction:p.direction,element:p.element,door:p.door?.id||null,spirit:p.spirit?.id||null,
    harms:list,power:Math.round(power*100)/100,hollow:p.voided||HOLLOW_SPIRITS.has(p.spirit?.id),
    branches:p.branches||[]};
}
// Canh on the heaven plate is the classical rival symbol when no rival role exists.
function rivalByStem(a){
  const p=a.palaces.find(x=>x.number!==5&&(x.heavenStems||[]).some(s=>s.han==='庚'));
  if(!p)return null;
  const fake={roles:[{id:'geng_rival',palace:p.number,stem:'庚'}],palaces:a.palaces};
  return {...sidePower(fake,'geng_rival'),roleId:'geng_rival'};
}
function relation(from,to){
  if(!from||!to)return 'unknown';
  if(from.palace===to.palace)return 'same';
  if(CONTROLS[from.element]===to.element)return 'controls';
  if(CONTROLS[to.element]===from.element)return 'controlled_by';
  if(GENERATES[from.element]===to.element)return 'generates';
  if(GENERATES[to.element]===from.element)return 'generated_by';
  return 'same_element';
}
// Thiên bàn = khách, địa bàn = chủ (奇門法竅·論主客), read at the self palace.
function hostGuest(a,self){
  const p=self&&a.palaces.find(x=>x.number===self.palace);
  const pair=p?.stemPairs?.[0];
  if(!pair)return {advantage:'even',basis:'Chưa đọc được thiên/địa bàn tại cung ta.'};
  const h=pair.heaven.element,e=pair.earth.element;
  if(CONTROLS[h]===e)return {advantage:'guest',basis:`Thiên bàn ${pair.heaven.vi} khắc địa bàn ${pair.earth.vi}: khách lợi, nên tiên động.`};
  if(CONTROLS[e]===h)return {advantage:'host',basis:`Địa bàn ${pair.earth.vi} khắc thiên bàn ${pair.heaven.vi}: chủ lợi, nên hậu động.`};
  return {advantage:'even',basis:'Thiên/địa bàn không khắc nhau: chủ khách ngang, xét thêm lực hai bên.'};
}
function spiritPalace(a,id){
  const p=a.palaces.find(x=>x.spirit?.id===id);
  if(!p)return null;
  return {palace:p.number,direction:p.direction,branches:p.branches||[],usable:!p.voided&&!p.conditions?.doorPressure,door:p.door?.id||null};
}
export function computeWarfare(a,{focus='strategy'}={}){
  const self=sidePower(a,'self');
  const rival=sidePower(a,'competitor')||sidePower(a,'market_rival')||rivalByStem(a);
  const capital=sidePower(a,'capital'),partner=sidePower(a,'contract'),profit=sidePower(a,'money');
  const customer=sidePower(a,'customer'),decision=sidePower(a,'decisionMaker')||sidePower(a,'authority');
  const hg=hostGuest(a,self),heaven=spiritPalace(a,'heaven9'),earth=spiritPalace(a,'earth9'),harmony=spiritPalace(a,'harmony');
  const vsRival=relation(self,rival),partnerToSelf=relation(partner,self),selfToCounter=relation(self,customer||partner);
  const gap=self&&rival?Math.round((self.power-rival.power)*100)/100:null;
  const scores={probe:0.35};
  if(self&&rival){
    scores.attack=(gap>0.15?0.4:0)+(hg.advantage==='guest'?0.25:0)+(vsRival==='controls'?0.25:0)+(heaven?.usable?0.1:0)-(self.harms.length?0.4:0);
    scores.strategic_retreat=(gap<-0.25?0.4:0)+(vsRival==='controlled_by'?0.3:0)+(self.harms.length>=2?0.4:0)+(capital?.harms.length?0.1:0);
    scores.alliance=(gap<0?0.25:0)+(['generates','same_element'].includes(partnerToSelf)?0.35:0)+(harmony?.usable?0.15:0)-(partner?.harms.length?0.3:0);
  }
  if(profit)scores.capture_share=(profit.power>=0.8?0.25:0)+(profit.harms.length?-0.3:0.05)+(rival&&(rival.door==='shang'||rival.harms.length||rival.hollow)?0.3:0)+(focus==='business'?0.05:0);
  if(customer||partner)scores.squeeze_price=(selfToCounter==='controls'?0.4:0)+((customer||partner).harms.length?0.15:0)+(self&&!self.harms.length?0.1:0)+(focus==='negotiation'?0.15:0);
  scores.hold=(hg.advantage==='host'?0.4:0)+(earth&&self&&earth.palace===self.palace?0.25:0)+(self&&self.harms.length===1?0.1:0);
  const ranked=Object.entries(scores).map(([id,score])=>({id,score:Math.round(score*100)/100})).sort((x,y)=>y.score-x.score);
  const primary=ranked[0].id,alternative=ranked.find(r=>r.id!==primary&&r.score>0)?.id||null;
  const placeFor=id=>id==='attack'||id==='capture_share'?(heaven?.usable?heaven:profit&&{palace:profit.palace,direction:profit.direction,branches:profit.branches}):
    id==='alliance'||id==='squeeze_price'?(harmony?.usable?harmony:partner&&{palace:partner.palace,direction:partner.direction,branches:partner.branches}):
    id==='hold'?earth:id==='strategic_retreat'&&rival?{palace:null,direction:`tránh hướng ${rival.direction} (phía đối thủ)`,branches:[]}:null;
  const place=placeFor(primary);
  const action={
    branch:primary,label:BRANCHES[primary].label,summary:BRANCHES[primary].summary,alternative,
    direction:place?.direction||null,palace:place?.palace??null,
    hours:(place?.branches||[]).map(hourRange),
    orientation:primary==='hold'?'Tựa lưng về hướng Cửu Địa, giữ vị trí.':primary==='strategic_retreat'?'Lùi khỏi phía đối thủ, không đối đầu trực diện.':place?.direction?`Tiến / hướng mặt về ${place.direction}.`:null,
  };
  return Object.freeze({version:WARFARE_VERSION,focus,
    sides:{self,rival,capital,partner,profit,customer,decision},
    hostGuest:hg,initiative:hg.advantage==='guest'?'move_first':hg.advantage==='host'?'move_second':'undetermined',
    powerGap:gap,selfVsRival:vsRival,partnerToSelf,
    hollowFull:{self:self?.hollow?'hư':'thực',rival:rival?rival.hollow?'hư':'thực':null},
    nineHeaven:heaven,nineEarth:earth,sixHarmony:harmony,
    ranking:ranked,action,
    note:'Mô hình binh pháp diễn giải từ bàn; không phải xác suất thắng thua. Canh là biểu tượng đối thủ khi người hỏi chưa nhập Can Chi đối thủ cụ thể.'});
}
