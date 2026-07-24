let _abbGiocId=null,_abbPianoId=null;

// === ASD ===

// ============================================================
// Modulo ASD
// ============================================================

let _editPianoId=null;

function renderAbbonamenti(){
  const pg=document.getElementById('page-abbonamenti'); if(!pg) return;
  const piani=DB.abbonamenti_piani||[];
  const hoje=new Date().toISOString().split('T')[0];
  const in30=new Date(); in30.setDate(in30.getDate()+30); const in30s=in30.toISOString().split('T')[0];
  const attivi=DB.abbonamenti.filter(a=>a.stato==='attivo');
  const scad=DB.abbonamenti.filter(a=>a.stato==='attivo'&&a.data_fine&&a.data_fine<=in30s);
  pg.innerHTML=`
  <div class="g3 mb">
    ${piani.map(p=>{
      const cnt=attivi.filter(a=>a.piano_id===p.id).length;
      return `<div class="card"><div class="card-b">
        <div style="height:3px;background:${p.colore||'var(--navy)'};border-radius:2px;margin-bottom:12px"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <div style="font-size:14px;font-weight:700">${p.nome}</div>
          <button class="btn btn-ghost btn-xs" onclick="editPiano(${p.id})">✏</button>
        </div>
        <div style="font-size:22px;font-weight:700">€ ${p.prezzo}<span style="font-size:11px;font-weight:400;color:var(--text3)">/mese</span></div>
        <div style="font-size:10px;color:var(--text3);margin:6px 0">${cnt} soci attivi</div>
        <div style="font-size:11px;color:var(--text2)">${(p.benefici||[]).map(b=>`✓ ${b}`).join('<br>')}</div>
      </div></div>`;
    }).join('')}
  </div>
  ${scad.length?`<div style="background:rgba(247,168,0,.1);border:.5px solid rgba(247,168,0,.3);border-radius:var(--r);padding:10px 14px;margin-bottom:13px;display:flex;align-items:center;gap:10px"><span style="font-size:18px">⚠️</span><span style="font-size:12px;font-weight:500">${scad.length} abbonamenti in scadenza entro 30 giorni</span></div>`:''}
  <div class="spread">
    <div style="font-size:12px;color:var(--text2)">Abbonati: <strong>${attivi.length}</strong></div>
    <button class="btn btn-primary btn-sm" onclick="openNewAbbonamento()">+ Nuovo abbonamento</button>
  </div>
  <div class="tbl" id="abb-lista">
    <div class="tbl-row tbl-head" style="grid-template-columns:2fr 1fr 90px 90px 80px 80px">
      <div class="th">Giocatore</div><div class="th">Piano</div><div class="th">Inizio</div><div class="th">Scadenza</div><div class="th">Stato</div><div class="th">Azioni</div>
    </div>
  </div>`;
  renderAbbLista();
}

function renderAbbLista(){
  const el=document.getElementById('abb-lista'); if(!el) return;
  const head=el.querySelector('.tbl-head');
  el.innerHTML=''; el.appendChild(head);
  if(!DB.abbonamenti.length){
    const em=document.createElement('div');em.className='empty';em.innerHTML='<div class="empty-ic">🎫</div><div class="empty-t">Nessun abbonamento</div>';el.appendChild(em);return;
  }
  const oggi=new Date().toISOString().split('T')[0];
  DB.abbonamenti.forEach(a=>{
    const g=DB.giocatori.find(x=>x.id===a.giocatore_id);
    const p=DB.abbonamenti_piani.find(x=>x.id===a.piano_id);
    const scad=a.data_fine&&a.data_fine<=oggi;
    const row=document.createElement('div');row.className='tbl-row';row.style.gridTemplateColumns='2fr 1fr 90px 90px 80px 80px';
    row.innerHTML=`<div style="font-size:12px;font-weight:500">${g?g.nome+' '+g.cognome:'—'}</div>
      <div class="td">${p?p.nome:'—'}</div>
      <div class="td" style="font-family:var(--mono);font-size:11px">${a.data_inizio||'—'}</div>
      <div class="td" style="font-family:var(--mono);font-size:11px;color:${scad?'var(--red)':'inherit'}">${a.data_fine||'—'}</div>
      <div class="td"><span class="tag ${a.stato==='attivo'?'tag-green':'tag-gray'}">${a.stato}</span></div>
      <div style="display:flex;gap:4px">
        <button class="btn btn-ghost btn-xs" onclick="toggleAbb(${a.id})">${a.stato==='attivo'?'⏸':'▶'}</button>
        <button class="btn btn-danger btn-xs" onclick="delAbb(${a.id})">🗑</button>
      </div>`;
    el.appendChild(row);
  });
}

function openNewAbbonamento(){
  if(!DB.giocatori.length){showToast('Aggiungi prima un giocatore');return;}
  document.getElementById('abb-gioc').innerHTML=DB.giocatori.map(g=>`<option value="${g.id}">${g.nome} ${g.cognome}</option>`).join('');
  document.getElementById('abb-piano').innerHTML=(DB.abbonamenti_piani||[]).map(p=>`<option value="${p.id}">${p.nome} – €${p.prezzo}/mese</option>`).join('');
  document.getElementById('abb-inizio').value=new Date().toISOString().split('T')[0];
  const fine=new Date(); fine.setMonth(fine.getMonth()+1);
  document.getElementById('abb-fine').value=fine.toISOString().split('T')[0];
  openModal('modalAbbonamento');
}

function saveAbbonamento(){
  const gid=parseInt(document.getElementById('abb-gioc').value);
  const pid=parseInt(document.getElementById('abb-piano').value);
  const inizio=document.getElementById('abb-inizio').value;
  const fine=document.getElementById('abb-fine').value;
  if(!gid||!pid){showToast('Seleziona giocatore e piano');return;}
  const piano=DB.abbonamenti_piani.find(p=>p.id===pid);
  DB.abbonamenti.push({id:nid(),giocatore_id:gid,piano_id:pid,data_inizio:inizio,data_fine:fine,stato:'attivo'});
  // movimento cassa automatico
  if(piano) aggMovCassa(null,'Abbonamento '+piano.nome,piano.prezzo,'Abbonamenti','entrata');
  saveDB(); closeModal('modalAbbonamento'); renderAbbonamenti(); updateKpi(); showToast('Abbonamento creato');
}

function toggleAbb(id){
  const a=DB.abbonamenti.find(x=>x.id===id);
  if(a){a.stato=a.stato==='attivo'?'sospeso':'attivo';saveDB();renderAbbLista();}
}

function delAbb(id){
  askConfirm('Elimina abbonamento?','','Elimina',()=>{
    DB.abbonamenti=DB.abbonamenti.filter(x=>x.id!==id);saveDB();renderAbbonamenti();showToast('Eliminato');
  });
}

function editPiano(id){
  const p=DB.abbonamenti_piani.find(x=>x.id===id); if(!p) return;
  _editPianoId=id;
  document.getElementById('piano-nome').value=p.nome;
  document.getElementById('piano-prezzo').value=p.prezzo;
  document.getElementById('piano-benefici').value=(p.benefici||[]).join('\n');
  openModal('modalPiano');
}

function savePiano(){
  const nome=document.getElementById('piano-nome').value.trim(); if(!nome){showToast('Inserisci nome');return;}
  const prezzo=parseFloat(document.getElementById('piano-prezzo').value)||0;
  const benefici=document.getElementById('piano-benefici').value.split('\n').map(b=>b.trim()).filter(Boolean);
  if(_editPianoId){
    const p=DB.abbonamenti_piani.find(x=>x.id===_editPianoId);
    if(p){Object.assign(p,{nome,prezzo,benefici});}
  } else {
    DB.abbonamenti_piani.push({id:nid(),nome,prezzo,colore:'var(--navy)',benefici,attivo:true});
  }
  saveDB(); closeModal('modalPiano'); renderAbbonamenti(); showToast('Piano salvato');
}
