/* ============================================================
   artist.js — panel de detalle del artista: discografía
   completa, tracks por álbum, reproductor de previews (30s)
   y controles de favorito / calificación por estrellas.
   ============================================================ */

const ArtistView = {
  root: null,
  audio: new Audio(),
  currentPlayingBtn: null,
  currentPlayingRow: null,

  mount(root, artistId){
    this.root = root;
    this.audio.pause();
    this.load(artistId);
  },

  async load(artistId){
    this.root.innerHTML = `<div class="spinner spinner-lg" aria-label="Cargando artista…"></div>`;
    try{
      const [artist, albumsRes] = await Promise.all([
        DeezerAPI.getArtist(artistId),
        DeezerAPI.getArtistAlbums(artistId)
      ]);
      const albums = (albumsRes && albumsRes.data) || [];
      this.renderArtist(artist, albums);
    }catch(err){
      this.root.innerHTML = `
        <div class="state-panel">
          <span class="glyph">⚠️</span>
          <h3>No se pudo cargar este artista</h3>
          <p>Revisa tu conexión e inténtalo de nuevo.</p>
          <a class="back-link" href="#/search">← Volver al buscador</a>
        </div>`;
    }
  },

  renderArtist(artist, albums){
    this.root.innerHTML = `
      <a class="back-link" href="#/search">← Volver al buscador</a>
      <div class="artist-header">
        <img src="${artist.picture_medium}" alt="${this.escape(artist.name)}">
        <div>
          <h1>${this.escape(artist.name)}</h1>
          <div class="sub">${(artist.nb_album || albums.length)} álbumes · ${(artist.nb_fan||0).toLocaleString('es')} fans</div>
        </div>
      </div>
      <p class="section-title">Discografía</p>
      <div class="album-list" id="album-list">
        ${albums.length ? albums.map(a=>this.albumRow(a)).join('') : this.emptyAlbums()}
      </div>
    `;

    this.root.querySelectorAll('.album-row-top').forEach(top=>{
      top.addEventListener('click', (e)=>{
        if(e.target.closest('.fav-btn')) return;
        this.toggleExpand(top.closest('.album-row'));
      });
    });

    this.root.querySelectorAll('.fav-btn').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        this.toggleFavorite(btn);
      });
    });
  },

  emptyAlbums(){
    return `<div class="state-panel"><span class="glyph">🗂️</span><h3>Sin álbumes disponibles</h3><p>Este artista no tiene álbumes registrados en Deezer.</p></div>`;
  },

  albumRow(album){
    const isFav = Store.isFavorite(album.id);
    const rating = Store.getRating(album.id);
    return `
      <div class="album-row" data-album-id="${album.id}">
        <div class="album-row-top">
          <div class="album-cover-wrap">
            <img class="album-cover" src="${album.cover_medium}" alt="">
          </div>
          <div class="album-meta">
            <div class="album-title">${this.escape(album.title)}</div>
            <div class="album-sub">${album.release_date || ''} · ${album.nb_tracks || '—'} pistas</div>
            <div class="stars" data-static-stars>${this.renderStars(rating, false)}</div>
          </div>
          <div class="album-actions">
            <button class="fav-btn ${isFav ? 'active' : ''}" data-fav-btn aria-label="Guardar como favorito">${isFav ? '♥' : '♡'}</button>
            <span class="chevron">▶</span>
          </div>
        </div>
        <div class="track-list" hidden></div>
      </div>
    `;
  },

  renderStars(rating, interactive){
    let html = `<div class="stars ${interactive ? 'interactive' : ''}">`;
    for(let i=1;i<=5;i++){
      html += `<span class="star ${i<=rating?'filled':''}" data-star="${i}">★</span>`;
    }
    html += `</div>`;
    return html;
  },

  async toggleExpand(row){
    const trackList = row.querySelector('.track-list');
    const isExpanded = row.classList.toggle('expanded');
    if(!isExpanded){ trackList.hidden = true; return; }

    trackList.hidden = false;
    if(trackList.dataset.loaded) return;

    trackList.innerHTML = `<div class="spinner" style="margin:14px auto;"></div>`;
    try{
      const albumId = row.dataset.albumId;
      const album = await DeezerAPI.getAlbum(albumId);
      const tracks = (album.tracks && album.tracks.data) || [];
      trackList.innerHTML = tracks.map((t,i)=>this.trackRow(t,i+1)).join('') || `<div class="track-row">Sin pistas disponibles.</div>`;
      trackList.dataset.loaded = '1';

      trackList.querySelectorAll('.play-btn').forEach(btn=>{
        btn.addEventListener('click', ()=> this.togglePlay(btn, row));
      });

      // Estrellas interactivas del álbum, ahora dentro de la fila expandida
      const starsHolder = row.querySelector('[data-static-stars]');
      const rating = Store.getRating(albumId);
      starsHolder.outerHTML = this.interactiveStars(albumId, rating);
      row.querySelectorAll('[data-star]').forEach(starEl=>{
        starEl.addEventListener('click', (e)=>{
          e.stopPropagation();
          const value = parseInt(starEl.dataset.star, 10);
          this.rate(albumId, value, row);
        });
      });
    }catch(err){
      trackList.innerHTML = `<div class="track-row">No se pudieron cargar las canciones.</div>`;
    }
  },

  interactiveStars(albumId, rating){
    let html = `<div class="stars interactive" data-static-stars>`;
    for(let i=1;i<=5;i++){
      html += `<span class="star ${i<=rating?'filled':''}" data-star="${i}">★</span>`;
    }
    html += `</div>`;
    return html;
  },

  rate(albumId, value, row){
    Store.setRating(albumId, value);
    if(!OfflineManager.isOnline()){
      OfflineManager.queueRating(albumId, value);
    }
    // Si el álbum ya es favorito, refrescamos su rating guardado también.
    const favs = Store.getFavorites();
    if(favs[albumId]){
      favs[albumId].rating = value;
      Store.saveFavorite(albumId, favs[albumId]);
    }
    row.querySelectorAll('[data-star]').forEach(s=>{
      s.classList.toggle('filled', parseInt(s.dataset.star,10) <= value);
    });
  },

  togglePlay(btn, row){
    const src = btn.dataset.preview;
    if(!src){
      btn.textContent = '✕';
      return;
    }
    const isSameTrack = this.audio.src === src;

    if(isSameTrack && !this.audio.paused){
      this.audio.pause();
      this.setPlayingUI(btn, row, false);
      return;
    }

    if(this.currentPlayingBtn && this.currentPlayingBtn !== btn){
      this.setPlayingUI(this.currentPlayingBtn, this.currentPlayingRow, false);
    }

    this.audio.src = src;
    this.audio.play().catch(()=>{});
    this.setPlayingUI(btn, row, true);

    this.audio.onended = ()=> this.setPlayingUI(btn, row, false);
  },

  setPlayingUI(btn, row, playing){
    btn.classList.toggle('is-playing', playing);
    btn.textContent = playing ? '❚❚' : '▶';
    row.classList.toggle('playing', playing);
    this.currentPlayingBtn = playing ? btn : null;
    this.currentPlayingRow = playing ? row : null;
  },

  trackRow(track, index){
    const mins = Math.floor(track.duration / 60);
    const secs = String(track.duration % 60).padStart(2,'0');
    return `
      <div class="track-row">
        <span class="track-num">${index}</span>
        <button class="play-btn" data-preview="${track.preview || ''}" aria-label="Reproducir vista previa">▶</button>
        <span class="track-name">${this.escape(track.title)}</span>
        <span class="track-duration">${mins}:${secs}</span>
      </div>
    `;
  },

  toggleFavorite(btn){
    const row = btn.closest('.album-row');
    const albumId = row.dataset.albumId;
    const title = row.querySelector('.album-title').textContent;
    const cover = row.querySelector('.album-cover').src;
    
    // MODIFICADO: Si no encuentra la cabecera del artista, busca la clase .artist-name de la tarjeta
    const artistName = document.querySelector('.artist-header h1')?.textContent || row.querySelector('.artist-name')?.textContent || '';

    if(Store.isFavorite(albumId)){
      Store.removeFavorite(albumId);
      btn.classList.remove('active');
      btn.textContent = '♡';
    }else{
      Store.saveFavorite(albumId, {
        id: albumId, title, cover, artist: artistName,
        rating: Store.getRating(albumId)
      });
      btn.classList.add('active');
      btn.textContent = '♥';
    }
  },

  escape(str){
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }
};
