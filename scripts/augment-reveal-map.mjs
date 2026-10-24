import fs from 'node:fs/promises';
import {load} from 'cheerio';
import {viewports,slug} from './browser.mjs';
const routes=JSON.parse(await fs.readFile('reference/routes.json','utf8'));
const map=JSON.parse(await fs.readFile('reference/scroll-reveals.json','utf8'));
const coverage=[];
for(const route of routes){
 const key=slug(route);const $=load(await fs.readFile(`reference/source/${key}.html`,'utf8'));const confirmed=[];
 $('[style]').each((_,element)=>{
  const node=$(element);const style=node.attr('style')||'';
  const opacity=style.match(/(?:^|;)\s*opacity\s*:\s*([\d.]+)/);
  const translate=style.match(/translateY\(\s*([-\d.]+)px\s*\)/);
  const scale=style.match(/(?:^|\s|:)scale\(\s*([\d.]+)\s*\)/);
  if(!opacity||Number(opacity[1])>.01||(!translate&&!scale)||(node.attr('class')||'').includes('__framer-badge'))return;
  const classes=(node.attr('class')||'').split(/\s+/).filter(c=>/^framer-[a-zA-Z0-9_-]+$/.test(c)&&!c.startsWith('framer-v-'));
  if(!classes.length)return;
  const initialTransform=style.match(/(?:^|;)\s*transform\s*:\s*([^;]+)/)?.[1]||'none';
  const baseTransform=initialTransform.replace(/translateY\([^)]*\)|scale\([^)]*\)/g,'').trim();
  confirmed.push({selector:'.'+classes.join('.'),initialStyle:style,initialOpacity:Number(opacity[1]),translateY:translate?Number(translate[1]):0,...(scale?{scale:Number(scale[1])}:{}),...(baseTransform&&baseTransform!=='none'?{baseTransform}:{}),...(translate&&Number(translate[1])<0?{onMount:true}:{}),name:node.attr('data-framer-name')||null,text:node.text().slice(0,90),source:'server-rendered initial source markup'});
 });
 for(const variant of Object.keys(viewports)){
  const entries=map[key][variant]||[];const known=new Set(entries.map(e=>e.selector));
  for(const entry of confirmed){const existing=entries.find(item=>item.selector===entry.selector);if(existing)Object.assign(existing,entry);else{entries.push(entry);known.add(entry.selector)}}
  map[key][variant]=entries;
 }
 coverage.push({route,confirmedSourceSelectors:confirmed.length,variantCounts:Object.fromEntries(Object.entries(map[key]).map(([v,entries])=>[v,entries.length]))});
}
await fs.writeFile('reference/scroll-reveals.json',JSON.stringify(map,null,2));
await fs.copyFile('reference/scroll-reveals.json','public/reference/scroll-reveals.json');
const selectors=Object.fromEntries(Object.entries(map).map(([route,variants])=>[route,Object.fromEntries(Object.entries(variants).map(([variant,entries])=>[variant,entries.map(entry=>({selector:entry.selector,...(entry.source==='server-rendered initial source markup'?{translateY:entry.translateY,...(entry.scale!==undefined?{scale:entry.scale}:{}),...(entry.baseTransform?{baseTransform:entry.baseTransform}:{}),...(entry.onMount?{onMount:true}:{})}:{})}))]))]));
await fs.writeFile('reference/reveal-selectors.json',JSON.stringify(selectors));
await fs.writeFile('reference/reveal-coverage.json',JSON.stringify(coverage,null,2));
console.log(JSON.stringify(coverage.map(c=>({route:c.route,confirmed:c.confirmedSourceSelectors})),null,2));
