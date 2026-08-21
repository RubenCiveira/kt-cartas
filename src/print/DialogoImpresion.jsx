// Diálogo de impresión: formato, dorsos, ayuda de ajustes del navegador y la
// selección de qué cartas entran.
//
// La marca de cada miniatura de la tira hace lo mismo, pero la tira solo
// enseña un puñado de cartas a la vez; aquí se ve la baraja entera de un
// vistazo, que es lo que hace falta para armar una impresión parcial.

import { useState } from "react";
import CartaFace from "../cards/CartaFace.jsx";
import { etiquetaTipo } from "../data/tipos.js";
import { FORMATOS, etiquetaFormato, medidas, medidasDibujo, porHoja, repartirHojas } from "./formatos.js";

export default function DialogoImpresion({
  formato,
  onFormato,
  incluirDorsos,
  onDorsos,
  fichas,
  incluirFichas,
  onFichas,
  cartas,
  estaSeleccionada,
  onAlternar,
  onTodas,
  onNinguna,
  onInvertir,
  seleccionadas,
  total,
  hayFiltro,
  onCerrar,
  onImprimir,
}) {
  const [ayuda, setAyuda] = useState(false);
  const [vista, setVista] = useState("titulo");
  const medida = medidas(formato);
  const { paginas, paginasFichas } = repartirHojas(seleccionadas, formato);
  const hojas = paginas.length + paginasFichas.length;

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal ancho" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecera">
          <h2>Imprimir mazo</h2>
          <button className="btn btn-mini" onClick={onCerrar}>Cerrar</button>
        </div>

        <div className="modal-opciones">
          <div>
            <label>Tamaño de carta</label>
            <select value={formato.id} onChange={(e) => onFormato(e.target.value)}>
              {FORMATOS.map((f) => {
                const m = medidas(f);
                return (
                  <option key={f.id} value={f.id}>
                    {f.label} — {m.ancho} × {m.alto} mm · {porHoja(f)} por hoja
                  </option>
                );
              })}
            </select>
          </div>
          <label className="check-linea">
            <input type="checkbox" checked={incluirDorsos} onChange={(e) => onDorsos(e.target.checked)} />
            Imprimir dorsos (doble cara)
          </label>
        </div>

        {/* Solo las barajas que declaran fichas pueden ofrecer la hoja */}
        {fichas && fichas.lista && fichas.lista.length > 0 && (
          <label className="check-linea" style={{ marginTop: 12 }}>
            <input type="checkbox" checked={incluirFichas} onChange={(e) => onFichas(e.target.checked)} />
            Añadir hoja de fichas y marcadores recortables (
            {fichas.lista.reduce((n, f) => n + (f.cantidad || 1), 0)} piezas, a tamaño real)
          </label>
        )}

        {hayFiltro && (
          <p className="aviso-filtro">
            Tienes un filtro activo en la tira. El filtro solo cambia lo que ves: aquí abajo está la
            baraja entera, y se imprimirá lo que esté marcado, esté visible en la tira o no.
          </p>
        )}

        {/* -------- Qué cartas entran -------- */}
        <div className="modal-cabecera" style={{ margin: "18px 0 8px" }}>
          <label style={{ margin: 0 }}>Cartas a imprimir</label>
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
          {!cartas.length && <p className="tenue" style={{ margin: 0, fontSize: 13 }}>La baraja no tiene cartas.</p>}
          {vista === "titulo" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {cartas.map((c) => (
                <label key={c.id} className={"fila-sel" + (estaSeleccionada(c.id) ? " activa" : "")}>
                  <input
                    type="checkbox"
                    checked={estaSeleccionada(c.id)}
                    onChange={() => onAlternar(c.id)}
                  />
                  <span className="nombre">{c.titulo || "Sin título"}</span>
                  <span className="tenue" style={{ fontSize: 11 }}>{etiquetaTipo(c.tipo)}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="rejilla-sel">
              {cartas.map((c) => (
                <button
                  key={c.id}
                  className={
                    "sel-carta" +
                    (c.tipo === "datacard" ? " apaisada" : "") +
                    (estaSeleccionada(c.id) ? " activa" : "")
                  }
                  onClick={() => onAlternar(c.id)}
                  title={c.titulo || "Sin título"}
                >
                  <div className="sel-lienzo">
                    <CartaFace carta={c} />
                  </div>
                  <span className="sel-marca">{estaSeleccionada(c.id) ? "✓" : ""}</span>
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
              Formato seleccionado: <b className="acento">{etiquetaFormato(formato)}</b>. Las medidas
              solo salen exactas si el navegador imprime sin reescalar.
              {medidasDibujo(formato) && (
                <>
                  {" "}El dibujo mide {medidasDibujo(formato).ancho} × {medidasDibujo(formato).alto} mm
                  y va centrado en el recorte: el papel de más es para plastificar sin tocarlo.
                </>
              )}
            </p>
            <dl className="lista-ayuda">
              <div>
                <dt>Tamaño de papel</dt>
                <dd>A4 (210 × 297 mm). Si eliges Carta/Letter, el navegador reduce la página y las cartas salen pequeñas.</dd>
              </div>
              <div>
                <dt>Escala</dt>
                <dd>
                  <b>100 %</b> — nunca «Ajustar al área imprimible» ni «Ajustar a la página»: ese
                  ajuste es el que encoge el mazo (típicamente a ~66 × 115 mm en lugar de 70 × 121).
                </dd>
              </div>
              <div>
                <dt>Márgenes</dt>
                <dd>
                  «Predeterminado» o «Ninguno». La propia hoja ya reserva 6 mm por lado; con márgenes
                  grandes el navegador puede recolocar o recortar la última fila.
                </dd>
              </div>
              <div>
                <dt>Gráficos de fondo</dt>
                <dd>Actívalo (en «Más ajustes»), o las cartas saldrán sin colores ni cabeceras.</dd>
              </div>
              <div>
                <dt>Encabezados y pies</dt>
                <dd>Desactívalos, para que no se cuelen fecha y URL entre las guías de corte.</dd>
              </div>
              <div>
                <dt>Doble cara</dt>
                <dd>Con dorsos activados: doble cara con giro por el <b>borde largo</b>.</dd>
              </div>
              <div>
                <dt>Zoom del navegador</dt>
                <dd>Déjalo al 100 % (Ctrl/⌘ + 0) antes de imprimir: en algunos navegadores el zoom de pantalla afecta a la salida.</dd>
              </div>
            </dl>
            <p className="parrafo tenue">
              Comprobación: cada hoja lleva impresa arriba su etiqueta de formato. Mide con una regla
              el ancho de una carta de la primera hoja; si no coincide con {medida.ancho} mm, queda
              escala activa en el diálogo.
            </p>
          </>
        )}

        <div className="modal-pie">
          <div className="resumen">
            <b className="acento">{seleccionadas.length}</b> de {total} cartas · {medida.ancho} ×{" "}
            {medida.alto} mm · {hojas} hoja(s)
            {incluirDorsos ? " + dorsos" : ""}
          </div>
          <button className="btn btn-primario" onClick={onImprimir} disabled={!seleccionadas.length}>
            Imprimir {seleccionadas.length} carta(s)
          </button>
        </div>
      </div>
    </div>
  );
}
