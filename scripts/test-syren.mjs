import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {launch,settle,freezeMedia} from './browser.mjs';

const base=process.env.LOCAL_URL||'http://127.0.0.1:5173';
const out='reference/validation/syren';
await fs.mkdir(out,{recursive:true});
const browser=await launch();
const context=await browser.newContext({viewport:{width:1440,height:900},permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage();
const checks=[],errors=[],failedResources=[],externalWrites=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)failedResources.push({status:r.status(),url:r.url()});});
page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method())&&!r.url().startsWith(base))externalWrites.push({method:r.method(),url:r.url()});});
async function check(name,fn){try{const evidence=await fn();checks.push({name,passed:true,...evidence});console.log('PASS',name);}catch(e){checks.push({name,passed:false,error:e.stack});console.error('FAIL',name,e.message);}}
async function open(path='/'){await page.goto(base+path);await page.waitForSelector('main');await settle(page,1000);}
async function revealAll(){await page.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=innerHeight*.75){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,110));}scrollTo({top:0,behavior:"instant"});});await settle(page,2300);const hidden=await page.locator('main section').evaluateAll(sections=>sections.filter(e=>Number(getComputedStyle(e).opacity)<.999).map(e=>e.id));assert.deepEqual(hidden,[],'all sections settle visibly before capture');}
try {
 await check('Syren copy, metadata and intended workflow replace template claims',async()=>{
  await open();const text=await page.locator('body').innerText();assert.equal(await page.locator('h1').count(),1);assert.match(await page.locator('h1').innerText(),/Overnight awareness,\s*without wearables\./);assert.match(await page.title(),/Syren Health/);assert.doesNotMatch(text,/Luvia|biomarker|longevity|FDA|HIPAA|98%|testimonials|pricing|camera-free|clinically proven/i);assert.doesNotMatch(await page.locator('head').innerHTML(),/Luvia|biomarker|longevity/i);for(const step of ['Sense','Recognize','Inform'])assert.match(text,new RegExp(step));assert.match(text,/develop/i);
 });
 await check('Navigation targets resolve to sections on this page',async()=>{
  const links=await page.locator('a[href]').evaluateAll(as=>as.map(a=>({href:a.getAttribute('href'),text:a.textContent.trim()})));
  const invalid=await page.evaluate(links=>links.filter(l=>l.href.startsWith('#')&&l.href.length>1&&!document.getElementById(decodeURIComponent(l.href.slice(1)))),links);assert.deepEqual(invalid,[]);
  assert.ok(links.some(l=>l.href==='#device'));assert.ok(links.some(l=>l.href==='#how-it-works'));assert.ok(links.some(l=>l.href==='#contact'));
  assert.ok(!links.some(l=>/^\/(pricing|news|success-stories|legal)/.test(l.href)));return{links:links.length};
 });
 await check('Desktop, laptop, tablet and mobile remain within the viewport',async()=>{
  const sizes={desktop:{width:1440,height:900},laptop:{width:1280,height:800},tablet:{width:768,height:1024},mobile:{width:390,height:844}};const geometry=[];
  for(const[name,size]of Object.entries(sizes)){await page.setViewportSize(size);await open();await revealAll();await freezeMedia(page);const g=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,h1Font:getComputedStyle(document.querySelector('h1')).fontFamily,h1Weight:getComputedStyle(document.querySelector('h1')).fontWeight,h1Size:getComputedStyle(document.querySelector('h1')).fontSize,h2Size:getComputedStyle(document.querySelector('h2')).fontSize,background:getComputedStyle(document.body).backgroundColor,images:[...document.images].map(i=>({src:i.currentSrc,complete:i.complete,width:i.naturalWidth}))}));assert.ok(g.scrollWidth<=g.width+1,JSON.stringify(g));assert.match(g.h1Font,/Domine/);assert.equal(g.h1Weight,'600');assert.equal(g.h1Size,size.width>=1200?'80px':'42px');assert.equal(g.h2Size,size.width>=1200?'36px':'26px');assert.equal(g.background,'rgb(254, 249, 239)');assert.ok(g.images.every(i=>i.complete&&i.width>0));await page.screenshot({path:`${out}/${name}-full.png`,fullPage:true});await page.screenshot({path:`${out}/${name}-hero.png`});geometry.push({name,...g});}
  return{geometry};
 });
 await check('Original animated 3D artwork remains in the hero',async()=>{
  await open();const video=page.locator('.hero video');assert.equal(await video.count(),1);assert.equal(await video.getAttribute('src'),'/assets/7fb2ddfe0ad9a1.webm');await page.waitForFunction(()=>document.querySelector('.hero video').readyState>=2);const before=await video.evaluate(v=>v.currentTime);await page.waitForTimeout(250);assert.ok(await video.evaluate(v=>v.currentTime)>before);assert.equal(await page.locator('.hero img').count(),0);
 });
 await check('Supplied device renders switch views without distorted proportions',async()=>{
  const section=page.locator('#device');await section.scrollIntoViewIfNeeded();const img=section.locator('img');await img.waitFor();await page.waitForFunction(()=>document.querySelector('#device img')?.naturalWidth>0);assert.match(await img.getAttribute('src'),/device-detail/);assert.equal(await img.evaluate(e=>getComputedStyle(e).objectFit),'contain');await section.getByRole('button',{name:'Side view',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#device img')?.src.includes('device-alternate')&&document.querySelector('#device img')?.complete);assert.equal(await section.getByRole('button',{name:'Side view',exact:true}).getAttribute('aria-pressed'),'true');await page.waitForTimeout(2300);await section.evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-80,behavior:'instant'}));await page.locator('body').click({position:{x:2,y:100}});await page.screenshot({path:`${out}/device-side-view.png`});await section.getByRole('button',{name:'Front view',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#device img')?.src.includes('device-detail')&&document.querySelector('#device img')?.complete);
 });
 await check('Contact fields keep native validation and clearly disclose local-only behavior',async()=>{
  await page.setViewportSize({width:1440,height:900});await open();const form=page.locator('#contact form');assert.equal(await form.count(),1);assert.equal(await form.evaluate(f=>f.checkValidity()),false);const surrounding=await page.locator('#contact').innerText();assert.match(surrounding,/not sent|not connected|not yet connected|not configured|local|delivery/i);
  await form.getByLabel(/^Name$|Full name/i).fill('Local Browser Test');await form.getByLabel(/Work email/i).fill('qa@example.invalid');await form.getByLabel(/Organization/i).fill('Local QA');await form.getByLabel(/Message/i).fill('Local interface test only. No patient information.');assert.equal(await form.evaluate(f=>f.checkValidity()),true);
  const submit=form.locator('button[type="submit"]');await submit.click();await page.waitForTimeout(200);const status=await form.locator('[role="status"]').innerText();assert.match(status,/not (?:been )?sent|not connected|not configured|local|copied|draft/i);assert.equal(externalWrites.length,0);await page.screenshot({path:`${out}/contact-state.png`});
 });
 await check('Copy details preserves a complete local draft without sending',async()=>{
  const form=page.locator('#contact form');await form.getByRole('button',{name:'Copy details',exact:true}).click();await page.waitForTimeout(100);const copied=await page.evaluate(()=>navigator.clipboard.readText());assert.match(copied,/Local Browser Test/);assert.match(copied,/qa@example.invalid/);assert.match(copied,/Organization: Local QA/);assert.match(copied,/No patient information/);assert.match(await form.locator('[role="status"]').innerText(),/copied/i);assert.deepEqual(externalWrites,[]);
 });
 await check('Mobile menu opens, closes and follows its anchors',async()=>{
  await page.setViewportSize({width:390,height:844});await open();const openButton=page.getByRole('button',{name:/Open menu|Open navigation/i});await openButton.click();const closeButton=page.getByRole('button',{name:/Close menu|Close navigation/i});await closeButton.waitFor();await page.waitForTimeout(550);await page.screenshot({path:`${out}/mobile-menu.png`});await closeButton.press('Escape');await openButton.waitFor();await openButton.click();const nav=page.locator('nav').filter({has:page.locator('a[href="#device"]')});const device=nav.locator('a[href="#device"]:visible').last();await device.click();await page.waitForTimeout(700);assert.equal(new URL(page.url()).hash,'#device');assert.ok(await openButton.isVisible());
 });
 await check('Retired routes cannot display inherited template pages',async()=>{
  for(const path of ['/pricing','/news/why-biomarkers-matter','/legal/privacy-policy','/unrecognized-route','/#%']){await open(path);assert.doesNotMatch(await page.locator('body').innerText(),/Luvia|biomarker|longevity|Sarah Mitchel|Codecraft/i);}
 });
 await check('Reduced-motion preference keeps content visible',async()=>{
  const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const p=await reduced.newPage();await p.goto(base);await p.waitForSelector('h1');await settle(p,200);assert.equal(await p.locator('h1').evaluate(e=>getComputedStyle(e).opacity),'1');assert.equal(await p.locator('.hero video').evaluate(v=>v.paused),true);assert.equal(await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.getTiming().iterations===Infinity).length),0);await reduced.close();
 });
 await check('No runtime errors, missing resources or external form submissions',async()=>{assert.deepEqual(errors,[]);assert.deepEqual(failedResources,[]);assert.deepEqual(externalWrites,[]);});
 const manifest=JSON.parse(await fs.readFile('public/syren/product-images.json','utf8'));
 if(process.env.REQUIRE_PRODUCT_IMAGES==='1')await check('Supplied hardware imagery is integrated',async()=>{assert.ok(manifest.heroArtwork?.src);assert.ok(manifest.detail?.src);assert.ok(manifest.alternate?.src);});
 await fs.writeFile(`${out}/report.json`,JSON.stringify({base,checks,errors,failedResources,externalWrites,productImages:manifest.status},null,2));
} finally {await browser.close();}
if(checks.some(c=>!c.passed))process.exitCode=1;
