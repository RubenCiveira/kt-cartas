// Una hoja de resumen: vertical, como una página de manual. Se pinta siempre al
// tamaño de diseño y quien la muestre la escala en bloque, igual que hace
// CartaFace con la carta.
//
// La medida no es A5 exacta (148 × 210 mm) sino 140 × 198: dos hojas en fila
// tienen que caber en el A4 *apaisado* que se usa para imprimirlas, descontando
// los 6 mm de margen de @page. Recortadas caben en una funda o archivador A5.

import { ARQUETIPOS } from "../data/tipos.js";
import { conMarcas, LineasTexto } from "../cards/texto.jsx";

export const HOJA_ANCHO = 140;
export const HOJA_ALTO = 198;

const TINTA = "#14181F";
const ACENTO_DEF = ARQUETIPOS[0].color;

export default function HojaA5({ hoja, acento = ACENTO_DEF }) {
  const bloques = Array.isArray(hoja.bloques) ? hoja.bloques : [];
  const dosColumnas = hoja.columnas === 2;

  return (
    <div
      style={{
        width: HOJA_ANCHO + "mm",
        height: HOJA_ALTO + "mm",
        background: "#FFFFFF",
        color: "#1B1F26",
        border: `0.5mm solid ${acento}`,
        borderRadius: "2mm",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Barlow', sans-serif",
        boxSizing: "border-box",
        textAlign: "left",
      }}
    >
      <div
        style={{
          background: TINTA,
          color: "#F5F0E4",
          padding: "2.4mm 4mm 2mm",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "4mm",
        }}
      >
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "5mm",
            lineHeight: 1,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {hoja.titulo || "SIN TÍTULO"}
        </span>
        {hoja.subtitulo && (
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "3.2mm",
              lineHeight: 1,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#E0876B",
              flex: "0 0 auto",
            }}
          >
            {hoja.subtitulo}
          </span>
        )}
      </div>

      {/* El texto fluye por columnas y los bloques no se parten por la mitad:
          un bloque que no quepa pasa entero a la columna siguiente. */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          padding: "3mm 4mm 1mm",
          ...(dosColumnas ? { columnCount: 2, columnGap: "5mm" } : {}),
        }}
      >
        {bloques.map((b) => (
          <div
            key={b.id}
            style={{
              breakInside: "avoid",
              marginBottom: "2.4mm",
              ...(b.ancho && dosColumnas ? { columnSpan: "all" } : {}),
            }}
          >
            {b.titulo && (
              <div
                style={{
                  background: acento,
                  color: "#F5F0E4",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "3.1mm",
                  lineHeight: 1.35,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "0.5mm 1.6mm",
                  borderRadius: "0.8mm",
                  marginBottom: "1.2mm",
                }}
              >
                {b.titulo}
              </div>
            )}
            <LineasTexto texto={b.texto} color={acento} fontSize="2.9mm" lineHeight={1.3} />
          </div>
        ))}
      </div>

      {hoja.pie && (
        <div
          style={{
            padding: "0 4mm 2.2mm",
            fontSize: "2.4mm",
            fontStyle: "italic",
            lineHeight: 1.25,
            color: "#5A6270",
          }}
        >
          {conMarcas(hoja.pie)}
        </div>
      )}
    </div>
  );
}
