// Índice: una barra lateral de texto con las cartas agrupadas por tipo. Es la
// vista de conjunto que la tira no puede dar, y sirve para saltar de una carta
// a otra sin tener que recorrer la baraja entera.
//
// Se queda abierto al elegir una carta: el detalle se abre por delante y, al
// cerrarlo, el índice sigue ahí para el siguiente salto. Los grupos son
// <details> nativos, así que colapsan y responden al teclado sin código extra.

import { useEffect } from "react";
import { TIPOS, etiquetaTipo } from "../data/tipos.js";

export default function Indice({ cartas, nombreMazo, actual, onIr, onCerrar }) {
  useEffect(() => {
    const tecla = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);

  const grupos = TIPOS.map((t) => ({
    id: t.id,
    cartas: cartas.filter((c) => c.tipo === t.id),
  })).filter((g) => g.cartas.length);

  return (
    <nav className="indice" aria-label="Índice de la baraja">
      <div className="indice-barra">
        <div className="indice-titulo">
          <strong>{nombreMazo}</strong>
          <span>{cartas.length} cartas</span>
        </div>
        <button className="btn btn-mini" onClick={onCerrar}>Cerrar</button>
      </div>

      <div className="indice-cuerpo">
        {grupos.map((g) => (
          <details key={g.id} open>
            <summary>
              {etiquetaTipo(g.id)} <em>{g.cartas.length}</em>
            </summary>
            <ul>
              {g.cartas.map((c) => (
                <li key={c.id}>
                  <button
                    className={c.id === actual ? "activa" : ""}
                    onClick={() => onIr(c.id)}
                  >
                    {c.titulo || "Sin título"}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </nav>
  );
}
