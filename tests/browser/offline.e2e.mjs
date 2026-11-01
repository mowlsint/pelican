import assert from 'node:assert/strict';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';import {readFileSync,readdirSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';
const {chromium}=await import(process.env.PELICAN_PLAYWRIGHT_MODULE||'playwright');
if(!process.env.PELICAN_BOOK_DIR)throw Error('Set PELICAN_BOOK_DIR to a private directory; never put its contents in this repository');
const dir=resolve(process.env.PELICAN_BOOK_DIR),html=resolve(process.env.PELICAN_OFFLINE_HTML||'offline.html');
const names=readdirSync(dir).filter(x=>x.endsWith('.book.json')).sort();assert.equal(names.length,5);
const browser=await chromium.launch({headless:true,...(process.env.PELICAN_CHROMIUM?{executablePath:process.env.PELICAN_CHROMIUM,args:['--no-sandbox','--disable-gpu','--single-process','--no-zygote',...(process.env.PELICAN_CHROMIUM_ARGS?JSON.parse(process.env.PELICAN_CHROMIUM_ARGS):[])]}:{})});
const context=await browser.newContext({offline:true});const page=await context.newPage(),errors=[],network=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
const temp=mkdtempSync(tmpdir()+'/pelican-offline-');let passed=0;
try{
 await page.goto(pathToFileURL(html).href);assert.match(await page.locator('#state').innerText(),/keine Codetafel/);passed++;
 await page.locator('#encode').click();assert.match(await page.locator('#state').innerText(),/Keine Tafel/);passed++;
 for(const name of names){
  const book=JSON.parse(readFileSync(dir+'/'+name,'utf8')),signalPath=dir+'/'+name.replace('.book.json','.signals.json');
  await page.locator('#bookFile').setInputFiles(dir+'/'+name);await page.waitForFunction(()=>document.querySelector('#state').className==='ok');
  await page.locator('#signalFile').setInputFiles(signalPath);await page.waitForFunction(()=>document.querySelector('#loaded').textContent.includes('Kennsignal geladen'));passed++;
  await page.locator('#universal').fill('ÄÖÜ Gdańsk Łódź Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch Санкт-Петербург 香港 😀');
  await page.locator('#imo').fill('1234567');await page.locator('#lat').fill('58 25.75 N');await page.locator('#lon').fill('002 01.50 W');
  await page.locator('#encode').click();assert.match(await page.locator('#state').innerText(),/Nachricht erstellt/);
  const wire=await page.locator('#out').innerText();assert.equal(wire.split('\n')[0],JSON.parse(readFileSync(signalPath)).signal);
  assert.match(await page.locator('#spoken').innerText(),/\bALFA\b|\bBRAVO\b|\bCHARLIE\b/);passed++;
  await page.locator('#input').fill(wire);await page.locator('#decode').click();const decoded=JSON.parse(await page.locator('#decoded').innerText());assert.equal(decoded.messages[0].unicode[0].value,'ÄÖÜ Gdańsk Łódź Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch Санкт-Петербург 香港 😀');assert.equal(decoded.messages[0].specials.find(s=>s.type==='position').lat.frac,75);passed++;
  await page.locator('#unload').click();assert.equal(await page.locator('#table option').count(),0);assert.equal(await page.locator('#input').inputValue(),'');assert.equal(await page.locator('#decoded').innerText(),'–');passed++;
  await page.locator('#input').fill(wire);await page.locator('#decode').click();assert.match(await page.locator('#state').innerText(),/abgelehnt/);passed++;
 }
 // Atomic multi-import: one bad file must not partially load a valid companion.
 const bad=temp+'/bad.json';writeFileSync(bad,'{"kind":"broken"}');await page.locator('#bookFile').setInputFiles([dir+'/'+names[0],bad]);await page.waitForFunction(()=>document.querySelector('#state').textContent.includes('Import abgelehnt'));assert.equal(await page.locator('#table option').count(),0);passed++;
 await page.locator('#bookFile').setInputFiles(names.map(n=>dir+'/'+n));await page.waitForFunction(()=>document.querySelector('#table').options.length===5);passed++;
 const sig=JSON.parse(readFileSync(dir+'/'+names[0].replace('.book.json','.signals.json')));sig.signal='BAD';const badSignal=temp+'/bad-signal.json';writeFileSync(badSignal,JSON.stringify(sig));await page.locator('#signalFile').setInputFiles(badSignal);await page.waitForFunction(()=>document.querySelector('#state').className==='ok');
 const source=JSON.parse(readFileSync(dir+'/'+names[0]));await page.locator('#table').selectOption(source.table_id);await page.locator('#encode').click();const invalidWire=(await page.locator('#out').innerText()).replaceAll('BAD','ERR');await page.locator('#input').fill(invalidWire);await page.locator('#decode').click();assert.match(await page.locator('#state').innerText(),/abgelehnt/);passed++;
 assert.equal(network.length,0);assert.deepEqual(errors,[]);passed+=2;
 console.log(JSON.stringify({outcome:'PASS',browser:await browser.version(),checks:passed,loadedBooks:5,httpRequests:network.length,pageErrors:errors.length,mode:'Linux file://, offline context. Windows not tested.'}));
}finally{await browser.close();rmSync(temp,{recursive:true,force:true})}
