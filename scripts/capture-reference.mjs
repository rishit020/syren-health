import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { launch,settle,viewports,slug } from './browser.mjs';
const origin='https://luvia.framer.website';
const sitemap=await (await fetch(origin+'/sitemap.xml')).text();
const routes=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1]).pathname);
routes.push('/404');
await fs.mkdir('public/reference',{recursive:true});await fs.mkdir('reference/source',{recursive:true});
await fs.writeFile('reference/routes.json',JSON.stringify(routes,null,2));
await fs.writeFile('reference/sitemap.xml',sitemap);
const browser=await launch();let completed=0;
const queue=routes.slice();
async function worker(workerId){
 const context=await browser.newContext({deviceScaleFactor:1,viewport:viewports.desktop});
 // Never submit a reference form or leak inspection traffic into its analytics.
 await context.route(/events\.framer\.com|api\.framer\.com\/forms|framer\.com\/forms/,r=>r.abort());
 const page=await context.newPage();page.setDefaultTimeout(15000);
 let network=[];page.on('response',r=>{if(/framerusercontent\.com|fonts\.(googleapis|gstatic)\.com/.test(r.url()))network.push({url:r.url(),status:r.status(),type:r.request().resourceType(),contentType:r.headers()['content-type']})});
 while(queue.length){
  const route=queue.shift(),key=slug(route);
  try{
   const resp=await fetch(origin+route);await fs.writeFile(`reference/source/${key}.html`,await resp.text());
   for(const [viewport,dimensions] of Object.entries(viewports).filter(([key])=>!process.env.VIEWPORTS||process.env.VIEWPORTS.split(',').includes(key))){
    const dir=`reference/captures/${key}/${viewport}`;await fs.mkdir(dir,{recursive:true});network=[];
    await page.setViewportSize(dimensions);await page.goto(origin+route,{waitUntil:'domcontentloaded',timeout:45000});await settle(page,850);
    await page.evaluate(async()=>{for(const v of document.querySelectorAll('video')){v.pause();try{v.currentTime=1}catch{}}await Promise.all([...document.images].map(i=>i.complete?Promise.resolve():new Promise(r=>{i.onload=i.onerror=r;setTimeout(r,1500)})))});
    let y=0,index=0,height=await page.evaluate(()=>document.body.scrollHeight);
    const step=Math.round(dimensions.height*.85);
    while(y<height){
     await page.evaluate(y=>window.scrollTo(0,y),y);await page.waitForTimeout(220);
     await page.screenshot({path:`${dir}/scroll-${String(index).padStart(2,'0')}.png`,animations:'disabled'});
     y+=step;index++;height=await page.evaluate(()=>document.body.scrollHeight);
    }
    await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(3400);
    await page.evaluate(()=>{for(const v of document.querySelectorAll('video')){v.pause();try{v.currentTime=1}catch{}}});await page.waitForTimeout(300);
    await page.screenshot({path:`${dir}/full.png`,fullPage:true,animations:'disabled'});
    const data=await page.evaluate(()=>{
     const attrs=e=>Object.fromEntries([...e.attributes].map(a=>[a.name,a.value]));
     const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y+scrollY,width:r.width,height:r.height}};
     const visible=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).display!=='none'};
     const props=['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color','backgroundColor','padding','gap','borderRadius','maxWidth','boxShadow','display','position','transform','opacity'];
     const computed=e=>Object.fromEntries(props.map(k=>[k,getComputedStyle(e)[k]]));
     const clone=document.body.cloneNode(true);clone.querySelectorAll('script,noscript,#__framer-editorbar').forEach(e=>e.remove());
     const css=[...document.styleSheets].map(s=>{try{return [...s.cssRules].map(r=>r.cssText).join('\n')}catch{return ''}}).join('\n');
     const root=document.querySelector('#main > div[class]');
     const sectionNodes=[...document.querySelectorAll('#main section,#main nav,#main footer')].filter(visible);
     return {title:document.title,bodyHtml:clone.innerHTML,css,bodyAttrs:attrs(document.body),htmlAttrs:attrs(document.documentElement),rootAttrs:root?attrs(root):{},height:document.body.scrollHeight,headings:[...document.querySelectorAll('h1,h2,h3,h4')].filter(visible).map(e=>({text:e.innerText,tag:e.tagName,rect:rect(e),styles:computed(e)})),sections:sectionNodes.map(e=>({name:e.getAttribute('data-framer-name'),tag:e.tagName,classes:e.className,rect:rect(e),text:e.innerText?.slice(0,240),styles:computed(e)})),links:[...document.querySelectorAll('a[href]')].filter(visible).map(e=>({text:e.innerText.trim(),href:e.getAttribute('href'),target:e.target})),controls:[...document.querySelectorAll('button,input,select,textarea,[role=button]')].filter(visible).map(e=>({tag:e.tagName,text:e.innerText,type:e.type,name:e.name,ariaLabel:e.getAttribute('aria-label'),placeholder:e.placeholder,attrs:attrs(e),rect:rect(e)})),media:[...document.querySelectorAll('img,video,source')].map(e=>({tag:e.tagName,src:e.src,currentSrc:e.currentSrc,srcset:e.srcset,poster:e.poster,alt:e.alt})),resources:performance.getEntriesByType('resource').map(r=>({url:r.name,initiator:r.initiatorType})),geometry:[...document.querySelectorAll('h1,h2,h3,p,button,img')].filter(visible).slice(0,240).map(e=>({tag:e.tagName,text:(e.innerText||e.alt||'').slice(0,90),rect:rect(e),styles:computed(e)}))};
    });
    data.path=route;data.viewport=viewport;data.dimensions=dimensions;data.network=network;
    await fs.mkdir(`public/reference/${key}`,{recursive:true});await fs.writeFile(`public/reference/${key}/${viewport}.json`,JSON.stringify(data));
    console.log(`captured ${route} ${viewport}: ${height}px, ${index} viewport frames`);
   }
   console.log(`PAGE_COMPLETE ${++completed}/${routes.length} ${route}`);
  }catch(error){console.error('CAPTURE_ERROR',route,error.message);await fs.appendFile('reference/capture-errors.log',`${route} ${error.stack}\n`)}
 }
 await context.close();
}
await Promise.all([worker(1),worker(2)]);await browser.close();
console.log('REFERENCE_CAPTURE_COMPLETE');
