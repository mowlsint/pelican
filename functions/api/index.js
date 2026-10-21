import { jwtVerify, createRemoteJWKSet } from 'jose';
import { PelicanCore as C } from '../../lib/pelican-core.mjs';
const FIELDS=C.FIELDS;
const JSONHEAD={'Cache-Control':'no-store, no-cache, private','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Type':'application/json; charset=utf-8'};
const respond=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:JSONHEAD});
const reject=(s,status=400)=>respond({error:s},status);
async function identify(req,env){
 if(!env.CF_ACCESS_ISSUER||!env.CF_ACCESS_AUD||!env.PELICAN_DB)throw Error('Backend-Konfiguration fehlt');
 const jwt=req.headers.get('Cf-Access-Jwt-Assertion');if(!jwt)throw Error('Cloudflare Access JWT fehlt');
 const issuer=env.CF_ACCESS_ISSUER.replace(/\/+$/,'');if(!issuer.startsWith('https://')||!issuer.endsWith('.cloudflareaccess.com'))throw Error('Access issuer ungültig');
 const {payload}=await jwtVerify(jwt,createRemoteJWKSet(new URL(issuer+'/cdn-cgi/access/certs')),{issuer,audience:env.CF_ACCESS_AUD});
 if(typeof payload.email!=='string'||!payload.email.includes('@'))throw Error('Access Identität fehlt');return payload.email.trim().toLowerCase();
}
async function docs(env,key){const v=await env.PELICAN_DB.prepare('SELECT payload FROM pelican_docs WHERE key=?').bind(key).first();if(!v)throw Error('D1-Codetafel fehlt');return JSON.parse(v.payload)}
async function grants(env,email){const r=await env.PELICAN_DB.prepare('SELECT table_id,can_encode,can_decode FROM pelican_grants WHERE email=? AND active=1').bind(email).all();return (r.results||[]).filter(x=>['louisiana','sint_maarte','barbados','saint_kitts_and_nevis','turks_and_caicos_islands'].includes(x.table_id))}
async function loadBook(env,table){const [tab,status,symbols,...catalog]=await Promise.all([docs(env,'table:'+table),docs(env,'protocol:status:'+table),docs(env,'catalog:symbols'),...FIELDS.map(f=>docs(env,'catalog:'+f))]);const b={kind:'PELICAN_BOOK',format_version:1,edition:'1.5-DRAFT',table_id:table,table_name:tab.name,sections:tab.sections,extension:tab.extension,status_protocol:status,symbols,catalog:Object.fromEntries(FIELDS.map((x,i)=>[x,catalog[i]])),special_prefix:'QW',unicode_prefix:'YY'};C.validateBook(b);return {book:b,signal:tab.signal}}
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return reject('Methode nicht erlaubt',405);
 let user,allowed;try{user=await identify(request,env);allowed=await grants(env,user)}catch{return reject('Authentifizierung fehlgeschlagen',401)}
 if(!allowed.length)return reject('Keine aktive Tafel-Freigabe',403);
 try{
 if(request.method==='GET'){
   const catalog=Object.fromEntries(await Promise.all(FIELDS.map(async f=>[f,await docs(env,'catalog:'+f)])));
   const tables=await Promise.all(allowed.map(async g=>({...g,signal:(await docs(env,'table:'+g.table_id)).signal})));
   return respond({version:'1.5-DRAFT',tables,defaultTable:tables[0].table_id,catalog});
 }
 const body=await request.json();const action=body.operation;if(!['encode','decode'].includes(action))return reject('Aktion ungültig');
 let chosen=body.table,detected=false;
 if(action==='decode'){
   const words=C.splitGroups(body.input);
   if(words[0]?.length===3){if(words.length<3||words.at(-1)!==words[0])return reject('Endsignal fehlt/falsch');let candidates=await Promise.all(allowed.filter(g=>g.can_decode).map(async g=>({id:g.table_id,signal:(await docs(env,'table:'+g.table_id)).signal})));
    let hit=candidates.find(x=>x.signal===words[0]);if(!hit)return reject('Keine Zugriffsberechtigung für Kennsignal',403);chosen=hit.id;detected=true;
   }
 }
 const grant=allowed.find(g=>g.table_id===chosen);
 if(!grant || (action==='encode'&&!grant.can_encode)||(action==='decode'&&!grant.can_decode))return reject('Für diese Tafel/Aktion keine Freigabe',403);
 const {book,signal}=await loadBook(env,chosen);
 if(action==='encode'){
  let payload={fields:body.fields,id:body.id,reference:body.reference,statuses:body.statuses,specials:body.specials,details:body.details};
  const frames=C.encodeMessage(book,payload);return respond({frames,spoken:frames.map(C.speech),signal,broadcast:C.wrapBroadcast(frames,signal)});
 }
 return respond({...C.decodeBlock(book,body.input,signal),tableId:chosen,signalDetected:detected});
 }catch(e){return reject('Anfrage abgelehnt: '+(e instanceof Error?e.message:'ungültige Daten'),400)}
}
