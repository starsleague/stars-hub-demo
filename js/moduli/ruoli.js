// ====================================================
// RUOLI & ACCESSI
// ====================================================
const RUOLI_DEF=[
  {id:'admin',ic:'&#128081;',nome:'Admin',col:'var(--navy)',perms:['Accesso completo','Gestione ruoli','Tutti i report','Modulo ASD','Cassa']},
  {id:'receptionist',ic:'&#127919;',nome:'Receptionist',col:'var(--blue)',perms:['Planner','Cassa','Giocatori','Prenotazioni','✗ Bilancio ASD','✗ Ruoli']},
  {id:'istruttore',ic:'&#127934;',nome:'Istruttore',col:'var(--green)',perms:['Corsi propri','Giocatori (solo lettura)','✗ Cassa','✗ Modulo ASD','✗ Ruoli']},
  {id:'tesoriere',ic:'&#128202;',nome:'Tesoriere ASD',col:'var(--gold)',perms:['Bilancio ASD','Libro soci','Scadenze','✗ Planner','✗ Cassa commerciale']}
];

let _invitoRuolo='admin';

function renderRuoli(){
  const pg=document.getElementById('page-ruoli'); if(!pg) return;
  if(!DB.utenti) DB.utenti=[];
  pg.innerHTML=`
  <div class="spread mb">
    <div style="font-size:13px;font-weight:600;color:var(--text2)">Ruoli &amp; Accessi (${DB.utenti.length+1} utenti)</div>
    <button class="btn btn-primary btn-sm" onclick="openInvito('')">&#128231; Invita utente</button>
  </div>
  <div class="g2 mb">
    ${RUOLI_DEF.map(r=>`
    <div class="card">
      <div class="card-h">
        <div style="display:flex;align-items:center;gap:9px">
          <div style="width:32px;height:32px;border-radius:8px;background:${r.col};display:flex;align-items:center;justify-content:center;font-size:15px;color:#fff">${r.ic}</div>
          <div>
            <div style="font-size:13px;font-weight:600">${r.nome}</div>
            <div style="font-size:10px;color:var(--text3)">${DB.utenti.filter(u=>u.ruolo===r.id).length} utenti</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="openInvito('${r.id}')">+ Invita</button>
      </div>
      <div class="card-b">
        <div style="font-size:11px;color:var(--text2)">${r.perms.map(p=>`<div style="padding:2px 0;${p.startsWith('✗')?'color:var(--text3)':''}">${p.startsWith('✗')?p:'✓ '+p}</div>`).join('')}</div>
      </div>
    </div>`).join('')}
  </div>
  ${DB.utenti.length?`
  <div class="card">
    <div class="card-h"><div class="card-t">Utenti invitati</div></div>
    <div class="tbl" id="utenti-lista">
      <div class="tbl-row tbl-head" style="grid-template-columns:2fr 1fr 1fr 80px">
        <div class="th">Utente</div><div class="th">Ruolo</div><div class="th">Stato</div><div class="th">Azioni</div>
      </div>
      ${DB.utenti.map(u=>`<div class="tbl-row" style="grid-template-columns:2fr 1fr 1fr 80px">
        <div><div style="font-size:12px;font-weight:500">${u.nome||u.email}</div><div style="font-size:10px;color:var(--text3)">${u.email}</div></div>
        <div class="td"><span class="tag tag-navy">${RUOLI_DEF.find(r=>r.id===u.ruolo)?.nome||u.ruolo}</span></div>
        <div class="td"><span class="tag ${u.stato==='attivo'?'tag-green':'tag-gold'}">${u.stato}</span></div>
        <div><button class="btn btn-danger btn-xs" onclick="delUtente(${u.id})">&#128465;</button></div>
      </div>`).join('')}
    </div>
  </div>`:''}`;
}

function openInvito(ruolo){
  _invitoRuolo=ruolo||'admin';
  document.getElementById('invito-ruolo').value=_invitoRuolo;
  document.getElementById('invito-title').textContent='&#128231; Invita '+RUOLI_DEF.find(r=>r.id===_invitoRuolo)?.nome||'utente';
  ['invito-email','invito-nome'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  openModal('modalInvito');
}

function inviaInvito(){
  const email=document.getElementById('invito-email').value.trim();
  if(!email||!email.includes('@')){showToast('Inserisci un\'email valida');return;}
  if(!DB.utenti) DB.utenti=[];
  const ruolo=document.getElementById('invito-ruolo').value;
  const nome=document.getElementById('invito-nome').value.trim();
  DB.utenti.push({id:nid(),email,nome,ruolo,stato:'in_attesa',data:new Date().toISOString().split('T')[0]});
  saveDB(); closeModal('modalInvito'); renderRuoli();
  showToast('&#128231; Invito inviato a '+email);
}

function delUtente(id){
  askConfirm('Rimuovi accesso?','L\'utente non potrà più accedere al gestionale.','Rimuovi',()=>{
    DB.utenti=DB.utenti.filter(u=>u.id!==id); saveDB(); renderRuoli(); showToast('Accesso revocato');
  });
}
