import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {deliverContact,contactEndpoint} from '../src/contact-delivery.js';
import {launch,settle} from './browser.mjs';
const output='reference/validation/contact-delivery';await fs.mkdir(output,{recursive:true});
const fake=body=>async()=>({ok:true,json:async()=>body});
assert.deepEqual(await deliverContact({},{fetcher:fake({success:'true'})}),{activation:false});
assert.deepEqual(await deliverContact({},{fetcher:fake({success:false,message:'Please activate your form'})}),{activation:true});
await assert.rejects(deliverContact({},{fetcher:fake({success:'false'})}));
await assert.rejects(deliverContact({},{fetcher:async()=>({ok:false,json:async()=>({success:'true'})})}));
await assert.rejects(deliverContact({},{fetcher:async()=>{throw new Error('network');}}));
await assert.rejects(deliverContact({},{fetcher:async(_url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('timeout')))),timeout:5}));
const b=await launch();let calls=[];let behavior='success';let release;
try{for(const [name,width]of[['desktop',1356],['mobile',390]]){
 const p=await b.newPage({viewport:{width,height:924}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route(contactEndpoint,async route=>{calls.push(route.request().postDataJSON());if(behavior==='pending')await new Promise(r=>{release=r;});if(behavior==='network'){await route.abort();return;}await route.fulfill({status:behavior==='http'?503:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(behavior==='activation'?{success:false,message:'Please activate your form'}:behavior==='refused'?{success:'false'}:{success:'true'})});});
 await p.goto('http://127.0.0.1:4173/contact');await p.waitForSelector('[data-syren-contact]');await settle(p,700);
 const form=p.locator('[data-syren-contact]');const send=p.getByRole('button',{name:'Send inquiry',exact:true});
 assert.ok(await send.isDisabled());const initial=calls.length;await form.evaluate(f=>f.requestSubmit());assert.equal(calls.length,initial);assert.equal(await form.locator('[role="status"]').count(),0);
 async function fill(){await p.getByPlaceholder('Full name',{exact:true}).fill('Website QA');await p.getByPlaceholder('Email',{exact:true}).fill('qa@example.invalid');await p.locator('select[name="Connection to care"]').selectOption('Family member');await p.locator('select[name="Topic"]').selectOption('General question');await p.locator('textarea').fill('Synthetic local test.');await p.getByLabel('Overnight care',{exact:true}).check();}
 await fill();behavior='pending';const before=calls.length;await send.click();await p.waitForFunction(()=>document.querySelector('form[data-syren-contact]').dataset.sending==='true');assert.ok(await p.getByRole('button',{name:'Sending inquiry'}).isDisabled());await p.screenshot({path:`${output}/${name}-sending.png`});
 // A second submit event cannot start a duplicate request.
 await form.evaluate(f=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));assert.equal(calls.length,before+1);release();await p.getByText('Thank you—your inquiry has been submitted.',{exact:false}).waitFor();assert.equal(await p.getByPlaceholder('Full name',{exact:true}).inputValue(),'');assert.equal(calls.at(-1).email,'qa@example.invalid');assert.equal(calls.at(-1).Interests,'Overnight care');assert.ok(!('recipient' in calls.at(-1)));await p.screenshot({path:`${output}/${name}-success.png`});
 await fill();behavior='network';await send.click();await form.locator('[role="alert"]').waitFor();assert.equal(await p.getByPlaceholder('Full name',{exact:true}).inputValue(),'Website QA');assert.ok(await send.isEnabled());await p.screenshot({path:`${output}/${name}-error.png`});
 behavior='activation';await send.click();await p.getByText('Email delivery is awaiting activation.',{exact:false}).waitFor();assert.equal(await p.getByPlaceholder('Full name',{exact:true}).inputValue(),'Website QA');
 const honey= form.locator('input[name="_honey"]');await honey.fill('bot',{force:true});const count=calls.length;await send.click();await p.waitForTimeout(100);assert.equal(calls.length,count);
 assert.deepEqual(errors,[]);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.close();console.log('PASS',name,'validation, pending, no duplicate, success, errors, retained input, activation, honeypot');
}await fs.writeFile(`${output}/report.json`,JSON.stringify({localOnly:true,liveDeliveryVerified:false,recipient:'rishit020@gmail.com',requestsIntercepted:calls.length,unitCases:6,viewports:['desktop','mobile']},null,2));}finally{await b.close();}
