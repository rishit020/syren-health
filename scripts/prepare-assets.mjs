import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
const root='public/reference';let urls=new Set();
async function jsonFiles(dir){let a=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())a.push(...await jsonFiles(p));else if(p.endsWith('.json'))a.push(p)}return a}
const files=(await jsonFiles(root)).filter(f=>(!process.env.ONLY_STATES||f.includes("/states/"))&&(!process.env.ONLY_VARIANT||f.endsWith('/'+process.env.ONLY_VARIANT+'.json')));const data=[];
for(const f of files){try{const j=JSON.parse(await fs.readFile(f,'utf8'));data.push([f,j]);const all=JSON.stringify(j);for(const m of all.matchAll(/https:\/\/(?:framerusercontent\.com|fonts\.gstatic\.com)[^\s"'<>\\)]+/g)){const u=m[0].replace(/&amp;/g,'&');if(/\.(?:woff2?|ttf|otf|jpe?g|png|webp|svg|gif|avif|webm|mp4)(?:\?|$)/i.test(u))urls.add(u)}}catch{}}
let manifest={};try{manifest=JSON.parse(await fs.readFile('reference/asset-manifest.json','utf8'))}catch{}
const queue=[...urls].filter(u=>!manifest[u]);let done=0;await fs.mkdir('public/assets',{recursive:true});
async function worker(){while(queue.length){const url=queue.shift();try{const p=new URL(url);const ext=path.extname(p.pathname);const name=crypto.createHash('sha256').update(url).digest('hex').slice(0,14)+ext;const res=await fetch(url);if(!res.ok)throw Error(res.status);const buf=Buffer.from(await res.arrayBuffer());await fs.writeFile('public/assets/'+name,buf);manifest[url]={local:'/assets/'+name,bytes:buf.length,contentType:res.headers.get('content-type'),source:url};if(++done%20===0)console.log('assets downloaded',done)}catch(e){console.error('ASSET_ERROR',url,e.message)}}}
await Promise.all(Array.from({length:6},worker));await fs.writeFile('reference/asset-manifest.json',JSON.stringify(manifest,null,2));
// Rewrites are idempotent and limited to exact inventoried asset URLs.
for(const [file,j] of data){let raw=JSON.stringify(j);for(const [url,m] of Object.entries(manifest).sort((a,b)=>b[0].length-a[0].length)){raw=raw.split(url).join(m.local).split(url.replaceAll('&','&amp;')).join(m.local)}await fs.writeFile(file,raw)}
console.log('ASSETS_READY',Object.keys(manifest).length,'files',data.length,'page/state captures');
