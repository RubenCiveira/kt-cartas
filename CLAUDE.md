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
- `src/data/decks.js` — `cargarBarajasRemotas()` lista los JSON del bucket,
  acepta cualquier `*.json`, los ordena con `ordenDeck()` y normaliza cada carta
  con `migrarCarta()`.
- `src/data/tipos-baraja.js` — el **tipo de baraja** (`reglas`, `equipos`,
  `campanas`, `resumenes`), que cada JSON declara en su raíz y que agrupa las
  barajas en la portada y en el selector. Sin campo o con un valor desconocido
  cuenta como `reglas`. Es otra cosa que `data/tipos.js`, que clasifica las
  cartas de dentro.
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
    print/HojaA5.jsx     hoja de resumen (140 × 198 mm), y su paginado en HojasResumen.jsx
    viewer/              barra superior, tira, índice, buscador, detalle y narración
    viewer/Ampliacion.jsx  capa de lectura (marco y scroll) para hojas y fichas
    viewer/Portada.jsx   índice de barajas por tipo (la pantalla de entrada)
    viewer/SelectorBarajas.jsx  popup anidado de la barra para cambiar de baraja
    viewer/useDock.js    magnificación por distancia al puntero

## Resúmenes de reglas

Las barajas de tipo `resumenes` no traen `cartas` sino `hojas`: hojas **A5
verticales de 140 × 198 mm** para consulta en mesa, no un mazo. `App.jsx` ramifica
en `esResumenes(mazo.tipo)` y pinta `viewer/VisorResumenes.jsx` (previsualización
a escala + selección + imprimir) en lugar de la tira, el detalle y el diálogo. Se
imprimen **dos en fila sobre un A4 apaisado**, para cortar por la vertical
central, con `print/HojasResumen.jsx` y la rejilla `.pagina-a5`.

La previsualización está al 55% y ahí no se lee: **al pulsar una hoja se abre
ampliada** (`viewer/HojaAmpliada.jsx` sobre `viewer/Ampliacion.jsx`), ajustada al
ancho disponible y con el resto de la hoja abajo, para leerla desplazándose. La
escala se **mide** —`clientWidth` de la caja entre `offsetWidth` de la hoja sin
escalar—, no se convierte de mm a px, que depende del zoom del navegador. El
ancho se topa en 860 px (`.ampliacion-caja`): estirar un A5 a un monitor entero
se lee peor. Pulsar la hoja no cambia la selección de impresión; eso sigue siendo
la casilla.

`print/HojaA5.jsx` es a la hoja lo que `cards/CartaFace.jsx` a la carta: la pinta
a tamaño de diseño y quien la muestre la escala en bloque. Reutiliza `LineasTexto`,
así que el texto de un bloque se escribe con el mismo mini-lenguaje que el cuerpo
de una carta. La medida no es A5 exacta a propósito: dos hojas de 148 × 210 no
caben en un A4 apaisado con los 6 mm de margen de `@page`. **El cuerpo recorta lo
que sobra sin avisar**; el arreglo es partir la hoja, no encoger el texto.

**`compacto: true`** en una hoja cambia la escala de todo su cuerpo (constantes
`NORMAL` y `COMPACTO` en `HojaA5.jsx`). `medir-hojas.mjs` replica esa escala, así
que la estimación sigue valiendo con la hoja compactada.

**Negrita y subrayado** los resuelve `conMarcas` (`cards/texto.jsx`): `**x**` y
`__x__`, anidables, sobre cualquier texto de autor —`LineasTexto` y sus tablas,
más `revelado`, `flavor` y el `pie` de una hoja—. Solo cuenta el par: un
asterisco suelto se imprime literal, porque las barajas los usan como llamada a
nota al pie. El regex se construye en cada llamada a propósito; uno compartido
con `/g` guardaría `lastIndex` y la recursión se lo pisaría al bucle exterior.

**Las tablas** las pinta `TablaTexto` (`cards/texto.jsx`) a partir de líneas
consecutivas que empiezan por `|`. Reparte el ancho con la primera columna a
`1.3fr` y las demás a `1fr`, salvo que la **fila de cabecera** lo pida de otro
modo: cada `+` en una celda de cabecera suma `1fr` y cada `-` resta `0.4fr`
(mínimo `0.4`), y las columnas con `+` se alinean a la izquierda. Los sufijos se
leen y se borran solo en la cabecera, así que un `5+` de una celda de datos no se
confunde con una marca. Lo usan tanto las cartas como las hojas de resumen.

**La rotación de la página.** `@page` no admite selector: no hay forma de decir
«esta página apaisada y esa vertical». La global de `estilos.js` deja A4 vertical
para las cartas, y el visor de resúmenes inyecta detrás `estilosResumen`, que
vuelve a declarar `@page` en `landscape`. Funciona porque las dos pantallas nunca
se imprimen a la vez y gana la última declaración. Si algún día hubiera que
imprimir cartas y resúmenes de una tirada, esto deja de valer y habría que pasar
a páginas con nombre (`@page resumen { … }` + `page: resumen`).

Para el formato del JSON, ver `../app-write/CLAUDE.md`.

## Fichas

Una baraja puede traer un bloque `fichas` con las piezas recortables. La plancha
la pinta `print/HojaFichas.jsx` a tamaño real (en mm, sin `--esc`), y hay tres
formas de ver lo que trae la baraja: la **carta de guía**, el botón **Fichas** de
la barra (`viewer/FichasAmpliadas.jsx`, la plancha sobre papel blanco) y la
casilla del diálogo de imprimir.

**La carta de guía la genera `conGuiaDeFichas()` (`data/decks.js`)**, no el JSON:
una baraja que declara `fichas` gana una carta con una entrada por pieza
distinta y su cantidad, que pinta `cards/GuiaFichas.jsx` dentro de `CartaFace`.
Las barajas de banda traen una carta «GUÍA DE FICHAS Y MARCADORES» con una
imagen de relleno en el cuerpo; cuando el título encaja, la generada **ocupa su
sitio** —conservando su id, que puede estar en una URL— en vez de añadirse
detrás. Sin esa carta los tokens no se ven en ninguna parte del visor: solo
existen como una casilla del diálogo, y para marcarla ya estás decidiendo qué
imprimir sin haber visto lo que hay.

Una ficha de `texto` sale con la **silueta de segmento** de las fichas oficiales
de facción. `forma: "circulo"` la cambia por un disco: es para lo que representa
un punto del tablero y no un estado de un operativo —los puntos de despliegue de
JcE—. Sin el campo, segmento; `invertido` funciona con las dos formas.

Las piezas se encogen según cuántas distintas haya (`medidas()` en
`GuiaFichas.jsx`): con más de veinte —los números de agente del mazo universal—
se renuncia a la etiqueta, porque el dibujo ya es el número. La proporción entre
tamaños sí se respeta: un marcador de 25 mm se ve mayor que una ficha de 20. Es la misma plancha en los dos sitios, así que sus estilos
(`.rejilla-fichas`, `.ficha-corte`, `.ficha-texto`, `.pie-fichas`,
`.etiqueta-hoja`) viven **fuera** de `@media print`; moverlos dentro rompería la
pantalla. El botón sale en el visor normal y en el de resúmenes, y mirar las
fichas no las mete en la impresión: eso sigue siendo `incluirFichas`.

## Navegación

Dos niveles. **Sin baraja abierta** se está en la portada: los tipos de baraja
como chips y, debajo, las barajas de cada tipo. **Con baraja abierta** se ve el
visor de siempre, y la barra lleva el botón de inicio y el selector, un popup
con el mismo árbol (tipo → baraja) para saltar sin pasar por la portada. Las
barajas de resúmenes son la excepción: abren su propia pantalla.

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
