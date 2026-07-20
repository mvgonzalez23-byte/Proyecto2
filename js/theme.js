/* ============================================================
   theme.js — modo oscuro / claro mediante variables CSS.
   El atributo data-theme en <html> dispara el bloque
   [data-theme="dark"] definido en styles.css.
   ============================================================ */

const Theme = {
  init(){
    const saved = Store.getTheme();
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    this.apply(theme);
  },

  apply(theme){
    document.documentElement.setAttribute('data-theme', theme);
    Store.setTheme(theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(btn=>{
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    });
  },

  toggle(){
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    this.apply(current === 'dark' ? 'light' : 'dark');
  },

  bind(){
    document.querySelectorAll('[data-theme-toggle]').forEach(btn=>{
      btn.addEventListener('click', ()=> this.toggle());
    });
  }
};

Theme.init();
document.addEventListener('DOMContentLoaded', ()=> Theme.bind());
