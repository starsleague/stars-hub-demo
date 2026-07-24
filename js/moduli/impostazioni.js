function fillImpostazioni(){
  const f=(id,v)=>{const el=document.getElementById(id);if(el&&v!==undefined)el.value=v;};
  f('set-nome',DB.centro.nome);f('set-citta',DB.centro.citta);f('set-cap',DB.centro.cap);
  f('set-open',DB.centro.open);f('set-close',DB.centro.close);f('set-piva',DB.centro.piva);
  renderImpostCal();
  fillImpostazioniSport();
}

function saveImpostazioni(){
  DB.centro.nome=document.getElementById('set-nome').value.trim();
  DB.centro.citta=document.getElementById('set-citta').value.trim();
  DB.centro.cap=document.getElementById('set-cap').value.trim();
  DB.centro.piva=document.getElementById('set-piva').value.trim();
  DB.centro.open=document.getElementById('set-open').value;
  DB.centro.close=document.getElementById('set-close').value;
  updateSidebar(); fillSelects(); renderPlanner(); saveDB(); showToast('Impostazioni salvate');
}

function fillImpostazioniSport(){
  const el=document.getElementById('set-sport-lista'); if(!el) return;
  const ICONS={Padel:'🎾',Tennis:'🎾','Beach Tennis':'🏖️',Pickleball:'🏓',Calcio:'⚽',Fitness:'💪'};
  const ALL_SPORTS=['Padel','Tennis','Beach Tennis','Pickleball','Calcio','Fitness'];
  el.innerHTML=ALL_SPORTS.map(s=>{
    const active=DB.sport.includes(s);
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:.5px solid var(--bdr2)">
      <div style="display:flex;align-items:center;gap:8px"><span style="font-size:16px">${ICONS[s]||'🏅'}</span><span style="font-size:12px;font-weight:500">${s}</span></div>
      <div class="toggle ${active?'on':''}" onclick="toggleSport('${s}',this)"></div>
    </div>`;
  }).join('');
}

function toggleSport(sport,el){
  el.classList.toggle('on');
  const idx=DB.sport.indexOf(sport);
if(idx>=0) DB.sport.splice(idx,1);
  else DB.sport.push(sport);
  saveDB(); buildSportTabs(); fillSelects(); showToast(sport+(DB.sport.includes(sport)?' attivato':' disattivato'));
}

function initApp(){
  updateSidebar(); renderCampi(); renderGiocatori(); renderEventi(); renderCorsi(); renderStaff(); renderTodo();
  buildSportTabs(); fillSelects(); fillImpostazioni(); updateKpi(); updateTopbar();
  plannerDate=_initPlannerDate(); plannerMode='day'; renderPlanner();
  renderCassa(); renderAbbonamenti(); renderAsdHome(); renderAsdSoci(); renderAsdBilancio(); renderAsdDocs(); renderRuoli();
  initWaBtn();
  renderNotifiche(); aggiornaNotifBadge();
  updateStarsCoin(); updCartUI(); renderShopProdotti();
  initTurniWeek();
  renderCC(); renderAssemblee(); renderCoachHub();
}
