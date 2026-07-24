// ── Costanti punteggio classifica club
var PTS = {
  partita:    500,
  ranking:    500,
  fascia:     1000,
  torneo:     250,
  vittoria:   10000,
};

var FASCE_RK = [
  { label:'Spark', min:0,  max:1,   color:'#6b7280' },
  { label:'1★',    min:1,  max:2,   color:'#3b82f6' },
  { label:'2★',    min:2,  max:3,   color:'#06b6d4' },
  { label:'3★',    min:3,  max:4,   color:'#10b981' },
  { label:'4★',    min:4,  max:5,   color:'#84cc16' },
  { label:'5★',    min:5,  max:6,   color:'#f59e0b' },
  { label:'6★',    min:6,  max:7,   color:'#ef4444' },
  { label:'7★',    min:7,  max:8,   color:'#a855f7' },
  { label:'8★+',   min:8,  max:999, color:'#FFAF00' },
];

var FEM_NOMI = ['Claudia','Elena','Giada','Laura','Paola','Francesca','Ilaria',
  'Maria','Silvia','Chiara','Alessandra','Marta','Roberta','Beatrice','Noemi',
  'Giulia','Sara','Valentina','Alessia','Irene'];

var _rkView = 'ranking';
var _rkFasciaLabel = null;

function _isFem(g) {
  if (g.gender) return g.gender==='femminile'||g.gender==='F';
  return FEM_NOMI.indexOf(g.nome) > -1;
}

function _fasciaOf(score) {
  return FASCE_RK.find(function(f){ return score>=f.min&&score<f.max; })||FASCE_RK[0];
}

function _toMin(t) {
  if(!t) return 0;
  var p=t.split(':'); return parseInt(p[0])*60+parseInt(p[1]||0);
}

function _calcClubScore(g) {
  var nome = (g.nome+' '+g.cognome).trim();
  var livello = parseFloat(g.livello)||0;
  var fasce = (DB.centro.fasce_premio)||[];
  var dettaglio = [];
  var totale = 0;
  var pren = DB.prenotazioni.filter(function(p){
    return p.g1===nome||p.g2===nome||p.g3===nome||p.g4===nome;
  });
  pren.forEach(function(p) {
    var pts_pren = 0; var voci = [];
    var oraInizio = _toMin(p.inizio);
    pts_pren += PTS.partita;
    voci.push({ voce:'Partita giocata', punti:PTS.partita });
    if (p.tipo==='rank') {
      pts_pren += PTS.ranking;
      voci.push({ voce:'Partita ranking', punti:PTS.ranking });
    }
    if (p.tipo==='torneo'||p.tipo==='camp') {
      pts_pren += PTS.torneo;
      voci.push({ voce:'Partita torneo/campionato', punti:PTS.torneo });
    }
    var fasciaMatch = fasce.find(function(f){
      return oraInizio >= _toMin(f.inizio) && oraInizio < _toMin(f.fine);
    });
    if (fasciaMatch) {
      pts_pren += fasciaMatch.punti || PTS.fascia;
      voci.push({ voce:'Fascia premiata ('+fasciaMatch.nome+')', punti:fasciaMatch.punti||PTS.fascia });
    }
    if (p.tipo==='rank') {
      var idx2 = DB.prenotazioni.filter(function(x){
        return x.data===p.data&&x.campo_id===p.campo_id&&x.tipo==='rank';
      }).indexOf(p);
      if (idx2 % 2 === 0) {
        var bonusVittoria = Math.round(livello * PTS.vittoria);
        pts_pren += bonusVittoria;
        voci.push({ voce:'Risultato positivo (Liv.'+livello+' x '+PTS.vittoria+')', punti:bonusVittoria });
      }
    }
    totale += pts_pren;
    dettaglio.push({ data:p.data, inizio:p.inizio, tipo:p.tipo, campo_id:p.campo_id, punti_totali:pts_pren, voci:voci });
  });
  return { totale:totale, dettaglio:dettaglio, partite:pren.length };
}

function _clubRanking() {
  return DB.giocatori.map(function(g){
    var cs = _calcClubScore(g);
    return { id:g.id, g:g, totale:cs.totale, dettaglio:cs.dettaglio, partite:cs.partite };
  }).sort(function(a,b){ return b.totale-a.totale; });
}

function _pslScore(g) {
  var base = parseFloat(g.livello)||0;
  var nome = (g.nome+' '+g.cognome).trim();
  var rankP = DB.prenotazioni.filter(function(p){
    return (p.g1===nome||p.g2===nome||p.g3===nome||p.g4===nome)&&p.tipo==='rank';
  }).length;
  return parseFloat((base + Math.min(rankP*0.04,1.5)).toFixed(2));
}

function _pslPlayers() {
  return DB.giocatori.map(function(g){
    var score = _pslScore(g);
    var nome = (g.nome+' '+g.cognome).trim();
    var pren = DB.prenotazioni.filter(function(p){
      return p.g1===nome||p.g2===nome||p.g3===nome||p.g4===nome;
    });
    return { id:g.id, g:g, display_name:nome, nickname:g.nickname||'',
      gender:_isFem(g)?'femminile':'maschile', ranking_score:score,
      matches_played:pren.length,
      matches_won:Math.round(pren.filter(function(p){return p.tipo==='rank';}).length*0.55),
      livello:g.livello };
  }).sort(function(a,b){ return b.ranking_score-a.ranking_score; });
}

function _setRkView(v) { _rkView=v; _rkFasciaLabel=null; renderPslRanking(); }

function _toggleFascia(label) {
  _rkFasciaLabel = (_rkFasciaLabel===label) ? null : label;
  renderPslRanking();
}

function openRkPopup(id) {
  var popup = document.getElementById('rk-popup'); if(!popup) return;
  var ranked = _clubRanking();
  var item = ranked.find(function(x){return x.id==id;});
  if(!item) return;
  var g=item.g; var nome=(g.nome+' '+g.cognome).trim();
  var pos=ranked.indexOf(item)+1;
  var fascia=_fasciaOf(parseFloat(g.livello)||0);
  var tipoLabel={rank:'Ranking',amich:'Amichevole',torneo:'Torneo',corso:'Corso/Lezione',prenotato:'Prenotazione',camp:'Campionato'};
  var byTipo={};
  item.dettaglio.forEach(function(d){ byTipo[d.tipo]=(byTipo[d.tipo]||0)+d.punti_totali; });
  var ultimeRows = item.dettaglio.slice().sort(function(a,b){
    return b.data.localeCompare(a.data)||b.inizio.localeCompare(a.inizio);
  }).slice(0,8);

  var div = document.createElement('div');
  div.style.cssText='position:fixed;inset:0;z-index:2000;background:rgba(30,49,74,.6);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto';
  div.addEventListener('click', closeRkPopup);

  var inner = document.createElement('div');
  inner.style.cssText='width:100%;max-width:460px;border-radius:20px;overflow:hidden;box-shadow:0 24px 64px rgba(10,20,36,.4);max-height:90vh;display:flex;flex-direction:column';
  inner.addEventListener('click', function(e){e.stopPropagation();});

  // Header
  var header = document.createElement('div');
  header.style.cssText='background:var(--navy);padding:18px 20px;flex-shrink:0';
  var closeBtn = document.createElement('button');
  closeBtn.textContent='✕';
  closeBtn.style.cssText='position:absolute;top:14px;right:14px;width:30px;height:30px;border-radius:10px;background:rgba(255,255,255,.12);border:none;cursor:pointer;color:#fff;font-size:16px';
  closeBtn.addEventListener('click', closeRkPopup);
  header.style.position='relative';
  header.innerHTML=[
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">',
      '<div style="width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,var(--gold),#E09800);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:var(--navy)">',
        (g.nome||'?')[0].toUpperCase(),
      '</div>',
      '<div>',
        '<div style="color:#fff;font-weight:800;font-size:17px">'+nome+'</div>',
        '<div style="color:rgba(255,255,255,.4);font-size:11px;margin-top:2px">#'+pos+' classifica del club</div>',
      '</div>',
    '</div>',
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">',
      ['PUNTI CLUB|'+item.totale.toLocaleString('it-IT')+'|var(--gold)',
       'PARTITE|'+item.partite+'|rgba(255,255,255,.85)',
       'LIVELLO|'+fascia.label+'|'+fascia.color
      ].map(function(s){var p=s.split('|');return '<div style="background:rgba(255,255,255,.08);border-radius:10px;padding:10px;text-align:center"><div style="color:'+p[2]+';font-weight:900;font-size:18px">'+p[1]+'</div><div style="color:rgba(255,255,255,.4);font-size:9px;margin-top:4px;font-weight:700;letter-spacing:.06em">'+p[0]+'</div></div>';}).join(''),
    '</div>',
  ].join('');
  header.appendChild(closeBtn);

  // Body
  var body = document.createElement('div');
  body.style.cssText='background:var(--surf);padding:14px 16px;overflow-y:auto;flex:1';

  var tipoRows = Object.entries(byTipo).sort(function(a,b){return b[1]-a[1];}).map(function(kv){
    var pct=item.totale>0?Math.round(kv[1]/item.totale*100):0;
    return '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-size:11px;color:var(--text2)">'+(tipoLabel[kv[0]]||kv[0])+'</span><span style="font-size:11px;font-weight:700;color:var(--gold)">'+kv[1].toLocaleString('it-IT')+' ('+pct+'%)</span></div><div style="height:4px;background:var(--bdr);border-radius:2px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:var(--gold);border-radius:2px"></div></div></div>';
  }).join('');

  var ultimeRowsHtml = ultimeRows.map(function(d){
    var campoNome=(DB.campi.find(function(c){return c.id==d.campo_id;})||{}).nome||'—';
    var vociHtml=d.voci.map(function(v){return '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3);padding:1px 0"><span>'+v.voce+'</span><span style="font-weight:600;color:var(--text2)">+'+v.punti.toLocaleString('it-IT')+'</span></div>';}).join('');
    return '<div style="background:var(--bg);border-radius:8px;padding:10px 12px;margin-bottom:6px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><div><div style="font-size:11px;font-weight:600;color:var(--text)">'+d.data+' · '+d.inizio+'</div><div style="font-size:10px;color:var(--text3)">'+campoNome+' · '+(tipoLabel[d.tipo]||d.tipo)+'</div></div><div style="font-size:13px;font-weight:800;color:var(--gold)">+'+d.punti_totali.toLocaleString('it-IT')+'</div></div>'+vociHtml+'</div>';
  }).join('');

  body.innerHTML=[
    '<div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Punti per tipo</div>',
    '<div style="background:var(--bg);border-radius:10px;padding:10px 12px;margin-bottom:14px">',tipoRows,'</div>',
    '<div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Ultime partite</div>',
    ultimeRowsHtml||'<div style="text-align:center;padding:20px;color:var(--text3);font-size:12px">Nessuna partita</div>',
  ].join('');

  inner.appendChild(header);
  inner.appendChild(body);
  div.appendChild(inner);
  popup.innerHTML='';
  popup.appendChild(div);
  popup.style.display='block';
}

function openPslPopup(id) {
  var popup = document.getElementById('rk-popup'); if(!popup) return;
  var players = _pslPlayers();
  var item = players.find(function(p){return p.id==id;});
  if(!item) return;
  var g=item.g; var nome=item.display_name;
  var fascia=_fasciaOf(item.ranking_score);
  var wr=item.matches_played>0?Math.round(item.matches_won/item.matches_played*100):0;

  var div=document.createElement('div');
  div.style.cssText='position:fixed;inset:0;z-index:2000;background:rgba(30,49,74,.6);display:flex;align-items:center;justify-content:center;padding:16px';
  div.addEventListener('click',closeRkPopup);
  var inner=document.createElement('div');
  inner.style.cssText='width:100%;max-width:400px;border-radius:20px;overflow:hidden;box-shadow:0 24px 64px rgba(10,20,36,.4)';
  inner.addEventListener('click',function(e){e.stopPropagation();});
  inner.innerHTML=[
    '<div style="background:var(--navy);padding:20px 20px 16px;position:relative">',
      '<button id="psl-close-btn" style="position:absolute;top:14px;right:14px;width:30px;height:30px;border-radius:10px;background:rgba(255,255,255,.12);border:none;cursor:pointer;color:#fff;font-size:16px">✕</button>',
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">',
        '<div style="width:60px;height:60px;border-radius:18px;background:linear-gradient(135deg,var(--gold),#E09800);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:var(--navy)">'+(g.nome||'?')[0].toUpperCase()+'</div>',
        '<div><div style="color:#fff;font-weight:800;font-size:17px">'+nome+'</div><div style="color:var(--gold);font-size:12px;font-weight:600;margin-top:2px">'+fascia.label+'</div></div>',
      '</div>',
      '<div style="display:flex;gap:6px">',
        '<span style="font-size:11px;padding:4px 10px;border-radius:16px;background:'+fascia.color+'30;color:'+fascia.color+';font-weight:700">'+fascia.label+'</span>',
        '<span style="font-size:11px;padding:4px 10px;border-radius:16px;background:rgba(255,255,255,.1);color:rgba(255,255,255,.7);font-weight:600">'+(_isFem(g)?'👩 Femminile':'👨 Maschile')+'</span>',
      '</div>',
    '</div>',
    '<div style="background:#fff;padding:16px 18px">',
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">',
        ['RANKING|'+item.ranking_score.toFixed(2)+'|var(--gold)','PARTITE|'+item.matches_played+'|var(--navy)','WIN %|'+wr+'%|'+(wr>=50?'#059669':'var(--text3)')].map(function(s){var p=s.split('|');return '<div style="padding:12px 6px;border-radius:12px;background:#F7F8FA;text-align:center"><div style="color:'+p[2]+';font-weight:900;font-size:20px;line-height:1">'+p[1]+'</div><div style="color:#899CB5;font-size:9px;margin-top:4px;font-weight:700;letter-spacing:.06em">'+p[0]+'</div></div>';}).join(''),
      '</div>',
      '<button id="psl-close-btn2" style="width:100%;padding:11px;border-radius:12px;background:var(--navy);border:none;color:#fff;font-size:13px;font-weight:700;cursor:pointer">Chiudi</button>',
    '</div>',
  ].join('');
  div.appendChild(inner);
  popup.innerHTML='';
  popup.appendChild(div);
  popup.style.display='block';
  // Attach close buttons after DOM insert
  var cb1=inner.querySelector('#psl-close-btn');
  var cb2=inner.querySelector('#psl-close-btn2');
  if(cb1) cb1.addEventListener('click',closeRkPopup);
  if(cb2) cb2.addEventListener('click',closeRkPopup);
}

function closeRkPopup() {
  var popup=document.getElementById('rk-popup');
  if(popup){popup.style.display='none';popup.innerHTML='';}
}

function toggleClubPanel(){
  var panel = document.getElementById('home-ranking-wrap');
  var arrow = document.getElementById('club-toggle-arrow');
  if(!panel) return;
  var isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if(arrow) arrow.textContent = isOpen ? '▼ Mostra' : '▲ Nascondi';
  if(!isOpen) renderClubRanking();
}

function toggleRkPanel(){
  var panel = document.getElementById('home-psl-wrap');
  var arrow = document.getElementById('rk-toggle-arrow');
  if(!panel) return;
  var isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if(arrow) arrow.textContent = isOpen ? '▼ Mostra' : '▲ Nascondi';
  if(!isOpen) renderPslRanking();
}

function renderHomeRanking() {
  var clubPanel = document.getElementById('home-ranking-wrap');
  if(clubPanel && clubPanel.style.display !== 'none') renderClubRanking();
  var pslPanel = document.getElementById('home-psl-wrap');
  if(pslPanel && pslPanel.style.display !== 'none') renderPslRanking();
}

function renderClubRanking() {
  var wrap=document.getElementById('home-ranking-wrap'); if(!wrap) return;
  wrap.innerHTML='';
  var container=document.createElement('div');

  var titleEl=document.createElement('div');
  titleEl.style.cssText='font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px';
  titleEl.textContent='🏅 Classifica del club';
  container.appendChild(titleEl);

  var ranked=_clubRanking();
  if(!ranked.length){
    container.innerHTML+='<div style="text-align:center;padding:24px;color:var(--text3);font-size:12px">Nessun giocatore</div>';
    wrap.appendChild(container);
    return;
  }
  var podio=ranked.slice(0,3), rest=ranked.slice(3);
  container.appendChild(_renderPodio(podio, 'club'));
  if(rest.length) container.appendChild(_renderList(rest, 'club'));
  wrap.appendChild(container);
}

function renderPslRanking() {
  var wrap=document.getElementById('home-psl-wrap'); if(!wrap) return;
  wrap.innerHTML='';
  var container=document.createElement('div');

  // Header tabs
  var tabsDiv=document.createElement('div');
  tabsDiv.style.cssText='display:flex;align-items:center;justify-content:space-between;margin-bottom:12px';
  var titleEl=document.createElement('div');
  titleEl.style.cssText='font-size:12px;font-weight:700;color:var(--text)';
  titleEl.textContent = _rkView==='ranqueen' ? '👑 RanQueen PSL' : '🏆 RanKing PSL';
  var tabsWrap=document.createElement('div');
  tabsWrap.style.cssText='display:flex;gap:3px;background:var(--bg);border:.5px solid var(--bdr);border-radius:20px;padding:3px';
  [{v:'ranking',l:'🏆 RanKing'},{v:'ranqueen',l:'👑 RanQueen'}].forEach(function(t){
    var btn=document.createElement('button');
    btn.type='button';
    btn.textContent=t.l;
    var sel=_rkView===t.v;
    btn.style.cssText='padding:4px 11px;border-radius:14px;border:none;cursor:pointer;font-size:10px;font-weight:700;transition:all .15s;background:'+(sel?'var(--gold)':'transparent')+';color:'+(sel?'var(--navy)':'var(--text3)');
    btn.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); _setRkView(t.v); });
    tabsWrap.appendChild(btn);
  });
  tabsDiv.appendChild(titleEl);
  tabsDiv.appendChild(tabsWrap);
  container.appendChild(tabsDiv);

  var allPsl=_pslPlayers();
  var base=_rkView==='ranqueen'
    ? allPsl.filter(function(p){return p.gender==='femminile';})
    : allPsl.filter(function(p){return p.gender!=='femminile';});
  var fasciaObj=_rkFasciaLabel ? FASCE_RK.find(function(f){return f.label===_rkFasciaLabel;})||null : null;
  var filtered=fasciaObj ? base.filter(function(p){return p.ranking_score>=fasciaObj.min&&p.ranking_score<fasciaObj.max;}) : base;

  var fasciaDiv=document.createElement('div');
  fasciaDiv.style.cssText='margin-bottom:12px';
  var fasciaTitle=document.createElement('div');
  fasciaTitle.style.cssText='font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px';
  fasciaTitle.textContent='FASCIA';
  var fasciaRow=document.createElement('div');
  fasciaRow.style.cssText='display:flex;gap:5px;overflow-x:auto;padding-bottom:2px';
  FASCE_RK.forEach(function(f){
    var btn=document.createElement('button');
    btn.type='button';
    var sel=_rkFasciaLabel===f.label;
    btn.style.cssText='flex-shrink:0;padding:4px 10px;border-radius:20px;border:none;cursor:pointer;font-size:10px;font-weight:600;display:flex;align-items:center;gap:4px;background:'+(sel?f.color:'rgba(30,49,74,.06)')+';color:'+(sel?'#fff':'var(--text2)');
    var dot=document.createElement('span');
    dot.style.cssText='width:5px;height:5px;border-radius:50%;background:'+(sel?'rgba(255,255,255,.6)':f.color);
    btn.appendChild(dot);
    btn.appendChild(document.createTextNode(f.label));
    btn.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); _toggleFascia(f.label); });
    fasciaRow.appendChild(btn);
  });
  fasciaDiv.appendChild(fasciaTitle);
  fasciaDiv.appendChild(fasciaRow);
  container.appendChild(fasciaDiv);

  if(!filtered.length){
    container.innerHTML+='<div style="text-align:center;padding:24px;color:var(--text3);font-size:12px">Nessun giocatore trovato</div>';
    wrap.appendChild(container);
    return;
  }
  container.appendChild(_renderPodio(filtered.slice(0,3),'psl'));
  if(filtered.length>3) container.appendChild(_renderList(filtered.slice(3),'psl'));
  wrap.appendChild(container);
}

function _renderPodio(podio, tipo) {
  var MEDALS=['🥈','🥇','🥉'], ORDER=[1,0,2], HEIGHTS=[80,108,66];
  var grid=document.createElement('div');
  grid.style.cssText='display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;align-items:flex-end;margin-bottom:16px';
  ORDER.forEach(function(pos,idx){
    var item=podio[pos];
    var col=document.createElement('div');
    col.style.cssText='display:flex;flex-direction:column;align-items:center';
    if(!item){ grid.appendChild(col); return; }
    var isFirst=pos===0;
    var initial=(tipo==='psl'?item.display_name:item.g.nome||'?')[0].toUpperCase();
    var score=tipo==='psl'?item.ranking_score.toFixed(2):item.totale.toLocaleString('it-IT');
    var fascia=tipo==='psl'?_fasciaOf(item.ranking_score):_fasciaOf(parseFloat(item.g.livello)||0);
    var subLabel=tipo==='psl'?fascia.label:(item.partite+' partite');
    var medal=document.createElement('span');
    medal.textContent=MEDALS[idx]; medal.style.cssText='font-size:20px;margin-bottom:4px';
    var avatar=document.createElement('button');
    avatar.type='button';
    avatar.textContent=initial;
    avatar.style.cssText='width:50px;height:50px;border-radius:16px;border:none;cursor:pointer;margin-bottom:5px;font-size:22px;font-weight:800;background:'+(isFirst?'var(--gold)':'#ECEEF2')+';color:var(--navy);box-shadow:'+(isFirst?'0 4px 16px rgba(247,168,0,.35)':'none');
    (function(id,t){ avatar.addEventListener('click',function(){ t==='psl'?openPslPopup(id):openRkPopup(id); }); })(item.id, tipo);
    var nameEl=document.createElement('div');
    nameEl.textContent=(tipo==='psl'?(item.nickname||item.display_name):(item.g.nome+' '+item.g.cognome));
    nameEl.style.cssText='font-size:10px;font-weight:700;color:var(--text);text-align:center;max-width:76px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
    var scoreEl=document.createElement('div');
    scoreEl.textContent=score;
    scoreEl.style.cssText='font-size:13px;font-weight:800;color:'+(isFirst?'var(--gold)':fascia.color)+';margin-top:1px';
    var subEl=document.createElement('div');
    subEl.textContent=subLabel;
    subEl.style.cssText='font-size:9px;color:'+(tipo==='psl'?fascia.color:'var(--text3)')+';font-weight:'+(tipo==='psl'?'700':'400')+';margin-bottom:5px';
    var pedestal=document.createElement('div');
    pedestal.style.cssText='width:100%;height:'+HEIGHTS[idx]+'px;border-radius:10px 10px 0 0;background:'+(isFirst?'linear-gradient(180deg,rgba(247,168,0,.18),rgba(247,168,0,.06))':'#F0F2F5')+';border:'+(isFirst?'1px solid rgba(247,168,0,.25)':'1px solid rgba(30,49,74,.07)')+';display:flex;align-items:flex-start;justify-content:center;padding-top:8px';
    var posNum=document.createElement('span');
    posNum.textContent=(pos===0?1:pos===1?2:3);
    posNum.style.cssText='font-weight:900;font-size:26px;color:'+(isFirst?'rgba(247,168,0,.22)':'rgba(30,49,74,.07)');
    pedestal.appendChild(posNum);
    [medal,avatar,nameEl,scoreEl,subEl,pedestal].forEach(function(el){col.appendChild(el);});
    grid.appendChild(col);
  });
  return grid;
}

function _renderList(items, tipo) {
  var wrap=document.createElement('div');
  wrap.style.cssText='background:var(--surf);border:.5px solid var(--bdr);border-radius:12px;overflow:hidden';
  items.forEach(function(item,i){
    var row=document.createElement('div');
    var isLast=i===items.length-1;
    row.style.cssText='display:flex;align-items:center;gap:11px;padding:12px 14px;border-bottom:'+(isLast?'none':'.5px solid var(--bdr2)')+';cursor:pointer;transition:background .1s';
    row.addEventListener('mouseover',function(){this.style.background='rgba(247,168,0,.04)';});
    row.addEventListener('mouseout',function(){this.style.background='';});
    (function(id,t){ row.addEventListener('click',function(){ t==='psl'?openPslPopup(id):openRkPopup(id); }); })(item.id, tipo);
    var fascia=tipo==='psl'?_fasciaOf(item.ranking_score):_fasciaOf(parseFloat(item.g.livello)||0);
    var score=tipo==='psl'?item.ranking_score.toFixed(2):item.totale.toLocaleString('it-IT');
    var initial=(tipo==='psl'?item.display_name:item.g.nome||'?')[0].toUpperCase();
    var mainName=tipo==='psl'?item.display_name:(item.g.nome+' '+item.g.cognome);
    var sub=tipo==='psl'
      ? (fascia.label+' · '+( item.matches_played>0?Math.round(item.matches_won/item.matches_played*100):0 )+'% win · '+item.matches_played+'P')
      : (item.partite+' partite · Liv. '+fascia.label);
    row.innerHTML=[
      '<span style="width:22px;text-align:center;color:var(--text3);font-weight:700;font-size:12px;flex-shrink:0">'+(i+4)+'</span>',
      '<div style="width:38px;height:38px;border-radius:12px;background:rgba(247,168,0,.12);color:var(--gold);font-weight:700;font-size:17px;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+initial+'</div>',
      '<div style="flex:1;min-width:0">',
        '<div style="font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+mainName+'</div>',
        '<div style="font-size:10px;color:var(--text3);margin-top:1px"><span style="color:'+fascia.color+';font-weight:700">'+fascia.label+'</span> · '+sub.replace(fascia.label+' · ','')+'</div>',
      '</div>',
      '<div style="text-align:right;flex-shrink:0">',
        '<div style="font-size:13px;font-weight:800;color:var(--text)">'+score+'</div>',
        '<div style="font-size:9px;color:var(--text3)">'+(tipo==='psl'?'score':'punti')+'</div>',
      '</div>',
    ].join('');
    wrap.appendChild(row);
  });
  return wrap;
}
