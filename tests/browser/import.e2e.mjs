import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {books} from '../fixtures.mjs';
import {PelicanCore as C} from '../../lib/pelican-core.mjs';
const {chromium}=await import(process.env.PELICAN_PLAYWRIGHT_MODULE||'playwright');
const launch=()=>chromium.launch({headless:true,...(process.env.PELICAN_CHROMIUM?{executablePath:resolve(process.env.PELICAN_CHROMIUM),args:['--no-sandbox','--disable-gpu','--single-process','--no-zygote',...(process.env.PELICAN_CHROMIUM_ARGS?JSON.parse(process.env.PELICAN_CHROMIUM_ARGS):[])]}:{})});
const root=resolve('.'),book=books()[0],signal={kind:'PELICAN_SIGNALS',format_version:1,edition:C.REVISION,table_id:book.table_id,signal:'TST'};
const payload=(name,data)=>({name,mimeType:'application/json',buffer:Buffer.from(typeof data==='string'?data:JSON.stringify(data))});
const bf=payload('synthetic.book.json',book),sf=payload('synthetic.signals.json',signal);
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(readFileSync(root+'/docs/index.html'))});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let checks=0;const results=[];
try{
 for(const mode of ['file','http']){
  const browser=await launch();const context=await browser.newContext({offline:mode==='file',viewport:{width:1280,height:900}}),page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  const url=mode==='file'?pathToFileURL(root+'/offline.html').href:'http://127.0.0.1:'+server.address().port+'/';
  const fresh=async()=>{await page.goto(url);await page.reload();await page.waitForFunction(()=>document.querySelector('#startup').hidden)};
  const idle=()=>page.waitForFunction(()=>document.querySelector('#loaded').getAttribute('aria-busy')==='false');
  try{
   await fresh();assert(await page.locator('#bookFile').isVisible());assert(await page.locator('#signalFile').isVisible());checks++;
   // Exercise the native chooser, rather than bypassing a hidden control.
   const [chooser]=await Promise.all([page.waitForEvent('filechooser'),page.locator('#bookFile').click()]);await chooser.setFiles(bf);await idle();assert.equal(await page.locator('#table option').count(),1);checks++;
   await page.locator('#signalFile').setInputFiles(sf);await idle();assert.match(await page.locator('#loaded').innerText(),/Kennsignal geladen/);checks++;
   await page.locator('#encode').click();const wire=await page.locator('#out').innerText();assert.equal(wire.split('\n')[0],'TST');await page.locator('#input').fill(wire);await page.locator('#decode').click();assert.equal(JSON.parse(await page.locator('#decoded').innerText()).messages.length,1);checks++;
   // A signal must survive either order of overlapping file reads.
   for(const slow of ['book','signals']){
    await fresh();await page.evaluate(slow=>{const read=File.prototype.text;File.prototype.text=async function(){if(this.name.includes('.'+slow+'.json'))await new Promise(r=>setTimeout(r,250));return read.call(this)}},slow);
    const first=slow==='book'?'bookFile':'signalFile',second=slow==='book'?'signalFile':'bookFile';
    await page.locator('#'+first).setInputFiles(slow==='book'?bf:sf);assert(await page.locator('#unload').isDisabled());
    await page.locator('#'+second).setInputFiles(slow==='book'?sf:bf);await idle();assert.equal(await page.locator('#table option').count(),1);assert.match(await page.locator('#loaded').innerText(),/Kennsignal geladen/);checks++;
   }
   await fresh();await page.locator('#bookFile').setInputFiles(payload('old.book.json',{...book,edition:'1.5-DRAFT'}));await idle();assert.equal(await page.locator('#table option').count(),0);assert.match(await page.locator('#state').innerText(),/Benötigt: 1.5-SECURITY-RC2/);const pos=await page.locator('#state').boundingBox();assert(pos.y+pos.height<900);checks++;
   await page.locator('#bookFile').setInputFiles(sf);await idle();assert.match(await page.locator('#state').innerText(),/Dies ist eine Kennsignaldatei/);checks++;
   await page.locator('#signalFile').setInputFiles(bf);await idle();assert.match(await page.locator('#state').innerText(),/Dies ist eine Codetafel/);checks++;
   await page.locator('#bookFile').setInputFiles([bf,payload('broken.json','{"private-data": SECRET_MAPPING')]);await idle();assert.equal(await page.locator('#table option').count(),0);assert.match(await page.locator('#state').innerText(),/Keine gültige JSON/);assert(!(await page.locator('#state').innerText()).includes('SECRET_MAPPING'));checks++;
   // A rejected batch does not poison the queue, and older FileReader APIs still work.
   await page.evaluate(()=>{File.prototype.text=undefined});await page.locator('#bookFile').setInputFiles(payload('bom.book.json','\uFEFF'+JSON.stringify(book)));await idle();assert.equal(await page.locator('#table option').count(),1);checks++;
   await page.locator('#unload').click();assert.equal(await page.locator('#table option').count(),0);checks++;
   assert.deepEqual(errors,[]);assert(requests.every(u=>u===url));checks++;
   results.push({mode,passed:true,pageErrors:errors.length,externalRequests:requests.filter(u=>u!==url).length});
  }finally{await browser.close()}
 }
 console.log(JSON.stringify({outcome:'PASS',checks,results}));
}finally{await new Promise(r=>server.close(r))}
