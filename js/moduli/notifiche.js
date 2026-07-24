function renderNotifiche(){
  const pg=document.getElementById('page-notifiche'); if(!pg) return;
  const oggi=new Date().toISOString().split('T')[0];
  const in30=new Date(); in30.setDate(in30.getDate()+30); const in30s=in30.toISOString().split('T')[0];
  const notifiche=[];
  // Tessere in scadenza
  DB.giocatori.filter(g=>g.tessera&&g.tessera<=in30s&&g.tessera>=oggi).forEach(g=>{
    notifiche.push({ic:'🎫',col:'rgba(247,168,0,.12)',title:'Tessera in scadenza',desc:`${g.nome} ${g.cognome} — scade il ${g.tessera}`,data:g.tessera,tipo:'warn'});
  });
  DB.giocatori.filter(g=>g.tessera&&g.tessera<oggi).forEach(g=>{
    notifiche.push({ic:'⚠️',col:'rgba(224,90,43,.12)',title:'Tessera scaduta',desc:`${g.nome} ${g.cognome} — scaduta il ${g.tessera}`,data:g.tessera,tipo:'err'});
  });
  // Certificati medici
  DB.giocatori.filter(g=>g.cert&&g.cert<=in30s&&g.cert>=oggi).forEach(g=>{
    notifiche.push({ic:'🏥',col:'rgba(247,168,0,.12)',title:'Cert. medico in scadenza',desc:`${g.nome} ${g.cognome} — scade il ${g.cert}`,data:g.cert,tipo:'warn'});
  });
  DB.giocatori.filter(g=>g.cert&&g.cert<oggi).forEach(g=>{
    notifiche.push({ic:'⚠️',col:'rgba(224,90,43,.12)',title:'Cert. medico scaduto',desc:`${g.nome} ${g.cognome} — scaduto il ${g.cert}`,data:g.cert,tipo:'err'});
  });
  // Abbonamenti in scadenza
  DB.abbonamenti.filter(a=>a.stato==='attivo'&&a.data_fine&&a.data_fine<=in30s&&a.data_fine>=oggi).forEach(a=>{
    const g=DB.giocatori.find(x=>x.id===a.giocatore_id);
    const p=DB.abbonamenti_piani.find(x=>x.id===a.piano_id);
    notifiche.push({ic:'🎫',col:'rgba(247,168,0,.12)',title:'Abbonamento in scadenza',desc:`${g?g.nome+' '+g.cognome:'—'} (${p?.nome||'—'}) — scade il ${a.data_fine}`,data:a.data_fine,tipo:'warn'});
  });
  // Scadenze ASD imminenti
  DB.asd_scadenze.filter(s=>s.stato!=='completato'&&s.data_scadenza<=in30s&&s.data_scadenza>=oggi).forEach(s=>{
    notifiche.push({ic:'📋',col:'rgba(59,130,246,.12)',title:'Scadenza ASD: '+s.titolo,desc:s.tipo?`Tipo: ${s.tipo}`:s.descrizione,data:s.data_scadenza,tipo:'info'});
  });
  DB.asd_scadenze.filter(s=>s.stato!=='completato'&&s.data_scadenza<oggi).forEach(s=>{
    notifiche.push({ic:'🚨',col:'rgba(224,90,43,.12)',title:'Scadenza ASD SCADUTA: '+s.titolo,desc:s.descrizione,data:s.data_scadenza,tipo:'err'});
  });
  // Prenotazioni da pagare oggi
  const daP=DB.prenotazioni.filter(p=>p.data===oggi&&p.pagato==='da_pagare');
  if(daP.length) notifiche.push({ic:'💶',col:'rgba(34,169,110,.12)',title:`${daP.length} prenotazioni da incassare oggi`,desc:'Vai alla cassa per registrare i pagamenti',data:oggi,tipo:'info'});
  // Aggiorna badge
  const badge=document.getElementById('notif-badge');
  if(badge){badge.textContent=notifiche.length;badge.style.display=notifiche.length?'':'none';}
  notifiche.sort((a,b)=>a.data.localeCompare(b.data));
  pg.innerHTML=`
  <div class="spread mb">
    <div style="font-size:13px;font-weight:600">Notifiche (${notifiche.length})</div>
    <button class="btn btn-ghost btn-sm" onclick="renderNotifiche()">↻ Aggiorna</button>
  </div>
  <div class="g2">
    <div>
      ${notifiche.length?notifiche.map(n=>`
      <div class="notif-rule" style="margin-bottom:7px">


// === ISCRIZIONI ===

// ============================================================
// Iscrizioni tornei/corsi
// ============================================================

<div class="notif-rule-ic" style="background:${n.col}">${n.ic}</div>
        <div style="flex:1">
          <div style="font-size:12px;font-weight:500">${n.title}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px">${n.desc||''}</div>
        </div>
        <div style="font-size:10px;font-family:var(--mono);color:var(--text3)">${n.data}</div>
      </div>`).join(''):'<div class="empty" style="padding:40px"><div class="empty-ic">🔔</div><div class="empty-t">Nessuna notifica</div><div class="empty-s">Tutto in ordine!</div></div>'}
    </div>
    <div>
      <div class="set-section">
        <div class="set-head"><div class="set-head-ic">⚙️</div><div class="set-head-t">Regole notifica</div></div>
        <div class="set-body">
          <div class="set-row"><div><div class="set-k">Conferma prenotazione</div><div class="set-v">Immediata • Push + Email</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
          <div class="set-row"><div><div class="set-k">Reminder partita</div><div class="set-v">2h prima • Push + WA</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
          <div class="set-row"><div><div class="set-k">Tessera in scadenza</div><div class="set-v">Email 30gg prima</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
          <div class="set-row"><div><div class="set-k">Cert. medico in scadenza</div><div class="set-v">Email 30gg prima</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
          <div class="set-row"><div><div class="set-k">Abbonamento in scadenza</div><div class="set-v">Email + Push 30gg prima</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
        </div>
      </div>
    </div>
  </div>`;
}

function aggiornaNotifBadge(){
  const oggi=new Date().toISOString().split('T')[0];
  const in30=new Date(); in30.setDate(in30.getDate()+30); const in30s=in30.toISOString().split('T')[0];
  let cnt=0;
  cnt+=DB.giocatori.filter(g=>(g.tessera&&g.tessera<=in30s)||(g.cert&&g.cert<=in30s)).length;
  cnt+=DB.abbonamenti.filter(a=>a.stato==='attivo'&&a.data_fine&&a.data_fine<=in30s).length;
  cnt+=DB.asd_scadenze.filter(s=>s.stato!=='completato'&&s.data_scadenza<=in30s).length;
  cnt+=DB.prenotazioni.filter(p=>p.data===oggi&&p.pagato==='da_pagare').length;
  const el=document.getElementById('notif-badge');
  if(el){el.textContent=cnt;el.style.display=cnt?'':'none';}
  const dot=document.getElementById('topbar-notif-dot');
  if(dot) dot.style.background=cnt?'var(--gold)':'var(--bg2)';

  // Badge chat — contatore messaggi non letti (demo: fisso a 3 se non c'è sistema reale)
  const chatUnread = DB.chat ? DB.chat.filter(m=>!m.letto).length : 3;
  const chatBadge=document.getElementById('chat-badge');
  if(chatBadge){chatBadge.textContent=chatUnread;chatBadge.style.display=chatUnread>0?'':'none';}


// === SPORT_SETTINGS ===

// ============================================================
// Gestione sport nelle impostazioni
// ============================================================

const homeChatBadge=document.getElementById('home-chat-badge');
  if(homeChatBadge){homeChatBadge.textContent=chatUnread;homeChatBadge.style.display=chatUnread>0?'block':'none';}
}
