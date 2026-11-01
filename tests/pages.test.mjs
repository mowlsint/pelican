import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const root=new URL('../',import.meta.url);
test('GitHub Pages publishes only the universal local-import app and standalone download',()=>{
 const files=readdirSync(new URL('docs/',root)).sort();
 assert.deepEqual(files,['.nojekyll','index.html','offline.html']);
 const standalone=readFileSync(new URL('offline.html',root),'utf8');
 assert.equal(readFileSync(new URL('docs/offline.html',root),'utf8'),standalone);
 const page=readFileSync(new URL('docs/index.html',root),'utf8');
 assert.equal(page.match(/<script>([\s\S]*?)<\/script>/)[1],standalone.match(/<script>([\s\S]*?)<\/script>/)[1]);
 assert(page.includes('href="./offline.html" download='));
 assert(page.includes("connect-src 'none'"));
 assert(!page.includes('assets/app.js'));
});
