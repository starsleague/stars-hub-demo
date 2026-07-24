// Data correntemente visualizzata nel planner home (inizializzato lazy)
let homePlannerDate = null;

// ════════════════════════════════════════════════════
// NAVIGAZIONE DATA HOME — frecce, label, calendario popup
// ════════════════════════════════════════════════════
var _homeCalMonth = new Date(); // mese visualizzato nel popup calendario

// ── Campi live — stato in tempo reale con timeline scorrevole
var _homeDateInitialized = false;
// ── Partite in attesa: prenotazioni senza campo o senza orario definito

function updateHomeDateLabel(){
  var el = document.getElementById('homeDateLabel');
  if(!el) return;
  var today = new Date(); today.setHours(0,0,0,0);
  var pd = new Date(plannerDate); pd.setHours(0,0,0,0);
  var isToday = pd.getTime() === today.getTime();
  var label = plannerDate.toLocaleDateString('it-IT', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
  label = label.charAt(0).toUpperCase() + label.slice(1);
  el.textContent = (isToday ? '📅 Oggi — ' : '') + label;
}

function homeDatePrev(){
  plannerDate.setDate(plannerDate.getDate()-1);
  updateHomeDateLabel();
  renderCampiLive();
}

function homeDateNext(){
  plannerDate.setDate(plannerDate.getDate()+1);
  updateHomeDateLabel();
  renderCampiLive();
}

function homeDateToday(){
  var today = new Date();
  var todayStr = today.toISOString().split('T')[0];
  var hasToday = DB.prenotazioni.some(function(p){ return p.data===todayStr; });
  if(hasToday){
    plannerDate = today;
  } else {
    // Nessuna prenotazione reale oggi (es. dati demo) → vai al giorno più vicino con dati invece di mostrare vuoto
    var dates = [...new Set(DB.prenotazioni.map(function(p){return p.data;}))].sort();
    var nearest = dates.find(function(d){return d>=todayStr;}) || dates[dates.length-1] || todayStr;
    plannerDate = new Date(nearest+'T12:00:00');
    showToast('Nessuna prenotazione oggi — mostro il giorno più vicino con dati');
  }
  updateHomeDateLabel();
  renderCampiLive();
  closeHomeCalendar();
}

function toggleHomeCalendar(){
  var popup = document.getElementById('homeCalendarPopup');
  if(!popup) return;
  var isOpen = popup.style.display !== 'none';
  if(isOpen){ closeHomeCalendar(); return; }
  _homeCalMonth = new Date(plannerDate);
  renderHomeCalGrid();
  popup.style.display = 'block';
  // Chiudi cliccando fuori
  setTimeout(function(){
    document.addEventListener('click', _homeCalOutsideClick);
  }, 10);
}

function closeHomeCalendar(){
  var popup = document.getElementById('homeCalendarPopup');
  if(popup) popup.style.display = 'none';
  document.removeEventListener('click', _homeCalOutsideClick);
}

function _homeCalOutsideClick(e){
  var popup = document.getElementById('homeCalendarPopup');
  var label = document.getElementById('homeDateLabel');
  if(!popup) return;
  if(!popup.contains(e.target) && e.target !== label){
    closeHomeCalendar();
  }
}

function homeCalMonthPrev(){ _homeCalMonth.setMonth(_homeCalMonth.getMonth()-1); renderHomeCalGrid(); }

function homeCalMonthNext(){ _homeCalMonth.setMonth(_homeCalMonth.getMonth()+1); renderHomeCalGrid(); }

function renderHomeCalGrid(){
  var grid = document.getElementById('homeCalGrid');
  var monthLbl = document.getElementById('homeCalMonthLabel');
  if(!grid || !monthLbl) return;

  var y = _homeCalMonth.getFullYear(), m = _homeCalMonth.getMonth();
  var label = _homeCalMonth.toLocaleDateString('it-IT', {month:'long', year:'numeric'});
  monthLbl.textContent = label.charAt(0).toUpperCase() + label.slice(1);

  var today = new Date(); today.setHours(0,0,0,0);
  var selDs = plannerDate.toISOString().split('T')[0];

  var cur = new Date(y, m, 1);
  var dow = cur.getDay(); dow = dow===0 ? 6 : dow-1; // lunedì=0
  cur.setDate(cur.getDate()-dow);

  var datesWithPren = new Set(DB.prenotazioni.map(function(p){return p.data;}));

  grid.innerHTML = '';
  for(var i=0; i<42; i++){
    var ds = cur.toISOString().split('T')[0];
    var isOtherMonth = cur.getMonth() !== m;
    var isToday = cur.getTime() === today.getTime();
    var isSelected = ds === selDs;
    var hasData = datesWithPren.has(ds);

    var cell = document.createElement('div');
    cell.textContent = cur.getDate();
    cell.style.cssText = 'text-align:center;padding:6px 0;border-radius:7px;cursor:pointer;font-size:11px;'
      + 'position:relative;transition:background .1s;'
      + 'color:' + (isOtherMonth ? 'var(--text3)' : 'var(--text)') + ';'
      + 'opacity:' + (isOtherMonth ? '.4' : '1') + ';'
      + 'background:' + (isSelected ? 'var(--gold)' : (isToday ? 'rgba(247,168,0,.12)' : 'transparent')) + ';'
      + 'font-weight:' + (isSelected ? '800' : (isToday ? '700' : '500')) + ';'
      + (isSelected ? 'color:var(--navy);' : '');

    if(hasData && !isSelected){
      var dot = document.createElement('div');
      dot.style.cssText = 'width:3px;height:3px;border-radius:50%;background:var(--gold);margin:2px auto 0';
      cell.appendChild(dot);
    }

    (function(dsCapture){
      cell.addEventListener('click', function(){
        plannerDate = new Date(dsCapture+'T12:00:00');
        updateHomeDateLabel();
        renderCampiLive();
        closeHomeCalendar();
      });
      cell.addEventListener('mouseover', function(){ if(ds!==selDs) this.style.background='rgba(247,168,0,.08)'; });
      cell.addEventListener('mouseout', function(){ if(ds!==selDs) this.style.background = isToday?'rgba(247,168,0,.12)':'transparent'; });
    })(ds);

    grid.appendChild(cell);
    cur.setDate(cur.getDate()+1);
  }
}

function toggleCampiLive(){
  var list  = document.getElementById('campi-live-scroll');
  var arrow = document.getElementById('campi-live-toggle-arrow');
  if(!list) return;
  var isOpen = list.style.display !== 'none';
  list.style.display = isOpen ? 'none' : 'flex';
  if(arrow) arrow.innerHTML = isOpen ? '&#9654; Mostra' : '&#9660; Nascondi';
}

function toggleWaitingPanel(){
  var list  = document.getElementById('waiting-pren-list');
  var arrow = document.getElementById('waiting-toggle-arrow');
  if(!list) return;
  var isOpen = list.style.display !== 'none';
  list.style.display = isOpen ? 'none' : 'flex';
  if(arrow) arrow.textContent = isOpen ? '▼ Mostra' : '▲ Nascondi';
  if(!isOpen) renderWaitingPren();
}

function renderWaitingPren(){
  var wrap = document.getElementById('waiting-pren-list');
  if(!wrap) return;
  wrap.innerHTML = '';

  var waiting = DB.prenotazioni.filter(function(p){
    return !p.campo_id || !p.inizio || !p.fine;
  }).sort(function(a,b){ return (a.data||'').localeCompare(b.data||''); });

  if(!waiting.length){
    wrap.innerHTML = '<div style="text-align:center;padding:20px 10px;color:var(--text3);font-size:11px;'
      + 'background:var(--surf);border:1px dashed var(--bdr);border-radius:10px">Nessuna partita in attesa</div>';
    return;
  }

  var TIPO_LABEL2 = {rank:'Ranking',amich:'Amichevole',torneo:'Torneo',corso:'Corso',prenotato:'Prenotazione',camp:'Campionato'};

  waiting.forEach(function(p){
    var nomi = [p.g1,p.g2,p.g3,p.g4].filter(Boolean);
    var card = document.createElement('div');
    card.style.cssText = 'background:var(--surf);border:1px solid rgba(247,168,0,.35);border-radius:10px;'
      + 'padding:10px 12px;cursor:pointer;transition:all .12s';
    card.addEventListener('mouseover', function(){ this.style.background='rgba(247,168,0,.05)'; });
    card.addEventListener('mouseout', function(){ this.style.background='var(--surf)'; });
    card.addEventListener('click', function(){ editPren(p.id); });

    var dataLbl = p.data ? new Date(p.data+'T12:00:00').toLocaleDateString('it-IT',{day:'numeric',month:'short'}) : '—';

    var head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:4px';
    var dateSpan = document.createElement('span');
    dateSpan.style.cssText = 'font-size:10px;font-weight:700;color:var(--gold)';
    dateSpan.textContent = '⏳ ' + dataLbl;
    var tipoSpan = document.createElement('span');
    tipoSpan.style.cssText = 'font-size:9px;color:var(--text3);background:var(--bg);padding:1px 6px;border-radius:8px';
    tipoSpan.textContent = TIPO_LABEL2[p.tipo] || p.tipo || 'Non def.';
    head.appendChild(dateSpan);
    head.appendChild(tipoSpan);

    var nomiEl = document.createElement('div');
    nomiEl.style.cssText = 'font-size:11px;color:var(--text2);margin-bottom:2px';
    nomiEl.textContent = nomi.length ? nomi.join(' · ') : 'Nessun giocatore inserito';

    var missingEl = document.createElement('div');
    missingEl.style.cssText = 'font-size:9px;color:var(--text3);font-style:italic';
    var missing = [];
    if(!p.campo_id) missing.push('campo');
    if(!p.inizio || !p.fine) missing.push('orario');
    missingEl.textContent = 'Manca: ' + missing.join(' e ');

    card.appendChild(head);
    card.appendChild(nomiEl);
    card.appendChild(missingEl);
    wrap.appendChild(card);
  });
}

function renderCampiLive(){
  var wrap = document.getElementById('campi-live-scroll');
  if(!wrap) return;
  wrap.innerHTML = '';
  if(!DB.campi.length){
    wrap.innerHTML = '<div class="empty" style="padding:32px 16px;text-align:center">'+
      '<div class="empty-ic" style="font-size:28px">&#127967;</div>'+
      '<div class="empty-t" style="margin:8px 0 4px">Nessun campo configurato</div>'+
      '<div style="font-size:11px;color:var(--text3);margin-bottom:12px">Aggiungi i campi per vedere il planner e registrare le prenotazioni.</div>'+
      '<button class="btn btn-primary btn-sm" onclick="nav(\'campi\',null)">Configura i campi &#8594;</button>'+
      '</div>';
    return;
  }

  var now  = new Date();
  var nowM = now.getHours()*60 + now.getMinutes();
  var today = now.toISOString().split('T')[0];

  // Alla primissima apertura posiziona plannerDate sul giorno con dati più vicino a oggi
  if(!_homeDateInitialized){
    _homeDateInitialized = true;
    var dates0 = [...new Set(DB.prenotazioni.map(function(p){return p.data;}))].sort();
    var auto = DB.prenotazioni.some(function(p){return p.data===today;})
      ? today
      : (dates0.find(function(d){return d>=today;}) || dates0[0] || today);
    plannerDate = new Date(auto+'T12:00:00');
  }

  var showDate = plannerDate.toISOString().split('T')[0];
  updateHomeDateLabel();

  var campi = DB.campi.filter(function(c){
    return plannerSport==='tutti' || c.sport===plannerSport;
  });

  var TIPO_LABEL = {
    rank:'Ranking', amich:'Amichevole', torneo:'Torneo',
    corso:'Corso/Lezione', prenotato:'Prenotazione', camp:'Campionato'
  };

  function toM(t){ if(!t) return 0; var p=t.split(':'); return parseInt(p[0])*60+parseInt(p[1]||0); }
  function _fmtOreParens(mins){
    var h = Math.floor(mins/60);
    var m = mins%60;
    return h + ':' + String(m).padStart(2,'0') + 'h';
  }
  function fmt(m){ return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); }

  // #1: slot dalla apertura alla chiusura del centro
  var _open  = toM(DB.centro.open  || DB.centro.orario_apertura  || '08:00');
  var _close = toM(DB.centro.close || DB.centro.orario_chiusura  || '23:00');
  var _openSnap  = Math.floor(_open  / 30) * 30;
  var _closeSnap = Math.ceil(_close / 30) * 30;
  var timeSlots = [];
  for(var _s = _openSnap; _s < _closeSnap; _s += 30) timeSlots.push(_s);

  campi.forEach(function(campo){
    var pren = DB.prenotazioni
      .filter(function(p){ return p.campo_id==campo.id && p.data===showDate; })
      .sort(function(a,b){ return toM(a.inizio)-toM(b.inizio); });

    var attuale  = pren.find(function(p){ return toM(p.inizio)<=nowM && toM(p.fine)>nowM; });
    var prossima = pren.find(function(p){ return toM(p.inizio)>nowM; });
    var isOcc    = !!attuale;
    var accentCol = isOcc ? '#e05a2b' : '#22a96e';

    // ── CARD
    var card = document.createElement('div');
    card.style.cssText = 'background:var(--surf);border:.5px solid var(--bdr);border-radius:12px;'
      + 'border-left:4px solid ' + accentCol + ';padding:14px 20px 12px;box-sizing:border-box;'
      + 'box-shadow:0 1px 4px rgba(0,0,0,.05);min-width:0;overflow:hidden';

    // ── RIGA 1: tutte le info
    var row1 = document.createElement('div');
    row1.style.cssText = 'display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:10px;min-width:0;overflow:hidden';

    // Nome campo
    var nameWrap = document.createElement('div');
    var nameEl = document.createElement('span');
    nameEl.style.cssText = 'font-size:14px;font-weight:800;color:var(--text)';
    nameEl.textContent = campo.nome;
    nameWrap.appendChild(nameEl);

    // Separatore
    function sep(){
      var s = document.createElement('span');
      s.style.cssText = 'width:1px;height:18px;background:var(--bdr);flex-shrink:0';
      return s;
    }

    // Stato: solo pallino (il colore del bordo già indica libero/occupato)
    // #8: rimuoviamo "LIBERO"/"OCCUPATO" — ridondante con il colore bordo
    var statoWrap = document.createElement('div');
    statoWrap.style.cssText = 'display:flex;align-items:center;gap:6px';
    var dot = document.createElement('span');
    dot.style.cssText = 'width:9px;height:9px;border-radius:50%;background:' + accentCol
      + ';flex-shrink:0' + (isOcc ? ';animation:pulse 1s infinite' : '');
    statoWrap.appendChild(dot);

    // #6: orario occupazione (centrato, in evidenza)
    if(isOcc){
      var orarioEl = document.createElement('span');
      orarioEl.style.cssText = 'font-size:13px;font-weight:800;color:' + accentCol + ';font-family:var(--mono)';
      orarioEl.textContent = attuale.inizio + '–' + attuale.fine;
      statoWrap.appendChild(orarioEl);
    }

    // #7: tipo attività corrente (sotto l'orario — gestito in tipoEl separato)
    var tipoEl = document.createElement('div');
    tipoEl.style.cssText = 'display:flex;flex-direction:column;gap:1px';
    if(isOcc){
      var nomiOcc = [attuale.g1,attuale.g2,attuale.g3,attuale.g4].filter(Boolean);
      var tipoTxt = document.createElement('span');
      tipoTxt.style.cssText = 'font-size:10px;font-weight:700;color:var(--text2)';
      tipoTxt.textContent = TIPO_LABEL[attuale.tipo] || attuale.tipo;
      tipoEl.appendChild(tipoTxt);
      if(nomiOcc.length){
        var nomiSpan = document.createElement('span');
        nomiSpan.style.cssText = 'font-size:10px;color:var(--text3)';
        nomiSpan.textContent = nomiOcc.join(' · ');
        tipoEl.appendChild(nomiSpan);
      }
    }

    // #8: timer — solo "X min (X:XXh)", senza "Libero tra/per"
    var timerEl = document.createElement('div');
    timerEl.style.cssText = 'display:flex;align-items:center;gap:5px';
    if(isOcc){
      var rim = toM(attuale.fine) - nowM;
      var timerTxt = document.createElement('span');
      timerTxt.style.cssText = 'font-size:11px;font-weight:700;color:var(--gold)';
      timerTxt.textContent = '⏱ ' + rim + ' min (' + _fmtOreParens(rim) + ')';
      timerEl.appendChild(timerTxt);
    } else if(prossima){
      // Campo libero: il tempo va accanto al pallino (stessa resa dell'occupato)
      var libPer = toM(prossima.inizio) - nowM;
      var libTxt = document.createElement('span');
      libTxt.style.cssText = 'font-size:13px;font-weight:800;color:' + accentCol + ';font-family:var(--mono)';
      libTxt.textContent = libPer + ' min (' + _fmtOreParens(libPer) + ')';
      statoWrap.appendChild(libTxt);
    }

    // Prossima prenotazione
    var proxEl = document.createElement('div');
    proxEl.style.cssText = 'display:flex;align-items:center;gap:5px';
    if(prossima){
      var proxTxt = document.createElement('span');
      proxTxt.style.cssText = 'font-size:11px;color:var(--text3)';
      proxTxt.textContent = 'Prossima: ' + prossima.inizio;
      var proxTipo = document.createElement('span');
      proxTipo.style.cssText = 'font-size:10px;font-weight:600;color:var(--text2);'
        + 'background:var(--bg);padding:1px 7px;border-radius:10px;border:.5px solid var(--bdr)';
      proxTipo.textContent = TIPO_LABEL[prossima.tipo] || prossima.tipo;
      proxEl.appendChild(proxTxt); proxEl.appendChild(proxTipo);
    }


    // Assembla riga 1: Nome | pallino+orario | tipo(sotto) | timer | prossima
    row1.appendChild(nameWrap);
    row1.appendChild(sep());
    row1.appendChild(statoWrap); // pallino + orario se occupato
    if(tipoEl.children.length){
      row1.appendChild(sep());
      row1.appendChild(tipoEl); // tipo sotto l'orario
    }
    if(timerEl.children.length){
      row1.appendChild(sep());
      row1.appendChild(timerEl); // "X min (X:XXh)"
    }
    if(proxEl.children.length){
      row1.appendChild(sep());
      row1.appendChild(proxEl);
    }

    // ── RIGA 2: slot orari
    var row2 = document.createElement('div');
    row2.style.cssText = 'overflow-x:auto;padding-bottom:4px;min-width:0;';
    // scrollbar sottile
    row2.style.scrollbarWidth = 'thin';

    var slotRow = document.createElement('div');
    slotRow.style.cssText = 'display:flex;gap:6px';

    // ── #2: genera slot liberi singoli + blocchi unificati per prenotazioni
    (function(){
      var rendered = []; // slotM già renderizzati
      timeSlots.forEach(function(slotM){
        if(rendered.indexOf(slotM) > -1) return; // già coperto da un blocco prenotazione

        var slotStr = fmt(slotM);
        var occ = pren.find(function(p){ return toM(p.inizio)<=slotM && toM(p.fine)>slotM; });
        var isNow = slotM<=nowM && slotM+30>nowM;
        var past  = slotM < nowM-30;

        if(occ){
          // Blocco unificato per tutta la durata della prenotazione
          var prenStart = Math.floor(toM(occ.inizio) / 30) * 30;
          var prenEnd   = Math.ceil(toM(occ.fine) / 30) * 30;
          var spans     = (prenEnd - prenStart) / 30;

          for(var _t = prenStart; _t < prenEnd; _t += 30) rendered.push(_t);

          var block = document.createElement('div');
          block.dataset.date  = showDate;
          block.dataset.campo = campo.id;
          block.dataset.slot  = fmt(prenStart);
          block.className     = 'live-slot';

          var blockW = spans * 58 + (spans - 1) * 6;
          block.style.cssText = 'width:' + blockW + 'px;min-width:' + blockW + 'px;height:58px;'
            + 'display:flex;flex-direction:column;align-items:stretch;justify-content:space-between;'
            + 'border-radius:8px;flex-shrink:0;cursor:pointer;padding:4px 5px;'
            + 'background:rgba(224,90,43,.13);'
            + 'border:1.5px solid rgba(224,90,43,.45);'
            + 'opacity:' + (past?'.38':'1') + ';'
            + 'transition:all .12s;box-sizing:border-box;gap:3px';

          // Riga superiore: orario + tipo
          var topRow = document.createElement('div');
          topRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:4px;flex-shrink:0';
          var lblTime = document.createElement('span');
          lblTime.style.cssText = 'font-size:9px;color:#c04020;font-family:var(--mono);font-weight:700;white-space:nowrap';
          lblTime.textContent = occ.inizio + '–' + occ.fine;
          topRow.appendChild(lblTime);
          if(spans >= 2){
            var lblTipo = document.createElement('span');
            lblTipo.style.cssText = 'font-size:8px;color:rgba(192,64,32,.7);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
            lblTipo.textContent = TIPO_LABEL[occ.tipo] || occ.tipo || '';
            topRow.appendChild(lblTipo);
          }
          block.appendChild(topRow);

          // Riquadro interno bianco con nomi giocatori
          var nomiPren = [occ.g1, occ.g2, occ.g3, occ.g4].filter(Boolean);
          var nomiBox = document.createElement('div');
          nomiBox.style.cssText = 'background:#fff;border-radius:5px;padding:2px 5px;'
            + 'flex:1;min-height:0;display:flex;align-items:center;overflow:hidden';
          var nomiTxt = document.createElement('span');
          nomiTxt.style.cssText = 'font-size:8.5px;font-weight:600;color:var(--navy);'
            + 'overflow:hidden;text-overflow:ellipsis;line-height:1.3;width:100%';
          if(nomiPren.length === 0){
            nomiTxt.style.color = '#aaa';
            nomiTxt.textContent = 'Nessun giocatore';
          } else if(nomiPren.length <= 2 || spans <= 2){
            nomiTxt.style.whiteSpace = 'nowrap';
            nomiTxt.textContent = nomiPren.join(' · ');
          } else {
            nomiTxt.style.whiteSpace = 'normal';
            nomiTxt.style.fontSize   = '8px';
            var metaA = nomiPren.slice(0,2).join(' & ');
            var metaB = nomiPren.slice(2,4).join(' & ');
            nomiTxt.textContent = metaA + ' vs ' + metaB;
          }
          nomiBox.appendChild(nomiTxt);
          block.appendChild(nomiBox);

          block.addEventListener('mouseover', function(){ this.style.filter='brightness(1.08)'; this.style.transform='scale(1.01)'; });
          block.addEventListener('mouseout',  function(){ this.style.filter=''; this.style.transform=''; });
          block.addEventListener('click', function(){
            if(typeof editPren==='function') editPren(occ.id);
          });

          slotRow.appendChild(block);

        } else {
          // Slot libero singolo (30min)
          var slot = document.createElement('div');
          slot.dataset.date  = showDate;
          slot.dataset.campo = campo.id;
          slot.dataset.slot  = slotStr;
          slot.className     = 'live-slot';

          var bg, borderCol, txtCol, fw;
          if(isNow){
            bg='rgba(30,49,74,.12)'; borderCol='var(--navy)'; txtCol='var(--navy)'; fw='800';
          } else {
            bg='rgba(34,169,110,.09)'; borderCol='rgba(34,169,110,.4)'; txtCol='#1a8a5a'; fw='600';
          }

          slot.style.cssText = 'min-width:58px;height:58px;display:flex;align-items:center;'
            + 'justify-content:center;border-radius:8px;flex-shrink:0;'
            + 'background:' + bg + ';'
            + 'border:1.5px solid ' + borderCol + ';'
            + 'cursor:pointer;'
            + 'opacity:' + (past?'.38':'1') + ';'
            + 'transition:all .12s';

          var lbl = document.createElement('span');
          lbl.style.cssText = 'font-size:11px;color:' + txtCol + ';font-family:var(--mono);font-weight:' + fw;
          lbl.textContent = slotStr;
          slot.appendChild(lbl);

          slot.addEventListener('mouseover', function(){ this.style.filter='brightness(1.2)'; this.style.transform='scale(1.05)'; });
          slot.addEventListener('mouseout',  function(){ this.style.filter=''; this.style.transform=''; });
          slot.addEventListener('click', function(){
            if(typeof openPrenSlot==='function')
              openPrenSlot(this.dataset.date, parseInt(this.dataset.campo), this.dataset.slot);
          });

          slotRow.appendChild(slot);
          rendered.push(slotM);
        }
      });
    })();

    row2.appendChild(slotRow);
    card.appendChild(row1);
    card.appendChild(row2);
    wrap.appendChild(card);
  });
}
