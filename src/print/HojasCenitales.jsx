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
      <span className="ficha-cenital-nombre">{ficha.nombre}</span>
    </div>
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
