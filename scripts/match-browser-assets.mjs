import fs from 'node:fs/promises';
import path from 'node:path';

const accept='image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8';
const manifest=JSON.parse(await fs.readFile('reference/asset-manifest.json','utf8'));
const queue=Object.values(manifest).filter(item=>/image\/(?:png|jpeg|webp|avif)/.test(item.contentType||''));
const replacements=new Map();
async function worker(){while(queue.length){const item=queue.shift();
 const response=await fetch(item.source,{headers:{Accept:accept}});
 if(!response.ok)throw Error(`Asset request failed: ${response.status} ${item.source}`);
 const contentType=response.headers.get('content-type');
 const extension=contentType==='image/avif'?'.avif':contentType==='image/webp'?'.webp':path.extname(item.local);
 const local=item.local.slice(0,-path.extname(item.local).length)+extension;
 const bytes=Buffer.from(await response.arrayBuffer());
 await fs.writeFile('public'+local,bytes);
 if(local!==item.local){replacements.set(item.local,local);item.previousLocal=item.local;}
 Object.assign(item,{local,bytes:bytes.length,contentType,downloadHeaders:{Accept:accept}});
}}
await Promise.all(Array.from({length:5},worker));
async function rewrite(directory){for(const item of await fs.readdir(directory,{withFileTypes:true})){const file=path.join(directory,item.name);if(item.isDirectory())await rewrite(file);else if(item.name.endsWith('.json')){let text=await fs.readFile(file,'utf8');for(const[before,after]of replacements)text=text.split(before).join(after);await fs.writeFile(file,text);}}}
await rewrite('public/reference');
await fs.writeFile('reference/asset-manifest.json',JSON.stringify(manifest,null,2));
await fs.writeFile('reference/browser-asset-negotiation.json',JSON.stringify({accept,replacements:Object.fromEntries(replacements),reason:'Source Chromium network evidence reports AVIF responses for the same raster image URLs; match browser content negotiation rather than generic */* downloads.'},null,2));
console.log('BROWSER_ASSETS_MATCHED',replacements.size,'raster paths updated');
