import { jwtVerify, createRemoteJWKSet } from 'jose';

const FIELDS = ['sea','object','event','admiralty'];
const NATO = {A:'ALFA',B:'BRAVO',C:'CHARLIE',D:'DELTA',E:'ECHO',F:'FOXTROT',G:'GOLF',H:'HOTEL',I:'INDIA',J:'JULIETT',K:'KILO',L:'LIMA',M:'MIKE',N:'NOVEMBER',O:'OSCAR',P:'PAPA',Q:'QUEBEC',R:'ROMEO',S:'SIERRA',T:'TANGO',U:'UNIFORM',V:'VICTOR',W:'WHISKEY',X:'X-RAY',Y:'YANKEE',Z:'ZULU'};
const ALLOWED_TABLES = ['louisiana','sint_maarte','barbados','saint_kitts_and_nevis','turks_and_caicos_islands'];
const LIMIT_FRAMES = 100;
const HEADERS = {'Cache-Control':'no-store, no-cache, private','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const respond = (value,status=200)=>new Response(JSON.stringify(value),{status,headers:{...HEADERS,'Content-Type':'application/json; charset=utf-8'}});
const reject = (message,status=400)=>respond({error:message},status);
const msg = e=> e instanceof Error ? e.message : 'Interner Fehler';
async function userIdentity(req,env){
  // Fail closed: never trust an arbitrary email header or a client-provided user ID.
  if(!env.CF_ACCESS_ISSUER || !env.CF_ACCESS_AUD || !env.PELICAN_DB) throw Error('Backend nicht initialisiert');
  const raw=req.headers.get('Cf-Access-Jwt-Assertion');
  if(!raw) throw Error('Fehlendes Cloudflare-Access-Token');
  const issuer=env.CF_ACCESS_ISSUER.replace(/\/+$/,'');
  if(!issuer.startsWith('https://') || !issuer.endsWith('.cloudflareaccess.com')) throw Error('Access-Issuer fehlerhaft');
  const jwks=createRemoteJWKSet(new URL(issuer+'/cdn-cgi/access/certs'));
  const {payload}=await jwtVerify(raw,jwks,{issuer,audience:env.CF_ACCESS_AUD});
  if(typeof payload.email!=='string'||!payload.email.includes('@')) throw Error('Benutzer-E-Mail fehlt im Token');
  return payload.email.trim().toLowerCase();
}
async function getDoc(env,key){
  const row=await env.PELICAN_DB.prepare('SELECT payload FROM pelican_docs WHERE key = ?').bind(key).first();
  if(!row) throw Error('PELICAN-Daten fehlen: '+key);
  return JSON.parse(row.payload);
}
async function grants(env,email){
  const q=await env.PELICAN_DB.prepare('SELECT table_id,can_encode,can_decode FROM pelican_grants WHERE email=? AND active=1').bind(email).all();
  return (q.results||[]).filter(x=>ALLOWED_TABLES.includes(x.table_id));
}
function normalize(str){return str.toUpperCase().replace(/Ä/g,'AE').replace(/Ö/g,'OE').replace(/Ü/g,'UE').replace(/ẞ|ß/g,'SS').replace(/–|—/g,'-').replace(/[‘’]/g,"'").replace(/\s+/g,' ').trim();}
function speech(group){return [...group].map(x=>NATO[x]).join(' ');}
function encodeDetails(text,extension,symbols){
  const str=normalize(text);
  if(str.length>320) throw Error('Zusatztext zu lang (maximal 320 Zeichen)');
  if(!str) return [];
  const allowed = new Map(symbols.filter(x=>x.type==='character').map(x=>[x.value,x.id]));
  const words=symbols.filter(x=>x.type==='word').sort((a,b)=>b.value.length-a.value.length);
  const ids=[];
  for(let i=0;i<str.length;){
    const w=words.find(x=>str.startsWith(x.value,i));
    if(w){ids.push(w.id);i+=w.value.length;}
    else {const id=allowed.get(str[i]);if(!id) throw Error('Zeichen nicht im PELICAN-Zeichensatz: '+str[i]);ids.push(id);i++;}
  }
  while(ids.length%3) ids.push('PAD');
  return Array.from({length:ids.length/3},(_,i)=>extension.prefix+ids.slice(i*3,i*3+3).map(x=>extension.tokens[x]).join(''));
}
function encode(body,tab,catalog,symbols){
  const f=body.fields;
  if(!f||typeof f!=='object') throw Error('Vier Felder fehlen');
  for(const k of FIELDS){
    if(!catalog[k].some(x=>x.id===f[k]))throw Error('Ungültiger Eintrag: '+k);
    if(!tab.sections[k][f[k]]) throw Error('Code für '+k+' fehlt');
  }
  const details=typeof body.details==='string'?body.details:'';
  if((f.event==='NEW-EVENT-UNLISTED'||f.object==='NEW-TOPIC')&&!normalize(details))throw Error('Neues Thema erfordert einen Zusatztext');
  const main=FIELDS.map(k=>tab.sections[k][f[k]]).join('');
  const frames=[main,...encodeDetails(details,tab.extension,symbols)];
  if(frames.length>LIMIT_FRAMES)throw Error('Zu viele Zusatzgruppen');
  return {frames,spoken:frames.map(speech),signal:tab.signal,broadcast:[tab.signal,...frames,tab.signal].join('\n')};
}
function decode(body,tab,catalog,symbols){
  const input=String(body.input||'').trim().toUpperCase();
  if(!input || !/^[A-Z\s.\-]+$/.test(input))throw Error('Nur Achtbuchstabengruppen A–Z mit Trennzeichen (Leerzeichen, Punkt, Bindestrich) eingeben');
  let words=input.split(/[\s.\-]+/).filter(Boolean);
  if(words.some(x=>x.length%8))throw Error('Jede Gruppe muss acht Zeichen enthalten; Start- und Endsignal nicht eingeben');
  const frames=words.flatMap(x=>x.match(/.{8}/g));
  if(!frames.length||frames.length>LIMIT_FRAMES)throw Error('Ungültige Anzahl von Gruppen');
  const reversed=Object.fromEntries(FIELDS.map(k=>[k,Object.fromEntries(Object.entries(tab.sections[k]).map(([id,code])=>[code,id]))]));
  const symbolBy=Object.fromEntries(symbols.map(x=>[x.id,x]));
  const reverseToken=Object.fromEntries(Object.entries(tab.extension.tokens).map(([id,code])=>[code,id]));
  let result=[];
  for(let i=0;i<frames.length;){
    const frame=frames[i];
    if(frame.startsWith(tab.extension.prefix))throw Error('Zusatzgruppe ohne vorherige Hauptmeldung');
    const ids=FIELDS.map((k,j)=>reversed[k][frame.slice(j*2,j*2+2)]);
    if(ids.some(x=>!x))throw Error('Ungültige Hauptmeldung oder falsche Codetafel: '+frame);
    i++;
    const tokens=[];
    while(i<frames.length&&frames[i].startsWith(tab.extension.prefix)){
      for(let j=2;j<8;j+=2){let id=reverseToken[frames[i].slice(j,j+2)];if(!id)throw Error('Ungültiges Zusatzzeichen');tokens.push(id)}
      i++;
    }
    const pad=tokens.indexOf('PAD');if(pad>=0){if(tokens.slice(pad).some(x=>x!=='PAD'))throw Error('Füllzeichen innerhalb von Zusatztext');tokens.length=pad;}
    const details=tokens.map(id=>symbolBy[id]?.value||'').join('').trim();
    result.push({frame,fields:Object.fromEntries(FIELDS.map((k,j)=>[k,catalog[k].find(x=>x.id===ids[j]).de])),details});
  }
  return {messages:result,totalFrames:frames.length};
}
export async function onRequest({request,env}){
  if(!['GET','POST'].includes(request.method))return reject('Methode nicht erlaubt',405);
  try{
    let email;
    try{ email=await userIdentity(request,env); }catch(err){return reject('Authentifizierung fehlgeschlagen: '+msg(err),401);}
    const allowed=await grants(env,email);
    if(!allowed.length)return reject('Keine aktive PELICAN-Freigabe für dieses Benutzerkonto',403);
    if(request.method==='GET'){
      const catalog=Object.fromEntries(await Promise.all(FIELDS.map(async k=>[k,await getDoc(env,'catalog:'+k)])));
      const tables=await Promise.all(allowed.map(async g=>({...g,signal:(await getDoc(env,'table:'+g.table_id)).signal})));
      return respond({version:'1.4-RC1',tables,defaultTable:allowed.some(x=>x.table_id==='louisiana')?'louisiana':allowed[0].table_id,catalog});
    }
    if(Number(request.headers.get('content-length')||0)>10000)return reject('Anfrage zu groß',413);
    const body=await request.json();
    const operation=body.operation;
    if(!['encode','decode'].includes(operation))return reject('Unbekannte Aktion');
    let tableId=body.table, signalDetected=false;
    if(operation==='decode'){
      const raw=String(body.input||'').trim().toUpperCase();
      const tokens=raw.split(/[\s.\-]+/).filter(Boolean);
      if(tokens[0]?.length===3){
        if(tokens.length<3 || tokens.at(-1)!==tokens[0])throw Error('Kennsignal am Anfang und Ende muss identisch sein');
        const options=await Promise.all(allowed.filter(g=>g.can_decode).map(async g=>({id:g.table_id,signal:(await getDoc(env,'table:'+g.table_id)).signal})));
        const match=options.find(t=>t.signal===tokens[0]);
        if(!match)return reject('Keine Freigabe fuer das empfangene Kennsignal oder ungueltiges Kennsignal',403);
        tableId=match.id;
        body.input=tokens.slice(1,-1).join('\n');
        signalDetected=true;
      }
    }
    const grant=allowed.find(x=>x.table_id===tableId);
    if(!grant || (operation==='encode'&&!grant.can_encode)||(operation==='decode'&&!grant.can_decode))return reject('Keine Freigabe für diese Codetafel oder Aktion',403);
    const tab=await getDoc(env,'table:'+tableId);
    const catalog=Object.fromEntries(await Promise.all(FIELDS.map(async k=>[k,await getDoc(env,'catalog:'+k)])));
    const symbols=await getDoc(env,'catalog:symbols');
    if(operation==='encode')return respond(encode(body,tab,catalog,symbols));
    return respond({...decode(body,tab,catalog,symbols),tableId,signalDetected});
  }catch(e){
    if(msg(e).startsWith('PELICAN-Daten fehlen'))return reject('Codetafeln noch nicht freigeschaltet',503);
    return reject('Anfrage abgelehnt: '+msg(e),400);
  }
}
