// ============================================================
// PSL Dev Notes — Tool sviluppatori
// Clicca qualsiasi elemento per annotarlo, esporta .md per Claude
// ============================================================
(function () {

  var STORE = 'psl_dev_notes';
  var notes = [];
  try { notes = JSON.parse(localStorage.getItem(STORE) || '[]'); } catch(e){}

  var SEZIONI = [
    'Home / Planner','Campi','Giocatori','Tornei ed Eventi',
    'Corsi e Lezioni','Cassa','Abbonamenti','Statistiche',
    'Impostazioni','ASD','Staff & Turni','Sidebar / Header','Altro'
  ];
  var TIPI = [
    { val:'modifica',  label:'✏️ Modifica',  col:'#3b82f6' },
    { val:'bug',       label:'🐛 Bug',        col:'#e05a2b' },
    { val:'richiesta', label:'✨ Richiesta',  col:'#22a96e' },
    { val:'rimuovi',   label:'🗑 Rimuovi',    col:'#8b5cf6' },
  ];

  var pickMode = false;    // modalità selezione elemento attiva
  var pickedEl = null;     // elemento selezionato
  var pickedSelector = ''; // selettore CSS dell'elemento

  // ── CSS
  var style = document.createElement('style');
  style.textContent = [
    /* bottone toggle */
    '#dn-btn{position:fixed;bottom:22px;right:22px;z-index:99999;width:44px;height:44px;',
    'border-radius:50%;background:#1e314a;border:2px solid #f7a800;color:#f7a800;font-size:20px;',
    'cursor:pointer;display:flex;align-items:center;justify-content:center;',
    'box-shadow:0 4px 20px rgba(0,0,0,.5);transition:transform .15s;user-select:none;}',
    '#dn-btn:hover{transform:scale(1.1);}',
    '#dn-btn.open{background:#f7a800;color:#1e314a;}',

    /* banner modalità selezione */
    '#dn-banner{position:fixed;top:0;left:0;right:0;z-index:99997;',
    'background:#f7a800;color:#0f1c2e;font-family:system-ui,sans-serif;',
    'font-size:13px;font-weight:700;text-align:center;padding:9px 16px;',
    'letter-spacing:.3px;display:none;pointer-events:none;}',
    '#dn-banner.on{display:block;}',

    /* highlight hover in pick mode */
    '.dn-hover-ring{outline:2.5px dashed #f7a800 !important;',
    'outline-offset:2px !important;cursor:crosshair !important;}',

    /* pannello */
    '#dn-panel{position:fixed;bottom:76px;right:22px;z-index:99998;width:400px;',
    'max-height:80vh;background:#0f1c2e;border:1px solid #243a56;border-radius:14px;',
    'font-family:system-ui,sans-serif;color:#e2eaf4;',
    'box-shadow:0 16px 48px rgba(0,0,0,.7);display:none;flex-direction:column;overflow:hidden;}',
    '#dn-panel.open{display:flex;}',

    '#dn-head{padding:13px 16px;border-bottom:1px solid #1a2e45;',
    'display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}',
    '#dn-head strong{font-size:13px;color:#f7a800;}',
    '#dn-count{font-size:11px;color:#4a6a8a;background:#1a2e45;padding:2px 8px;border-radius:10px;}',

    /* pulsante pick */
    '#dn-pick-btn{width:100%;padding:9px;margin-bottom:8px;',
    'background:#1a2e45;border:1.5px dashed #f7a800;border-radius:8px;',
    'color:#f7a800;font-size:12px;font-weight:700;cursor:pointer;',
    'display:flex;align-items:center;justify-content:center;gap:6px;}',
    '#dn-pick-btn:hover{background:#243a56;}',
    '#dn-pick-btn.active{background:#f7a800;color:#0f1c2e;border-style:solid;}',

    /* elemento selezionato */
    '#dn-picked{font-size:10px;color:#4a6a8a;font-family:monospace;',
    'background:#08111e;padding:5px 9px;border-radius:5px;margin-bottom:8px;',
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:none;}',
    '#dn-picked.on{display:block;}',

    '#dn-form{padding:12px 14px;border-bottom:1px solid #1a2e45;flex-shrink:0;}',
    '#dn-selrow{display:flex;gap:6px;margin-bottom:8px;}',
    '#dn-tipo,#dn-sez{flex:1;background:#08111e;border:.5px solid #243a56;border-radius:6px;',
    'color:#e2eaf4;font-size:12px;padding:6px 8px;outline:none;cursor:pointer;}',
    '#dn-tipo:focus,#dn-sez:focus{border-color:#f7a800;}',
    '#dn-text{width:100%;box-sizing:border-box;background:#08111e;border:.5px solid #243a56;',
    'border-radius:6px;color:#e2eaf4;font-size:12px;padding:8px 10px;',
    'font-family:system-ui,sans-serif;resize:vertical;min-height:80px;outline:none;',
    'margin-bottom:8px;line-height:1.5;}',
    '#dn-text:focus{border-color:#f7a800;}',
    '#dn-add{width:100%;padding:8px;background:#f7a800;color:#0f1c2e;border:none;',
    'border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;}',
    '#dn-add:hover{background:#ffc62e;}',

    /* lista note */
    '#dn-list{overflow-y:auto;flex:1;padding:8px 10px;}',
    '.dn-item{background:#08111e;border-radius:8px;padding:10px 12px;margin-bottom:6px;',
    'border-left:3px solid #243a56;position:relative;}',
    '.dn-meta{display:flex;align-items:center;gap:6px;margin-bottom:5px;flex-wrap:wrap;}',
    '.dn-tipo{font-size:10px;font-weight:700;}',
    '.dn-sez{font-size:10px;color:#4a6a8a;background:#1a2e45;padding:1px 7px;border-radius:4px;}',
    '.dn-el{font-size:9px;color:#2a4a6a;font-family:monospace;margin-top:2px;',
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.dn-testo{font-size:12px;color:#b8cce0;line-height:1.5;white-space:pre-wrap;margin-top:4px;}',
    '.dn-del{position:absolute;top:8px;right:8px;background:none;border:none;color:#2a4a6a;',
    'cursor:pointer;font-size:13px;padding:2px 5px;border-radius:4px;}',
    '.dn-del:hover{background:#e05a2b;color:#fff;}',
    '.dn-empty{text-align:center;padding:28px 16px;color:#2a4a6a;font-size:12px;}',

    /* footer */
    '#dn-foot{padding:10px 12px;border-top:1px solid #1a2e45;display:flex;gap:6px;flex-shrink:0;}',
    '#dn-export{flex:1;padding:8px;background:#1a3a5c;color:#e2eaf4;border:none;',
    'border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;}',
    '#dn-export:hover{background:#243a56;}',
    '#dn-clear{padding:8px 12px;background:#e05a2b;color:#fff;border:none;',
    'border-radius:7px;font-size:13px;cursor:pointer;}',

    /* toast */
    '#dn-toast{position:fixed;bottom:78px;right:78px;z-index:100000;',
    'background:#22a96e;color:#fff;font-size:12px;font-weight:600;',
    'padding:8px 16px;border-radius:8px;pointer-events:none;',
    'opacity:0;transition:opacity .25s;font-family:system-ui,sans-serif;}',
    '#dn-toast.show{opacity:1;}',
  ].join('');
  document.head.appendChild(style);

  // ── Elementi fissi nel DOM
  var banner = document.createElement('div');
  banner.id = 'dn-banner';
  banner.textContent = '🎯 Clicca un elemento per annotarlo — ESC per annullare';
  document.body.appendChild(banner);

  var btn = document.createElement('button');
  btn.id = 'dn-btn';
  btn.title = 'Dev Notes (Shift+N)';
  btn.innerHTML = '📝';
  document.body.appendChild(btn);

  var toastEl = document.createElement('div');
  toastEl.id = 'dn-toast';
  document.body.appendChild(toastEl);

  var panel = document.createElement('div');
  panel.id = 'dn-panel';
  document.body.appendChild(panel);

  // ── Costruisci pannello
  var tipoOpts = TIPI.map(function(t){
    return '<option value="'+t.val+'">'+t.label+'</option>';
  }).join('');
  var sezOpts = SEZIONI.map(function(s){
    return '<option>'+s+'</option>';
  }).join('');

  panel.innerHTML = [
    '<div id="dn-head">',
      '<strong>📝 Dev Notes</strong>',
      '<span id="dn-count">0 note</span>',
    '</div>',
    '<div id="dn-form">',
      /* pulsante pick */
      '<button id="dn-pick-btn">🎯 Seleziona elemento sulla pagina</button>',
      '<div id="dn-picked"></div>',
      '<div id="dn-selrow">',
        '<select id="dn-tipo">'+tipoOpts+'</select>',
        '<select id="dn-sez">'+sezOpts+'</select>',
      '</div>',
      '<textarea id="dn-text" placeholder="Descrivi cosa deve cambiare...&#10;Ctrl+Invio per salvare"></textarea>',
      '<button id="dn-add">+ Aggiungi nota</button>',
    '</div>',
    '<div id="dn-list"></div>',
    '<div id="dn-foot">',
      '<button id="dn-export">⬇️ Esporta .md per Claude</button>',
      '<button id="dn-clear" title="Cancella tutto">🗑</button>',
    '</div>',
  ].join('');

  // ── Refs
  var pickBtn   = panel.querySelector('#dn-pick-btn');
  var pickedDiv = panel.querySelector('#dn-picked');
  var tipoSel   = panel.querySelector('#dn-tipo');
  var sezSel    = panel.querySelector('#dn-sez');
  var textArea  = panel.querySelector('#dn-text');
  var addBtn    = panel.querySelector('#dn-add');
  var listDiv   = panel.querySelector('#dn-list');
  var exportBtn = panel.querySelector('#dn-export');
  var clearBtn  = panel.querySelector('#dn-clear');

  // ── Helpers
  function save() { localStorage.setItem(STORE, JSON.stringify(notes)); }

  function toast(msg, col) {
    toastEl.textContent = msg;
    toastEl.style.background = col || '#22a96e';
    toastEl.classList.add('show');
    setTimeout(function(){ toastEl.classList.remove('show'); }, 2200);
  }

  function getSelector(el) {
    if (!el || el === document.body) return 'body';
    var id   = el.id ? '#'+el.id : '';
    var cls  = el.className && typeof el.className === 'string'
      ? '.'+el.className.trim().split(/\s+/).slice(0,2).join('.') : '';
    return (el.tagName.toLowerCase() + (id || cls)).slice(0, 60);
  }

  function getSection() {
    var active = document.querySelector('.page.active');
    if (active) return active.id.replace('page-','') || 'home';
    return 'home';
  }

  // ── Pick mode
  function startPick() {
    pickMode = true;
    pickBtn.classList.add('active');
    pickBtn.textContent = '⏳ Clicca un elemento… (ESC per annullare)';
    banner.classList.add('on');
    panel.classList.remove('open');
    btn.classList.remove('open');
    document.body.style.cursor = 'crosshair';
  }

  function stopPick() {
    pickMode = false;
    pickBtn.classList.remove('active');
    pickBtn.innerHTML = '🎯 Seleziona elemento sulla pagina';
    banner.classList.remove('on');
    document.body.style.cursor = '';
    if (pickedEl) pickedEl.classList.remove('dn-hover-ring');
  }

  function confirmPick(el) {
    pickedEl = el;
    pickedSelector = getSelector(el);
    // Autoseleziona sezione dal page attivo
    var sec = getSection();
    for (var i = 0; i < SEZIONI.length; i++) {
      if (SEZIONI[i].toLowerCase().indexOf(sec.toLowerCase()) !== -1) {
        sezSel.value = SEZIONI[i];
        break;
      }
    }
    pickedDiv.textContent = '📌 ' + pickedSelector;
    pickedDiv.classList.add('on');
    stopPick();
    panel.classList.add('open');
    btn.classList.add('open');
    setTimeout(function(){ textArea.focus(); }, 80);
    toast('Elemento selezionato ✓');
  }

  // ── Hover in pick mode
  var hoverEl = null;
  document.addEventListener('mouseover', function(e) {
    if (!pickMode) return;
    var el = e.target;
    // Ignora elementi interni al tool
    if (el.closest && el.closest('#dn-banner,#dn-btn,#dn-panel,#dn-toast')) return;
    if (hoverEl) hoverEl.classList.remove('dn-hover-ring');
    hoverEl = el;
    el.classList.add('dn-hover-ring');
  }, true);

  document.addEventListener('mouseout', function(e) {
    if (!pickMode) return;
    if (e.target === hoverEl) {
      e.target.classList.remove('dn-hover-ring');
      hoverEl = null;
    }
  }, true);

  // ── Click in pick mode (capture phase)
  document.addEventListener('click', function(e) {
    if (!pickMode) return;
    var el = e.target;
    if (el.closest && el.closest('#dn-banner,#dn-btn,#dn-panel,#dn-toast')) return;
    e.preventDefault();
    e.stopPropagation();
    if (hoverEl) hoverEl.classList.remove('dn-hover-ring');
    confirmPick(el);
  }, true);

  // ── ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (pickMode) { stopPick(); return; }
      if (panel.classList.contains('open')) {
        panel.classList.remove('open');
        btn.classList.remove('open');
      }
    }
    // Shift+N toggle
    if (e.key === 'N' && e.shiftKey
        && document.activeElement.tagName !== 'INPUT'
        && document.activeElement.tagName !== 'TEXTAREA') {
      btn.click();
    }
  });

  // ── Render lista note
  function renderList() {
    panel.querySelector('#dn-count').textContent =
      notes.length + (notes.length === 1 ? ' nota' : ' note');

    if (!notes.length) {
      listDiv.innerHTML = '<div class="dn-empty">Nessuna nota.<br>Seleziona un elemento o scrivi direttamente.</div>';
      return;
    }

    listDiv.innerHTML = notes.map(function(n, i) {
      var t = TIPI.find(function(x){ return x.val === n.tipo; }) || TIPI[0];
      return [
        '<div class="dn-item" style="border-color:'+t.col+'">',
          '<button class="dn-del" data-i="'+i+'">✕</button>',
          '<div class="dn-meta">',
            '<span class="dn-tipo" style="color:'+t.col+'">'+t.label+'</span>',
            '<span class="dn-sez">'+n.sezione+'</span>',
          '</div>',
          n.elemento ? '<div class="dn-el">'+n.elemento+'</div>' : '',
          '<div class="dn-testo">'+n.testo.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>',
        '</div>',
      ].join('');
    }).join('');

    listDiv.querySelectorAll('.dn-del').forEach(function(b) {
      b.addEventListener('click', function() {
        notes.splice(parseInt(this.getAttribute('data-i')), 1);
        save(); renderList();
      });
    });
  }

  // ── Aggiungi nota
  addBtn.addEventListener('click', function() {
    var testo = textArea.value.trim();
    if (!testo) { toast('Scrivi qualcosa!', '#e05a2b'); return; }
    notes.push({
      tipo:     tipoSel.value,
      sezione:  sezSel.value,
      elemento: pickedSelector || '',
      testo:    testo,
      ts:       new Date().toLocaleString('it-IT')
    });
    save();
    textArea.value = '';
    pickedEl = null;
    pickedSelector = '';
    pickedDiv.textContent = '';
    pickedDiv.classList.remove('on');
    renderList();
    toast('Nota aggiunta ✓');
    textArea.focus();
  });

  // Ctrl+Invio
  textArea.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addBtn.click();
  });

  // ── Pick button
  pickBtn.addEventListener('click', function() {
    if (pickMode) { stopPick(); return; }
    startPick();
  });

  // ── Esporta .md
  exportBtn.addEventListener('click', function() {
    if (!notes.length) { toast('Nessuna nota da esportare', '#e05a2b'); return; }
    var oggi = new Date().toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'});
    var lines = [
      '# PSL Stars Hub — Note sviluppatori',
      '',
      '**Data:** '+oggi+'  ',
      '**Note:** '+notes.length,
      '',
      '---',
      '',
    ];
    var bySez = {};
    notes.forEach(function(n){
      if (!bySez[n.sezione]) bySez[n.sezione] = [];
      bySez[n.sezione].push(n);
    });
    Object.keys(bySez).forEach(function(sez){
      lines.push('## '+sez);
      lines.push('');
      bySez[sez].forEach(function(n,i){
        var t = TIPI.find(function(x){ return x.val===n.tipo; })||TIPI[0];
        var riga = (i+1)+'. **'+t.label+'**';
        if (n.elemento) riga += ' `'+n.elemento+'`';
        riga += ' — '+n.testo;
        lines.push(riga);
      });
      lines.push('');
    });
    lines.push('---');
    lines.push('*Incolla questo file a Claude per applicare le modifiche.*');
    var blob = new Blob([lines.join('\n')],{type:'text/markdown;charset=utf-8'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'psl-note-'+new Date().toISOString().slice(0,10)+'.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('Esportato ✓');
  });

  // ── Cancella
  clearBtn.addEventListener('click', function() {
    if (!notes.length) return;
    if (!confirm('Cancellare tutte le '+notes.length+' note?')) return;
    notes = []; save(); renderList();
    toast('Note cancellate');
  });

  // ── Toggle pannello
  btn.addEventListener('click', function() {
    if (pickMode) { stopPick(); return; }
    var isOpen = panel.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    if (isOpen) setTimeout(function(){ textArea.focus(); }, 60);
  });

  // ── Init
  renderList();
  console.log('%c📝 PSL Dev Notes — Shift+N, oppure clicca 📝', 'color:#f7a800;font-weight:bold;font-size:13px');

})();
