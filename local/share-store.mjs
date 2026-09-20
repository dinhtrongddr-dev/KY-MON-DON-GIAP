import {randomBytes} from 'node:crypto';
import {mkdir,readFile,readdir,rename,stat,unlink,writeFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join} from 'node:path';

export const SHARE_SCHEMA='QimenShare/1';
const SHARE_ID=/^[A-Za-z0-9_-]{20,64}$/;
const MAX_SHARE_BYTES=256000,MAX_SHARE_FILES=1000;

export function defaultShareDir(){
  return process.env.QIMEN_SHARE_DIR?.trim()||join(homedir(),'.local','share','kymon-shares');
}
function esc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function text(value){return esc(String(value??'').replace(/\s+/g,' ').trim());}
function runs(items=[]){return items.map(run=>run?.bold?'<strong>'+text(run.text)+'</strong>':text(run?.text)).join('');}
function sections(items=[]){
  return items.map(section=>'<section class="reading"><h3>'+text(section.title||'Nội dung')+'</h3>'+
    (section.paragraphs||[]).map(p=>'<p>'+runs(p)+'</p>').join('')+'</section>').join('');
}
function contexts(items=[]){
  return items.map(section=>'<section class="reading"><h3>'+text(section.title||'Nội dung')+'</h3><p>'+text(section.text)+'</p></section>').join('');
}
function boardHtml(board={}){
  const order=[4,9,2,3,5,7,8,1,6],by=new Map((board.palaces||[]).map(x=>[Number(x.number),x]));
  const entity=(label,item)=>item?.vi?'<p><b>'+label+'</b><span>'+text([item.vi,item.han,item.duty].filter(Boolean).join(' · '))+'</span></p>':'';
  const cells=order.map(number=>{
    const p=by.get(number)||{number,title:'Cung '+number};
    const markers=p.markers?.length?'<div class="markers">'+p.markers.map(x=>'<span>'+text(x)+'</span>').join('')+'</div>':'';
    return '<article class="palace'+(p.self?' self':'')+'"><header><strong>'+text(p.title||('Cung '+number))+'</strong><span>'+text(p.subtitle)+'</span></header>'+
      markers+entity('Bát thần',p.spirit)+entity('Cửu tinh',p.star)+entity('Thiên bàn',p.heaven)+entity('Bát môn',p.door)+entity('Địa bàn',p.earth)+
      (p.centerNote?'<p class="center-note">'+text(p.centerNote)+'</p>':'')+'</article>';
  }).join('');
  const flags=(board.flags||[]).map(x=>'<span class="flag">'+text(x)+'</span>').join('');
  return '<section class="panel"><h2>Bàn Kỳ Môn</h2><div class="board">'+cells+'</div>'+(flags?'<div class="flags">'+flags+'</div>':'')+'</section>';
}
export function renderSharePage(record){
  const report=record.report||{},inputs=(report.inputFields||[]).map(x=>'<div class="field"><b>'+text(x.label)+'</b><span>'+text(x.value)+'</span></div>').join('');
  const model=report.model?'<p class="model">Model: '+text(report.model)+'</p>':'';
  const context=contexts(report.contextSections),analysis=sections(report.analysisSections),ai=sections(report.aiSections);
  const title=report.reportType==='Mệnh'?'Kỳ Môn Mệnh':'Kỳ Môn Hỏi Việc';
  const css=':root{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;color:#202923;background:#f3f6f4}*{box-sizing:border-box}body{margin:0;background:#f3f6f4}.page{width:min(1120px,calc(100% - 24px));margin:24px auto 56px}.hero,.panel,.reading{background:#fff;border:1px solid #d7e0db;border-radius:14px;box-shadow:0 8px 24px rgba(30,55,43,.06)}.hero{padding:24px}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#2c6a53}.hero h1{margin:6px 0 4px;color:#173f32}.sub,.model{color:#647169;margin:4px 0}.fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:18px}.field{padding:12px 14px;background:#f6f9f7;border-radius:10px}.field b,.field span{display:block}.field b{font-size:12px;color:#647169;margin-bottom:4px}.panel{padding:18px;margin-top:16px}.panel h2{color:#173f32;margin:0 0 14px}.board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.palace{border:1px solid #bac8c0;border-radius:10px;padding:10px;min-height:190px;background:#fbfcfb}.palace.self{border:3px solid #173f32;background:#eef6f1}.palace header{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid #dce4df;padding-bottom:7px;margin-bottom:8px}.palace header span{font-size:11px;color:#647169;text-align:right}.palace p{display:flex;gap:8px;justify-content:space-between;margin:7px 0;font-size:13px}.palace p b{color:#647169;font-size:11px}.palace p span{text-align:right}.markers,.flags{display:flex;flex-wrap:wrap;gap:5px}.markers span,.flag{font-size:11px;padding:4px 7px;border-radius:999px;background:#f4f0df;color:#6c561c}.flags{margin-top:12px}.reading{padding:18px;margin-top:12px}.reading h3{margin:0 0 9px;color:#173f32}.reading p{line-height:1.65;margin:8px 0}.section-title{margin:26px 2px 8px;color:#173f32}.foot{color:#647169;font-size:12px;text-align:center;margin-top:22px}@media(max-width:640px){.page{width:min(100% - 12px,1120px);margin-top:8px}.hero,.panel,.reading{border-radius:10px;padding:13px}.hero h1{font-size:24px}.fields{grid-template-columns:1fr}.board{gap:4px}.palace{padding:6px;min-height:164px}.palace header{display:block}.palace header span{display:block;text-align:left;margin-top:2px}.palace p{display:block;font-size:10px;margin:5px 0}.palace p b{display:block;font-size:9px}.palace p span{display:block;text-align:left}.markers span,.flag{font-size:9px}.reading p{line-height:1.55}}';
  return '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>'+title+'</title><style>'+css+'</style></head><body><main class="page"><section class="hero"><div class="eyebrow">Kỳ Môn Độn Giáp · Link chia sẻ</div><h1>'+title+'</h1><p class="sub">Tạo lúc '+text(report.generatedAt||record.createdAt||'')+'</p>'+model+'<div class="fields">'+inputs+'</div></section>'+boardHtml(report.board)+(context?'<h2 class="section-title">Đối chiếu bàn</h2>'+context:'')+(analysis?'<h2 class="section-title">Luận giải</h2>'+analysis:'')+(ai?'<h2 class="section-title">Bài luận AI</h2>'+ai:'')+'<p class="foot">Link chỉ hiển thị bản dữ liệu đã chia sẻ; không chứa mã kết nối AI.</p></main></body></html>';
}
export async function saveShare(shareDir,payload){
  const raw=JSON.stringify(payload);
  if(Buffer.byteLength(raw)>MAX_SHARE_BYTES)throw new Error('Dữ liệu chia sẻ quá lớn.');
  if(payload?.schemaVersion!==SHARE_SCHEMA||!['question','menh'].includes(payload.kind)||!payload.report||typeof payload.report!=='object')throw new Error('Dữ liệu chia sẻ không hợp lệ.');
  await mkdir(shareDir,{recursive:true});
  const id=randomBytes(18).toString('base64url'),record={id,schemaVersion:SHARE_SCHEMA,kind:payload.kind,createdAt:new Date().toISOString(),report:payload.report};
  const tmp=join(shareDir,'.'+id+'.'+process.pid+'.tmp'),file=join(shareDir,id+'.json');
  await writeFile(tmp,JSON.stringify(record),{encoding:'utf8',mode:0o600});await rename(tmp,file);
  try{
    const files=(await readdir(shareDir)).filter(name=>name.endsWith('.json')&&SHARE_ID.test(name.slice(0,-5)));
    if(files.length>MAX_SHARE_FILES){
      const rows=(await Promise.all(files.map(async name=>{try{return {name,mtime:(await stat(join(shareDir,name))).mtimeMs};}catch{return null;}}))).filter(Boolean).sort((a,b)=>a.mtime-b.mtime);
      for(const row of rows.slice(0,files.length-MAX_SHARE_FILES))await unlink(join(shareDir,row.name)).catch(()=>{});
    }
  }catch{}
  return record;
}
export async function loadShare(shareDir,id){
  if(!SHARE_ID.test(id))return null;
  try{const record=JSON.parse(await readFile(join(shareDir,id+'.json'),'utf8'));return record?.schemaVersion===SHARE_SCHEMA?record:null;}catch{return null;}
}
