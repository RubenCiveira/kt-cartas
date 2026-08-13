// Una hoja de resumen: vertical, como una página de manual. Se pinta siempre al
// tamaño de diseño y quien la muestre la escala en bloque, igual que hace
// CartaFace con la carta.
//
// La medida no es A5 exacta (148 × 210 mm) sino 140 × 198: dos hojas en fila
// tienen que caber en el A4 *apaisado* que se usa para imprimirlas, descontando
// los 6 mm de margen de @page. Recortadas caben en una funda o archivador A5.

import { ARQUETIPOS, COLOR_ACCION } from "../data/tipos.js";
import { conMarcas, LineasTexto } from "../cards/texto.jsx";

export const HOJA_ANCHO = 140;
export const HOJA_ALTO = 198;

const TINTA = "#14181F";
const ACENTO_DEF = ARQUETIPOS[0].color;

// Una hoja con `compacto: true` encoge cuerpo, interlínea, cintillos y márgenes
// entre bloques. Gana en torno a un 20% de alto, que es lo que suele faltar
// para que quepa un bloque más. Es lo mismo que hace `compacto` en una carta,
// salvo que allí es un array de secciones y aquí no hay secciones que elegir.
const NORMAL = { fuente: 2.9, interlinea: 1.3, titulo: 3.1, hueco: 2.4, pad: "3mm 4mm 1mm" };
const COMPACTO = { fuente: 2.5, interlinea: 1.2, titulo: 2.8, hueco: 1.7, pad: "2.3mm 3.3mm 0.8mm" };

export default function HojaA5({ hoja, acento = ACENTO_DEF }) {
  const bloques = Array.isArray(hoja.bloques) ? hoja.bloques : [];
  const dosColumnas = hoja.columnas === 2;
  const m = hoja.compacto ? COMPACTO : NORMAL;

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
          padding: m.pad,
          ...(dosColumnas ? { columnCount: 2, columnGap: "5mm" } : {}),
        }}
      >
        {bloques.map((b) => (
          <div
            key={b.id}
            style={{
              breakInside: "avoid",
              marginBottom: m.hueco + "mm",
              ...(b.ancho && dosColumnas ? { columnSpan: "all" } : {}),
            }}
          >
            {b.coste ? <BloqueAccion bloque={b} m={m} /> : <BloqueTexto bloque={b} acento={acento} m={m} />}
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

// Bloque normal: un cintillo con el título y el texto debajo.
function BloqueTexto({ bloque, acento, m }) {
  return (
    <>
      {bloque.titulo && (
        <div
          style={{
            background: acento,
            color: "#F5F0E4",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: m.titulo + "mm",
            lineHeight: 1.35,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "0.5mm 1.6mm",
            borderRadius: "0.8mm",
            marginBottom: "1.2mm",
          }}
        >
          {bloque.titulo}
        </div>
      )}
      <LineasTexto texto={bloque.texto} color={acento} fontSize={m.fuente + "mm"} lineHeight={m.interlinea} />
    </>
  );
}

// Bloque con `coste`: se pinta como el recuadro de acción de una carta, con el
// título como nombre de la acción. Es deliberadamente el mismo dibujo que
// CartaFace, para que una acción se reconozca igual en la carta y en la hoja.
function BloqueAccion({ bloque, m }) {
  return (
    <div
      style={{
        border: `0.4mm solid ${COLOR_ACCION}`,
        borderRadius: "1mm",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: COLOR_ACCION,
          color: "#F5F0E4",
          display: "flex",
          justifyContent: "space-between",
          gap: "2mm",
          padding: "0.8mm 1.6mm 0.6mm",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: m.titulo + "mm",
          lineHeight: 1.2,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <span>{bloque.titulo}</span>
        <span style={{ flex: "0 0 auto" }}>{bloque.coste}</span>
      </div>
      <div style={{ padding: "1.2mm 1.6mm 0.4mm" }}>
        <LineasTexto texto={bloque.texto} color={COLOR_ACCION} fontSize={m.fuente + "mm"} lineHeight={m.interlinea} />
      </div>
    </div>
  );
}
