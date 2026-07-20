/* ============================================================
   offline.js — resiliencia ante baja/nula conectividad.
   - Marca <body class="is-offline"> para mostrar el banner y
     ocultar acciones que requieren red (buscador).
   - Cualquier calificación hecha sin red se guarda igual en
     localStorage (Store.setRating ya es 100% local) y además
     se anota en una cola (Store.SYNC_QUEUE) que se "sincroniza"
     al recuperar la conexión — aquí se simula el POST a un
     servidor remoto; si existiera un backend real, este es el
     punto donde se enviaría cada item de la cola.
   ============================================================ */

const OfflineManager = {
  listeners: [],

  init(){
    this.updateStatus();
    window.addEventListener('online', ()=> this.handleOnline());
    window.addEventListener('offline', ()=> this.updateStatus());
  },

  isOnline(){ return navigator.onLine; },

  updateStatus(){
    document.body.classList.toggle('is-offline', !navigator.onLine);
    this.listeners.forEach(fn => fn(navigator.onLine));
  },

  onChange(fn){ this.listeners.push(fn); },

  queueRating(albumId, stars){
    Store.pushToQueue({ type:'rating', payload:{ albumId, stars } });
  },

  async handleOnline(){
    this.updateStatus();
    const queue = Store.getQueue();
    if(queue.length === 0) return;

    // Simulación de sincronización diferida: en un backend real,
    // aquí se haría fetch(AUTH_BASE_URL + '/sync', {method:'POST', body: JSON.stringify(queue)})
    console.info(`Sincronizando ${queue.length} cambio(s) pendientes...`);
    await new Promise(r => setTimeout(r, 600));
    Store.clearQueue();

    const toast = document.querySelector('[data-sync-toast]');
    if(toast){
      toast.textContent = `${queue.length} calificación(es) sincronizada(s).`;
      toast.style.display = 'block';
      setTimeout(()=> toast.style.display = 'none', 3000);
    }
  }
};

OfflineManager.init();
