// (rimosso codice top-level orfano che impostava pren-data fuori da ogni funzione —
//  causava timing imprevedibile e blocchi a cascata su select campo / prezzo / salvataggio)

// ====================================================
// CALENDARIO CENTRO
// ====================================================
let ccDate=new Date(), ccView='month', editCCId=null;
const CC_TYPES={
  riunione:{ic:'&#128101;',col:'var(--blue)',lbl:'Riunione'},
  corso_agg:{ic:'&#127979;',col:'var(--green)',lbl:'Corso aggiornamento'},
  pagamento:{ic:'&#128176;',col:'var(--gold)',lbl:'Pagamento'},
  scadenza:{ic:'&#128308;',col:'var(--red)',lbl:'Scadenza'},
  manutenzione:{ic:'&#128295;',col:'var(--slate)',lbl:'Manutenzione'},
  altro:{ic:'&#128197;',col:'var(--navy)',lbl:'Altro'}
};

if(!DB.calendario_centro) DB.calendario_centro=[];

function renderCC(){
  if(!DB.calendario_centro) DB.calendario_centro=[];
  const lbl=document.getElementById('cc-lbl'); if(!lbl)return;
  const mnames=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  lbl.textContent=mnames[ccDate.getMonth()]+' '+ccDate.getFullYear();
  const flt=document.getElementById('cc-filter')?.value||'';
  const filtered=DB.calendario_centro.filter(e=>!flt||e.tipo===flt);
  if(ccView==='month') _renderCCMonth(filtered);
  else _renderCCList(filtered);
}

function ccPrev(){if(ccView==='month')ccDate.setMonth(ccDate.getMonth()-1);else ccDate.setMonth(ccDate.getMonth()-1);renderCC();}

function ccNext(){if(ccView==='month')ccDate.setMonth(ccDate.getMonth()+1);else ccDate.setMonth(ccDate.getMonth()+1);renderCC();}

function ccSetView(v,btn){
  ccView=v;
  document.getElementById('cc-cal-wrap').style.display=v==='month'?'':'none';
  document.getElementById('cc-list-wrap').style.display=v==='list'?'':'none';
  document.querySelectorAll('#cc-view-month,#cc-view-list').forEach(b=>{b.style.background='';b.style.color='';b.classList.add('btn-ghost');b.classList.remove('btn-navy');});
  btn.classList.remove('btn-ghost'); btn.style.background='var(--navy)'; btn.style.color='#fff';
  renderCC();
}

function _renderCCMonth(evs){
  const wrap=document.getElementById('cc-cal-wrap'); if(!wrap)return;
  const y=ccDate.getFullYear(),m=ccDate.getMonth();
  const today=new Date(); let cur=new Date(y,m,1); let dow=cur.getDay(); dow=dow===0?6:dow-1; cur.setDate(cur.getDate()-dow);
  const last=new Date(y,m+1,0);
  let h=`<div class="cal-wrap"><div class="cal-head-row">${['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].map(d=>`<div class="cal-dow">${d}</div>`).join('')}</div><div class="cal-body">`;
  for(let r=0;r<6;r++){
    for(let c=0;c<7;c++){
      const ds=cur.toISOString().split('T')[0];
      const isT=cur.toDateString()===today.toDateString(), isO=cur.getMonth()!==m;
      const dayEvs=evs.filter(e=>e.data===ds);
      h+=`<div class="cal-cell${isT?' today':''}${isO?' other-month':''}" onclick="openNewCC('${ds}')">
        <div class="cal-day">${cur.getDate()}</div>
        ${dayEvs.slice(0,3).map(e=>{const t=CC_TYPES[e.tipo]||CC_TYPES.altro;return `<div style="font-size:9px;background:${t.col};color:#fff;border-radius:3px;padding:1px 4px;margin-bottom:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer" onclick="event.stopPropagation();editCC(${e.id})">${t.ic} ${e.titolo}</div>`;}).join('')}
        ${dayEvs.length>3?`<div style="font-size:8px;color:var(--text3)">+${dayEvs.length-3} altri</div>`:''}
      </div>`;
      cur.setDate(cur.getDate()+1);
    }
    if(cur>last&&r>=3) break;
  }
  h+='</div></div>';
  h+=`<div style="display:flex;gap:12px;padding:9px 4px;flex-wrap:wrap">${Object.entries(CC_TYPES).map(([k,v])=>`<div style="display:flex;align-items:center;gap:4px;font-size:10px;color:var(--text3)"><div style="width:8px;height:8px;border-radius:2px;background:${v.col}"></div>${v.lbl}</div>`).join('')}</div>`;
  wrap.innerHTML=h;
}

function _renderCCList(evs){
  const wrap=document.getElementById('cc-list-wrap'); if(!wrap)return;
  const sorted=[...evs].sort((a,b)=>a.data.localeCompare(b.data));
  const today=new Date().toISOString().split('T')[0];
  if(!sorted.length){wrap.innerHTML='<div class="empty"><div class="empty-ic">&#128198;</div><div class="empty-t">Nessun evento nel calendario</div><button class="btn btn-primary btn-sm" onclick="openNewCC()">+ Aggiungi</button></div>';return;}
  wrap.innerHTML='<div class="tbl">'+sorted.map(e=>{
    const t=CC_TYPES[e.tipo]||CC_TYPES.altro;
    const past=e.data<today;
    return `<div class="tbl-row" style="grid-template-columns:90px 22px 1fr 120px 80px" onclick="editCC(${e.id})">
      <div style="font-family:var(--mono);font-size:11px;color:${past?'var(--text3)':'var(--text)'}${e.data===today?';font-weight:700;color:var(--gold)':''}">${e.data}${e.ora?' '+e.ora:''}</div>
      <div style="font-size:14px">${t.ic}</div>
      <div>
        <div style="font-size:12px;font-weight:500${past?';color:var(--text3)':''}">${e.titolo}</div>
        ${e.partecip?`<div style="font-size:10px;color:var(--text3)">&#128101; ${e.partecip}</div>`:''}
      </div>
      <div><span class="tag" style="background:${t.col}20;color:${t.col}">${t.lbl}</span></div>
      <div onclick="event.stopPropagation()"><button class="btn btn-danger btn-xs" onclick="delCC(${e.id})">&#128465;</button></div>
    </div>`;
  }).join('')+'</div>';
}

function openNewCC(ds){
  editCCId=null;
  document.getElementById('mCCTitle').textContent='+ Nuovo evento centro';
  document.getElementById('cc-del-btn').style.display='none';
  document.getElementById('cc-titolo').value='';
  document.getElementById('cc-data').value=ds||new Date().toISOString().split('T')[0];
  document.getElementById('cc-ora').value='';
  document.getElementById('cc-partecip').value='';
  document.getElementById('cc-note').value='';
  openModal('modalCC');
}

function editCC(id){
  const e=DB.calendario_centro.find(x=>x.id===id); if(!e)return;
  editCCId=id;
  document.getElementById('mCCTitle').textContent='✏ Modifica evento';
  document.getElementById('cc-del-btn').style.display='';
  document.getElementById('cc-titolo').value=e.titolo;
  document.getElementById('cc-tipo').value=e.tipo;
  document.getElementById('cc-data').value=e.data;
  document.getElementById('cc-ora').value=e.ora||'';
  document.getElementById('cc-partecip').value=e.partecip||'';
  document.getElementById('cc-note').value=e.note||'';
  openModal('modalCC');
}

function saveCC(){


// === ASSEMBLEE ===

// ============================================================
// Assemblee ASD
// ============================================================

const titolo=document.getElementById('cc-titolo').value.trim();
  if(!titolo){showToast('Inserisci un titolo');return;}
  const data=document.getElementById('cc-data').value;
  if(!data){showToast('Inserisci una data');return;}
  const ev={titolo,tipo:document.getElementById('cc-tipo').value,data,ora:document.getElementById('cc-ora').value,partecip:document.getElementById('cc-partecip').value.trim(),note:document.getElementById('cc-note').value.trim()};
  if(editCCId){Object.assign(DB.calendario_centro.find(x=>x.id===editCCId),ev);}
  else{DB.calendario_centro.push({id:nid(),...ev});}
  saveDB(); closeModal('modalCC'); renderCC(); showToast('Evento salvato');
}

function delCC(id){
  const idDel=id||editCCId;
  askConfirm('Elimina evento?','Non recuperabile.','Elimina',()=>{
    DB.calendario_centro=DB.calendario_centro.filter(x=>x.id!==idDel);
    saveDB(); closeModal('modalCC'); renderCC(); showToast('Eliminato');
  });
}
