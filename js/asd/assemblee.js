// ====================================================
// ASSEMBLEE ASD
// ====================================================
if(!DB.asd_assemblee) DB.asd_assemblee=[];
let editAssemId=null;

function renderAssemblee(){
  const pg=document.getElementById('page-asd-assemblee'); if(!pg)return;
  document.getElementById('assemblee-sum').textContent=`${DB.asd_assemblee.length} assemblee registrate`;
  const el=document.getElementById('assemblee-list'); if(!el)return;
  if(!DB.asd_assemblee.length){el.innerHTML='<div class="empty"><div class="empty-ic">&#128101;</div><div class="empty-t">Nessuna assemblea registrata</div><div class="empty-s">Crea la prima assemblea ASD</div><button class="btn btn-primary btn-sm" onclick="openNewAssemblea()">+ Nuova assemblea</button></div>';return;}
  const sorted=[...DB.asd_assemblee].sort((a,b)=>b.data.localeCompare(a.data));
  const oggi=new Date().toISOString().split('T')[0];
  el.innerHTML=sorted.map(a=>{
    const fut=a.data>=oggi;
    const tipoTag=a.tipo==='straordinaria'?'tag-red':'tag-blue';
    return `<div style="background:var(--surf);border:.5px solid var(--bdr);border-radius:var(--r);padding:14px 16px;margin-bottom:10px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
            <span style="font-size:20px">&#128101;</span>
            <div style="font-size:14px;font-weight:700">${a.titolo}</div>
            <span class="tag ${tipoTag}">${a.tipo==='straordinaria'?'Straordinaria':'Ordinaria'}</span>
            ${fut?'<span class="tag tag-gold">&#9200; In programma</span>':'<span class="tag tag-gray">Svolta</span>'}
          </div>
          <div style="font-size:11px;color:var(--text3);display:flex;gap:14px;flex-wrap:wrap">
            <span>&#128197; ${a.data}${a.ora?' alle '+a.ora:''}</span>
            ${a.luogo?`<span>&#128205; ${a.luogo}</span>`:''}
            ${a.presenti?`<span>&#128101; ${a.presenti} soci presenti</span>`:''}
          </div>
          ${a.odg?`<div style="margin-top:8px;padding:8px 10px;background:var(--bg);border-radius:6px"><div style="font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Ordine del giorno</div><div style="font-size:11px;white-space:pre-line;color:var(--text2)">${a.odg}</div></div>`:''}
          ${a.verbale?`<div style="margin-top:6px;padding:8px 10px;background:rgba(34,169,110,.07);border:.5px solid rgba(34,169,110,.2);border-radius:6px"><div style="font-size:10px;color:var(--green);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">&#128221; Verbale</div><div style="font-size:11px;white-space:pre-line;color:var(--text2)">${a.verbale}</div></div>`:''}
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          <button class="btn btn-ghost btn-sm" onclick="editAssemblea(${a.id})">&#9999;</button>
          <button class="btn btn-danger btn-xs" onclick="delAssemblea(${a.id})">&#128465;</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function openNewAssemblea(){
  editAssemId=null;
  document.getElementById('mAssembTitle').textContent='&#128101; Nuova assemblea ASD';
  document.getElementById('assem-del-btn').style.display='none';
  ['assem-titolo','assem-luogo','assem-odg','assem-verbale'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('assem-data').value=new Date().toISOString().split('T')[0];
  document.getElementById('assem-ora').value='18:00';
  document.getElementById('assem-tipo').value='ordinaria';
  document.getElementById('assem-presenti').value='';
  openModal('modalAssemblea');
}

function editAssemblea(id){
  const a=DB.asd_assemblee.find(x=>x.id===id); if(!a)return;
  editAssemId=id;
  document.getElementById('mAssembTitle').textContent='&#9999; Modifica assemblea';
  document.getElementById('assem-del-btn').style.display='';
  document.getElementById('assem-titolo').value=a.titolo;
  document.getElementById('assem-data').value=a.data;
  document.getElementById('assem-ora').value=a.ora||'';
  document.getElementById('assem-tipo').value=a.tipo;
  document.getElementById('assem-luogo').value=a.luogo||'';
  document.getElementById('assem-odg').value=a.odg||'';
  document.getElementById('assem-verbale').value=a.verbale||'';
  document.getElementById('assem-presenti').value=a.presenti||'';
  openModal('modalAssemblea');
}

function saveAssemblea(){


// === COACH_HUB ===

// ============================================================
// Coach Hub
// ============================================================

const titolo=document.getElementById('assem-titolo').value.trim();
  if(!titolo){showToast('Inserisci titolo assemblea');return;}
  const data=document.getElementById('assem-data').value;
  if(!data){showToast('Inserisci data assemblea');return;}
  const obj={titolo,data,ora:document.getElementById('assem-ora').value,tipo:document.getElementById('assem-tipo').value,luogo:document.getElementById('assem-luogo').value.trim(),odg:document.getElementById('assem-odg').value.trim(),verbale:document.getElementById('assem-verbale').value.trim(),presenti:parseInt(document.getElementById('assem-presenti').value)||null};
  if(editAssemId){Object.assign(DB.asd_assemblee.find(x=>x.id===editAssemId),obj);}
  else{DB.asd_assemblee.push({id:nid(),...obj});}
  saveDB(); closeModal('modalAssemblea'); renderAssemblee(); showToast('Assemblea salvata');
}

function delAssemblea(id){
  const idDel=id||editAssemId;
  askConfirm('Elimina assemblea?','Il verbale verrà perso.','Elimina',()=>{
    DB.asd_assemblee=DB.asd_assemblee.filter(x=>x.id!==idDel);
    saveDB(); closeModal('modalAssemblea'); renderAssemblee(); showToast('Assemblea eliminata');
  });
}
