import {test} from 'node:test';import assert from 'node:assert/strict';
import {PelicanCore as C} from '../lib/pelican-core.mjs';import {books,fields} from './fixtures.mjs';
const all=books();
for(const b of all){
 test('Codec, status, reference, actors, Unicode and boundaries: '+b.table_id,()=>{
  assert(C.validateBook(b));const f=fields(b);
  for(const k of C.FIELDS)for(const entry of b.catalog[k]){
   const value={...f,[k]:entry.id};const details='TEST 123';const wire=C.encodeMessage(b,{fields:value,details});assert.deepEqual(C.decodeMessage(b,wire).field_ids,value);
  }
  const value='ÄÖÜ ß Gdańsk Łódź Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch Санкт-Петербург 香港 😀';
  const msg={fields:f,id:'TESTAB',reference:'TESTAA',details:'TEST 123',statuses:[{family:'EDITORIAL',value:'CORRECTION'}],specials:[
   {type:'actor',actor:'A',object:f.object,country:'DE'},{type:'actor',actor:'B',object:f.object,country:'PL'},
   {type:'relation',actor:'A',target:'B',action:'CL',time:'D'},
   {type:'country',actor:'A',role:'F',country:'DE'},{type:'imo',actor:'B',value:'1234567'},
   {type:'utc',value:'2026-10-21T06:00Z'},C.parsePosition('58 25.75 N','002 01.50 W'),
   {type:'unicode',kind:'N',actor:'B',value}]};
  const wire=C.encodeMessage(b,msg);assert(wire.every(g=>/^[A-Z]{8}$/.test(g)));
  const d=C.decodeBlock(b,C.wrapBroadcast(wire,'TST'),'TST').messages[0];assert.equal(d.unicode[0].value,value);assert.equal(d.details,'TEST 123');assert.equal(d.specials.find(x=>x.type==='imo').value,'1234567');assert.equal(d.id,msg.id);
  assert.equal(d.specials.find(x=>x.type==='position').lat.frac,75);
  assert.equal(C.decodeBlock(b,[...wire,...C.encodeMessage(b,{fields:f,details:'ALTE MELDUNG'})].join(' ')).messages.length,2);
  assert.equal(C.speech('ABCDEFGH'),'ALFA BRAVO CHARLIE DELTA ECHO FOXTROT GOLF HOTEL');
  for(const text of ['NAME '.repeat(600),'Gdańsk','Севастополь','香港','😀'])assert.equal(C.decodeMessage(b,C.encodeMessage(b,{fields:f,specials:[{type:'unicode',value:text}]})).unicode[0].value,text);
  for(const pos of [['90 N','180 E'],['0 00.00 S','0 00.00 W'],['58 25 75 N','2 1 5 E']])assert.equal(C.decodeMessage(b,C.encodeMessage(b,{fields:f,specials:[C.parsePosition(...pos)]})).specials[0].type,'position');
  for(const special of [{type:'imo',value:'1234568'},{type:'utc',value:'2026-02-30T12:00Z'},{type:'unicode',value:''},{type:'unicode',value:'\ud800'},{type:'position',lat:{deg:91,min:0,frac:0},lon:{deg:0,min:0,frac:0},ns:'N',ew:'E'},{type:'relation',actor:'A',target:'A',action:'CL'}])assert.throws(()=>C.encodeMessage(b,{fields:f,specials:[special]}));
  assert.throws(()=>C.encodeMessage(b,{fields:f,statuses:[{family:'VALIDITY',value:'CORRECTION'}]}));
  assert.throws(()=>C.encodeMessage(b,{fields:f,statuses:[{family:'VERIFICATION',value:'CONFIRMED',time:'__proto__'}]}));
  assert.throws(()=>C.encodeMessage(b,{fields:f,statuses:[{family:'EDITORIAL',value:'CORRECTION'}]}));
  assert.throws(()=>C.encodeMessage(b,{fields:f,specials:[{type:'imo',value:'1234567'},{type:'imo',value:'1234567'}]}));
  const unicodeWire=C.encodeMessage(b,{fields:f,specials:[{type:'unicode',value:'Gdańsk 香港'}]});for(let cut=2;cut<unicodeWire.length;cut++)assert.throws(()=>C.decodeMessage(b,unicodeWire.slice(0,cut)));
  assert.throws(()=>C.decodeBlock(b,'TST TST','TST'));
  assert.throws(()=>C.decodeBlock(b,C.wrapBroadcast(wire,'BAD'),'TST'));
  assert.throws(()=>C.decodeBlock(b,wire.join(' ')+' TST'));
  assert.throws(()=>C.decodeMessage(b,[wire[0],b.status_protocol.prefixes.reference+'TESTAA']));
  assert.throws(()=>C.decodeMessage(b,[...Array(C.MAX_GROUPS+1).fill(wire[0])]));
  assert.throws(()=>C.parsePosition('90 0.01 N','180 E'));assert.throws(()=>C.parsePosition('58 60 N','2 E'));
  const broken=structuredClone(b);broken.catalog.sea[0].id='MISSING';assert.throws(()=>C.validateBook(broken));
  const old=structuredClone(b);old.special_cipher={version:1,alphabet:'ABCDEFGHIJKLMNOPQRSTUVWXYZ'};assert.throws(()=>C.validateBook(old));
 });
}
test('Cross-table negative decoding and exhaustive QW/YY transforms',()=>{
 const abc='ABCDEFGHIJKLMNOPQRSTUVWXYZ',pairs=[...abc].flatMap(a=>[...abc].map(b=>a+b));
 for(const b of all)for(const p of pairs){const raw=b.special_prefix+p+p+p;assert.equal(C.unprotectExtra(C.protectExtra(raw,b),b),raw)}
 for(const a of all)for(const b of all){if(a===b)continue;
  const wire=C.encodeMessage(a,{fields:fields(a),specials:[{type:'unicode',value:'Gdańsk 香港'}]});assert.throws(()=>C.decodeMessage(b,wire));
  const mappings=[new Map(),new Map()];let possible=[true,true];
  for(let i=0;i<676;i++)for(let k=0;k<2;k++){const x=a.special_cipher.pairs[i][k],y=b.special_cipher.pairs[i][k];if(mappings[k].has(x)&&mappings[k].get(x)!==y)possible[k]=false;mappings[k].set(x,y)}
  assert.deepEqual(possible,[false,false]);
 }
});
