import {randomBytes} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,renameSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {
  OUTCOME_REGISTRY_VERSION,VALIDATION_SNAPSHOT_SCHEMA,buildValidationSnapshot,normalizeOutcomeSubmission,summarizeValidationRecords
} from '../dist/qimen/validation/protocol.mjs';

const MAX_RECORDS=10000;
const RECORD_ID=/^[A-Za-z0-9_-]{20,64}$/;

export function defaultOutcomeRegistryPath(){
  const explicit=process.env.QIMEN_OUTCOME_REGISTRY?.trim();if(explicit)return explicit;
  const appRoot=process.env.QIMEN_APP_ROOT?.trim();if(appRoot)return resolve(appRoot,'outcome-registry.json');
  const base=process.env.HOME||process.cwd();
  return resolve(base,'.local/state/kymon/outcome-registry.json');
}
const clone=value=>structuredClone(value);
function validateLoadedRecord(record){
  if(!record||typeof record!=='object'||!RECORD_ID.test(record.id)||record.snapshot?.schemaVersion!==VALIDATION_SNAPSHOT_SCHEMA)return null;
  if(record.outcome!=null&&record.outcome?.registryVersion!==OUTCOME_REGISTRY_VERSION)return null;
  return {id:record.id,createdAt:record.createdAt,snapshot:record.snapshot,outcome:record.outcome??null};
}
function load(filePath){
  if(!filePath||!existsSync(filePath))return [];
  const parsed=JSON.parse(readFileSync(filePath,'utf8'));
  if(parsed?.version!==OUTCOME_REGISTRY_VERSION||!Array.isArray(parsed.records))throw new Error('KM-OUTCOME-REGISTRY: file registry sai version hoặc hỏng cấu trúc.');
  const rows=parsed.records.map(validateLoadedRecord);
  if(rows.some(x=>!x))throw new Error('KM-OUTCOME-REGISTRY: có record không hợp lệ; dừng thay vì bỏ qua im lặng.');
  if(rows.length>MAX_RECORDS)throw new Error('KM-OUTCOME-REGISTRY: vượt giới hạn record.');
  const ids=new Set(),fps=new Set(),units=new Set();
  for(const row of rows){
    if(ids.has(row.id))throw new Error('KM-OUTCOME-REGISTRY: record id trùng.');
    ids.add(row.id);
    const fp=row.snapshot.requestFingerprint;
    if(fps.has(fp))throw new Error('KM-OUTCOME-REGISTRY: requestFingerprint trùng; registry phải de-duplicate.');
    fps.add(fp);
    const unit=row.snapshot.evaluationUnitRef;
    if(unit&&units.has(unit))throw new Error('KM-OUTCOME-REGISTRY: evaluationUnitRef trùng; không đếm lặp cùng một outcome unit.');
    if(unit)units.add(unit);
  }
  return rows;
}
export function createOutcomeRegistry({filePath=null,now=()=>Date.now()}={}){
  let records=load(filePath);
  const persist=()=>{
    if(!filePath)return;
    mkdirSync(dirname(filePath),{recursive:true,mode:0o700});
    const tmp=`${filePath}.${process.pid}.tmp`;
    writeFileSync(tmp,JSON.stringify({version:OUTCOME_REGISTRY_VERSION,records}),{encoding:'utf8',mode:0o600});
    renameSync(tmp,filePath);
  };
  const registerPrepared=(prepared,{track='MONITORING',evaluationUnitRef=null}={})=>{
    const snapshot=buildValidationSnapshot(prepared,{capturedAt:now(),track,evaluationUnitRef});
    const existing=records.find(r=>r.snapshot.requestFingerprint===snapshot.requestFingerprint);
    if(existing)return {record:clone(existing),reused:true};
    if(snapshot.evaluationUnitRef&&records.some(r=>r.snapshot.evaluationUnitRef===snapshot.evaluationUnitRef))throw new Error('KM-OUTCOME-REGISTRY: evaluationUnitRef đã có snapshot; không đếm lặp cùng một outcome unit.');
    if(records.length>=MAX_RECORDS)throw new Error('KM-OUTCOME-REGISTRY: đã đạt giới hạn record.');
    const createdAt=new Date(now()).toISOString();
    const record={id:randomBytes(18).toString('base64url'),createdAt,snapshot,outcome:null};
    records=[...records,record];persist();
    return {record:clone(record),reused:false};
  };
  const recordOutcome=(id,submission)=>{
    if(!RECORD_ID.test(String(id||'')))throw new Error('KM-OUTCOME-REGISTRY: recordId không hợp lệ.');
    const index=records.findIndex(r=>r.id===id);
    if(index<0)throw new Error('KM-OUTCOME-REGISTRY: không tìm thấy snapshot.');
    if(records[index].outcome)throw new Error('KM-OUTCOME-REGISTRY: outcome đã khóa; Phase 12 không cho sửa đè. Sai dữ liệu phải loại record khỏi benchmark bằng quy trình review ngoài registry.');
    const outcome=normalizeOutcomeSubmission(records[index].snapshot,submission,{recordedAt:now()});
    records[index]={...records[index],outcome};persist();
    return clone(records[index]);
  };
  const report=()=>summarizeValidationRecords(records,{asOf:now()});
  const get=id=>{
    const row=records.find(r=>r.id===id);return row?clone(row):null;
  };
  const list=()=>records.map(clone);
  return {registerPrepared,recordOutcome,report,get,list};
}
