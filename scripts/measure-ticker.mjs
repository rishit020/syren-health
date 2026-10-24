import fs from 'node:fs/promises';
import {launch} from './browser.mjs';
const browser=await launch(),page=await browser.newPage(),output=[];
for(const width of [1440,1024]){
 await page.setViewportSize({width,height:900});
 await page.goto('https://luvia.framer.website/about',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1000);
 const state=()=>page.evaluate(()=>{
  const ul=document.querySelector('ul'),rect=ul.parentElement.getBoundingClientRect();
  return{ms:performance.now(),transform:getComputedStyle(ul).transform,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},children:[...ul.children].map(element=>({width:element.getBoundingClientRect().width,text:element.innerText?.slice(0,30)}))};
 });
 const samples=[];
 for(let index=0;index<5;index++){samples.push(await state());await page.waitForTimeout(500);}
 const rect=samples[0].rect;
 await page.mouse.move(width/2,Math.max(70,Math.min(850,rect.y+30)));
 const hover=[await state()];await page.waitForTimeout(1200);hover.push(await state());
 output.push({width,samples,hover});
}
await fs.writeFile('reference/motion/about-ticker.json',JSON.stringify(output,null,2));
console.log(output.map(item=>({width:item.width,transforms:item.samples.map(sample=>[Math.round(sample.ms),sample.transform]),hover:item.hover.map(sample=>[Math.round(sample.ms),sample.transform]),children:item.samples[0].children})));
await browser.close();
