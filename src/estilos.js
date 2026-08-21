// Estilos globales del visor. Se inyectan una vez desde App.jsx.
//
// Dos mundos conviven aquí: la PANTALLA (rejilla tipo dock, detalle) y la
// IMPRESIÓN (@media print), que oculta el visor y revela las hojas A4. Las
// cartas se pintan siempre a su tamaño real y se encogen en bloque con una
// escala, tanto en la miniatura como en la hoja: por eso lo que ves y lo que
// sale por la impresora son el mismo render.

export default `
@import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,600;1,400&family=Barlow+Condensed:wght@500;600;700&display=swap');

/* Registrada para que el efecto dock pueda interpolarse y animarse */
@property --z {
  syntax: '<number>';
  inherits: false;
  initial-value: 1;
}

:root {
  --fondo: #0E1420;
  --panel: #141C2B;
  --linea: #2B3A52;
  --texto: #C9D4E0;
  --tenue: #7C8DA3;
  --acento: #2FB8A6;
  /* Rojo para dark: el #B42318 de antes daba 2,6:1 sobre el panel, por debajo
     del 4,5:1 que pide la AA. Este da 6,1:1 y sigue leyéndose como rojo. */
  --error: #F97066;
  /* Que los controles nativos (inputs, autorrelleno, scrollbars) se pinten en
     oscuro en vez de heredar el tema claro del sistema. */
  color-scheme: dark;
  --mini-esc: 0.72;
  --mini-ancho: calc(70mm * var(--mini-esc));
  --mini-alto: calc(121mm * var(--mini-esc));
}

/* El color de texto se hereda desde aquí. Sin él, todo lo que no lleve color
   propio —los <h1> y <p> de las pantallas de acceso— salía en el negro por
   defecto del navegador sobre el fondo oscuro: 1,2:1, ilegible. */
body { background: var(--fondo); color: var(--texto); margin: 0; }

/* ---------- Panel ---------- */
/* La caja de las pantallas de acceso (login, verificación de email y solicitud
   de autorización). La clase se usaba en App.jsx pero no existía aquí, así que
   el formulario flotaba sobre el fondo sin caja ni separación. */
.panel {
  background: var(--panel);
  border: 1px solid var(--linea);
  border-radius: 12px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
  box-sizing: border-box;
}
.panel h1 {
  margin: 0 0 4px;
  font-family: 'Barlow Condensed', sans-serif; font-size: 22px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; color: #EFE9DA;
}
.panel p { line-height: 1.45; margin: 0 0 12px; }
.error { color: var(--error); }

/* ---------- Controles comunes ---------- */
input[type="text"], input[type="email"], input[type="password"], select {
  background: #182233; color: #DDE6F0; border: 1px solid var(--linea);
  border-radius: 6px; padding: 7px 9px; font-size: 14px; width: 100%;
  font-family: 'Barlow', sans-serif; box-sizing: border-box;
}
input[type="text"]:focus, input[type="email"]:focus, input[type="password"]:focus,
select:focus { outline: 2px solid var(--acento); outline-offset: 0; }
label {
  display: block; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--tenue); margin: 10px 0 4px; font-family: 'Barlow Condensed', sans-serif;
}
.btn {
  background: #182233; color: #DDE6F0; border: 1px solid var(--linea); border-radius: 6px;
  padding: 8px 12px; font-size: 13px; cursor: pointer;
  font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.05em; text-transform: uppercase;
}
.btn:hover { border-color: var(--acento); }
.btn-primario { background: #1F7A6D; border-color: var(--acento); }
.btn-mini { padding: 4px 10px; font-size: 11px; }
.btn-mini.activa { border-color: var(--acento); color: var(--acento); }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.btn:disabled:hover { border-color: var(--linea); }
.btn.ancho { width: 100%; margin-top: 12px; }
.check-linea {
  display: flex; align-items: center; gap: 8px; color: var(--texto);
  font-size: 13px; cursor: pointer; margin: 0; text-transform: none;
  letter-spacing: 0; font-family: 'Barlow', sans-serif;
}
.acento { color: var(--acento); }
.tenue { color: var(--tenue); }

/* ---------- Barra superior ---------- */
/* Columna flexible: la barra ocupa lo que necesite y la tira se queda con el
   resto exacto. Antes la tira restaba a mano la altura de la barra (150px en
   móvil, 190px en escritorio); en cuanto la barra crecía un poco, la suma
   pasaba de la pantalla y quedaba una franja vacía bajo la carta. */
.app-visor { min-height: 100dvh; display: flex; flex-direction: column; font-family: 'Barlow', sans-serif; }
/* Con sitio de sobra, el índice no tapa la tira: le abre hueco a la izquierda.
   En pantallas estrechas vuelve a ser un cajón que se superpone. */
@media (min-width: 900px) {
  .app-visor.con-indice { padding-left: 290px; }
  /* El detalle tampoco se come el índice: arranca a su derecha, de modo que
     se puede saltar de carta en carta sin cerrar nada. */
  .detalle.con-indice { left: 290px; }
}
.barra {
  position: sticky; top: 0; z-index: 20; background: rgba(14, 20, 32, 0.94);
  backdrop-filter: blur(8px); border-bottom: 1px solid var(--linea);
  padding: 10px 16px 8px; display: grid; gap: 8px;
}
/* min-width:0 en las filas y en los chips: sin él, un hijo de grid/flex se
   niega a encoger por debajo de su contenido y la página entera acaba con
   scroll horizontal en pantallas estrechas. */
.barra-fila { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
.chips { overflow-x: auto; flex-wrap: nowrap; scrollbar-width: thin; min-width: 0; }
.chips::-webkit-scrollbar { height: 4px; }
.chips::-webkit-scrollbar-thumb { background: var(--linea); }

/* ---------- Selector de baraja (popup anidado) ---------- */
.selector { position: relative; min-width: 0; }
.selector-boton {
  display: flex; align-items: center; gap: 9px; cursor: pointer; max-width: 320px;
  background: #182233; border: 1px solid var(--linea); border-radius: 8px;
  padding: 4px 10px 4px 6px; color: #EFE9DA;
  font-family: 'Barlow Condensed', sans-serif; font-size: 15px;
  letter-spacing: 0.04em; text-transform: uppercase;
}
.selector-boton:hover, .selector-boton[aria-expanded="true"] { border-color: var(--acento); }
.selector-boton img { width: 26px; height: 26px; object-fit: contain; flex: 0 0 auto; }
.selector-nombre { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.selector-flecha { color: var(--tenue); font-size: 11px; flex: 0 0 auto; }

.selector-popup {
  position: absolute; left: 0; top: calc(100% + 8px); z-index: 35;
  width: min(330px, calc(100vw - 32px));
  background: var(--panel); border: 1px solid var(--linea); border-radius: 10px;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.5); overflow: hidden;
}
.selector-inicio {
  display: block; width: 100%; text-align: left; cursor: pointer;
  background: transparent; border: 0; border-bottom: 1px solid var(--linea);
  padding: 9px 12px; color: var(--texto);
  font-family: 'Barlow Condensed', sans-serif; font-size: 12px;
  letter-spacing: 0.08em; text-transform: uppercase;
}
.selector-inicio:hover { background: #182233; color: var(--acento); }
/* Tope de altura: con muchas facciones el popup se comería la pantalla. */
.selector-cuerpo { max-height: min(60vh, 460px); overflow-y: auto; padding: 4px 0 6px; }
.selector-cuerpo details { border-bottom: 1px solid rgba(43, 58, 82, 0.5); }
.selector-cuerpo details:last-child { border-bottom: 0; }
.selector-cuerpo summary {
  cursor: pointer; padding: 7px 12px; list-style: none;
  font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--acento);
  display: flex; align-items: center; gap: 6px;
}
.selector-cuerpo summary::-webkit-details-marker { display: none; }
.selector-cuerpo summary::before {
  content: "▸"; font-size: 10px; color: var(--tenue);
  transition: transform .15s ease; display: inline-block;
}
.selector-cuerpo details[open] > summary::before { transform: rotate(90deg); }
.selector-cuerpo summary:hover { background: #182233; }
.selector-cuerpo summary em { font-style: normal; color: var(--tenue); margin-left: auto; }
.selector-cuerpo ul { margin: 0 0 6px; padding: 0; list-style: none; }
.selector-cuerpo li button {
  display: flex; align-items: center; gap: 8px; width: 100%; text-align: left;
  cursor: pointer; background: transparent; border: 0;
  border-left: 2px solid transparent; padding: 5px 12px 5px 16px;
  color: var(--texto); font-size: 13px; font-family: 'Barlow', sans-serif;
}
.selector-cuerpo li button img { width: 22px; height: 22px; object-fit: contain; opacity: 0.6; flex: 0 0 auto; }
.selector-item-nombre { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.selector-cuerpo li button em { font-style: normal; color: var(--tenue); font-size: 11px; }
.selector-cuerpo li button:hover { background: #182233; border-left-color: var(--linea); }
.selector-cuerpo li button:hover img { opacity: 1; }
.selector-cuerpo li button.activa {
  color: var(--acento); border-left-color: var(--acento); background: #182233;
}
.selector-cuerpo li button.activa img { opacity: 1; }

/* ---------- Portada (índice de barajas) ---------- */
.portada { min-height: 100vh; font-family: 'Barlow', sans-serif; }
.portada-barra { display: block; }
.portada-marca {
  margin: 0; color: #EFE9DA; font-family: 'Barlow Condensed', sans-serif;
  font-size: 20px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
}
.portada-cuerpo { max-width: 1100px; margin: 0 auto; padding: 20px 16px 48px; }
.portada-grupos { margin-bottom: 26px; }
.portada-grupo { margin-bottom: 34px; }
.portada-grupo-titulo { margin-bottom: 12px; }
.portada-grupo-titulo h2 {
  margin: 0; color: var(--acento); font-family: 'Barlow Condensed', sans-serif;
  font-size: 15px; letter-spacing: 0.12em; text-transform: uppercase;
}
.portada-grupo-titulo p { margin: 3px 0 0; font-size: 13px; }
.portada-rejilla {
  display: grid; gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}
.portada-baraja {
  display: flex; align-items: center; gap: 12px; text-align: left; cursor: pointer;
  background: var(--panel); border: 1px solid var(--linea); border-radius: 10px;
  padding: 12px; color: var(--texto); font-family: 'Barlow', sans-serif;
  transition: border-color .15s ease, transform .15s ease;
}
.portada-baraja:hover { border-color: var(--acento); transform: translateY(-2px); }
.portada-baraja-icono { flex: 0 0 auto; display: grid; place-items: center; width: 48px; height: 48px; }
.portada-baraja-icono img { width: 48px; height: 48px; object-fit: contain; }
.portada-baraja-texto { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.portada-baraja-texto strong {
  color: #EFE9DA; font-family: 'Barlow Condensed', sans-serif; font-size: 16px;
  letter-spacing: 0.04em; text-transform: uppercase;
}
.portada-baraja-texto > span { font-size: 12px; }
.portada-baraja-tipos {
  color: var(--tenue); font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.75;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.chips { display: flex; gap: 6px; }
.chip {
  flex: 0 0 auto; cursor: pointer; background: #182233; border: 1px solid var(--linea);
  border-radius: 999px; padding: 4px 11px; color: var(--tenue); font-size: 12px;
  font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.05em;
  text-transform: uppercase; white-space: nowrap;
}
.chip em { font-style: normal; opacity: 0.6; margin-left: 3px; }
.chip:hover { border-color: var(--acento); }
.chip.activa { border-color: var(--acento); color: var(--acento); background: rgba(47, 184, 166, 0.12); }
.chip.activa::before { content: "✓ "; }

.barra-fila.acciones { justify-content: flex-start; }
.contador { color: var(--tenue); font-size: 12px; white-space: nowrap; margin-left: auto; }
.corta { display: none; }

.usuario-menu { position: relative; flex: 0 0 auto; }
.usuario-boton {
  display: flex; align-items: center; gap: 7px; cursor: pointer;
  background: #182233; border: 1px solid var(--linea); border-radius: 999px;
  color: var(--texto); padding: 3px 9px 3px 3px;
  font-family: 'Barlow Condensed', sans-serif; font-size: 12px;
  letter-spacing: 0.05em; text-transform: uppercase; max-width: 210px;
}
.usuario-boton:hover, .usuario-boton[aria-expanded="true"] { border-color: var(--acento); }
.usuario-boton img { width: 28px; height: 28px; border-radius: 999px; display: block; }
.usuario-boton span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.usuario-popup {
  position: absolute; right: 0; top: calc(100% + 8px); z-index: 35; width: min(280px, calc(100vw - 32px));
  padding: 12px; background: var(--panel); border: 1px solid var(--linea); border-radius: 10px;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.5);
}
.usuario-resumen { display: flex; align-items: center; gap: 10px; min-width: 0; }
.usuario-resumen img { width: 40px; height: 40px; border-radius: 999px; flex: 0 0 auto; }
.usuario-resumen div { min-width: 0; }
.usuario-resumen strong, .usuario-resumen span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.usuario-resumen strong { color: #EFE9DA; font-size: 14px; }
.usuario-resumen span { color: var(--tenue); font-size: 12px; margin-top: 2px; }

/* ---------- Buscador ---------- */
.buscador { position: relative; flex: 1 1 200px; max-width: 340px; min-width: 0; }
.buscador input {
  width: 100%; box-sizing: border-box;
  background: #182233; color: #DDE6F0; border: 1px solid var(--linea);
  border-radius: 6px; padding: 5px 10px; font-size: 13px;
  font-family: 'Barlow', sans-serif;
}
.buscador input::placeholder { color: var(--tenue); }
.buscador input:focus { outline: 2px solid var(--acento); outline-offset: 0; }
.sugerencias {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 30;
  margin: 0; padding: 4px; list-style: none;
  background: var(--panel); border: 1px solid var(--linea); border-radius: 8px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
  max-height: 46vh; overflow-y: auto;
}
.sugerencias li { margin: 0; }
.sugerencias button {
  display: flex; align-items: baseline; gap: 8px; width: 100%; text-align: left;
  background: transparent; border: 0; border-radius: 5px; cursor: pointer;
  padding: 6px 8px; color: var(--texto); font-size: 13px; font-family: 'Barlow', sans-serif;
}
.sugerencias button.activa { background: #182233; }
.sugerencias .nombre { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sugerencias .tipo, .sugerencias .donde {
  flex: 0 0 auto; font-size: 11px; color: var(--tenue);
  font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.05em; text-transform: uppercase;
}
.sugerencias .donde { color: var(--acento); opacity: 0.8; }
.sugerencias .vacio { padding: 8px; color: var(--tenue); font-size: 13px; }

/* ---------- Índice (barra lateral) ---------- */
.indice {
  position: fixed; top: 0; left: 0; bottom: 0; z-index: 45; width: 290px;
  display: flex; flex-direction: column;
  background: var(--panel); border-right: 1px solid var(--linea);
  box-shadow: 8px 0 28px rgba(0, 0, 0, 0.45);
}
.indice-barra {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 10px 12px; border-bottom: 1px solid var(--linea);
}
.indice-titulo { display: flex; flex-direction: column; min-width: 0; }
.indice-titulo strong {
  font-family: 'Barlow Condensed', sans-serif; font-size: 15px; letter-spacing: 0.05em;
  text-transform: uppercase; color: #EFE9DA;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.indice-titulo span { color: var(--tenue); font-size: 11px; }

.indice-cuerpo { flex: 1; overflow-y: auto; padding: 6px 0 24px; }
.indice-cuerpo details { border-bottom: 1px solid rgba(43, 58, 82, 0.5); }
.indice-cuerpo summary {
  cursor: pointer; padding: 8px 12px; list-style: none;
  font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--acento);
  display: flex; align-items: center; gap: 6px;
}
.indice-cuerpo summary::-webkit-details-marker { display: none; }
/* El triángulo lo ponemos nosotros para que gire al abrir */
.indice-cuerpo summary::before {
  content: "▸"; font-size: 10px; color: var(--tenue);
  transition: transform .15s ease; display: inline-block;
}
.indice-cuerpo details[open] > summary::before { transform: rotate(90deg); }
.indice-cuerpo summary:hover { background: #182233; }
.indice-cuerpo summary em { font-style: normal; color: var(--tenue); margin-left: auto; }
.indice-cuerpo ul { margin: 0 0 6px; padding: 0; list-style: none; }
.indice-cuerpo li button {
  display: block; width: 100%; text-align: left; cursor: pointer;
  background: transparent; border: 0; border-left: 2px solid transparent;
  padding: 5px 12px 5px 26px; color: var(--texto); font-size: 13px;
  font-family: 'Barlow', sans-serif;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.indice-cuerpo li button:hover { background: #182233; border-left-color: var(--linea); }
.indice-cuerpo li button.activa {
  color: var(--acento); border-left-color: var(--acento); background: #182233;
}

@media (max-width: 760px) {
  .indice { width: min(86vw, 320px); }
  .indice-cuerpo { padding-bottom: 32px; }
}

/* ---------- La tira de cartas ---------- */
/* Una sola fila, siempre: el dock necesita un eje. */
.rejilla {
  position: relative;
  display: flex; flex-wrap: nowrap; align-items: center;
  overflow-x: auto; overscroll-behavior-x: contain;
  /* El relleno lateral absorbe el empuje del dock: al ampliarse una carta, las
     de su izquierda se apartan hacia fuera y sin holgura se comerían el borde. */
  gap: 18px; padding: 0 90px;
  /* Sin min-height: se queda con el hueco que deje la barra, sea el que sea.
     Tampoco lleva min-height:0, para que en una pantalla muy baja la carta no
     se recorte: antes de eso preferimos que la página haga scroll, y para eso
     la barra es sticky. */
  flex: 1;
}
.rejilla::-webkit-scrollbar { height: 6px; }
.rejilla::-webkit-scrollbar-thumb { background: var(--linea); border-radius: 3px; }

.mini {
  position: relative; flex: 0 0 auto; --z: 1;
  transform: scale(var(--z));
  transition: --z .2s ease, transform .2s ease, opacity .2s ease;
}
/* Mientras el dock manda, el transform lo escribe rAF cuadro a cuadro: una
   transición encima solo añadiría retardo. Al soltar sí se vuelve con calma. */
.rejilla.dock .mini { transition: opacity .2s ease; }
.rejilla.dock.reposo .mini { transition: transform .28s cubic-bezier(.22,.61,.36,1), opacity .2s ease; }

.mini-abrir {
  display: block; padding: 0; background: transparent; cursor: pointer; line-height: 0;
  border: 2px solid var(--linea); border-radius: 7px; overflow: hidden;
  opacity: 0.45; filter: grayscale(0.65);
}
.mini.marcada .mini-abrir { opacity: 1; filter: none; border-color: var(--acento); }
.mini-abrir:hover { border-color: var(--acento); }
.mini-lienzo { width: var(--mini-ancho); height: var(--mini-alto); overflow: hidden; }
.mini-lienzo > * { transform: scale(var(--mini-esc)); transform-origin: top left; }
.mini.apaisada .mini-lienzo { width: var(--mini-alto); height: var(--mini-ancho); }
.mini-marca {
  position: absolute; top: 5px; right: 5px; width: 22px; height: 22px; cursor: pointer;
  border-radius: 5px; background: rgba(14, 20, 32, 0.85); border: 1px solid var(--linea);
  color: var(--acento); font-size: 13px; line-height: 1; text-align: center; padding: 0;
}
.mini.marcada .mini-marca { border-color: var(--acento); }
.mini-marca:hover { border-color: var(--acento); background: var(--fondo); }

/* La carta apuntada pasa a color y por delante; el tamaño lo pone el dock. */
@media (hover: hover) and (pointer: fine) {
  .rejilla .mini:hover { z-index: 3; }
  .rejilla .mini:hover .mini-abrir { opacity: 1; filter: none; border-color: var(--acento); }
}

/* El imán del carrusel es cosa del dedo, no del ancho de pantalla: con ratón
   pelearía contra el dock, así que se activa por tipo de puntero. El relleno
   lateral es lo que permite que la primera y la última carta lleguen al centro,
   y se calcula con el lado largo (el ancho de una ficha apaisada). */
@media (pointer: coarse) {
  .rejilla {
    scroll-snap-type: x mandatory; scroll-padding: 0 50%;
    padding: 0 max(16px, calc(50vw - var(--mini-alto) / 2));
  }
  .mini { scroll-snap-align: center; }
}

/* En táctil no hay puntero al que seguir: la carta en foco es la centrada, y
   quien la mueve es el propio gesto de desplazar la tira. Sin soporte de
   scroll-driven animations las cartas se quedan planas y el carrusel sigue
   funcionando igual. */
@media (max-width: 760px) {
  /* La carta ocupa ~60 % del ancho: se lee, y aun así asoman las vecinas, que
     es lo que convierte la tira en un carrusel y no en un pase de diapositivas. */
  :root { --mini-esc: 0.78; }

  /* La cabecera se comprime: los textos largos ceden su sitio a las versiones
     cortas y el nombre de la baraja se queda con el ancho que sobre. */
  .barra { padding: 8px 12px 6px; gap: 6px; }
  .selector { flex: 1 1 auto; }
  .selector-boton { max-width: 100%; width: 100%; }
  .barra-fila.acciones { flex-wrap: nowrap; gap: 8px; }
  .barra-fila.acciones .btn { padding: 4px 8px; flex: 0 0 auto; }
  .contador { font-size: 12px; }
  .larga { display: none; }
  .corta { display: inline; }

  @supports (animation-timeline: view()) {
    .mini {
      animation: foco linear both;
      animation-timeline: view(inline);
      animation-range: entry 10% exit 90%;
    }
    .mini-abrir { opacity: 1; filter: none; }
    .mini:not(.marcada) .mini-abrir { opacity: 0.55; filter: grayscale(0.5); }
  }
  @keyframes foco {
    0%, 100% { --z: 0.78; opacity: 0.45; }
    45%, 55% { --z: 1; opacity: 1; }
  }
}

@media (prefers-reduced-motion: reduce) {
  .mini { animation: none !important; transition: none; --z: 1 !important; opacity: 1 !important; }
}

/* ---------- Detalle ---------- */
.detalle {
  position: fixed; inset: 0; z-index: 50; background: rgba(6, 10, 18, 0.93);
  display: grid; grid-template-columns: 56px 1fr 56px; grid-template-rows: auto 1fr;
  align-items: center;
}
.detalle-barra {
  grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap; padding: 10px 14px; border-bottom: 1px solid var(--linea);
  background: var(--fondo); align-self: start;
}
.detalle-titulo { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
.detalle-titulo strong {
  font-family: 'Barlow Condensed', sans-serif; font-size: 18px; letter-spacing: 0.05em;
  text-transform: uppercase; color: #EFE9DA;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.detalle-titulo span { color: var(--tenue); font-size: 12px; white-space: nowrap; }
.detalle-acciones { display: flex; gap: 6px; flex-wrap: wrap; }
.detalle-lienzo { grid-column: 2; display: grid; place-items: center; overflow: hidden; height: 100%; }
.detalle-carta { transform-origin: center; }
.detalle-nav {
  background: transparent; border: none; color: var(--tenue); cursor: pointer;
  font-size: 40px; line-height: 1; padding: 0; align-self: center;
}
.detalle-nav:hover { color: var(--acento); }
.detalle-nav.izq { grid-column: 1; grid-row: 2; }
.detalle-nav.der { grid-column: 3; grid-row: 2; }

@media (max-width: 760px) {
  .detalle { grid-template-columns: 40px 1fr 40px; }
  .detalle-nav { font-size: 30px; }
  .detalle-titulo strong { font-size: 15px; }
}

/* La miniatura se convierte en la carta grande, en vez de aparecer un modal
   encima. Sin soporte, la transición es un fundido normal. */
@view-transition { navigation: none; }
::view-transition-old(carta), ::view-transition-new(carta) { animation-duration: 0.28s; }

/* ---------- Modal de impresión ---------- */
.modal-fondo {
  position: fixed; inset: 0; background: rgba(6, 10, 18, 0.72);
  display: grid; place-items: center; padding: 24px; z-index: 60;
}
.modal {
  background: var(--panel); border: 1px solid var(--linea); border-radius: 12px;
  padding: 20px 22px; max-width: 620px; width: 100%; max-height: 82vh; overflow-y: auto;
}
.modal-cabecera { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.modal-cabecera h2 {
  font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 19px;
  letter-spacing: 0.06em; text-transform: uppercase; color: #EFE9DA; margin: 0;
}
.modal-opciones { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: end; margin-top: 14px; }
.modal-pie {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: 10px; margin-top: 16px;
}
.resumen { color: var(--tenue); font-size: 12px; line-height: 1.4; }
.parrafo { color: var(--texto); font-size: 13px; line-height: 1.5; margin: 12px 0 0; }
.parrafo.tenue { color: var(--tenue); font-size: 12px; }
.aviso-filtro {
  margin: 14px 0 0; padding: 9px 11px; border-radius: 8px; font-size: 12px; line-height: 1.5;
  color: #E0C77A; background: rgba(224, 168, 60, 0.09); border: 1px solid rgba(224, 168, 60, 0.35);
}
.modal.ancho { max-width: 780px; }
.caja-seleccion {
  background: var(--fondo); border: 1px solid var(--linea); border-radius: 8px;
  padding: 8px; max-height: 40vh; overflow-y: auto;
}
.fila-sel {
  display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--texto);
  font-size: 13px; padding: 5px 8px; border-radius: 6px;
  border: 1px solid transparent; opacity: 0.5;
}
.fila-sel.activa { opacity: 1; background: #182233; border-color: var(--linea); }
.fila-sel:hover { border-color: var(--acento); }
.fila-sel input { width: auto; }
.fila-sel .nombre { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rejilla-sel { display: flex; flex-wrap: wrap; gap: 8px; }
.sel-carta {
  position: relative; padding: 0; background: transparent; cursor: pointer; line-height: 0;
  border: 2px solid var(--linea); border-radius: 6px; overflow: hidden;
  opacity: 0.4; filter: grayscale(0.6);
}
.sel-carta.activa { opacity: 1; filter: none; border-color: var(--acento); }
.sel-carta:hover { border-color: var(--acento); }
.sel-lienzo { width: calc(70mm * 0.36); height: calc(121mm * 0.36); overflow: hidden; }
.sel-lienzo > * { transform: scale(0.36); transform-origin: top left; }
.sel-carta.apaisada .sel-lienzo { width: calc(121mm * 0.36); height: calc(70mm * 0.36); }
.sel-marca {
  position: absolute; top: 3px; right: 3px; width: 16px; height: 16px;
  border-radius: 4px; background: rgba(14, 20, 32, 0.8); border: 1px solid var(--linea);
  color: var(--acento); font-size: 11px; line-height: 14px; text-align: center;
}
.sel-carta.activa .sel-marca { border-color: var(--acento); }

.lista-ayuda { margin: 14px 0 0; display: grid; gap: 10px; }
.lista-ayuda dt {
  font-family: 'Barlow Condensed', sans-serif; font-size: 12px;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--acento);
}
.lista-ayuda dd { margin: 2px 0 0; color: var(--texto); font-size: 13px; line-height: 1.45; }

/* ---------- Resúmenes (pantalla) ---------- */
/* La previsualización es la hoja de verdad reducida al 55%: lo que se ve es lo
   que sale por la impresora, sin una maquetación paralela que mantener. Van en
   fila y de dos en dos, como caen sobre el A4 apaisado. */
.resumenes-cuerpo {
  padding: 16px; display: flex; flex-wrap: wrap; gap: 18px;
  align-items: flex-start; justify-content: center; overflow: auto;
}
.resumen-item { border: 2px solid var(--linea); border-radius: 8px; padding: 10px; opacity: 0.55; }
.resumen-item.activa { opacity: 1; border-color: var(--acento); }
.resumen-marca {
  display: flex; align-items: center; gap: 8px; cursor: pointer;
  color: var(--texto); font-size: 13px; margin-bottom: 8px;
}
.resumen-marca input { width: auto; }
.resumen-lienzo {
  width: calc(140mm * 0.55); height: calc(198mm * 0.55); overflow: hidden; line-height: 0;
  display: block; padding: 0; border: none; background: none; cursor: zoom-in;
}
.resumen-lienzo > * { transform: scale(0.55); transform-origin: top left; }
.resumenes-nota { padding: 0 16px 20px; text-align: center; font-size: 12px; }

/* ---------- Ampliación (leer una hoja o ver las fichas sin imprimir) ---------- */
/* El desplazamiento es del fondo, no de una caja interior: así la barra de
   cierre puede quedarse pegada arriba y el gesto es el de una página normal.
   El ancho se topa antes de llenar un monitor entero; una hoja A5 estirada a
   1400 px se lee peor, no mejor, y obliga a mover la vista en horizontal. */
.ampliacion {
  position: fixed; inset: 0; z-index: 70; overflow-y: auto; overscroll-behavior: contain;
  background: rgba(6, 10, 18, 0.88); padding-bottom: 40px;
}
.ampliacion-caja { width: min(100%, 860px); margin: 0 auto; padding: 0 12px; }
.ampliacion-barra {
  position: sticky; top: 0; z-index: 1; display: flex; align-items: center;
  justify-content: space-between; gap: 12px; padding: 10px 0;
  background: rgba(6, 10, 18, 0.92); color: var(--texto); font-size: 14px;
}
.ampliacion-lienzo { overflow: hidden; line-height: 0; border-radius: 6px; }
/* El max-content no es cosmético: la hoja de dentro mide 140 mm y el
   envoltorio se mide para sacar la escala. Como bloque se estiraría al ancho
   del lienzo y la escala saldría siempre 1. */
.ampliacion-lienzo > * { transform-origin: top left; width: max-content; }
.ampliacion-papel { background: #FFFFFF; border-radius: 6px; padding: 10px; }
.ampliacion-nota { margin: 12px 0 0; font-size: 12px; line-height: 1.5; text-align: center; }

/* ---------- Hoja de fichas ---------- */
/* Fuera de @media print porque la misma plancha se mira en pantalla desde la
   ampliación. Aquí no hay escala que valga: cada pieza mide en mm lo que mide
   sobre la mesa, por eso no cuelga de --esc como las cartas. */
.etiqueta-hoja {
  font-family: 'Barlow Condensed', sans-serif; font-size: 2.8mm; letter-spacing: 0.06em;
  text-transform: uppercase; color: #999; margin: 0 0 1.4mm; text-align: center;
}
.rejilla-fichas {
  display: flex; flex-wrap: wrap; align-content: start;
  gap: 2mm; justify-content: center;
}
.ficha-corte {
  outline: 0.2mm dashed #999;
  display: grid; place-items: center; overflow: hidden;
}
.ficha-corte img { width: 100%; height: 100%; object-fit: contain; }
/* La misma pieza dentro de la carta de guía: sin línea de corte, porque ahí no
   se recorta nada. */
.ficha-guia { display: grid; place-items: center; overflow: hidden; }
.ficha-guia img { width: 100%; height: 100%; object-fit: contain; }
/* Fichas de texto (los números de agente): la silueta la dibuja el SVG de
   HojaFichas, aquí solo se le da el tamaño y la tipografía. Ocupa algo menos
   que la caja para dejar canto al recortar. */
.ficha-texto {
  width: 92%; height: 92%;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.ficha-texto text {
  font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
  font-size: 44px; letter-spacing: -0.02em;
}
.pie-fichas {
  font-family: 'Barlow', sans-serif; font-size: 2.6mm; line-height: 1.4;
  color: #666; text-align: center; margin: 4mm auto 0; max-width: 150mm;
}

/* ---------- Impresión ---------- */
@page { size: A4; margin: 6mm; }
/* Por defecto la caja de corte es el propio dibujo escalado; "Seis por hoja"
   las sobrescribe desde el JS (ver print/formatos.js). */
.hoja-impresion {
  --celda-ancho: calc(70mm * var(--esc));
  --celda-alto: calc(121mm * var(--esc));
  --hueco: 3mm;
}
.hoja-impresion { display: none; }
@media print {
  body { background: white !important; }
  .app-visor, .portada, .detalle, .indice, .modal-fondo, .ampliacion { display: none !important; }
  .hoja-impresion { display: block !important; background: white; }
  .hoja { page-break-after: always; break-after: page; }
  .hoja:last-child { page-break-after: auto; break-after: auto; }
  /* overflow:hidden en la PÁGINA, no solo en la celda. Es el cinturón que
     impide que nada vuelva a ensanchar la hoja: basta con que un hijo se salga
     —y el sangrado del dorso se sale a propósito— para que el navegador decida
     que la página no cabe en el A4 y la encoja entera. El precio es que el
     sangrado de la fila y la columna exteriores se recorta contra el borde del
     papel; el de dentro, que es el que importa para casar cara y dorso, se
     conserva. */
  .pagina, .pagina-ficha { overflow: hidden; }
  .pagina {
    display: grid;
    grid-template-columns: repeat(var(--cols, 2), var(--celda-ancho));
    grid-auto-rows: var(--celda-alto);
    gap: var(--hueco, 3mm); justify-content: center; align-content: start;
  }
  /* El diseño base ocupa 70×121 mm; el formato elegido lo encoge en bloque
     (--esc) sin rehacer la maquetación interna. La celda es la caja de corte y
     normalmente mide lo mismo que el dibujo; cuando mide más (--celda-alto),
     el sobrante se reparte arriba y abajo con --aire, que es el papel que
     necesita la plastificadora para sellar sin tocar el diseño. */
  /* El hijo va FUERA DEL FLUJO a propósito: transform no cambia el tamaño de
     maquetación: una carta escalada sigue midiendo 70 mm —y una ficha de datos
     girada, 121— dentro de una celda de 64. Con tres columnas eso hace que la
     página mida cientos de milímetros de más y el navegador la encoja entera
     para que quepa, que es exactamente el síntoma de "sale más pequeña de lo
     que dice el formato". En absoluto no ocupa sitio y la celda manda. */
  .celda { position: relative; outline: 0.2mm dashed #999;
    width: var(--celda-ancho); height: var(--celda-alto); overflow: hidden;
  }
  .celda > * {
    /* El !important no es pereza: CartaFace y CartaDorso fijan position:relative
       EN LÍNEA para su propio apilado interno, y un estilo en línea gana a la
       hoja. Sin esto la carta se queda en flujo y vuelve a ensanchar la página.
       Absoluto le sirve igual como bloque contenedor, así que su z-index sigue
       funcionando. */
    position: absolute !important; top: 0; left: 0;
    transform: translateY(var(--aire, 0mm)) scale(var(--esc)); transform-origin: top left;
  }
  /* Una ficha de datos se diseña apaisada (121 × 70). Girarla 90° la deja en
     70 × 121, la misma caja que el resto, y así entra en la rejilla de tres
     columnas al mismo tamaño que sus compañeras. El translateX de 70 mm la
     devuelve al sitio: al rotar sobre la esquina superior izquierda el bloque
     se va hacia la izquierda, y 70 mm es su nuevo ancho. */
  .celda-girada > * {
    transform: translateY(var(--aire, 0mm)) scale(var(--esc)) translateX(70mm) rotate(90deg);
  }
  /* SANGRADO DEL DORSO. Al imprimir a doble cara las dos caras nunca casan al
     milímetro, y si el dibujo del dorso acaba justo en la línea de corte, un
     desvío deja un reborde blanco. Aquí el dorso se dibuja 1 mm más grande por
     cada lado y se recoloca -1 mm, así que queda centrado en el mismo sitio y
     lo que sobra se va al hueco entre cartas, que para eso está. El anverso no
     lo lleva: es el que marca dónde se corta. */
  .celda-dorso { overflow: visible; }
  .celda-dorso > * {
    transform: translate(-1mm, calc(var(--aire, 0mm) - 1mm))
      scale(calc(var(--esc) * var(--dorso-x)), calc(var(--esc) * var(--dorso-y)));
  }
  .celda-dorso.celda-girada > * {
    transform: translate(-1mm, calc(var(--aire, 0mm) - 1mm))
      scale(calc(var(--esc) * var(--dorso-x)), calc(var(--esc) * var(--dorso-y)))
      translateX(70mm) rotate(90deg);
  }
  .celda-ficha.celda-dorso > * {
    transform: translate(-1mm, -1mm)
      scale(calc(var(--esc-ficha) * var(--dorso-fx)), calc(var(--esc-ficha) * var(--dorso-fy)));
  }
  /* La línea de corte se repinta encima: el sangrado la taparía justo en el
     milímetro por el que hay que cortar. */
  .celda-dorso { outline: none; }
  .celda-dorso::after {
    content: ""; position: absolute; inset: 0; z-index: 3;
    outline: 0.2mm dashed #999; pointer-events: none;
  }
  .pagina-ficha {
    display: grid;
    grid-template-columns: repeat(var(--cols-ficha, 1), calc(121mm * var(--esc-ficha)));
    grid-auto-rows: calc(70mm * var(--esc-ficha));
    gap: var(--hueco, 3mm); justify-content: center; align-content: start;
  }
  /* Las fichas se reducen además al 95% del diseño base (121×70 mm) para que
     quepan 4 por hoja A4 en vez de 3. */
  .celda-ficha {
    position: relative; outline: 0.2mm dashed #999;
    width: calc(121mm * var(--esc-ficha)); height: calc(70mm * var(--esc-ficha)); overflow: hidden;
  }
  .celda-ficha > * {
    position: absolute !important; top: 0; left: 0;
    transform: scale(var(--esc-ficha)); transform-origin: top left;
  }
  .celda-vacia { outline: none; }
  /* Testigo de escala: 50 mm reales impresos en cada hoja. Si la regla no mide
     50, el navegador ha reescalado la página y no tiene sentido medir nada más. */
  .regla-50 {
    display: inline-block; width: 50mm; height: 2mm; margin: 0 2mm -0.4mm 4mm;
    border: 0.3mm solid #999; border-top: none;
  }
  .regla-pie { font-size: 2.2mm; }

  /* Resúmenes: dos A5 verticales (140 × 198 mm) en fila sobre un A4 apaisado.
     No cuelgan de --esc; se imprimen a tamaño de diseño y se cortan por el
     medio. La rotación de la página la pone estilosResumen (ver abajo). */
  .pagina-a5 {
    display: grid;
    grid-template-columns: repeat(2, 140mm);
    grid-auto-rows: 198mm;
    gap: 4mm; justify-content: center; align-content: start;
  }
  .celda-a5 { width: 140mm; height: 198mm; overflow: hidden; }
  /* La plancha de fichas se estiliza fuera de @media print (ver arriba): es la
     misma en papel y en la ampliación de pantalla. */
}
`;

// Los resúmenes se imprimen en A4 apaisado, y @page no se puede acotar por
// selector: no hay forma de decir "esta página sí y esa no". La salida son dos
// pantallas que nunca se imprimen a la vez, así que basta con inyectar esta
// hoja *después* de la global cuando se está en el visor de resúmenes; la
// última regla @page que se declara es la que manda.
export const estilosResumen = `
@page { size: A4 landscape; margin: 6mm; }
`;
