import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {launch,settle,freezeMedia} from './browser.mjs';
const base=process.env.LOCAL_URL||'http://127.0.0.1:4173';
const out='reference/validation/scoped-content';await fs.mkdir(out,{recursive:true});
assert.equal(await fs.readFile('src/App.jsx','utf8'),await fs.readFile('reference/luvia-app-archive/App.jsx','utf8'),'route/component architecture preserved');
assert.equal(await fs.readFile('src/local.css','utf8'),await fs.readFile('reference/luvia-app-archive/local.css','utf8'),'original layout styles preserved');
const b=await launch();const p=await b.newPage();const errors=[],resources=[],checks=[];
p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)resources.push({url:r.url(),status:r.status()});});
try {
 for(const[name,size]of Object.entries({desktop:{width:1440,height:900},comment:{width:1355,height:923},laptop:{width:1280,height:800},tablet:{width:768,height:1024},mobile:{width:390,height:844}})){
  await p.setViewportSize(size);await p.goto(base);await p.waitForSelector('h1');await settle(p,3500);
  const variant=size.width<=599?'mobile':size.width<=809?'tablet':size.width<=1359?'laptop':'desktop';
  const original=JSON.parse(await fs.readFile(`public/reference/home/${variant}.json`,'utf8'));
  const originalH1=original.geometry.find(e=>e.tag==='H1');
  const actual=await p.locator('h1:visible').evaluate(e=>({text:e.textContent,height:e.getBoundingClientRect().height,font:getComputedStyle(e).fontSize,weight:getComputedStyle(e).fontWeight}));
  assert.equal(actual.text,'Awareness for overnight care.');assert.equal(actual.height,originalH1.rect.height);assert.equal(actual.font,originalH1.styles.fontSize);assert.equal(actual.weight,originalH1.styles.fontWeight);
  const logo=p.locator('nav:visible [data-syren-brand]');assert.equal(await logo.innerText(),'Syren Health');assert.equal((await logo.boundingBox()).height,25);
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  const unchanged=[];
  assert.match(await p.locator('#faq').innerText(),/What is Syren Health building/);
  assert.match(await p.locator('footer').innerText(),/Syren Health/);
  const hero=p.locator('section[data-syren-home]');const text=await hero.innerText();for(const title of['Contactless sensing','Radar · thermal · Wi-Fi CSI','Caregiver awareness'])assert.ok(text.includes(title));assert.doesNotMatch(text,/500 Members|15 Years|98%|biomarker|longevity/i);
  assert.equal(await hero.locator('[data-framer-name="Hero stats"] svg[data-syren-icon]:visible').count(),3);
  const video=hero.locator('video');assert.equal(await video.getAttribute('src'),'/assets/7fb2ddfe0ad9a1.webm');assert.equal(await video.evaluate(v=>v.playbackRate),1);
  if(size.width>=810){const cta=p.locator('nav:visible [data-syren-cta]');await cta.hover();await p.waitForTimeout(180);assert.equal((await cta.innerText()).replace(/\s/g,''),'GetinTouchGetinTouch');await p.mouse.move(1,1);}
  await freezeMedia(p);if(['desktop','mobile','comment'].includes(name))await p.screenshot({path:`${out}/${name}-hero.png`});
  await p.locator('#features').scrollIntoViewIfNeeded();await settle(p,2300);
  assert.match(await p.locator('#features').innerText(),/Built for overnight awareness/);
  const image=p.locator('#features [data-framer-name="Center image"] img');await image.waitFor();assert.ok(await image.evaluate(i=>i.complete&&i.naturalWidth>0));assert.match(await image.getAttribute('src'),/device-warm-v1.webp/);assert.equal(await image.evaluate(i=>getComputedStyle(i).objectFit),'cover');
  assert.equal((await image.boundingBox()).height,460);
  if(['desktop','mobile','comment'].includes(name))await p.screenshot({path:`${out}/${name}-features.png`});
  checks.push({name,width:size.width,heading:actual,unchangedSections:unchanged});console.log('PASS',name,'original heading size, image frame, lower sections and animation asset preserved');
 }
 await p.setViewportSize({width:390,height:844});await p.goto(base);await p.waitForSelector('h1');await settle(p,1200);await p.getByRole('button',{name:'Open menu',exact:true}).click();await p.getByRole('button',{name:'Close menu',exact:true}).waitFor();await p.waitForTimeout(500);const device=p.locator('nav:visible a[data-syren-nav-link][href="/#device"]');assert.ok(await device.isVisible());await device.click();await p.waitForTimeout(600);assert.equal(new URL(p.url()).hash,'#device');assert.ok(await p.getByRole('button',{name:'Open menu',exact:true}).isVisible());assert.match(await p.locator('nav:visible').innerText(),/Syren Health/);console.log('PASS mobile menu keeps new content and closes on section navigation');
 assert.deepEqual(errors,[]);assert.deepEqual(resources,[]);await fs.writeFile(`${out}/report.json`,JSON.stringify({checks,menuAndAnchors:true,errors,resources,preservedAppAndStyles:true},null,2));
}finally{await b.close();}
