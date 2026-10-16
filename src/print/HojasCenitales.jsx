// Plancha de fichas cenitales: un disco por agente, del tamaño de su peana, con
// la foto de su ficha de datos encuadrada y su nombre en un banner; y debajo, la
// hoja de control de escuadra con esos mismos nombres, para apuntar heridas y
// estado durante la partida. Sirven para jugar sobre la escenografía 2D de
// papel (ver ../app-write/CLAUDE.md, «Escenografía 2D recortable»).
//
// Qué agentes entran, cuántos y cómo se llaman lo decide
// viewer/DialogoFichasCenitales.jsx; aquí solo se pinta la plancha resuelta.
// Igual que HojasMiniaturas, App.jsx la monta EN LUGAR de las hojas de cartas,
// así que imprimir esto no imprime la baraja.
//
// Todo va en un solo flujo, sin saltos de página forzados: si los discos y la
// hoja de control caben en un folio, sale un folio. El navegador corta donde
// haga falta, y `break-inside: avoid` (ver estilos.js) impide que parta un disco
// o una fila de la tabla, que no se podrían recortar ni leer.

import { useId } from "react";
import { useAssetUrl } from "../assets.js";

const PEANA_MM = 32;
// La escala de las láminas de escenografía de 15 mm: el tablero de 22" en el
// largo de un A4. Tiene que casar con ESCALAS de
// app-write/scripts/generar-escenografia.mjs, o las fichas no cuadrarían con las
// piezas impresas.
const ESCALA_15MM = 297 / (22 * 25.4);
export const TAMANOS_CENITALES = {
  "28mm": { etiqueta: "28 mm · peana de 32 mm", mm: PEANA_MM },
  "15mm": { etiqueta: "15 mm · peana de 17 mm", mm: +(PEANA_MM * ESCALA_15MM).toFixed(1) },
};

const HUECO_MM = 2.5; // entre discos, con la línea de corte por fuera

export default function HojasCenitales({ plancha, nombreMazo }) {
  if (!plancha || !plancha.fichas.length) return null;
  const medida = TAMANOS_CENITALES[plancha.tamano] || TAMANOS_CENITALES["28mm"];

  return (
    <div className="hoja-impresion hoja-cenitales">
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
      <ControlEscuadra fichas={plancha.fichas} nombreMazo={nombreMazo} />
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

function FichaCenital({ ficha, mm }) {
  const iniciales = ficha.nombre.split(/\s+/).slice(0, 2).map((p) => p[0]).join("");
  return (
    <div className="ficha-cenital" style={{ width: mm + "mm", height: mm + "mm", fontSize: mm * 0.12 + "mm" }}>
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

// Una fila por agente. Las heridas son casillas que se tachan de izquierda a
// derecha; las sombreadas son las que, tachadas, lo dejan por debajo de la
// mitad de sus heridas iniciales: herido.
function ControlEscuadra({ fichas, nombreMazo }) {
  const casilla = <span className="control-casilla" />;
  return (
    <div className="control-escuadra">
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
            const her = parseInt(f.stats.her, 10) || 0;
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
                  <div className="control-heridas">
                    {Array.from({ length: her }, (_, i) => (
                      <span key={i} className={"control-herida" + (her - i - 1 < her / 2 ? " herido" : "")}>
                        {her - i}
                      </span>
                    ))}
                  </div>
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
