import {mkdir,copyFile,rm} from 'node:fs/promises';
const files=['index.html','offline.html','assets/app.js','assets/site.css','assets/mowlsint-logo.png'];
await rm(new URL('../dist/',import.meta.url),{recursive:true,force:true});
for(const f of files){const target=new URL('../dist/'+f,import.meta.url);await mkdir(new URL('.',target),{recursive:true});await copyFile(new URL('../'+f,import.meta.url),target)}
await copyFile(new URL('../_headers',import.meta.url),new URL('../dist/_headers',import.meta.url));
console.log('Built dist with explicit public-file allowlist. Cloudflare Pages Functions remain in functions/.');
