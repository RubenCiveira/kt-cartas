# web-app — el visor de cartas de Kill Team

App estática (React + Vite) que muestra e imprime barajas de Kill Team. **No
contiene contenido**: las barajas y sus imágenes viven en el bucket `deck_assets`
de Appwrite y se editan en el repo hermano `app-write/` (ver
`../app-write/CLAUDE.md`). Aquí solo se toca el render, la navegación y la
impresión.

Todas las rutas y comandos son relativos a `web-app/`. Ver `README.md` para la
descripción funcional (filtros, índice, buscador, formatos de impresión).

## De dónde salen las barajas

- `src/appwrite.js` — cliente único de Appwrite. Exporta `listBucketFiles` (lista
  paginada del bucket), `fetchJsonFile` (descarga y parsea un JSON) y `fileUrl`
  (URL de vista de un fichero); además de la sesión: `login`, `register`,
  `sendVerification`, `completeVerification`, `requestAccessReview`, `logout`.
- `src/data/decks.js` — `cargarBarajasRemotas()` lista los JSON del bucket, se
  queda con los que pasan `esBaraja()` (`default-deck.json`, `glosario.json`,
  `mapas-basicos.json` y cualquier `*-deck.json`), los ordena con `ordenDeck()` y
  normaliza cada carta con `migrarCarta()`.
- `src/data/tipos-baraja.js` — el **tipo de baraja** (`reglas`, `equipos`,
  `campanas`), que cada JSON declara en su raíz y que agrupa las barajas en la
  portada y en el selector. Sin campo o con un valor desconocido cuenta como
  `reglas`. Es otra cosa que `data/tipos.js`, que clasifica las cartas de dentro.
- `src/assets.js` — `assetUrl(fileId)` traduce a URL los IDs de Storage que traen
  los campos `icono`, `foto` e `imagen` de los JSON. **Ya no son rutas de
  fichero**: `sync-storage.mjs` (en `app-write`) las convierte en IDs al publicar.

Para cambiar el contenido de una carta no toques este repo: edita el JSON en
`../app-write/decks/` y publícalo con `node scripts/sync-storage.mjs` desde
`app-write/`. Aquí solo se cambia cómo se pinta.

`src/icons/` sí son locales: los iconos de tipo de carta (equipo, gambito,
personaje…) que forman parte de la maquetación, no del contenido. Ahí está
también `default.png`, el icono de las barajas que no traen el suyo; lo pone
`iconoBarajaUrl()` (`src/assets.js`) y solo se usa donde se **listan** barajas
—portada y selector—, nunca en el dorso de las cartas ni en las hojas de
impresión, que siguen con `assetUrl()` y sin icono si la baraja no lo declara.

## Acceso

Appwrite exige tres cosas para ver barajas, y `estadoParaUsuario()` en
`src/App.jsx` las refleja en pantallas distintas:

1. Sesión iniciada (si no: `login`).
2. `emailVerification === true` (si no: `no-verificado`; el enlace del email
   vuelve con `?verify=1&userId=…&secret=…` y lo resuelve
   `procesarVerificacionPendiente()`).
3. Label `aceptado` en el usuario (si no: `pendiente`, con el botón que ejecuta la
   Function `notify_verified_user`).

El bucket también está protegido con `read("label:aceptado")`, así que la
restricción no depende solo de este frontend.

Configuración por variables Vite; hay defaults en `src/appwrite.js` y la
plantilla en `.env.example`:

    VITE_APPWRITE_ENDPOINT
    VITE_APPWRITE_PROJECT_ID
    VITE_APPWRITE_ASSETS_BUCKET_ID
    VITE_APPWRITE_REVIEW_FUNCTION_ID

## Mapa de `src/`

    App.jsx              estado y composición del visor, y las pantallas de acceso
    appwrite.js          cliente de Appwrite: sesión, Storage y Functions
    assets.js            IDs de Storage -> URL
    estilos.js           estilos globales (pantalla + @media print)
    estado-url.js        lectura y escritura del hash de navegación
    icons/               iconos locales de tipo de carta
    data/tipos.js        tipos de carta, arquetipos y constantes de maquetación
    data/tipos-baraja.js tipos de baraja y agrupación para portada y selector
    data/decks.js        carga remota y normalización de las barajas
    cards/               render de la carta (anverso, dorso, texto, iconos)
    print/               formatos, hojas A4 y diálogo de impresión
    viewer/              barra superior, tira, índice, buscador, detalle y narración
    viewer/Portada.jsx   índice de barajas por tipo (la pantalla de entrada)
    viewer/SelectorBarajas.jsx  popup anidado de la barra para cambiar de baraja
    viewer/useDock.js    magnificación por distancia al puntero

## Navegación

Dos niveles. **Sin baraja abierta** se está en la portada: los tipos de baraja
como chips y, debajo, las barajas de cada tipo. **Con baraja abierta** se ve el
visor de siempre, y la barra lleva el botón de inicio y el selector, un popup
con el mismo árbol (tipo → baraja) para saltar sin pasar por la portada.

Lo manda el hash (ver `estado-url.js`): `#baraja=…` es el visor, y su ausencia,
la portada, donde `#grupo=equipos` recuerda qué tipo estaba desplegado. Una
baraja que el bucket no tiene devuelve a la portada en vez de abrir otra.

## Comandos

    npm install
    npm run dev
    npm run build     # sitio estático en dist/, base relativa

## Convenciones

- No publiques ni commitees barajas con contenido de Games Workshop precargado en
  una versión distribuible; el contenido es para uso personal del usuario.
