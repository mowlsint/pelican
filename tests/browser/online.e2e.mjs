import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {chromium}=await import(process.env.PELICAN_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.PELICAN_CHROMIUM?{executablePath:process.env.PELICAN_CHROMIUM,args:['--no-sandbox','--disable-gpu','--single-process','--no-zygote',...JSON.parse(process.env.PELICAN_CHROMIUM_ARGS||'[]')]}:{})});
const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
let pending,seen,release;
const nextRequest=()=>{seen=new Promise(resolve=>release=resolve);return seen;};
const config={tables:[{table_id:'sint_maarte',table_name:'Sint Maarten',can_encode:1,can_decode:1,signal:'TST'},{table_id:'barbados',table_name:'Barbados',can_encode:1,can_decode:1,signal:'TSB'}],defaultTable:'sint_maarte',catalog:Object.fromEntries(['sea','object','event','admiralty'].map(k=>[k,[{id:k+'-TEST',de:'Synthetic '+k}]]))};
await context.route('**/*',async route=>{
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/api/'){
  if(req.method()==='GET')return route.fulfill({json:config});
  pending=route;release();return;
 }
 const file=url.pathname==='/'?'index.html':url.pathname.slice(1);
 if(!['index.html','assets/app.js','assets/site.css','assets/mowlsint-logo.png'].includes(file))return route.abort();
 return route.fulfill({body:readFileSync(new URL('../../'+file,import.meta.url)),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html'});
});
let checks=0;
try{
 await page.goto('http://pelican.test/');await page.waitForFunction(()=>!document.querySelector('#table').disabled);
 assert.equal(await page.locator('#table option').first().innerText(),'Sint Maarten');checks++;
 let wait=nextRequest();await page.locator('#encode').click();await wait;await pending.fulfill({json:{frames:['ABCDEFGH'],spoken:['ALFA'],signal:'TST'}});
 await page.waitForLoadState('networkidle');assert.equal(await page.locator('#encoded').innerText(),'ABCDEFGH');await page.locator('#add').click();assert.match(await page.locator('#broadcast').innerText(),/ABCDEFGH/);await page.locator('#clear').click();checks++;
 wait=nextRequest();await page.locator('#encode').click();await wait;
 await page.locator('#table').selectOption('barbados');
 await pending.fulfill({json:{frames:['ABCDEFGH'],spoken:['ALFA'],signal:'TST'}});
 await page.waitForLoadState('networkidle');assert.equal(await page.locator('#encoded').innerText(),'–');assert(await page.locator('#add').isDisabled());checks++;
 wait=nextRequest();await page.locator('#encode').click();await wait;await page.locator('#clear').click();
 await pending.fulfill({json:{frames:['ABCDEFGH'],spoken:['ALFA'],signal:'TSB'}});
 await page.waitForLoadState('networkidle');assert.equal(await page.locator('#encoded').innerText(),'–');checks++;
 await page.locator('#decodeInput').fill('ABCDEFGH');wait=nextRequest();await page.locator('#decode').click();await wait;
 await page.locator('#table').selectOption('sint_maarte');
 await pending.fulfill({json:{messages:[{frame:'ABCDEFGH',fields:{sea:'Synthetic'}}],totalFrames:1,tableId:'barbados'}});
 await page.waitForLoadState('networkidle');assert.equal(await page.locator('#table').inputValue(),'sint_maarte');assert.equal(await page.locator('#decoded').innerText(),'');checks++;
 await page.locator('#decodeInput').fill('ABCDEFGH');wait=nextRequest();await page.locator('#decode').click();await wait;
 await pending.fulfill({json:{messages:[{frame:'ABCDEFGH',fields:{sea:'Synthetic'},unicode:[{value:'<img src=x onerror=alert(1)>'}]}],text:'Volltext: Gdańsk 香港\n<img src=x onerror=alert(1)>',totalFrames:1,tableId:'sint_maarte'}});
 await page.waitForLoadState('networkidle');assert.match(await page.locator('.decoded-fulltext').innerText(),/Volltext: Gdańsk 香港/);assert.equal(await page.locator('#decoded img').count(),0);assert.equal(await page.locator('#decoded details').evaluate(e=>e.open),false);checks++;
 assert.deepEqual(errors,[]);checks++;
 console.log(JSON.stringify({outcome:'PASS',checks,browser:await browser.version(),privateDataUsed:false,scope:'Synthetic local UI only; delayed replies after table change/clear'}));
}finally{await browser.close()}
