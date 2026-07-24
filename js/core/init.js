// === BOOT ===
(function() {
  var m = document.getElementById('mainApp');
  if (m) m.style.display = 'flex';
  if (typeof initApp === 'function') {
    initApp();
    // Forza render home al primo caricamento
    if (typeof renderPlanner === 'function') renderPlanner();
    if (typeof renderCampiLive === 'function') renderCampiLive();
    if (typeof renderHomeRanking === 'function') renderHomeRanking();
  }
})();

function resetDB(){
  askConfirm('Reset completo?','Tutti i dati verranno cancellati. Questa operazione non è reversibile.','Reset',()=>{
    localStorage.removeItem('starsHubDB');
    location.reload();
  });
}

function toMins(t){ if(!t) return 0; const p=t.split(':'); return parseInt(p[0])*60+parseInt(p[1]||0); }

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
