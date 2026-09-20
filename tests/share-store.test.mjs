import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readdir,rm,stat,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {loadShare,pruneShares,saveShare,SHARE_SCHEMA} from '../local/share-store.mjs';

const payload=(label='x')=>({schemaVersion:SHARE_SCHEMA,kind:'question',report:{reportType:'Hỏi việc',inputFields:[{label:'Q',value:label}],board:{palaces:[]},analysisSections:[],aiSections:[]}});
async function temp(t){const dir=await mkdtemp(join(tmpdir(),'qimen-share-store-'));t.after(()=>rm(dir,{recursive:true,force:true}));return dir;}

test('shared results expire after 90 days and expired data is deleted on access',async t=>{
  const dir=await temp(t),record=await saveShare(dir,payload('ttl')),file=join(dir,record.id+'.json'),info=await stat(file);assert.equal(Date.parse(record.expiresAt)-Date.parse(record.createdAt),90*24*60*60*1000);
  assert.ok(await loadShare(dir,record.id,{now:info.mtimeMs+89*24*60*60*1000}));
  assert.equal(await loadShare(dir,record.id,{now:info.mtimeMs+91*24*60*60*1000}),null);
  assert.equal((await readdir(dir)).length,0);
});

test('share pruning bounds both file count and total stored bytes by deleting oldest files first',async t=>{
  const dir=await temp(t);
  for(let i=0;i<5;i++){await writeFile(join(dir,String(i).repeat(24)+'.json'),'x'.repeat(100+i));await new Promise(r=>setTimeout(r,3));}
  const count=await pruneShares(dir,{ttlMs:1e12,maxFiles:3,maxBytes:10000});
  assert.equal(count.files,3);assert.equal((await readdir(dir)).length,3);
  const bytes=await pruneShares(dir,{ttlMs:1e12,maxFiles:100,maxBytes:205});
  assert.ok(bytes.bytes<=205);assert.ok(bytes.files<=2);
});
