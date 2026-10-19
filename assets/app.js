
const FIELDS=[['sea','Seeraum'],['object','Objektklasse'],['event','Ereignis'],['admiralty','Admiralty-Bewertung']];
const NATO={A:'ALFA',B:'BRAVO',C:'CHARLIE',D:'DELTA',E:'ECHO',F:'FOXTROT',G:'GOLF',H:'HOTEL',I:'INDIA',J:'JULIETT',K:'KILO',L:'LIMA',M:'MIKE',N:'NOVEMBER',O:'OSCAR',P:'PAPA',Q:'QUEBEC',R:'ROMEO',S:'SIERRA',T:'TANGO',U:'UNIFORM',V:'VICTOR',W:'WHISKEY',X:'X-RAY',Y:'YANKEE',Z:'ZULU'};
const $=x=>document.getElementById(x);let config=null;let frames=[];let lastFrames=[];
async function api(payload){const response=await fetch('/api/',payload?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'}:{cache:'no-store'});let result=await response.json();if(!response.ok)throw Error(result.error||'Fehler');return result;}
function err(message){$('status').textContent=message;$('status').style.color='#a12828';}
function setButtons(){const grant=config.tables.find(x=>x.table_id===$('table').value);$('encode').disabled=!grant?.can_encode;$('decode').disabled=!grant?.can_decode;$('add').disabled=!lastFrames.length;}
function printBlock(){
  const sig=config?.tables.find(x=>x.table_id===$('table').value)?.table_id;
  const signal=({louisiana:'LOU',sint_maarte:'SIM',barbados:'BAR',saint_kitts_and_nevis:'KEN',turks_and_caicos_islands:'TCI'})[sig];
  $('broadcast').textContent=frames.length?[signal,...frames,signal].join('\n'):'Noch keine Meldungen.';
  $('broadcastSpoken').textContent=frames.length?[signal,...frames,signal].map(g=>[...g].map(c=>NATO[c]).join(' ')+'.').join('\n'):'Noch keine Meldungen.';
} 
async function init(){try{config=await api();$('table').replaceChildren();for(const t of config.tables){const o=new Option(t.table_id.replaceAll('_',' '),t.table_id);$('table').append(o)}$('table').value=config.defaultTable;$('table').disabled=false;const holder=$('fields');for(const [k,title] of FIELDS){const label=document.createElement('label');label.textContent=title;label.htmlFor='f-'+k;holder.append(label);const sel=document.createElement('select');sel.id='f-'+k;for(const d of config.catalog[k])sel.add(new Option(d.de,d.id));holder.append(sel)}$('status').textContent='Zugriff freigegeben · Codetafeln bleiben serverseitig';setButtons();}catch(e){err(e.message)}}
$('table').addEventListener('change',()=>{frames=[];lastFrames=[];$('encoded').textContent='–';$('speak').textContent='';setButtons();printBlock()});
$('encode').onclick=async()=>{try{const fields=Object.fromEntries(FIELDS.map(([k])=>[k,$('f-'+k).value]));const r=await api({operation:'encode',table:$('table').value,fields,details:$('details').value});lastFrames=r.frames;$('encoded').textContent=r.frames.join('\n');$('speak').textContent=r.spoken.map(group=>group+'.').join('\n');setButtons()}catch(e){err(e.message)}};
// Tab inside the input moves to the next code line; Shift+Tab retains keyboard accessibility.
const decodeInput=$('decodeInput');
function decodeCount(){
  const entries=decodeInput.value.trim().split(/[\s.\-]+/).filter(Boolean);
  $('decodeCount').textContent=entries.length+' Gruppe(n) eingetragen · noch nicht decodiert';
}
decodeInput.addEventListener('input',decodeCount);
decodeInput.addEventListener('keydown',event=>{
  if(event.key==='Tab'&&!event.shiftKey&&!event.ctrlKey&&!event.altKey&&!event.metaKey){
    event.preventDefault();
    const {selectionStart:start,selectionEnd:end,value}=decodeInput;
    decodeInput.value=value.slice(0,start)+'\n'+value.slice(end);
    decodeInput.selectionStart=decodeInput.selectionEnd=start+1;
    decodeCount();
  }else if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){
    event.preventDefault();
    if(!$('decode').disabled)$('decode').click();
  }
});
$('clearDecode').onclick=()=>{
  decodeInput.value='';decodeCount();$('decoded').replaceChildren();
  decodeInput.focus();
};
$('decode').onclick=async()=>{
  const el=$('decoded');el.replaceChildren();
  try{
    const r=await api({operation:'decode',table:$('table').value,input:decodeInput.value});
    for(let i=0;i<r.messages.length;i++){
      const m=r.messages[i];
      const entry=document.createElement('section');entry.className='decoded-message';
      const heading=document.createElement('strong');heading.textContent='Meldung '+(i+1)+' · '+m.frame;entry.append(heading);
      const p=document.createElement('p');p.textContent=Object.values(m.fields).join(' · ');entry.append(p);
      if(m.details){const extra=document.createElement('p');extra.className='small';extra.textContent='Zusatzinformation: '+m.details;entry.append(extra)}
      el.append(entry);
    }
    $('decodeCount').textContent=r.totalFrames+' Gruppe(n) verarbeitet · '+r.messages.length+' Hauptmeldung(en) decodiert';
    $('status').textContent='Decodierung abgeschlossen';$('status').style.color='';
  }catch(e){
    const p=document.createElement('p');p.className='error';p.textContent='Decodierung fehlgeschlagen: '+e.message;el.append(p);
    err(e.message);
  }
};
$('add').onclick=()=>{frames.push(...lastFrames);lastFrames=[];setButtons();printBlock()};$('clear').onclick=()=>{frames=[];printBlock()};$('copy').onclick=async()=>{if(frames.length)await navigator.clipboard.writeText($('broadcast').textContent)};
$('copySpoken').onclick=async()=>{if(frames.length)await navigator.clipboard.writeText($('broadcastSpoken').textContent)};
decodeCount();init();

