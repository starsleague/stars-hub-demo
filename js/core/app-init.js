// ====================================================
// NAV
// ====================================================
// NAV è definito sotto con tutte le sezioni aggiornate
const PTITLES={home:'Home',classifiche:'Classifiche',planner:'Agenda / Planner',tornei:'Tornei ed Eventi',corsi:'Corsi e Lezioni',campi:'Campi',giocatori:'Giocatori',personale:'Personale & Turni',abbonamenti:'Abbonamenti','asd-home':'ASD Dashboard','asd-soci':'Libro Soci','asd-bilancio':'Bilancio ASD','asd-docs':'Doc. e Scadenze','asd-assemblee':'Assemblee ASD','calendario-centro':'Calendario Centro','coach-hub':'Coach Hub',cassa:'Cassa',shop:'Shop','shop-cart':'Carrello',chat:'Chat',statistiche:'Statistiche',notifiche:'Notifiche',ruoli:'Ruoli & Accessi',impostazioni:'Impostazioni'};

document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',function(e){if(e.target===this)this.classList.remove('open');}));
// Confirm
let _confirmCb=null;

function updateSidebar() {
  document.getElementById('sb-club-n').textContent=DB.centro.nome||'Il tuo centro';
  const s=[DB.centro.citta,DB.campi.length?DB.campi.length+' campi':'',DB.sport.length?DB.sport.length+' sport':''].filter(Boolean).join(' · ');
  document.getElementById('sb-club-s').textContent=s||'Impostazioni e configurazioni';
}

function updateTopbar() {
  const d=new Date();
  document.getElementById('topbarDate').innerHTML=d.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+' &nbsp;&#183;&nbsp; <span style="color:var(--green);font-weight:500">&#9679; Online</span>';
  renderWelcomeMessage();
}

function renderWelcomeMessage(){
  const now  = new Date();
  const h    = now.getHours();
  const dow  = now.getDay(); // 0=dom, 1=lun, …, 6=sab
  const day  = now.getDate();
  const month= now.getMonth()+1; // 1-12

  const nome = (DB.currentUser && DB.currentUser.nome)
    ? DB.currentUser.nome
    : (DB.centro && DB.centro.nome ? DB.centro.nome : 'al centro');

  // ── Determina fascia oraria
  const fasciaOra =
    h >= 5  && h < 12 ? 'mattina' :
    h >= 12 && h < 14 ? 'pranzo'  :
    h >= 14 && h < 18 ? 'pomeriggio' :
    h >= 18 && h < 21 ? 'sera'    : 'notte';

  // ── Determina evento speciale (data)
  const eventi = [
    { m:1,  g:1,  msg:'Felice anno nuovo, {nome}! 🎆 Iniziamo alla grande' },
    { m:2,  g:14, msg:'Buon San Valentino, {nome}! ❤️ Anche in campo si gioca in coppia' },
    { m:4,  g:1,  msg:'Primo aprile, {nome}! 🤡 Speriamo che i campi non spariscano' },
    { m:5,  g:1,  msg:'Buona Festa del Lavoro, {nome}! 💪' },
    { m:6,  g:2,  msg:'Buona Festa della Repubblica, {nome}! 🇮🇹' },
    { m:10, g:31, msg:'Buon Halloween, {nome}! 🎃 Attento ai fantasmi in campo' },
    { m:12, g:8,  msg:'Buona Immacolata, {nome}! 🎄 Il centro è aperto' },
    { m:12, g:24, msg:'Vigilia di Natale, {nome}! 🎅 Ultimo allenamento prima delle feste' },
    { m:12, g:25, msg:'Buon Natale, {nome}! 🎄 Anche oggi si gioca?' },
    { m:12, g:31, msg:'Ultimo giorno dell\'anno, {nome}! 🥂 Chiudiamo in bellezza' },
  ];
  const eventoOggi = eventi.find(function(e){ return e.m===month && e.g===day; });

  // ── Genera il saluto
  let messaggio;
  if(eventoOggi){
    messaggio = eventoOggi.msg;
  } else {
    // Pool contestuale per fascia oraria + giorno
    const pools = {
      mattina: [
        'Buongiorno, {nome}! ☀️ Ecco come inizia la giornata',
        'Buongiorno {nome}! Tutti i campi sono pronti per oggi 🎾',
        'Ottima mattinata, {nome}! Diamo uno sguardo ai campi',
        '{nome}, la giornata è appena iniziata — tutto sotto controllo 👊',
      ],
      pranzo: [
        'Buon pranzo, {nome}! 🍽️ Il pomeriggio è già prenotato?',
        '{nome}, pausa pranzo? I campi del pomeriggio ti aspettano',
        'A metà giornata, {nome}! Ecco la situazione aggiornata',
      ],
      pomeriggio: [
        'Buon pomeriggio, {nome}! 🎾 Ore di punta in arrivo',
        '{nome}, il pomeriggio entra nel vivo — tutto pronto?',
        'Nel pieno della giornata, {nome}! Ecco i campi in tempo reale',
        'Pomeriggio intenso, {nome}! Controlla la situazione 👀',
      ],
      sera: [
        'Buona sera, {nome}! 🌆 Fascia serale — campi al massimo',
        '{nome}, la sera è il momento più movimentato 🏆',
        'Gran finale di giornata, {nome}! Vediamo i campi',
        'Buona serata {nome} — i campi lavorano ancora 💪',
      ],
      notte: [
        'Nottambulo, {nome}? 🌙 Il gestionale non dorme mai',
        'Tardi ma operativo, {nome}! 🌛 Tutto tranquillo stanotte',
        '{nome}, ancora al lavoro? Rispetta anche il centro! 😄',
      ],
    };
    // Lunedì e venerdì messaggi speciali
    let pool = pools[fasciaOra];
    if(dow === 1 && fasciaOra === 'mattina')
      pool = ['Buon inizio settimana, {nome}! 💼 Pronti a carburare', 'Lunedì si riparte, {nome}! ⚡ La settimana è tua'].concat(pool);
    if(dow === 5)
      pool = ['Venerdì sera in arrivo, {nome}! 🎉 I campi saranno pieni', 'Quasi weekend, {nome}! 🏖️ Tanti match in programma'].concat(pool);
    if(dow === 0 || dow === 6)
      pool = ['Weekend, {nome}! 🎾 I campi non si fermano mai', 'Si gioca anche oggi, {nome}! Fine settimana al massimo'].concat(pool);

    const idx = Math.floor(Date.now() / 300000) % pool.length; // cambia ogni 5 minuti
    messaggio = pool[idx];
  }

  const testo = messaggio.replace('{nome}', nome);

  // ── Aggiorna topbarWelcome (sottotitolo)
  const el = document.getElementById('topbarWelcome');
  if(el) el.textContent = testo;

  // ── Se siamo sulla home, aggiorna anche pageTitle con il saluto
  const pageTitleEl = document.getElementById('pageTitle');
  const homePage    = document.getElementById('page-home');
  if(pageTitleEl && homePage && homePage.classList.contains('active')){
    pageTitleEl.textContent = testo;
  }
}

function fillSelects() {
  const sportOpts=DB.sport.map(s=>`<option value="${s}">${s}</option>`).join('');
  ['ev-sport','g-sport','gioc-fsport'].forEach(id=>{
    const el=document.getElementById(id); if(!el) return;
    const prev=el.value;
    el.innerHTML=(id==='gioc-fsport'?'<option value="">Tutti gli sport</option>':'')+sportOpts;
    if(prev) el.value=prev;
  });
  const campoOpts=DB.campi.map(c=>`<option value="${c.id}">${c.nome} &#8212; ${c.sport}</option>`).join('');
  const elPrenCampo=document.getElementById('pren-campo');
  if(elPrenCampo) elPrenCampo.innerHTML='<option value="">&#8212; Da definire (lista attesa) &#8212;</option>'+(campoOpts||'');
  const elEvCampo=document.getElementById('ev-campo');
  if(elEvCampo) elEvCampo.innerHTML=campoOpts||'<option value="">Nessun campo</option>';
  const cSport=document.getElementById('c-sport');
  if(cSport) cSport.innerHTML=sportOpts;
  const stSport=document.getElementById('st-sport');
  if(stSport) stSport.innerHTML=sportOpts;
  const tdAss=document.getElementById('td-assegna');
  if(tdAss) tdAss.innerHTML='<option value="">Tutti</option>'+DB.staff.map(s=>`<option value="${s.id}">${s.nome} ${s.cognome}</option>`).join('');
}

function buildSportTabs() {
  const icons={Padel:'&#127934;',Tennis:'&#127936;','Beach Tennis':'&#127958;',Pickleball:'&#127955;',Calcio:'&#9917;',Fitness:'&#127947;'};
  const el=document.getElementById('sport-tabs-pl');
  el.innerHTML=`<div class="s-tab active" onclick="setSportTab('tutti',this)">Tutti</div>`+DB.sport.map(s=>`<div class="s-tab" onclick="setSportTab('${s}',this)">${icons[s]||''}${s}</div>`).join('');
}

function nav(p,el){
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  const pg=document.getElementById('page-'+p); if(pg) pg.classList.add('active');
  document.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));
  if(el&&el.classList&&el.classList.contains('ni')) el.classList.add('active');
  document.getElementById('pageTitle').textContent=PTITLES[p]||p;
  if(p==='planner'||p==='home') { buildSportSelect(); renderPlanner(); updateKpi(); updateTopbar(); }
  if(p==='impostazioni') fillImpostazioni();
  if(p==='giocatori') renderGiocatori();
  if(p==='campi') { renderCampi(); }
  if(p==='shop'||p==='shop-cart') { updCartUI(); renderShopProdotti(); }
  if(p==='shop') updateStarsCoin();
  if(p==='tornei') renderEventi();
  if(p==='corsi') renderCorsi();
  if(p==='personale') renderStaff();
  if(p==='cassa') renderCassa();
  if(p==='abbonamenti') renderAbbonamenti();
  if(p==='asd-soci') renderAsdSoci();
  if(p==='asd-bilancio') renderAsdBilancio();
  if(p==='asd-docs') renderAsdDocs();
  if(p==='asd-home') renderAsdHome();
  if(p==='ruoli') renderRuoli();
  if(p==='notifiche') renderNotifiche();
  if(p==='classifiche') renderHomeRanking();
  if(p==='statistiche') renderStatistiche();
  if(p==='calendario-centro') renderCC();
  if(p==='asd-assemblee') renderAssemblee();
  if(p==='coach-hub') renderCoachHub();
}

function openModal(id){document.getElementById(id).classList.add('open');}

function closeModal(id){document.getElementById(id).classList.remove('open');}

function askConfirm(t,s,ok,cb){
  document.getElementById('confirmT').textContent=t; document.getElementById('confirmS').textContent=s;
  document.getElementById('confirmOkBtn').textContent=ok; _confirmCb=cb;
  document.getElementById('confirmOverlay').classList.add('open');
}

function confirmOk(){document.getElementById('confirmOverlay').classList.remove('open');if(_confirmCb)_confirmCb();}

function confirmCancel(){document.getElementById('confirmOverlay').classList.remove('open');}
