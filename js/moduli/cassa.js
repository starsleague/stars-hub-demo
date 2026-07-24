let _movTipo='entrata';

function aggMovCassa(ref,desc,importo,categoria,tipo){
  DB.cassa.push({
    id:nid(),
    data:new Date().toISOString().split('T')[0],
    tipo,importo:+importo,categoria,
    descrizione:desc,
    metodo:'contanti',
    ref_id:ref?.id||null,
    ref_tipo:ref?'prenotazione':null
  });
  saveDB();
}

function renderCassa(){
  const pg=document.getElementById('page-cassa'); if(!pg) return;
  const today=new Date().toISOString().split('T')[0];
  const now=new Date();
  // settimana: lun scorso
  const mon=new Date(now); mon.setDate(now.getDate()-((now.getDay()+6)%7)); mon.setHours(0,0,0,0);
  const monStr=mon.toISOString().split('T')[0];
  const mStart=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
  const entrate=DB.cassa.filter(m=>m.tipo==='entrata');
  const uscite=DB.cassa.filter(m=>m.tipo==='uscita');
  const incOggi=entrate.filter(m=>m.data===today).reduce((s,m)=>s+m.importo,0);
  const incSett=entrate.filter(m=>m.data>=monStr).reduce((s,m)=>s+m.importo,0)-uscite.filter(m=>m.data>=monStr).reduce((s,m)=>s+m.importo,0);
  const incMese=entrate.filter(m=>m.data>=mStart).reduce((s,m)=>s+m.importo,0)-uscite.filter(m=>m.data>=mStart).reduce((s,m)=>s+m.importo,0);
  const saldo=entrate.reduce((s,m)=>s+m.importo,0)-uscite.reduce((s,m)=>s+m.importo,0);
  const fmt=v=>'€ '+v.toFixed(2).replace('.',',');
  pg.innerHTML=`
  <div class="g4 mb">
    <div class="kpi accent"><div class="kpi-l">Incasso oggi</div><div class="kpi-v">${fmt(incOggi)}</div><div class="kpi-s">${DB.cassa.filter(m=>m.data===today).length} movimenti</div></div>
    <div class="kpi"><div class="kpi-l">Settimana</div><div class="kpi-v" style="color:${incSett>=0?'var(--green)':'var(--red)'}">${fmt(incSett)}</div></div>
    <div class="kpi"><div class="kpi-l">Mese</div><div class="kpi-v" style="color:${incMese>=0?'var(--green)':'var(--red)'}">${fmt(incMese)}</div></div>
    <div class="kpi"><div class="kpi-l">Saldo cassa</div><div class="kpi-v" style="color:${saldo>=0?'var(--green)':'var(--red)'}">${fmt(saldo)}</div></div>
  </div>
  <div class="spread">
    <div class="gap">
      <div style="font-size:12px;color:var(--text2);font-weight:500">Prima nota (${DB.cassa.length} movimenti)</div>
      <select class="f-input f-select" id="cassa-fcat" style="width:140px;height:30px;padding:3px 8px;font-size:12px" onchange="renderCassaLista()">
        <option value="">Tutte le categorie</option>
        ${['Prenotazioni','Corsi','Abbonamenti','Tornei','Shop','Spese','Altro'].map(c=>`<option>${c}</option>`).join('')}
      </select>
      <select class="f-input f-select" id="cassa-ftipo" style="width:110px;height:30px;padding:3px 8px;font-size:12px" onchange="renderCassaLista()">
        <option value="">Tutto</option><option value="entrata">Entrate</option><option value="uscita">Uscite</option>
      </select>
    </div>
    <div class="gap">
      <button class="btn btn-ghost btn-sm" onclick="exportCassa()">&#8595; CSV</button>
      <button class="btn btn-danger btn-sm" onclick="openMovCassa('uscita')">&#8722; Uscita</button>
      <button class="btn btn-primary btn-sm" onclick="openMovCassa('entrata')">+ Entrata</button>
    </div>
  </div>
  <div class="tbl" id="cassa-lista">
    <div class="tbl-row tbl-head" style="grid-template-columns:80px 1fr 120px 100px 90px 80px">
      <div class="th">Data</div><div class="th">Descrizione</div><div class="th">Categoria</div><div class="th">Metodo</div><div class="th">Tipo</div><div class="th" style="text-align:right">Importo</div>
    </div>
  </div>`;
  renderCassaLista();
}

function renderCassaLista(){
  const el=document.getElementById('cassa-lista'); if(!el) return;
  const fcat=document.getElementById('cassa-fcat')?.value||'';
  const ftipo=document.getElementById('cassa-ftipo')?.value||'';
  const head=el.querySelector('.tbl-head');
  el.innerHTML=''; el.appendChild(head);
  let list=[...DB.cassa].reverse().filter(m=>(!fcat||m.categoria===fcat)&&(!ftipo||m.tipo===ftipo));
  if(!list.length){
    const em=document.createElement('div');em.className='empty';em.innerHTML='<div class="empty-ic">&#128176;</div><div class="empty-t">Nessun movimento</div>';
    el.appendChild(em);return;
  }
  list.forEach(m=>{
    const row=document.createElement('div');row.className='tbl-row';row.style.gridTemplateColumns='80px 1fr 120px 100px 90px 80px';
    const col=m.tipo==='entrata'?'var(--green)':'var(--red)';
    const metIc={contanti:'💵',carta:'💳',bonifico:'🏦'}[m.metodo]||'';
    row.innerHTML=`<div class="td" style="font-family:var(--mono);font-size:11px">${m.data}</div>
      <div><div style="font-size:12px;font-weight:500">${m.descrizione||'—'}</div></div>
      <div class="td"><span class="tag tag-gray">${m.categoria||'—'}</span></div>
      <div class="td">${metIc} ${m.metodo||'—'}</div>
      <div class="td"><span class="tag ${m.tipo==='entrata'?'tag-green':'tag-red'}">${m.tipo==='entrata'?'Entrata':'Uscita'}</span></div>
      <div style="font-size:13px;font-weight:700;color:${col};text-align:right">${m.tipo==='entrata'?'+':'−'}€${(+m.importo).toFixed(2).replace('.',',')}</div>`;
    el.appendChild(row);
  });
}

function openMovCassa(tipo){
  _movTipo=tipo;
  document.getElementById('mov-tipo-lbl').textContent=tipo==='entrata'?'+ Nuova Entrata':'− Nuova Uscita';
  ['mov-importo','mov-desc'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('mov-cat').value='';
  document.getElementById('mov-data').value=new Date().toISOString().split('T')[0];
  openModal('modalMovimento');


// === ABBONAMENTI ===

// ============================================================
// Abbonamenti & piani
// ============================================================

}

function saveMov(){
  const importo=parseFloat(document.getElementById('mov-importo').value);
  if(!importo||importo<=0){showToast('Inserisci un importo valido');return;}
  DB.cassa.push({
    id:nid(),
    data:document.getElementById('mov-data').value||new Date().toISOString().split('T')[0],
    tipo:_movTipo,
    importo:+importo.toFixed(2),
    categoria:document.getElementById('mov-cat').value||'Altro',
    descrizione:document.getElementById('mov-desc').value.trim(),
    metodo:document.getElementById('mov-metodo').value||'contanti',
    ref_id:null,ref_tipo:null
  });
  saveDB(); closeModal('modalMovimento'); renderCassa(); updateKpi(); showToast(_movTipo==='entrata'?'Entrata registrata':'Uscita registrata');
}

function exportCassa(){
  if(!DB.cassa.length){showToast('Nessun movimento');return;}
  const esc=v=>'"'+String(v||'').replace(/"/g,'""')+'"';
  const csv='Data,Descrizione,Categoria,Tipo,Importo,Metodo\n'+DB.cassa.map(m=>[esc(m.data),esc(m.descrizione),esc(m.categoria),esc(m.tipo),m.importo,esc(m.metodo)].join(',')).join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);a.download='prima-nota.csv';a.click();showToast('CSV esportato');
}
