import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(resolve(dir,e.name)):[resolve(dir,e.name)]);
const files=walk(root);let references=0;
for(const file of files.filter(f=>/\.(mjs|html|css)$/.test(f))) {
  const source=readFileSync(file,'utf8');
  if(source!==source.normalize('NFC'))throw new Error(`Văn bản chưa chuẩn NFC: ${relative(root,file)}`);
  if(file.endsWith('.mjs'))execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
  const refs=file.endsWith('.html')?[...source.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(m=>m[1]):file.endsWith('.mjs')?[...source.matchAll(/\bfrom\s+["'](\.[^"']+)["']/g)].map(m=>m[1]):[];
  for(const ref of refs){if(/^(https?:|data:|#)/.test(ref))continue;const path=resolve(dirname(file),ref.split(/[?#]/)[0]);if(!existsSync(path)||!statSync(path).isFile())throw new Error(`Thiếu asset: ${relative(root,file)} → ${ref}`);references++;}
  if(file.endsWith('.html')){const ids=[...source.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);if(ids.length!==new Set(ids).size)throw new Error(`ID trùng: ${file}`);}
}
console.log(`Static assets: ${files.length} files; ${references} local references; module syntax and NFC passed.`);
