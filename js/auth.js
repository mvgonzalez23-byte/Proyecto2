/* ============================================================
   auth.js — flujo de autenticación.

   El enunciado pide "un flujo de autenticación a nuestro
   servidor personal". Como este proyecto no cuenta con un
   backend propio desplegado, se simula la validación de
   credenciales contra un registro guardado localmente
   (Store.KEYS.USER), respetando el mismo contrato que tendría
   una llamada real:

     1) el usuario se registra una vez (usuario + contraseña)
     2) el login valida esas credenciales
     3) mientras se "valida", se muestra el spinner obligatorio
     4) al validar, se genera un token de sesión que vive en
        sessionStorage (se borra solo al cerrar la sesión o el
        navegador) — nunca en localStorage, para no confundirlo
        con datos persistentes como las calificaciones.

   Para conectar un servidor real basta con reemplazar
   fakeValidate() por un fetch(AUTH_URL, {method:'POST', ...}).
   ============================================================ */

const Auth = {
  SESSION_KEY: 'dm_session_token',

  isLoggedIn(){
    return !!sessionStorage.getItem(this.SESSION_KEY);
  },

  login(username, password){
    return new Promise((resolve, reject)=>{
      // Simula latencia de red real para que el spinner tenga sentido.
      setTimeout(()=>{
        const user = Store.getUser();
        if(!user){
          reject(new Error('No hay una cuenta registrada. Regístrate primero.'));
          return;
        }
        if(user.username !== username || user.password !== password){
          reject(new Error('Usuario o contraseña incorrectos.'));
          return;
        }
        const token = btoa(`${username}:${Date.now()}`);
        sessionStorage.setItem(this.SESSION_KEY, token);
        sessionStorage.setItem('dm_username', username);
        resolve(token);
      }, 850);
    });
  },

  register(username, password){
    return new Promise((resolve, reject)=>{
      setTimeout(()=>{
        if(!username || !password || password.length < 4){
          reject(new Error('Usuario y contraseña (mín. 4 caracteres) son obligatorios.'));
          return;
        }
        Store.setUser({ username, password });
        resolve();
      }, 600);
    });
  },

  logout(){
    // Limpieza de tokens y datos temporales de sesión.
    sessionStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem('dm_username');
    window.location.href = 'index.html';
  },

  requireSession(){
    if(!this.isLoggedIn()){
      window.location.href = 'index.html';
    }
  }
};
