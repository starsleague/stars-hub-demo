function selChat(el,t,s){
  document.querySelectorAll('.chat-li').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('chat-t').textContent=t;
  document.getElementById('chat-s').textContent=s;
  // Azzera badge del canale
  const badge=el.querySelector('.chat-li-badge');
  if(badge) badge.remove();
}

function sendMsg(){
  const inp=document.getElementById('chat-inp');
  const txt=inp.value.trim(); if(!txt) return;
  const msgs=document.getElementById('chat-msgs');
  const now=new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
  const d=document.createElement('div');d.className='msg msg-out';
  d.innerHTML=txt+'<div class="msg-time">'+now+'</div>';
  msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;
  inp.value='';
  // Salva in DB.chatMsgs (semplice persistenza)
  if(!DB.chatMsgs) DB.chatMsgs=[];
  DB.chatMsgs.push({testo:txt,ora:now,out:true,data:new Date().toISOString().split('T')[0]});
  saveDB();
}
