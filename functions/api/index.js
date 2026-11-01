import { jwtVerify, createRemoteJWKSet } from 'jose';
import { PelicanCore as C } from '../../lib/pelican-core.mjs';
const FIELDS=C.FIELDS;
const TABLES=['louisiana','sint_maarte','barbados','saint_kitts_and_nevis','turks_and_caicos_islands'];
const JSONHEAD={'Cache-Control':'no-store, no-cache, private','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Type':'application/json; charset=utf-8'};
const respond=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:JSONHEAD});
const reject=(s,status=400)=>respond({error:s},status);
const keysets=new Map();
async function identify(req,env){
 if(!env.CF_ACCESS_ISSUER||!env.CF_ACCESS_AUD||!env.PELICAN_DB)throw Error('Configuration');
 const jwt=req.headers.get('Cf-Access-Jwt-Assertion');if(!jwt)throw Error('Authentication');
 const issuer=env.CF_ACCESS_ISSUER.replace(/\/+$/,'');
 if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer))throw Error('Issuer');
 if(!keysets.has(issuer))keysets.set(issuer,createRemoteJWKSet(new URL(issuer+'/cdn-cgi/access/certs')));
 const {payload}=await jwtVerify(jwt,keysets.get(issuer),{issuer,audience:env.CF_ACCESS_AUD,algorithms:['RS256']});
 if(typeof payload.email!=='string'||!payload.email.includes('@'))throw Error('Identity');
 return payload.email.trim().toLowerCase();
}
async function docs(env,key){
 const row=await env.PELICAN_DB.prepare('SELECT payload FROM pelican_docs WHERE key=?').bind(key).first();
 if(!row)throw Error('Data unavailable');return JSON.parse(row.payload);
}
async function grants(env,email){
 const r=await env.PELICAN_DB.prepare('SELECT table_id,can_encode,can_decode FROM pelican_grants WHERE email=? AND active=1').bind(email).all();
 return (r.results||[]).filter(x=>TABLES.includes(x.table_id)&&(x.can_encode===1||x.can_decode===1));
}
async function loadBook(env,table){
 const [tab,status,symbols,cipher,...catalog]=await Promise.all([docs(env,'table:'+table),docs(env,'protocol:status:'+table),docs(env,'catalog:symbols'),docs(env,'protocol:special:'+table),...FIELDS.map(f=>docs(env,'catalog:'+f))]);
 const book={kind:'PELICAN_BOOK',format_version:1,edition:C.REVISION,table_id:table,table_name:tab.name,sections:tab.sections,extension:tab.extension,status_protocol:status,symbols,catalog:Object.fromEntries(FIELDS.map((x,i)=>[x,catalog[i]])),special_prefix:'QW',unicode_prefix:'YY',special_cipher:cipher};
 C.validateBook(book);if(!/^[A-Z]{3}$/.test(tab.signal))throw Error('Signal unavailable');return {book,signal:tab.signal};
}
async function jsonBody(request){
 const limit=1_000_000;
 if(Number(request.headers.get('content-length')||0)>limit)throw Error('Body limit');
 const reader=request.body?.getReader();if(!reader)throw Error('Body missing');
 const chunks=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw Error('Body limit')}chunks.push(value)}
 const data=new Uint8Array(size);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength}
 const body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data));
 if(!body||typeof body!=='object'||Array.isArray(body))throw Error('Body type');return body;
}
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return reject('Methode nicht erlaubt',405);
 let user;try{user=await identify(request,env)}catch{return reject('Authentifizierung fehlgeschlagen',401)}
 let allowed;try{allowed=await grants(env,user)}catch{return reject('Dienst vorübergehend nicht verfügbar',503)}
 if(!allowed.length)return reject('Keine aktive Tafel-Freigabe',403);
 try{if((await docs(env,'protocol:revision')).version!==C.REVISION)throw Error('Revision')}
 catch{return reject('Datenbankversion noch nicht freigegeben',503)}
 if(request.method==='GET'){
  try{
   // Validate only authorised books; never return their mappings.
   const loaded=await Promise.all(allowed.map(async g=>({grant:g,...await loadBook(env,g.table_id)})));
   const tables=loaded.map(x=>({...x.grant,table_name:C.tableName(x.grant.table_id,x.book.table_name),signal:x.signal}));
   return respond({version:C.REVISION,tables,defaultTable:tables[0].table_id,catalog:loaded[0].book.catalog});
  }catch{return reject('Codetafeln vorübergehend nicht verfügbar',503)}
 }
 let body;try{body=await jsonBody(request)}catch{return reject('Anfrage ungültig oder zu groß',400)}
 const action=body.operation;if(!['encode','decode'].includes(action))return reject('Aktion ungültig');
 try{
  let chosen=body.table,detected=false;
  if(action==='decode'){
   const words=C.splitGroups(body.input);
   if(words[0]?.length===3){
    if(words.length<3||words.at(-1)!==words[0])return reject('Endsignal fehlt oder ist falsch');
    const candidates=await Promise.all(allowed.filter(g=>g.can_decode===1).map(async g=>({id:g.table_id,signal:(await docs(env,'table:'+g.table_id)).signal})));
    const hits=candidates.filter(x=>x.signal===words[0]);
    if(hits.length!==1)return reject('Keine eindeutige Freigabe für Kennsignal',403);chosen=hits[0].id;detected=true;
   }
  }
  const grant=allowed.find(g=>g.table_id===chosen);
  if(!grant||(action==='encode'&&grant.can_encode!==1)||(action==='decode'&&grant.can_decode!==1))return reject('Für diese Tafel oder Aktion keine Freigabe',403);
  let loaded;try{loaded=await loadBook(env,chosen)}catch{return reject('Codetafel vorübergehend nicht verfügbar',503)}
  const {book,signal}=loaded;
  if(action==='encode'){
   const frames=C.encodeMessage(book,{fields:body.fields,id:body.id,reference:body.reference,statuses:body.statuses,specials:body.specials,details:body.details});
   return respond({frames,spoken:frames.map(C.speech),signal,broadcast:C.wrapBroadcast(frames,signal)});
  }
  const decoded=C.decodeBlock(book,body.input,signal);
  return respond({...decoded,text:C.formatDecodedBlock(decoded,book),tableId:chosen,signalDetected:detected});
 }catch{return reject('Anfrage abgelehnt. Eingaben, Vollständigkeit und Codetafel prüfen.',400)}
}
