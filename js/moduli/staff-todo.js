// ====================================================
// STAFF
// ====================================================


// === STAFF ===

// ============================================================
// Staff, turni, todo
// ============================================================

let editStaffId=null;

function openNewStaff(tipo='dipendente'){
  editStaffId=null;
  document.getElementById('mStaffTitle').textContent=tipo==='istruttore'?'&#127934; Nuovo istruttore':'&#128084; Nuovo dipendente';
  document.getElementById('st-del-btn').style.display='none';
  document.getElementById('st-tipo').value=tipo;
  ['st-nome','st-cognome','st-email','st-tel','st-note','st-mansione'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('st-sport').innerHTML=DB.sport.map(s=>`<option>${s}</option>`).join('');
  toggleStaffTipo(); openModal('modalStaff');
}

function editStaff(id){
  const s=DB.staff.find(x=>x.id===id); if(!s) return;
  editStaffId=id;
  document.getElementById('mStaffTitle').textContent='&#9999; '+s.nome+' '+s.cognome;
  document.getElementById('st-del-btn').style.display='';
  document.getElementById('st-tipo').value=s.tipo;
  document.getElementById('st-nome').value=s.nome; document.getElementById('st-cognome').value=s.cognome;
  document.getElementById('st-email').value=s.email||''; document.getElementById('st-tel').value=s.tel||'';
  document.getElementById('st-note').value=s.note||''; document.getElementById('st-mansione').value=s.mansione||'';
  document.getElementById('st-sport').innerHTML=DB.sport.map(sp=>`<option ${(s.sport||[]).includes(sp)?'selected':''}>${sp}</option>`).join('');
  toggleStaffTipo(); openModal('modalStaff');
}

function toggleStaffTipo(){
  const t=document.getElementById('st-tipo').value;
  document.getElementById('st-sport-row').style.display=t==='istruttore'?'':'none';
  document.getElementById('st-mans-row').style.display=t==='dipendente'?'':'none';
}

function saveStaff(){
  const nome=document.getElementById('st-nome').value.trim(); if(!nome){showToast('Inserisci il nome');return;}
  const tipo=document.getElementById('st-tipo').value;
  const sp=Array.from(document.getElementById('st-sport').selectedOptions).map(o=>o.value);
  const s={nome,cognome:document.getElementById('st-cognome').value.trim(),tipo,sport:tipo==='istruttore'?sp:[],mansione:tipo==='dipendente'?document.getElementById('st-mansione').value.trim():'',email:document.getElementById('st-email').value.trim(),tel:document.getElementById('st-tel').value.trim(),note:document.getElementById('st-note').value.trim()};
  if(editStaffId){Object.assign(DB.staff.find(x=>x.id===editStaffId),s);showToast('Aggiornato');}
  else{DB.staff.push({id:nid(),...s});showToast(nome+' aggiunto');}
  saveDB(); closeModal('modalStaff'); renderStaff(); fillSelects();
}

function deleteStaffModal(){
  askConfirm('Elimina membro?','','Elimina',()=>{
    DB.staff=DB.staff.filter(s=>s.id!==editStaffId);
    saveDB(); closeModal('modalStaff'); renderStaff(); fillSelects(); showToast('Eliminato');
  });
}

function renderStaff(){
  const grid=document.getElementById('staff-grid'); if(!grid) return;
  document.getElementById('staff-sum').textContent='Staff: '+DB.staff.length;
  if(!DB.staff.length){grid.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="empty-ic">&#128084;</div><div class="empty-t">Nessun membro</div></div>';return;}
  const icons={istruttore:'&#127934;',dipendente:'&#128084;'};
  grid.innerHTML=DB.staff.map(s=>`<div class="card"><div class="card-h"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:18px">${icons[s.tipo]||'&#128100;'}</span><div class="card-t">${s.nome} ${s.cognome}</div></div><div style="display:flex;gap:5px"><button class="btn btn-ghost btn-xs" onclick="editStaff(${s.id})">&#9999;</button><button class="btn btn-danger btn-xs" onclick="editStaffId=${s.id};deleteStaffModal()">&#128465;</button></div></div><div class="card-b"><div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:7px"><span class="tag ${s.tipo==='istruttore'?'tag-green':'tag-navy'}">${s.tipo==='istruttore'?'Istruttore':'Dipendente'}</span>${s.mansione?`<span class="tag tag-gray">${s.mansione}</span>`:''} ${(s.sport||[]).map(sp=>`<span class="tag tag-gold">${sp}</span>`).join('')}</div>${s.email?`<div style="font-size:11px;color:var(--text2)">&#128231; ${s.email}</div>`:''} ${s.tel?`<div style="font-size:11px;color:var(--text2)">&#128222; ${s.tel}</div>`:''}</div></div>`).join('');
}

function saveTodo(){
  const titolo=document.getElementById('td-titolo').value.trim(); if(!titolo){showToast('Inserisci il titolo');return;}
  DB.todo.push({id:nid(),titolo,desc:document.getElementById('td-desc').value.trim(),assegna_id:parseInt(document.getElementById('td-assegna').value)||null,prio:document.getElementById('td-prio').value,done:false,commenti:[]});
  saveDB(); closeModal('modalTodo'); renderTodo(); showToast('Consegna aggiunta');
}

function toggleTodo(id){const t=DB.todo.find(x=>x.id===id);if(t){t.done=!t.done;saveDB();renderTodo();}}

function delTodo(id){DB.todo=DB.todo.filter(x=>x.id!==id);saveDB();renderTodo();showToast('Eliminata');}

function renderTodo(){
  const list=document.getElementById('todo-list'); if(!list) return;
  if(!DB.todo.length){list.innerHTML='<div class="empty"><div class="empty-ic">&#128203;</div><div class="empty-t">Nessuna consegna</div></div>';return;}
  const PC={normal:'tag-gray',high:'tag-gold',urgent:'tag-red'};
  const PL={normal:'Normale',high:'Alta',urgent:'Urgente'};
  list.innerHTML=DB.todo.map(t=>`<div class="todo-item ${t.done?'done':''}"><div style="display:flex;align-items:flex-start;gap:10px"><div class="todo-check ${t.done?'checked':''}" onclick="toggleTodo(${t.id})">${t.done?'&#10003;':''}</div><div style="flex:1"><div class="todo-title">${t.titolo}</div>${t.desc?`<div style="font-size:10px;color:var(--text3);margin-top:2px">${t.desc}</div>`:''}<div style="display:flex;gap:5px;margin-top:5px;flex-wrap:wrap"><span class="tag ${PC[t.prio]}">${PL[t.prio]}</span>${t.assegna_id?`<span class="tag tag-navy">&#128100; ${DB.staff.find(s=>s.id===t.assegna_id)?.nome||'—'}</span>`:''}</div></div><button class="btn btn-danger btn-xs" onclick="delTodo(${t.id})">&#128465;</button></div></div>`).join('');
}

function setPersonaleTab(idx){
  const els=['pers-staff','pers-todo','pers-turni'];
  els.forEach((id,i)=>{const el=document.getElementById(id);if(el)el.style.display=i===idx?'block':'none';});
  document.querySelectorAll('#page-personale .asd-tab').forEach((t,i)=>{t.classList.toggle('active',i===idx);});
  if(idx===2) renderTurni();
}
