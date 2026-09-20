import {BRANCHES,PALACES} from '../../qimen.mjs';

const DAY_MS=86400000;
const iso=date=>date.toISOString().slice(0,10);
const display=date=>{const [y,m,d]=iso(date).split('-');return `${d}/${m}/${y}`;};
const mod=(n,m)=>((n%m)+m)%m;
const branchIndex=han=>BRANCHES.findIndex(b=>b.han===han);
const utcDate=(y,m,d)=>new Date(Date.UTC(y,m-1,d));
const dateFromIso=value=>{const [y,m,d]=value.split('-').map(Number);return utcDate(y,m,d);};

function responseCandidates(board,selected,window){
  if(!window||!board?.input||!board?.pillars?.day?.branch)return [];
  const anchor=utcDate(board.input.year,board.input.month,board.input.day);
  const startMs=Math.max(anchor.getTime(),dateFromIso(window.start).getTime());
  const endMs=dateFromIso(window.end).getTime();
  if(startMs>endMs)return [];
  const current=branchIndex(board.pillars.day.branch.han);
  if(current<0)return [];

  const relevant=selected.filter(b=>b?.palace&&b.states?.some(s=>s.code==='void'||s.code==='horse'));
  const voidBundles=relevant.filter(b=>b.states.some(s=>s.code==='void'));
  // Traditional priority: if the selected/useful symbol is Void, resolve/fill the Void first.
  const active=voidBundles.length?voidBundles:relevant.filter(b=>b.states.some(s=>s.code==='horse'));
  if(!active.length)return [];
  const rule=voidBundles.length?'void_release':'horse_activation';
  const rows=[];

  for(let ms=startMs;ms<=endMs&&rows.length<6;ms+=DAY_MS){
    const date=new Date(ms),offset=Math.round((ms-anchor.getTime())/DAY_MS),idx=mod(current+offset,12),reasons=[],evidenceIds=[];
    for(const bundle of active){
      const palaceBranches=PALACES[bundle.palace]?.branches||[],localReasons=[];
      if(rule==='void_release'){
        if(palaceBranches.includes(idx))localReasons.push(`Điền thực Không vong tại cung ${bundle.palace}`);
        if(palaceBranches.some(v=>mod(v+6,12)===idx))localReasons.push(`Xung Không tại cung ${bundle.palace}`);
      }else{
        const horse=branchIndex(board.horseBranch?.han);
        if(horse>=0&&idx===horse)localReasons.push(`Mã tinh lâm ${BRANCHES[idx].vi}`);
        if(horse>=0&&idx===mod(horse+6,12))localReasons.push(`Xung Mã tinh bằng ${BRANCHES[idx].vi}`);
      }
      if(localReasons.length){reasons.push(...localReasons);evidenceIds.push(...bundle.evidenceIds.filter(id=>/^p\d+$|^c\d+$/.test(id)));}
    }
    if(reasons.length)rows.push({date:iso(date),display:display(date),branch:BRANCHES[idx].han,branchVi:BRANCHES[idx].vi,rule,reasons:[...new Set(reasons)],evidenceIds:[...new Set(evidenceIds)]});
  }
  return rows;
}

export function buildTiming(context,board,selected=[]) {
  const h=context.timeHorizon,input=board?.input;
  let window=null,windowable=false;
  if(input){
    const anchor=utcDate(input.year,input.month,input.day),start=new Date(anchor),end=new Date(anchor);
    switch(h.code){
      case 'this_week':case 'next_week':{
        start.setUTCDate(start.getUTCDate()-((start.getUTCDay()+6)%7)+(h.code==='next_week'?7:0));end.setTime(start.getTime());end.setUTCDate(end.getUTCDate()+6);windowable=true;break;
      }
      case 'this_month':case 'next_month':start.setUTCDate(1);if(h.code==='next_month')start.setUTCMonth(start.getUTCMonth()+1);end.setTime(start.getTime());end.setUTCMonth(end.getUTCMonth()+1);end.setUTCDate(0);windowable=true;break;
      case 'tomorrow':start.setUTCDate(start.getUTCDate()+1);end.setTime(start.getTime());windowable=true;break;
      case 'today':windowable=true;break;
      case 'duration':{
        if(!Number.isSafeInteger(h.amount)||h.amount<1||h.amount>365)break;
        if(h.unit==='day'||h.unit==='week')end.setUTCDate(end.getUTCDate()+h.amount*(h.unit==='week'?7:1));
        else {const day=end.getUTCDate();end.setUTCDate(1);end.setUTCMonth(end.getUTCMonth()+h.amount*(h.unit==='year'?12:1));const last=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()+1,0)).getUTCDate();end.setUTCDate(Math.min(day,last));}
        windowable=true;break;
      }
      case 'milestone_age':break;
      default:break;
    }
    if(windowable)window={start:iso(start),end:iso(end),tzOffset:input.tzOffset,purpose:'question_scope_only',convention:'Tuần từ thứ Hai đến Chủ nhật; lịch dân dụng tại UTC offset của bàn.'};
  }

  const candidates=responseCandidates(board,selected,window);
  const milestoneLimit=h.status==='explicit_milestone'
    ?`Đã nhận mốc “${h.text}” như giới hạn quyết định, nhưng chưa có tuổi hiện tại hoặc ngày sinh để quy đổi thành khoảng lịch. Đây không phải ứng kỳ đã tính.`
    :candidates.length
      ?'Các mốc dưới đây là cửa sổ kích hoạt/đáng kiểm chứng theo Không vong hoặc Mã tinh trong phạm vi thời gian người dùng đã nêu; không phải ngày bảo đảm sự việc xảy ra.'
      :'Chưa có mốc ứng kỳ đủ rõ trong phạm vi câu hỏi. Không tự suy ngày từ Phản/Phục ngâm, Mộ, Hình, Can hoặc Môn khi chưa có quy tắc deterministic tương ứng.';
  return {horizon:h,window,basis:candidates.length?'deterministic_response_scan':'question_horizon_only',timingConfidence:candidates.length?'medium':'low',
    allowedPredictions:candidates.flatMap(c=>[c.display,c.date]),candidates,
    signals:selected.flatMap(b=>b.states.filter(s=>['void','horse','fan_yin','fu_yin','tomb','punishment'].includes(s.code)).map(s=>({code:s.code,evidenceIds:[`p${b.palace}`,`c${b.palace}`],dateRuleImplemented:['void','horse'].includes(s.code)}))),
    unsupportedRules:['Mộ/Hình định ngày','Phản/Phục ngâm tự định ngày','Can/Môn tự định ngày'],
    limit:milestoneLimit};
}
