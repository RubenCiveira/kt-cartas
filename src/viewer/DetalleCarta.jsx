// Vista completa de una carta. La carta mide siempre lo mismo (es el diseño de
// impresión), así que aquí solo calculamos cuánto hay que encogerla para que
// quepa en la pantalla, y dejamos el mismo margen en móvil y en escritorio.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import CartaFace from "../cards/CartaFace.jsx";
import CartaDorso from "../cards/CartaDorso.jsx";
import { etiquetaTipo } from "../data/tipos.js";
import { HAY_VOZ } from "./narracion.js";

const PX_MM = 96 / 25.4;
const MARGEN = 24;

// Mide el hueco real en el que va la carta en vez de deducirlo del tamaño de la
// ventana: así se ajusta sola cuando el índice abierto le come 290px por la
// izquierda, sin tener que saber nada del índice.
function useEscalaAjuste(ref, anchoMm, altoMm) {
  const [escala, setEscala] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const recalcular = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      setEscala(
        Math.min(
          (width - MARGEN) / (anchoMm * PX_MM),
          (height - MARGEN) / (altoMm * PX_MM),
          1.6
        )
      );
    };
    recalcular();
    const observador = new ResizeObserver(recalcular);
    observador.observe(el);
    return () => observador.disconnect();
  }, [ref, anchoMm, altoMm]);
  return escala;
}

export default function DetalleCarta({
  carta,
  conIndice,
  nombreMazo,
  icono,
  seleccionada,
  onAlternar,
  onAMazo,
  onCerrar,
  onAnterior,
  onSiguiente,
  narrando,
  onNarrar,
}) {
  const [cara, setCara] = useState("anverso");
  const lienzo = useRef(null);
  const apaisada = carta.tipo === "datacard";
  const escala = useEscalaAjuste(lienzo, apaisada ? 121 : 70, apaisada ? 70 : 121);

  // Cada carta se abre por su anverso, aunque vinieras mirando un dorso
  useEffect(() => setCara("anverso"), [carta.id]);

  useEffect(() => {
    const tecla = (e) => {
      if (e.key === "Escape") onCerrar();
      else if (e.key === "ArrowLeft") onAnterior();
      else if (e.key === "ArrowRight") onSiguiente();
      else if (e.key === " ") {
        e.preventDefault();
        setCara((c) => (c === "anverso" ? "dorso" : "anverso"));
      } else if (e.key === "n" || e.key === "N") onNarrar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar, onAnterior, onSiguiente, onNarrar]);

  return (
    <div className={"detalle" + (conIndice ? " con-indice" : "")} onClick={onCerrar}>
      <div className="detalle-barra" onClick={(e) => e.stopPropagation()}>
        <div className="detalle-titulo">
          <strong>{carta.titulo || "Sin título"}</strong>
          <span>{etiquetaTipo(carta.tipo)}</span>
        </div>
        <div className="detalle-acciones">
          <button
            className={"btn btn-mini" + (seleccionada ? " activa" : "")}
            onClick={() => onAlternar(carta.id)}
          >
            {seleccionada ? "✓ En la impresión" : "Añadir a la impresión"}
          </button>
          {/* Dos cosas distintas y por eso dos botones: la de arriba dice si
              esta carta entra en la tirada de SU baraja; esta la aparta en un
              mazo de impresión, que se imprime aparte y mezcla barajas. */}
          {onAMazo && (
            <button
              className="btn btn-mini"
              onClick={() => onAMazo(carta.id)}
              title="Guardar esta carta en un mazo de impresión para reimprimirla luego"
            >
              A imprimir…
            </button>
          )}
          {HAY_VOZ && (
            <button
              className={"btn btn-mini" + (narrando ? " activa" : "")}
              onClick={onNarrar}
              aria-pressed={narrando}
              title="Leer en voz alta esta carta y las siguientes (N)"
            >
              {narrando ? "■ Parar" : "▶ Narrar"}
            </button>
          )}
          <button
            className={"btn btn-mini" + (cara === "anverso" ? " activa" : "")}
            onClick={() => setCara(cara === "anverso" ? "dorso" : "anverso")}
          >
            {cara === "anverso" ? "Ver dorso" : "Ver anverso"}
          </button>
          <button className="btn btn-mini" onClick={onCerrar}>Cerrar</button>
        </div>
      </div>

      <button className="detalle-nav izq" onClick={(e) => { e.stopPropagation(); onAnterior(); }} aria-label="Carta anterior">‹</button>

      {/* El hueco alrededor de la carta es velo, no carta: quien detiene el
          clic es la carta misma, no su contenedor. Si lo parase el contenedor,
          media pantalla oscura dejaría de cerrar al pulsarla. */}
      <div className="detalle-lienzo" ref={lienzo}>
        <div
          className="detalle-carta"
          onClick={(e) => e.stopPropagation()}
          style={{
            transform: `scale(${escala})`,
            width: (apaisada ? 121 : 70) + "mm",
            height: (apaisada ? 70 : 121) + "mm",
            viewTransitionName: "carta",
          }}
        >
          {cara === "anverso" ? (
            <CartaFace carta={carta} />
          ) : (
            <CartaDorso carta={carta} nombreMazo={nombreMazo} icono={icono} />
          )}
        </div>
      </div>

      <button className="detalle-nav der" onClick={(e) => { e.stopPropagation(); onSiguiente(); }} aria-label="Carta siguiente">›</button>
    </div>
  );
}
