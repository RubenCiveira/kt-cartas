// Plancha de miniaturas de papel: la foto de un operativo recortada por su
// silueta, para plantar sobre la mesa en partidas de prueba sin las miniaturas
// pintadas. A color se recorta tal cual; en blanco y negro, para colorear a
// mano antes de jugar.
//
// Igual que HojaFichas, cada pieza se imprime a un tamaño fijo en mm, no a
// escala: aquí no hay diseño que encoger en bloque. Está siempre en el DOM
// pero oculta en pantalla (.hoja-impresion, ver estilos.js); @media print la
// revela y esconde el visor.
//
// El alto de la caja es el de la miniatura (`alto`, en cm, ver data/decks.js):
// así dos unidades de porte distinto no salen recortadas de la misma altura.
// El ancho no se declara; la caja se hace CUADRADA (mismo tamaño que el alto)
// y `object-fit: contain` encaja la foto dentro sin deformarla — de sobra para
// una figura de pie, más ancha que alta ninguna. Una miniatura realmente
// ancha (un vehículo, una peana grande) necesitaría una caja propia; no es el
// caso que cubre esta plancha.
//
// Qué unidad entra y con qué imagen lo decide viewer/DialogoImprimirMiniaturas
// antes de llamar a imprimir; aquí solo se pinta la lista ya resuelta.

import { useAssetUrl } from "../assets.js";
import { ALTO_MINIATURA_CM_DEFECTO } from "../data/decks.js";

export default function HojasMiniaturas({ piezas, nombreMazo }) {
  if (!piezas || !piezas.length) return null;

  return (
    <div className="hoja-impresion hoja-miniaturas-hoja">
      <div className="hoja hoja-miniaturas">
        <div className="etiqueta-hoja">
          {nombreMazo} · miniaturas de papel · recorta por la silueta
        </div>
        <div className="rejilla-fichas">
          {piezas.map((p) => (
            <PiezaMiniatura key={p.clave} pieza={p} />
          ))}
        </div>
        <p className="pie-fichas">
          Recorta por el contorno de la figura. Para que se sostenga en pie, pega la hoja sobre
          cartulina o cartón fino antes de recortar y dobla una pestaña en la base.
        </p>
      </div>
    </div>
  );
}

function PiezaMiniatura({ pieza }) {
  const url = useAssetUrl(pieza.imagen);
  const altoMm = (Number(pieza.alto) > 0 ? Number(pieza.alto) : ALTO_MINIATURA_CM_DEFECTO) * 10;
  return (
    <div className="miniatura-corte" style={{ width: altoMm + "mm", height: altoMm + "mm" }}>
      {url && <img src={url} alt={pieza.nombre} />}
    </div>
  );
}
