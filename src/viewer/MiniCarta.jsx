// Miniatura de la rejilla. La carta se pinta a tamaño real (70 × 121 mm, o
// apaisada en las fichas) y se encoge en bloque, igual que en las hojas de
// impresión: así la miniatura y lo impreso son literalmente lo mismo.

import CartaFace from "../cards/CartaFace.jsx";

export default function MiniCarta({ carta, seleccionada, activa, onAbrir, onAlternar }) {
  const apaisada = carta.tipo === "datacard";
  return (
    <div
      data-id={carta.id}
      className={
        "mini" + (apaisada ? " apaisada" : "") + (seleccionada ? " marcada" : "") + (activa ? " abierta" : "")
      }
    >
      <button
        className="mini-abrir"
        onClick={() => onAbrir(carta.id)}
        aria-label={"Ver " + (carta.titulo || "carta")}
        // Solo la carta que se está abriendo (o cerrando) lleva el nombre de
        // transición: es lo que hace que crezca hasta el detalle en vez de
        // aparecer un modal encima.
        style={{ viewTransitionName: activa ? "carta" : undefined }}
      >
        <div className="mini-lienzo">
          <CartaFace carta={carta} />
        </div>
      </button>
      <button
        className="mini-marca"
        onClick={() => onAlternar(carta.id)}
        aria-pressed={seleccionada}
        title={seleccionada ? "Quitar de la impresión" : "Añadir a la impresión"}
      >
        {seleccionada ? "✓" : ""}
      </button>
    </div>
  );
}
