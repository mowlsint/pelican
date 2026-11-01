
const FIELDS=[['sea','Seeraum'],['object','Objektklasse'],['event','Ereignis'],['admiralty','Admiralty-Bewertung']];
const NATO={A:'ALFA',B:'BRAVO',C:'CHARLIE',D:'DELTA',E:'ECHO',F:'FOXTROT',G:'GOLF',H:'HOTEL',I:'INDIA',J:'JULIETT',K:'KILO',L:'LIMA',M:'MIKE',N:'NOVEMBER',O:'OSCAR',P:'PAPA',Q:'QUEBEC',R:'ROMEO',S:'SIERRA',T:'TANGO',U:'UNIFORM',V:'VICTOR',W:'WHISKEY',X:'X-RAY',Y:'YANKEE',Z:'ZULU'};
const $=x=>document.getElementById(x);let config=null;let frames=[];let lastFrames=[];let uiEpoch=0;
async function api(payload){const response=await fetch('/api/',payload?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'}:{cache:'no-store'});let result=await response.json();if(!response.ok)throw Error(result.error||'Fehler');return result;}
function err(message){$('status').textContent=message;$('status').style.color='#a12828';}
const STATUS_VALUES={OPERATION:['ANNOUNCED','COMMENCED','IN_PROGRESS','COMPLETED','POSTPONED','CANCELLED','EXTENDED','RESCHEDULED'],VALIDITY:['EFFECTIVE','EXPIRED'],EDITORIAL:['PRELIMINARY_REPORT','UPDATE','CORRECTION','RETRACTION'],VERIFICATION:['CONFIRMED','NOT_CONFIRMED']};
function setStatusValues(){const f=$('statusfamily').value;const e=$('statusvalue');e.replaceChildren();e.add(new Option('—',''));for(const x of STATUS_VALUES[f]||[])e.add(new Option(x,x))};$('statusfamily').onchange=setStatusValues;
function extras(){const fam=$('statusfamily').value, val=$('statusvalue').value;const raw=$('specials').value.trim();const specials=raw?JSON.parse(raw):[];if(!Array.isArray(specials))throw Error('Sondergruppen müssen eine JSON-Liste sein');if($('unicode').value.trim())specials.push({type:'unicode',actor:'A',kind:'N',value:$('unicode').value});return {id:$('msgid').value.trim().toUpperCase()||undefined,reference:$('refid').value.trim().toUpperCase()||undefined,statuses:fam?[{family:fam,value:val,time:$('statustime').value}]:[],specials}};
function setButtons(){const grant=config.tables.find(x=>x.table_id===$('table').value);$('encode').disabled=!grant?.can_encode;$('decode').disabled=!grant?.can_decode;$('add').disabled=!lastFrames.length;}
function printBlock(){
  const signal=config?.tables.find(x=>x.table_id===$('table').value)?.signal;
  if(!signal){$('broadcast').textContent='Kein Signal fuer diese Tafel freigegeben.';return;}
  $('broadcast').textContent=frames.length?[signal,...frames,signal].join('\n'):'Noch keine Meldungen.';
  $('broadcastSpoken').textContent=frames.length?[signal,...frames,signal].map(g=>[...g].map(c=>NATO[c]).join(' ')+'.').join('\n'):'Noch keine Meldungen.';
} 
async function init(){try{config=await api();$('table').replaceChildren();for(const t of config.tables){const o=new Option(t.table_name||(t.table_id==='sint_maarte'?'Sint Maarten':t.table_id.replaceAll('_',' ')),t.table_id);$('table').append(o)}$('table').value=config.defaultTable;$('table').disabled=false;const holder=$('fields');for(const [k,title] of FIELDS){const label=document.createElement('label');label.textContent=title;label.htmlFor='f-'+k;holder.append(label);const sel=document.createElement('select');sel.id='f-'+k;for(const d of config.catalog[k])sel.add(new Option(d.de,d.id));holder.append(sel)}$('status').textContent='Zugriff freigegeben · Codetafeln bleiben serverseitig';setButtons();}catch(e){err(e.message)}}
$('table').addEventListener('change',()=>{uiEpoch++;frames=[];lastFrames=[];$('decoded').replaceChildren();$('encoded').textContent='–';$('speak').textContent='';setButtons();printBlock()});
$('encode').onclick=async()=>{const epoch=++uiEpoch;lastFrames=[];$('encoded').textContent='–';$('speak').textContent='';setButtons();try{const fields=Object.fromEntries(FIELDS.map(([k])=>[k,$('f-'+k).value]));const r=await api({operation:'encode',table:$('table').value,fields,details:$('details').value,...extras()});if(epoch!==uiEpoch)return;lastFrames=r.frames;$('encoded').textContent=r.frames.join('\n');$('speak').textContent=r.spoken.map(group=>group+'.').join('\n');setButtons()}catch(e){if(epoch===uiEpoch)err(e.message)}};
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
$('clearDecode').onclick=()=>{uiEpoch++;
  decodeInput.value='';decodeCount();$('decoded').replaceChildren();
  decodeInput.focus();
};
$('decode').onclick=async()=>{
  const epoch=++uiEpoch;
  const el=$('decoded');el.replaceChildren();
  try{
    const r=await api({operation:'decode',table:$('table').value,input:decodeInput.value});
    if(epoch!==uiEpoch)return;
    if(r.tableId && r.tableId!==$('table').value){
      $('table').value=r.tableId;
      frames=[];lastFrames=[];$('decoded').replaceChildren();$('encoded').textContent='–';$('speak').textContent='';
      setButtons();printBlock();
    }
    const fulltext=document.createElement('p');fulltext.className='decoded-fulltext';fulltext.style.whiteSpace='pre-wrap';
    fulltext.textContent=r.text||r.messages.map((m,i)=>'Meldung '+(i+1)+'\n'+Object.values(m.fields||{}).join('. ')+(m.details?'\nZusatzinformation: '+m.details:'')).join('\n\n');el.append(fulltext);
    const technical=document.createElement('details'),summary=document.createElement('summary'),json=document.createElement('pre');
    summary.textContent='Technische Daten (JSON)';json.textContent=JSON.stringify(r.messages,null,2);technical.append(summary,json);el.append(technical);
    $('decodeCount').textContent=r.totalFrames+' Gruppe(n) verarbeitet · '+r.messages.length+' Hauptmeldung(en) decodiert';
    $('status').textContent=(r.signalDetected?'Kennsignal automatisch erkannt · ':'')+'Decodierung abgeschlossen';$('status').style.color='';
  }catch(e){
    if(epoch!==uiEpoch)return;
    const p=document.createElement('p');p.className='error';p.textContent='Decodierung fehlgeschlagen: '+e.message;el.append(p);
    err(e.message);
  }
};
$('add').onclick=()=>{frames.push(...lastFrames);lastFrames=[];setButtons();printBlock()};$('clear').onclick=()=>{uiEpoch++;frames=[];lastFrames=[];$('encoded').textContent='–';$('speak').textContent='';setButtons();printBlock()};$('copy').onclick=async()=>{if(frames.length)await navigator.clipboard.writeText($('broadcast').textContent)};
$('copySpoken').onclick=async()=>{if(frames.length)await navigator.clipboard.writeText($('broadcastSpoken').textContent)};
decodeCount();init();

