// Pantalla de los mazos de impresión: la lista de mazos del usuario a la
// izquierda y, a la derecha, las cartas del que esté abierto.
//
// No hay tira ni detalle: aquí no se lee una carta, se decide si entra en la
// próxima tirada. Por eso las cartas se ven como miniaturas y lo único que se
// puede hacer con cada una es quitarla.

import { useState } from "react";

import CartaFace from "../cards/CartaFace.jsx";
import { resolverRefs } from "../data/mazos-impresion.js";
import MenuUsuario from "./MenuUsuario.jsx";

export default function MazosImpresion({
  mazos,
  mazoId,
  onMazo,
  barajas,
  estado,
  error,
  onCrear,
  onRenombrar,
  onBorrar,
  onQuitar,
  onImprimir,
  onInicio,
  onIrABaraja,
  usuario,
  avatarUrl,
  onLogout,
}) {
  const [nombreNuevo, setNombreNuevo] = useState("");
  const abierto = mazos.find((m) => m.id === mazoId) || null;
  const entradas = abierto ? resolverRefs(abierto.refs, barajas) : [];
  const huerfanas = entradas.filter((e) => !e.carta).length;
  const imprimibles = entradas.length - huerfanas;

  const crear = () => {
    const nombre = nombreNuevo.trim();
    if (!nombre) return;
    setNombreNuevo("");
    onCrear(nombre);
  };

  return (
    <div className="app-visor mazos-impresion">
      <header className="barra">
        <div className="barra-fila">
          <button className="btn btn-mini" onClick={onInicio}>Inicio</button>
          <strong>Mazos de impresión</strong>
          <span className="tenue larga">
            cartas de varias barajas en una sola tirada
          </span>
          <div style={{ marginLeft: "auto" }}>
            <MenuUsuario usuario={usuario} avatarUrl={avatarUrl} onLogout={onLogout} />
          </div>
        </div>
      </header>

      {error && <p className="aviso-filtro" style={{ margin: "12px 16px 0" }}>{error}</p>}

      <div className="mazos-cuerpo">
        <aside className="mazos-lista">
          <div className="mazos-nuevo">
            <input
              type="text"
              value={nombreNuevo}
              placeholder="Nuevo mazo…"
              onChange={(e) => setNombreNuevo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && crear()}
            />
            <button className="btn btn-mini" onClick={crear} disabled={!nombreNuevo.trim()}>
              Crear
            </button>
          </div>

          {estado === "cargando" && <p className="tenue" style={{ fontSize: 13 }}>Cargando…</p>}
          {estado === "listo" && !mazos.length && (
            <p className="tenue" style={{ fontSize: 13, lineHeight: 1.5 }}>
              Todavía no tienes mazos. Crea uno y ve añadiéndole cartas desde cualquier baraja,
              con el botón «A imprimir» del detalle de la carta.
            </p>
          )}
          {mazos.map((m) => (
            <button
              key={m.id}
              className={"mazo-fila" + (m.id === mazoId ? " activa" : "")}
              onClick={() => onMazo(m.id)}
            >
              <span className="nombre">{m.nombre}</span>
              <span className="tenue">{m.refs.length}</span>
            </button>
          ))}
        </aside>

        <section className="mazos-detalle">
          {!abierto && (
            <p className="tenue">
              {mazos.length ? "Elige un mazo de la lista." : "Crea tu primer mazo de impresión."}
            </p>
          )}

          {abierto && (
            <>
              <div className="mazos-cabecera">
                {/* El nombre se edita donde se lee: un mazo de impresión se
                    llama "actualizaciones marzo" y ese nombre cambia a menudo. */}
                <input
                  className="mazo-nombre"
                  type="text"
                  value={abierto.nombre}
                  onChange={(e) => onRenombrar(abierto.id, e.target.value)}
                />
                <button className="btn btn-mini" onClick={() => onBorrar(abierto.id)}>
                  Borrar mazo
                </button>
                <button
                  className="btn btn-primario btn-mini"
                  onClick={onImprimir}
                  disabled={!imprimibles}
                >
                  Imprimir {imprimibles} carta(s)…
                </button>
              </div>

              {!entradas.length && (
                <p className="tenue">
                  Mazo vacío. Abre una baraja, entra en una carta y pulsa «A imprimir».
                </p>
              )}

              {huerfanas > 0 && (
                <p className="aviso-filtro">
                  {huerfanas} carta(s) de este mazo ya no están en su baraja: puede que se hayan
                  renumerado al reeditarla. No se imprimen; quítalas y vuelve a añadirlas.
                </p>
              )}

              <div className="rejilla-sel" style={{ marginTop: 12 }}>
                {entradas.map((e) => (
                  <div key={e.ref} className="mazo-carta">
                    <div
                      className={
                        "sel-carta activa" +
                        (e.carta && e.carta.tipo === "datacard" ? " apaisada" : "")
                      }
                    >
                      <div className="sel-lienzo">
                        {e.carta ? (
                          <CartaFace carta={e.carta} />
                        ) : (
                          <div className="mazo-huerfana">
                            <span>{e.cartaId}</span>
                            <span className="tenue">{e.clave}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mazo-carta-pie">
                      <span className="tenue" title={e.baraja ? e.baraja.nombre : e.clave}>
                        {e.baraja ? e.baraja.nombre : "Baraja ausente"}
                      </span>
                      <div style={{ display: "flex", gap: 4 }}>
                        {e.baraja && (
                          <button
                            className="btn btn-mini"
                            title="Abrir la carta en su baraja"
                            onClick={() => onIrABaraja(e.clave, e.cartaId)}
                          >
                            Ver
                          </button>
                        )}
                        <button className="btn btn-mini" onClick={() => onQuitar(abierto.id, e.ref)}>
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
