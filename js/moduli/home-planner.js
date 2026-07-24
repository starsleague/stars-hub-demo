function _initHomePlannerDate(){
  if(homePlannerDate) return;
  const today = new Date().toISOString().split('T')[0];
  const pren = (window.DB && DB.prenotazioni) ? DB.prenotazioni : [];
  const dates = [...new Set(pren.map(p=>p.data))].sort();
  const target = dates.find(d=>d>=today) || dates[0] || today;
  homePlannerDate = new Date(target+'T12:00:00');
}

function homePlannerDs(){ _initHomePlannerDate(); return homePlannerDate.toISOString().split('T')[0]; }

function homePlannerPrev(){
  homePlannerDate.setDate(homePlannerDate.getDate()-1);
  renderHomePlanner();
}

function homePlannerNext(){
  homePlannerDate.setDate(homePlannerDate.getDate()+1);
  renderHomePlanner();
}

function homePlannerGotoDate(ds){
  homePlannerDate = new Date(ds+'T12:00:00');
  renderHomePlanner();
}

function renderHomePlanner(){
  const wrap = document.getElementById('home-planner');
  if(!wrap) return;

  const ds = homePlannerDs();
  const campi = DB.campi;

  // Aggiorna label data nell'header
  const dpd = document.getElementById('home-planner-date');
  if(dpd){
    const oggi = new Date().toISOString().split('T')[0];
    const d = new Date(ds+'T12:00:00');
    const label = d.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    dpd.textContent = ds===oggi ? '🟢 Oggi — '+label : label;
  }

  if(!campi.length){
    wrap.innerHTML = '<div class="empty"><div class="empty-ic">🏟️</div><div class="empty-t">Nessun campo configurato</div></div>';
    return;
  }

  // Naviga
  const navHtml = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0 10px;border-bottom:.5px solid var(--bdr);margin-bottom:10px">
      <button class="pn-btn" onclick="homePlannerPrev()" style="font-size:16px;padding:4px 10px">←</button>
      <input type="date" value="${ds}" onchange="homePlannerGotoDate(this.value)"
        style="background:var(--bg);border:.5px solid var(--bdr);border-radius:6px;color:var(--text);padding:4px 8px;font-size:12px;font-family:var(--mono);cursor:pointer">
      <button class="pn-btn" onclick="homePlannerNext()" style="font-size:16px;padding:4px 10px">→</button>
    </div>`;

  // Slot orari (ogni 90 min, come planner completo)
  const openM  = toMins(DB.centro.open  || DB.centro.orario_apertura  || '08:00');
  const closeM = toMins(DB.centro.close || DB.centro.orario_chiusura || '23:00');
  const slots = [];
  for(let m=openM; m<closeM; m+=90){
    slots.push(`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`);
  }
  if(!slots.length) slots.push('08:00','09:30','11:00','12:30','14:00','15:30','17:00','18:30','20:00','21:30');

  const prenDay = DB.prenotazioni.filter(p=>p.data===ds);

  // Colori tipo
  const TCOL = {rank:'#f7a800',amich:'#3b5278',corso:'#22a96e',torneo:'#e05a2b',prenotato:'#3b82f6'};
  const TLAB = {rank:'Ranking',amich:'Amichevole',corso:'Corso',torneo:'Torneo',prenotato:'Prenotaz.'};

  // Header colonne
  let head = `<div style="display:flex;background:var(--navy-d);border-radius:8px 8px 0 0;overflow:hidden;min-width:0">`;
  head += `<div style="width:90px;min-width:90px;padding:7px 8px;color:rgba(255,255,255,.3);font-size:10px;border-right:.5px solid rgba(255,255,255,.08);flex-shrink:0">Campo</div>`;
  head += `<div style="display:flex;flex:1;overflow:hidden">`;
  slots.forEach(t=>{
    head += `<div style="flex:1;min-width:60px;text-align:center;padding:7px 2px;border-right:.5px solid rgba(255,255,255,.06)"><span style="color:rgba(255,255,255,.6);font-size:10px;font-family:var(--mono)">${t}</span></div>`;
  });
  head += `</div></div>`;

  // Righe campi
  let body = `<div style="border:.5px solid var(--bdr);border-top:none;border-radius:0 0 8px 8px;overflow:hidden">`;

  campi.forEach((campo, ci)=>{
    const prenCampo = prenDay.filter(p=>p.campo_id==campo.id);
    const borderB = ci < campi.length-1 ? 'border-bottom:.5px solid var(--bdr2)' : '';

    // Calcola copertura slot
    const covered = {};
    prenCampo.forEach(p=>{
      const si = slots.findIndex(s=>s===p.inizio);
      if(si<0){
        // inizio non esatto — trova lo slot che contiene l'inizio
        const piM = toMins(p.inizio);
        const found = slots.findIndex((s,idx)=>{
          const sM=toMins(s);
          const nM=idx+1<slots.length?toMins(slots[idx+1]):closeM;
          return piM>=sM && piM<nM;
        });
        if(found<0) return;
        const pFineM=toMins(p.fine);
        let span=0;
        for(let k=found;k<slots.length;k++){
          const nM=k+1<slots.length?toMins(slots[k+1]):closeM;
          if(toMins(slots[k])<pFineM) span++; else break;
        }
        for(let k=found;k<found+Math.max(1,span);k++) covered[k]={p,isStart:k===found,span:Math.max(1,span)};
        return;
      }
      const pFineM=toMins(p.fine);
      let span=0;
      for(let k=si;k<slots.length;k++){
        const nM=k+1<slots.length?toMins(slots[k+1]):closeM;
        if(toMins(slots[k])<pFineM) span++; else break;
      }
      for(let k=si;k<si+Math.max(1,span);k++) covered[k]={p,isStart:k===si,span:Math.max(1,span)};
    });

    body += `<div style="display:flex;${borderB}">`;
    // Etichetta campo
    body += `<div style="width:90px;min-width:90px;padding:6px 8px;border-right:.5px solid var(--bdr2);flex-shrink:0;background:var(--bg)">
      <div style="font-size:10px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${campo.nome}</div>
      <div style="font-size:9px;color:var(--text3)">${campo.sport}</div>
    </div>`;

    // Slot
    body += `<div style="display:flex;flex:1;overflow:hidden">`;
    slots.forEach((t,si)=>{
      const info = covered[si];
      if(info && !info.isStart) return; // consumato da evento multi-slot
      if(info){
        const p = info.p;
        const col = TCOL[p.tipo]||'#8b5cf6';
        const pagIc = {saldato:'✓',acconto:'⏳',da_pagare:'💶'}[p.pagato||'da_pagare'];
        const pagCol = {saldato:'#22a96e',acconto:'#f7a800',da_pagare:'#e05a2b'}[p.pagato||'da_pagare'];
        const nomi = [p.g1,p.g2,p.g3,p.g4].filter(Boolean);
        body += `<div style="flex:${info.span};min-width:${60*info.span}px;padding:2px;height:52px;position:relative;cursor:pointer" onclick="editPren(${p.id})">
          <div style="position:absolute;inset:2px;border-radius:5px;background:${col}22;border-left:3px solid ${col};padding:3px 5px;overflow:hidden">
            <div style="font-size:9px;font-weight:700;color:${col};display:flex;justify-content:space-between">
              <span>${TLAB[p.tipo]||p.tipo}</span>
              <span style="background:${pagCol};color:#fff;border-radius:3px;padding:0 3px">${pagIc}</span>
            </div>
            <div style="font-size:9px;color:var(--text3);font-family:var(--mono)">${p.inizio}–${p.fine}</div>
            ${nomi.length?`<div style="font-size:9px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${nomi.join(', ')}</div>`:''}
          </div>
        </div>`;
      } else {
        body += `<div style="flex:1;min-width:60px;height:52px;border-right:.5px solid var(--bdr2);cursor:pointer;transition:background .1s"
          onclick="openPrenSlot('${ds}',${campo.id},'${t}')"
          onmouseover="this.style.background='rgba(247,168,0,.06)'"
          onmouseout="this.style.background=\'\'"></div>`;
      }
    });
    body += `</div></div>`;
  });

  body += `</div>`;

  // Legenda
  const legenda = `<div style="display:flex;gap:10px;padding:8px 2px 2px;flex-wrap:wrap">
    ${Object.entries(TCOL).map(([k,v])=>`<div style="display:flex;align-items:center;gap:4px;font-size:10px;color:var(--text3)"><div style="width:8px;height:8px;border-radius:2px;background:${v}"></div>${TLAB[k]}</div>`).join('')}
    <span style="margin-left:auto;font-size:10px;color:var(--text3);font-style:italic">Clicca slot vuoto per prenotare</span>
  </div>`;

  // Riepilogo giorno
  const nPren = prenDay.length;
  const nCorsi = prenDay.filter(p=>p.tipo==='corso').length;
  const incasso = prenDay.filter(p=>p.pagato==='saldato').reduce((s,p)=>s+(+p.prezzo||0),0);
  const summary = nPren>0
    ? `<div style="display:flex;gap:12px;padding:0 2px 8px;font-size:11px;color:var(--text2)">
        <span>📋 <strong>${nPren}</strong> prenotazioni</span>
        ${nCorsi?`<span>📚 <strong>${nCorsi}</strong> corsi</span>`:''}
        <span style="margin-left:auto;color:var(--green);font-weight:600">€ ${incasso.toFixed(0)} incassati</span>
      </div>`
    : '<div style="padding:4px 0 8px;font-size:11px;color:var(--text3)">Nessuna prenotazione per questo giorno. Clicca uno slot per aggiungerne una.</div>';

  wrap.innerHTML = navHtml + summary + `<div style="overflow-x:auto">${head}${body}</div>` + legenda;
}
