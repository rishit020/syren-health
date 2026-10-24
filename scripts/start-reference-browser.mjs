import {launch} from './browser.mjs';
const browser=await launch({args:['--remote-debugging-port=9333']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.goto('https://luvia.framer.website/',{waitUntil:'domcontentloaded'});
console.log('Reference CDP ready on http://127.0.0.1:9333');
process.on('SIGTERM',async()=>{await browser.close();process.exit()});
await new Promise(()=>{});
