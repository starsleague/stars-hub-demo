// ====================================================
// EVENTI / TORNEI / CORSI
// (reintegrate da stars-hub-v8.html: nel v7 il markup esisteva
//  ma le funzioni non erano mai state definite)
// ====================================================
const EV_BG={fast:'linear-gradient(135deg,#1E314A,#2a4266)',open:'linear-gradient(135deg,#c98e00,#F7A800)',camp:'linear-gradient(135deg,#22a96e,#0d5c38)',corso:'linear-gradient(135deg,#3b82f6,#1e40af)',altro:'linear-gradient(135deg,#899CB5,#4a637d)'};
const EV_LBL={fast:'&#9889; Torneo Fast',open:'&#127942; Torneo Open',camp:'&#128203; Campionato',corso:'&#128218; Corso',altro:'&#128197; Evento'};
let editEvId=null;

function openNewEvent(tipo='fast'){
  editEvId=null;
  document.getElementById('mEvTitle').textContent='&#10133; Nuovo evento';
  document.getElementById('ev-del-btn').style.display='none';
  ['ev-nome','ev-start','ev-end','ev-maxp','ev-quota','ev-note'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('ev-tipo').value=tipo;
  openModal('modalEvent');
}

function editEvent(id){
  const ev=DB.eventi.find(e=>e.id===id); if(!ev) return;
  editEvId=id;
  document.getElementById('mEvTitle').textContent='&#9999; Modifica evento';
  document.getElementById('ev-del-btn').style.display='';
  document.getElementById('ev-nome').value=ev.nome; document.getElementById('ev-tipo').value=ev.tipo;
  document.getElementById('ev-sport').value=ev.sport||''; document.getElementById('ev-start').value=ev.data_start||'';
  document.getElementById('ev-end').value=ev.data_end||''; document.getElementById('ev-maxp').value=ev.maxp||'';
  document.getElementById('ev-quota').value=ev.quota||''; document.getElementById('ev-note').value=ev.note||'';
  const sel=document.getElementById('ev-campo');
  for(let o of sel.options){if(parseInt(o.value)===ev.campo_id){o.selected=true;break;}}
  openModal('modalEvent');
}

function saveEvent(){
  const nome=document.getElementById('ev-nome').value.trim();
  if(!nome){showToast('Inserisci il nome');return;}
  const ev={nome,tipo:document.getElementById('ev-tipo').value,sport:document.getElementById('ev-sport').value,data_start:document.getElementById('ev-start').value,data_end:document.getElementById('ev-end').value,campo_id:parseInt(document.getElementById('ev-campo').value)||null,maxp:parseInt(document.getElementById('ev-maxp').value)||null,quota:parseFloat(document.getElementById('ev-quota').value)||0,note:document.getElementById('ev-note').value.trim(),iscritti:0};
  if(editEvId){Object.assign(DB.eventi.find(e=>e.id===editEvId),ev);showToast('Evento aggiornato');}
  else{DB.eventi.push({id:nid(),...ev});showToast('Evento creato');}
  saveDB(); closeModal('modalEvent'); renderEventi(); renderCorsi();
}

function deleteEvModal(){
  askConfirm('Elimina evento?','Non recuperabile.','Elimina',()=>{
    DB.eventi=DB.eventi.filter(e=>e.id!==editEvId);
    saveDB(); closeModal('modalEvent'); renderEventi(); renderCorsi(); showToast('Evento eliminato');
  });
}

function renderEventi(){
  const grid=document.getElementById('ev-grid'); if(!grid) return;
  const tab=document.querySelector('[data-ev-tab][class*="btn-navy"]')?.dataset.evTab||'tutti';
  const list=DB.eventi.filter(e=>tab==='tutti'||e.tipo===tab);
  if(!list.length){grid.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="empty-ic">&#127942;</div><div class="empty-t">Nessun evento</div><button class="btn btn-primary btn-sm" onclick="openNewEvent()">+ Nuovo evento</button></div>';return;}
  grid.innerHTML=list.map(ev=>{
    const stato=ev.data_end&&ev.data_end<new Date().toISOString().split('T')[0]?'tag-gray':ev.data_start&&ev.data_start<=new Date().toISOString().split('T')[0]?'tag-green':'tag-blue';
    const statoLabel=ev.data_end&&ev.data_end<new Date().toISOString().split('T')[0]?'Concluso':ev.data_start&&ev.data_start<=new Date().toISOString().split('T')[0]?'In corso':'In programma';
    const iscrN=Array.isArray(ev.iscritti)?ev.iscritti.length:(ev.iscritti||0);
    return `<div class="ev-card"><div class="ev-banner" style="background:${EV_BG[ev.tipo]||EV_BG.altro}"><div style="display:flex;justify-content:space-between;align-items:flex-end;width:100%"><div class="ev-type-tag">${EV_LBL[ev.tipo]||ev.tipo}</div><span class="tag ${stato}" style="font-size:8px">${statoLabel}</span></div></div><div class="ev-body"><div class="ev-name">${ev.nome}</div><div class="ev-tags">${ev.data_start?`<span class="tag tag-navy">&#128197; ${ev.data_start}</span>`:''} ${ev.maxp?`<span class="tag tag-gray">&#128101; ${iscrN}/${ev.maxp}</span>`:''} ${ev.sport?`<span class="tag tag-gold">${ev.sport}</span>`:''} ${ev.quota?`<span class="tag tag-green">&#8364; ${ev.quota}</span>`:''}</div><div class="ev-actions"><button class="btn btn-ghost btn-sm" onclick="openIscritti(${ev.id})">&#128101; Iscrizioni</button><button class="btn btn-ghost btn-sm" onclick="editEvent(${ev.id})">&#9999;</button><button class="btn btn-danger btn-xs" onclick="editEvId=${ev.id};deleteEvModal()">&#128465;</button></div></div></div>`;
  }).join('');
}

function renderCorsi(){
  const grid=document.getElementById('corsi-grid'); if(!grid) return;
  const list=DB.eventi.filter(e=>e.tipo==='corso');
  document.getElementById('corsi-sum').textContent='Corsi attivi: '+list.length;
  if(!list.length){grid.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="empty-ic">&#128218;</div><div class="empty-t">Nessun corso</div><button class="btn btn-primary btn-sm" onclick="openNewEvent(\'corso\')">+ Nuovo corso</button></div>';return;}
  grid.innerHTML=list.map(ev=>{
    const iscrN=Array.isArray(ev.iscritti)?ev.iscritti.length:(ev.iscritti||0);
    return `<div class="ev-card"><div class="ev-banner" style="background:${EV_BG.corso}"><div class="ev-type-tag">&#128218; Corso</div></div><div class="ev-body"><div class="ev-name">${ev.nome}</div><div class="ev-tags">${ev.data_start?`<span class="tag tag-navy">&#128197; ${ev.data_start}</span>`:''} ${ev.maxp?`<span class="tag tag-gray">&#128101; ${iscrN}/${ev.maxp}</span>`:''} ${ev.sport?`<span class="tag tag-blue">${ev.sport}</span>`:''}</div><div class="ev-actions"><button class="btn btn-ghost btn-sm" onclick="openIscritti(${ev.id})">&#128101; Iscritti</button><button class="btn btn-ghost btn-sm" onclick="editEvent(${ev.id})">&#9999;</button><button class="btn btn-danger btn-xs" onclick="editEvId=${ev.id};deleteEvModal()">&#128465;</button></div></div></div>`;
  }).join('');
}

function filterEv(tab,btn){
  document.querySelectorAll('[data-ev-tab]').forEach(b=>{b.className='btn btn-ghost btn-sm';});
  btn.className='btn btn-navy btn-sm'; renderEventi();
}
