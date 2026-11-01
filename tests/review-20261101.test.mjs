import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PelicanCore as C} from '../lib/pelican-core.mjs';
import {books,fields} from './fixtures.mjs';
const b=books()[0];
test('Lossless Unicode includes a leading byte order mark',()=>{
 const value='\uFEFFGdańsk 香港';
 const wire=C.encodeMessage(b,{fields:fields(b),specials:[{type:'unicode',value}]});
 assert.equal(C.decodeMessage(b,wire).unicode[0].value,value);
});
test('Incomplete status maps and collisions with ND are rejected on import',()=>{
 for(const change of [x=>delete x.status_protocol.families.OPERATION,x=>delete x.status_protocol.statuses.CORRECTION,x=>delete x.status_protocol.time_qualifiers.NONE,x=>{const id=x.catalog.sea[0].id;x.sections.sea[id]=x.extension.prefix;}]){
  const broken=structuredClone(b);change(broken);assert.throws(()=>C.validateBook(broken));
 }
});
test('Sint Maarten display name preserves historical identifiers',()=>{
 assert.equal(C.tableName('sint_maarte','Sint Maarte'),'Sint Maarten');
 assert.equal(C.tableName('sint_maarten'),'Sint Maarten');
 assert.equal(C.tableName('custom','Custom'),'Custom');
});
