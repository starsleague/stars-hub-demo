// ====================================================
// ISCRIZIONI TORNEI / CORSI
// ====================================================
let _iscrittiEvId=null;

function openIscritti(evId){
  _iscrittiEvId=evId;
  const ev=DB.eventi.find(e=>e.id===evId); if(!ev) return;
  if(!Array.isArray(ev.iscritti)) ev.iscritti=[];
  document.getElementById('mIscrittiTitle').textContent='&#128101; Iscrizioni — '+ev.nome+(ev.maxp?' (max '+ev.maxp+')':'');
  // Popola select giocatori non ancora iscritti
  const iscrIds=ev.iscritti.map(i=>i.giocatore_id);
  const disponibili=DB.giocatori.filter(g=>!iscrIds.includes(g.id));
  document.getElementById('iscr-gioc').innerHTML=disponibili.length
    ?disponibili.map(g=>`<option value="${g.id}">${g.nome} ${g.cognome}${g.sport?' ['+g.sport+']':''}</option>`).join('')
    :'<option value="">— Nessun giocatore disponibile —</option>';
  renderIscrittiLista(ev);
  openModal('modalIscritti');
}

function addIscritto(){
  const ev=DB.eventi.find(e=>e.id===_iscrittiEvId); if(!ev) return;
  const gid=parseInt(document.getElementById('iscr-gioc').value);
  if(!gid){showToast('Seleziona un giocatore');return;}
  if(ev.maxp&&Array.isArray(ev.iscritti)&&ev.iscritti.length>=ev.maxp){
    showToast('⚠️ Evento al completo (max '+ev.maxp+')');return;
  }
  if(!Array.isArray(ev.iscritti)) ev.iscritti=[];
  if(ev.iscritti.find(i=>i.giocatore_id===gid)){showToast('Già iscritto');return;}
  const pagato=document.getElementById('iscr-pag').value;
  ev.iscritti.push({giocatore_id:gid,pagato,data:new Date().toISOString().split('T')[0]});
  // Se quota e saldato → genera movimento cassa
  if(ev.quota&&pagato==='saldato'){
    const g=DB.giocatori.find(x=>x.id===gid);
    aggMovCassa(ev,'Iscrizione '+ev.nome+(g?' — '+g.nome+' '+g.cognome:''),ev.quota,'Tornei','entrata');
  }
  saveDB(); openIscritti(_iscrittiEvId); renderEventi(); renderCorsi(); showToast('Iscritto aggiunto');
}

function renderIscrittiLista(ev){
  const el=document.getElementById('iscr-lista'); if(!el) return;
  if(!Array.isArray(ev.iscritti)||!ev.iscritti.length){
    el.innerHTML='<div class="empty" style="padding:24px"><div class="empty-ic">&#128101;</div><div class="empty-t">Nessun iscritto</div></div>';
    document.getElementById('iscr-stats').textContent='';return;
  }
  const PAG={da_pagare:{col:'tag-red',label:'Da pagare'},acconto:{col:'tag-gold',label:'Acconto'},saldato:{col:'tag-green',label:'Saldato'}};
  el.innerHTML='<div class="tbl"><div class="tbl-row tbl-head" style="grid-template-columns:2fr 80px 90px 80px 60px"><div class="th">Giocatore</div><div class="th">Sport</div><div class="th">Data</div><div class="th">Pagamento</div><div class="th"></div></div>'+
    ev.iscritti.map((isc,idx)=>{
      const g=DB.giocatori.find(x=>x.id===isc.giocatore_id);
      const pg=PAG[isc.pagato||'da_pagare'];
      return `<div class="tbl-row" style="grid-template-columns:2fr 80px 90px 80px 60px">
        <div><div style="font-size:12px;font-weight:500">${g?g.nome+' '+g.cognome:'Giocatore #'+isc.giocatore_id}</div>${g?.email?`<div style="font-size:10px;color:var(--text3)">${g.email}</div>`:''}</div>
        <div class="td">${g?.sport||'—'}</div>
        <div class="td" style="font-family:var(--mono);font-size:11px">${isc.data||'—'}</div>
        <div class="td">
          <select style="font-size:10px;border:.5px solid var(--bdr);border-radius:5px;padding:2px 5px;background:var(--bg)" onchange="cambiaStatoPag(${idx},this.value)">
            <option value="da_pagare" ${isc.pagato==='da_pagare'?'selected':''}>Da pagare</option>
            <option value="acconto" ${isc.pagato==='acconto'?'selected':''}>Acconto</option>
            <option value="saldato" ${isc.pagato==='saldato'?'selected':''}>Saldato ✓</option>
          </select>
        </div>
        <div><button class="btn btn-danger btn-xs" onclick="rmIscritto(${idx})">&#128465;</button></div>
      </div>`;
    }).join('')+'</div>';
  const tot=ev.iscritti.length;
  const saldati=ev.iscritti.filter(i=>i.pagato==='saldato').length;
  const incasso=saldati*(ev.quota||0);
  document.getElementById('iscr-stats').textContent=
    `${tot} iscritti${ev.maxp?' / '+ev.maxp:''} · ${saldati} pagati`+
    (ev.quota?` · Incasso: €${incasso.toFixed(2)}`:'');
}

function cambiaStatoPag(idx,pagato){
  const ev=DB.eventi.find(e=>e.id===_iscrittiEvId); if(!ev||!ev.iscritti[idx]) return;
  const old=ev.iscritti[idx].pagato;
  ev.iscritti[idx].pagato=pagato;
  // Se diventa saldato e c'è quota → cassa
  if(pagato==='saldato'&&old!=='saldato'&&ev.quota){
    const g=DB.giocatori.find(x=>x.id===ev.iscritti[idx].giocatore_id);
    aggMovCassa(ev,'Iscrizione '+ev.nome+(g?' — '+g.nome+' '+g.cognome:''),ev.quota,'Tornei','entrata');
  }
  saveDB(); renderIscrittiLista(ev); renderCassa(); updateKpi();
}

function rmIscritto(idx){
  const ev=DB.eventi.find(e=>e.id===_iscrittiEvId); if(!ev||!ev.iscritti[idx]) return;
  ev.iscritti.splice(idx,1);
  saveDB(); openIscritti(_iscrittiEvId); renderEventi(); renderCorsi(); showToast('Iscritto rimosso');
}

function exportIscritti(){
  const ev=DB.eventi.find(e=>e.id===_iscrittiEvId); if(!ev||!ev.iscritti?.length){showToast('Nessun iscritto');return;}
  const esc=v=>'"'+String(v||'').replace(/"/g,'""')+'"';
  const csv='Nome,Cognome,Email,Sport,Pagamento,Data iscrizione\n'+
    ev.iscritti.map(isc=>{
      const g=DB.giocatori.find(x=>x.id===isc.giocatore_id)||{};
      return [esc(g.nome),esc(g.cognome),esc(g.email),esc(g.sport),esc(isc.pagato),esc(isc.data)].join(',');
    }).join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);
  a.download='iscritti-'+ev.nome.replace(/\s+/g,'-')+'.csv';a.click();showToast('CSV esportato');
}
