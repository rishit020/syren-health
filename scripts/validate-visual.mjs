import fs from 'node:fs/promises';import path from 'node:path';
import pixelmatch from 'pixelmatch';import {PNG} from 'pngjs';
import {launch,settle,freezeMedia,lockCarouselFrame,releaseCarouselFrame,viewports,slug} from './browser.mjs';
import {captureStableScreenshot} from './screenshot.mjs';
const base=process.env.LOCAL_URL||'http://127.0.0.1:5173';
let routes=JSON.parse(await fs.readFile('reference/routes.json','utf8'));
if(process.env.ROUTES)routes=process.env.ROUTES.split(',');
let sizes=Object.entries(viewports);if(process.env.VIEWPORTS)sizes=sizes.filter(([v])=>process.env.VIEWPORTS.split(',').includes(v));
const run=process.env.RUN||'final';const out=`reference/validation/${run}`;await fs.mkdir(out,{recursive:true});
const browser=await launch();let results=[];let tasks=routes.flatMap(route=>sizes.map(([viewport,size])=>({route,viewport,size})));
if(process.env.RESUME){results=JSON.parse(await fs.readFile(`${out}/report.json`,'utf8').catch(()=>'[]')).filter(row=>!row.error);const completed=new Set(results.map(row=>`${row.route}|${row.viewport}`));tasks=tasks.filter(task=>!completed.has(`${task.route}|${task.viewport}`));}
async function worker(){const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
while(tasks.length){const {route,viewport,size}=tasks.shift();const key=slug(route);let row={route,viewport};const start=errors.length;
try{
 await page.setViewportSize(size);await page.bringToFront();const response=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForSelector('#main',{timeout:20000});await settle(page,900);
 const height=await page.evaluate(()=>document.body.scrollHeight);
 for(let y=0;y<height;y+=size.height*.85){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(80)}
 await page.evaluate(()=>scrollTo(0,0));await settle(page,3400);
 await freezeMedia(page);
 await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.complete?Promise.resolve():new Promise(r=>{i.onload=i.onerror=r;setTimeout(r,2000)})))});
 await page.waitForTimeout(250);
 const carouselLocked=await lockCarouselFrame(page);if(carouselLocked)await page.waitForTimeout(100);
 const captureState=await page.evaluate(()=>({visibility:document.visibilityState,activeAnimations:document.getAnimations().filter(a=>a.playState==='running').length,hiddenRevealTargets:[...document.querySelectorAll('[style]')].filter(e=>e.getBoundingClientRect().width>0&&e.style.willChange.includes('transform')&&Number(getComputedStyle(e).opacity)<.05).map(e=>({className:e.className,style:e.getAttribute('style')}))}));
 const dir=`${out}/${key}/${viewport}`;await fs.mkdir(dir,{recursive:true});
 const captureQuality=await captureStableScreenshot(page,`${dir}/local.png`);
 await releaseCarouselFrame(page);
 const geometry=await page.evaluate(()=>({width:innerWidth,height:document.body.scrollHeight,scrollWidth:document.documentElement.scrollWidth,headings:[...document.querySelectorAll('h1,h2,h3,h4')].filter(e=>e.getBoundingClientRect().width).map(e=>({text:e.innerText,x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y+scrollY,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})),brokenImages:[...document.images].filter(i=>i.currentSrc&&!i.complete||i.complete&&i.naturalWidth===0&&i.currentSrc).map(i=>i.currentSrc)}));
 const refFile=`reference/captures/${key}/${viewport}/full.png`;
 const ref=PNG.sync.read(await fs.readFile(refFile));const loc=PNG.sync.read(await fs.readFile(`${dir}/local.png`));
 const width=Math.max(ref.width,loc.width),h=Math.max(ref.height,loc.height);
 const align=p=>{if(p.width===width&&p.height===h)return p;const n=new PNG({width,height:h});n.data.fill(255);PNG.bitblt(p,n,0,0,p.width,p.height,0,0);return n};
 const a=align(ref),b=align(loc),diff=new PNG({width,height:h});
 const pixels=pixelmatch(a.data,b.data,diff.data,width,h,{threshold:.12,includeAA:false});
 await fs.writeFile(`${dir}/diff.png`,PNG.sync.write(diff,{deflateLevel:1,filterType:4}));
 // 50% overlay and side by side are useful for diagnosing geometry shifts.
 const overlay=new PNG({width,height:h});for(let i=0;i<a.data.length;i+=4){overlay.data[i]=(a.data[i]+b.data[i])/2;overlay.data[i+1]=(a.data[i+1]+b.data[i+1])/2;overlay.data[i+2]=(a.data[i+2]+b.data[i+2])/2;overlay.data[i+3]=255}
 await fs.writeFile(`${dir}/overlay.png`,PNG.sync.write(overlay,{deflateLevel:1,filterType:4}));
 const side=new PNG({width:width*2,height:h});PNG.bitblt(a,side,0,0,width,h,0,0);PNG.bitblt(b,side,0,0,width,h,width,0);await fs.writeFile(`${dir}/side-by-side.png`,PNG.sync.write(side,{deflateLevel:1,filterType:4}));
 row={...row,status:response.status(),referenceHeight:ref.height,localHeight:loc.height,heightDelta:loc.height-ref.height,differentPixels:pixels,differenceRatio:pixels/(width*h),captureState,captureQuality,geometry,errors:errors.slice(start),evidenceDir:dir};
 console.log(`COMPARE ${route} ${viewport}: ${(100*row.differenceRatio).toFixed(3)}% pixels, height ${row.heightDelta>=0?'+':''}${row.heightDelta}, errors ${row.errors.length}`);
}catch(e){row.error=e.stack;console.error('COMPARE_ERROR',route,viewport,e.message)}results.push(row);await fs.writeFile(`${out}/report.json`,JSON.stringify(results,null,2));
}await page.close()}
// A single foreground page avoids Chromium deferring WAAPI/observer paints in
// background tabs. Parallel snapshots produced intermittent blank reveal groups.
await worker();await browser.close();
const rows=results.filter(r=>!r.error).sort((a,b)=>b.differenceRatio-a.differenceRatio);
await fs.writeFile(`${out}/REPORT.md`,['# Visual comparison',`\nRun: ${run}. Source screenshots are under reference/captures; local/diff/overlay/side-by-side images are adjacent to this report. Pixel differences include moving media and do not by themselves establish layout quality.\n`,'| Route | Viewport | Different pixels | Height delta | Errors |','|---|---|---:|---:|---:|',...rows.map(r=>`| ${r.route} | ${r.viewport} | ${(100*r.differenceRatio).toFixed(3)}% | ${r.heightDelta}px | ${r.errors.length} |`),...results.filter(r=>r.error).map(r=>`\nFAILED ${r.route} ${r.viewport}: ${r.error}`)].join('\n'));
console.log('VALIDATION_COMPLETE',rows.length,'comparisons');
