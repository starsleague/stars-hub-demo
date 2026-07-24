const DB_DEFAULT = {
  centro: {nome:'',citta:'',cap:'',tel:'',email:'',piva:'',open:'08:00',close:'23:00',chiusure_wd:[],chiusure_date:[]},
  sport: [],
  campi: [],
  prenotazioni: [],
  eventi: [],
  giocatori: [],
  staff: [],
  turni: [],
  todo: [],
  cart: [],
  cassa: [],
  abbonamenti_piani: [
    {id:1,nome:'Base',colore:'var(--silver)',prezzo:29,benefici:['8 partite/mese','Prenotazione prioritaria'],attivo:true},
    {id:2,nome:'Plus',colore:'var(--gold)',prezzo:49,benefici:['Partite illimitate','Corsi inclusi','Stars Coin x2'],attivo:true},
    {id:3,nome:'Elite',colore:'var(--navy)',prezzo:79,benefici:['Tutto incluso','Istruttore dedicato','Accesso PSL events'],attivo:true}
  ],
  abbonamenti: [],
  asd_soci: [],
  asd_bilancio: [],
  asd_scadenze: [],
  asd_assemblee: [],
  calendario_centro: [],
  coach_progressioni: [],
  _id: 1
};

// Carica da localStorage o usa default
let DB = JSON.parse(localStorage.getItem('starsHubDB') || 'null') || JSON.parse(JSON.stringify(DB_DEFAULT));

// Persisti ogni modifica

function saveDB() { localStorage.setItem('starsHubDB', JSON.stringify(DB)); }

function nid() { const id = DB._id++; saveDB(); return id; }
