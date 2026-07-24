function updateKpi(){
  const realToday=new Date().toISOString().split('T')[0];
  // Data effettiva per stats: usa oggi se ha dati, altrimenti la data seed più vicina
  const _hasTodayCassa=DB.cassa.some(m=>m.data===realToday);
  const today=(!_hasTodayCassa && DB.cassa.length)
    ? ([...new Set(DB.cassa.map(m=>m.data))].sort().find(d=>d>=realToday) || [...new Set(DB.cassa.map(m=>m.data))].sort().slice(-1)[0])
    : realToday;

  // Incasso: visibile solo a superadmin / admin
  const isAdmin = !DB.currentUser || DB.currentUser.ruolo==='superadmin' || DB.currentUser.ruolo==='admin';
  const incBox = document.getElementById('kpi-incasso-box');
  if(incBox) incBox.style.display = isAdmin ? '' : 'none';
  if(isAdmin){
    const incOggi=DB.cassa.filter(m=>m.data===today&&m.tipo==='entrata').reduce((s,m)=>s+m.importo,0);
    const movOggi=DB.cassa.filter(m=>m.data===today).length;
    const kv=document.getElementById('kpi-incasso');
    if(kv) kv.textContent='€ '+incOggi.toFixed(2).replace('.',',');
    const ks=document.getElementById('kpi-incasso-s');
    if(ks) ks.textContent=movOggi+(movOggi===1?' movimento':' movimenti')+' oggi';
  }

  // Badge chat header
  const chatCount = DB.chat ? DB.chat.filter(m=>!m.letto).length : 0;
  const topChatDot = document.getElementById('topbar-chat-dot');
  if(topChatDot) topChatDot.style.display = chatCount>0?'block':'none';

  // Aggiorna badge notifiche
  aggiornaNotifBadge();
  // Home campi live
  renderHomeCampi();
  // Home planner
  renderHomePlanner();
  // Statistiche home
  renderHomeStatsDay();
  renderHomeClassifica();
}

function renderHomeCampi(){
  const hc=document.getElementById('home-campi'); if(!hc) return;
  if(!DB.campi.length){hc.innerHTML='<div class="empty" style="padding:16px"><div class="empty-ic" style="font-size:24px">&#127967;</div><div style="font-size:11px;color:var(--text3)">Configura i campi</div></div>';return;}
  const now=new Date();
  const nowStr=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const _realTodayC=now.toISOString().split('T')[0];
  const _hasTodayC=DB.prenotazioni.some(p=>p.data===_realTodayC);
  const todayStr=(!_hasTodayC&&DB.prenotazioni.length)
    ?([...new Set(DB.prenotazioni.map(p=>p.data))].sort().find(d=>d>=_realTodayC)||[...new Set(DB.prenotazioni.map(p=>p.data))].sort()[0])
    :_realTodayC;
  const nowMin=now.getHours()*60+now.getMinutes();

  const TIPO_LABEL={rank:'&#127941; Ranking',amich:'Amichevole',torneo:'&#9889; Torneo',corso:'&#128218; Corso',prenotato:'&#128241; Pren.'};

  hc.innerHTML=DB.campi.map(c=>{
    // Trova occupazione attuale
    const pren=DB.prenotazioni.find(p=>p.campo_id===c.id&&p.data===todayStr&&p.inizio<=nowStr&&p.fine>nowStr);
    // Cerca anche eventi su quel campo
    const ev=DB.eventi&&DB.eventi.find(e=>e.campo_id===c.id&&e.data===todayStr&&e.inizio<=nowStr&&e.fine>nowStr);
    const occ = pren||ev;
    const colore = occ ? 'var(--red)' : 'var(--green)';
    const stato = occ ? 'Occupato' : 'Libero';

    let dettaglio='';
    if(occ){
      // Tipo attività
      const tipoLbl = TIPO_LABEL[occ.tipo]||occ.tipo||'Occupato';
      // Orario
      const orario = occ.inizio&&occ.fine ? `${occ.inizio} – ${occ.fine}` : '';
      // Occupanti
      let occupanti='';
      if(pren){
        const nomi=[pren.g1,pren.g2,pren.g3,pren.g4].filter(Boolean);
        if(nomi.length) occupanti=nomi.join(', ');
        else if(pren.note) occupanti=pren.note.substring(0,30);
      } else if(ev){
        // evento: nome + partecipanti se ci sono
        occupanti=ev.nome||(ev.iscritti?ev.iscritti.length+' iscritti':'');
      }
      dettaglio=`
        <div style="margin-top:5px;padding-top:5px;border-top:.5px solid var(--bdr2)">
          <div style="font-size:10px;font-weight:600;color:var(--text2);margin-bottom:2px">${tipoLbl} ${orario?'· '+orario:''}</div>
          ${occupanti?`<div style="font-size:10px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">&#128100; ${occupanti}</div>`:''}
        </div>`;
    } else {
      // Prossima prenotazione oggi
      const prossima=DB.prenotazioni.filter(p=>p.campo_id===c.id&&p.data===todayStr&&p.inizio>nowStr).sort((a,b)=>a.inizio.localeCompare(b.inizio))[0];
      if(prossima){
        dettaglio=`<div style="margin-top:5px;font-size:10px;color:var(--text3)">Prossima: ${prossima.inizio}</div>`;
      }
    }

    return `<div style="background:var(--bg);border-radius:7px;padding:9px 10px;border:.5px solid var(--bdr);margin-bottom:6px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1px">
        <div style="font-size:11px;font-weight:600">${c.nome}</div>
        <div style="display:flex;align-items:center;gap:4px;font-size:10px;font-weight:600;color:${colore}">
          <div style="width:5px;height:5px;border-radius:50%;background:${colore};flex-shrink:0"></div>${stato}
        </div>
      </div>
      <div style="font-size:9px;color:var(--text3)">${c.sport} · ${c.tipo}</div>
      ${dettaglio}
    </div>`;

// ====================================================
// SWITCH TAB STATISTICHE HOME
// ====================================================
function switchStatsTab(tab, btn){
  ['home-stats-day','home-stats-week','home-stats-month'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.style.display='none';
  });
  const show=document.getElementById('home-stats-'+tab); if(show) show.style.display='';
  document.querySelectorAll('#stats-tabs .btn').forEach(b=>{
    b.className='btn btn-ghost btn-sm'; b.style.cssText='font-size:10px;padding:3px 8px';
  });
  if(btn){ btn.className='btn btn-navy btn-sm'; btn.style.cssText='font-size:10px;padding:3px 8px'; }
  if(tab==='day')   renderHomeStatsDay();
  if(tab==='week')  renderHomeStatsWeek();
  if(tab==='month') renderHomeStatsMonth();
}

function _seedDate(){
  const rt=new Date().toISOString().split('T')[0];
  if(DB.prenotazioni.some(p=>p.data===rt)) return rt;
  const dates=[...new Set(DB.prenotazioni.map(p=>p.data))].sort();
  return dates.find(d=>d>=rt)||dates[0]||rt;
}

function renderHomeStatsDay(){
  const today=_seedDate();
  const prenOggi=DB.prenotazioni.filter(p=>p.data===today);
  let orePren=0;
  prenOggi.forEach(p=>{
    if(p.inizio&&p.fine){
      const [oh,om]=p.inizio.split(':').map(Number);
      const [fh,fm]=p.fine.split(':').map(Number);
      orePren+=(fh*60+fm-oh*60-om)/60;
    }
  });
  const centro=DB.centro; let oreAp=8;
  if(centro.orario_apertura&&centro.orario_chiusura){
    const [ah,am]=centro.orario_apertura.split(':').map(Number);
    const [ch,cm]=centro.orario_chiusura.split(':').map(Number);
    oreAp=(ch*60+cm-ah*60-am)/60;
  }
  const totOreDisp=oreAp*(DB.campi.length||1);
  const pct=totOreDisp>0?Math.round(Math.min(orePren,totOreDisp)/totOreDisp*100):0;
  const oreLib=Math.max(0,totOreDisp-orePren);
  const giocSet=new Set();
  prenOggi.forEach(p=>[p.g1,p.g2,p.g3,p.g4].filter(Boolean).forEach(g=>giocSet.add(g)));
  const el=id=>document.getElementById(id);
  if(el('stat-occ-pct'))  el('stat-occ-pct').textContent=pct+'%';
  if(el('stat-ore-pren')) el('stat-ore-pren').textContent=orePren.toFixed(1)+'h';
  if(el('stat-ore-lib'))  el('stat-ore-lib').textContent=oreLib.toFixed(1)+'h';
  if(el('stat-gioc'))     el('stat-gioc').textContent=giocSet.size;
}

function renderHomeStatsWeek(){
  const rt=new Date(); const rt0=_seedDate();
  const base=new Date(rt0+'T12:00:00');
  const mon=new Date(base); mon.setDate(base.getDate()-((base.getDay()+6)%7));
  const monStr=mon.toISOString().split('T')[0];
  const prenSet=DB.prenotazioni.filter(p=>p.data>=monStr&&p.data<=rt0);
  let oreTot=0;
  prenSet.forEach(p=>{
    if(p.inizio&&p.fine){
      const [oh,om]=p.inizio.split(':').map(Number);
      const [fh,fm]=p.fine.split(':').map(Number);
      oreTot+=(fh*60+fm-oh*60-om)/60;
    }
  });
  const centro=DB.centro; let oreAp=8;
  if(centro.orario_apertura&&centro.orario_chiusura){
    const [ah,am]=centro.orario_apertura.split(':').map(Number);
    const [ch,cm]=centro.orario_chiusura.split(':').map(Number);
    oreAp=(ch*60+cm-ah*60-am)/60;
  }
  const giorniPassati=Math.max(1,Math.ceil((new Date(rt0)-mon)/86400000));
  const totDisp=oreAp*(DB.campi.length||1)*giorniPassati;
  const pct=totDisp>0?Math.round(Math.min(oreTot,totDisp)/totDisp*100):0;
  const campoCnt={};
  prenSet.forEach(p=>{ campoCnt[p.campo_id]=(campoCnt[p.campo_id]||0)+1; });
  let topCampo='—';
  if(Object.keys(campoCnt).length){
    const tid=Object.entries(campoCnt).sort((a,b)=>b[1]-a[1])[0][0];
    const cam=DB.campi.find(x=>x.id==tid);
    topCampo=cam?cam.nome:'—';
  }
  const fasciaCnt={};
  prenSet.forEach(p=>{
    if(p.inizio){
      const h=parseInt(p.inizio);
      const f=h<13?'Mattina (07-13)':h<19?'Pomeriggio (13-19)':'Sera (19-23)';
      fasciaCnt[f]=(fasciaCnt[f]||0)+1;
    }
  });
  let topFascia='—';
  if(Object.keys(fasciaCnt).length) topFascia=Object.entries(fasciaCnt).sort((a,b)=>b[1]-a[1])[0][0];
  const el=id=>document.getElementById(id);
  if(el('stat-w-occ'))    el('stat-w-occ').textContent=pct+'%';
  if(el('stat-w-pren'))   el('stat-w-pren').textContent=prenSet.length;
  if(el('stat-w-campo'))  el('stat-w-campo').textContent=topCampo;
  if(el('stat-w-fascia')) el('stat-w-fascia').textContent=topFascia;
}

function renderHomeStatsMonth(){
  const rt0=_seedDate();
  const base=new Date(rt0+'T12:00:00');
  const mStart=base.getFullYear()+'-'+String(base.getMonth()+1).padStart(2,'0')+'-01';
  const prenMese=DB.prenotazioni.filter(p=>p.data>=mStart&&p.data<=rt0);
  const giocSet=new Set();
  prenMese.forEach(p=>[p.g1,p.g2,p.g3,p.g4].filter(Boolean).forEach(g=>giocSet.add(g)));
  const el=id=>document.getElementById(id);
  if(el('stat-m-pren')) el('stat-m-pren').textContent=prenMese.length;
  if(el('stat-m-gioc')) el('stat-m-gioc').textContent=giocSet.size;
  const STAR_RANGES=[
    {label:'⭐',min:0,max:1.99},{label:'⭐⭐',min:2,max:2.49},
    {label:'⭐⭐⭐',min:2.5,max:2.99},{label:'⭐⭐⭐⭐',min:3,max:3.49},{label:'⭐⭐⭐⭐⭐',min:3.5,max:99}
  ];
  const total=DB.giocatori.filter(g=>g.livello).length||1;
  const comm=el('stat-community');
  if(comm){
    comm.innerHTML=STAR_RANGES.map(r=>{
      const cnt=DB.giocatori.filter(g=>g.livello&&parseFloat(g.livello)>=r.min&&parseFloat(g.livello)<=r.max).length;
      const pct=Math.round(cnt/total*100);
      return `<div style="margin-bottom:7px"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-size:11px">${r.label}</span><span style="font-size:11px;font-weight:600;color:var(--gold)">${pct}%</span></div><div style="height:4px;background:var(--bdr);border-radius:2px;overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--gold);border-radius:2px"></div></div></div>`;
    }).join('');
  }
}

function renderHomeClassifica(){
  const hc=document.getElementById('home-classifica'); if(!hc) return;
  const cnt={};
  DB.prenotazioni.forEach(p=>[p.g1,p.g2,p.g3,p.g4].filter(Boolean).forEach(g=>{cnt[g]=(cnt[g]||0)+1;}));
  const sorted=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,8);
  if(!sorted.length){hc.innerHTML='<div class="empty" style="padding:20px"><div class="empty-ic">&#127942;</div><div style="font-size:11px;color:var(--text3)">Aggiungi prenotazioni per vedere la classifica</div></div>';return;}
  const MEDALS=['🥇','🥈','🥉'];
  hc.innerHTML=`<div style="font-size:10px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px">Top giocatori per presenze</div>`+sorted.map(([nome,partite],i)=>{
    const g=DB.giocatori.find(x=>(x.nome+' '+x.cognome).trim()===nome.trim());
    const livello=g?g.livello:'';
    return `<div style="display:flex;align-items:center;gap:9px;padding:6px 0;border-bottom:.5px solid var(--bdr2)"><div style="width:22px;text-align:center;font-size:${i<3?14:11}px">${MEDALS[i]||'<span style=color:var(--text3)>'+(i+1)+'</span>'}</div><div style="flex:1"><div style="font-size:12px;font-weight:500">${nome}</div>${livello?`<div style="font-size:10px;color:var(--text3)">Livello ${livello}</div>`:''}</div><div style="font-size:11px;font-weight:700;color:var(--gold)">${partite} 🎾</div></div>`;
  }).join('');
}


// === CASSA ===

// ============================================================
// Cassa & movimenti
// ============================================================

}).join('');
}
