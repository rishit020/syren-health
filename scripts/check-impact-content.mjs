import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {launch,settle} from './browser.mjs';

const out='reference/validation/impact-content';
const baseline=JSON.parse(await fs.readFile(`${out}/before.json`,'utf8'));
const browser=await launch();const page=await browser.newPage();const errors=[];const checks=[];
page.on('pageerror',error=>errors.push(error.message));
try {
  for(const before of baseline){
    await page.setViewportSize({width:before.width,height:before.height});
    await page.goto('http://127.0.0.1:4173/');
    const section=page.locator('section[data-framer-name="Impact Section"]');
    await section.scrollIntoViewIfNeeded();await settle(page,1800);
    const text=await section.innerText();
    for(const label of ['Our Purpose','More context for care.','Radar','Thermal','Night','Care','Syren Health','Supporting overnight care'])assert.ok(text.includes(label),label);
    assert.doesNotMatch(text,/Luvia|160\+|12k\+|98%|24\/7|Sarah Mitchel|Aura|biomarkers|health protocols|recovery scores/i);
    const structure=await section.evaluate(element=>{
      const clone=element.cloneNode(true);const walker=document.createTreeWalker(clone,NodeFilter.SHOW_TEXT);
      while(walker.nextNode())walker.currentNode.textContent='';return clone.outerHTML;
    });
    // Scroll visibility can leave different live reveal progress on offscreen nodes.
    // Compare every other attribute and node while ignoring those transient styles.
    const normalized=await page.evaluate(pair=>pair.map(html=>{
      const doc=new DOMParser().parseFromString(html,'text/html');
      doc.querySelectorAll('[style]').forEach(e=>{
        for(const property of ['opacity','transform','will-change'])e.style.removeProperty(property);
        if(!e.getAttribute('style'))e.removeAttribute('style');
      });return doc.body.innerHTML;
    }),[structure,before.structure]);
    assert.equal(normalized[0],normalized[1],`${before.name}: only text nodes changed`);
    const rect=await section.boundingBox();assert.equal(rect.width,before.rect.width);assert.equal(rect.height,before.rect.height);
    const videos=await section.locator('video').evaluateAll(items=>items.map(video=>({src:video.getAttribute('src'),rate:video.playbackRate})));
    assert.deepEqual(videos,before.videos);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    const clipped=await section.locator('p,h2').evaluateAll(elements=>elements.filter(e=>e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1).map(e=>e.textContent));
    assert.deepEqual(clipped,[]);
    if(['desktop','mobile','comment'].includes(before.name))await section.screenshot({path:`${out}/${before.name}-after.png`});
    checks.push({viewport:before.name,width:before.width,structureUnchanged:true,dimensionsUnchanged:true,videosUnchanged:true});
    console.log(`PASS ${before.name}: text updated, original structure, dimensions and videos preserved`);
  }
  assert.deepEqual(errors,[]);
  await fs.writeFile(`${out}/report.json`,JSON.stringify({checks,errors},null,2));
} finally {await browser.close();}
