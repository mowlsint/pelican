import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PelicanCore as C} from '../lib/pelican-core.mjs';
export function books(){
 if(process.env.PELICAN_BOOK_DIR)return readdirSync(process.env.PELICAN_BOOK_DIR).filter(n=>n.endsWith('.book.json')).sort().map(n=>JSON.parse(readFileSync(process.env.PELICAN_BOOK_DIR+'/'+n,'utf8')));
 // Synthetic test-only permutations. These are never receiver codebooks.
 const abc='ABCDEFGHIJKLMNOPQRSTUVWXYZ',pool=[...abc].flatMap(a=>[...abc].map(b=>a+b));
 const names=['louisiana','sint_maarte','barbados','saint_kitts_and_nevis','turks_and_caicos_islands'];
 const shuffle=(xs,seed)=>xs.map((x,i)=>[createHash('sha256').update(seed+':'+i).digest('hex'),x]).sort(([a],[b])=>a.localeCompare(b)).map(x=>x[1]);
 return names.map(table_id=>{
  const codes=shuffle(pool.filter(x=>!['ND','QW','YY','ZX','ZY','ZZ'].includes(x)),table_id),next=()=>codes.pop();
  const catalog=Object.fromEntries(C.FIELDS.map(f=>[f,[{id:f+'-TEST',de:'Synthetic '+f},{id:f+'-SECOND',de:'Synthetic second '+f}]]));
  const chars=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -.,/'].map(value=>({id:'CHAR-'+value.codePointAt(0),type:'character',value}));
  const statuses=Object.fromEntries(Object.values(C.STATUS_VALUES).flat().map(x=>[x,next()]));
  return {kind:'PELICAN_BOOK',format_version:1,edition:C.REVISION,table_id,table_name:'Synthetic '+table_id,catalog,
   sections:Object.fromEntries(C.FIELDS.map(f=>[f,Object.fromEntries(catalog[f].map(x=>[x.id,next()]))])),
   extension:{prefix:'ND',tokens:Object.fromEntries([...chars.map(x=>x.id),'PAD'].map(id=>[id,next()]))},symbols:chars,
   status_protocol:{prefixes:{self_id:'ZX',reference:'ZY',status:'ZZ'},families:Object.fromEntries(Object.keys(C.STATUS_VALUES).map(x=>[x,next()])),statuses,time_qualifiers:{NONE:next()}},
   special_prefix:'QW',unicode_prefix:'YY',special_cipher:{version:2,pairs:shuffle(pool,'special:'+table_id)}};
 });
}
export const fields=b=>Object.fromEntries(C.FIELDS.map(f=>[f,b.catalog[f][0].id]));
