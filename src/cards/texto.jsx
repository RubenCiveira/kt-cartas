// Primitivos de texto de las cartas: párrafos, viñetas, encabezados, imágenes
// embebidas y tablas escritas con "|" al inicio de línea.

import { useAssetUrl } from "../assets.js";
// Tabla en texto: líneas consecutivas que empiezan por "|" (celdas separadas por
// "|"); la primera fila es la cabecera y la primera columna, encabezado de fila
export function TablaTexto({ filas, color, fontSize }) {
  const celdas = filas.map((f) => f.replace(/^\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim()));
  const nCols = Math.max(...celdas.map((f) => f.length));
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `1.3fr repeat(${nCols - 1}, 1fr)`,
        margin: "0.8mm 0 1.2mm",
        border: `0.3mm solid ${color}`,
        borderRadius: "0.8mm",
        overflow: "hidden",
      }}
    >
      {celdas.flatMap((fila, fi) => {
        const completa = [...fila, ...Array(nCols - fila.length).fill("")];
        return completa.map((celda, ci) => (
          <span
            key={fi + "-" + ci}
            style={{
              padding: "0.5mm 0.7mm",
              textAlign: ci === 0 ? "left" : "center",
              fontWeight: fi === 0 || ci === 0 ? 700 : 400,
              background: fi === 0 ? color : ci === 0 ? "#F1F1F1" : "transparent",
              color: fi === 0 ? "#F5F0E4" : undefined,
              fontFamily: fi === 0 ? "'Barlow Condensed', sans-serif" : undefined,
              letterSpacing: fi === 0 ? "0.05em" : undefined,
              borderTop: fi > 0 ? "0.15mm solid #C9C4C4" : "none",
              fontSize,
              lineHeight: 1.25,
            }}
          >
            {celda}
          </span>
        ));
      })}
    </div>
  );
}

export function LineasTexto({ texto, color, fontSize = "2.8mm", lineHeight = 1.3 }) {
  const todas = (texto || "").split("\n").filter((l) => l.trim() !== "");
  // agrupar líneas de tabla consecutivas en bloques
  const bloques = [];
  for (const l of todas) {
    const ult = bloques[bloques.length - 1];
    if (l.trimStart().startsWith("|")) {
      if (ult && ult.tabla) ult.filas.push(l.trim());
      else bloques.push({ tabla: true, filas: [l.trim()] });
    } else {
      bloques.push({ tabla: false, texto: l });
    }
  }
  if (bloques.some((b) => b.tabla)) {
    return bloques.map((b, i) =>
      b.tabla ? (
        <TablaTexto key={i} filas={b.filas} color={color} fontSize={fontSize} />
      ) : (
        <LineasTexto key={i} texto={b.texto} color={color} fontSize={fontSize} lineHeight={lineHeight} />
      )
    );
  }
  const lineas = todas;
  const altoGlifo = (parseFloat(fontSize) * lineHeight).toFixed(2) + "mm";
  return lineas.map((l, i) => {
    // Salto de columna manual: una línea con solo [columna] fuerza que lo que
    // sigue (más texto o las acciones) pase a la siguiente columna. Solo tiene
    // efecto en las fichas de datos, que fluyen a dos columnas.
    if (l.trim() === "[columna]") {
      return <div key={i} aria-hidden="true" style={{ breakBefore: "column", WebkitColumnBreakBefore: "always", height: 0, margin: 0 }} />;
    }
    if (l.startsWith("# ")) {
      return (
        <p
          key={i}
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontStyle: "normal",
            fontWeight: 700,
            fontSize: (parseFloat(fontSize) + 0.3).toFixed(2) + "mm",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color,
            lineHeight: 1.2,
            margin: i === 0 ? "0 0 1mm" : "1.8mm 0 1mm",
          }}
        >
          {l.slice(2)}
        </p>
      );
    }
    const mImagen = l.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (mImagen) {
      return <ImagenTexto key={i} fileId={mImagen[2].trim()} alt={mImagen[1]} />;
    }
    const conFlecha = l.startsWith("- ");
    const conPunto = l.startsWith("> ");
    if (conFlecha || conPunto) {
      return (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "1.2mm", margin: "0 0 1mm" }}>
          <span style={{ flex: "0 0 auto", color, fontSize: conPunto ? "3.45mm" : "2.3mm", lineHeight: altoGlifo }}>
            {conPunto ? "◆" : "▶"}
          </span>
          <span style={{ flex: 1, fontSize, lineHeight }}>{l.slice(2)}</span>
        </div>
      );
    }
    return (
      <p key={i} style={{ fontSize, lineHeight, margin: "0 0 1.2mm" }}>
        {l}
      </p>
    );
  });
}

function ImagenTexto({ fileId, alt }) {
  const url = useAssetUrl(fileId);
  if (!url) return null; // ruta no encontrada: no romper el render
  return (
    <img
      src={url}
      alt={alt}
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        objectFit: "contain",
        margin: "0.8mm auto 1.6mm",
      }}
    />
  );
}
