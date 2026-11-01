import {test,mock} from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';import {readFileSync} from 'node:fs';
import {onRequest} from '../functions/api/index.js';import {books,fields} from './fixtures.mjs';import {PelicanCore as C} from '../lib/pelican-core.mjs';
const all=books(),b=all[0],other=all[1],db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
const put=(k,v)=>db.prepare('INSERT OR REPLACE INTO pelican_docs VALUES (?,?)').run(k,JSON.stringify(v));
put('protocol:revision',{version:C.REVISION});
for(const f of C.FIELDS)put('catalog:'+f,b.catalog[f]);put('catalog:symbols',b.symbols);
for(let i=0;i<all.length;i++){const book=all[i];put('table:'+book.table_id,{name:book.table_name,signal:'TS'+'ABCDE'[i],sections:book.sections,extension:book.extension});put('protocol:status:'+book.table_id,book.status_protocol);put('protocol:special:'+book.table_id,book.special_cipher)}
const grant=(email,table,enc,dec,active=1)=>db.prepare('INSERT OR REPLACE INTO pelican_grants VALUES (?,?,?,?,?)').run(email,table,enc,dec,active);
grant('both@example.invalid',b.table_id,1,1);grant('both@example.invalid',other.table_id,1,1);
grant('reader@example.invalid',b.table_id,0,1);grant('writer@example.invalid',b.table_id,1,0);grant('inactive@example.invalid',b.table_id,1,1,0);grant('zero@example.invalid',b.table_id,0,0);
const {publicKey,privateKey}=await generateKeyPair('RS256');const jwk={...await exportJWK(publicKey),kid:'test',alg:'RS256',use:'sig'};
const issuer='https://pelican-test.cloudflareaccess.com',aud='test-aud';
mock.method(globalThis,'fetch',async (url)=>{assert.equal(String(url),issuer+'/cdn-cgi/access/certs');return new Response(JSON.stringify({keys:[jwk]}),{headers:{'Content-Type':'application/json'}})});
const env={CF_ACCESS_ISSUER:issuer,CF_ACCESS_AUD:aud,PELICAN_DB:{prepare(sql){return {bind(...args){return {async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}}}}}}}};
async function token(email,opts={}){return new SignJWT({email}).setProtectedHeader({alg:'RS256',kid:'test'}).setIssuer(opts.issuer||issuer).setAudience(opts.aud||aud).setExpirationTime(opts.exp||'5m').sign(privateKey)}
async function call(email,body,opts={}){
 const headers={};if(email)headers['Cf-Access-Jwt-Assertion']=opts.jwt||await token(email,opts);
 const request=new Request('https://pelican.example.invalid/api/',{method:opts.method||(body===undefined?'GET':'POST'),headers,...(body!==undefined?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});
 const response=await onRequest({request,env});return {status:response.status,body:await response.json(),headers:response.headers};
}
test('Real RS256 verification, issuer, audience, expiry and active grants',async()=>{
 assert.equal((await call(null)).status,401);
 for(const opts of [{jwt:'invalid'},{aud:'wrong'},{issuer:'https://wrong.cloudflareaccess.com'},{exp:946684800}])assert.equal((await call('both@example.invalid',undefined,opts)).status,401);
 for(const user of ['missing','inactive','zero'])assert.equal((await call(user+'@example.invalid')).status,403);
 const ok=await call('BOTH@example.invalid');assert.equal(ok.status,200);assert.equal(ok.body.tables.length,2);for(const t of ok.body.tables)assert.equal(t.table_name,C.tableName(t.table_id));assert.match(ok.headers.get('cache-control'),/no-store/);
 const text=JSON.stringify(ok.body);for(const key of ['sections','extension','special_cipher','pairs','status_protocol'])assert(!text.includes('"'+key+'"'));
 assert.equal((await call('both@example.invalid',undefined,{method:'DELETE'})).status,405);
});
test('Operation-specific and cross-table authorisation, signed signal detection',async()=>{
 const payload={operation:'encode',table:b.table_id,fields:fields(b),details:'TEST 123',specials:[{type:'unicode',value:'Gdańsk 香港'}]};
 const encoded=await call('both@example.invalid',payload);assert.equal(encoded.status,200);
 const decoded=await call('reader@example.invalid',{operation:'decode',table:b.table_id,input:encoded.body.broadcast});assert.equal(decoded.status,200);assert.equal(decoded.body.messages[0].unicode[0].value,'Gdańsk 香港');
 assert.match(decoded.body.text,/Gdańsk 香港/);assert.match(decoded.body.text,/Zusatzinformation: TEST 123/);
 assert.equal((await call('reader@example.invalid',payload)).status,403);
 assert.equal((await call('writer@example.invalid',{operation:'decode',table:b.table_id,input:encoded.body.broadcast})).status,403);
 assert.equal((await call('reader@example.invalid',{...payload,table:other.table_id})).status,403);
 const encodedOther=await call('both@example.invalid',{...payload,table:other.table_id,fields:fields(other)});assert.equal(encodedOther.status,200);
 assert.equal((await call('reader@example.invalid',{operation:'decode',table:b.table_id,input:encodedOther.body.broadcast})).status,403);
 assert.equal((await call('reader@example.invalid')).body.tables.length,1);
});
test('Malformed requests, size limits, revision guard and opaque failures',async()=>{
 for(const body of ['{',null,[],{operation:'x'},{operation:'decode',table:b.table_id,input:'MALFORMED'}]){
  const r=await call('both@example.invalid',body);assert.equal(r.status,400);assert(!JSON.stringify(r.body).includes('protocol:'));
 }
 assert.equal((await call('both@example.invalid',' '.repeat(1_000_001))).status,400);
 db.prepare('DELETE FROM pelican_docs WHERE key=?').run('protocol:revision');assert.equal((await call('both@example.invalid')).status,503);put('protocol:revision',{version:C.REVISION});
 db.prepare('UPDATE pelican_docs SET payload=? WHERE key=?').run('PRIVATE_INTERNAL_VALUE','protocol:special:'+b.table_id);
 const r=await call('both@example.invalid');assert.equal(r.status,503);assert(!JSON.stringify(r.body).includes('PRIVATE_INTERNAL_VALUE'));
});
