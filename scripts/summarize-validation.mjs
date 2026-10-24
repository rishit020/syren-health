import fs from 'node:fs/promises';
import {viewports} from './browser.mjs';
const directory=`reference/validation/${process.env.RUN||'final'}`;
const rows=JSON.parse(await fs.readFile(`${directory}/report.json`,'utf8'));
const routes=JSON.parse(await fs.readFile('reference/routes.json','utf8'));
const keys=new Set(rows.map(row=>`${row.route}|${row.viewport}`));
const expected=routes.flatMap(route=>Object.keys(viewports).map(viewport=>`${route}|${viewport}`));
const ratios=rows.filter(row=>!row.error).map(row=>row.differenceRatio).sort((a,b)=>a-b);
const paint=JSON.parse(await fs.readFile(`${directory}/paint-audit.json`,'utf8'));
const summary={
 routes:routes.length,viewports,comparisons:rows.length,uniqueComparisons:keys.size,
 missing:expected.filter(key=>!keys.has(key)),
 failedCaptures:rows.filter(row=>row.error).map(row=>({route:row.route,viewport:row.viewport,error:row.error})),
 runtimeErrors:rows.flatMap(row=>row.errors||[]),
 brokenImages:rows.flatMap(row=>row.geometry?.brokenImages||[]),
 heightMismatches:rows.filter(row=>row.heightDelta).map(row=>({route:row.route,viewport:row.viewport,delta:row.heightDelta})),
 horizontalOverflow:rows.filter(row=>row.geometry?.scrollWidth>row.geometry?.width+1).map(row=>({route:row.route,viewport:row.viewport})),
 blankPaintFrames:paint.issues,
 pixelDifference:{medianPercent:100*ratios[Math.floor(ratios.length/2)],p95Percent:100*ratios[Math.floor(ratios.length*.95)],maxPercent:100*ratios.at(-1),threshold:.12,excludeAntiAliasing:true},
};
await fs.writeFile(`${directory}/summary.json`,JSON.stringify(summary,null,2));
const failures=summary.missing.length+summary.failedCaptures.length+summary.runtimeErrors.length+summary.brokenImages.length+summary.heightMismatches.length+summary.horizontalOverflow.length+summary.blankPaintFrames.length;
const intro=`## Validation summary\n\n- ${summary.routes} routes at ${Object.keys(viewports).length} sizes: ${summary.comparisons} comparisons.\n- Missing combinations: ${summary.missing.length}; failed captures: ${summary.failedCaptures.length}.\n- Page-height differences: ${summary.heightMismatches.length}; horizontal overflow: ${summary.horizontalOverflow.length}.\n- Runtime errors: ${summary.runtimeErrors.length}; broken images: ${summary.brokenImages.length}; rejected/remaining blank frames: ${summary.blankPaintFrames.length}.\n- Changed pixels: median ${summary.pixelDifference.medianPercent.toFixed(3)}%, 95th percentile ${summary.pixelDifference.p95Percent.toFixed(3)}%, maximum ${summary.pixelDifference.maxPercent.toFixed(3)}%.\n\nPixelmatch uses threshold 0.12 and excludes anti-aliasing. These percentages describe the saved images; they are not a perceptual fidelity score. Videos are paused after a completed seek to one second. About's repeating strip/carousel is held at the same logical frame only during static captures. Live motion remains enabled in the application.\n\n[Open the comparison gallery](index.html). Interaction and responsive-motion results are stored one directory above.\n\n`;
const old=await fs.readFile(`${directory}/REPORT.md`,'utf8');
await fs.writeFile(`${directory}/REPORT.md`,old.replace(/^# Visual comparison\n/,'# Visual comparison\n\n'+intro));
console.log(JSON.stringify(summary,null,2));
if(failures)process.exitCode=1;
