import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {PNG} from 'pngjs';
const run=process.env.RUN||'final',directory=`reference/validation/${run}`;
const report=JSON.parse(await fs.readFile(`${directory}/report.json`,'utf8'));
const changes=[];
for(const row of report.filter(row=>!row.error)){
 const key=row.route==='/'?'home':row.route.slice(1).replaceAll('/','__');
 for(const name of ['diff','overlay','side-by-side']){
  const file=`${directory}/${key}/${row.viewport}/${name}.png`;
  const before=await fs.readFile(file),png=PNG.sync.read(before);
  const after=PNG.sync.write(png,{deflateLevel:6,filterType:4});
  if(after.length>=before.length)continue;
  await fs.writeFile(file+'.lossless-tmp',after);await fs.rename(file+'.lossless-tmp',file);
  changes.push({file,beforeBytes:before.length,afterBytes:after.length,pixelSha256:crypto.createHash('sha256').update(png.data).digest('hex')});
 }
}
await fs.writeFile(`${directory}/lossless-recompression.json`,JSON.stringify(changes,null,2));
console.log('Losslessly recompressed',changes.length,'comparison images; bytes saved',changes.reduce((n,c)=>n+c.beforeBytes-c.afterBytes,0));
