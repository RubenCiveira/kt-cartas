// Pruebas de control de estado en mesa: dos formatos para llevar heridas, orden
// y activación de cada agente sin fichas sueltas encima de la tarjeta grande.
// Se imprimen desde el diálogo de fichas cenitales, junto a (o en lugar de) la
// hoja de control de escuadra. Ver web-app/CLAUDE.md, «Fichas cenitales».
//
//   a) Carta de 80 × 120 mm y un PORTACARTAS de tres capas para pegar sobre
//      cartón: marco con ventanas troqueladas, separador en U (la ranura de la
//      carta) y base. Las ventanas caen justo encima de los huecos dibujados en
//      la carta —pista de heridas y pozos de fichas—, así que las fichas quedan
//      encajadas y la tarjeta se puede mover sin que salgan volando. Carta y
//      portacartas comparten las coordenadas de abajo (A_*): si cambia una,
//      cambia la otra.
//
//   b) Carta de póquer (63 × 88 mm) con la pista de heridas en el borde derecho,
//      para marcarla con una pinza, y fichas RECTANGULARES para pegar en pinzas
//      pequeñas que se enganchan al borde. Orden y activación son tiras que se
//      doblan sobre la pinza: una cara por estado.
//
// Las medidas son todas en mm reales: estas piezas no escalan con 15/28 mm,
// son material de jugador y se leen a la misma distancia en las dos escalas.

import { useAssetUrl } from "../assets.js";
import { LineasTexto } from "../cards/texto.jsx";
import { PiezaFicha, copiasDeFichas } from "./HojaFichas.jsx";
import { FotoEncuadrada } from "./HojasCenitales.jsx";

// ---------------------------------------------------------------------------
// Geometría compartida

// a) Carta y portacartas
const A_CARTA = { w: 80, h: 120 };
const A_MARGEN = 4;                       // del marco del portacartas a la carta
const A_PORTA = { w: A_CARTA.w + 2 * A_MARGEN, h: A_CARTA.h + 2 * A_MARGEN };
const A_TEXTO = { x: 1.5, y: 1.5, w: 77, h: 79 };  // ventana de lectura
const A_HERIDA = 6, A_HUECO = 0.6, A_POR_FILA = 11;
const A_HERIDAS_Y = 84;
const A_POZO = 14, A_POZOS_Y = 103;
const A_POZOS = ["ORDEN", "ACTIVADO", "FICHA", "FICHA"];

const casillasHeridas = (her) => {
  const filas = Math.ceil(her / A_POR_FILA) || 1;
  const porFila = Math.ceil(her / filas);
  const ancho = porFila * A_HERIDA + (porFila - 1) * A_HUECO;
  const x0 = (A_CARTA.w - ancho) / 2;
  return Array.from({ length: her }, (_, i) => ({
    x: x0 + (i % porFila) * (A_HERIDA + A_HUECO),
    y: A_HERIDAS_Y + Math.floor(i / porFila) * (A_HERIDA + A_HUECO),
    valor: her - i,
    herido: her - i - 1 < her / 2,
  }));
};
const pozos = () => {
  const paso = A_CARTA.w / A_POZOS.length;
  return A_POZOS.map((etiqueta, i) => ({ etiqueta, cx: paso * (i + 0.5), cy: A_POZOS_Y + A_POZO / 2 }));
};

// b) Carta de póquer
const B_CARTA = { w: 63, h: 88 };
const B_PISTA = 7;          // ancho de la pista de heridas del borde derecho
const B_FICHA = { w: 11, h: 18 };

const her = (op) => parseInt(op.stats?.her, 10) || 0;

// Armas, reglas y acciones de todas las cartas del agente (la ficha y su
// continuación, en `datos`), juntas: estas tarjetas no se parten en dos.
function contenido(op) {
  const datos = op.datos || [];
  return {
    armas: datos.flatMap((c) => c.armas || []),
    cuerpo: datos.map((c) => c.cuerpo).filter(Boolean).join("\n"),
    acciones: datos.flatMap((c) => c.acciones || []),
  };
}

// ---------------------------------------------------------------------------
// Piezas comunes

function Cabecera({ op, foto }) {
  return (
    <div className="ctl-cabecera">
      <span className="ctl-retrato" style={{ width: foto + "mm", height: foto + "mm" }}>
        <FotoEncuadrada foto={op.foto} centro={op.fotoCentro} />
      </span>
      <div className="ctl-titulos">
        <div className="ctl-nombre">{op.nombre}</div>
        <div className="ctl-tipo">{op.titulo}</div>
        <div className="ctl-stats">
          <span>LPA <b>{op.stats.apl}</b></span>
          <span>MOV <b>{op.stats.mov}</b></span>
          <span>SALV <b>{op.stats.salv}</b></span>
          <span>HER <b>{op.stats.her}</b></span>
        </div>
      </div>
    </div>
  );
}

function Reglas({ op: agente, cuerpo }) {
  const op = contenido(agente);
  return (
    <div className="ctl-reglas">
      {op.armas.length > 0 && (
        <table className="ctl-armas">
          <thead>
            <tr><th>Arma</th><th>A</th><th>I</th><th>D</th><th>Reglas</th></tr>
          </thead>
          <tbody>
            {op.armas.map((a, i) => (
              <tr key={i}>
                <td>{a.nombre}</td><td>{a.atq}</td><td>{a.imp}</td><td>{a.dn}</td>
                <td>{a.reglas === "-" ? "" : a.reglas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {op.cuerpo && <LineasTexto texto={op.cuerpo} fontSize={cuerpo} lineHeight={1.2} />}
      {op.acciones.map((ac, i) => (
        <div key={i} className="ctl-accion">
          <b>{ac.nombre} {ac.coste}</b>
          <LineasTexto texto={ac.texto} fontSize={cuerpo} lineHeight={1.2} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// a) Carta con huecos y su portacartas

function CartaPortacartas({ op }) {
  const casillas = casillasHeridas(her(op));
  return (
    <div className="ctl-pieza ctl-carta-a" style={{ width: A_CARTA.w + "mm", height: A_CARTA.h + "mm" }}>
      <div className="ctl-zona-texto" style={{ left: A_TEXTO.x + "mm", top: A_TEXTO.y + "mm", width: A_TEXTO.w + "mm", height: A_TEXTO.h + "mm" }}>
        <Cabecera op={op} foto={15} />
        <Reglas op={op} cuerpo="1.95mm" />
      </div>
      {casillas.map((c) => (
        <span key={c.valor} className={"ctl-herida" + (c.herido ? " herido" : "")}
          style={{ left: c.x + "mm", top: c.y + "mm", width: A_HERIDA + "mm", height: A_HERIDA + "mm" }}>{c.valor}</span>
      ))}
      {pozos().map((p) => (
        <span key={p.cx} className="ctl-pozo"
          style={{ left: p.cx - A_POZO / 2 + "mm", top: p.cy - A_POZO / 2 + "mm", width: A_POZO + "mm", height: A_POZO + "mm" }}>
          {p.etiqueta}
        </span>
      ))}
    </div>
  );
}

// Las tres capas del portacartas, en SVG para que los huecos salgan exactos.
// Marco: contorno exterior y ventanas (todo lo discontinuo se recorta). Separador:
// U abierta por arriba, por donde entra la carta. Base: lisa.
function CapasPortacartas({ op }) {
  const { w, h } = A_PORTA;
  const m = A_MARGEN;
  const corte = { fill: "none", stroke: "#1A1A1A", strokeWidth: 0.3, strokeDasharray: "1.6 1" };
  const marco = (
    <svg className="ctl-pieza" width={w + "mm"} height={h + "mm"} viewBox={`0 0 ${w} ${h}`}>
      <rect width={w} height={h} rx="2" fill="#D9D3C7" />
      <rect x={m + A_TEXTO.x} y={m + A_TEXTO.y} width={A_TEXTO.w} height={A_TEXTO.h} rx="1.2" fill="#fff" {...corte} />
      {casillasHeridas(her(op)).map((c) => (
        <rect key={c.valor} x={m + c.x + 0.3} y={m + c.y + 0.3} width={A_HERIDA - 0.6} height={A_HERIDA - 0.6} fill="#fff" {...corte} />
      ))}
      {pozos().map((p) => (
        <circle key={p.cx} cx={m + p.cx} cy={m + p.cy} r={A_POZO / 2 + 0.3} fill="#fff" {...corte} />
      ))}
      <rect width={w} height={h} rx="2" {...corte} />
      <text x={w / 2} y={h - 1.2} className="ctl-capa-rotulo" fill="#E8642C">{op.nombre} · marco</text>
    </svg>
  );
  const separador = (
    <svg className="ctl-pieza" width={w + "mm"} height={h + "mm"} viewBox={`0 0 ${w} ${h}`}>
      <path d={`M0,0 H${m} V${h - m} H${w - m} V0 H${w} V${h} H0 Z`} fill="#c9c3b6" />
      <path d={`M0,0 H${m} V${h - m} H${w - m} V0 H${w} V${h} H0 Z`} {...corte} />
      <text x={w / 2} y={h / 2} className="ctl-capa-rotulo" fill="#888">separador · la carta entra por arriba</text>
    </svg>
  );
  const base = (
    <svg className="ctl-pieza" width={w + "mm"} height={h + "mm"} viewBox={`0 0 ${w} ${h}`}>
      <rect width={w} height={h} rx="2" fill="#e8e4dc" {...corte} />
      <text x={w / 2} y={h / 2} className="ctl-capa-rotulo" fill="#888">base · {op.nombre}</text>
    </svg>
  );
  return <>{marco}{separador}{base}</>;
}

// Fichas redondas que caben en los pozos de la carta (a), y marcadores pequeños
// para la casilla de heridas en la que está el agente.
function FichaPozo({ texto, oscura }) {
  return (
    <span className={"ctl-pieza ctl-ficha-pozo" + (oscura ? " oscura" : "")} style={{ width: A_POZO - 0.8 + "mm", height: A_POZO - 0.8 + "mm" }}>
      {texto}
    </span>
  );
}

// ---------------------------------------------------------------------------
// b) Carta de póquer con pista de heridas en el borde

function CartaPoker({ op }) {
  const n = her(op);
  const alto = Math.min(4.2, (B_CARTA.h - 6) / Math.max(n, 1));
  return (
    <div className="ctl-pieza ctl-carta-b" style={{ width: B_CARTA.w + "mm", height: B_CARTA.h + "mm" }}>
      <div className="ctl-zona-texto" style={{ left: "1.5mm", top: "1.5mm", width: B_CARTA.w - B_PISTA - 3 + "mm", height: B_CARTA.h - 3 + "mm" }}>
        <Cabecera op={op} foto={11} />
        <Reglas op={op} cuerpo="1.75mm" />
      </div>
      <div className="ctl-pista" style={{ width: B_PISTA + "mm" }}>
        {Array.from({ length: n }, (_, i) => (
          <span key={i} className={"ctl-pista-casilla" + (n - i - 1 < n / 2 ? " herido" : "")}
            style={{ height: alto + "mm" }}>{n - i}</span>
        ))}
      </div>
    </div>
  );
}

// Tira que se dobla por la mitad sobre la pinza: una cara por estado. La de
// atrás va girada 180° para que, doblada, se lea derecha.
function TiraEstado({ cara, dorso }) {
  return (
    <span className="ctl-pieza ctl-tira" style={{ width: B_FICHA.w + "mm", height: B_FICHA.h * 2 + "mm" }}>
      <span className="ctl-tira-cara">{cara}</span>
      <span className="ctl-tira-cara dorso">{dorso}</span>
    </span>
  );
}

function FichaRect({ ficha }) {
  const url = useAssetUrl(ficha.imagen);
  return (
    <span className="ctl-pieza ctl-tira" style={{ width: B_FICHA.w + "mm", height: B_FICHA.h * 2 + "mm" }}>
      <span className="ctl-tira-cara imagen">{url ? <img src={url} alt="" /> : ficha.texto}</span>
      <span className="ctl-tira-cara imagen dorso">{url ? <img src={url} alt="" /> : ficha.texto}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------

export default function TarjetasControl({ fichas, formatos, fichasMazo }) {
  // Las fichas de facción de la baraja (su bloque `fichas`), tantas como diga
  // cada una: del tamaño del pozo (a), con su silueta de siempre, o en tira
  // para pinza (b).
  const deMazo = fichasMazo?.lista?.length ? copiasDeFichas(fichasMazo) : [];
  return (
    <>
      {formatos.portacartas && (
        <section className="ctl-seccion">
          <h3>a) Carta y portacartas troquelado</h3>
          <p className="pie-fichas">
            Pega cada capa sobre cartón fino y recórtala por la línea discontinua (también las
            ventanas del marco). Monta base + separador + marco; la carta entra por arriba y sus
            huecos quedan bajo las ventanas: las fichas se quedan en su sitio al mover la tarjeta.
          </p>
          <div className="ctl-rejilla">
            {fichas.map((op) => (
              <div key={op.clave} className="ctl-grupo">
                <CartaPortacartas op={op} />
                <CapasPortacartas op={op} />
              </div>
            ))}
          </div>
          <div className="ctl-rejilla">
            {fichas.flatMap((op) => [
              <FichaPozo key={op.clave + "c"} texto="COMBATIR" />,
              <FichaPozo key={op.clave + "o"} texto="OCULTARSE" oscura />,
              <FichaPozo key={op.clave + "a"} texto="ACTIVADO" oscura />,
            ])}
            {deMazo.map((f) => <PiezaFicha key={f.clave} ficha={f} mm={A_POZO - 0.8} corte />)}
            {fichas.map((op) => (
              <span key={op.clave + "v"} className="ctl-pieza ctl-marcador-vida" />
            ))}
          </div>
        </section>
      )}
      {formatos.poker && (
        <section className="ctl-seccion">
          <h3>b) Carta de póquer y fichas para pinza</h3>
          <p className="pie-fichas">
            Marca las heridas con una pinza en la pista del borde. Dobla cada tira por la línea
            de puntos sobre una pinza pequeña y pégala: orden y activación se cambian dándole la
            vuelta a la pinza.
          </p>
          <div className="ctl-rejilla">
            {fichas.map((op) => <CartaPoker key={op.clave} op={op} />)}
          </div>
          <div className="ctl-rejilla">
            {fichas.flatMap((op) => [
              <TiraEstado key={op.clave + "o"} cara="COMBATIR" dorso="OCULTARSE" />,
              <TiraEstado key={op.clave + "a"} cara="LISTO" dorso="ACTIVADO" />,
            ])}
            {deMazo.map((f) => <FichaRect key={f.clave} ficha={f} />)}
          </div>
        </section>
      )}
    </>
  );
}
