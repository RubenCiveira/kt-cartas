// Plancha de fichas cenitales: un disco por agente, del tamaño de su peana, con
// la foto de su ficha de datos encuadrada y su nombre en un banner; los tokens
// de escuadra (el bloque `fichas` de la baraja) a la misma escala; y la hoja de
// control de escuadra con esos mismos nombres, para llevar heridas y estado
// durante la partida. Sirven para jugar sobre la escenografía 2D de papel (ver
// ../app-write/CLAUDE.md, «Escenografía 2D recortable»).
//
// La hoja de control permite escribir, colocar tokens en un anillo alrededor
// del icono de cada agente, adjuntar sus datos al anillo o imprimir cartas de
// póquer para pinzas.
//
// Qué agentes entran, cuántos, cómo se llaman y qué partes se imprimen lo decide
// viewer/DialogoFichasCenitales.jsx; aquí solo se pinta la plancha resuelta.
// Igual que HojasMiniaturas, App.jsx la monta EN LUGAR de las hojas de cartas,
// así que imprimir esto no imprime la baraja.
//
// Todo va en un solo flujo, sin saltos de página forzados: si los discos y la
// hoja de control caben en un folio, sale un folio. El navegador corta donde
// haga falta, y `break-inside: avoid` (ver estilos.js) impide que parta un disco
// o una fila de la tabla, que no se podrían recortar ni leer.

import { Fragment, useId } from "react";
import { useAssetUrl } from "../assets.js";
import { AtributosFicha, RecuadroAccion, TablaArmas } from "../cards/CartaFace.jsx";
import { conMarcas, LineasTexto } from "../cards/texto.jsx";
import { ARQUETIPOS } from "../data/tipos.js";
import { PiezaFicha, SANGRE_MM, copiasDeFichas } from "./HojaFichas.jsx";
import TarjetasControl from "./TarjetasControl.jsx";

const PEANA_MM = 32;
// La escala de las láminas de escenografía de 15 mm: el tablero de 22" en el
// largo de un A4. Tiene que casar con ESCALAS de
// app-write/scripts/generar-escenografia.mjs, o las fichas no cuadrarían con las
// piezas impresas.
const ESCALA_15MM = 297 / (22 * 25.4);
// `factor` es lo que se encogen los tokens de escuadra: al 100 % en 28 mm, que
// es el tamaño que declara la baraja, y a la escala de las láminas en 15 mm.
export const TAMANOS_CENITALES = {
  "28mm": { etiqueta: "28 mm · peana de 32 mm", mm: PEANA_MM, factor: 1 },
  "15mm": { etiqueta: "15 mm · peana de 17 mm", mm: +(PEANA_MM * ESCALA_15MM).toFixed(1), factor: ESCALA_15MM },
};

export const ESTILOS_CONTROL = {
  escribir: "Para escribir",
  tablero: "Iconos de agente y anillo para tokens",
  tarjeta: "Icono, anillo y ficha",
  carta: "Cartas de póquer para pinzas",
};

const HUECO_MM = 2.5; // entre discos, con la línea de corte por fuera
const TOKEN_MM_DEFECTO = 20; // si la baraja no declara fichas, el de las oficiales

// `tokens` es el bloque `fichas` de la baraja, o null si no trae. La plancha
// dice qué partes salen: `agentes` (los discos), `tokens` y `control`, con su
// `estiloControl`: escribir, tablero, tarjeta (tablero con ficha) o carta
// (póquer para pinzas, print/TarjetasControl.jsx). Las partes van en un solo
// flujo, en ese orden.
export default function HojasCenitales({ plancha, nombreMazo, tokens }) {
  if (!plancha || !plancha.fichas.length) return null;
  const medida = TAMANOS_CENITALES[plancha.tamano] || TAMANOS_CENITALES["28mm"];
  const conTokens = plancha.tokens && tokens && tokens.lista && tokens.lista.length > 0;
  const tokenMm = ((tokens && tokens.mm) || TOKEN_MM_DEFECTO) * medida.factor;

  return (
    <div className="hoja-impresion hoja-cenitales">
      {plancha.agentes && (
        <div className="hoja-fichas">
          <div className="etiqueta-hoja">
            {nombreMazo} · fichas cenitales {medida.etiqueta} · imprimir al 100 %
          </div>
          <div className="rejilla-fichas" style={{ gap: HUECO_MM + "mm" }}>
            {plancha.fichas.map((f) => (
              <FichaCenital key={f.clave} ficha={f} mm={medida.mm} />
            ))}
          </div>
          <p className="pie-fichas">
            Recorta por la línea. Pegadas sobre cartón fino o sobre una peana del mismo diámetro se
            manejan mejor sobre la mesa.
          </p>
        </div>
      )}
      {conTokens && <TokensEscuadra tokens={tokens} medida={medida} nombreMazo={nombreMazo} />}
      {plancha.control &&
        (plancha.estiloControl === "carta" ? (
          <TarjetasControl fichas={plancha.fichas} formatos={{ poker: true }} fichasMazo={tokens} />
        ) : plancha.estiloControl === "tablero" || plancha.estiloControl === "tarjeta" ? (
          <ControlTablero fichas={plancha.fichas} nombreMazo={nombreMazo} tokenMm={tokenMm} conFicha={plancha.estiloControl === "tarjeta"} />
        ) : (
          <ControlEscuadra fichas={plancha.fichas} nombreMazo={nombreMazo} />
        ))}
    </div>
  );
}

// Las piezas del bloque `fichas` de la baraja, como en print/HojaFichas.jsx,
// pero encogidas a la escala elegida para que casen con los discos. El margen
// de corte no se encoge: es para la guillotina, no para la mesa.
function TokensEscuadra({ tokens, medida, nombreMazo }) {
  const porDefecto = tokens.mm || TOKEN_MM_DEFECTO;
  return (
    <div className="hoja-fichas">
      <div className="etiqueta-hoja">
        {nombreMazo} · tokens de escuadra ·{" "}
        {medida.factor === 1 ? "tamaño real" : `escala ${medida.etiqueta.split(" · ")[0]}`} · imprimir al 100 %
      </div>
      <div className="rejilla-fichas">
        {copiasDeFichas(tokens).map((f) => (
          <PiezaFicha key={f.clave} ficha={f} mm={(f.mm || porDefecto) * medida.factor + SANGRE_MM * 2} corte />
        ))}
      </div>
    </div>
  );
}

// La foto de la ficha de datos recortada en cuadrado con su encuadre
// (`fotoCentro`, en porcentajes de object-position). Va en el estilo y no se
// calcula al cargar: window.print() no espera a las imágenes.
export function FotoEncuadrada({ foto, centro }) {
  const url = useAssetUrl(foto);
  if (!url) return null;
  return <img src={url} alt="" style={{ objectPosition: centro ? `${centro.x}% ${centro.y}%` : "50% 50%" }} />;
}

function FichaCenital({ ficha, mm, clase = "" }) {
  const iniciales = ficha.nombre.split(/\s+/).slice(0, 2).map((p) => p[0]).join("");
  return (
    <div className={"ficha-cenital " + clase} style={{ width: mm + "mm", height: mm + "mm", fontSize: mm * 0.12 + "mm" }}>
      {ficha.foto ? <FotoEncuadrada foto={ficha.foto} centro={ficha.fotoCentro} /> : <span className="ficha-cenital-iniciales">{iniciales}</span>}
      <BannerCurvo nombre={ficha.nombre} />
    </div>
  );
}

// El banner del nombre sigue el borde del disco: una franja curva en la mitad
// de abajo y el texto sobre un arco (textPath), leyéndose de izquierda a
// derecha y derecho. Así el nombre aprovecha la circunferencia en vez de una
// cuerda recta que se come las esquinas. Va en un SVG de 100 × 100 unidades
// encima del disco, de modo que mide lo mismo en proporción a 15 y a 28 mm.
//
// Si el nombre no cabe en el arco se comprime (textLength) en vez de cortarse:
// un nombre a medias no sirve para reconocer al agente sobre la mesa.
const R_BANDA = 41;     // radio del centro de la franja
const ANCHO_BANDA = 16; // grosor: llega al borde y lo recorta el propio disco
const R_TEXTO = 44.5;   // radio de la línea base: las letras crecen hacia el centro
const CUERPO = 9;       // tamaño de letra, en unidades del SVG
const ARCO = [165, 15]; // grados de inicio y fin del texto (90 es abajo)
const ARCO_BANDA = [172, 8]; // la franja algo más larga que el texto, sin subir a los lados

const punto = (r, grados) => {
  const a = (grados * Math.PI) / 180;
  return `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`;
};
// Arco por abajo, de izquierda a derecha (barrido en sentido antihorario en
// pantalla, que con la y hacia abajo es sweep-flag 0).
const arco = (r, desde, hasta) => `M${punto(r, desde)} A${r},${r} 0 0 0 ${punto(r, hasta)}`;

function BannerCurvo({ nombre }) {
  const id = "arco-" + useId().replace(/:/g, "");
  const disponible = (R_TEXTO * (ARCO[0] - ARCO[1]) * Math.PI) / 180;
  // Ancho medio de una versal de Barlow Condensed en negrita: ~0,5 del cuerpo.
  const comprimir = nombre.length * CUERPO * 0.5 > disponible;
  return (
    <svg className="ficha-cenital-arco" viewBox="0 0 100 100" aria-hidden="true">
      <path d={arco(R_BANDA, ARCO_BANDA[0], ARCO_BANDA[1])} fill="none" stroke="rgba(20, 20, 20, 0.82)" strokeWidth={ANCHO_BANDA} />
      <path id={id} d={arco(R_TEXTO, ARCO[0], ARCO[1])} fill="none" />
      <text fontSize={CUERPO}>
        <textPath
          href={"#" + id}
          startOffset="50%"
          textAnchor="middle"
          {...(comprimir ? { textLength: disponible, lengthAdjust: "spacingAndGlyphs" } : {})}
        >
          {nombre}
        </textPath>
      </text>
    </svg>
  );
}

const casilla = <span className="control-casilla" />;

// La cabecera de las dos hojas de control: lo que es de la partida y no de un
// agente.
function CabeceraControl({ nombreMazo }) {
  return (
    <div className="control-cabecera">
      <div>
        <div className="control-titulo">Control de escuadra</div>
        <div className="control-mazo">{nombreMazo}</div>
      </div>
      <div className="control-partida">
        <span>Punto de inflexión {casilla}1 {casilla}2 {casilla}3 {casilla}4</span>
        <span>PM ______</span>
        <span>PV ______</span>
      </div>
    </div>
  );
}

// Las heridas son casillas que se tachan de izquierda a derecha; las sombreadas
// son las que, tachadas, lo dejan por debajo de la mitad de sus heridas
// iniciales: herido.
function Heridas({ stats }) {
  const her = parseInt(stats.her, 10) || 0;
  return (
    <div className="control-heridas">
      {Array.from({ length: her }, (_, i) => (
        <span key={i} className={"control-herida" + (her - i - 1 < her / 2 ? " herido" : "")}>
          {her - i}
        </span>
      ))}
    </div>
  );
}

// Hoja «para escribir»: una fila por agente, con orden y estado como casillas.
function ControlEscuadra({ fichas, nombreMazo }) {
  return (
    <div className="control-escuadra">
      <CabeceraControl nombreMazo={nombreMazo} />
      <table className="control-tabla">
        <thead>
          <tr>
            <th>Agente</th>
            <th>LPA</th>
            <th>MOV</th>
            <th>SALV</th>
            <th>Heridas</th>
            <th>Orden</th>
            <th>Estado</th>
            <th className="control-notas">Notas</th>
          </tr>
        </thead>
        <tbody>
          {fichas.map((f) => {
            return (
              <tr key={f.clave}>
                <td>
                  <div className="control-nombre">{f.nombre}</div>
                  <div className="control-tipo">{f.titulo}</div>
                </td>
                <td>{f.stats.apl}</td>
                <td>{f.stats.mov}</td>
                <td>{f.stats.salv}</td>
                <td>
                  <Heridas stats={f.stats} />
                </td>
                <td className="control-estado">
                  <span>{casilla} Combatir</span>
                  <span>{casilla} Ocultarse</span>
                </td>
                <td className="control-estado">
                  <span>{casilla} Activado</span>
                  <span>{casilla} Incapacitado</span>
                </td>
                <td className="control-notas" />
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="pie-fichas">
        Tacha una casilla por cada herida perdida, de izquierda a derecha. En las sombreadas el
        agente está herido (menos de la mitad de sus heridas).
      </p>
    </div>
  );
}

// Hoja «tablero»: por agente, su icono redondo —el mismo disco— dentro de un
// anillo donde se dejan los tokens de estado (orden, activado, herido…) en vez
// de tachar casillas. Los tokens de Kill Team no son redondos sino segmentos de
// corona (SEGMENTO en HojaFichas.jsx), hechos para rodear una peana, así que los
// huecos del anillo tienen esa misma forma, con el lado estrecho hacia el icono.
//
// La geometría sale de la silueta: sus lados convergen en un punto a 0,99 veces
// el tamaño del token por encima del canto estrecho, que es su radio natural, y
// el segmento tiene 0,82 de fondo y 0,84 de ancho por fuera. El anillo empieza
// en ese radio, o más afuera si el icono no llegaría a ICONO_MIN_MM, y el icono
// llena lo que queda dentro.
//
// Con `conFicha`, un agente por línea y su ficha de datos al lado, para llevarlo
// todo a mano en una sola hoja (ver LineaConFicha). Sin ella, los agentes en
// rejilla y los datos debajo del anillo.
const RADIO_SEGMENTO = 0.99;
const FONDO_SEGMENTO = 0.82;
const MEDIO_ANCHO_SEGMENTO = 0.42;
const ICONO_MIN_MM = 20;
const HOLGURA_MM = 1; // alrededor del token, dentro de su hueco
const SEPARACION_MM = 0.8; // entre el icono y el anillo
const SEPARACION_GRADOS = 2; // entre dos huecos
const MAX_HUECOS = 12;
const HUECO_FILA_MM = 3;

export function geometriaAnillo(tokenMm) {
  const rDentro = Math.max(RADIO_SEGMENTO * tokenMm, ICONO_MIN_MM / 2 + SEPARACION_MM);
  const rFuera = rDentro + FONDO_SEGMENTO * tokenMm + HOLGURA_MM * 2;
  // Medio ángulo del hueco: lo que pide el canto ancho del token, con holgura,
  // a la altura donde queda.
  const medio = Math.asin((MEDIO_ANCHO_SEGMENTO * tokenMm + HOLGURA_MM) / (rDentro + FONDO_SEGMENTO * tokenMm + HOLGURA_MM));
  const paso = 2 * medio + (SEPARACION_GRADOS * Math.PI) / 180;
  return {
    rDentro,
    rFuera,
    medio,
    huecos: Math.min(MAX_HUECOS, Math.floor((2 * Math.PI) / paso)),
    icono: 2 * (rDentro - SEPARACION_MM),
    lado: rFuera * 2 + 0.6, // el trazo del borde, que no se corte
  };
}

const f2 = (n) => +n.toFixed(2);

function Anillo({ ficha, g }) {
  const c = g.lado / 2;
  const p = (r, a) => `${f2(c + r * Math.cos(a))},${f2(c + r * Math.sin(a))}`;
  const rIn = g.rDentro + 0.4;
  const rOut = g.rFuera - 0.4;
  return (
    <div className="tablero-anillo" style={{ width: f2(g.lado) + "mm", height: f2(g.lado) + "mm" }}>
      <svg viewBox={`0 0 ${f2(g.lado)} ${f2(g.lado)}`} aria-hidden="true">
        <circle cx={c} cy={c} r={f2(g.rFuera)} fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="0.3" />
        {Array.from({ length: g.huecos }, (_, i) => {
          // El primero arriba, y en el sentido de las agujas del reloj.
          const a = (i / g.huecos) * 2 * Math.PI - Math.PI / 2;
          const a0 = a - g.medio;
          const a1 = a + g.medio;
          return (
            <path
              key={i}
              d={`M${p(rOut, a0)} A${f2(rOut)},${f2(rOut)} 0 0 1 ${p(rOut, a1)} L${p(rIn, a1)} A${f2(rIn)},${f2(rIn)} 0 0 0 ${p(rIn, a0)} Z`}
              fill="#EEEAE2"
              stroke="#888"
              strokeWidth="0.25"
              strokeDasharray="0.8 0.6"
              strokeLinejoin="round"
            />
          );
        })}
      </svg>
      <FichaCenital ficha={ficha} mm={f2(g.icono)} clase="ficha-cenital-icono" />
    </div>
  );
}

function ControlTablero({ fichas, nombreMazo, tokenMm, conFicha }) {
  const g = geometriaAnillo(tokenMm);

  return (
    <div className="control-escuadra">
      <CabeceraControl nombreMazo={nombreMazo} />
      <div className={conFicha ? "tablero-lineas" : "tablero-rejilla"}>
        {fichas.map((f) =>
          conFicha ? (
            <LineaConFicha key={f.clave} ficha={f} g={g} />
          ) : (
            <div key={f.clave} className="tablero-agente" style={{ width: f2(g.lado) + "mm" }}>
              <Anillo ficha={f} g={g} />
              <div className="tablero-datos">
                <div className="control-nombre">{f.nombre}</div>
                <div className="control-tipo">{f.titulo}</div>
                <div className="tablero-stats">
                  <span>LPA <b>{f.stats.apl}</b></span>
                  <span>MOV <b>{f.stats.mov}</b></span>
                  <span>SALV <b>{f.stats.salv}</b></span>
                </div>
                <Heridas stats={f.stats} />
              </div>
            </div>
          )
        )}
      </div>
      <p className="pie-fichas">
        Deja los tokens de estado de cada agente en los huecos de su anillo. Tacha una casilla por
        cada herida perdida; en las sombreadas el agente está herido.
      </p>
    </div>
  );
}

// Un agente con su ficha de datos, todo en un recuadro del color de su
// arquetipo: a la izquierda el anillo y las heridas; a la derecha los datos.
// No es la carta pegada: la barra de título no lleva foto (ya está en el
// icono) sino el nombre del agente, con el operativo debajo; y las armas y
// habilidades de todas sus cartas —la ficha y su continuación— van en una sola
// tabla y un solo cuerpo a dos columnas, sin recuadro propio y sin alto fijo,
// así que un operativo con muchas reglas alarga su línea en vez de partirse en
// dos fichas. Atributos, tabla de armas y acciones son las piezas de
// CartaFace, para que se lean igual que en la carta.
const ESC_CUERPO_FICHA = 0.85; // los de CartaFace para el cuerpo de una ficha
const ESC_ACCION_FICHA = 0.9;
const tamCuerpo = (base) => (parseFloat(base) * ESC_CUERPO_FICHA).toFixed(2) + "mm";
const tamAccion = (base) => (parseFloat(base) * ESC_CUERPO_FICHA * ESC_ACCION_FICHA).toFixed(2) + "mm";

function LineaConFicha({ ficha: f, g }) {
  const datos = f.datos || [];
  const arq = ARQUETIPOS.find((a) => a.id === datos[0]?.arquetipo) || ARQUETIPOS[0];
  // Los ids de armas y acciones son la posición dentro de su carta: al juntar
  // dos cartas se repetirían.
  const armas = datos.flatMap((c) => c.armas.map((a) => ({ ...a, id: c.id + "-" + a.id })));
  const acciones = datos.flatMap((c) => c.acciones.map((a) => ({ ...a, id: c.id + "-" + a.id })));

  return (
    <div className="tablero-linea" style={{ gap: HUECO_FILA_MM + "mm", borderColor: arq.color }}>
      <div className="tablero-agente" style={{ width: f2(g.lado) + "mm" }}>
        <Anillo ficha={f} g={g} />
        <Heridas stats={f.stats} />
      </div>
      <div className="tablero-ficha">
        <div className="tablero-ficha-cabecera">
          <div className="tablero-ficha-titulo">
            <div className="tablero-ficha-nombre">{f.nombre}</div>
            <div className="tablero-ficha-operativo">{f.titulo}</div>
          </div>
          <AtributosFicha stats={f.stats} />
        </div>
        {armas.length > 0 && <TablaArmas armas={armas} color={arq.color} />}
        <div className="tablero-ficha-cuerpo">
          {datos.map((c) => (
            <Fragment key={c.id}>
              {c.revelado && (
                <p
                  style={{
                    fontStyle: c.continuacion ? "normal" : "italic",
                    fontWeight: c.continuacion ? 700 : 400,
                    fontSize: tamCuerpo(c.continuacion ? "2.4mm" : "2.7mm"),
                    lineHeight: 1.25,
                    margin: "0 0 1.5mm",
                    color: "#3A4250",
                  }}
                >
                  {conMarcas(c.revelado)}
                </p>
              )}
              <LineasTexto texto={c.cuerpo} color={arq.color} fontSize={tamCuerpo("2.8mm")} lineHeight={1.3} />
            </Fragment>
          ))}
          {acciones.map((a) => (
            <RecuadroAccion key={a.id} accion={a} ficha tamano={tamAccion} lineHeight={1.3} />
          ))}
        </div>
      </div>
    </div>
  );
}
