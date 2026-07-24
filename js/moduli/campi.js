// === CAMPI ===

// ============================================================
// Campi
// ============================================================

let editCampoId=null;

function openNewCampo(){
  if(!DB.sport.length){showToast('Configura prima gli sport');return;}
  editCampoId=null;
  document.getElementById('mCampoTitle').textContent='&#127967; Nuovo campo';
  document.getElementById('c-del-btn').style.display='none';
  document.getElementById('c-nome').value=''; document.getElementById('c-tipo').value='Indoor'; document.getElementById('c-misto-sec').style.display='none';
  ['c-coper-s','c-coper-e','c-note'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('c-t1p').value=''; document.getElementById('c-t1s').value='08:00'; document.getElementById('c-t1e').value='18:00';
  document.getElementById('c-t2p').value=''; document.getElementById('c-t2s').value='18:00'; document.getElementById('c-t2e').value='23:00';
  document.getElementById('c-sport').innerHTML=DB.sport.map(s=>`<option>${s}</option>`).join('');
  openModal('modalCampo');
}

function editCampo(id){
  const c=DB.campi.find(x=>x.id===id); if(!c) return;
  editCampoId=id;
  document.getElementById('mCampoTitle').textContent='&#9999; '+c.nome;
  document.getElementById('c-del-btn').style.display='';
  document.getElementById('c-nome').value=c.nome;
  document.getElementById('c-sport').innerHTML=DB.sport.map(s=>`<option ${s===c.sport?'selected':''}>${s}</option>`).join('');
  document.getElementById('c-tipo').value=c.tipo; toggleCampoMisto();
  document.getElementById('c-coper-s').value=c.coper_s||''; document.getElementById('c-coper-e').value=c.coper_e||'';
  document.getElementById('c-t1p').value=c.t1p||''; document.getElementById('c-t1s').value=c.t1s||'08:00'; document.getElementById('c-t1e').value=c.t1e||'18:00';
  document.getElementById('c-t2p').value=c.t2p||''; document.getElementById('c-t2s').value=c.t2s||'18:00'; document.getElementById('c-t2e').value=c.t2e||'23:00';
  document.getElementById('c-note').value=c.note||'';
  openModal('modalCampo');
}

function toggleCampoMisto(){
  document.getElementById('c-misto-sec').style.display=document.getElementById('c-tipo').value==='Misto'?'block':'none';
}

function saveCampo(){
  const nome=document.getElementById('c-nome').value.trim();
  if(!nome){showToast('Inserisci il nome');return;}
  const c={nome,sport:document.getElementById('c-sport').value,tipo:document.getElementById('c-tipo').value,coper_s:document.getElementById('c-coper-s').value,coper_e:document.getElementById('c-coper-e').value,t1p:parseFloat(document.getElementById('c-t1p').value)||0,t1s:document.getElementById('c-t1s').value,t1e:document.getElementById('c-t1e').value,t2p:parseFloat(document.getElementById('c-t2p').value)||0,t2s:document.getElementById('c-t2s').value,t2e:document.getElementById('c-t2e').value,note:document.getElementById('c-note').value.trim()};
  if(editCampoId){Object.assign(DB.campi.find(x=>x.id===editCampoId),c);showToast('Campo aggiornato');}
  else{DB.campi.push({id:nid(),...c});showToast('Campo aggiunto');}
  saveDB(); closeModal('modalCampo'); renderCampi(); fillSelects(); updateKpi();
}

function deleteCampoModal(){
  askConfirm('Elimina campo?','Le prenotazioni associate saranno eliminate.','Elimina',()=>{
    DB.prenotazioni=DB.prenotazioni.filter(p=>p.campo_id!==editCampoId);
    DB.campi=DB.campi.filter(c=>c.id!==editCampoId);
    closeModal('modalCampo'); renderCampi(); fillSelects(); updateKpi(); renderPlanner(); showToast('Campo eliminato');
  });
}

function renderCampi(){
  const grid=document.getElementById('campi-grid'); if(!grid) return;
  document.getElementById('campi-sum').textContent='Campi: '+DB.campi.length;
  if(!DB.campi.length){grid.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="empty-ic">&#127967;</div><div class="empty-t">Nessun campo</div><button class="btn btn-primary btn-sm" onclick="openNewCampo()">+ Aggiungi</button></div>';return;}
  const icons={Padel:'&#127934;',Tennis:'&#127936;','Beach Tennis':'&#127958;',Pickleball:'&#127955;',Calcio:'&#9917;',Fitness:'&#127947;'};
  const now=new Date();
  const nowStr=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const todayStr=now.toISOString().split('T')[0];
  grid.innerHTML=DB.campi.map(c=>{
    const occPren=DB.prenotazioni.find(p=>p.campo_id==c.id&&p.data===todayStr&&p.inizio<=nowStr&&p.fine>nowStr);
    const occ=!!occPren;
    const col=occ?'var(--red)':'var(--green)';
    const statoDot=`<div style="width:6px;height:6px;border-radius:50%;background:${col};flex-shrink:0"></div>`;
    const statoLabel=occ?`Occupato fino alle ${occPren.fine}`:'Libero';
    const prossimaP=!occ&&DB.prenotazioni.filter(p=>p.campo_id==c.id&&p.data===todayStr&&p.inizio>nowStr).sort((a,b)=>a.inizio.localeCompare(b.inizio))[0];
    return `<div class="card"><div class="card-h"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:18px">${icons[c.sport]||'&#127967;'}</span><div class="card-t">${c.nome}</div></div><div style="display:flex;gap:5px"><button class="btn btn-ghost btn-xs" onclick="editCampo(${c.id})">&#9999;</button><button class="btn btn-danger btn-xs" onclick="editCampoId=${c.id};deleteCampoModal()">&#128465;</button></div></div><div class="card-b"><div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px"><span class="tag tag-navy">${c.sport}</span><span class="tag tag-gray">${c.tipo}</span>${c.coper_s?`<span class="tag tag-gold">&#127780; ${c.coper_s}&#8211;${c.coper_e}</span>`:''}</div>${c.t1p?`<div style="font-size:11px;color:var(--text2);margin-bottom:2px">T1: <strong>&#8364;${c.t1p}/h</strong> &middot; ${c.t1s}&ndash;${c.t1e}</div>`:''} ${c.t2p?`<div style="font-size:11px;color:var(--text2);margin-bottom:6px">T2: <strong>&#8364;${c.t2p}/h</strong> &middot; ${c.t2s}&ndash;${c.t2e}</div>`:''}<div style="display:flex;align-items:center;gap:5px;font-size:10px;font-weight:500;color:${col}">${statoDot}${statoLabel}</div>${prossimaP?`<div style="font-size:9px;color:var(--text3);margin-top:3px">Prossima: ${prossimaP.inizio}&ndash;${prossimaP.fine}</div>`:''}</div></div>`;
  }).join('');
}
