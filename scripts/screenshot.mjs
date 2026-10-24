import fs from 'node:fs/promises';
import {PNG} from 'pngjs';

export function headingInk(png,rectangle){
 const left=Math.max(0,Math.floor(rectangle.x)),top=Math.max(0,Math.floor(rectangle.y));
 const right=Math.min(png.width,Math.ceil(rectangle.x+rectangle.width)),bottom=Math.min(png.height,Math.ceil(rectangle.y+rectangle.height));
 let darkPixels=0;
 for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
  const index=(y*png.width+x)*4;
  if(png.data[index]+png.data[index+1]+png.data[index+2]<384)darkPixels++;
 }
 return{darkPixels,area:Math.max(0,right-left)*Math.max(0,bottom-top),valid:darkPixels>=Math.max(10,(right-left)*(bottom-top)*.0005)};
}

export async function captureStableScreenshot(page,file){
 const rectangle=await page.locator('h1:visible').first().evaluate(element=>{const r=element.getBoundingClientRect();return{x:r.x,y:r.y+scrollY,width:r.width,height:r.height}});
 for(let attempt=1;attempt<=4;attempt++){
  const buffer=await page.screenshot({fullPage:true,animations:attempt===1?'disabled':'allow'});
  const quality=headingInk(PNG.sync.read(buffer),rectangle);
  if(quality.valid){await fs.writeFile(file,buffer);return{attempts:attempt,headingInk:quality};}
  // Reject a compositor blank frame rather than treating it as a layout defect.
  await page.bringToFront();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.waitForTimeout(350);
 }
 throw Error('Chromium returned blank heading pixels despite visible DOM; screenshot rejected after four repaint attempts.');
}
