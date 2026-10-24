import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
const candidates = [process.env.CHROME_PATH, chromium.executablePath(), '/Users/rishits/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'];
export const executablePath = candidates.find(candidate => candidate && existsSync(candidate));
export async function launch(options={}) { return chromium.launch({ headless:true, ...(executablePath ? { executablePath } : {}), ...options }); }
export async function settle(page, ms=650){await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(ms);}
export async function freezeMedia(page) {
  await page.evaluate(async () => {
    await Promise.all([...document.querySelectorAll('video')].map(async video => {
      video.pause();
      try {
        if (video.readyState < 2) await Promise.race([
          new Promise(resolve => video.addEventListener('loadeddata', resolve, {once:true})),
          new Promise(resolve => setTimeout(resolve, 3000)),
        ]);
        if (Math.abs(video.currentTime - 1) > .005 || video.seeking) {
          const seeked = Promise.race([
            new Promise(resolve => video.addEventListener('seeked', resolve, {once:true})),
            new Promise(resolve => setTimeout(resolve, 3000)),
          ]);
          video.currentTime = 1;
          await seeked;
        }
      } catch { /* An unavailable source is reported by resource checks. */ }
    }));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}
// Align the source and replica's autoplay carousel/ticker for static screenshots only.
// The application itself continues to autoplay and accept drag/arrow input.
export async function lockCarouselFrame(page) {
  return page.evaluate(() => {
    const next=[...document.querySelectorAll('button[aria-label="Next"]')].find(button=>button.getBoundingClientRect().width>0);
    const section=next?.closest('section');
    const ticker=[...document.querySelectorAll('ul')].find(ul=>ul.style.willChange.includes('transform')&&ul.children.length>=5&&ul.textContent.includes('Biological Data'));
    const track=section?.querySelector('ul')||ticker;
    if(!track)return false;
    const previousTransform=track.style.transform,previousPriority=track.style.getPropertyPriority('transform');
    const step=section?section.clientWidth+(parseFloat(getComputedStyle(track).gap)||0):0;
    const lock=()=>{
      for(const animation of track.getAnimations({subtree:true}))animation.cancel();
      track.style.setProperty('transform',`translateX(${section?-5*step:0}px)`,'important');
      if(section)[...track.children].forEach((slide,index)=>{const content=slide.firstElementChild;if(content){content.style.visibility='visible';content.setAttribute('aria-hidden',String(index!==5));}});
      else [...track.children].forEach(slide=>slide.style.setProperty('transform','none','important'));
      window.__referenceCarouselFrame=requestAnimationFrame(lock);
    };
    window.__releaseReferenceCarousel=()=>{cancelAnimationFrame(window.__referenceCarouselFrame);track.style.setProperty('transform',previousTransform,previousPriority);};
    lock();return true;
  });
}
export async function releaseCarouselFrame(page) {
  await page.evaluate(()=>window.__releaseReferenceCarousel?.());
}
export const viewports={desktop:{width:1440,height:900},laptop:{width:1280,height:800},tablet:{width:768,height:1024},mobile:{width:390,height:844},compact:{width:1024,height:900}};
export function slug(route){return route==='/'?'home':route.replace(/^\//,'').replaceAll('/','__');}
