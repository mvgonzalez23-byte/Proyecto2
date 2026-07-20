/* ============================================================
   api.js — capa de acceso a la API pública de Deezer.

   IMPORTANTE: la API de Deezer no envía cabeceras CORS, por lo
   que un fetch() directo desde el navegador es bloqueado. Deezer
   soporta JSONP para este caso exacto (parámetro output=jsonp),
   así que todas las peticiones pasan por jsonp(), que inyecta un
   <script> temporal y resuelve una Promise cuando la API invoca
   el callback.
   ============================================================ */

const DeezerAPI = (()=>{
  const BASE = 'https://api.deezer.com';
  let callbackCounter = 0;

  function jsonp(url){
    return new Promise((resolve, reject)=>{
      const cbName = `dzCb_${Date.now()}_${callbackCounter++}`;
      const script = document.createElement('script');
      const timeout = setTimeout(()=>{
        cleanup();
        reject(new Error('Tiempo de espera agotado consultando Deezer'));
      }, 10000);

      function cleanup(){
        clearTimeout(timeout);
        delete window[cbName];
        script.remove();
      }

      window[cbName] = (data)=>{
        cleanup();
        if(data && data.error){ reject(new Error(data.error.message || 'Error de Deezer')); }
        else resolve(data);
      };

      const glue = url.includes('?') ? '&' : '?';
      script.src = `${url}${glue}output=jsonp&callback=${cbName}`;
      script.onerror = ()=>{ cleanup(); reject(new Error('No se pudo contactar a Deezer')); };
      document.body.appendChild(script);
    });
  }

  return {
    searchArtists(query){
      return jsonp(`${BASE}/search/artist?q=${encodeURIComponent(query)}`);
    },
    getArtist(id){
      return jsonp(`${BASE}/artist/${id}`);
    },
    getArtistAlbums(id){
      return jsonp(`${BASE}/artist/${id}/albums?limit=50`);
    },
    getAlbum(id){
      return jsonp(`${BASE}/album/${id}`);
    }
  };
})();
