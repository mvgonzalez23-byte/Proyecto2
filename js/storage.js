/* ============================================================
   storage.js — pequeño wrapper sobre localStorage.
   Todo lo que debe sobrevivir al cierre de sesión / refresco
   (favoritos, calificaciones, tema, cola de sincronización)
   vive aquí. El token de sesión NO pasa por este módulo:
   ese vive en sessionStorage (ver auth.js) porque debe
   limpiarse al cerrar sesión.
   ============================================================ */

const Store = {
  KEYS: {
    FAVORITES: 'dm_favorites',      // { [albumId]: albumData }
    RATINGS:   'dm_ratings',        // { [albumId]: 1-5 }
    THEME:     'dm_theme',          // 'light' | 'dark'
    SYNC_QUEUE:'dm_sync_queue',     // [ { type, payload, ts } ]
    USER:      'dm_user'            // credenciales demo registradas
  },

  _get(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){
      console.error('Store.get error', key, e);
      return fallback;
    }
  },

  _set(key, value){
    try{
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    }catch(e){
      console.error('Store.set error', key, e);
      return false;
    }
  },

  getFavorites(){ return this._get(this.KEYS.FAVORITES, {}); },
  saveFavorite(albumId, albumData){
    const favs = this.getFavorites();
    favs[albumId] = albumData;
    this._set(this.KEYS.FAVORITES, favs);
  },
  removeFavorite(albumId){
    const favs = this.getFavorites();
    delete favs[albumId];
    this._set(this.KEYS.FAVORITES, favs);
  },
  isFavorite(albumId){ return !!this.getFavorites()[albumId]; },

  getRatings(){ return this._get(this.KEYS.RATINGS, {}); },
  setRating(albumId, stars){
    const ratings = this.getRatings();
    ratings[albumId] = stars;
    this._set(this.KEYS.RATINGS, ratings);
  },
  getRating(albumId){ return this.getRatings()[albumId] || 0; },

  getTheme(){ return this._get(this.KEYS.THEME, null); },
  setTheme(theme){ this._set(this.KEYS.THEME, theme); },

  getQueue(){ return this._get(this.KEYS.SYNC_QUEUE, []); },
  pushToQueue(item){
    const q = this.getQueue();
    q.push({ ...item, ts: Date.now() });
    this._set(this.KEYS.SYNC_QUEUE, q);
  },
  clearQueue(){ this._set(this.KEYS.SYNC_QUEUE, []); },

  getUser(){ return this._get(this.KEYS.USER, null); },
  setUser(user){ this._set(this.KEYS.USER, user); }
};
