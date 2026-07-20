# Deezer-Manager

Plataforma de gestión musical desarrollada para el Proyecto #2 de
Programación Orientada a la Web (UCAB, Semestre 2-2025).

Construida 100% con **HTML5, CSS3 y JavaScript puro** (sin frameworks),
consumiendo la API pública de **Deezer**.

## Cómo ejecutarlo

No requiere build ni instalación de dependencias.

1. Clona el repositorio.
2. Abre `index.html` con un servidor local (por ejemplo, la extensión
   *Live Server* de VS Code, o `python3 -m http.server`). Es importante
   usar un servidor y no abrir el archivo con `file://`, porque el
   registro del `<script>` dinámico usado para las llamadas JSONP a
   Deezer puede comportarse distinto bajo ese protocolo.
3. Regístrate con un usuario y contraseña de prueba (se guardan
   localmente, ver sección *Autenticación* abajo) e inicia sesión.
4. Busca cualquier artista (ej. "Daft Punk", "Bad Bunny") y explora.

## Arquitectura

```
index.html        → pantalla de bienvenida / login / registro
app.html          → shell de la aplicación (topbar + router por hash)
css/styles.css    → tokens de diseño (modo claro/oscuro vía CSS variables)
js/storage.js     → wrapper sobre localStorage (favoritos, ratings, tema, cola de sync)
js/theme.js       → selector de modo oscuro / claro
js/auth.js        → login, registro y token de sesión (sessionStorage)
js/api.js         → cliente JSONP para la API de Deezer
js/search.js      → buscador de artistas y sus estados (cargando/vacío/sin resultados)
js/artist.js      → detalle del artista, álbumes, tracks, reproductor y calificación
js/favorites.js   → "Mis álbumes": colección privada + filtro por estrellas
js/offline.js     → detección de conectividad y cola de sincronización diferida
js/app.js         → router basado en hash (#/search, #/artist/:id, #/favorites)
```

### Decisiones técnicas relevantes

- **CORS y Deezer**: la API de Deezer no expone cabeceras CORS, por lo
  que un `fetch()` normal es bloqueado por el navegador. Se usa el modo
  **JSONP** que la propia API soporta (`?output=jsonp&callback=...`),
  implementado en `js/api.js`.
- **Autenticación**: el proyecto no cuenta con un backend propio
  desplegado, así que el flujo de login se simula localmente
  (`js/auth.js`) respetando el mismo contrato que tendría una llamada
  real (usuario/contraseña → validación con latencia simulada → token
  de sesión). El token vive en `sessionStorage` y se elimina al cerrar
  sesión; para conectar un servidor real solo hay que sustituir
  `fakeValidate()` por un `fetch` a la URL de autenticación real.
- **Persistencia de calificaciones y favoritos**: usa `localStorage`,
  por lo que sobrevive a cierres de sesión y refrescos, pero está
  acotada al navegador/origen específico donde se usó la app (no viaja
  entre navegadores ni dispositivos, ya que `localStorage` no es
  compartido).
- **Modo offline**: `navigator.onLine` + eventos `online`/`offline`
  determinan el estado. Sin conexión, el buscador se deshabilita y se
  muestra un aviso, pero "Mis álbumes" sigue funcionando por completo
  ya que lee 100% de `localStorage`. Cualquier calificación hecha sin
  red se guarda igual de forma local y además se encola
  (`Store.SYNC_QUEUE`); al recuperar la conexión se "sincroniza"
  (punto de extensión para un backend real).
- **Reproductor**: usa el `preview` de 30 segundos que expone cada
  track en la API de Deezer, mediante un elemento `<audio>` nativo de
  HTML5.

## Uso de herramientas de IA generativa

Se utilizó un asistente de IA (Claude, de Anthropic) durante el
desarrollo del sistema, específicamente para:

- Generar el andamiaje inicial de los módulos JavaScript (`storage.js`,
  `theme.js`, `auth.js`, `api.js`, `search.js`, `artist.js`,
  `favorites.js`, `offline.js`, `app.js`) a partir de los requerimientos
  descritos en el enunciado del proyecto.
- Proponer la solución al problema de CORS de la API de Deezer
  (uso de JSONP) y la estrategia de modo offline con cola de
  sincronización diferida.
- Diseñar el sistema de estilos (variables CSS para modo oscuro/claro)
  y el motivo visual del disco de vinilo como elemento distintivo.


## Consideraciones de entrega

- Todo el trabajo debe quedar en el último commit de la rama `main`.
- El despliegue debe hacerse en un servidor web estático (GitHub Pages,
  Netlify, Vercel, etc. — cualquiera sirve ya que no hay backend).
- Recuerda registrar un usuario de prueba antes de la defensa; las
  credenciales quedan guardadas en el navegador donde se registraron.
