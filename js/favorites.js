/* ============================================================
   favorites.js — "Mis álbumes": colección privada persistida
   en localStorage, con filtrado dinámico por calificación.
   Funciona igual con o sin conexión, ya que lee 100% del
   almacenamiento local.
   ============================================================ */

const FavoritesView = {
  root: null,

  mount(root){
    this.root = root;
    this.render();
  },

  render(){
    const favs = Object.values(Store.getFavorites());

    this.root.innerHTML = `
      <div class="fav-toolbar">
        <span class="fav-count">${favs.length} álbum(es) guardado(s)</span>
        <select id="rating-filter">
          <option value="0">Todas las calificaciones</option>
          <option value="5">★★★★★ (5)</option>
          <option value="4">★★★★☆ y más (4+)</option>
          <option value="3">★★★☆☆ y más (3+)</option>
          <option value="2">★★☆☆☆ y más (2+)</option>
          <option value="1">★☆☆☆☆ y más (1+)</option>
        </select>
      </div>
      <div id="fav-grid"></div>
    `;

    const select = document.getElementById('rating-filter');
    select.addEventListener('change', ()=> this.renderGrid(favs, parseInt(select.value,10)));
    this.renderGrid(favs, 0);
  },

  renderGrid(favs, minRating){
    const grid = document.getElementById('fav-grid');
    const filtered = favs.filter(f => (Store.getRating(f.id) || 0) >= minRating);

    if(favs.length === 0){
      grid.innerHTML = `
        <div class="state-panel">
          <span class="glyph">💾</span>
          <h3>Aún no tienes álbumes guardados</h3>
          <p>Busca un artista, abre un álbum y toca el corazón para guardarlo aquí.</p>
        </div>`;
      return;
    }

    if(filtered.length === 0){
      grid.innerHTML = `
        <div class="state-panel">
          <span class="glyph">🎚️</span>
          <h3>Nada con ese filtro</h3>
          <p>Prueba bajando el mínimo de estrellas.</p>
        </div>`;
      return;
    }

    grid.innerHTML = `<div class="fav-grid">${filtered.map(f=>this.card(f)).join('')}</div>`;

    // NUEVO: Escuchador para expandir el álbum al hacer clic en la parte superior
    grid.querySelectorAll('.album-row-top').forEach(top => {
      top.addEventListener('click', (e) => {
        if(e.target.closest('[data-remove]')) return;
        // Reutilizamos el método toggleExpand perteneciente a ArtistView
        ArtistView.toggleExpand(top.closest('.album-row'));
      });
    });

    grid.querySelectorAll('[data-remove]').forEach(link=>{
      link.addEventListener('click', (e)=>{
        e.preventDefault();
        e.stopPropagation(); // Evita que se dispare la expansión al hacer clic en Quitar
        Store.removeFavorite(link.dataset.remove);
        this.render();
      });
    });
  },

  // MODIFICADO: Estructura adaptada para inyectar la lista de canciones en base al CSS
  card(fav){
    const rating = Store.getRating(fav.id);
    return `
      <div class="album-row fav-card" data-album-id="${fav.id}">
        <div class="album-row-top" style="cursor:pointer; width:100%;">
          <div style="display:flex; flex-direction:column; width:100%; gap:8px;">
            <img class="album-cover" src="${fav.cover}" alt="${this.escape(fav.title)}">
            <div class="album-title title">${this.escape(fav.title)}</div>
            <div class="artist-name">${this.escape(fav.artist)}</div>
            <div class="album-meta" style="padding:0;">
              <div class="stars" data-static-stars>${ArtistView.renderStars(rating, false)}</div>
            </div>
            <div class="album-actions" style="justify-content: space-between; margin-top: auto;">
              <a href="#" class="remove-link" data-remove="${fav.id}">Quitar</a>
              <span class="chevron">▶</span>
            </div>
          </div>
        </div>
        <div class="track-list" hidden style="width:100%; text-align:left;"></div>
      </div>
    `;
  },

  escape(str){
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  

};