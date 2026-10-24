import fs from 'node:fs/promises';
import {launch} from './browser.mjs';
const browser=await launch();
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.route(/events\.framer\.com|framer\.com\/edit\?/,route=>route.abort());
const evidence={selector:'.framer-dz5nr6',route:'/about',viewport:{width:1440,height:900}};
for(const[name,origin]of[['original','https://luvia.framer.website'],['local',process.env.LOCAL_URL||'http://127.0.0.1:4173']]){
 await page.goto(origin+'/about',{waitUntil:'domcontentloaded'});
 await page.waitForSelector(evidence.selector);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(400);
 evidence[name]=await page.evaluate(async selector=>{
  const element=document.querySelector(selector);const before={opacity:getComputedStyle(element).opacity,transform:getComputedStyle(element).transform};
  const start=performance.now();scrollTo(0,element.getBoundingClientRect().top+scrollY-300);const frames=[];
  await new Promise(resolve=>{function sample(){const style=getComputedStyle(element),matrix=new DOMMatrixReadOnly(style.transform==='none'?undefined:style.transform);frames.push({ms:performance.now()-start,opacity:Number(style.opacity),y:matrix.m42});if(performance.now()-start<2300)requestAnimationFrame(sample);else resolve()}requestAnimationFrame(sample)});
  return{before,frames};
 },evidence.selector);
}
await browser.close();
const closest=(frames,ms)=>frames.reduce((a,b)=>Math.abs(a.ms-ms)<Math.abs(b.ms-ms)?a:b);
evidence.checkpoints=[350,1000,2100].map(ms=>({ms,original:closest(evidence.original.frames,ms),local:closest(evidence.local.frames,ms)}));
const curve=(frames,key,color)=>`<polyline fill="none" stroke="${color}" stroke-width="2.5" points="${frames.map(f=>`${50+f.ms/2300*700},${key==='opacity'?235-f.opacity*190:485-f.y/60*190}`).join(' ')}"/>`;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560"><rect width="800" height="560" fill="#fff"/><g font-family="system-ui" font-size="14" fill="#222"><text x="50" y="25">Observed About-page reveal: original and local</text><text x="50" y="53" fill="#b05a36">Original</text><text x="145" y="53" fill="#167178">Local</text><text x="50" y="80">Opacity (0–1)</text><text x="50" y="280">Y offset (60–0 px)</text><text x="50" y="525">0 ms</text><text x="680" y="525">2300 ms</text><path d="M50 95V235H750M50 295V485H750" fill="none" stroke="#ddd"/></g>${curve(evidence.original.frames,'opacity','#b05a36')}${curve(evidence.local.frames,'opacity','#167178')}${curve(evidence.original.frames,'y','#b05a36')}${curve(evidence.local.frames,'y','#167178')}</svg>`;
await fs.mkdir('reference/motion/comparison',{recursive:true});
await fs.writeFile('reference/motion/comparison/frames.json',JSON.stringify(evidence,null,2));
await fs.writeFile('reference/motion/comparison/curves.svg',svg);
console.log(JSON.stringify(evidence.checkpoints,null,2));
