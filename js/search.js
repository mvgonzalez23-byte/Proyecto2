/* ============================================================
   search.js — buscador de artistas dinámico.
   Maneja 3 estados explícitos: cargando, sin consulta (vacío),
   y sin resultados — nunca un error genérico de red.
   ============================================================ */

const SearchView = {
  root: null,
  debounceTimer: null,

  mount(root){
    this.root = root;
    this.render();
  },

  render(){
    this.root.innerHTML = `
      <div class="search-row">
        <input type="search" id="artist-search-input" placeholder="Buscar artistas… (ej. Daft Punk)"
               autocomplete="off" ${OfflineManager.isOnline() ? '' : 'disabled'}>
      </div>
      <div id="search-results"></div>
    `;

    const input = document.getElementById('artist-search-input');
    const resultsEl = document.getElementById('search-results');

    if(!OfflineManager.isOnline()){
      resultsEl.innerHTML = this.emptyState('📡', 'Sin conexión',
        'El buscador necesita internet. Mientras tanto puedes revisar tu sección de Mis álbumes.');
      return;
    }

    this.showEmpty(resultsEl);

    input.addEventListener('input', ()=>{
      clearTimeout(this.debounceTimer);
      const q = input.value.trim();
      if(q.length === 0){
        this.showEmpty(resultsEl);
        return;
      }
      this.debounceTimer = setTimeout(()=> this.doSearch(q, resultsEl), 400);
    });
  },

  emptyState(icon, title, text){
    return `<div class="state-panel"><span class="glyph">${icon}</span><h3>${title}</h3><p>${text}</p></div>`;
  },

  showEmpty(el){
    el.innerHTML = this.emptyState('🎧', 'Busca un artista', 'Escribe un nombre para explorar su discografía completa en Deezer.');
  },

  showLoading(el){
    el.innerHTML = `<div class="spinner spinner-lg" aria-label="Buscando…"></div>`;
  },

  async doSearch(query, el){
    this.showLoading(el);
    try{
      const data = await DeezerAPI.searchArtists(query);
      const artists = (data && data.data) || [];
      if(artists.length === 0){
        el.innerHTML = this.emptyState('🔎', 'Sin resultados',
          `No encontramos artistas para "${this.escape(query)}". Intenta con otro nombre.`);
        return;
      }
      el.innerHTML = `<div class="artist-grid">${artists.map(a=>this.card(a)).join('')}</div>`;
      el.querySelectorAll('[data-artist-id]').forEach(card=>{
        card.addEventListener('click', ()=>{
          window.location.hash = `#/artist/${card.dataset.artistId}`;
        });
      });
    }catch(err){
      el.innerHTML = this.emptyState('⚠️', 'No se pudo completar la búsqueda',
        'Deezer no respondió a tiempo. Verifica tu conexión e intenta de nuevo.');
    }
  },

  card(artist){
    const img = artist.picture_medium || artist.picture || '';
    return `
      <div class="artist-card" data-artist-id="${artist.id}" tabindex="0" role="button">
        <img src="${img}" alt="${this.escape(artist.name)}" loading="lazy">
        <div class="name">${this.escape(artist.name)}</div>
        <div class="sub">${(artist.nb_fan || 0).toLocaleString('es')} fans</div>
      </div>
    `;
  },

  escape(str){
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
};
