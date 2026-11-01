import {mkdir,readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const offline=await readFile(new URL('offline.html',root),'utf8');
const download='<p class="tiny"><a class="filebutton ghost" href="./offline.html" download="PELICAN_Offline_Station_1_5.html">Offline-HTML herunterladen</a> · Private Codetafeln und Kennsignale werden separat ausgegeben.</p>';
await mkdir(new URL('docs/',root),{recursive:true});
await writeFile(new URL('docs/index.html',root),offline.replace('</header>','</header>'+download));
await writeFile(new URL('docs/offline.html',root),offline);
await writeFile(new URL('docs/.nojekyll',root),'');
console.log('Built GitHub Pages in docs: universal local-import application only.');
