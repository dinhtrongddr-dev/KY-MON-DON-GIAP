export const BIRTH_TIME_MODES=Object.freeze({KNOWN:'KNOWN',UNKNOWN:'UNKNOWN'});

export class MenhInputError extends Error{
  constructor(code,message){super(message);this.name='MenhInputError';this.code=code;}
}
const fail=(code,message)=>{throw new MenhInputError(code,message);};
const validDate=value=>{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;
  const [y,m,d]=value.split('-').map(Number),dt=new Date(Date.UTC(y,m-1,d));
  return dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d;
};
const validTime=value=>{
  const match=/^(\d{2}):(\d{2})$/.exec(value||'');
  return !!match&&Number(match[1])<=23&&Number(match[2])<=59;
};

export function normalizeBirthInput(input={}){
  const mode=input.birthTimeMode;
  if(!Object.values(BIRTH_TIME_MODES).includes(mode))fail('BIRTH_TIME_MODE_INVALID','Chọn biết giờ sinh hoặc không nhớ giờ sinh.');
  if(mode==='KNOWN'&&!validTime(input.birthTimeLocal))fail('BIRTH_TIME_REQUIRED','Biết giờ sinh thì phải nhập giờ hợp lệ HH:mm.');
  if(!validDate(input.birthDateLocal))fail('BIRTH_DATE_INVALID','Ngày sinh phải có dạng YYYY-MM-DD và là ngày hợp lệ.');
  const timezone=input.timezone==null?null:String(input.timezone).trim()||null;
  return Object.freeze({
    birthDateLocal:input.birthDateLocal,
    birthTimeMode:mode,
    birthTimeLocal:mode==='UNKNOWN'?null:input.birthTimeLocal,
    timezone,
  });
}
