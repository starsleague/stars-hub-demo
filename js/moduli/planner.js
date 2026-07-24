// Apre modal prenotazione con campo e orario precompilati
// openPrenSlot definita più sotto (versione unica)


// === PLANNER ===

// ============================================================
// Planner / calendario prenotazioni
// ============================================================

// ====================================================
// PLANNER
// ====================================================
let plannerMode='day', plannerSport='tutti';

let plannerDate=new Date();

// Colori e icone per sport — usati per il banner identificativo nel planner
const SPORT_META={
  'tutti':     {colore:'var(--navy)',  bg:'rgba(30,49,74,.07)',   ic:'&#127968;', label:'Tutti gli sport'},
  'Padel':     {colore:'#0a7abf',     bg:'rgba(10,122,191,.09)', ic:'&#127934;', label:'Padel'},
  'Tennis':    {colore:'#22a96e',     bg:'rgba(34,169,110,.09)', ic:'&#127936;', label:'Tennis'},
  'Beach Tennis':{colore:'#e09a2b',   bg:'rgba(224,154,43,.1)',  ic:'&#127958;', label:'Beach Tennis'},
  'Pickleball':{colore:'#8b5cf6',     bg:'rgba(139,92,246,.09)', ic:'&#127955;', label:'Pickleball'},
  'Calcio':    {colore:'#22a96e',     bg:'rgba(34,169,110,.09)', ic:'&#9917;',   label:'Calcio'},
  'Fitness':   {colore:'#e05a2b',     bg:'rgba(224,90,43,.09)',  ic:'&#127947;', label:'Fitness'},
};

// ====================================================
let editPrenId=null;

// ════════════════════════════════════════════════════
// SELETTORE GIOCATORI A COPPIE — Coppia A vs Coppia B
// ════════════════════════════════════════════════════

var prenGiocatoriState = { a1:null, a2:null, b1:null, b2:null };
var _giocSearchTarget = null; // quale slot sta cercando ora: 'a1','a2','b1','b2'

let waMsg='';

function _initPlannerDate(){
  const today = new Date().toISOString().split('T')[0];
  if(!DB||!DB.prenotazioni.length) return new Date();
  if(DB.prenotazioni.some(p=>p.data===today)) return new Date();
  const dates=[...new Set(DB.prenotazioni.map(p=>p.data))].sort();
  const t=dates.find(d=>d>=today)||dates[0];
  return new Date(t+'T12:00:00');
}

function setSportTab(s,el){
  document.querySelectorAll('#sport-tabs-pl .s-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  plannerSport=s;

  // Aggiorna banner sport attivo
  const banner=document.getElementById('planner-sport-banner');
  if(banner){
    if(s==='tutti'){
      banner.style.display='none';
    } else {
      const meta=SPORT_META[s]||{colore:'var(--navy)',bg:'rgba(30,49,74,.07)',ic:'&#127968;',label:s};
      banner.style.display='flex';
      banner.style.background=meta.bg;
      banner.style.borderColor=meta.colore;
      banner.style.color=meta.colore;
      document.getElementById('planner-sport-banner-ic').innerHTML=meta.ic;
      document.getElementById('planner-sport-banner-txt').textContent='Stai visualizzando: '+meta.label;
      // Conta prenotazioni visibili
      const dateStr=plannerDate.toISOString().split('T')[0];
      const n=DB.prenotazioni.filter(p=>{
        const c=DB.campi.find(x=>x.id===p.campo_id);
        return p.data===dateStr&&c&&c.sport===s;
      }).length;
      document.getElementById('planner-sport-banner-sub').textContent=n+' prenotazioni oggi';
    }
  }

  renderPlanner();
}

function togglePlannerView(){
  if(plannerMode==='day'){plannerMode='month';document.getElementById('pl-day').style.display='none';document.getElementById('pl-month').style.display='block';document.getElementById('btn-cal-tog').textContent='Giorno';renderMonthCal();}
  else{plannerMode='day';document.getElementById('pl-month').style.display='none';document.getElementById('pl-day').style.display='block';document.getElementById('btn-cal-tog').textContent='Mese';renderDayView();}
  updatePlannerLbl();
}

function plannerNext(){
  if(plannerMode==='month'){plannerDate.setMonth(plannerDate.getMonth()+1);renderMonthCal();}
  else{plannerDate.setDate(plannerDate.getDate()+1);renderDayView();}
  updatePlannerLbl();
}

function plannerPrev(){
  if(plannerMode==='month'){plannerDate.setMonth(plannerDate.getMonth()-1);renderMonthCal();}
  else{plannerDate.setDate(plannerDate.getDate()-1);renderDayView();}
  updatePlannerLbl();
}

function updatePlannerLbl(){
  const el=document.getElementById('planner-lbl'); if(!el) return;
  if(plannerMode==='month') el.textContent=plannerDate.toLocaleDateString('it-IT',{month:'long',year:'numeric'});
  else el.textContent=plannerDate.toLocaleDateString('it-IT',{weekday:'short',day:'numeric',month:'long',year:'numeric'});
}

function renderPlanner(){updatePlannerLbl();if(plannerMode==='month')renderMonthCal();else renderDayView();renderCampiLive();renderHomeRanking();renderWaitingPren();}

function renderMonthCal(){
  const body=document.getElementById('cal-body'); if(!body) return;
  const y=plannerDate.getFullYear(),m=plannerDate.getMonth();
  const today=new Date(); let cur=new Date(y,m,1); let dow=cur.getDay(); dow=dow===0?6:dow-1;
  cur.setDate(cur.getDate()-dow);
  const last=new Date(y,m+1,0);
  const TCOLORS={rank:'var(--gold)',amich:'var(--navy)',corso:'var(--green)',torneo:'var(--red)',prenotato:'var(--blue)'};
  let html='';
  for(let r=0;r<6;r++){
    for(let c=0;c<7;c++){
      const ds=cur.toISOString().split('T')[0];
      const isT=cur.toDateString()===today.toDateString(),isO=cur.getMonth()!==m;
      const isC=DB.centro.chiusure_date.includes(ds)||(DB.centro.chiusure_wd.length&&DB.centro.chiusure_wd.includes(cur.getDay()));
      const pDay=DB.prenotazioni.filter(p=>p.data===ds&&(plannerSport==='tutti'||cById(p.campo_id)?.sport===plannerSport));
      const dots=pDay.slice(0,4).map(p=>`<div class="cal-ev-dot" style="background:${TCOLORS[p.tipo]||'var(--slate)'}"></div>`).join('');
      const dayN=cur.getDate();
      html+=`<div class="cal-cell${isT?' today':''}${isO?' other-month':''}${isC?' chiusa':''}" onclick="goToDay('${ds}')">
        <div class="cal-day">${dayN}</div>
        <div style="display:flex;flex-wrap:wrap">${dots}</div>
        ${isC&&!isO?'<div style="font-size:8px;color:var(--red)">Chiuso</div>':''}
      </div>`;
      cur.setDate(cur.getDate()+1);
    }
    if(cur>last&&r>=3) break;
  }
  body.innerHTML=html;
}

function goToDay(ds){
  plannerDate=new Date(ds+'T12:00:00'); plannerMode='day';
  document.getElementById('pl-month').style.display='none'; document.getElementById('pl-day').style.display='block';
  document.getElementById('btn-cal-tog').textContent='&#128198; Mese';
  renderDayView(); updatePlannerLbl();
}

function renderDayView(){
  const campi=DB.campi.filter(c=>plannerSport==='tutti'||c.sport===plannerSport);
  const head=document.getElementById('dv-head'), body=document.getElementById('dv-body');
  if(!campi.length){head.innerHTML='';body.innerHTML='<div class="empty" style="padding:40px"><div class="empty-ic">&#127967;</div><div class="empty-t">Nessun campo configurato</div><button class="btn btn-primary btn-sm" onclick="nav(\'campi\',null)">Configura &#8594;</button></div>';return;}
  const slots=buildSlots();
  const ds=plannerDate.toISOString().split('T')[0];
  const dayP=DB.prenotazioni.filter(p=>p.data===ds&&(plannerSport==='tutti'||cById(p.campo_id)?.sport===plannerSport));
  // Chiusure
  const dow=plannerDate.getDay();
  const chiuso=(DB.centro.chiusure_date||[]).includes(ds)||(DB.centro.chiusure_wd||[]).includes(dow);
  // HEAD: corner + time headers
  head.style.cssText='display:flex;background:var(--navy-d)';
  head.innerHTML=`<div style="width:120px;min-width:120px;padding:10px 8px;border-right:.5px solid rgba(255,255,255,.1);flex-shrink:0;color:rgba(255,255,255,.3);font-size:10px">Campo / Ora</div><div style="display:flex;flex:1">${slots.map(t=>`<div style="min-width:90px;flex:1;text-align:center;padding:10px 4px;border-right:.5px solid rgba(255,255,255,.08)"><span style="color:rgba(255,255,255,.7);font-size:11px;font-weight:600;font-family:var(--mono)">${t}</span></div>`).join('')}</div>`;
  if(chiuso){
    body.innerHTML='<div class="empty" style="padding:40px;grid-column:1/-1"><div class="empty-ic">🔒</div><div class="empty-t">Centro chiuso</div><div class="empty-s">Giorno di chiusura impostato nelle configurazioni</div></div>';
    return;
  }
  // BODY: one row per campo — events span multiple slots
  let bhtml='';
  campi.forEach(campo=>{
    bhtml+=`<div style="display:flex;border-bottom:.5px solid var(--bdr2)">`;
    bhtml+=`<div class="dv-campo-label" style="width:130px;min-width:130px;border-bottom:2px solid var(--bdr)"><div class="dv-campo-n">${campo.nome}</div></div>`;
    bhtml+=`<div style="display:flex;flex:1;position:relative">`;
    // Track which slots are covered by a multi-slot event
    const covered={};
    dayP.filter(p=>p.campo_id==campo.id).forEach(p=>{
      const si=slots.indexOf(p.inizio);
      if(si<0) return;
      // How many slots does this event span?
      const pFineM=toMins(p.fine);
      let span=0;
      for(let k=si;k<slots.length;k++){
        const nextSlotM=k+1<slots.length?toMins(slots[k+1]):toMins(DB.centro.close||'23:00');
        if(toMins(slots[k])<pFineM) span++;
        else break;
      }
      span=Math.max(1,span);
      for(let k=si;k<si+span;k++) covered[k]={pren:p,isStart:k===si,span};
    });
    slots.forEach((t,si)=>{
      const info=covered[si];
      if(info&&!info.isStart){bhtml+='';return;} // slot consumed by spanning event — skip
      const isOcc=!!info;
      const slotStyle=`min-width:44px;flex:${info?info.span:1};height:60px;border-right:.5px solid var(--bdr2);position:relative;transition:background .1s;background:${isOcc?'rgba(224,90,43,.10)':'rgba(34,169,110,.07)'};cursor:${isOcc?'default':'pointer'}`;
      if(info){
        const p=info.pren;
        const giocatori=[p.g1,p.g2,p.g3,p.g4].filter(Boolean).join(', ')||'';
        const pagCol={da_pagare:'rgba(224,90,43,.9)',acconto:'rgba(247,168,0,.9)',saldato:'rgba(34,169,110,.9)'}[p.pagato||'da_pagare'];
        const pagIc={da_pagare:'💶',acconto:'⏳',saldato:'✓'}[p.pagato||'da_pagare'];
        bhtml+=`<div style="${slotStyle}" onclick="editPren(${p.id});event.stopPropagation()">
          <div class="dv-ev ${p.tipo}" style="inset:2px;position:absolute;border-radius:5px;padding:3px 6px;overflow:hidden;cursor:pointer;z-index:2">
            <div class="dv-ev-n">${tipoLbl(p.tipo)} <span style="font-size:8px;background:${pagCol};color:#fff;padding:1px 4px;border-radius:3px;margin-left:2px">${pagIc}</span></div>
            <div class="dv-ev-t" style="font-size:9px;opacity:.7;font-family:var(--mono)">${p.inizio}&ndash;${p.fine}</div>
            ${giocatori?`<div style="font-size:9px;opacity:.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${giocatori}</div>`:''}
          </div>
        </div>`;
      } else {
        bhtml+=`<div style="${slotStyle}" onclick="openPrenSlot('${ds}',${campo.id},'${t}')" onmouseover="this.style.background='rgba(34,169,110,.18)'" onmouseout="this.style.background='rgba(34,169,110,.07)'" title="Prenota ${t}"></div>`;
      }
    });
    bhtml+=`</div></div>`;
  });
  body.innerHTML=bhtml;
}

function buildSlots(){
  const [oh,om]=(DB.centro.open||DB.centro.orario_apertura||'08:00').split(':').map(Number);
  const [ch,cm]=(DB.centro.close||DB.centro.orario_chiusura||'23:00').split(':').map(Number);
  const s=[]; let h=oh,m=om;
  while(h<ch||(h===ch&&m<cm)){
    s.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    m+=30;if(m>=60){h+=Math.floor(m/60);m%=60;}
  }
  return s.length?s:['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30','22:00','22:30'];
}

function cById(id){return DB.campi.find(c=>c.id==id);} // == per compatibilità string/number

function tipoLbl(t){return{rank:'&#127941; Ranking',amich:'Amichevole',torneo:'&#9889; Torneo',corso:'&#128218; Corso',prenotato:'&#128241; Prenotazione'}[t]||t;}

function _aggiornaGiocList(){
  const dl=document.getElementById('gioc-list'); if(!dl) return;
  dl.innerHTML=DB.giocatori.map(g=>`<option value="${g.nome} ${g.cognome}">${g.sport?'['+g.sport+']':''}</option>`).join('');
}

function _giocRanking(g){
  return parseFloat(g.livello) || 0;
}

function _giocInitial(g){
  return (g.nome||'?')[0].toUpperCase();
}

function _slotCardHtml(slot, player){
  if(!player){
    return '<button type="button" class="gioc-slot-btn" data-slot="'+slot+'" '
      + 'style="width:100%;padding:10px 8px;border-radius:10px;border:1.5px dashed var(--bdr);'
      + 'background:var(--surf);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;'
      + 'transition:all .12s">'
      + '<span style="font-size:18px;color:var(--text3)">+</span>'
      + '<span style="font-size:10px;color:var(--text3);font-weight:600">Aggiungi</span>'
      + '</button>';
  }
  var rk = _giocRanking(player);
  return '<button type="button" class="gioc-slot-btn" data-slot="'+slot+'" '
    + 'style="width:100%;padding:8px;border-radius:10px;border:1.5px solid var(--gold);'
    + 'background:rgba(247,168,0,.06);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;position:relative">'
    + '<span style="position:absolute;top:3px;right:5px;font-size:9px;color:var(--text3);cursor:pointer" data-clear="'+slot+'">&#10005;</span>'
    + '<div style="width:34px;height:34px;border-radius:10px;background:var(--gold);color:var(--navy);'
    + 'display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px">'+_giocInitial(player)+'</div>'
    + '<span style="font-size:10px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:90px">'+player.nome+'</span>'
    + '<span style="font-size:9px;color:var(--gold);font-weight:700">&#127941; '+rk.toFixed(2)+'</span>'
    + '</button>';
}

function _avgRanking(p1, p2){
  if(!p1 && !p2) return null;
  var vals = [p1,p2].filter(Boolean).map(_giocRanking);
  if(!vals.length) return null;
  return vals.reduce(function(a,b){return a+b;},0) / vals.length;
}

function renderGiocPicker(){
  var wrap = document.getElementById('gioc-picker-wrap');
  if(!wrap) return;

  var avgA = _avgRanking(prenGiocatoriState.a1, prenGiocatoriState.a2);
  var avgB = _avgRanking(prenGiocatoriState.b1, prenGiocatoriState.b2);

  function teamBlock(label, slot1, slot2, color, avg){
    var p1 = prenGiocatoriState[slot1];
    var p2 = prenGiocatoriState[slot2];
    return '<div style="flex:1;background:var(--bg);border-radius:10px;padding:10px;border-top:3px solid '+color+'">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'
        + '<span style="font-size:11px;font-weight:800;color:'+color+';letter-spacing:.4px">'+label+'</span>'
        + (avg!==null ? '<span style="font-size:11px;font-weight:700;color:var(--text2)">Media: <span style="color:'+color+'">'+avg.toFixed(2)+'</span></span>' : '')
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
        + _slotCardHtml(slot1, p1)
        + _slotCardHtml(slot2, p2)
      + '</div>'
    + '</div>';
  }

  wrap.innerHTML =
      '<div style="display:flex;gap:10px">'
        + teamBlock('COPPIA A', 'a1', 'a2', '#22a96e', avgA)
        + teamBlock('COPPIA B', 'b1', 'b2', '#3b82f6', avgB)
      + '</div>'
    + '<div id="gioc-search-wrap" style="display:none;margin-top:10px;background:var(--surf);border:1px solid var(--gold);border-radius:10px;padding:10px">'
      + '<input type="text" id="gioc-search-input" placeholder="Cerca giocatore per nome..." '
      + 'style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:.5px solid var(--bdr);font-size:13px;margin-bottom:8px">'
      + '<div id="gioc-search-results" style="max-height:180px;overflow-y:auto;display:flex;flex-direction:column;gap:4px"></div>'
    + '</div>';

  // Listener bottoni slot
  wrap.querySelectorAll('.gioc-slot-btn').forEach(function(btn){
    btn.addEventListener('click', function(e){
      if(e.target.dataset.clear){
        prenGiocatoriState[e.target.dataset.clear] = null;
        renderGiocPicker();
        _checkAutoTipo();
        return;
      }
      _openGiocSearch(this.dataset.slot);
    });
  });

  _checkAutoTipo();
}

function _openGiocSearch(slot){
  _giocSearchTarget = slot;
  var box = document.getElementById('gioc-search-wrap');
  var input = document.getElementById('gioc-search-input');
  if(!box || !input) return;
  box.style.display = 'block';
  input.value = '';
  input.focus();
  _renderGiocSearchResults('');

  input.oninput = function(){ _renderGiocSearchResults(this.value); };
}

function _renderGiocSearchResults(query){
  var resWrap = document.getElementById('gioc-search-results');
  if(!resWrap) return;
  var q = (query||'').trim().toLowerCase();

  var usedIds = Object.values(prenGiocatoriState).filter(Boolean).map(function(p){return p.id;});

  var results = DB.giocatori
    .filter(function(g){
      if(usedIds.indexOf(g.id)>-1) return false;
      if(!q) return true;
      var full = (g.nome+' '+g.cognome).toLowerCase();
      return full.indexOf(q) > -1;
    })
    .slice(0, 30);

  if(!results.length){
    resWrap.innerHTML = '<div style="text-align:center;padding:14px;color:var(--text3);font-size:12px">Nessun giocatore trovato</div>';
    return;
  }

  resWrap.innerHTML = results.map(function(g){
    var rk = _giocRanking(g);
    return '<div class="gioc-result-row" data-id="'+g.id+'" style="display:flex;align-items:center;gap:10px;padding:7px 8px;'
      + 'border-radius:8px;cursor:pointer;transition:background .1s">'
      + '<div style="width:30px;height:30px;border-radius:9px;background:rgba(247,168,0,.12);color:var(--gold);'
      + 'font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+_giocInitial(g)+'</div>'
      + '<span style="flex:1;font-size:12px;font-weight:600;color:var(--text)">'+g.nome+' '+g.cognome+'</span>'
      + '<span style="font-size:11px;font-weight:700;color:var(--gold)">&#127941; '+rk.toFixed(2)+'</span>'
    + '</div>';
  }).join('');

  resWrap.querySelectorAll('.gioc-result-row').forEach(function(row){
    row.addEventListener('mouseover', function(){ this.style.background='rgba(247,168,0,.08)'; });
    row.addEventListener('mouseout',  function(){ this.style.background=''; });
    row.addEventListener('click', function(){
      var id = parseInt(this.dataset.id);
      var g  = DB.giocatori.find(function(x){return x.id===id;});
      if(g && _giocSearchTarget){
        prenGiocatoriState[_giocSearchTarget] = g;
        document.getElementById('gioc-search-wrap').style.display = 'none';
        renderGiocPicker();
        _checkAutoTipo();
      }
    });
  });
}

function _checkAutoTipo(){
  var tipoSel = document.getElementById('pren-tipo');
  var badge   = document.getElementById('pren-tipo-auto');
  if(!tipoSel) return;

  var filled = ['a1','a2','b1','b2'].map(function(s){return prenGiocatoriState[s];});
  var count  = filled.filter(Boolean).length;

  if(count === 4 && !tipoSel.value){
    tipoSel.value = 'rank';
    if(badge) badge.textContent = '(rilevato automaticamente)';
    renderWaPreview();
    updatePrenPrezzo();
  } else if(badge && tipoSel.value !== 'rank'){
    badge.textContent = '';
  }
}

function _syncGiocToHidden(){
  var order = ['a1','a2','b1','b2'];
  order.forEach(function(slot, i){
    var p = prenGiocatoriState[slot];
    var hidden = document.getElementById('pg'+(i+1));
    if(hidden) hidden.value = p ? (p.nome+' '+p.cognome) : '';
  });
}

function _resetGiocState(){
  prenGiocatoriState = { a1:null, a2:null, b1:null, b2:null };
}

function _loadGiocFromPren(p){
  _resetGiocState();
  var slots = ['a1','a2','b1','b2'];
  [p.g1, p.g2, p.g3, p.g4].forEach(function(nomeCompleto, i){
    if(!nomeCompleto) return;
    var g = DB.giocatori.find(function(x){ return (x.nome+' '+x.cognome).trim()===nomeCompleto.trim(); });
    if(g) prenGiocatoriState[slots[i]] = g;
  });
}

function _fillPrenCampi(){
  const sel=document.getElementById('pren-campo'); if(!sel) return;
  const prev=sel.value;
  sel.innerHTML='<option value="">&#8212; Da definire (lista attesa) &#8212;</option>'+
    DB.campi.map(c=>`<option value="${c.id}">${c.nome} &#8212; ${c.sport}</option>`).join('');
  if(prev) sel.value=prev;
}

function openNewPren(){
  editPrenId=null;
  document.getElementById('mPrenTitle').textContent='📅 Nuova prenotazione';
  document.getElementById('pren-del-btn').style.display='none';
  document.getElementById('pren-data').value=new Date().toISOString().split('T')[0];
  document.getElementById('pren-inizio').value='09:00'; document.getElementById('pren-fine').value='10:30';
  document.getElementById('pren-tipo').value='';
  const auto=document.getElementById('pren-tipo-auto'); if(auto) auto.textContent='';
  const pg=document.getElementById('pren-pagato'); if(pg) pg.value='da_pagare';
  ['pg1','pg2','pg3','pg4'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  _resetGiocState();
  _fillPrenCampi();
  const sel=document.getElementById('pren-campo'); if(sel) sel.value='';
  updatePrenDurata(); renderWaPreview(); renderGiocPicker(); openModal('modalPren');
}

function openWaitingPren(){
  openNewPren();
  setTimeout(function(){
    document.getElementById('pren-inizio').value='';
    document.getElementById('pren-fine').value='';
    const sel=document.getElementById('pren-campo'); if(sel) sel.value='';
    const hint=document.getElementById('pren-dur-hint');
    if(hint) hint.textContent='⏳ Partita in attesa — campo e orario da definire in seguito';
    updatePrenPrezzo();
  }, 50);
}

function editPren(id){
  const p=DB.prenotazioni.find(x=>x.id===id); if(!p) return;
  editPrenId=id;
  _fillPrenCampi();
  document.getElementById('mPrenTitle').textContent='✏️ Modifica prenotazione';
  document.getElementById('pren-del-btn').style.display='';
  document.getElementById('pren-data').value=p.data;
  document.getElementById('pren-inizio').value=p.inizio; document.getElementById('pren-fine').value=p.fine;
  document.getElementById('pren-tipo').value=p.tipo;
  const auto=document.getElementById('pren-tipo-auto'); if(auto) auto.textContent='';
  const pg=document.getElementById('pren-pagato'); if(pg) pg.value=p.pagato||'da_pagare';
  ['pg1','pg2','pg3','pg4'].forEach((id,i)=>{const el=document.getElementById(id);if(el)el.value=p['g'+(i+1)]||'';});
  const sel=document.getElementById('pren-campo');
  for(let o of sel.options){if(parseInt(o.value)===p.campo_id){o.selected=true;break;}}
  _loadGiocFromPren(p);
  updatePrenDurata(); renderWaPreview(); renderGiocPicker(); openModal('modalPren');
}

function openPrenSlot(ds, campoId, t){
  openNewPren();
  setTimeout(function(){
    document.getElementById('pren-data').value = ds;
    document.getElementById('pren-inizio').value = t;
    const [h,m] = t.split(':').map(Number);
    const tot = h*60 + m + 90;
    document.getElementById('pren-fine').value = `${String(Math.floor(tot/60)).padStart(2,'0')}:${String(tot%60).padStart(2,'0')}`;
    const sel = document.getElementById('pren-campo');
    if(sel) for(let o of sel.options){ if(o.value == campoId){ o.selected=true; break; } }
    updatePrenDurata(); updatePrenPrezzo(); renderWaPreview();
  }, 60);
}

function calcPrenPrezzo(campo,inizio,fine){
  if(!campo||!campo.t1p) return 0;
  const durH=(toMins(fine)-toMins(inizio))/60;
  const ini=toMins(inizio);
  const t1s=toMins(campo.t1s||'08:00'),t1e=toMins(campo.t1e||'18:00');
  return ini>=t1s&&ini<t1e ? +(campo.t1p*durH).toFixed(2) : +(campo.t2p*durH).toFixed(2);
}

function checkConflict(campoId,data,inizio,fine,skipId){
  return DB.prenotazioni.some(p=>{
    if(p.campo_id!==campoId||p.data!==data) return false;
    if(skipId&&p.id===skipId) return false;
    return toMins(inizio)<toMins(p.fine)&&toMins(fine)>toMins(p.inizio);
  });
}

function _checkCampoConflict(){
  const campoId=parseInt(document.getElementById('pren-campo')?.value);
  const data=document.getElementById('pren-data')?.value;
  const inizio=document.getElementById('pren-inizio')?.value;
  const fine=document.getElementById('pren-fine')?.value;
  const warnEl=document.getElementById('pren-campo-warn');
  if(!campoId||!data||!inizio||!fine) return;
  const conflict=checkConflict(campoId,data,inizio,fine,editPrenId);
  if(conflict){
    if(!warnEl){
      const sel=document.getElementById('pren-campo');
      const w=document.createElement('div');
      w.id='pren-campo-warn';
      w.style.cssText='font-size:11px;color:var(--red);font-weight:600;margin-top:4px';
      w.textContent='⚠️ Campo già occupato in questo orario';
      sel.parentNode.appendChild(w);
    }
  } else if(warnEl){
    warnEl.remove();
  }
}

function savePren(){
  _syncGiocToHidden();
  const data=document.getElementById('pren-data').value;
  const campoRaw=document.getElementById('pren-campo').value;
  const campoId=campoRaw ? parseInt(campoRaw) : null;
  const inizio=document.getElementById('pren-inizio').value;
  const fine=document.getElementById('pren-fine').value;
  const tipo=document.getElementById('pren-tipo').value;
  const pagato=document.getElementById('pren-pagato')?.value||'da_pagare';
  if(!data){showToast('Inserisci almeno la data');return;}
  // Se campo e orario sono entrambi presenti, valida orario e conflitti normalmente
  const isWaiting = !campoId || !inizio || !fine;
  if(!isWaiting){
    if(inizio>=fine){showToast('Orario fine deve essere dopo inizio');return;}
    if(checkConflict(campoId,data,inizio,fine,editPrenId)){showToast('⚠️ Campo già occupato in questo orario — impossibile salvare');return;}
  }
  const campo=campoId ? cById(campoId) : null;
  const prezzo=(campo&&inizio&&fine&&inizio<fine) ? calcPrenPrezzo(campo,inizio,fine) : 0;
  const gioc={g1:document.getElementById('pg1').value.trim(),g2:document.getElementById('pg2').value.trim(),g3:document.getElementById('pg3').value.trim(),g4:document.getElementById('pg4').value.trim()};
  if(editPrenId){
    const old=DB.prenotazioni.find(x=>x.id===editPrenId);
    const wasS=old.pagato==='saldato';
    Object.assign(old,{data,campo_id:campoId,inizio,fine,tipo,prezzo,pagato,...gioc});
    if(pagato==='saldato'&&!wasS) aggMovCassa(old,'Prenotazione '+(campo?.nome||'in attesa')+' '+data,prezzo,'Prenotazioni','entrata');
    showToast(isWaiting?'Partita in attesa aggiornata':'Prenotazione aggiornata');
  } else {
    const p={id:nid(),data,campo_id:campoId,inizio,fine,tipo,prezzo,pagato,...gioc};
    DB.prenotazioni.push(p);
    if(pagato==='saldato'&&campo) aggMovCassa(p,'Prenotazione '+campo.nome+' '+data,prezzo,'Prenotazioni','entrata');
    showToast(isWaiting?'Partita aggiunta alle attese':'Prenotazione salvata');
  }
  saveDB(); closeModal('modalPren'); renderPlanner(); updateKpi(); renderCassa();
}

function deletePrenModal(){
  askConfirm('Elimina prenotazione?','','Elimina',()=>{
    DB.prenotazioni=DB.prenotazioni.filter(p=>p.id!==editPrenId);
    saveDB(); closeModal('modalPren'); renderPlanner(); updateKpi(); renderCassa(); showToast('Prenotazione eliminata');
  });
}

function _snapTo30(timeStr){
  if(!timeStr) return timeStr;
  const [h,m]=timeStr.split(':').map(Number);
  const snapped=Math.round(m/30)*30;
  const hh=(snapped===60) ? h+1 : h;
  const mm=(snapped===60) ? 0 : snapped;
  return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
}

function updatePrenDurata(){
  const inEl=document.getElementById('pren-inizio');
  const fiEl=document.getElementById('pren-fine');
  if(inEl && inEl.value){ const snapped=_snapTo30(inEl.value); if(snapped!==inEl.value) inEl.value=snapped; }
  if(fiEl && fiEl.value){ const snapped=_snapTo30(fiEl.value); if(snapped!==fiEl.value) fiEl.value=snapped; }
  const s=inEl?.value;
  const e=fiEl?.value;
  const el=document.getElementById('pren-dur-hint'); if(!s||!e||!el) return;
  const [sh,sm]=s.split(':').map(Number), [eh,em]=e.split(':').map(Number);
  const mins=(eh*60+em)-(sh*60+sm);
  el.textContent=mins>0?`Durata: ${mins} minuti`:'⚠ Orario fine prima di inizio';
  updatePrenPrezzo(); renderWaPreview();
}

function updatePrenPrezzo(){
  const campoId=parseInt(document.getElementById('pren-campo')?.value);
  const inizio=document.getElementById('pren-inizio')?.value;
  const fine=document.getElementById('pren-fine')?.value;
  const el=document.getElementById('pren-prezzo-show'); if(!el) return;
  if(!campoId||!inizio||!fine||inizio>=fine){el.textContent='€ 0,00';return;}
  const campo=cById(campoId);
  const p=calcPrenPrezzo(campo,inizio,fine);
  el.textContent='€ '+p.toFixed(2).replace('.',',');
}

function renderWaPreview(){
  const tipo=document.getElementById('pren-tipo')?.value;
  const sec=document.getElementById('wa-section'); if(!sec) return;
  if(tipo!=='rank'&&tipo!=='amich'){sec.style.display='none';return;}
  sec.style.display='block';
  const data=document.getElementById('pren-data')?.value||'—';
  const ini=document.getElementById('pren-inizio')?.value||'—';
  const fin=document.getElementById('pren-fine')?.value||'—';
  const cEl=document.getElementById('pren-campo');
  const cN=cEl?.options[cEl?.selectedIndex]?.text||'—';
  const g=[1,2,3,4].map(i=>document.getElementById('pg'+i)?.value||'— slot libero');
  waMsg=`PARTITA APERTA\nData: ${data}\nOre: ${ini}–${fin}\nCampo: ${cN}\n${g.map((x,i)=>` ${i+1}. ${x}`).join('\n')}\nAggiungiti!`;
  document.getElementById('wa-preview').textContent=waMsg;
}

function initWaBtn(){
  const btn=document.getElementById('wa-copy-btn');
  if(!btn) return;
  btn.addEventListener('click',()=>{
    if(!waMsg) return;
    if(navigator.clipboard) navigator.clipboard.writeText(waMsg).then(()=>showToast('Messaggio copiato!'));
    else{const ta=document.createElement('textarea');ta.value=waMsg;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();showToast('Messaggio copiato!');}
  });
}

function renderHomeKpiStrip(){
  const el=document.getElementById('home-kpi-strip'); if(!el) return;
  const ds=plannerDate.toISOString().split('T')[0];
  const p=DB.prenotazioni.filter(x=>x.data===ds);
  const liberi=DB.campi.length-new Set(p.map(x=>x.campo_id)).size;
  const inc=p.filter(x=>x.pagato==='saldato').reduce((s,x)=>s+(+x.prezzo||0),0);
  const gioc=new Set(p.flatMap(x=>[x.g1,x.g2,x.g3,x.g4].filter(Boolean))).size;
  const corsi=p.filter(x=>x.tipo==='corso').length;
  const kpis=[
    {ic:'📋',v:p.length,l:'Prenotazioni'},
    {ic:'🟢',v:liberi,l:'Campi liberi'},
    {ic:'👥',v:gioc,l:'Giocatori'},
    {ic:'📚',v:corsi,l:'Corsi'},
    {ic:'💰',v:'€'+inc.toFixed(0),l:'Incassato'},
  ];
  el.innerHTML=kpis.map(k=>`<div style="background:var(--surf);border:.5px solid var(--bdr);border-radius:8px;padding:8px 14px;display:flex;align-items:center;gap:8px;flex:1;min-width:90px"><span style="font-size:16px">${k.ic}</span><div><div style="font-size:15px;font-weight:700;color:var(--text)">${k.v}</div><div style="font-size:10px;color:var(--text3)">${k.l}</div></div></div>`).join('');
}

function buildSportSelect(){
  const sel=document.getElementById('sport-filter-sel'); if(!sel) return;
  const sports=['tutti',...new Set(DB.campi.map(c=>c.sport).filter(Boolean))];
  sel.innerHTML=sports.map(s=>`<option value="${s}">${s==='tutti'?'Tutti i campi':s}</option>`).join('');
  sel.value=plannerSport;
}

function setSportFromSelect(sel){
  plannerSport=sel.value;
  renderPlanner();
}
