/* ============================================================
   app.js — enrutador ligero basado en hash (#/search, #/artist/ID,
   #/favorites). No requiere ningún framework: sólo escucha el
   evento hashchange y decide qué módulo montar en <main>.
   ============================================================ */

Auth.requireSession();

const mainEl = document.getElementById('view-root');
const tabs = document.querySelectorAll('.nav-tab');

function setActiveTab(route){
  tabs.forEach(t=>{
    t.classList.toggle('active', t.dataset.route === route);
  });
}

function router(){
  const hash = window.location.hash || '#/search';

  if(hash.startsWith('#/artist/')){
    const id = hash.split('/')[2];
    setActiveTab('search');
    ArtistView.mount(mainEl, id);
    return;
  }

  if(hash === '#/favorites'){
    setActiveTab('favorites');
    FavoritesView.mount(mainEl);
    return;
  }

  // default
  setActiveTab('search');
  SearchView.mount(mainEl);
}

window.addEventListener('hashchange', router);
document.addEventListener('DOMContentLoaded', ()=>{
  const username = sessionStorage.getItem('dm_username');
  const userLabel = document.getElementById('current-user');
  if(userLabel && username) userLabel.textContent = username;

  document.getElementById('logout-btn').addEventListener('click', ()=> Auth.logout());

  router();
});

OfflineManager.onChange(()=>{
  // Si estamos en el buscador y cambia el estado de red, re-renderizamos esa vista.
  if((window.location.hash || '#/search') === '#/search'){
    SearchView.mount(mainEl);
  }
});
