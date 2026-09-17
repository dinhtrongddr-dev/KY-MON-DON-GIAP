const iso=date=>date.toISOString().slice(0,10);
export function buildTiming(context,board,selected=[]) {
  const h=context.timeHorizon,input=board?.input;
  let window=null;
  if(input){
    const anchor=new Date(Date.UTC(input.year,input.month-1,input.day)),start=new Date(anchor),end=new Date(anchor);
    switch(h.code){
      case 'this_week':case 'next_week':{
        start.setUTCDate(start.getUTCDate()-((start.getUTCDay()+6)%7)+(h.code==='next_week'?7:0));end.setTime(start.getTime());end.setUTCDate(end.getUTCDate()+6);break;
      }
      case 'this_month':case 'next_month':start.setUTCDate(1);if(h.code==='next_month')start.setUTCMonth(start.getUTCMonth()+1);end.setTime(start.getTime());end.setUTCMonth(end.getUTCMonth()+1);end.setUTCDate(0);break;
      case 'tomorrow':start.setUTCDate(start.getUTCDate()+1);end.setTime(start.getTime());break;
      case 'today':break;
      case 'duration':{
        if(!Number.isSafeInteger(h.amount)||h.amount<1||h.amount>365)break;
        if(h.unit==='day'||h.unit==='week')end.setUTCDate(end.getUTCDate()+h.amount*(h.unit==='week'?7:1));
        else {const day=end.getUTCDate();end.setUTCDate(1);end.setUTCMonth(end.getUTCMonth()+h.amount*(h.unit==='year'?12:1));const last=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()+1,0)).getUTCDate();end.setUTCDate(Math.min(day,last));}break;
      }
      default:break;
    }
    if(h.code!=='unknown'&&(h.code!=='duration'||Number.isSafeInteger(h.amount)&&h.amount>=1&&h.amount<=365))window={start:iso(start),end:iso(end),tzOffset:input.tzOffset,purpose:'question_scope_only',convention:'Tuần từ thứ Hai đến Chủ nhật; lịch dân dụng tại UTC offset của bàn.'};
  }
  return {horizon:h,window,basis:'question_horizon_only',timingConfidence:'low',allowedPredictions:[],
    signals:selected.flatMap(b=>b.states.filter(s=>['void','horse','fan_yin','fu_yin'].includes(s.code)).map(s=>({code:s.code,evidenceIds:[`p${b.palace}`,`c${b.palace}`],dateRuleImplemented:false}))),
    unsupportedRules:['xuất Không','điền thực','xung Không','hợp/xung định ngày','Can/Môn/Dịch Mã định ngày'],
    limit:'Chưa có mốc ứng kỳ đủ rõ. Khoảng lịch chỉ diễn tả thời hạn câu hỏi; app chưa triển khai phép định ngày từ Không, Mã hoặc Phản/Phục ngâm.'};
}
