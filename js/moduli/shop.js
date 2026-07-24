let editProdId=null;

function checkoutShop(){
  if(!DB.cart.length){showToast('Carrello vuoto');return;}
  const sub=DB.cart.reduce((s,i)=>s+i.price*i.qty,0);
  const totale=+(sub+5.9).toFixed(2);
  const metodo=document.querySelector('.pm.sel')?.textContent?.includes('Carta')?'carta':document.querySelector('.pm.sel')?.textContent?.includes('Coin')?'contanti':'bonifico';
  // Genera movimento cassa
  const desc='Shop: '+DB.cart.map(i=>`${i.name} x${i.qty}`).join(', ');
  aggMovCassa(null,desc,totale,'Shop','entrata');
  // Stars Coin: +1 per ogni € speso (arrotondato)
  if(!DB.starsCoin) DB.starsCoin=0;
  DB.starsCoin+=Math.floor(sub);
  // Svuota carrello
  DB.cart=[];
  saveDB();
  updCartUI();
  updateStarsCoin();
  updateKpi();
  renderCassa();
  showToast('✓ Ordine confermato! +'+Math.floor(sub)+' Stars Coin');
  nav('shop',document.querySelector('.ni[onclick*="shop"]'));
}

function updateStarsCoin(){
  const el=document.getElementById('stars-coin');
  if(el) el.textContent=(DB.starsCoin||0);
}

function renderShopProdotti(){
  const grid=document.getElementById('shop-grid'); if(!grid) return;
  if(!DB.prodotti) DB.prodotti=[];
  // Prodotti default + custom
  const defaults=[
    {id:'d1',nome:'Head Padel Pro',brand:'Head',prezzo:149,coin:null,icona:'🏓',cat:'attrezzatura',stock:0},
    {id:'d2',nome:'Palline Wilson x3',brand:'Wilson',prezzo:8,coin:80,icona:'🎾',cat:'consumabili',stock:0},
    {id:'d3',nome:'Overgrip x5',brand:'Bullpadel',prezzo:12,coin:120,icona:'🤝',cat:'accessori',stock:0},
    {id:'d4',nome:'T-Shirt PSL',brand:'Stars Hub',prezzo:25,coin:250,icona:'👕',cat:'abbigliamento',stock:0}
  ];
  const tutti=[...defaults,...DB.prodotti];
  // Filtro categoria
  const filtCat=document.getElementById('shop-cat-filter')?.value||'';
  const filtro=filtCat?tutti.filter(p=>p.cat===filtCat):tutti;
  grid.innerHTML=filtro.map(p=>{
    const isCustom=typeof p.id==='number';
    const stockBadge=p.stock>0?`<div style="font-size:9px;color:var(--green);margin-top:2px">In stock: ${p.stock}</div>`:(p.stock===0?'':`<div style="font-size:9px;color:var(--red)">Esaurito</div>`);
    const coinBadge=p.coin?`<div style="font-size:10px;color:var(--gold);font-weight:600;margin-top:2px">&#11088; ${p.coin} Coin</div>`:'';
    return `<div class="shop-card" onclick="addCart('${p.nome.replace(/'/g,"\\'")}','${(p.brand||'').replace(/'/g,"\\'")}',${p.prezzo||0},'${p.icona||'📦'}',${p.coin||0})">
      <div class="shop-img">${p.icona||'📦'}</div>
      <div class="shop-body">
        <div class="shop-name">${p.nome}</div>
        <div class="shop-brand">${p.brand||'—'}</div>
        <div class="shop-price">&#8364; ${p.prezzo?(+p.prezzo).toFixed(2).replace('.',','):'—'}</div>
        ${coinBadge}${stockBadge}
      </div>
      ${isCustom?`<button style="position:absolute;top:6px;right:6px;background:rgba(255,255,255,.8);border:none;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center" onclick="event.stopPropagation();editProdotto(${p.id})">✏</button>`:''}
    </div>`;
  }).join('');
}

function openNewProdotto(){
  editProdId=null;
  document.getElementById('mProdTitle').textContent='🛒 Aggiungi prodotto';
  document.getElementById('prod-del-btn').style.display='none';
  ['prod-nome','prod-brand','prod-icona','prod-desc'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('prod-prezzo').value='';
  document.getElementById('prod-coin').value='';
  document.getElementById('prod-stock').value='0';
  document.getElementById('prod-cat').value='attrezzatura';
  openModal('modalProdotto');
}

function editProdotto(id){
  const p=DB.prodotti?.find(x=>x.id===id); if(!p) return;
  editProdId=id;
  document.getElementById('mProdTitle').textContent='✏ Modifica prodotto';
  document.getElementById('prod-del-btn').style.display='';
  document.getElementById('prod-nome').value=p.nome;
  document.getElementById('prod-brand').value=p.brand||'';
  document.getElementById('prod-prezzo').value=p.prezzo||'';
  document.getElementById('prod-coin').value=p.coin||'';
  document.getElementById('prod-stock').value=p.stock||0;
  document.getElementById('prod-icona').value=p.icona||'';
  document.getElementById('prod-cat').value=p.cat||'altro';
  document.getElementById('prod-desc').value=p.desc||'';
  openModal('modalProdotto');
}

function saveProdotto(){
  const nome=document.getElementById('prod-nome').value.trim(); if(!nome){showToast('Inserisci il nome');return;}
  if(!DB.prodotti) DB.prodotti=[];
  const obj={
    nome,
    brand:document.getElementById('prod-brand').value.trim()||'—',
    prezzo:parseFloat(document.getElementById('prod-prezzo').value)||0,
    coin:parseInt(document.getElementById('prod-coin').value)||null,
    stock:parseInt(document.getElementById('prod-stock').value)||0,
    icona:document.getElementById('prod-icona').value.trim()||'📦',
    cat:document.getElementById('prod-cat').value||'altro',
    desc:document.getElementById('prod-desc').value.trim()
  };
  if(editProdId){Object.assign(DB.prodotti.find(x=>x.id===editProdId),obj);}
  else{DB.prodotti.push({id:nid(),...obj});}
  saveDB(); renderShopProdotti(); closeModal('modalProdotto'); showToast(nome+(editProdId?' aggiornato':' aggiunto al catalogo'));
}

function delProdotto(){
  askConfirm('Elimina prodotto?','Verrà rimosso dal catalogo.','Elimina',()=>{
    DB.prodotti=DB.prodotti.filter(x=>x.id!==editProdId);
    saveDB(); closeModal('modalProdotto'); renderShopProdotti(); showToast('Prodotto eliminato');
  });
}

function addCart(name,brand,price,icon,coin){
  const ex=DB.cart.find(i=>i.name===name);
  if(ex) ex.qty++; else DB.cart.push({name,brand,price,icon,coin:coin||0,qty:1});
  saveDB(); updCartUI(); showToast(name+' aggiunto al carrello ✓');
}

function chgQty(i,d){DB.cart[i].qty+=d;if(DB.cart[i].qty<=0)DB.cart.splice(i,1);saveDB();updCartUI();}

function rmCart(i){DB.cart.splice(i,1);saveDB();updCartUI();}

function updCartUI(){
  document.getElementById('cart-cnt').textContent=DB.cart.reduce((s,i)=>s+i.qty,0);
  const list=document.getElementById('cart-list');
  if(!DB.cart.length){list.innerHTML='<div class="empty"><div class="empty-ic">&#128722;</div><div class="empty-t">Carrello vuoto</div></div>';document.getElementById('cart-sub').textContent='&#8364; 0,00';document.getElementById('cart-tot').textContent='&#8364; 5,90';return;}
  list.innerHTML=DB.cart.map((item,i)=>`<div class="cart-item"><div style="width:34px;height:34px;border-radius:7px;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${item.icon}</div><div style="flex:1"><div style="font-size:12px;font-weight:500">${item.name}</div><div style="font-size:10px;color:var(--text3)">${item.brand}</div></div><div style="display:flex;align-items:center;gap:5px"><div class="qty-btn" onclick="chgQty(${i},-1)">&#8722;</div><div class="qty-val">${item.qty}</div><div class="qty-btn" onclick="chgQty(${i},1)">+</div></div><div style="font-size:13px;font-weight:700;min-width:52px;text-align:right;font-family:var(--mono)">&#8364; ${(item.price*item.qty).toFixed(2).replace('.',',')}</div><button class="btn btn-ghost btn-xs" onclick="rmCart(${i})" style="margin-left:5px">&#x2715;</button></div>`).join('');
  const sub=DB.cart.reduce((s,i)=>s+i.price*i.qty,0);
  document.getElementById('cart-sub').textContent='&#8364; '+sub.toFixed(2).replace('.',',');
  document.getElementById('cart-tot').textContent='&#8364; '+(sub+5.9).toFixed(2).replace('.',',');
}
