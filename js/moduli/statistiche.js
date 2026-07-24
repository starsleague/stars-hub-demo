function renderStatistiche(){
  const pg=document.getElementById('page-statistiche'); if(!pg) return;
  if(!DB.prenotazioni.length&&!DB.cassa.length){
    pg.innerHTML=`<div class="spread"><div class="gap"><button class="btn btn-navy btn-sm">Stagione</button></div></div><div class="empty"><div class="empty-ic">📈</div><div class="empty-t">Statistiche disponibili dopo i primi dati</div></div>`;
    return;
  }

  // Prenotazioni per sport
  const bySport={};
  DB.prenotazioni.forEach(p=>{const c=cById(p.campo_id);const s=c?.sport||'Altro';bySport[s]=(bySport[s]||0)+1;});
  const sportKeys=Object.keys(bySport);
  const maxSport=Math.max(...Object.values(bySport),1);

  // Incasso ultimi 6 mesi
  const months=[]; const mLabels=[];
  for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);mLabels.push(d.toLocaleDateString('it-IT',{month:'short'}));}
  const byMonth=months.map(m=>DB.cassa.filter(x=>x.data.startsWith(m)&&x.tipo==='entrata').reduce((s,x)=>s+x.importo,0));
  const maxM=Math.max(...byMonth,1);

  // Top giocatori (per numero prenotazioni)
  const gCnt={};
  DB.prenotazioni.forEach(p=>[p.g1,p.g2,p.g3,p.g4].filter(Boolean).forEach(g=>{gCnt[g]=(gCnt[g]||0)+1;}));
  const topG=Object.entries(gCnt).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // Ore campo usate vs disponibili
  const today=new Date();
  const mStart=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-01`;
  const oreUsate=DB.prenotazioni.filter(p=>p.data>=mStart).reduce((s,p)=>{const d=(toMins(p.fine)-toMins(p.inizio))/60;return s+d;},0);
  const giorni=today.getDate();
  const oreDispo=DB.campi.length*giorni*((toMins(DB.centro.close||'23:00')-toMins(DB.centro.open||'08:00'))/60);
  const percUso=oreDispo>0?Math.min(100,Math.round(oreUsate/oreDispo*100)):0;

  const CHART_COLORS=['var(--gold)','var(--navy)','var(--green)','var(--red)','var(--blue)','var(--slate)'];

  pg.innerHTML=`
  <div class="spread mb"><div style="font-size:13px;font-weight:600;color:var(--text2)">Statistiche in tempo reale</div><button class="btn btn-ghost btn-sm" onclick="renderStatistiche()">↻ Aggiorna</button></div>
  <div class="g2 mb">
    <!-- Grafico Prenotazioni per Sport -->
    <div class="card"><div class="card-h"><div class="card-t">📊 Prenotazioni per sport</div></div><div class="card-b">
      ${sportKeys.length?`<svg viewBox="0 0 320 ${Math.max(120,sportKeys.length*44)}" xmlns="http://www.w3.org/2000/svg" style="width:100%;font-family:var(--font)">
        ${sportKeys.map((s,i)=>{
          const w=Math.round((bySport[s]/maxSport)*220);
          const y=i*44+10;
          return `<text x="0" y="${y+14}" font-size="11" fill="var(--text2)">${s}</text>
          <rect x="0" y="${y+20}" width="${w}" height="14" rx="4" fill="${CHART_COLORS[i%CHART_COLORS.length]}" opacity=".85"/>
          <text x="${w+5}" y="${y+32}" font-size="11" fill="var(--text3)">${bySport[s]}</text>`;
        }).join('')}
      </svg>`:'<div class="empty" style="padding:20px"><div style="font-size:11px;color:var(--text3)">Nessun dato</div></div>'}
    </div></div>

    <!-- Grafico Incasso mensile -->
    <div class="card"><div class="card-h"><div class="card-t">📈 Incasso ultimi 6 mesi</div></div><div class="card-b">
      <svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;font-family:var(--font)">
        <line x1="36" y1="10" x2="36" y2="100" stroke="var(--bdr)" stroke-width="1"/>
        <line x1="36" y1="100" x2="310" y2="100" stroke="var(--bdr)" stroke-width="1"/>
        ${byMonth.map((v,i)=>{const x=36+i*(274/5);const y=100-Math.round((v/maxM)*85);return `<line x1="${x}" y1="100" x2="${x}" y2="${y}" stroke="var(--gold)" stroke-width="2" stroke-linecap="round"/>`;}).join('')}
        ${byMonth.map((v,i)=>{const x=36+i*(274/5);const y=100-Math.round((v/maxM)*85);return `<circle cx="${x}" cy="${y}" r="4" fill="var(--gold)"/><text x="${x}" y="115" text-anchor="middle" font-size="9" fill="var(--text3)">${mLabels[i]}</text>${v>0?`<text x="${x}" y="${y-7}" text-anchor="middle" font-size="9" fill="var(--text2)">€${Math.round(v)}</text>`:''}`; }).join('')}
      </svg>
    </div></div>
  </div>

  <div class="g2 mb">
    <!-- Utilizzo campi -->
    <div class="card"><div class="card-h"><div class="card-t">⏱ Utilizzo campi questo mese</div></div><div class="card-b">
      <div style="text-align:center;padding:10px 0">


// === ASD_HOME ===

// ============================================================
// ASD Home dashboard
// ============================================================

<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style="width:120px">
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--bg2)" stroke-width="12"/>
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--gold)" stroke-width="12"
            stroke-dasharray="${Math.round(percUso*3.14)} 314"
            stroke-dashoffset="78.5" stroke-linecap="round" transform="rotate(-90 60 60)"/>
          <text x="60" y="56" text-anchor="middle" font-size="20" font-weight="700" fill="var(--text)">${percUso}%</text>
          <text x="60" y="72" text-anchor="middle" font-size="9" fill="var(--text3)">utilizzo</text>
        </svg>
        <div style="font-size:11px;color:var(--text3);margin-top:8px">${oreUsate.toFixed(1)}h usate / ${oreDispo.toFixed(0)}h disponibili</div>
      </div>
    </div></div>

    <!-- Top giocatori -->
    <div class="card"><div class="card-h"><div class="card-t">🏆 Top giocatori</div></div><div class="card-b">
      ${topG.length?topG.map(([n,c],i)=>`<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:.5px solid var(--bdr2)">
        <div style="width:20px;height:20px;border-radius:5px;background:${i===0?'var(--gold)':i===1?'var(--slate)':'var(--bg2)'};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:${i<2?'var(--navy)':'var(--text3)'}">${i+1}</div>
        <div style="flex:1;font-size:12px;font-weight:500">${n}</div>
        <div style="font-size:11px;font-weight:700;color:var(--gold)">${c} pren.</div>
      </div>`).join(''):'<div class="empty" style="padding:20px"><div style="font-size:11px;color:var(--text3)">Nessun dato</div></div>'}
    </div></div>
  </div>`;
}
