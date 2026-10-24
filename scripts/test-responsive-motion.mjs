import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {launch,settle} from './browser.mjs';
const base=process.env.LOCAL_URL||'http://127.0.0.1:4173';
const browser=await launch(),page=await browser.newPage({viewport:{width:1280,height:800}});
const errors=[],checks=[];page.on('pageerror',error=>errors.push(error.message));
async function check(name,run){try{const evidence=await run();checks.push({name,passed:true,...evidence});console.log('PASS',name)}catch(error){checks.push({name,passed:false,error:error.stack});console.error('FAIL',name,error.message)}}
async function open(route){await page.goto(base+route);await page.waitForSelector('#main');await settle(page,650)}
await check('All 25 routes use the source scrolled header and restore their original header at top',async()=>{
 const routes=JSON.parse(await fs.readFile('reference/routes.json','utf8'));
 for(const route of routes){
  await open(route);await page.evaluate(()=>scrollTo(0,1200));await page.waitForTimeout(120);
  const nav=page.locator('nav:visible').first();
  assert.equal(await nav.evaluate(element=>getComputedStyle(element).backgroundColor),'rgb(254, 249, 239)',route);
  assert.equal(await nav.getAttribute('data-local-sticky'),'true',route);
  await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(120);
  assert.equal(await page.locator('nav:visible').first().getAttribute('data-local-sticky'),'false',route);
 }
 return{routes:routes.length};
});
await check('390px and 768px menus retain mobile layout while scrolling and opening/closing',async()=>{
 for(const width of [390,768])for(const route of ['/','/about','/legal/privacy-policy']){
  await page.setViewportSize({width,height:844});await open(route);
  await page.evaluate(()=>scrollTo(0,1200));await page.waitForTimeout(150);
  await page.getByRole('button',{name:'Open menu',exact:true}).click();await page.waitForTimeout(500);
  assert.ok(await page.getByRole('button',{name:'Close menu',exact:true}).isVisible());
  assert.ok(await page.locator('nav:visible').first().evaluate(element=>element.getBoundingClientRect().height)>300);
  await page.getByRole('button',{name:'Close menu',exact:true}).press('Enter');await page.waitForTimeout(500);
  assert.ok(await page.getByRole('button',{name:'Open menu',exact:true}).isVisible());
  assert.equal(Math.round(await page.locator('nav:visible').first().evaluate(element=>element.getBoundingClientRect().height)),56);
  await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(150);
  assert.equal(await page.locator('nav:visible').first().getAttribute('data-local-sticky'),'false');
 }
 return{widths:[390,768],routes:3};
});
await check('About desktop and compact ticker match measured 30px/s movement and continue on hover',async()=>{
 const velocities=[];
 for(const width of [1440,1024]){
  await page.setViewportSize({width,height:900});await open('/about');
  const track=page.locator('ul').first();
  const visibleCards=await track.evaluate(element=>{const clip=element.parentElement.getBoundingClientRect();return[...element.children].filter(child=>{const r=child.getBoundingClientRect();return r.right>clip.left&&r.left<clip.right&&r.width>0&&r.height>0}).length});
  assert.ok(visibleCards>=3,JSON.stringify({width,visibleCards}));
  const sample=()=>track.evaluate(element=>({ms:performance.now(),x:new DOMMatrixReadOnly(getComputedStyle(element).transform).m41}));
  const a=await sample();await page.waitForTimeout(1000);const b=await sample();
  const velocity=(b.x-a.x)/((b.ms-a.ms)/1000);
  assert.ok(velocity< -27&&velocity> -33,JSON.stringify({width,velocity}));
  const box=await track.boundingBox();await page.mouse.move(width/2,Math.min(850,box.y+30));
  const c=await sample();await page.waitForTimeout(1000);const d=await sample();
  const hoverVelocity=(d.x-c.x)/((d.ms-c.ms)/1000);
  assert.ok(hoverVelocity< -27&&hoverVelocity> -33,JSON.stringify({width,hoverVelocity}));
  velocities.push({width,velocity,hoverVelocity});
 }
 return{velocities};
});
await check('Reduced motion stops the repeating ticker and leaves content visible',async()=>{
 const context=await browser.newContext({viewport:{width:1024,height:900},reducedMotion:'reduce'}),reduced=await context.newPage();
 await reduced.goto(base+'/about');await reduced.waitForSelector('#main');
 const track=reduced.locator('ul').first();
 assert.equal(await track.evaluate(element=>new DOMMatrixReadOnly(getComputedStyle(element).transform).m41),0);
 assert.equal(await track.evaluate(element=>element.getAnimations().filter(a=>a.playState==='running').length),0);
 assert.equal(await reduced.locator('h1').first().evaluate(element=>getComputedStyle(element).opacity),'1');
 await context.close();return{};
});
await check('No runtime errors during responsive motion checks',async()=>{assert.deepEqual(errors,[]);return{errors}});
await fs.writeFile('reference/validation/responsive-motion.json',JSON.stringify({checks,errors},null,2));
await browser.close();if(checks.some(check=>!check.passed))process.exitCode=1;
