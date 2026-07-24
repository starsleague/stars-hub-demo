let _asdMovTipo='entrata';

function renderAsdSoci(){
  const pg=document.getElementById('page-asd-soci'); if(!pg) return;
  const today=new Date().toISOString().split('T')[0];
  const in30=new Date(); in30.setDate(in30.getDate()+30); const in30s=in30.toISOString().split('T')[0];
  const alerts=DB.giocatori.filter(g=>(g.tessera&&g.tessera<=in30s)||(g.cert&&g.cert<=in30s));
  pg.innerHTML=`
  <div class="spread">
    <div class="gap">
      <input class="f-input" id="asd-search" placeholder="🔍 Cerca socio..." style="width:200px;height:30px;font-size:12px;padding:4px 11px" oninput="renderAsdSociLista()">
    </div>
    <div class="gap">
      <button class="btn btn-ghost btn-sm" onclick="exportAsdSoci()">📄 CSV</button>
      <button class="btn btn-primary btn-sm" onclick="openNewGiocatore()">+ Nuovo socio</button>
    </div>
  </div>
  ${alerts.length?`<div style="background:rgba(224,90,43,.08);border:.5px solid rgba(224,90,43,.25);border-radius:var(--r);padding:9px 14px;margin-bottom:11px;font-size:11px">⚠️ <strong>${alerts.length}</strong> tessere o certificati in scadenza entro 30 giorni: ${alerts.map(g=>g.nome+' '+g.cognome).join(', ')}</div>`:''}
  <div class="tbl" id="asd-soci-tbl">
    <div class="tbl-row tbl-head" style="grid-template-columns:2fr 90px 100px 100px 80px 80px">
      <div class="th">Socio</div><div class="th">Sport</div><div class="th">Tessera scad.</div><div class="th">Cert. med. scad.</div><div class="th">Livello</div><div class="th">Azioni</div>
    </div>
  </div>`;
  renderAsdSociLista();
}

function renderAsdSociLista(){
  const el=document.getElementById('asd-soci-tbl'); if(!el) return;
  const head=el.querySelector('.tbl-head');
  el.innerHTML=''; el.appendChild(head);
  const q=(document.getElementById('asd-search')?.value||'').toLowerCase();
  const oggi=new Date().toISOString().split('T')[0];
  const in30=new Date(); in30.setDate(in30.getDate()+30); const in30s=in30.toISOString().split('T')[0];
  let list=DB.giocatori.filter(g=>(g.nome+' '+g.cognome).toLowerCase().includes(q));
  if(!list.length){const em=document.createElement('div');em.className='empty';em.innerHTML='<div class="empty-ic">📖</div><div class="empty-t">Nessun socio</div>';el.appendChild(em);return;}
  list.forEach((g,i)=>{
    const tok=g.tessera&&g.tessera>oggi;
    const cok=g.cert&&g.cert>oggi;
    const tscad=g.tessera&&g.tessera<=in30s&&tok;
    const cscad=g.cert&&g.cert<=in30s&&cok;
    const row=document.createElement('div');row.className='tbl-row';row.style.gridTemplateColumns='2fr 90px 100px 100px 80px 80px';
    const ini=(g.nome[0]||'')+(g.cognome[0]||'');
    row.innerHTML=`<div style="display:flex;align-items:center;gap:8px"><div class="p-av">${ini}</div><div><div class="p-name">${g.nome} ${g.cognome}</div><div class="p-meta">${g.email||'—'}</div></div></div>
      <div class="td">${g.sport||'—'}</div>
      <div class="td" style="font-family:var(--mono);font-size:11px;color:${!tok?'var(--red)':tscad?'var(--gold)':'inherit'}">${g.tessera||'—'}${!tok?' ⚠':tscad?' ⏰':''}</div>
      <div class="td" style="font-family:var(--mono);font-size:11px;color:${!cok?'var(--red)':cscad?'var(--gold)':'inherit'}">${g.cert||'—'}${!cok?' ⚠':cscad?' ⏰':''}</div>
      <div class="td">${g.livello?`<span class="lv-badge">${g.livello}</span>`:'—'}</div>
      <div><button class="btn btn-ghost btn-xs" onclick="editGiocatore(${g.id})">✏</button></div>`;
    el.appendChild(row);
  });
}

function exportAsdSoci(){
  const esc=v=>'"'+String(v||'').replace(/"/g,'""')+'"';
  const csv='Nome,Cognome,Email,Tel,Sport,Livello,CF,Nascita,Tessera,Cert.Medico\n'+DB.giocatori.map(g=>[esc(g.nome),esc(g.cognome),esc(g.email),esc(g.tel),esc(g.sport),esc(g.livello),esc(g.cf),esc(g.nascita),esc(g.tessera),esc(g.cert)].join(',')).join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);a.download='libro-soci.csv';a.click();showToast('CSV esportato');
}

function renderAsdBilancio(){
  const pg=document.getElementById('page-asd-bilancio'); if(!pg) return;
  const entrate=DB.asd_bilancio.filter(m=>m.tipo==='entrata').reduce((s,m)=>s+m.importo,0);
  const uscite=DB.asd_bilancio.filter(m=>m.tipo==='uscita').reduce((s,m)=>s+m.importo,0);
  const saldo=entrate-uscite;
  const fmt=v=>'€ '+v.toFixed(2).replace('.',',');
  pg.innerHTML=`
  <div class="g3 mb">
    <div class="kpi"><div class="kpi-l">Entrate totali</div><div class="kpi-v" style="color:var(--green)">${fmt(entrate)}</div></div>
    <div class="kpi"><div class="kpi-l">Uscite totali</div><div class="kpi-v" style="color:var(--red)">${fmt(uscite)}</div></div>
    <div class="kpi accent"><div class="kpi-l">Saldo ASD</div><div class="kpi-v" style="color:${saldo>=0?'var(--green)':'var(--red)'}">${fmt(saldo)}</div></div>
  </div>
  <div class="spread">
    <div style="font-size:12px;color:var(--text2)">Prima nota ASD (${DB.asd_bilancio.length} movimenti)</div>
    <div class="gap">
      <button class="btn btn-ghost btn-sm" onclick="exportAsdBil()">↓ CSV</button>
      <button class="btn btn-danger btn-sm" onclick="openAsdMov('uscita')">− Uscita</button>
      <button class="btn btn-primary btn-sm" onclick="openAsdMov('entrata')">+ Entrata</button>
    </div>
  </div>
  <div class="tbl" id="asd-bil-lista">
    <div class="tbl-row tbl-head" style="grid-template-columns:80px 1fr 140px 80px 80px">
      <div class="th">Data</div><div class="th">Descrizione</div><div class="th">Categoria</div><div class="th">Tipo</div><div class="th" style="text-align:right">Importo</div>
    </div>
  </div>`;
  const lista=document.getElementById('asd-bil-lista');
  const head=lista.querySelector('.tbl-head');
  lista.innerHTML=''; lista.appendChild(head);
  if(!DB.asd_bilancio.length){const em=document.createElement('div');em.className='empty';em.innerHTML='<div class="empty-ic">📊</div><div class="empty-t">Prima nota vuota</div>';lista.appendChild(em);return;}
  [...DB.asd_bilancio].reverse().forEach(m=>{
    const row=document.createElement('div');row.className='tbl-row';row.style.gridTemplateColumns='80px 1fr 140px 80px 80px';
    const col=m.tipo==='entrata'?'var(--green)':'var(--red)';
    row.innerHTML=`<div class="td" style="font-family:var(--mono);font-size:11px">${m.data}</div>
      <div style="font-size:12px">${m.descrizione||'—'}</div>
      <div class="td"><span class="tag tag-gray">${m.categoria||'—'}</span></div>
      <div class="td"><span class="tag ${m.tipo==='entrata'?'tag-green':'tag-red'}">${m.tipo}</span></div>
      <div style="font-size:13px;font-weight:700;color:${col};text-align:right">${m.tipo==='entrata'?'+':'−'}€${(+m.importo).toFixed(2).replace('.',',')}</div>`;
    lista.appendChild(row);
  });
}

function openAsdMov(tipo){
  _asdMovTipo=tipo;
  document.getElementById('asd-mov-lbl').textContent=tipo==='entrata'?'+ Entrata ASD':'− Uscita ASD';
  ['asd-mov-importo','asd-mov-desc'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('asd-mov-data').value=new Date().toISOString().split('T')[0];
  openModal('modalAsdMov');
}

function saveAsdMov(){
  const importo=parseFloat(document.getElementById('asd-mov-importo').value);
  if(!importo||importo<=0){showToast('Inserisci importo valido');return;}
  DB.asd_bilancio.push({
    id:nid(),data:document.getElementById('asd-mov-data').value,tipo:_asdMovTipo,
    importo:+importo.toFixed(2),
    categoria:document.getElementById('asd-mov-cat').value||'Altro',
    descrizione:document.getElementById('asd-mov-desc').value.trim()
  });
  saveDB(); closeModal('modalAsdMov'); renderAsdBilancio(); showToast('Movimento registrato');
}

function exportAsdBil(){
  if(!DB.asd_bilancio.length){showToast('Nessun movimento');return;}
  const esc=v=>'"'+String(v||'').replace(/"/g,'""')+'"';
  const csv='Data,Descrizione,Categoria,Tipo,Importo\n'+DB.asd_bilancio.map(m=>[esc(m.data),esc(m.descrizione),esc(m.categoria),esc(m.tipo),m.importo].join(',')).join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);a.download='bilancio-asd.csv';a.click();showToast('CSV esportato');
}

function renderAsdDocs(){
  const pg=document.getElementById('page-asd-docs'); if(!pg) return;
  const oggi=new Date().toISOString().split('T')[0];
  const in30=new Date(); in30.setDate(in30.getDate()+30); const in30s=in30.toISOString().split('T')[0];
  pg.innerHTML=`
  <div class="spread">
    <div style="font-size:12px;color:var(--text2)">Scadenzario (${DB.asd_scadenze.length})</div>
    <button class="btn btn-primary btn-sm" onclick="openAsdScad()">+ Scadenza</button>
  </div>
  <div id="asd-scad-lista"></div>`;
  renderAsdScadLista();
}

function renderAsdScadLista(){
  const el=document.getElementById('asd-scad-lista'); if(!el) return;
  if(!DB.asd_scadenze.length){el.innerHTML='<div class="empty"><div class="empty-ic">📁</div><div class="empty-t">Nessuna scadenza</div></div>';return;}
  const oggi=new Date().toISOString().split('T')[0];
  const in30=new Date(); in30.setDate(in30.getDate()+30); const in30s=in30.toISOString().split('T')[0];
  const sorted=[...DB.asd_scadenze].sort((a,b)=>a.data_scadenza.localeCompare(b.data_scadenza));
  el.innerHTML=sorted.map(s=>{
    const past=s.data_scadenza<oggi&&s.stato!=='completato';
    const soon=s.data_scadenza>=oggi&&s.data_scadenza<=in30s&&s.stato!=='completato';
    let tag='tag-gray', ic='📋';
    if(s.stato==='completato'){tag='tag-green';ic='✅';}
    else if(past){tag='tag-red';ic='⚠️';}
    else if(soon){tag='tag-gold';ic='⏰';}
    return `<div style="background:var(--surf);border:.5px solid var(--bdr);border-radius:var(--r);padding:12px 14px;margin-bottom:7px;display:flex;align-items:center;gap:12px">
      <div style="font-size:20px;flex-shrink:0">${ic}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600;margin-bottom:2px">${s.titolo}</div>
        <div style="font-size:11px;color:var(--text3)">${s.tipo||''} ${s.descrizione?'— '+s.descrizione:''}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-family:var(--mono);font-size:12px;font-weight:600;margin-bottom:4px">${s.data_scadenza}</div>
        <span class="tag ${tag}">${s.stato}</span>


// === TURNI ===

// ============================================================
// Turni settimanali
// ============================================================

</div>
      <div style="display:flex;gap:4px;margin-left:8px">
        ${s.stato!=='completato'?`<button class="btn btn-ghost btn-xs" onclick="toggleScad(${s.id})">✓</button>`:''}
        <button class="btn btn-danger btn-xs" onclick="delScad(${s.id})">🗑</button>
      </div>
    </div>`;
  }).join('');
}

function openAsdScad(){
  ['scad-titolo','scad-desc'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('scad-data').value='';
  openModal('modalScadenza');
}

function saveScad(){
  const titolo=document.getElementById('scad-titolo').value.trim(); if(!titolo){showToast('Inserisci titolo');return;}
  const data=document.getElementById('scad-data').value; if(!data){showToast('Inserisci data scadenza');return;}
  DB.asd_scadenze.push({id:nid(),titolo,data_scadenza:data,tipo:document.getElementById('scad-tipo').value,descrizione:document.getElementById('scad-desc').value.trim(),stato:'da_fare'});
  saveDB(); closeModal('modalScadenza'); renderAsdDocs(); showToast('Scadenza aggiunta');
}

function toggleScad(id){const s=DB.asd_scadenze.find(x=>x.id===id);if(s){s.stato=s.stato==='completato'?'da_fare':'completato';saveDB();renderAsdScadLista();}}

function delScad(id){DB.asd_scadenze=DB.asd_scadenze.filter(x=>x.id!==id);saveDB();renderAsdScadLista();showToast('Eliminata');}
