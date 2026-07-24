// ====================================================
// TURNI (calendario settimanale)
// ====================================================
let turniWeekStart=null;

function initTurniWeek(){
  const d=new Date(); d.setHours(0,0,0,0);
  const dow=(d.getDay()+6)%7; d.setDate(d.getDate()-dow);
  turniWeekStart=d;
}

function renderTurni(){
  const el=document.getElementById('pers-turni'); if(!el) return;
  if(!turniWeekStart) initTurniWeek();
  if(!DB.staff.length){el.innerHTML='<div class="empty"><div class="empty-ic">📅</div><div class="empty-t">Calendario turni</div><div class="empty-s">Aggiungi prima lo staff</div></div>';return;}
  const days=['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
  const fasce=['Mattina','Pomeriggio','Sera'];
  const fasceH={Mattina:'07–13',Pomeriggio:'13–19',Sera:'19–23'};
  const weekDays=days.map((_,i)=>{const d=new Date(turniWeekStart);d.setDate(d.getDate()+i);return d;});
  const weekDs=weekDays.map(d=>d.toISOString().split('T')[0]);
  const mondayStr=weekDays[0].toLocaleDateString('it-IT',{day:'numeric',month:'short'});
  const sundayStr=weekDays[6].toLocaleDateString('it-IT',{day:'numeric',month:'short',year:'numeric'});
  const colW=Math.floor(100/(DB.staff.length+1));
  let h=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
    <button class="btn btn-ghost btn-sm" onclick="turniPrev()">← Prec.</button>
    <span style="font-size:13px;font-weight:600;flex:1;text-align:center">${mondayStr} – ${sundayStr}</span>
    <button class="btn btn-ghost btn-sm" onclick="turniNext()">Succ. →</button>
    <button class="btn btn-primary btn-sm" onclick="openNewTurno()">+ Turno</button>
  </div>
  <div style="overflow-x:auto">
  <table style="width:100%;border-collapse:collapse;font-size:11px">
  <thead>
    <tr style="background:var(--navy-d)">
      <th style="padding:8px 10px;color:rgba(255,255,255,.4);font-weight:500;text-align:left;width:80px">Fascia</th>
      ${DB.staff.map(s=>`<th style="padding:8px 6px;color:#fff;font-weight:600;text-align:center">${s.nome}</th>`).join('')}
    </tr>
  </thead>
  <tbody>`;
  weekDs.forEach((ds,di)=>{
    h+=`<tr><td colspan="${DB.staff.length+1}" style="background:var(--bg);padding:4px 10px;font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;border-bottom:.5px solid var(--bdr)">${days[di]} ${weekDays[di].getDate()}</td></tr>`;
    fasce.forEach(fascia=>{
      h+=`<tr style="border-bottom:.5px solid var(--bdr2)">
        <td style="padding:6px 10px;color:var(--text3);font-size:10px">${fascia}<br><span style="color:var(--text3);font-size:9px;font-family:var(--mono)">${fasceH[fascia]}</span></td>`;
      DB.staff.forEach(s=>{
        const turno=DB.turni.find(t=>t.staff_id===s.id&&t.data===ds&&t.fascia===fascia);
        h+=`<td style="padding:4px;text-align:center;cursor:pointer" onclick="quickTurno('${s.id}','${ds}','${fascia}')">`;
        if(turno){
          h+=`<div style="background:rgba(30,49,74,.1);border:.5px solid var(--bdr);border-radius:5px;padding:4px 6px;cursor:pointer;position:relative" onclick="event.stopPropagation();delTurno(${turno.id})">
            <div style="font-size:10px;font-weight:600;color:var(--navy)">${turno.ora_inizio||''}${turno.ora_fine?'–'+turno.ora_fine:''}</div>
            <div style="font-size:8px;color:var(--text3)">Clicca ×</div>
          </div>`;
        } else {
          h+=`<div style="width:100%;height:30px;border:.5px dashed var(--bdr2);border-radius:5px;display:flex;align-items:center;justify-content:center;color:var(--text3);font-size:16px">+</div>`;
        }
        h+='</td>';
      });
      h+='</tr>';
    });
  });
  h+='</tbody></table></div>';
  el.innerHTML=h;
}

function turniPrev(){turniWeekStart.setDate(turniWeekStart.getDate()-7);renderTurni();}

function turniNext(){turniWeekStart.setDate(turniWeekStart.getDate()+7);renderTurni();}

function quickTurno(staffId,data,fascia){
  // Toggling rapido: se esiste elimina, altrimenti aggiunge con orari fascia
  const existing=DB.turni.find(t=>t.staff_id==staffId&&t.data===data&&t.fascia===fascia);
  if(existing){delTurno(existing.id);return;}
  const oreMap={Mattina:{s:'07:00',e:'13:00'},Pomeriggio:{s:'13:00',e:'19:00'},Sera:{s:'19:00',e:'23:00'}};
  DB.turni.push({id:nid(),staff_id:parseInt(staffId),data,fascia,ora_inizio:oreMap[fascia].s,ora_fine:oreMap[fascia].e,note:''});
  saveDB(); renderTurni();
}

function delTurno(id){DB.turni=DB.turni.filter(t=>t.id!==id);saveDB();renderTurni();}

function openNewTurno(){
  document.getElementById('turno-staff').innerHTML=DB.staff.map(s=>`<option value="${s.id}">${s.nome} ${s.cognome}</option>`).join('');
  document.getElementById('turno-data').value=new Date().toISOString().split('T')[0];
  openModal('modalTurno');
}

function saveTurno(){
  const staffId=parseInt(document.getElementById('turno-staff').value);
  const data=document.getElementById('turno-data').value;
  const fascia=document.getElementById('turno-fascia').value;
  if(!staffId||!data){showToast('Compila tutti i campi');return;}
  DB.turni.push({id:nid(),staff_id:staffId,data,fascia,ora_inizio:document.getElementById('turno-oi').value,ora_fine:document.getElementById('turno-of').value,note:document.getElementById('turno-note').value.trim()});
  saveDB(); closeModal('modalTurno'); renderTurni(); showToast('Turno aggiunto');
}
