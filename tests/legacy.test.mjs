import {test,mock} from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';import {readFileSync} from 'node:fs';
import {onRequest as legacy} from './legacy-1.4-api.mjs';import {books,fields} from './fixtures.mjs';import {PelicanCore as C} from '../lib/pelican-core.mjs';
const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
const all=books();for(const f of C.FIELDS)db.prepare('INSERT INTO pelican_docs VALUES (?,?)').run('catalog:'+f,JSON.stringify(all[0].catalog[f]));db.prepare('INSERT INTO pelican_docs VALUES (?,?)').run('catalog:symbols',JSON.stringify(all[0].symbols));
for(const b of all){db.prepare('INSERT INTO pelican_docs VALUES (?,?)').run('table:'+b.table_id,JSON.stringify({name:b.table_name,signal:'TST',sections:b.sections,extension:b.extension}));db.prepare('INSERT INTO pelican_grants VALUES (?,?,?,?,?)').run('legacy@example.invalid',b.table_id,1,1,1)}
const {privateKey,publicKey}=await generateKeyPair('RS256');const issuer='https://legacy-test.cloudflareaccess.com',aud='legacy';const jwk={...await exportJWK(publicKey),kid:'legacy',alg:'RS256'};
mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({keys:[jwk]}),{headers:{'Content-Type':'application/json'}}));
const token=await new SignJWT({email:'legacy@example.invalid'}).setProtectedHeader({alg:'RS256',kid:'legacy'}).setIssuer(issuer).setAudience(aud).setExpirationTime('5m').sign(privateKey);
const env={CF_ACCESS_ISSUER:issuer,CF_ACCESS_AUD:aud,PELICAN_DB:{prepare(sql){return {bind(...args){return {async first(){return db.prepare(sql).get(...args)},async all(){return {results:db.prepare(sql).all(...args)}}}}}}}};
test('Actual 1.4-RC1 handler from GitHub base produces identical main/ND wire and reciprocal decoding',async()=>{
 for(const b of all)for(const text of ['TEST 123','ÄÖÜ ß','ALTE MELDUNG','TEST 123 ABC','  TEST\n 123\t ABC  ']){
  const payload={operation:'encode',table:b.table_id,fields:fields(b),details:text};
  const r=await legacy({env,request:new Request('https://legacy.example.invalid/api/',{method:'POST',headers:{'Cf-Access-Jwt-Assertion':token},body:JSON.stringify(payload)})});assert.equal(r.status,200);
  const old=await r.json(),wire=C.encodeMessage(b,{fields:payload.fields,details:text});assert.deepEqual(wire,old.frames);assert.equal(C.decodeMessage(b,old.frames).details,text.toUpperCase().replaceAll('Ä','AE').replaceAll('Ö','OE').replaceAll('Ü','UE').replace(/\s+/g,' ').trim());
  const decoded=await legacy({env,request:new Request('https://legacy.example.invalid/api/',{method:'POST',headers:{'Cf-Access-Jwt-Assertion':token},body:JSON.stringify({operation:'decode',table:b.table_id,input:wire.join('\n')})})});assert.equal(decoded.status,200);assert.equal((await decoded.json()).messages[0].details,C.decodeMessage(b,wire).details);
 }
});
