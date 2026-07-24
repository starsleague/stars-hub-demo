// === SHELL SCRIPT ===




// === WIZARD ===

// ============================================================
// Wizard primo avvio
// ============================================================

// ====================================================
// WIZARD
// ====================================================
const WS = 6;
let wc = 1;
const wlabels = ['Centro','Sport','Campi','Orari','Staff','Fine'];
let wcalState = {y: new Date().getFullYear(), m: new Date().getMonth()};

// Guard: wizard rimosso dall'HTML — disabilita tutte le funzioni wizard
(function() {
  if (!document.getElementById('wizProg') && !document.getElementById('wizard')) {
    window.buildWizProg = function(){};
    window.syncWizProg  = function(){};
    window.showWiz      = function(){};
    window.wizNext      = function(){};
    window.wizBack      = function(){};
    window.wizSave      = function(){};
  }
})();

if(document.getElementById('wizProg')) buildWizProg();

let appcalState={y:new Date().getFullYear(),m:new Date().getMonth()};

function buildWizProg() {
  const el = document.getElementById('wizProg');
  el.innerHTML = '';
  for (let i=1;i<=WS;i++) {
    const col = document.createElement('div'); col.className='wp-col';
    const dot = document.createElement('div'); dot.id='wd'+i; dot.className='wp-dot'+(i===1?' active':''); dot.textContent=i;
    const lbl = document.createElement('div'); lbl.className='wp-lbl'; lbl.textContent=wlabels[i-1];
    col.append(dot,lbl); el.appendChild(col);
    if(i<WS){const l=document.createElement('div');l.id='wl'+i;l.className='wp-line';l.style.cssText='flex:1;height:2px;background:var(--bdr);margin:0 5px 12px;transition:background .2s';el.appendChild(l);}
  }
}

function syncWizProg() {
  for(let i=1;i<=WS;i++){
    const d=document.getElementById('wd'+i);
    if(i<wc){d.className='wp-dot done';d.textContent='&#10003;';}
    else if(i===wc){d.className='wp-dot active';d.textContent=i;}
    else{d.className='wp-dot';d.textContent=i;}
    const l=document.getElementById('wl'+i);
    if(l) l.classList.toggle('done',i<wc);
  }
  document.getElementById('wizBack').style.display=wc>1?'':'none';
  document.getElementById('wizNext').textContent=wc===WS?'Accedi al gestionale &#8594;':'Avanti &#8594;';
}

function wizNext() {
  if(!wizSave(wc)) return;
  if(wc===WS){finishWiz();return;}
  if(wc===2) buildCampiWiz();
  if(wc===4) buildChiusureCal();
  if(wc===WS-1) buildWizRiepilogo();
  document.getElementById('ws'+wc).classList.remove('active');
  wc++;
  document.getElementById('ws'+wc).classList.add('active');
  syncWizProg();
}

function wizPrev() {
  document.getElementById('ws'+wc).classList.remove('active');
  wc--;
  document.getElementById('ws'+wc).classList.add('active');
  syncWizProg();
}

function skipWiz() {
  saveDB();
  document.getElementById('wizard').style.display='none';
  document.getElementById('mainApp').style.display='flex';
  initApp();
}

function finishWiz() {
  DB.configured = true;
  saveDB();
  document.getElementById('wizard').style.display='none';
  document.getElementById('mainApp').style.display='flex';
  initApp();
}

function wizSave(s) {
  if(s===1){
    const n=document.getElementById('w-nome').value.trim();
    if(!n){showToast('Inserisci il nome del centro');return false;}
    DB.centro.nome=n; DB.centro.citta=document.getElementById('w-citta').value.trim(); DB.centro.cap=document.getElementById('w-cap').value.trim();
    DB.centro.tel=document.getElementById('w-tel').value.trim(); DB.centro.email=document.getElementById('w-email').value.trim(); DB.centro.piva=document.getElementById('w-piva').value.trim();
    saveDB();
  }
  if(s===2){
    DB.sport=Array.from(document.querySelectorAll('#sportGrid .sport-opt.sel')).map(e=>e.dataset.sport);
    if(!DB.sport.length){showToast('Seleziona almeno uno sport');return false;}
    saveDB();
  }
  if(s===3){saveCampiWiz();saveDB();}
  if(s===4){
    DB.centro.open=document.getElementById('w-open').value; DB.centro.close=document.getElementById('w-close').value;
    DB.centro.chiusure_wd=Array.from(document.querySelectorAll('#wdPicker .cc-opt.active')).map(e=>parseInt(e.dataset.wd));
    saveDB();
  }
  if(s===5){saveStaffWiz();saveDB();}
  return true;
}

function buildCampiWiz() {
  const icons = {Padel:'&#127934;',Tennis:'&#127936;','Beach Tennis':'&#127958;',Pickleball:'&#127955;',Calcio:'&#9917;',Fitness:'&#127947;'};
  document.getElementById('campiConfig').innerHTML = DB.sport.map(s => {
    const k=s.replace(/ /g,'_');
    return `<div class="cc-wrap" data-sport="${s}">
      <div class="cc-head">${icons[s]||'&#127967;'} ${s}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:5px"><span style="font-size:11px;color:var(--text3);min-width:55px">Indoor</span><input class="cc-inp" type="number" min="0" value="0" data-ti="indoor" data-sp="${s}" oninput="updNomi(this)" style="width:55px"></div>
        <div style="display:flex;align-items:center;gap:5px"><span style="font-size:11px;color:var(--text3);min-width:55px">Outdoor</span><input class="cc-inp" type="number" min="0" value="0" data-ti="outdoor" data-sp="${s}" oninput="updNomi(this)" style="width:55px"></div>
        <div style="display:flex;align-items:center;gap:5px"><span style="font-size:11px;color:var(--text3);min-width:55px">Misto</span><input class="cc-inp" type="number" min="0" value="0" data-ti="misto" data-sp="${s}" oninput="updNomi(this);updMisto(this)" style="width:55px"></div>
      </div>
      <div id="misto-sec-${k}" style="display:none"><div class="misto-dates"><div class="misto-dates-t">Periodo campo coperto (dal/al gg/mm)</div><div class="f-grid"><input class="f-input" data-misto-s="${s}" placeholder="01/10"><input class="f-input" data-misto-e="${s}" placeholder="31/03"></div></div></div>
      <div style="background:rgba(247,168,0,.07);border:.5px solid rgba(247,168,0,.2);border-radius:8px;padding:10px 12px;margin-top:8px">
        <div style="font-size:10px;color:var(--gold-d);font-weight:600;text-transform:uppercase;margin-bottom:8px">Tariffe orarie</div>
        <div style="display:grid;grid-template-columns:auto 1fr auto auto auto;gap:6px;align-items:center;margin-bottom:6px">
          <span style="font-size:11px;min-width:56px">Tariffa 1</span><input class="f-input" type="number" data-t1p="${s}" placeholder="€/h"><span style="font-size:10px;color:var(--text3)">Dalle</span><input class="f-input" type="time" data-t1s="${s}" value="08:00" style="width:90px"><input class="f-input" type="time" data-t1e="${s}" value="18:00" style="width:90px">
        </div>
        <div style="display:grid;grid-template-columns:auto 1fr auto auto auto;gap:6px;align-items:center">
          <span style="font-size:11px;min-width:56px">Tariffa 2</span><input class="f-input" type="number" data-t2p="${s}" placeholder="€/h"><span style="font-size:10px;color:var(--text3)">Dalle</span><input class="f-input" type="time" data-t2s="${s}" value="18:00" style="width:90px"><input class="f-input" type="time" data-t2e="${s}" value="23:00" style="width:90px">
        </div>
      </div>
      <div style="margin-top:10px"><div style="font-size:11px;font-weight:500;color:var(--text2);margin-bottom:6px">Nomi campi (modifica se vuoi)</div><div id="nomi-${k}"><div style="font-size:11px;color:var(--text3)">Inserisci il numero di campi sopra</div></div></div>
    </div>`;
  }).join('');
}

function updNomi(inp) {
  const sp=inp.dataset.sp, k=sp.replace(/ /g,'_');
  const ind=parseInt(document.querySelector(`[data-ti="indoor"][data-sp="${sp}"]`)?.value)||0;
  const out=parseInt(document.querySelector(`[data-ti="outdoor"][data-sp="${sp}"]`)?.value)||0;
  const mis=parseInt(document.querySelector(`[data-ti="misto"][data-sp="${sp}"]`)?.value)||0;
  const cont=document.getElementById('nomi-'+k); if(!cont) return;
  let h='';
  const tipi=[['indoor',ind],['outdoor',out],['misto',mis]];
  tipi.forEach(([t,n])=>{for(let i=1;i<=n;i++){const def=`${sp} ${t.charAt(0).toUpperCase()+t.slice(1)} ${i}`;h+=`<input class="f-input" placeholder="${def}" data-cnome="${sp}_${t}_${i}" value="${def}" style="margin-bottom:5px">`;}});
  cont.innerHTML=h||'<div style="font-size:11px;color:var(--text3)">Inserisci il numero di campi</div>';
}

function updMisto(inp) {
  const k=inp.dataset.sp.replace(/ /g,'_');
  const sec=document.getElementById('misto-sec-'+k);
  if(sec) sec.style.display=parseInt(inp.value)>0?'block':'none';
}

function saveCampiWiz() {
  DB.campi=[];
  DB.sport.forEach(s=>{
    const t1p=parseFloat(document.querySelector(`[data-t1p="${s}"]`)?.value)||0;
    const t1s=document.querySelector(`[data-t1s="${s}"]`)?.value||'08:00';
    const t1e=document.querySelector(`[data-t1e="${s}"]`)?.value||'18:00';
    const t2p=parseFloat(document.querySelector(`[data-t2p="${s}"]`)?.value)||0;
    const t2s=document.querySelector(`[data-t2s="${s}"]`)?.value||'18:00';
    const t2e=document.querySelector(`[data-t2e="${s}"]`)?.value||'23:00';
    const ms=document.querySelector(`[data-misto-s="${s}"]`)?.value||'';
    const me=document.querySelector(`[data-misto-e="${s}"]`)?.value||'';
    ['indoor','outdoor','misto'].forEach(t=>{
      const n=parseInt(document.querySelector(`[data-ti="${t}"][data-sp="${s}"]`)?.value)||0;
      for(let i=1;i<=n;i++){
        const el=document.querySelector(`[data-cnome="${s}_${t}_${i}"]`);
        const nome=el?el.value.trim()||`${s} ${t.charAt(0).toUpperCase()+t.slice(1)} ${i}`:`${s} ${t.charAt(0).toUpperCase()+t.slice(1)} ${i}`;
        DB.campi.push({id:nid(),nome,sport:s,tipo:t.charAt(0).toUpperCase()+t.slice(1),coper_s:t==='misto'?ms:'',coper_e:t==='misto'?me:'',t1p,t1s,t1e,t2p,t2s,t2e,note:''});
      }
    });
  });
}

function buildChiusureCal() {
  renderCalWiz(document.getElementById('chiusureCalWiz'));
}

function renderCalWiz(cont) { _renderCal(cont,wcalState,true); }

function renderImpostCal() { const c=document.getElementById('impostazioni-cal'); if(c) _renderCal(c,appcalState,false); }

function wizCalP(){wcalState.m--;if(wcalState.m<0){wcalState.m=11;wcalState.y--;}renderCalWiz(document.getElementById('chiusureCalWiz'));}

function wizCalN(){wcalState.m++;if(wcalState.m>11){wcalState.m=0;wcalState.y++;}renderCalWiz(document.getElementById('chiusureCalWiz'));}

function appCalP(){appcalState.m--;if(appcalState.m<0){appcalState.m=11;appcalState.y--;}renderImpostCal();}

function appCalN(){appcalState.m++;if(appcalState.m>11){appcalState.m=0;appcalState.y++;}renderImpostCal();}

function _renderCal(cont, state, wiz) {
  const {y,m}=state;
  const today=new Date();
  const first=new Date(y,m,1);
  const last=new Date(y,m+1,0);
  let dow=first.getDay(); dow=dow===0?6:dow-1;
  const mnames=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  const prev=wiz?'wizCalP':'appCalP', next=wiz?'wizCalN':'appCalN';
  let h=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
    <button class="btn btn-ghost btn-sm" onclick="${prev}()">&#8592;</button>
    <span style="font-size:13px;font-weight:600">${mnames[m]} ${y}</span>
    <button class="btn btn-ghost btn-sm" onclick="${next}()">&#8594;</button>
  </div>
  <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px">
    ${['L','M','M','G','V','S','D'].map(d=>`<div style="font-size:9px;text-align:center;color:var(--text3);font-weight:600;padding:2px">${d}</div>`).join('')}
  </div>
  <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">`;
  let cur=new Date(y,m,1); cur.setDate(cur.getDate()-dow);
  for(let r=0;r<6;r++){
    for(let c=0;c<7;c++){
      const ds=cur.toISOString().split('T')[0];
      const isM=cur.getMonth()===m;
      const isT=cur.toDateString()===today.toDateString();
      const isC=DB.centro.chiusure_date.includes(ds);
      h+=`<div class="chiusure-day ${isC?'chiuso':''} ${isT?'oggi':''}" style="${!isM?'opacity:.3':''}" onclick="togChius('${ds}',this)">${cur.getDate()}</div>`;
      cur.setDate(cur.getDate()+1);
    }
    if(cur>last&&r>=3) break;
  }
  h+='</div>';
  cont.innerHTML=h;
}

function togChius(ds,el){
  const i=DB.centro.chiusure_date.indexOf(ds);
  if(i>=0){DB.centro.chiusure_date.splice(i,1);el.classList.remove('chiuso');}
  else{DB.centro.chiusure_date.push(ds);el.classList.add('chiuso');}
}

function addPersonaleWiz(tipo) {
  const list=document.getElementById('personaleList');
  const icons={Padel:'&#127934;',Tennis:'&#127936;','Beach Tennis':'&#127958;',Pickleball:'&#127955;',Calcio:'&#9917;',Fitness:'&#127947;'};
  const sportOpts=DB.sport.map(s=>`<option>${icons[s]||''}${s}</option>`).join('');
  const uid='wz_'+Date.now();
  const d=document.createElement('div');d.className='cc-wrap mb';
  d.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end">
    <div><label class="f-label">Nome *</label><input class="f-input" data-wzn="${uid}" placeholder="Nome"></div>
    <div><label class="f-label">Cognome</label><input class="f-input" data-wzc="${uid}" placeholder="Cognome"></div>
    <button class="btn btn-danger btn-sm" onclick="this.closest('.cc-wrap').remove()">&#x2715;</button>
  </div>
  ${tipo==='istruttore'?`<div class="f-row mt"><label class="f-label">Sport insegnati</label><select class="f-input f-select" data-wzs="${uid}">${sportOpts}</select></div>`:`<div class="f-row mt"><label class="f-label">Mansione</label><input class="f-input" data-wzm="${uid}" placeholder="es. Receptionist"></div>`}
  <input type="hidden" data-wzt="${uid}" value="${tipo}">`;
  list.appendChild(d);
}

function saveStaffWiz() {
  document.querySelectorAll('[data-wzt]').forEach(inp=>{
    const id=inp.dataset.wzt.replace('data-wzt','');
    const uid=Object.values(inp.dataset)[0];
    const n=document.querySelector(`[data-wzn="${uid}"]`)?.value.trim(); if(!n) return;
    const c=document.querySelector(`[data-wzc="${uid}"]`)?.value.trim()||'';
    const tipo=inp.value;
    const sp=tipo==='istruttore'?[document.querySelector(`[data-wzs="${uid}"]`)?.value||'']:[];
    const mans=tipo==='dipendente'?document.querySelector(`[data-wzm="${uid}"]`)?.value.trim():'';
    DB.staff.push({id:nid(),nome:n,cognome:c,tipo,sport:sp.filter(Boolean),mansione:mans,email:'',tel:'',note:''});
  });
}

function buildWizRiepilogo() {
  document.getElementById('ric-nome').textContent=DB.centro.nome||'—';
  document.getElementById('ric-sport').textContent=DB.sport.join(', ')||'—';
  document.getElementById('ric-campi').textContent=DB.campi.length+' campi';
  document.getElementById('ric-orari').textContent=DB.centro.open+'–'+DB.centro.close;
  document.getElementById('ric-staff').textContent=DB.staff.length?DB.staff.map(s=>s.nome).join(', '):'Nessuno';
}
