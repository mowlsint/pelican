import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PelicanCore as C} from '../lib/pelican-core.mjs';
import {books,fields} from './fixtures.mjs';
const b=books()[0];
test('Readable decoding preserves main fields, status, references and all additional data',()=>{
 const payload={fields:fields(b),id:'ABCDEF',reference:'GHIJKL',statuses:[{family:'EDITORIAL',value:'UPDATE'}],details:'SOURCE AIS',specials:[
  {type:'actor',actor:'A',object:fields(b).object,country:'RU'},
  {type:'relation',actor:'A',target:'B',action:'FW',time:'P'},
  {type:'country',actor:'A',role:'F',country:'RU'},
  {type:'imo',actor:'A',value:'1234567'},
  {type:'utc',value:'2026-11-01T18:06Z'},
  {...C.parsePosition('71 24.00 N','039 06.00 E'),actor:'A'},
  {type:'name',actor:'A',value:'LONG VESSEL NAME'},
  {type:'unicode',actor:'B',kind:'N',value:'Gdańsk Санкт-Петербург 香港 😀'},
  {type:'unicode',actor:'A',kind:'L',value:'<img src=x onerror=alert(1)>'}
 ]};
 const first=C.encodeMessage(b,payload),second=C.encodeMessage(b,{fields:fields(b),details:'SECOND REPORT'});
 const decoded=C.decodeBlock(b,C.wrapBroadcast([...first,...second],'TST'),'TST');
 const text=C.formatDecodedBlock(decoded,b);
 for(const label of Object.values(decoded.messages[0].fields))assert(text.includes(label));
 for(const value of ['Codetafel: '+C.tableName(b.table_id,b.table_name),'Meldung 1','Meldung 2','ABCDEF','GHIJKL','Aktualisierung','SOURCE AIS','Beteiligter A','Beteiligter B','Folgte','Flaggenstaat','1234567','2026-11-01 18:06 UTC','71° 24,00′ N / 039° 06,00′ E','LONG VESSEL NAME','Gdańsk Санкт-Петербург 香港 😀','<img src=x onerror=alert(1)>','SECOND REPORT'])assert(text.includes(value),value);
 assert(!text.includes('"field_ids"'));assert(!text.includes(decoded.messages[0].frame));
});
test('Readable decoding does not invent missing names, times or positions',()=>{
 const decoded=C.decodeBlock(b,C.encodeMessage(b,{fields:fields(b)}).join('\n'));
 const text=C.formatDecodedBlock(decoded,b);
 for(const absent of ['IMO-Nummer','Zeitpunkt:','Position (','Eigenname (','Name ('])assert(!text.includes(absent));
});
