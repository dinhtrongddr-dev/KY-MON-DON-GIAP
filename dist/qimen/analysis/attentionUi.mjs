export const ATTENTION_VERSION='KM-UI-ATTENTION-1.0';

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const maxBand=items=>items.reduce((m,x)=>Math.max(m,x.band),0);

function warningSignals(analysis,palaceNumber){
  const p=analysis.palaces.find(x=>x.number===palaceNumber);
  const structure=analysis.structures.byPalace[palaceNumber];
  const out=[];
  const add=(band,code,label,detail)=>out.push({band,code,label,detail});
  if(p.conditions.punishment.length)add(2,'punishment','Kích Hình',p.conditions.punishment.join(', '));
  if(p.conditions.wonderTombs.length)add(2,'wonder_tomb','Tam Kỳ Nhập Mộ',p.conditions.wonderTombs.join(', '));
  if(p.conditions.doorPressure)add(1,'door_pressure','Môn Bức','Môn khắc Cung; điều kiện hành động bị ép.');
  if(p.voided)add(1,'void','Tuần Không','Tín hiệu dễ bị giảm thực chất hoặc chậm hình thành.');
  for(const row of structure.patterns||[])if(row.tone==='severe_adverse')add(2,row.id,row.name,row.plainMeaning);
  return out;
}

function supportSignals(analysis,palaceNumber){
  const structure=analysis.structures.byPalace[palaceNumber],keying=analysis.keying.byPalace[palaceNumber],formation=analysis.formations.byPalace[palaceNumber];
  const out=[];
  const add=(band,code,label,detail)=>out.push({band,code,label,detail});
  for(const row of structure.patterns||[]){
    if(row.tone==='strong_favorable'&&row.qualified!==false)add(2,row.id,row.name,row.plainMeaning);
    else if(row.tone==='favorable'&&row.qualified!==false)add(1,row.id,row.name,row.plainMeaning);
  }
  if(keying?.doorDoor?.tone==='strong_favorable')add(1,keying.doorDoor.id,keying.doorDoor.heavenDoorVi+'+'+keying.doorDoor.earthDoorVi,keying.doorDoor.plainMeaning);
  for(const row of formation?.matches||[])if(row.qualified)add(1,row.id,row.name,row.plainMeaning);
  return out;
}

function headline(supportBand,warningBand){
  if(supportBand===2&&warningBand===2)return {kind:'conflict',label:'Xung đột mạnh',short:'Xung đột'};
  if(warningBand===2)return {kind:'danger',label:'Cảnh báo mạnh',short:'Cảnh báo'};
  if(supportBand===2&&warningBand===1)return {kind:'mixed',label:'Thuận mạnh nhưng có cản',short:'Thuận + cản'};
  if(supportBand===2)return {kind:'strong_support',label:'Thuận mạnh',short:'Thuận mạnh'};
  if(warningBand===1&&supportBand===1)return {kind:'mixed',label:'Có hỗ trợ nhưng cần chú ý',short:'Hỗ trợ + cản'};
  if(warningBand===1)return {kind:'warning',label:'Cần chú ý',short:'Chú ý'};
  if(supportBand===1)return {kind:'support',label:'Có hỗ trợ',short:'Hỗ trợ'};
  return {kind:'neutral',label:'Bình thường',short:'Bình thường'};
}

export function attentionForPalace(analysis,palaceNumber){
  const warnings=warningSignals(analysis,palaceNumber),supports=supportSignals(analysis,palaceNumber);
  const warningBand=maxBand(warnings),supportBand=maxBand(supports),h=headline(supportBand,warningBand);
  return freeze({
    version:ATTENTION_VERSION,palace:palaceNumber,
    supportBand,warningBand,kind:h.kind,label:h.label,shortLabel:h.short,
    supports,warnings,
    meaning:'Đây là mức ưu tiên đọc giao diện, không phải xác suất, điểm số vận mệnh hay kết luận tốt/xấu tuyệt đối.'
  });
}

export function buildAttentionProfile(analysis){
  const byPalace=Object.fromEntries(analysis.palaces.map(p=>[p.number,attentionForPalace(analysis,p.number)]));
  const global=[];
  const layers=analysis.patterns.layers||{};
  if(layers.starFanYin||layers.doorFanYin)global.push({kind:'warning',label:'Phản Ngâm',detail:'Toàn bàn có xu hướng đảo chiều/dao động; không tự đồng nghĩa thất bại.'});
  if(layers.starFuYin||layers.doorFuYin)global.push({kind:'hold',label:'Phục Ngâm',detail:'Toàn bàn có xu hướng lặp/giữ/chậm; không tự đồng nghĩa xấu.'});
  return freeze({version:ATTENTION_VERSION,byPalace,global,
    legend:[
      {kind:'strong_support',label:'Thuận mạnh',meaning:'Có cát cách mạnh, nhưng vẫn phải xét blocker và Dụng Thần.'},
      {kind:'support',label:'Có hỗ trợ',meaning:'Có lớp hỗ trợ đáng chú ý.'},
      {kind:'warning',label:'Cần chú ý',meaning:'Có cản cấu trúc cần kiểm tra.'},
      {kind:'danger',label:'Cảnh báo mạnh',meaning:'Có Kích Hình/Nhập Mộ hoặc cấu trúc cản mạnh.'},
      {kind:'conflict',label:'Xung đột mạnh',meaning:'Cát cách mạnh và cản mạnh cùng tồn tại; không cộng trừ thành điểm.'}
    ],
    policy:{numericScore:false,probability:false,verdictOverride:false,sevenStarsPath:false}
  });
}
