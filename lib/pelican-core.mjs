export const PelicanCore=(function(){
'use strict';
// PELICAN universal, table-agnostic codec. No confidential mapping in source.
const FIELDS=['sea','object','event','admiralty'];
const NATO={A:'ALFA',B:'BRAVO',C:'CHARLIE',D:'DELTA',E:'ECHO',F:'FOXTROT',G:'GOLF',H:'HOTEL',I:'INDIA',J:'JULIETT',K:'KILO',L:'LIMA',M:'MIKE',N:'NOVEMBER',O:'OSCAR',P:'PAPA',Q:'QUEBEC',R:'ROMEO',S:'SIERRA',T:'TANGO',U:'UNIFORM',V:'VICTOR',W:'WHISKEY',X:'X-RAY',Y:'YANKEE',Z:'ZULU'};
const ABC='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const REL={NR:'Funkruf unbeantwortet',HD:'Kurs auf',CL:'Kollision mit',IM:'Kontakt/Anprall',RM:'Absichtlich gerammt (nur belegt)',RS:'Rettet Personen/Einheit',TF:'Übergabe/Transfer zu',OB:'Beobachtet',BD:'Boarding an',DR:'Taucharbeit an',FW:'Folgte',PW:'Befand sich nahe',AT:'Angriff auf',RP:'Meldung über',DK:'Ladung abgesetzt',PK:'Ladung aufgenommen'};
const TEMP={P:'zuvor',D:'zeitgleich',A:'danach',U:'unbekannt'};
const COUNTRY_ROLE={F:'Flaggenstaat',L:'Positionsstaat',O:'Eignersitz',C:'Ladeland',T:'Transitland',A:'Behördenstaat',N:'Nationalität',R:'Registrierungsstaat',D:'Bestimmungsland',S:'Quellenstaat'};
const TEXT_KIND={N:'Eigenname',P:'Ortsname',L:'Freitext',R:'Referenztext',D:'Dokumentenkennung'};
const MAX_GROUPS=10000;
const REVISION='1.5-SECURITY-RC2';
const STATUS_VALUES={OPERATION:['ANNOUNCED','COMMENCED','IN_PROGRESS','COMPLETED','POSTPONED','CANCELLED','EXTENDED','RESCHEDULED'],VALIDITY:['EFFECTIVE','EXPIRED'],EDITORIAL:['PRELIMINARY_REPORT','UPDATE','CORRECTION','RETRACTION'],VERIFICATION:['CONFIRMED','NOT_CONFIRMED']};
const own=(o,k)=>o && Object.hasOwn(o,k);
function checkStatus(s){if(!s||!STATUS_VALUES[s.family]?.includes(s.value))err('Status passt nicht zur Familie')}
function checkSpecials(specs){
 if(!Array.isArray(specs))err('Sondergruppen müssen eine Liste sein');
 const seen=new Set();
 for(const s of specs){
  if(!s||typeof s!=='object')err('Sondergruppe ungültig');
  if(s.type==='relation'){if((s.actor||'A')===s.target)err('Selbstbeziehung ungültig');continue}
  const kind=s.type==='unicode'?(s.kind||'N'):s.type==='name'?'N':s.type;
  const key=[kind,s.type==='utc'?'':(s.actor||'A'),s.type==='country'?(s.role||''):''].join(':');
  if(seen.has(key))err('Doppelte oder widersprüchliche Sonderdaten');seen.add(key);
 }
}
function parsePosition(lat,lon){
 const parse=(v,hem,max)=>{const m=String(v).trim().toUpperCase().match(new RegExp('^(\\d{1,3})(?:[°\\s]+(\\d{1,2})(?:[.,](\\d{1,2})|\\s+(\\d{1,2}))?)?\\s*(['+hem+'])$'));
  if(!m)err('Position als Grad Minuten.Hundertstel N/S bzw. E/W erwartet');
  const deg=+m[1],min=+(m[2]||0),frac=m[3]?+m[3].padEnd(2,'0'):+(m[4]||0);
  if(deg>max||min>59||frac>99||(deg===max&&(min||frac)))err('Position außerhalb zulässigen Bereichs');return {deg,min,frac,hem:m[5]};};
 const a=parse(lat,'NS',90),b=parse(lon,'EW',180);return {type:'position',lat:{deg:a.deg,min:a.min,frac:a.frac},lon:{deg:b.deg,min:b.min,frac:b.frac},ns:a.hem,ew:b.hem,datum:'U',precision:'U'};
} 
const err=(s)=>{throw Error(s)};
const validGroup=(s)=>/^[A-Z]{8}$/.test(s);
const num=(s)=>{let n=0;for(const c of s){let x=ABC.indexOf(c);if(x<0)err('Nichtalphabetisches Basis26-Zeichen');n=n*26+x}return n};
function enc26(n,w=4){if(!Number.isSafeInteger(n)||n<0||n>=26**w)err('Zahl außerhalb des Wertebereichs');let v='';for(let i=0;i<w;i++){v=ABC[n%26]+v;n=Math.floor(n/26)}return v}
function b26(b){if(!Number.isInteger(b)||b<0||b>255)err('Ungültiges Byte');return ABC[Math.floor(b/26)]+ABC[b%26]}
function decByte(s){const n=num(s);if(n>255)err('Ungültige Byte-Zahl');return n}
function crc16(buffer){let crc=0xffff;for(const b of buffer){crc^=b<<8;for(let j=0;j<8;j++)crc=(crc&0x8000)?((crc<<1)^0x1021)&0xffff:(crc<<1)&0xffff}return crc}
const noDup=(a)=>new Set(a).size===a.length;
function validateBook(book){
 if(!book||typeof book!=='object'||book.kind!=='PELICAN_BOOK'||book.format_version!==1||!(/^[a-z][a-z_]{1,63}$/.test(book.table_id))||!book.sections||!book.catalog||!book.extension||!book.status_protocol)err('Unvollständige PELICAN-Codetafel');
 if(book.edition!==REVISION)err('Edition nicht unterstützt: '+book.edition);
 for(const f of FIELDS){const values=Object.values(book.sections[f]||{});if(!values.length||!values.every(v=>/^[A-Z]{2}$/.test(v))||!noDup(values))err('Kollision/Fehler in '+f);if(!Array.isArray(book.catalog[f])||book.catalog[f].length!==values.length||!noDup(book.catalog[f].map(x=>x.id))||book.catalog[f].some(x=>!own(book.sections[f],x.id)))err('Katalog und Codetafel inkonsistent: '+f);}
 const sc=book.special_cipher;
 if(!sc||sc.version!==2||!Array.isArray(sc.pairs)||sc.pairs.length!==676||!sc.pairs.every(x=>/^[A-Z]{2}$/.test(x))||!noDup(sc.pairs))err('Private RC2-Digraphentafel fehlt oder ungültig');
 for(let k=0;k<2;k++){const m=new Map();let positional=true;for(let i=0;i<676;i++){const x=enc26(i,2)[k],y=sc.pairs[i][k];if(m.has(x)&&m.get(x)!==y)positional=false;m.set(x,y)}if(positional)err('Positionsweise Sonderzeichencodierung verboten')}
 const ex=book.extension; if(!/^[A-Z]{2}$/.test(ex.prefix)||!Object.values(ex.tokens||{}).every(c=>/^[A-Z]{2}$/.test(c))||!noDup(Object.values(ex.tokens)))err('Fortsetzungstabelle ungültig');
 const st=book.status_protocol;const pref=Object.values(st.prefixes||{});if(pref.length!==3||!pref.every(c=>/^[A-Z]{2}$/.test(c)))err('Statuspräfix ungültig');
 for(const k of ['families','statuses','time_qualifiers'])if(!st[k]||!Object.values(st[k]).every(v=>/^[A-Z]{2}$/.test(v))||!noDup(Object.values(st[k])))err('Statuscodes fehlerhaft: '+k);
 const occupied=new Set([...FIELDS.flatMap(k=>Object.values(book.sections[k])),ex.prefix]);
 const prefixes=[...pref,book.special_prefix,book.unicode_prefix]; if(prefixes.some(x=>!/^[A-Z]{2}$/.test(x))||!noDup([...prefixes,ex.prefix]))err('Sonderpräfix doppelt');
 if(prefixes.some(x=>occupied.has(x)))err('Sonderpräfix mit Altcode kollidiert');
 if(!Array.isArray(book.symbols)||book.symbols.length===0||!noDup(book.symbols.map(x=>x.id))||!own(ex.tokens,'PAD')||book.symbols.some(x=>!own(ex.tokens,x.id)||typeof x.value!=='string'))err('Zeichencodebuch fehlt');
 if(Object.keys(book.extension.tokens).some(id=>!book.symbols.some(x=>x.id===id) && id!=='PAD'))err('Unbekannter Zeichentoken');
 return true;
}
function speech(g){return [...g].map(c=>NATO[c]).join(' ')}
function splitGroups(input){
 const t=String(input||'').trim().toUpperCase(); if(!t)err('Meldung fehlt');
 if(t.length>MAX_GROUPS*10+20)err('Meldung zu lang');
 if(!/^[A-Z\s.\-]+$/.test(t))err('Nur A–Z und Trennzeichen erlaubt');
 const ws=t.split(/[\s.\-]+/).filter(Boolean);if(ws.some(w=>w.length%8 && w.length!==3))err('Ungültige Gruppenlänge');
 const res=ws.flatMap(w=>w.length===3?[w]:w.match(/.{8}/g));if(res.length>MAX_GROUPS+2)err('Zu viele Gruppen');return res;
}
function reverseFields(book){return Object.fromEntries(FIELDS.map(k=>[k,Object.fromEntries(Object.entries(book.sections[k]).map(([id,c])=>[c,id]))]));}
function legacyEncode(text,book){
 let normalized=String(text).toUpperCase().replace(/Ä/g,'AE').replace(/Ö/g,'OE').replace(/Ü/g,'UE').replace(/ẞ/g,'SS').replace(/[–—]/g,'-').replace(/[‘’]/g,"'").replace(/\s+/g,' ').trim();
 const values=new Map(book.symbols.filter(x=>x.type==='character').map(x=>[x.value,x.id]));
 const words=book.symbols.filter(x=>x.type==='word'&&x.value).sort((a,b)=>b.value.length-a.value.length); const tokens=[];
 for(let i=0;i<normalized.length;){let w=words.find(x=>normalized.startsWith(x.value,i)); if(w){tokens.push(w.id);i+=w.value.length;continue;}let token=values.get(normalized[i]);if(!token)err('Zeichen nicht in ND-Zeichensatz: '+normalized[i]);tokens.push(token);i++}
 while(tokens.length%3)tokens.push('PAD');
 return Array.from({length:tokens.length/3},(_,i)=>book.extension.prefix+tokens.slice(3*i,3*i+3).map(k=>book.extension.tokens[k]).join(''));
}
function legacyDecode(groups,book){const inv=Object.fromEntries(Object.entries(book.extension.tokens).map(([id,t])=>[t,id]));const dict=Object.fromEntries(book.symbols.map(x=>[x.id,x.value]));const tokens=[];for(const g of groups){if(!validGroup(g)||!g.startsWith(book.extension.prefix))err('ND-Gruppe ungültig');for(let i=2;i<8;i+=2){const x=inv[g.slice(i,i+2)];if(!x)err('ND-Zeichen unbekannt');tokens.push(x)}}
 let end=tokens.indexOf('PAD');if(end>=0){if(tokens.slice(end).some(x=>x!=='PAD'))err('PAD mitten im ND-Text');tokens.length=end;}return tokens.map(x=>dict[x]??'').join('');}
function unicodeEncode(kind,actor,value,prefix='YY'){
 if(!own(TEXT_KIND,kind)||!/^[A-Z]$/.test(actor))err('Unicode-Kopf ungültig');if(typeof value!=='string'||/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value))err('Unicode-Text ungültig');const bytes=new TextEncoder().encode(value);if(!bytes.length||bytes.length>=26**4)err('Unicode-Länge außerhalb zulässigen Bereichs');
 const out=[prefix+kind+actor+enc26(bytes.length)];for(let i=0;i<bytes.length;i+=3){const b=Array.from(bytes.slice(i,i+3));while(b.length<3)b.push(0);out.push(prefix+b.map(b26).join(''))}const data=new Uint8Array(2+bytes.length);data.set([kind.charCodeAt(0),actor.charCodeAt(0)]);data.set(bytes,2);out.push(prefix+'C'+actor+enc26(crc16(data)));return out;
}
function unicodeDecode(groups,start,prefix='YY'){
 const head=groups[start];if(!validGroup(head)||!head.startsWith(prefix)||!TEXT_KIND[head[2]])err('Unicode-Startgruppe ungültig');
 const kind=head[2],actor=head[3],length=num(head.slice(4));if(!length)err('Unicode-Leertext nicht zulässig');const count=Math.ceil(length/3);if(start+count+1>=groups.length)err('Unicode-Gruppen abgeschnitten');
 const bytes=[];for(let j=0;j<count;j++){const f=groups[start+j+1];if(!validGroup(f)||!f.startsWith(prefix))err('Unicode-Datengruppe ungültig');for(let i=2;i<8;i+=2)bytes.push(decByte(f.slice(i,i+2)))}if(bytes.slice(length).some(x=>x!==0))err('Unicode-Füllbytes ungültig');const part=bytes.slice(0,length);
 const end=groups[start+1+count];if(!validGroup(end)||end.slice(0,4)!==prefix+'C'+actor)err('Unicode-Prüfgruppe fehlt');const bs=Uint8Array.from([kind.charCodeAt(0),actor.charCodeAt(0),...part]);if(crc16(bs)!==num(end.slice(4)))err('CRC16-Prüfung fehlgeschlagen');let value;try{value=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(part))}catch{err('UTF-8 ungültig')};return {kind:TEXT_KIND[kind],actor,value,frames:count+2};
}
// RC2: independent random permutations of all 676 digraphs per book.
// Every output letter depends on both input letters. No single-letter substitution.
// This remains codebook obfuscation, NOT cryptographic encryption.
function protectExtra(frame,book){
 if(!frame.startsWith(book.special_prefix)&&!frame.startsWith(book.unicode_prefix))return frame;
 let body='';for(let i=2;i<8;i+=2)body+=book.special_cipher.pairs[num(frame.slice(i,i+2))];
 return frame.slice(0,2)+body;
}
function unprotectExtra(frame,book){
 if(!frame.startsWith(book.special_prefix)&&!frame.startsWith(book.unicode_prefix))return frame;
 const reverse=new Map(book.special_cipher.pairs.map((p,i)=>[p,enc26(i,2)]));
 let body='';for(let i=2;i<8;i+=2){const p=reverse.get(frame.slice(i,i+2));if(!p)err('Sondergruppe ungültig');body+=p}
 return frame.slice(0,2)+body;
}
const DIGIT='ABCDEFGHIJ';
function letters(s){return [...String(s)].map(x=>{let k=Number(x);if(!/^[0-9]$/.test(x))err('Ziffer erwartet');return DIGIT[k]}).join('')}
function digits(s){return [...s].map(c=>{const i=DIGIT.indexOf(c);if(i<0)err('Zahlencode ungültig');return String(i)}).join('')}
function imoValid(s){return /^[0-9]{7}$/.test(s)&&[...s.slice(0,6)].reduce((n,c,i)=>n+Number(c)*(7-i),0)%10===Number(s[6]);}
function specialEncode(spec,book){const p=book.special_prefix;const actor=spec.actor||'A';if(!/^[A-Z]$/.test(actor))err('Akteurskennung A–Z erwartet');let o=[];
 switch(spec.type){
 case 'actor': {const pair=book.sections.object[spec.object];if(typeof pair!=='string'||!/^[A-Z]{2}$/.test(spec.country||''))err('Ungültiger Akteur/Objekttyp/Länderkürzel');o=[p+'A'+actor+pair+spec.country];break}
 case 'relation': {if(!/^[A-Z]$/.test(spec.target||'')||!REL[spec.action]||!TEMP[spec.time||'U'])err('Ungültige Beziehung');o=[p+'E'+actor+spec.target+spec.action+(spec.time||'U')];break}
 case 'country': {if(!COUNTRY_ROLE[spec.role]||!/^[A-Z]{2}$/.test(spec.country||''))err('Ungültige Länderrolle');o=[p+'L'+actor+spec.role+spec.country+'X'];break}
 case 'imo': {const imo=String(spec.value||'');if(!imoValid(imo))err('IMO-Nummer mit Prüfziffer ungültig');o=[p+'I'+actor+letters(imo.slice(0,4)),p+'J'+actor+letters(imo.slice(4))+'X'];break}
 case 'utc': {const m=/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)Z$/.exec(spec.value||'');if(!m)err('UTC als YYYY-MM-DDTHH:MMZ erwartet');let dt=new Date(spec.value.slice(0,-1)+':00Z');if(isNaN(dt.valueOf())||dt.toISOString().slice(0,16)!==spec.value.slice(0,16))err('Datum/Zeit ungültig');const raw=m.slice(1).join('');o=[p+'T'+'A'+letters(raw.slice(0,4)),p+'T'+'B'+letters(raw.slice(4,8)),p+'T'+'C'+letters(raw.slice(8,12))];break}
 case 'position': {const {lat,lon,ns,ew}=spec;const cl=(v,max)=>Number.isInteger(v)&&v>=0&&v<=max; if(!cl(lat?.deg,90)||!cl(lat?.min,59)||!cl(lat?.frac,99)||!cl(lon?.deg,180)||!cl(lon?.min,59)||!cl(lon?.frac,99)||!['N','S'].includes(ns)||!['E','W'].includes(ew)||((lat.deg===90)&&(lat.min||lat.frac))||((lon.deg===180)&&(lon.min||lon.frac)))err('Positionswerte ungültig');const pr=spec.precision||'U';if(!['A','B','C','U'].includes(pr))err('Ungültige Positionsgenauigkeit');const datum=spec.datum||'U';if(!['W','U'].includes(datum))err('Unbekanntes Bezugsystem');const a=String(lat.deg).padStart(2,'0')+String(lat.min).padStart(2,'0')+String(lat.frac).padStart(2,'0')+'00';const b=String(lon.deg).padStart(3,'0')+String(lon.min).padStart(2,'0')+String(lon.frac).padStart(2,'0')+'0';o=[p+'O'+actor+datum+pr+'XX',p+'P'+ns+letters(a.slice(0,4)),p+'P'+'F'+letters(a.slice(4)),p+'P'+ew+letters(b.slice(0,4)),p+'P'+'G'+letters(b.slice(4))];break}
 case 'name': {if(typeof spec.value!=='string'||!spec.value.trim())err('Name fehlt');const frames=legacyEncode(spec.value,book);if(!frames.length||frames.length>=10000)err('Name zu lang/leer');o=[p+'N'+actor+letters(String(frames.length).padStart(4,'0')),...frames];break}
 case 'unicode': {o=unicodeEncode(spec.kind||'N',actor,spec.value,book.unicode_prefix);break}
 default: err('Unbekannter Sondertyp');
 }if(o.some(f=>!validGroup(f)))err('Sondergruppe ist nicht achtstellig');return o;
}
function specialDecode(groups,start,book){const f=groups[start],p=book.special_prefix;if(!validGroup(f)||!f.startsWith(p))err('Sondergruppe nicht erkannt');const typ=f[2],actor=f[3],b=f.slice(4);let frames=1,data={actor};
 if(typ==='A'){const rev=reverseFields(book).object;if(!rev[b.slice(0,2)])err('Objektcode in Akteurskennung ungültig');data={type:'actor',actor,object:rev[b.slice(0,2)],country:b.slice(2)};}
 else if(typ==='E'){if(!REL[b.slice(1,3)]||!TEMP[b[3]])err('Unbekannte Beziehung');data={type:'relation',actor,target:b[0],action:b.slice(1,3),time:b[3],meaning:REL[b.slice(1,3)]};}
 else if(typ==='L'){if(!COUNTRY_ROLE[b[0]]||b[3]!=='X')err('Länderrolle ungültig');data={type:'country',actor,role:b[0],country:b.slice(1,3),meaning:COUNTRY_ROLE[b[0]]};}
 else if(typ==='I'){const next=groups[start+1];if(!next||next.slice(0,4)!==p+'J'+actor||next[7]!=='X')err('IMO-Folgegruppe fehlt');const s=digits(b)+digits(next.slice(4,7));if(!imoValid(s))err('IMO-Prüfziffer ungültig');data={type:'imo',actor,value:s};frames=2;}
 else if(typ==='T'&&actor==='A'){const three=groups.slice(start,start+3);if(three.length!==3||three.some((x,i)=>x.slice(0,4)!==p+'T'+'ABC'[i]))err('UTC-Folgegruppen fehlen');const s=three.map(x=>digits(x.slice(4))).join('');const d=`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T${s.slice(8,10)}:${s.slice(10,12)}Z`;const dt=new Date(d.slice(0,-1)+':00Z');if(isNaN(dt.valueOf())||dt.toISOString().slice(0,16)!==d.slice(0,16))err('Datum ungültig');data={type:'utc',value:d};frames=3;}
 else if(typ==='O'){if(b.slice(2)!=='XX'||!['W','U'].includes(b[0])||!['A','B','C','U'].includes(b[1]))err('Positionskopf ungültig');const a=groups.slice(start+1,start+5);if(a.length!==4||a[0].slice(0,3)!==p+'P'||!['N','S'].includes(a[0][3])||a[1].slice(0,4)!==p+'PF'||a[2].slice(0,3)!==p+'P'||!['E','W'].includes(a[2][3])||a[3].slice(0,4)!==p+'PG')err('Positionsfolgegruppen fehlen');const lt=digits(a[0].slice(4))+digits(a[1].slice(4)),ln=digits(a[2].slice(4))+digits(a[3].slice(4));if(!lt.endsWith('00')||!ln.endsWith('0'))err('Positionspadding ungültig');const lat={deg:Number(lt.slice(0,2)),min:Number(lt.slice(2,4)),frac:Number(lt.slice(4,6))},lon={deg:Number(ln.slice(0,3)),min:Number(ln.slice(3,5)),frac:Number(ln.slice(5,7))};if(lat.deg>90||lat.min>59||lat.frac>99||lon.deg>180||lon.min>59||lon.frac>99||(lat.deg===90&&(lat.min||lat.frac))||(lon.deg===180&&(lon.min||lon.frac)))err('Position außerhalb zulässigen Bereichs');data={type:'position',actor,lat,lon,ns:a[0][3],ew:a[2][3],datum:b[0],precision:b[1]};frames=5;}
 else if(typ==='N'){const count=Number(digits(b));if(!count||start+count>=groups.length)err('Name-Datengruppen fehlen');const a=groups.slice(start+1,start+1+count);data={type:'name',actor,value:legacyDecode(a,book)};frames=count+1;}
 else err('Unbekannte oder verwaiste Sondergruppe');return {data,frames};}
function encodeMessage(book,message){validateBook(book);if(!message||!message.fields||typeof message.fields!=='object')err('Felder fehlen');
 if(message.details!==undefined&&typeof message.details!=='string')err('Zusatztext ungültig');
 if(!Array.isArray(message.statuses||[]))err('Statusliste ungültig');checkSpecials(message.specials||[]);
 if((message.fields.event==='NEW-EVENT-UNLISTED'||message.fields.object==='NEW-TOPIC')&&!message.details?.trim()&&!(message.specials||[]).some(s=>s.type==='unicode'&&s.kind==='L'&&s.value?.trim()))err('Neues Thema erfordert Zusatztext');const chunks=FIELDS.map(f=>{const x=own(book.sections[f],message.fields[f])?book.sections[f][message.fields[f]]:null;if(typeof x!=='string')err('Code nicht vorhanden für '+f);return x});const out=[chunks.join('')];
 const st=book.status_protocol;
 if(message.id){if(!/^[A-Z]{6}$/.test(message.id))err('Ungültige Meldungs-ID');out.push(st.prefixes.self_id+message.id)}
 if(message.reference){if(!message.id||!(/^[A-Z]{6}$/.test(message.reference))||message.reference===message.id)err('Meldungsreferenz ungültig');out.push(st.prefixes.reference+message.reference)}
 const used=new Set();for(const status of message.statuses||[]){checkStatus(status);if(used.has(status.family))err('Doppelte Statusfamilie');used.add(status.family);if(!st.families[status.family]||!st.statuses[status.value]||!own(st.time_qualifiers,status.time||'NONE'))err('Unbekannter Status');if(['UPDATE','CORRECTION','RETRACTION','EXTENDED','RESCHEDULED','POSTPONED','CANCELLED'].includes(status.value)&&!message.reference)err('Status benötigt Referenz');out.push(st.prefixes.status+st.families[status.family]+st.statuses[status.value]+st.time_qualifiers[status.time||'NONE'])}
 for(const spec of message.specials||[])out.push(...specialEncode(spec,book).map(f=>protectExtra(f,book)));
 if(message.details)out.push(...legacyEncode(message.details,book));
 if(out.length>MAX_GROUPS)err('Zu viele Gruppen');if(out.some(g=>!validGroup(g)))err('Ungültige Ausgabegruppe');return out;
}
function decodeMessage(book,wireFrames){validateBook(book);if(!Array.isArray(wireFrames)||!wireFrames.length||wireFrames.length>MAX_GROUPS||wireFrames.some(x=>!validGroup(x)))err('Ungültige Meldungsgruppen');const frames=wireFrames.map(f=>unprotectExtra(f,book));const st=book.status_protocol,reverse=reverseFields(book);const main=frames[0];const ids=FIELDS.map((f,i)=>reverse[f][main.slice(i*2,i*2+2)]);if(ids.some(x=>!x))err('Hauptmeldung falsch oder Tafel nicht passend');let output={frame:main,fields:Object.fromEntries(FIELDS.map((x,i)=>[x,book.catalog[x].find(q=>q.id===ids[i])?.de||ids[i]])),field_ids:Object.fromEntries(FIELDS.map((x,i)=>[x,ids[i]])),id:null,reference:null,statuses:[],specials:[],details:'',unicode:[]};let used=new Set();let p=1;
 while(p<frames.length){const f=frames[p];if(f.startsWith(st.prefixes.self_id)){if(output.id)err('Doppelte Nachrichten-ID');output.id=f.slice(2);p++;continue}
 if(f.startsWith(st.prefixes.reference)){if(output.reference)err('Doppelte Referenz');output.reference=f.slice(2);p++;continue}
 if(f.startsWith(st.prefixes.status)){const a=Object.entries(st.families).find(([,v])=>v===f.slice(2,4));const b=Object.entries(st.statuses).find(([,v])=>v===f.slice(4,6));const c=Object.entries(st.time_qualifiers).find(([,v])=>v===f.slice(6,8));if(!a||!b||!c||used.has(a[0]))err('Status ungültig/doppelt');used.add(a[0]);checkStatus({family:a[0],value:b[0]});output.statuses.push({family:a[0],value:b[0],time:c[0]});p++;continue}
 if(f.startsWith(book.unicode_prefix)){const u=unicodeDecode(frames,p,book.unicode_prefix);output.unicode.push({kind:u.kind,actor:u.actor,value:u.value});p+=u.frames;continue}
 if(f.startsWith(book.special_prefix)){const a=specialDecode(frames,p,book);output.specials.push(a.data);p+=a.frames;continue}
 if(f.startsWith(book.extension.prefix)){let q=p+1;while(q<frames.length&&frames[q].startsWith(book.extension.prefix))q++;output.details+=(output.details?'\n':'')+legacyDecode(frames.slice(p,q),book);p=q;continue}
 err('Unbekannte Zusatzgruppe');
 }
 if(output.reference&&(!output.id||output.reference===output.id))err('Referenz ohne gültige eigene ID');if(output.statuses.some(s=>['UPDATE','CORRECTION','RETRACTION','EXTENDED','RESCHEDULED','POSTPONED','CANCELLED'].includes(s.value))&&!output.reference)err('Referenzpflichtiger Status ohne Referenz');checkSpecials([...output.specials,...output.unicode.map(u=>({type:'unicode',kind:Object.keys(TEXT_KIND).find(k=>TEXT_KIND[k]===u.kind),actor:u.actor,value:u.value}))]);return output;
}
function decodeBlock(book,input,signal){validateBook(book);const all=splitGroups(input);let frames=all;let detected=false;if(all[0]?.length===3){if(!signal||all[0]!==signal||all.at(-1)!==signal)err('Kennsignal nicht zu geladener Tafel passend');frames=all.slice(1,-1);detected=true}else if(all.some(x=>x.length===3))err('Kennsignal nur als Blockanfang und -ende');
 if(!frames.length||frames.length>MAX_GROUPS)err('Keine Meldung oder zu viele Gruppen');
 const heads=reverseFields(book),reserved=new Set([book.extension.prefix,book.special_prefix,book.unicode_prefix,...Object.values(book.status_protocol.prefixes)]);
 let messages=[],i=0;while(i<frames.length){const f=frames[i];if(!validGroup(f)||reserved.has(f.slice(0,2)))err('Zusatzgruppe ohne Hauptmeldung');const ids=FIELDS.map((x,j)=>heads[x][f.slice(j*2,j*2+2)]);if(ids.some(x=>!x))err('Keine passende Hauptmeldung');let j=i+1;while(j<frames.length){const a=frames[j];if(reserved.has(a.slice(0,2))){j++;continue}const candidate=FIELDS.map((x,k)=>heads[x][a.slice(k*2,k*2+2)]);if(candidate.every(Boolean))break;err('Unbekannte Haupt- oder Zusatzgruppe')}messages.push(decodeMessage(book,frames.slice(i,j)));i=j;}return {messages,totalFrames:frames.length,signalDetected:detected};}
function wrapBroadcast(groups,signal){if(!signal)return groups.join('\n');if(!/^[A-Z]{3}$/.test(signal))err('Kennsignal nicht gültig');return [signal,...groups,signal].join('\n')}
return {REVISION,STATUS_VALUES,parsePosition,protectExtra,unprotectExtra,FIELDS,NATO,REL,TEMP,COUNTRY_ROLE,TEXT_KIND,MAX_GROUPS,validateBook,encodeMessage,decodeMessage,decodeBlock,legacyEncode,legacyDecode,unicodeEncode,unicodeDecode,specialEncode,specialDecode,speech,splitGroups,wrapBroadcast,imoValid};

})();
