function renderAsdHome(){
  const pg=document.getElementById('page-asd-home'); if(!pg) return;
  const fmt=v=>'€ '+v.toFixed(2).replace('.',',');
  const entAsd=DB.asd_bilancio.filter(m=>m.tipo==='entrata').reduce((s,m)=>s+m.importo,0);
  const uscAsd=DB.asd_bilancio.filter(m=>m.tipo==='uscita').reduce((s,m)=>s+m.importo,0);
  const saldoAsd=entAsd-uscAsd;
  const oggi=new Date().toISOString().split('T')[0];
  const in30=new Date(); in30.setDate(in30.getDate()+30); const in30s=in30.toISOString().split('T')[0];
  const scadImm=DB.asd_scadenze.filter(s=>s.stato!=='completato'&&s.data_scadenza<=in30s).length;
  const tessScad=DB.giocatori.filter(g=>g.tessera&&g.tessera<oggi).length;
  pg.innerHTML=`
  <div style="background:linear-gradient(135deg,var(--navy),var(--navy-l));border-radius:var(--r);padding:18px 20px;display:flex;align-items:center;gap:14px;margin-bottom:13px;flex-wrap:wrap">
    <div style="font-size:36px">&#127963;</div>
    <div style="flex:1">
      <div style="color:#fff;font-size:18px;font-weight:700">${DB.centro.nome?DB.centro.nome+' ASD':'Il tuo centro ASD'}</div>
      <div style="color:rgba(255,255,255,.5);font-size:11px;margin-top:3px">Associazione Sportiva Dilettantistica &bull; ${DB.centro.piva?'P.IVA '+DB.centro.piva:''}</div>
    </div>
    <div style="display:flex;gap:24px;flex-wrap:wrap">
      <div style="text-align:center"><div style="color:var(--gold);font-size:22px;font-weight:700">${DB.giocatori.length}</div><div style="color:rgba(255,255,255,.4);font-size:10px">Soci</div></div>
      <div style="text-align:center"><div style="color:${saldoAsd>=0?'#4ade80':'#f87171'};font-size:22px;font-weight:700">${fmt(saldoAsd)}</div><div style="color:rgba(255,255,255,.4);font-size:10px">Saldo ASD</div></div>
      <div style="text-align:center"><div style="color:${scadImm>0?'#fbbf24':'#4ade80'};font-size:22px;font-weight:700">${scadImm}</div><div style="color:rgba(255,255,255,.4);font-size:10px">Scadenze</div></div>
    </div>
  </div>
  ${tessScad>0?`<div style="background:rgba(224,90,43,.1);border:.5px solid rgba(224,90,43,.3);border-radius:var(--r);padding:10px 14px;margin-bottom:13px;display:flex;align-items:center;gap:10px"><span style="font-size:18px">⚠️</span><span style="font-size:12px"><strong>${tessScad}</strong> tessere scadute — <a style="color:var(--gold);cursor:pointer;text-decoration:underline" onclick="nav('asd-soci',null)">vai al libro soci</a></span></div>`:''}
  <div class="g4 mb">
    <div class="kpi"><div class="kpi-l">Entrate ASD</div><div class="kpi-v" style="color:var(--green)">${fmt(entAsd)}</div></div>
    <div class="kpi"><div class="kpi-l">Uscite ASD</div><div class="kpi-v" style="color:var(--red)">${fmt(uscAsd)}</div></div>
    <div class="kpi accent"><div class="kpi-l">Saldo ASD</div><div class="kpi-v" style="color:${saldoAsd>=0?'var(--green)':'var(--red)'}">${fmt(saldoAsd)}</div></div>
    <div class="kpi"><div class="kpi-l">Mov. bilancio</div><div class="kpi-v">${DB.asd_bilancio.length}</div></div>
  </div>
  <div class="g3">
    <div class="card" style="cursor:pointer" onclick="nav('asd-soci',null)">
      <div class="card-b" style="text-align:center;padding:20px">
        <div style="font-size:28px;margin-bottom:7px">&#128214;</div>
        <div style="font-size:13px;font-weight:600;margin-bottom:4px">Libro Soci</div>


// === RUOLI ===

// ============================================================
// Ruoli & accessi
// ============================================================

<div style="font-size:11px;color:var(--text3);margin-bottom:10px">${DB.giocatori.length} soci registrati${tessScad>0?' · ⚠️ '+tessScad+' scadute':''}</div>
        <button class="btn btn-ghost btn-sm">Apri &#8594;</button>
      </div>
    </div>
    <div class="card" style="cursor:pointer" onclick="nav('asd-bilancio',null)">
      <div class="card-b" style="text-align:center;padding:20px">
        <div style="font-size:28px;margin-bottom:7px">&#128202;</div>
        <div style="font-size:13px;font-weight:600;margin-bottom:4px">Bilancio ASD</div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:10px">${DB.asd_bilancio.length} movimenti &bull; ${fmt(saldoAsd)}</div>
        <button class="btn btn-ghost btn-sm">Apri &#8594;</button>
      </div>
    </div>
    <div class="card" style="cursor:pointer" onclick="nav('asd-docs',null)">
      <div class="card-b" style="text-align:center;padding:20px">
        <div style="font-size:28px;margin-bottom:7px">&#128193;</div>
        <div style="font-size:13px;font-weight:600;margin-bottom:4px">Scadenze</div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:10px">${DB.asd_scadenze.length} tot &bull; ${scadImm} imminenti</div>
        <button class="btn btn-ghost btn-sm">Apri &#8594;</button>
      </div>
    </div>
  </div>`;
}
