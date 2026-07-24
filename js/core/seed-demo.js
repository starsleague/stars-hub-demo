// ============================================================
// SEED DATI DEMO
// I dataset statici stanno in data/seed-demo.json.
// Qui resta solo la LOGICA di generazione.
// Uso da console:  await seedDemo(); location.reload();
// ============================================================

async function seedDemo(jsonPath){
  const S = await fetch(jsonPath || 'data/seed-demo.json').then(r=>r.json());
  const { campi, staff, gRaw, abbonamenti_piani, eventi, fasceTurni,
          asd_bilancio, asd_scadenze, calendario_centro,
          PAGS, TIPI_P, TIPI_T, TIPI_B, METODI } = S;
// PSL Stars Hub — Script unificato


// === SEED ===

// ============================================================
// PSL Stars Hub — SEED DATI DEMO
// Scrive direttamente in localStorage PRIMA che DB.js carichi
// Centro: ASD Padel & Tennis Bientina
// ============================================================


  // Salta solo se ci sono già prenotazioni E campi reali — altrimenti riscrivi sempre
  try {
    const existing = JSON.parse(localStorage.getItem('starsHubDB') || 'null');
    if (existing && (existing.prenotazioni||[]).length > 10 && (existing.campi||[]).length > 0) {
      console.log('%c⏭ Seed saltato — dati già presenti (' + existing.prenotazioni.length + ' prenotazioni)', 'color:#f7a800');
      return;
    }
  } catch(e) {}

  // ── Helpers
  let _id = 1;
  function uid() { return _id++; }
  function ds(y,m,d) { return y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'); }
  function ts(h,m) { return String(h).padStart(2,'0')+':'+String(m||0).padStart(2,'0'); }
  function addMin(t, min) {
    var p = t.split(':'); var tot = parseInt(p[0])*60 + parseInt(p[1]) + min;
    return ts(Math.floor(tot/60), tot%60);
  }
  function rnd(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

  // ══════════════════════════════════════════════
  // CAMPI
  // ══════════════════════════════════════════════
  _id = 107;

  // ══════════════════════════════════════════════
  // STAFF
  // ══════════════════════════════════════════════
  _id = 208;

  // ══════════════════════════════════════════════
  // GIOCATORI
  // ══════════════════════════════════════════════
  var giocatori = gRaw.map(function(r, i) {
    return { id: 301+i, nome:r[0], cognome:r[1], sport:r[2], livello:r[3],
      email: r[0].toLowerCase()+'.'+r[1].toLowerCase().replace(/\s/g,'')+'@email.it',
      tel:'+39 3'+Math.floor(30+Math.random()*20)+' '+Math.floor(1000000+Math.random()*9000000),
      tessera:'2026-01-31', cert:'2026-03-31', note:'' };
  });

  var padelG  = giocatori.filter(function(g){return g.sport==='Padel';}).map(function(g){return g.nome+' '+g.cognome;});
  var tennisG = giocatori.filter(function(g){return g.sport==='Tennis';}).map(function(g){return g.nome+' '+g.cognome;});
  var beachG  = giocatori.filter(function(g){return g.sport==='Beach Tennis';}).map(function(g){return g.nome+' '+g.cognome;});
  _id = 331;

  // ══════════════════════════════════════════════
  // ABBONAMENTI PIANI
  // ══════════════════════════════════════════════

  // ══════════════════════════════════════════════
  // ABBONAMENTI ATTIVI
  // ══════════════════════════════════════════════
  var abbonamenti = giocatori.slice(0,20).map(function(g,i){
    return { id:401+i, giocatore_id:g.id, piano_id:(i%3)+1,
      data_inizio:'2025-01-01', data_fine:'2025-12-31', stato:'attivo' };
  });
  _id = 422;

  // ══════════════════════════════════════════════
  // PRENOTAZIONI — Giugno + Luglio 2025
  // ══════════════════════════════════════════════
  var prenotazioni = [];
  var prenId = 500;

  function calcP(campoId, inizio, fine) {
    var c = campi.find(function(x){return x.id===campoId;});
    if (!c) return 16;
    var ih = parseInt(inizio.split(':')[0]);
    var im = parseInt(inizio.split(':')[1]);
    var fh = parseInt(fine.split(':')[0]);
    var fm = parseInt(fine.split(':')[1]);
    var durata = (fh*60+fm - ih*60-im) / 60;
    var tariffa = ih < parseInt((c.t1e||'18:00').split(':')[0]) ? (c.tariffa1||16) : (c.tariffa2||22);
    return parseFloat((tariffa * durata).toFixed(2));
  }


  function pren(data, cid, ini, fin, tipo, g1, g2, g3, g4, pag) {
    prenotazioni.push({
      id: prenId++, data: data, campo_id: cid,
      inizio: ini, fine: fin, tipo: tipo,
      prezzo: calcP(cid, ini, fin),
      pagato: pag || rnd(PAGS),
      g1: g1||'', g2: g2||'', g3: g3||'', g4: g4||''
    });
  }

  for (var mese = 6; mese <= 7; mese++) {
    var giorni = (mese === 6) ? 30 : 31;
    for (var g = 1; g <= giorni; g++) {
      var data = ds(2025, mese, g);
      var dow = new Date(2025, mese-1, g).getDay(); // 0=dom,1=lun,...,6=sab

      // ── PADEL 1 Indoor — campo più richiesto
      var sp1 = ['09:00','10:30','12:00','15:00','16:30','18:00','19:30','21:00'];
      for (var i=0; i<sp1.length; i++) {
        if (Math.random() > 0.18) {
          pren(data, 101, sp1[i], addMin(sp1[i],90), rnd(TIPI_P), rnd(padelG), rnd(padelG), rnd(padelG), rnd(padelG));
        }
      }

      // ── PADEL 2 Indoor
      var sp2 = ['09:00','10:30','12:00','15:30','17:00','18:30','20:00','21:30'];
      for (var i=0; i<sp2.length; i++) {
        if (Math.random() > 0.28) {
          pren(data, 102, sp2[i], addMin(sp2[i],90), rnd(TIPI_P), rnd(padelG), rnd(padelG), rnd(padelG), rnd(padelG));
        }
      }

      // ── PADEL 3 Outdoor
      var sp3 = ['09:00','10:30','16:00','17:30','19:00','20:30'];
      for (var i=0; i<sp3.length; i++) {
        if (Math.random() > 0.45) {
          pren(data, 103, sp3[i], addMin(sp3[i],90), rnd(TIPI_P), rnd(padelG), rnd(padelG));
        }
      }

      // ── TENNIS A
      var sta = ['09:00','10:00','11:00','15:00','16:00','17:00','18:00','19:00','20:00'];
      for (var i=0; i<sta.length; i++) {
        if (Math.random() > 0.35) {
          var tipo = rnd(TIPI_T);
          if (tipo === 'corso') {
            pren(data, 104, sta[i], addMin(sta[i],60), 'corso', 'Marco Ferri', rnd(tennisG));
          } else {
            pren(data, 104, sta[i], addMin(sta[i],60), tipo, rnd(tennisG), rnd(tennisG));
          }
        }
      }

      // ── TENNIS B
      var stb = ['09:00','10:00','11:00','15:00','16:00','17:00','18:00','19:00'];
      for (var i=0; i<stb.length; i++) {
        if (Math.random() > 0.42) {
          var tipo = rnd(TIPI_T);
          if (tipo === 'corso') {
            pren(data, 105, stb[i], addMin(stb[i],60), 'corso', 'Luca Bianchi', rnd(tennisG));
          } else {
            pren(data, 105, stb[i], addMin(stb[i],60), tipo, rnd(tennisG), rnd(tennisG));
          }
        }
      }

      // ── BEACH TENNIS
      var sbt = ['09:00','10:30','15:00','16:30','18:00','19:30'];
      for (var i=0; i<sbt.length; i++) {
        if (Math.random() > 0.48) {
          var tipo = rnd(TIPI_B);
          if (tipo === 'corso') {
            pren(data, 106, sbt[i], addMin(sbt[i],60), 'corso', 'Giulia Rossi', rnd(beachG));
          } else {
            pren(data, 106, sbt[i], addMin(sbt[i],90), tipo, rnd(beachG), rnd(beachG));
          }
        }
      }

      // ── CORSI FISSI lun/mer/ven
      if (dow===1||dow===3||dow===5) {
        pren(data, 102, '10:00','11:30','corso','Sara Mancini',rnd(padelG),rnd(padelG),rnd(padelG),'saldato');
        pren(data, 104, '16:00','17:00','corso','Luca Bianchi',rnd(tennisG),rnd(tennisG),'','saldato');
      }
      // ── CORSI FISSI mar/gio — padel avanzato sera
      if (dow===2||dow===4) {
        pren(data, 101, '19:00','20:30','corso','Marco Ferri',rnd(padelG),rnd(padelG),rnd(padelG),'saldato');
      }
      // ── CORSO BEACH sabato mattina
      if (dow===6) {
        pren(data, 106, '10:00','11:30','corso','Giulia Rossi',rnd(beachG),rnd(beachG),rnd(beachG),'saldato');
      }
    }
  }
  _id = prenId;

  // ══════════════════════════════════════════════
  // EVENTI / TORNEI
  // ══════════════════════════════════════════════
  _id = 606;

  // ══════════════════════════════════════════════
  // TURNI STAFF
  // ══════════════════════════════════════════════
  var turni = [];
  var tId = 700;
  for (var mese=6; mese<=7; mese++) {
    var giorni = (mese===6)?30:31;
    for (var g=1; g<=giorni; g++) {
      var data = ds(2025,mese,g);
      var dow = new Date(2025,mese-1,g).getDay();
      if (dow===0) continue;
      fasceTurni.forEach(function(t){
        if (t.sid===207 && dow===6 && Math.random()>0.4) return;
        turni.push({id:tId++, staff_id:t.sid, data:data, fascia:t.fascia, ora_inizio:t.oi, ora_fine:t.of, note:''});
      });
    }
  }
  _id = tId;

  // ══════════════════════════════════════════════
  // CASSA
  // ══════════════════════════════════════════════
  var cassa = [];
  var cId = 800;

  // Entrate da prenotazioni saldato
  prenotazioni.filter(function(p){return p.pagato==='saldato' && parseFloat(p.prezzo)>0;}).forEach(function(p){
    cassa.push({id:cId++, data:p.data, tipo:'entrata', importo:parseFloat(p.prezzo)||16,
      categoria:'Prenotazioni', descrizione:'Campo — '+(p.g1||'')+(p.g2?' & '+p.g2:''),
      metodo:rnd(METODI), ref_id:p.id, ref_tipo:'prenotazione'});
  });
  // Iscrizioni tornei
  eventi.forEach(function(ev){
    (ev.iscritti||[]).filter(function(i){return i.pagato==='saldato';}).forEach(function(){
      cassa.push({id:cId++, data:ev.data_inizio, tipo:'entrata', importo:ev.quota||0,
        categoria:'Tornei', descrizione:'Iscrizione '+ev.nome, metodo:rnd(METODI), ref_id:ev.id, ref_tipo:'evento'});
    });
  });
  // Spese
  [
    {data:'2025-06-01',imp:450,desc:'Affitto impianto — Giugno',met:'bonifico'},
    {data:'2025-06-05',imp:89, desc:'Palline da padel (20 tubi)',met:'carta'},
    {data:'2025-06-10',imp:230,desc:'Manutenzione manto sintetico',met:'contanti'},
    {data:'2025-06-15',imp:320,desc:'Bolletta energia campi',met:'bonifico'},
    {data:'2025-06-20',imp:55, desc:'Materiale pulizie',met:'contanti'},
    {data:'2025-07-01',imp:450,desc:'Affitto impianto — Luglio',met:'bonifico'},
    {data:'2025-07-08',imp:145,desc:'Palline tennis + beach',met:'carta'},
    {data:'2025-07-15',imp:280,desc:'Bolletta energia campi',met:'bonifico'},
    {data:'2025-07-20',imp:380,desc:'Riparazione rete beach tennis',met:'carta'},
  ].forEach(function(s){
    cassa.push({id:cId++, data:s.data, tipo:'uscita', importo:s.imp,
      categoria:'Spese', descrizione:s.desc, metodo:s.met, ref_id:null, ref_tipo:null});
  });
  _id = cId;

  // ══════════════════════════════════════════════
  // ASD
  // ══════════════════════════════════════════════
  var asd_soci = giocatori.map(function(g,i){
    return {id:900+i, giocatore_id:g.id, nome:g.nome, cognome:g.cognome,
      data_iscrizione:'2025-01-15', quota_versata:30,
      tessera_num:'BIENTI2025'+String(i+1).padStart(3,'0')};
  });



  // ══════════════════════════════════════════════
  // CALENDARIO CENTRO
  // ══════════════════════════════════════════════

  // ══════════════════════════════════════════════
  // SCRIVI IN LOCALSTORAGE
  // ══════════════════════════════════════════════
  var DB_DATA = {
    configured: true,
    centro: {
      nome:'ASD Padel & Tennis Bientina',
      citta:'Bientina', cap:'56031',
      tel:'+39 0587 123456', email:'info@padelbientina.it',
      piva:'01234567890',
      orario_apertura:'08:00', orario_chiusura:'23:00',
      chiusure_wd:[], chiusure_date:['2025-08-15'],
      open:'08:00', close:'23:00'
    },
    sport: ['Padel','Tennis','Beach Tennis'],
    campi: campi,
    prenotazioni: prenotazioni,
    eventi: eventi,
    giocatori: giocatori,
    staff: staff,
    turni: turni,
    todo: [],
    cart: [],
    cassa: cassa,
    abbonamenti_piani: abbonamenti_piani,
    abbonamenti: abbonamenti,
    asd_soci: asd_soci,
    asd_bilancio: asd_bilancio,
    asd_scadenze: asd_scadenze,
    asd_assemblee: [],
    calendario_centro: calendario_centro,
    coach_progressioni: [],
    _id: _id + 100
  };

  localStorage.setItem('starsHubDB', JSON.stringify(DB_DATA));

  console.log('%c✅ SEED DEMO caricato!', 'color:#22a96e;font-weight:bold;font-size:16px');
  console.log('  Prenotazioni generate:', prenotazioni.length);
  console.log('  Giocatori:', giocatori.length);
  console.log('  Staff:', staff.length);
  console.log('  Campi:', campi.length);
  console.log('  Tornei/eventi:', eventi.length);
  console.log('  Cassa movimenti:', cassa.length);

}
