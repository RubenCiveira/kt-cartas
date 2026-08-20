// El inventario de fichas de la baraja, dentro de una carta.
//
// La hoja recortable (`print/HojaFichas.jsx`) enseña las piezas a tamaño real y
// repetidas tantas veces como copias hagan falta; esto es lo contrario: una
// entrada por pieza distinta, con su cantidad al lado, para saber **qué** trae
// la baraja sin tener que ir al diálogo de imprimir. Las mismas imágenes, otro
// propósito.

import { PiezaFicha } from "../print/HojaFichas.jsx";

// Una carta mide 70 mm de ancho y le quedan unos 65 mm útiles. Cuantas más
// piezas distintas, más pequeñas: con seis caben tres por fila y se reconocen a
// simple vista; con cuarenta —los números de agente del mazo universal— solo
// caben si se renuncia a la etiqueta, que ahí sobra porque el dibujo es el
// propio número.
function medidas(n) {
  if (n <= 9) return { pieza: 15, columna: "1fr 1fr 1fr", etiqueta: true };
  if (n <= 20) return { pieza: 11, columna: "1fr 1fr 1fr 1fr", etiqueta: true };
  return { pieza: 8, columna: "repeat(6, 1fr)", etiqueta: false };
}

export default function GuiaFichas({ fichas }) {
  if (!Array.isArray(fichas) || !fichas.length) return null;
  const m = medidas(fichas.length);
  // Las piezas no miden todas lo mismo —hay marcadores de 25 mm entre fichas de
  // 20—, y esa diferencia es parte de lo que se viene a mirar. Se conserva la
  // proporción respecto a la más pequeña, con un tope para que la mayor no se
  // salga de su columna.
  const base = Math.min(...fichas.map((f) => f.mm || m.pieza));
  const tam = (f) => Math.min((m.pieza * (f.mm || base)) / base, m.pieza * 1.3);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: m.columna,
        gap: m.etiqueta ? "1.6mm 1.2mm" : "1mm",
        margin: "1mm 0 0",
        justifyItems: "center",
      }}
    >
      {fichas.map((f) => (
        <div key={f.id} style={{ textAlign: "center", minWidth: 0, width: "100%" }}>
          <PiezaFicha ficha={f} mm={tam(f)} />
          {f.cantidad > 1 && (
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "2.2mm",
                lineHeight: 1,
                color: "#14181F",
              }}
            >
              ×{f.cantidad}
            </div>
          )}
          {m.etiqueta && (
            <div
              style={{
                fontSize: "2mm",
                lineHeight: 1.15,
                marginTop: "0.4mm",
                color: "#3A4250",
                overflow: "hidden",
                overflowWrap: "anywhere",
              }}
            >
              {f.nombre}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
