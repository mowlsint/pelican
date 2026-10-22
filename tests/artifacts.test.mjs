import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync,readdirSync} from 'node:fs';import {createHash} from 'node:crypto';import vm from 'node:vm';
const root=new URL('../',import.meta.url);
test('Offline embeds the exact shared core and a matching network-denying CSP',()=>{
 const core=readFileSync(new URL('lib/pelican-core.mjs',root),'utf8').replace(/^export /,''),html=readFileSync(new URL('offline.html',root),'utf8');assert(html.includes(core));
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);
 const hash=createHash('sha256').update(script).digest('base64');assert(html.includes("script-src 'sha256-"+hash+"'"));assert(html.includes("connect-src 'none'"));
 assert(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|indexedDB|serviceWorker/.test(script));
 assert(!/<script[^>]+src=|<link[^>]+href=|<img[^>]+src="https?:/.test(html));
});
test('Repository does not contain private fixture files or SQL besides schema',()=>{
 const walk=(url)=>readdirSync(url,{withFileTypes:true}).flatMap(x=>['node_modules','dist','.git'].includes(x.name)?[]:x.isDirectory()?walk(new URL(x.name+'/',url)):[new URL(x.name,url)]);
 const files=walk(root);assert(!files.some(x=>/\.(book|signals)\.json$|\.zip$|\.pdf$/.test(x.pathname)));assert(files.filter(x=>x.pathname.endsWith('.sql')).every(x=>x.pathname.endsWith('/schema.sql')));
});
