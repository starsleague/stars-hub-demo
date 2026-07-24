// ====================================================
// GIOCATORI
// ====================================================


// === GIOCATORI ===

// ============================================================
// Giocatori
// ============================================================

let editGiocId=null;

function openNewGiocatore(){
  if(!DB.sport.length){showToast('Configura prima gli sport');return;}
  editGiocId=null;
  document.getElementById('mGiocTitle').textContent='&#128100; Nuovo giocatore';
  document.getElementById('g-del-btn').style.display='none';
  ['g-nome','g-cognome','g-email','g-tel','g-livello','g-nascita','g-cf','g-tessera','g-cert','g-note'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('g-sport').innerHTML=DB.sport.map(s=>`<option>${s}</option>`).join('');
  openModal('modalGioc');
}

function editGiocatore(id){
  const g=DB.giocatori.find(x=>x.id===id); if(!g) return;
  editGiocId=id;
  document.getElementById('mGiocTitle').textContent='&#9999; '+g.nome+' '+g.cognome;
  document.getElementById('g-del-btn').style.display='';
  const f=(eid,v)=>{const el=document.getElementById(eid);if(el)el.value=v||'';};
  f('g-nome',g.nome);f('g-cognome',g.cognome);f('g-email',g.email);f('g-tel',g.tel);f('g-livello',g.livello);f('g-nascita',g.nascita);f('g-cf',g.cf);f('g-tessera',g.tessera);f('g-cert',g.cert);f('g-note',g.note);
  document.getElementById('g-sport').innerHTML=DB.sport.map(s=>`<option ${s===g.sport?'selected':''}>${s}</option>`).join('');
  openModal('modalGioc');
}

function saveGiocatore(){
  const nome=document.getElementById('g-nome').value.trim(); if(!nome){showToast('Inserisci il nome');return;}
  const g={nome,cognome:document.getElementById('g-cognome').value.trim(),email:document.getElementById('g-email').value.trim(),tel:document.getElementById('g-tel').value.trim(),sport:document.getElementById('g-sport').value,livello:document.getElementById('g-livello').value.trim(),nascita:document.getElementById('g-nascita').value,cf:document.getElementById('g-cf').value.trim().toUpperCase(),tessera:document.getElementById('g-tessera').value,cert:document.getElementById('g-cert').value,note:document.getElementById('g-note').value.trim()};
  if(editGiocId){Object.assign(DB.giocatori.find(x=>x.id===editGiocId),g);showToast('Giocatore aggiornato');}
  else{DB.giocatori.push({id:nid(),...g});showToast('Giocatore aggiunto');}
  saveDB(); closeModal('modalGioc'); renderGiocatori(); updateKpi(); renderAsdSoci();
}

function deleteGiocModal(){
  askConfirm('Elimina giocatore?','','Elimina',()=>{
    DB.giocatori=DB.giocatori.filter(g=>g.id!==editGiocId);
    saveDB(); closeModal('modalGioc'); renderGiocatori(); updateKpi(); renderAsdSoci();
    document.getElementById('gioc-detail').innerHTML='<div class="empty" style="padding:30px"><div class="empty-ic" style="font-size:28px">&#128100;</div><div style="font-size:11px;color:var(--text3)">Seleziona un giocatore</div></div>';
    showToast('Giocatore eliminato');
  });
}

function renderGiocatori(){
  const tbl=document.getElementById('gioc-table'); if(!tbl) return;
  const search=(document.getElementById('gioc-search')?.value||'').toLowerCase();
  const fsport=document.getElementById('gioc-fsport')?.value||'';
  let list=DB.giocatori.filter(g=>(g.nome+' '+g.cognome+(g.email||'')).toLowerCase().includes(search)&&(!fsport||g.sport===fsport));
  // keep header
  const head=tbl.querySelector('.tbl-head');
  tbl.innerHTML=''; tbl.appendChild(head);
  if(!list.length){
    const em=document.createElement('div');em.className='empty';em.innerHTML='<div class="empty-ic">&#128101;</div><div class="empty-t">Nessun giocatore'+(search?' trovato':'')+' </div>'+(!search?'<button class="btn btn-primary btn-sm" onclick="openNewGiocatore()">+ Aggiungi</button>':'');
    tbl.appendChild(em); return;
  }
  list.forEach(g=>{
    const tok=g.tessera&&new Date(g.tessera)>new Date();
    const ini=(g.nome[0]||'')+(g.cognome[0]||'');
    const row=document.createElement('div');row.className='tbl-row';row.style.gridTemplateColumns='2fr 90px 90px 80px 90px';
    row.innerHTML=`<div style="display:flex;align-items:center;gap:9px"><div class="p-av">${ini}</div><div><div class="p-name">${g.nome} ${g.cognome}</div><div class="p-meta">${g.email||'—'}</div></div></div><div class="td">${g.sport||'—'}</div><div class="td">${g.livello?`<span class="lv-badge">${g.livello}</span>`:'—'}</div><div class="td"><span class="tag ${tok?'tag-green':'tag-red'}">${tok?'&#10003; Attivo':'&#9888; Scaduto'}</span></div><div style="display:flex;gap:4px"><button class="btn btn-ghost btn-xs" onclick="editGiocatore(${g.id});event.stopPropagation()">&#9999;</button><button class="btn btn-danger btn-xs" onclick="editGiocId=${g.id};deleteGiocModal();event.stopPropagation()">&#128465;</button></div>`;
    row.addEventListener('click',()=>showGiocDetail(g.id));
    tbl.appendChild(row);
  });
  // update sport filter options
  const fs=document.getElementById('gioc-fsport');
  if(fs&&!fs.innerHTML.includes('option value')){fs.innerHTML='<option value="">Tutti gli sport</option>'+DB.sport.map(s=>`<option>${s}</option>`).join('');}
}

function showGiocDetail(id){
  const g=DB.giocatori.find(x=>x.id===id); if(!g) return;
  const ini=(g.nome[0]||'')+(g.cognome[0]||'');
  const oggi=new Date().toISOString().split('T')[0];
  const in30=new Date(); in30.setDate(in30.getDate()+30); const in30s=in30.toISOString().split('T')[0];
  const tok=g.tessera&&g.tessera>oggi;
  const cok=g.cert&&g.cert>oggi;
  const tscad=g.tessera&&g.tessera<=in30s&&tok;
  const cscad=g.cert&&g.cert<=in30s&&cok;
  // Storico prenotazioni del giocatore
  const nome_completo=(g.nome+' '+g.cognome).toLowerCase();
  const pren=DB.prenotazioni.filter(p=>[p.g1,p.g2,p.g3,p.g4].some(x=>x&&x.toLowerCase().includes(g.nome.toLowerCase()))).sort((a,b)=>b.data.localeCompare(a.data)).slice(0,5);
  const TCOLORS={rank:'var(--gold)',amich:'var(--navy)',corso:'var(--green)',torneo:'var(--red)',prenotato:'var(--blue)'};
  const storicoHtml=pren.length?pren.map(p=>{
    const c=cById(p.campo_id);
    const col=TCOLORS[p.tipo]||'var(--slate)';
    const pagCol={da_pagare:'var(--red)',acconto:'var(--gold)',saldato:'var(--green)'}[p.pagato||'da_pagare'];
    return `<div style="display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:.5px solid var(--bdr2);cursor:pointer" onclick="editPren(${p.id})">
      <div style="width:3px;height:28px;border-radius:2px;background:${col};flex-shrink:0"></div>
      <div style="flex:1"><div style="font-size:11px;font-weight:500">${c?.nome||'—'}</div><div style="font-size:9px;color:var(--text3);font-family:var(--mono)">${p.data} ${p.inizio}–${p.fine}</div></div>
      ${p.prezzo?`<div style="font-size:10px;font-weight:600;color:${pagCol}">€${(+p.prezzo).toFixed(0)}</div>`:''}
    </div>`;
  }).join(''):'<div style="font-size:11px;color:var(--text3);padding:6px 0">Nessuna prenotazione trovata</div>';
  const alerts=[];
  if(!tok&&g.tessera) alerts.push(`<div style="background:rgba(224,90,43,.08);border:.5px solid rgba(224,90,43,.25);border-radius:6px;padding:6px 9px;font-size:10px;margin-bottom:5px">⚠️ Tessera scaduta il ${g.tessera}</div>`);
  else if(tscad) alerts.push(`<div style="background:rgba(247,168,0,.1);border:.5px solid rgba(247,168,0,.3);border-radius:6px;padding:6px 9px;font-size:10px;margin-bottom:5px">⏰ Tessera in scadenza il ${g.tessera}</div>`);
  if(!cok&&g.cert) alerts.push(`<div style="background:rgba(224,90,43,.08);border:.5px solid rgba(224,90,43,.25);border-radius:6px;padding:6px 9px;font-size:10px;margin-bottom:5px">⚠️ Cert. medico scaduto il ${g.cert}</div>`);
  else if(cscad) alerts.push(`<div style="background:rgba(247,168,0,.1);border:.5px solid rgba(247,168,0,.3);border-radius:6px;padding:6px 9px;font-size:10px;margin-bottom:5px">⏰ Cert. medico in scadenza il ${g.cert}</div>`);
  document.getElementById('gioc-detail').innerHTML=`
    <div class="pd-av">${ini}</div>
    <div style="font-size:15px;font-weight:700">${g.nome} ${g.cognome}</div>
    <div style="font-size:11px;color:var(--text3);margin-bottom:8px">${g.email||'—'}</div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">
      ${g.sport?`<span class="tag tag-navy">${g.sport}</span>`:''}
      ${g.livello?`<span class="lv-badge">${g.livello}</span>`:''}
      <span class="tag ${tok?'tag-green':'tag-red'}">${tok?'✓ Attivo':'⚠ Scaduto'}</span>
    </div>
    ${alerts.join('')}
    <div class="pd-sec">
      <div class="pd-sec-t">Dati anagrafici</div>
      <div class="pd-row"><div class="pd-k">Tel.</div><div class="pd-v">${g.tel||'—'}</div></div>
      <div class="pd-row"><div class="pd-k">Nascita</div><div class="pd-v">${g.nascita||'—'}</div></div>
      <div class="pd-row"><div class="pd-k">Cod. Fiscale</div><div class="pd-v" style="font-family:var(--mono);font-size:10px">${g.cf||'—'}</div></div>
      <div class="pd-row"><div class="pd-k">Tessera scad.</div><div class="pd-v" style="color:${tok?'inherit':'var(--red)'}">${g.tessera||'—'}</div></div>
      <div class="pd-row"><div class="pd-k">Cert. med. scad.</div><div class="pd-v" style="color:${cok?'inherit':'var(--red)'}">${g.cert||'—'}</div></div>
    </div>
    ${g.note?`<div class="pd-sec"><div class="pd-sec-t">Note</div><div style="font-size:11px;color:var(--text2)">${g.note}</div></div>`:''}
    <div class="pd-sec">
      <div class="pd-sec-t">Ultime prenotazioni (${pren.length})</div>
      ${storicoHtml}
    </div>
    <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
      <button class="btn btn-primary btn-sm" onclick="editGiocatore(${g.id})">✏ Modifica</button>
      <button class="btn btn-danger btn-xs" onclick="editGiocId=${g.id};deleteGiocModal()">🗑</button>
    </div>`;
}

function exportGioc(){
  if(!DB.giocatori.length){showToast('Nessun giocatore');return;}
  const esc=v=>'"'+String(v||'').replace(/"/g,'""')+'"';
  const csv='Nome,Cognome,Email,Tel,Sport,Livello,CF,Nascita,Tessera Scad.,Cert. Scad.,Note\n'+
    DB.giocatori.map(g=>[esc(g.nome),esc(g.cognome),esc(g.email),esc(g.tel),esc(g.sport),esc(g.livello),esc(g.cf),esc(g.nascita),esc(g.tessera),esc(g.cert),esc(g.note)].join(',')).join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);a.download='giocatori.csv';a.click();showToast('CSV esportato');
}
