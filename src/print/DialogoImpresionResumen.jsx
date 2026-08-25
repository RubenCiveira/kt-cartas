// Diálogo de impresión de las barajas de resúmenes: el mismo popup que el del
// mazo (selección de qué entra + ayuda de ajustes del navegador), pero una hoja
// A5 no tiene tamaños que elegir, así que donde el mazo pone el formato aquí va
// la colocación para imprimir a doble cara.

import { useState } from "react";
import CalibracionImpresora from "./CalibracionImpresora.jsx";
import HojaA5, { HOJA_ALTO, HOJA_ANCHO } from "./HojaA5.jsx";
import { paginar } from "./HojasResumen.jsx";

export default function DialogoImpresionResumen({
  dobleCara,
  onDobleCara,
  impresoras,
  impresoraId,
  onImpresora,
  onImpresoras,
  hojas,
  estaSeleccionada,
  onAlternar,
  onTodas,
  onNinguna,
  onInvertir,
  onCerrar,
  onImprimir,
}) {
  const [ayuda, setAyuda] = useState(false);
  const [vista, setVista] = useState("titulo");
  const seleccionadas = hojas.filter((h) => estaSeleccionada(h.id));
  // El recuento sale de la misma función que maqueta, no de una división: a
  // doble cara las páginas no son las hojas entre dos.
  const paginas = paginar(seleccionadas, dobleCara).length;
  const folios = dobleCara ? Math.ceil(paginas / 2) : paginas;

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal ancho" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecera">
          <h2>Imprimir resúmenes</h2>
          <button className="btn btn-mini" onClick={onCerrar}>Cerrar</button>
        </div>

        <div className="modal-opciones">
          <div>
            <label>Tamaño de hoja</label>
            <p className="parrafo tenue" style={{ margin: "4px 0 0" }}>
              A5 de {HOJA_ANCHO} × {HOJA_ALTO} mm, dos por A4 apaisado. No hay otros tamaños: la
              hoja se diseña para leerse en mesa, y encogerla la deja ilegible.
            </p>
          </div>
          <label className="check-linea">
            <input
              type="checkbox"
              checked={dobleCara}
              onChange={(e) => onDobleCara(e.target.checked)}
            />
            Colocar para imprimir a doble cara
          </label>
        </div>

        {/* A cara única no hay segunda pasada que casar con la primera. */}
        {dobleCara && (
          <CalibracionImpresora
            impresoras={impresoras}
            impresoraId={impresoraId}
            onImpresora={onImpresora}
            onImpresoras={onImpresoras}
            queSeMueve="las caras B"
          />
        )}

        {/* -------- Qué hojas entran -------- */}
        <div className="modal-cabecera" style={{ margin: "18px 0 8px" }}>
          <label style={{ margin: 0 }}>Hojas a imprimir</label>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              className={"btn btn-mini" + (vista === "titulo" ? " activa" : "")}
              onClick={() => setVista("titulo")}
            >
              Títulos
            </button>
            <button
              className={"btn btn-mini" + (vista === "miniatura" ? " activa" : "")}
              onClick={() => setVista("miniatura")}
            >
              Miniaturas
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          <button className="btn btn-mini" onClick={onTodas}>Seleccionar todas</button>
          <button className="btn btn-mini" onClick={onNinguna}>Seleccionar ninguna</button>
          <button className="btn btn-mini" onClick={onInvertir}>Invertir selección</button>
        </div>

        <div className="caja-seleccion">
          {!hojas.length && (
            <p className="tenue" style={{ margin: 0, fontSize: 13 }}>
              Esta baraja no declara ninguna hoja de resumen.
            </p>
          )}
          {vista === "titulo" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {hojas.map((h) => (
                <label key={h.id} className={"fila-sel" + (estaSeleccionada(h.id) ? " activa" : "")}>
                  <input
                    type="checkbox"
                    checked={estaSeleccionada(h.id)}
                    onChange={() => onAlternar(h.id)}
                  />
                  <span className="nombre">{h.titulo || "Sin título"}</span>
                  <span className="tenue" style={{ fontSize: 11 }}>
                    {h.columnas === 1 ? "una columna" : "dos columnas"}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="rejilla-sel">
              {hojas.map((h) => (
                <button
                  key={h.id}
                  className={"sel-carta sel-a5" + (estaSeleccionada(h.id) ? " activa" : "")}
                  onClick={() => onAlternar(h.id)}
                  title={h.titulo || "Sin título"}
                >
                  <div className="sel-lienzo">
                    <HojaA5 hoja={h} />
                  </div>
                  <span className="sel-marca">{estaSeleccionada(h.id) ? "✓" : ""}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="btn ancho" onClick={() => setAyuda((v) => !v)}>
          {ayuda ? "▾" : "▸"} Cómo ajustar papel, escala y márgenes
        </button>
        {ayuda && (
          <>
            <p className="parrafo">
              Cada A4 lleva <b className="acento">dos hojas A5</b> en fila, para cortar por la
              vertical central. Las medidas solo salen exactas si el navegador imprime sin
              reescalar.
            </p>
            <dl className="lista-ayuda">
              <div>
                <dt>Tamaño y orientación del papel</dt>
                <dd>A4 <b>apaisado</b> (horizontal). Comprueba que el diálogo del navegador lo dice; en vertical no caben las dos hojas y el navegador reduce la página.</dd>
              </div>
              <div>
                <dt>Escala</dt>
                <dd><b>100 %</b> — nunca «Ajustar al área imprimible» ni «Ajustar a la página».</dd>
              </div>
              <div>
                <dt>Márgenes</dt>
                <dd>«Predeterminado» o «Ninguno». La hoja ya reserva 6 mm por lado.</dd>
              </div>
              <div>
                <dt>Gráficos de fondo</dt>
                <dd>Actívalo (en «Más ajustes»), o las hojas saldrán sin colores ni cabeceras.</dd>
              </div>
              <div>
                <dt>Encabezados y pies</dt>
                <dd>Desactívalos, para que no se cuelen fecha y URL en el borde de la hoja.</dd>
              </div>
              <div>
                <dt>Doble cara</dt>
                <dd>
                  Con la casilla marcada, las hojas se reparten de otra forma —cada grupo de
                  cuatro se abre en dos caras del mismo folio: 1 y 3 delante, y detrás 4 y 2,
                  cruzadas porque la cara B se imprime girada— y las
                  páginas pares salen giradas 180°, para que al voltear quede detrás de cada hoja
                  la siguiente. Imprime primero las <b>pares</b> (rango «2,4,6…» en el diálogo del
                  navegador), gira el taco de folios por el <b>lateral</b> sin cambiar el orden,
                  vuelve a meterlo y lanza las <b>impares</b>. Al cortar por la vertical central,
                  cada A5 sale con una hoja por cara.
                </dd>
              </div>
              <div>
                <dt>Zoom del navegador</dt>
                <dd>Déjalo al 100 % (Ctrl/⌘ + 0) antes de imprimir.</dd>
              </div>
            </dl>
            <p className="parrafo tenue">
              Comprobación: cada página lleva impresa arriba su etiqueta. Mide el ancho de una hoja
              de la primera página; si no son {HOJA_ANCHO} mm, queda escala activa en el diálogo.
            </p>
          </>
        )}

        <div className="modal-pie">
          <div className="resumen">
            <b className="acento">{seleccionadas.length}</b> de {hojas.length} hojas ·{" "}
            {HOJA_ANCHO} × {HOJA_ALTO} mm · {paginas} página(s)
            {dobleCara ? ` en ${folios} folio(s), pares giradas` : " en A4 apaisado"}
          </div>
          <button className="btn btn-primario" onClick={onImprimir} disabled={!seleccionadas.length}>
            Imprimir {seleccionadas.length} hoja(s)
          </button>
        </div>
      </div>
    </div>
  );
}
