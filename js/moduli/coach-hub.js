// ====================================================
// COACH HUB
// ====================================================
if(!DB.coach_progressioni) DB.coach_progressioni=[];
let activeCoachId=null, progGiocId=null;

function renderCoachHub(){
  const grid=document.getElementById('coach-select-grid'); if(!grid)return;
  const coaches=DB.staff.filter(s=>s.tipo==='istruttore');
  if(!coaches.length){grid.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="empty-ic">&#127934;</div><div class="empty-t">Nessun coach registrato</div><div class="empty-s">Aggiungi istruttori nella sezione Personale</div><button class="btn btn-ghost btn-sm" onclick="nav(\'personale\',null)">Vai al personale &#8594;</button></div>';return;}
  grid.innerHTML=coaches.map(s=>{
    const allievi=DB.giocatori.filter(g=>g.coach_id===s.id);
    const progs=DB.coach_progressioni.filter(p=>p.coach_id===s.id);
    const lezioniTot=DB.eventi.filter(e=>e.tipo==='corso'&&Array.isArray(e.iscritti)&&e.sport&&DB.staff.find(st=>st.id===s.id)?.sport?.includes(e.sport)).reduce((sum,e)=>sum+(Array.isArray(e.iscritti)?e.iscritti.length:0),0);
    const incasso=DB.cassa.filter(m=>m.tipo==='entrata'&&m.cat==='Corsi').reduce((sum,m)=>sum+m.importo,0);
    const active=activeCoachId===s.id;
    return `<div class="card" style="cursor:pointer;border:${active?'2px solid var(--gold)':''};" onclick="selectCoach(${s.id})">
      <div class="card-b" style="text-align:center;padding:16px">
        <div style="width:52px;height:52px;border-radius:12px;background:linear-gradient(135deg,var(--navy),var(--navy-l));display:flex;align-items:center;justify-content:center;color:var(--gold);font-size:19px;font-weight:700;margin:0 auto 8px">${(s.nome[0]||'')+(s.cognome?.[0]||'')}</div>
        <div style="font-size:13px;font-weight:700;margin-bottom:3px">${s.nome} ${s.cognome||''}</div>
        <div style="font-size:10px;color:var(--text3);margin-bottom:10px">${(s.sport||[]).join(', ')||'—'}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;text-align:center">
          <div style="background:var(--bg);border-radius:7px;padding:7px 4px"><div style="font-size:18px;font-weight:700;color:var(--gold)">${allievi.length}</div><div style="font-size:9px;color:var(--text3)">Allievi</div></div>
          <div style="background:var(--bg);border-radius:7px;padding:7px 4px"><div style="font-size:18px;font-weight:700;color:var(--green)">${progs.length}</div><div style="font-size:9px;color:var(--text3)">Valutazioni</div></div>
        </div>
        <button class="btn btn-primary btn-sm mt" onclick="event.stopPropagation();selectCoachTab(${s.id})">&#128200; Dashboard</button>
      </div>
    </div>`;
  }).join('');
}

function setCoachTab(idx){
  document.querySelectorAll('#coach-tabs .asd-tab').forEach((t,i)=>{t.classList.toggle('active',i===idx);});
  ['coach-tab-0','coach-tab-1','coach-tab-2'].forEach((id,i)=>{
    const el=document.getElementById(id); if(el) el.style.display=i===idx?'':'none';
  });
  if(idx===0) renderCoachHub();
  if(idx===1) renderCoachProduttivita();
  if(idx===2) renderCoachAllievi();
}

function selectCoach(id){activeCoachId=id;renderCoachHub();}

function selectCoachTab(id){activeCoachId=id;setCoachTab(1);}

function renderCoachProduttivita(){
  const el=document.getElementById('coach-produttivita'); if(!el)return;
  const coaches=DB.staff.filter(s=>s.tipo==='istruttore');
  if(!coaches.length){el.innerHTML='<div class="empty"><div class="empty-ic">&#127934;</div><div class="empty-t">Nessun coach</div></div>';return;}
  const coach=activeCoachId?DB.staff.find(s=>s.id===activeCoachId):coaches[0];
  if(!coach){el.innerHTML='<div class="empty"><div class="empty-ic">&#127934;</div><div class="empty-t">Seleziona un coach</div></div>';return;}
  
  // Selezione coach
  const sel=`<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
    ${coaches.map(c=>`<button class="btn ${c.id===coach.id?'btn-navy':'btn-ghost'} btn-sm" onclick="activeCoachId=${c.id};renderCoachProduttivita()">${c.nome} ${c.cognome||''}</button>`).join('')}
  </div>`;

  const allievi=DB.giocatori.filter(g=>g.coach_id===coach.id);
  const progs=DB.coach_progressioni.filter(p=>p.coach_id===coach.id);
  const corsiCoach=DB.eventi.filter(e=>e.tipo==='corso'&&coach.sport?.some(sp=>sp===e.sport));
  const iscrittiTot=corsiCoach.reduce((sum,e)=>sum+(Array.isArray(e.iscritti)?e.iscritti.length:0),0);
  const incassoCorsi=corsiCoach.reduce((sum,e)=>{
    const saldati=Array.isArray(e.iscritti)?e.iscritti.filter(i=>i.pagato==='saldato').length:0;
    return sum+saldati*(e.quota||0);
  },0);
  
  // Progressioni recenti
  const sortedProgs=[...progs].sort((a,b)=>b.data.localeCompare(a.data));

  el.innerHTML=sel+`
  <div class="g4 mb">
    <div class="kpi accent"><div class="kpi-l">Allievi seguiti</div><div class="kpi-v">${allievi.length}</div></div>
    <div class="kpi"><div class="kpi-l">Corsi attivi</div><div class="kpi-v">${corsiCoach.length}</div></div>
    <div class="kpi"><div class="kpi-l">Iscritti totali</div><div class="kpi-v">${iscrittiTot}</div></div>
    <div class="kpi"><div class="kpi-l">Incasso corsi</div><div class="kpi-v" style="color:var(--green)">&#8364; ${incassoCorsi.toFixed(2).replace('.',',')}</div></div>
  </div>
  <div class="g2">
    <div class="card">
      <div class="card-h"><div class="card-t">&#127934; Corsi attivi</div></div>
      <div class="card-b" style="padding:0">
        ${corsiCoach.length?corsiCoach.map(e=>{
          const iscrN=Array.isArray(e.iscritti)?e.iscritti.length:0;
          const saldN=Array.isArray(e.iscritti)?e.iscritti.filter(i=>i.pagato==='saldato').length:0;
          return `<div style="padding:10px 14px;border-bottom:.5px solid var(--bdr2)">
            <div style="font-size:12px;font-weight:600;margin-bottom:3px">${e.nome}</div>
            <div style="font-size:11px;color:var(--text3)">&#128101; ${iscrN}/${e.maxp||'∞'} iscritti &bull; &#10003; ${saldN} pagati</div>
            ${e.quota?`<div style="font-size:11px;color:var(--green);margin-top:2px">&#8364; ${(saldN*e.quota).toFixed(2)} incassati</div>`:''}
          </div>`;
        }).join(''):'<div class="empty" style="padding:20px"><div style="font-size:11px;color:var(--text3)">Nessun corso</div></div>'}
      </div>
    </div>
    <div class="card">
      <div class="card-h"><div class="card-t">&#128203; Ultime valutazioni</div><button class="btn btn-primary btn-xs" onclick="setCoachTab(2)">+ Allievi</button></div>
      <div class="card-b" style="padding:0">
        ${sortedProgs.slice(0,6).length?sortedProgs.slice(0,6).map(p=>{
          const g=DB.giocatori.find(x=>x.id===p.giocatore_id);
          return `<div style="padding:8px 14px;border-bottom:.5px solid var(--bdr2)">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div style="font-size:12px;font-weight:500">${g?g.nome+' '+g.cognome:'Giocatore #'+p.giocatore_id}</div>
              <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--gold)">${p.livello||'—'}</div>
            </div>
            <div style="font-size:10px;color:var(--text3)">${p.data}</div>
            ${p.note?`<div style="font-size:10px;color:var(--text2);margin-top:2px">${p.note.substring(0,60)}${p.note.length>60?'...':''}</div>`:''}
          </div>`;
        }).join(''):'<div class="empty" style="padding:20px"><div style="font-size:11px;color:var(--text3)">Nessuna valutazione</div></div>'}
      </div>
    </div>
  </div>`;
}

function renderCoachAllievi(){
  const el=document.getElementById('coach-allievi'); if(!el)return;
  const coaches=DB.staff.filter(s=>s.tipo==='istruttore');
  if(!coaches.length){el.innerHTML='<div class="empty"><div class="empty-ic">&#127934;</div><div class="empty-t">Nessun coach</div></div>';return;}
  const coach=activeCoachId?DB.staff.find(s=>s.id===activeCoachId):coaches[0];
  if(!coach){el.innerHTML='<div class="empty"><div class="empty-ic">&#127934;</div><div class="empty-t">Seleziona un coach dalla tab Dashboard</div></div>';return;}

  const sel=`<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
    ${coaches.map(c=>`<button class="btn ${c.id===coach.id?'btn-navy':'btn-ghost'} btn-sm" onclick="activeCoachId=${c.id};renderCoachAllievi()">${c.nome} ${c.cognome||''}</button>`).join('')}
  </div>`;

  const allievi=DB.giocatori.filter(g=>g.coach_id===coach.id);
  const tuttiGioc=DB.giocatori.filter(g=>!g.coach_id||(g.coach_id!==coach.id));

  el.innerHTML=sel+`
  <div class="spread">
    <div style="font-size:12px;font-weight:500;color:var(--text2)">${allievi.length} allievi assegnati a ${coach.nome}</div>
    <div class="gap">
      <select class="f-input f-select" id="coach-add-gioc" style="width:200px;height:32px;font-size:12px">
        <option value="">— Aggiungi allievo —</option>
        ${tuttiGioc.map(g=>`<option value="${g.id}">${g.nome} ${g.cognome}</option>`).join('')}
      </select>
      <button class="btn btn-primary btn-sm" onclick="addAllievo()">+ Assegna</button>
    </div>
  </div>
  <div class="tbl" style="margin-top:8px">
    <div class="tbl-row tbl-head" style="grid-template-columns:2fr 80px 90px 80px 90px 60px">
      <div class="th">Allievo</div><div class="th">Sport</div><div class="th">Livello</div><div class="th">Ultima val.</div><div class="th">Note coach</div><div class="th"></div>
    </div>
    ${allievi.length?allievi.map(g=>{
      const progs=DB.coach_progressioni.filter(p=>p.giocatore_id===g.id&&p.coach_id===coach.id).sort((a,b)=>b.data.localeCompare(a.data));
      const last=progs[0];
      return `<div class="tbl-row" style="grid-template-columns:2fr 80px 90px 80px 90px 60px">
        <div><div class="p-name">${g.nome} ${g.cognome}</div><div class="p-meta">${g.email||''}</div></div>
        <div class="td">${g.sport||'—'}</div>
        <div><span class="lv-badge">${last?last.livello:g.livello||'—'}</span></div>
        <div class="td" style="font-size:10px;font-family:var(--mono)">${last?last.data:'Mai'}</div>
        <div class="td" style="font-size:10px">${last?last.note?.substring(0,30)+'...':''}</div>
        <div style="display:flex;gap:3px">
          <button class="btn btn-ghost btn-xs" onclick="openProgresso(${g.id},${coach.id})">&#127919;</button>
          <button class="btn btn-danger btn-xs" onclick="removeAllievo(${g.id})">&#10005;</button>
        </div>
      </div>`;
    }).join(''):`<div class="tbl-row" style="grid-column:1/-1"><div class="empty" style="padding:24px"><div class="empty-t">Nessun allievo assegnato</div></div></div>`}
  </div>`;
}

function addAllievo(){
  const sel=document.getElementById('coach-add-gioc'); if(!sel||!sel.value)return;
  const gId=parseInt(sel.value);
  const g=DB.giocatori.find(x=>x.id===gId); if(!g)return;
  if(!activeCoachId){showToast('Seleziona prima un coach');return;}
  g.coach_id=activeCoachId;
  saveDB(); renderCoachAllievi(); showToast(g.nome+' assegnato al coach');
}

function removeAllievo(gId){
  const g=DB.giocatori.find(x=>x.id===gId); if(!g)return;
  g.coach_id=null; saveDB(); renderCoachAllievi(); showToast('Allievo rimosso');
}

function openProgresso(gId,coachId){
  progGiocId=gId;
  const g=DB.giocatori.find(x=>x.id===gId);
  document.getElementById('mProgTitle').textContent='&#127919; Valutazione — '+(g?g.nome+' '+g.cognome:'');
  document.getElementById('prog-gioc-info').innerHTML=g?`<strong>${g.nome} ${g.cognome}</strong> — Sport: ${g.sport||'—'} — Livello attuale: <strong>${g.livello||'—'}</strong>`:' ';
  document.getElementById('prog-livello').value=g?.livello||'';
  document.getElementById('prog-data').value=new Date().toISOString().split('T')[0];
  document.getElementById('prog-obiettivi').value='';
  document.getElementById('prog-note').value='';
  document.getElementById('prog-next').value='';
  openModal('modalProgresso');
}

function saveProgresso(){
  const livello=document.getElementById('prog-livello').value;
  if(!livello){showToast('Inserisci il livello');return;}
  const obj={id:nid(),giocatore_id:progGiocId,coach_id:activeCoachId,livello:parseFloat(livello),data:document.getElementById('prog-data').value,obiettivi:document.getElementById('prog-obiettivi').value.trim(),note:document.getElementById('prog-note').value.trim(),prossimi:document.getElementById('prog-next').value.trim()};
  DB.coach_progressioni.push(obj);
  // Aggiorna livello sul giocatore
  const g=DB.giocatori.find(x=>x.id===progGiocId); if(g) g.livello=livello;
  saveDB(); closeModal('modalProgresso'); renderCoachAllievi(); showToast('Valutazione salvata ✓');
}
