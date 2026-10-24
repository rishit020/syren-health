import fs from 'node:fs/promises';
import {PNG} from 'pngjs';
import {headingInk} from './screenshot.mjs';
const directory=`reference/validation/${process.env.RUN||'final'}`;
const rows=JSON.parse(await fs.readFile(`${directory}/report.json`,'utf8'));
const issues=[];
for(const row of rows){
 if(row.error)continue;
 const heading=row.geometry.headings[0];
 const key=row.route==='/'?'home':row.route.slice(1).replaceAll('/','__');
 const png=PNG.sync.read(await fs.readFile(`${directory}/${key}/${row.viewport}/local.png`));
 const quality=headingInk(png,heading);
 if(!quality.valid)issues.push({route:row.route,viewport:row.viewport,quality});
}
await fs.writeFile(`${directory}/paint-audit.json`,JSON.stringify({checked:rows.length,issues},null,2));
console.log('Paint audit:',rows.length,'captures,',issues.length,'blank heading frames',JSON.stringify(issues));
