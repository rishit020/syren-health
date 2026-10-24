import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {launch,settle} from './browser.mjs';
import {faqContent} from '../src/site-chrome.js';
const base=process.env.LOCAL_URL||'http://127.0.0.1:4173';
const out='reference/validation/final-syren';
await fs.mkdir(out,{recursive:true});
const browser=await launch();
const report={viewports:[],errors:[],resources:[],links:[],contact:null};
try{
for(const [name,width,height]of[['desktop',1440,900],['comment',1356,924],['laptop',1280,800],['tablet',768,1024],['mobile',390,844]]){
 const page=await browser.newPage({viewport:{width,height}});
 page.on('pageerror',e=>report.errors.push({name,error:e.message}));
 page.on('response',r=>{if(r.status()>=400)report.resources.push({name,url:r.url(),status:r.status()});});
 for(const route of['/','/contact','/404']){
  await page.goto(base+route);await page.waitForSelector('h1');await settle(page,900);
  const fullHeight=await page.evaluate(()=>document.documentElement.scrollHeight);
  for(let y=0;y<fullHeight;y+=height*0.65){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(70);}
  await settle(page,900);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name}${route} overflow`);
  assert.equal(await page.locator('img').evaluateAll(images=>images.filter(i=>i.getBoundingClientRect().width&&(!i.complete||!i.naturalWidth)).length),0,`${name}${route} image`);
  const text=await page.locator('body').innerText();
  assert.doesNotMatch(text,/biomarker|longevity|Founder of Quora|Alex Martin|Full Lab Analysis|Systemic Growth/i,`${name}${route} old copy`);
  assert.match(await page.locator('footer').innerText(),/Syren Health/);
  assert.equal(await page.locator('footer form').count(),0);
  const links=await page.locator('a[href]').evaluateAll(nodes=>nodes.filter(n=>n.getBoundingClientRect().width).map(n=>({text:n.textContent.trim(),href:n.getAttribute('href')})));
  for(const link of links){
   if(link.href.startsWith('/'))assert.ok(/^\/(?:#(?:top|approach|device|features|how-it-works|engineering|testimonials|faq)|contact)?$/.test(link.href),`Unexpected link ${link.href}`);
  }
  if(route==='/'){
   for(const id of['top','approach','device','features','how-it-works','engineering','testimonials','faq'])assert.equal(await page.locator(`[id="${id}"]`).count(),1,`${name} anchor ${id}`);
   const engineering=await page.locator('#engineering').innerText();
   assert.match(engineering,/60 GHz/);assert.match(engineering,/32 × 24/);assert.match(engineering,/Wi-Fi CSI/);
   assert.match(engineering,/Built & measured/i);assert.match(engineering,/Coordinated room mesh/);assert.match(engineering,/Planned/i);
   assert.match(engineering,/synthetic data · not a live clinical deployment/);
   assert.equal(await page.locator('#engineering img').getAttribute('src'),'/syren/clinic-overview-wide.png');
   assert.equal(await page.locator('a[data-syren-how-step="3"] img').getAttribute('src'),'/syren/clinic-overview-card.png');
   assert.equal(await page.locator('section[data-syren-home] video').getAttribute('src'),'/assets/7fb2ddfe0ad9a1.webm');
   await page.locator('#faq').scrollIntoViewIfNeeded();await settle(page,600);
   for(const faq of faqContent){
    const button=page.getByRole('button',{name:faq.question,exact:true});await button.click();
    await page.waitForTimeout(260);await expectExpanded(page,faq,true);
    await page.getByRole('button',{name:faq.question,exact:true}).press('Enter');await page.waitForTimeout(260);await expectExpanded(page,faq,false);
   }
   if(width<=809){
    await page.evaluate(()=>scrollTo(0,0));await settle(page,300);
    await page.getByRole('button',{name:'Open menu',exact:true}).click();await settle(page,450);
    const about=page.locator('nav:visible a[href="/#approach"]');await about.click();await settle(page,900);
    assert.equal(new URL(page.url()).hash,'#approach');assert.ok(await page.getByRole('button',{name:'Open menu',exact:true}).isVisible());
   }
   if(name==='desktop')report.links=links;
  }
  if(['desktop','mobile','tablet'].includes(name)){
   await page.screenshot({path:`${out}/${name}-${route==='/'?'home':route.slice(1)}-full.png`,fullPage:true});
   if(route==='/'){
    await page.locator('#faq').scrollIntoViewIfNeeded();await settle(page,700);await page.screenshot({path:`${out}/${name}-faq.png`});
    await page.locator('footer').scrollIntoViewIfNeeded();await settle(page,700);await page.screenshot({path:`${out}/${name}-footer.png`});
   }
  }
  report.viewports.push({name,width,height,route,overflow:false,images:true,copy:true,links:true});
 }
 await page.close();console.log('PASS',name,'all active routes, FAQ, anchors, menu and assets');
}
const contact=await browser.newPage({viewport:{width:1280,height:900}});
const posts=[];contact.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
await contact.route('https://formsubmit.co/ajax/rishit020@gmail.com',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:'true'})}));
await contact.goto(base+'/contact');await contact.waitForSelector('[data-syren-contact]');
await contact.getByPlaceholder('Full name',{exact:true}).fill('Local QA');await contact.getByPlaceholder('Email',{exact:true}).fill('local-qa@example.invalid');
await contact.locator('select[name="Connection to care"]').selectOption('Care-team member');await contact.locator('select[name="Topic"]').selectOption('Ask about the prototype');
await contact.locator('textarea[name="Message"]').fill('Local intercepted submission check only.');await contact.getByRole('button',{name:'Send inquiry',exact:true}).click();
const status=contact.locator('[data-syren-contact] [role="status"]');await status.waitFor();
await contact.getByText('Thank you—your inquiry has been submitted.',{exact:false}).waitFor();
assert.deepEqual(posts,['https://formsubmit.co/ajax/rishit020@gmail.com']);
report.contact={validated:true,recipient:'rishit020@gmail.com',directSubmission:true,providerIntercepted:true,liveDeliveryVerified:false};
await contact.close();
const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await reduced.goto(base);await reduced.waitForSelector('#testimonials');await reduced.locator('#testimonials').scrollIntoViewIfNeeded();await settle(reduced,500);assert.equal(await reduced.locator('.syren-progress__card').first().evaluate(e=>getComputedStyle(e).opacity),'1');await reduced.close();
assert.deepEqual(report.errors,[]);assert.deepEqual(report.resources,[]);
await fs.writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log('PASS contact submission (intercepted), reduced motion, no runtime/resource errors');
}finally{await browser.close();}
async function expectExpanded(page,faq,open){const button=page.getByRole('button',{name:faq.question,exact:true});assert.equal(await button.getAttribute('aria-expanded'),String(open));if(open)assert.ok((await button.innerText()).includes(faq.answer));}
