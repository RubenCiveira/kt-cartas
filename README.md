# Visor de cartas · Kill Team

Visor e impresor de barajas de Kill Team para uso personal. El contenido lo aporta
el usuario desde sus propias descargas legítimas (app oficial de Kill Team o
Warhammer Community) en forma de ficheros JSON que él mismo publica en su propia
instancia de Appwrite; esta app no trae ninguna baraja.

La app no edita cartas: las muestra y las imprime. El contenido y su publicación
viven en el repo hermano `app-write/`; para convertir un PDF oficial de reglas de
equipo en una baraja, ver el flujo de extracción en `../app-write/CLAUDE.md`.

## Acceso y configuración

Hace falta cuenta en la instancia de Appwrite configurada, con el email verificado
y la label `aceptado` (el bucket de barajas está restringido a esa label). Copia
`.env.example` a `.env` y ajusta el endpoint, el proyecto, el bucket y la Function
de revisión si no usas los valores por defecto.

## Cómo se usa

- **Portada**: la pantalla de entrada es el índice de barajas, agrupadas por
  tipo (reglas, equipos y bandas, campañas). Los chips de arriba dejan un tipo
  solo en pantalla; sin ninguno elegido se ven todos los grupos seguidos. Cada
  baraja se presenta con su icono, cuántas cartas trae y de qué tipos son.
- **Selector de barajas** en la barra del visor: un popup con el mismo árbol
  (tipo → baraja) para saltar a otra baraja sin volver a la portada, más el
  botón ⌂ que sí vuelve a ella.
- **Filtro por tipo**: chips de multiselección (puedes combinar varios tipos);
  «Todas» es el estado sin ninguno elegido. Solo cambia lo que ves: no toca la
  selección de impresión.
- **Índice** (☰): barra lateral de texto con la baraja entera, agrupada por tipo
  en secciones colapsables. Al elegir una carta, la tira se centra en ella y se
  abre su detalle. Con sitio de sobra el índice no queda tapado por el detalle,
  así que se salta de carta en carta sin cerrar nada; el velo oscuro de la
  derecha sí cierra la carta al pulsarlo (o Esc, o «Cerrar»).
- **Buscador**: autocompletado por título y también por el texto de la carta
  (las coincidencias que solo salen en el cuerpo se marcan «en el texto»).
  Flechas para moverse por las sugerencias, Intro para abrir.
- **Tira de cartas**: una sola fila, tipo dock. Con ratón, la carta bajo el
  cursor se amplía y aparta a las de al lado, de forma continua con la distancia;
  en táctil se desliza y la carta centrada es la que queda en foco. Pulsa una
  carta para verla completa; con la rueda del ratón la tira avanza en horizontal.
- **La URL guarda dónde estás**: baraja, tipos filtrados y carta abierta viven
  en el hash, así que un enlace pegado abre exactamente lo mismo y recargar no
  te devuelve al principio:

      #baraja=faccion:novitiates&tipos=datacard,equipo&carta=c7

  Sin `baraja` estás en la portada, y entonces el hash guarda qué tipo de baraja
  tienes desplegado:

      #grupo=equipos

  Se escribe con `replaceState`, de modo que abrir cartas no llena el historial
  del navegador. Lo que no encaje (una baraja que no existe, un tipo que esa
  baraja no tiene, una carta de otra baraja) se descarta en silencio.
- **Imprimir…**: tamaño de carta, dorsos, hoja de fichas y **qué cartas entran**. La lista de
  selección del diálogo enseña la baraja entera (por títulos o en miniaturas),
  que es como se arma una impresión parcial; la marca de cada carta de la tira
  hace lo mismo, de una en una. Al abrir una baraja entran todas.

## Estructura

    src/App.jsx            estado y composición del visor, y pantallas de acceso
    src/appwrite.js        cliente de Appwrite: sesión, Storage y Functions
    src/estilos.js         estilos globales (pantalla + @media print)
    src/estado-url.js      lectura y escritura del hash de navegación
    src/assets.js          IDs de fichero de Storage -> URL
    src/icons/            iconos locales de tipo de carta
    src/data/tipos.js      tipos de carta, arquetipos y constantes de maquetación
    src/data/decks.js      carga remota y normalización de las barajas JSON
    src/cards/            render de la carta (anverso, dorso, texto, iconos)
    src/print/            formatos, hojas A4 y diálogo de impresión
    src/viewer/           barra superior, tira, índice, buscador y detalle
    src/viewer/useDock.js magnificación por distancia al puntero

## Requisitos

- Node.js 18 o superior

## Desarrollo

    npm install
    npm run dev

## Compilar para Apache

    npm install
    npm run build

El resultado queda en `dist/`. Copia su contenido al DocumentRoot (o a un
subdirectorio, la base es relativa):

    cp -r dist/* /var/www/html/kt-cartas/

No requiere configuración especial de Apache: es un sitio 100% estático de una
sola página, sin rutas del lado cliente.

## Notas

- Portada y selector: una entrada por cada JSON publicado en el bucket que la app
  reconoce como baraja (`default-deck.json`, `glosario.json`, `mapas-basicos.json`
  y cualquier `*-deck.json`), todas con el mismo formato. Añadir una baraja es
  subir su fichero desde `app-write`; la portada la recoge sola. Todas son de
  solo lectura: lo único que se guarda en el navegador es el formato de impresión
  elegido (clave `kt-formato-v1`).
- En qué grupo cae cada baraja lo dice su propio JSON, con un `"tipo"` en la raíz:
  `reglas` (el valor por defecto), `equipos` o `campanas`. Una baraja sin ese
  campo se lista como `reglas`, que es lo que eran todas antes de la
  clasificación.
- Los campos `id` de las cartas son
  opcionales: se generan al cargar a partir de la posición de la carta. Cada carta admite un bloque `acciones`: una lista de objetos
  `{nombre, coste, texto}` que se pintan como recuadros con banda de título y
  coste, y un bloque `armas`: una lista de `{nombre, atq, imp, dn, reglas}`
  (también se aceptan `ataque`/`impacto`/`daño`) que se pinta como tabla doble
  NOMBRE/ATQ/IMP./DAÑO + REGLAS DE ARMA. El tipo `continuacion` genera cartas
  sin cabecera (para reversos o segundas caras). El atributo opcional `compacto`
  (lista de secciones: `cuerpo`, `revelado`, `acciones`, `armas`, `pv`, `flavor`)
  reduce en 2pt el texto de esas secciones y comprime su interlineado
  (1.3 → 1.15) para encajar contenido largo.
- Las cartas de tipo "Datos de personaje" (`datacard`) son apaisadas (se diseñan a
  121 × 70 mm, la misma carta girada, y se imprimen reducidas al 95%, ~115 × 66.5 mm,
  para que quepan 4 por A4). Admiten un
  campo `foto` con una foto de operador del bucket (en `app-write` se escribe como
  `"wolfs/jefe-de-manada.png"`, bajo `decks/assets/op/`, y se publica como ID de
  Storage) que se muestra en la cabecera, y sus armas
  muestran la columna REGLAS DE ARMAS. El cuerpo fluye en dos columnas; el texto de
  ese cuerpo y de los recuadros de acción se reduce automáticamente para densar más.
  Puedes insertar una línea con solo `[columna]` en el cuerpo para forzar un salto de
  columna: lo que venga después (más texto o los recuadros de acción) pasa a la
  siguiente columna. Los recuadros de acción ya no se parten entre columnas.
- Las fuentes (Barlow) se cargan desde Google Fonts, así que los clientes
  necesitan salida a internet para verlas con su tipografía.
- Hoja de fichas: si la baraja declara un bloque `fichas` (ver
  `../app-write/CLAUDE.md`), el
  diálogo ofrece añadir una hoja con las fichas y marcadores recortables. A
  diferencia de las cartas, esas piezas **no** se escalan con el formato: se
  imprimen a los milímetros que declara el JSON, que es su tamaño sobre la mesa.
- Impresión: desactiva encabezados/pies del navegador y usa escala 100% para que
  las cartas salgan a 70 × 121 mm reales (el tamaño de las tarjetas oficiales del
  juego, 4 por hoja A4). Con dorsos activados, imprime a doble cara con giro por
  el borde largo.
- Si publicas la herramienta, hazlo vacía: no distribuyas mazos con contenido de
  Games Workshop precargado.
