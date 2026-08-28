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
    data/versiones.js    historial de erratas: qué cartas cambiaron y en qué
    data/impresiones.js  qué barajas y versiones tienes en papel, y qué falta
    cards/               render de la carta (anverso, dorso, texto, iconos)
    cards/IconoArma.jsx  proyectiles o espada delante de cada fila de arma
    print/               formatos, hojas A4 y diálogo de impresión
    print/HojaA5.jsx     hoja de resumen (140 × 198 mm), y su paginado en HojasResumen.jsx
    viewer/              barra superior, tira, índice, buscador, detalle y narración
    viewer/Ampliacion.jsx  capa de lectura (marco y scroll) para hojas y fichas
    viewer/DialogoVersiones.jsx  qué cartas han cambiado, la vieja y la nueva en pareja
    viewer/ConfirmarImpresion.jsx  «¿ha salido bien?», para apuntar la tirada
    viewer/Portada.jsx   índice de barajas por tipo (la pantalla de entrada)
    viewer/SelectorBarajas.jsx  popup anidado de la barra para cambiar de baraja
    viewer/useDock.js    magnificación por distancia al puntero

## Resúmenes de reglas

Las barajas de tipo `resumenes` no traen `cartas` sino `hojas`: hojas **A5
verticales de 140 × 198 mm** para consulta en mesa, no un mazo. `App.jsx` ramifica
en `esResumenes(mazo.tipo)` y pinta `viewer/VisorResumenes.jsx` (previsualización
a escala + selección) en lugar de la tira y el detalle. Se imprimen **dos en fila
sobre un A4 apaisado**, para cortar por la vertical central, con
`print/HojasResumen.jsx` y la rejilla `.pagina-a5`.

Imprimir abre `print/DialogoImpresionResumen.jsx`, el gemelo del diálogo del
mazo: misma selección (títulos o miniaturas, con `.sel-a5` para reducir la hoja
al 18 %) y misma ayuda de ajustes, pero **una hoja A5 no tiene tamaños que
elegir**, así que en el sitio del formato va la casilla **«colocar para imprimir
a doble cara»**. Marcada, `HojasResumen` gira 180° las páginas **pares**
(`.hoja-a5-girada`) para la segunda pasada: imprimir las pares, girar el taco por
el lateral, y volver a lanzar las impares. El giro es de la página entera sobre
el centro del papel —por eso la regla necesita `height: 100vh`—, no hoja a hoja.

**Y cambia el orden de las hojas**, que es la otra mitad del asunto: lo que se
corta es una tarjeta de dos caras, y las dos caras de una tarjeta no están una al
lado de la otra sino una detrás de la otra. `paginar()` reparte cada grupo de
cuatro entre las dos caras del mismo folio —`1 | 3` delante, `4 | 2` detrás—, de
modo que al cortar por la vertical central cada A5 lleva la hoja *n* por una cara
y la *n+1* por la otra. En orden de envío eso es 1, 3, 4, 2, 5, 7, 8, 6… La cara
B va **cruzada** porque el giro de 180° cambia de lado sus dos hojas; sin cruzar,
detrás de la 1 caería la 4. Las ranuras que sobran en el último grupo se
devuelven como `undefined` y se pintan como celda vacía: colapsarlas movería a su
compañera al lado que no es. El diálogo cuenta páginas con esa misma función, no
dividiendo entre dos.

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

## El icono de tipo de arma

La tabla de armas de una ficha de datos abre cada fila con el mismo símbolo que
las tarjetas oficiales: **tres proyectiles** si el arma es a distancia, **una
espada** si es de combate. Lo pinta `cards/IconoArma.jsx` a partir del campo
`tipo` de cada arma (`"distancia"` / `"combate"`), que rellena
`clasificar-armas.mjs` en `app-write` leyendo el icono del PDF —no está en el
texto—.

Va en **SVG dibujado aquí**, no como imagen del bucket: es maquetación, como los
iconos de `src/icons/`, así que se imprime a cualquier tamaño sin pixelarse y
toma el color del arquetipo de la carta.

**La columna solo existe si la baraja trae el campo.** `CartaFace` mira si
alguna arma lo declara y solo entonces añade la pista de 5,8 mm a la rejilla;
una baraja anterior se maqueta exactamente igual que antes en vez de estrechar
el nombre del arma para reservar un hueco que quedaría vacío.

**Y el campo tiene que pasar por `migrarCarta`** (`data/decks.js`), que es donde
esto se rompe. `migrarCarta` no copia la carta: **reconstruye** `armas` y
`acciones` campo a campo, así que una clave nueva del JSON que no esté en esa
lista se pierde entre el fichero y el render, y el síntoma es que la baraja tiene
el dato y la carta sale como si no. Al añadir un campo a un arma, a una acción o
a una carta, añádelo también ahí. Le ha pasado a `tipo` y a `retirada`.

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

## Mazos de impresión

Listas de cartas **de varias barajas** que el usuario arma para reimprimir de
una tacada: una carta que se ha estropeado, otra que se ha quedado
desactualizada. Sin ellos, reimprimir tres cartas de tres facciones son tres
tiradas y tres hojas casi vacías.

Viven en Appwrite, no en `localStorage`, para que el mazo sea el mismo en el
portátil y en el móvil que tienes al lado de la impresora: tabla `print_decks`
de `kt_cartas`, una fila por mazo, con `rowSecurity` y permisos por fila (solo
su dueño lee, cambia y borra). El cliente está en `src/appwrite.js`
(`listarMazosImpresion`, `crearMazoImpresion`, `guardarMazoImpresion`,
`borrarMazoImpresion`) y **la tabla hay que publicarla** desde `app-write/` con
`appwrite --all --force push tables`; hasta entonces la pantalla avisa de que
falta en vez de dar un error suelto.

`data/mazos-impresion.js` tiene el modelo y el hook `useMazosImpresion()`. Un
mazo guarda **referencias**, no copias: `"faccion:novitiates|c12"`. Es lo que
hace que una carta corregida en su JSON salga corregida al reimprimirla, que es
justo para lo que existe el mazo. El precio es que una carta puede desaparecer
de su baraja —al reeditarla se renumeran los ids—; esa referencia queda
huérfana, y la pantalla la enseña con su id para poder quitarla a sabiendas, en
vez de desaparecer en silencio y descuadrar el recuento.

La pantalla es `viewer/MazosImpresion.jsx` (`#imprimir=<id>`, y `#imprimir=1` la
lista), y se llega desde la portada. Las cartas se añaden con el popup
`viewer/AnadirAMazo.jsx`, que abren el detalle de una carta («A imprimir…») y el
diálogo de imprimir con lo que esté marcado. Añadir no duplica: un mazo es una
lista de qué reimprimir, y pedir dos veces la misma carta es un descuido.

Imprimir reutiliza `DialogoImpresion` y `HojasImpresion` tal cual —formato,
dorsos, calibración—, con una diferencia: cada carta se lleva su baraja en
`origen`, y `dorsoDe()` pinta **el dorso de su baraja**, no uno común. En un mazo
mezclado no hay nombre ni icono compartido que poner detrás. Por lo mismo, el
`id` de una carta dentro del mazo es su referencia entera: dos barajas usan `c3`
las dos, y las hojas necesitan ids únicos dentro de la tirada (y así comparten
sin chocar el registro de exclusiones con las cartas de las barajas).

## Actualizaciones y barajas impresas

Las reglas se corrigen, pero el papel que has recortado no. Meses después, el
taco que hay en la caja no dice de qué versión es, y la pregunta práctica no es
«qué ha cambiado» sino **«qué cartas tengo que volver a imprimir»**.

Son dos piezas que se apoyan la una en la otra:

- **El historial** viaja dentro del JSON de la baraja (`version` y `versiones`),
  escrito por `versionar-baraja.mjs` en `app-write` comparando contra git. Cada
  entrada describe el salto a esa fecha y guarda la carta **de antes** entera.
  `data/decks.js` la normaliza con `migrarCarta` como cualquier otra carta,
  porque eso es lo que es y se pinta con el mismo `CartaFace`.
- **El registro** de lo que has impreso es la tabla `printed_decks` de Appwrite,
  una fila por tirada (`data/impresiones.js`). Va en Appwrite y no en
  `localStorage` por lo mismo que los mazos: se consulta desde el móvil que
  tienes al lado de la impresora.

`data/versiones.js` es la lógica sin pantalla. `versionesDesde()` da las entradas
posteriores a una fecha y `cartasAfectadas()` las funde en **una lista de cartas
a reimprimir**: una carta tocada en dos erratas seguidas sale una vez, con la
unión de los campos y con el `anterior` de la **primera**, porque lo que importa
no es cada paso intermedio sino la diferencia entre el papel que tienes y la
carta de ahora.

**Cartas retiradas.** Una actualización puede llevarse una carta por delante, y
entonces lo que hay que hacer no es reimprimirla sino sacarla del taco. Esas
cartas siguen en el JSON con `retirada: "<fecha>"` (no se borran: así la
referencia de un mazo de impresión no queda huérfana y hay algo que enseñar).
`partirRetiradas()` en `data/decks.js` las aparta en `baraja.retiradas`, fuera de
`cartas`, así que **no salen en la tira, ni en el índice, ni en el buscador, ni
en la impresión**: la baraja que se ve es la jugable. Solo aparecen en el diálogo
de actualizaciones, y `cartasAfectadas()` las descuenta de lo pendiente aunque
hubieran cambiado antes.

Ojo con el orden en `partirRetiradas()`: **migra y luego filtra**. `migrarCarta`
da el id por posición cuando la carta no lo trae, así que filtrar primero correría
los ids de todas las cartas que van detrás de una retirada.

`pendientesDeImprimir()` (`data/impresiones.js`) cruza las dos cosas. Parte de la
última tirada **completa** y descuenta lo reimpreso suelto después: si en agosto
solo reimprimiste las cuatro cartas de la errata, esas ya están bien aunque el
resto del mazo siga siendo de junio. Es la diferencia entre un aviso útil y uno
que te manda reimprimir dos veces lo mismo. Por eso el registro guarda una fila
por tirada y no un estado por baraja: se imprimen dos cosas distintas, el mazo
entero y cartas sueltas, y una fila por baraja haría que la segunda pisara a la
primera.

**El resaltado.** `resaltadoDe()` devuelve qué partes difieren y `CartaFace` lo
recibe por su prop opcional `resaltar`. Se pinta con **`outline`**, no con borde
ni fondo: el outline no ocupa sitio, así que la carta resaltada se maqueta
exactamente igual que sin resaltar. Si el resaltado moviera una línea, la
comparación entre las dos cartas dejaría de ser fiable, que es para lo único que
existe. Las filas de armas y acciones se casan **por nombre** y no por posición
—una errata cambia el ATQ de «Colmillos», no lo renombra—; casarlas por posición
marcaría la lista entera en cuanto se recolocara una fila.

La pantalla es `viewer/DialogoVersiones.jsx`, que abre el botón
**Actualizaciones** de la barra (solo si la baraja trae historial, con el número
de cartas pendientes al lado). Primero se elige **desde qué versión** comparar
—la propone el registro, y si no consta se elige a mano—, y debajo salen las
cartas afectadas en pareja. El pie lleva a `AnadirAMazo` con las cartas
pendientes ya marcadas, que es donde acaba el flujo: reimprimirlas.

**Apuntar la impresión.** `window.print()` no dice si se imprimió o si cancelaste
el diálogo del navegador, y un registro que miente es peor que no tenerlo. Por
eso `viewer/ConfirmarImpresion.jsx` pregunta «¿ha salido bien?» al volver, y solo
entonces escribe la fila. Apuntarlo a mano se olvidaría —que es justo por lo que
no sabes qué versión tienes— y apuntarlo al pulsar «Imprimir» registraría
tiradas que no existieron.

## Calibración de impresora

Casi ninguna impresora centra el papel igual por las dos caras, así que los
dorsos caen desplazados respecto a su anverso. Eso **no se puede arreglar desde
el diálogo del navegador**: sus márgenes se aplican a todas las páginas por
igual, y aquí hay que mover solo una de las dos caras. Tampoco vale una
constante en el código: el desvío es de la máquina, y quien imprime puede tener
más de una.

`print/impresoras.js` guarda por eso una lista de **perfiles con nombre** en
`localStorage` (`kt-impresoras-v1`, más `kt-impresora-v1` con el elegido), cada
uno con su desvío `x`/`y` en milímetros y **con el signo en la dirección en la
que hay que devolver el dorso**: si sale 7 mm a la izquierda, `x = 7`. Se topa a
±20 mm —más que eso es un dedazo, no una impresora— y un `localStorage` ilegible
o bloqueado devuelve «sin calibrar» en vez de romper la impresión.

Lo edita `print/CalibracionImpresora.jsx`, que comparten los dos diálogos, y
solo aparece cuando hay una segunda cara que casar: con `incluirDorsos` en el
mazo, con `dobleCara` en los resúmenes. El desvío llega al CSS como
`--desvio-dorso-x/y` (por `variablesFormato()` en las cartas, en línea en
`HojasResumen`) y lo aplican `.pagina-dorso`, `.pagina-ficha-dorso` y
`.hoja-a5-girada`. En esta última el `translate` va **antes** del `rotate(180deg)`
para que los milímetros sean los del papel y no los del marco ya girado, donde
irían al revés.

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
