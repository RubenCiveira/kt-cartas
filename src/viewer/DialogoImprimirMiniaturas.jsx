// Diálogo de "Miniaturas de papel": aparte del de imprimir cartas, porque no
// imprime la baraja sino una plancha de recortables (ver print/HojasMiniaturas.jsx).
//
// Dos pasos. El primero decide QUÉ UNIDADES entran: se puede pedir "solo blanco
// y negro" (para colorear a mano o ahorrar tinta), y una unidad que no traiga
// foto de ese modo pero sí a color se enseña con un aviso — usar la de color
// para esa unidad, o descartarla, en vez de fallar en silencio o mezclar sin
// avisar dos cosas que el usuario pidió distintas. El segundo decide, por
// unidad, CUÁL foto de las que califican se imprime, cuando hay más de una.
//
// No hay paso 3: el botón de imprimir del paso 2 llama a onImprimir con la
// plancha ya resuelta.

import { useMemo, useState } from "react";
import { useAssetUrl } from "../assets.js";

// Las candidatas de una unidad para el modo pedido, y las del otro modo por si
// hay que ofrecer la alternativa.
function candidatas(carta, modo) {
  return (carta.miniaturas || []).filter((m) => m.modo === modo);
}

export default function DialogoImprimirMiniaturas({ cartas, onCerrar, onImprimir }) {
  const [paso, setPaso] = useState(1);
  const [soloBN, setSoloBN] = useState(false);
  // Por unidad: si entra, y si se le ha pedido usar el modo alternativo cuando
  // el pedido no tiene fotos. Sin entrada = "entra, con el modo pedido si lo
  // tiene, si no con el alternativo" (el aviso ya deja elegir lo contrario).
  const [excluidas, setExcluidas] = useState([]);
  const [usarAlternativa, setUsarAlternativa] = useState({});
  // Por unidad: qué foto de las que califican se imprime, cuando hay más de una.
  const [elegidas, setElegidas] = useState({});

  const modoPedido = soloBN ? "bn" : "color";
  const modoAlterno = soloBN ? "color" : "bn";

  // Para cada unidad: sus candidatas del modo pedido, del alterno, si necesita
  // aviso (no tiene del pedido pero sí del alterno) y si ya no tiene ninguna
  // foto que valga en absoluto (no debería pasar: la lista ya viene filtrada a
  // unidades con miniaturas, pero una unidad puede traer solo del modo que ni
  // se pide ni se acepta como alternativa... no existe tal caso con dos modos).
  const filas = useMemo(
    () =>
      cartas.map((c) => {
        const pedidas = candidatas(c, modoPedido);
        const alternas = candidatas(c, modoAlterno);
        return { carta: c, pedidas, alternas, necesitaAviso: !pedidas.length && !!alternas.length };
      }),
    [cartas, modoPedido, modoAlterno]
  );

  const resuelta = (fila) => {
    if (fila.pedidas.length) return { modo: modoPedido, opciones: fila.pedidas };
    if (usarAlternativa[fila.carta.id]) return { modo: modoAlterno, opciones: fila.alternas };
    return null; // sin aviso resuelto a favor: se descarta por defecto
  };

  const incluidas = filas.filter((f) => !excluidas.includes(f.carta.id) && resuelta(f));

  const alternar = (id) =>
    setExcluidas((ex) => (ex.includes(id) ? ex.filter((x) => x !== id) : [...ex, id]));

  const elegidaDe = (fila) => {
    const r = resuelta(fila);
    if (!r) return null;
    return elegidas[fila.carta.id] || r.opciones[0];
  };

  const imprimir = () => {
    const piezas = incluidas
      .map((f) => {
        const m = elegidaDe(f);
        return m && { clave: f.carta.id, imagen: m.imagen, nombre: f.carta.titulo, alto: m.alto };
      })
      .filter(Boolean);
    onImprimir(piezas);
  };

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal ancho" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecera">
          <h2>Miniaturas de papel</h2>
          <button className="btn btn-mini" onClick={onCerrar}>Cerrar</button>
        </div>

        {paso === 1 ? (
          <>
            <p className="parrafo">
              Recorta la foto de un operativo por su silueta para usarla de proxy en partidas de
              prueba: a color, o en blanco y negro para colorear a mano antes de jugar.
            </p>
            <label className="check-linea" style={{ marginTop: 10 }}>
              <input type="checkbox" checked={soloBN} onChange={(e) => setSoloBN(e.target.checked)} />
              Solo blanco y negro
            </label>

            <div className="modal-cabecera" style={{ margin: "16px 0 8px" }}>
              <label style={{ margin: 0 }}>Unidades a imprimir</label>
            </div>
            <div className="caja-seleccion">
              {filas.map((f) => {
                const r = resuelta(f);
                const marcada = !excluidas.includes(f.carta.id) && !!r;
                return (
                  <div key={f.carta.id}>
                    <label className={"fila-sel" + (marcada ? " activa" : "")}>
                      <input
                        type="checkbox"
                        checked={marcada}
                        disabled={!r}
                        onChange={() => alternar(f.carta.id)}
                      />
                      <span className="nombre">{f.carta.titulo || "Sin título"}</span>
                      <span className="tenue" style={{ fontSize: 11 }}>
                        {r ? `${r.opciones.length} foto(s)` : "sin foto"}
                      </span>
                    </label>
                    {f.necesitaAviso && (
                      <div className="aviso-fila">
                        <span className="nombre">
                          Sin foto en {soloBN ? "blanco y negro" : "color"}, pero tiene en{" "}
                          {soloBN ? "color" : "blanco y negro"}.
                        </span>
                        <button
                          className={"btn btn-mini" + (usarAlternativa[f.carta.id] ? " activa" : "")}
                          onClick={() =>
                            setUsarAlternativa((u) => ({ ...u, [f.carta.id]: !u[f.carta.id] }))
                          }
                        >
                          {usarAlternativa[f.carta.id] ? "✓ Usar esa" : "Usar esa igualmente"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {!filas.length && (
                <p className="tenue" style={{ margin: 0, fontSize: 13 }}>
                  Ninguna carta de esta baraja trae fotos de miniatura.
                </p>
              )}
            </div>

            <div className="modal-pie">
              <div className="resumen">
                <b className="acento">{incluidas.length}</b> de {filas.length} unidad(es)
              </div>
              <button
                className="btn btn-primario"
                onClick={() => setPaso(2)}
                disabled={!incluidas.length}
              >
                Siguiente: elegir foto…
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="parrafo">
              Cuando una unidad trae más de una foto para este modo, elige cuál entra en la plancha.
            </p>
            <div className="caja-seleccion" style={{ maxHeight: "52vh" }}>
              {incluidas.map((f) => {
                const r = resuelta(f);
                const elegida = elegidaDe(f);
                return (
                  <div key={f.carta.id} style={{ marginBottom: 12 }}>
                    <div className="nombre" style={{ fontSize: 13, marginBottom: 4 }}>
                      {f.carta.titulo || "Sin título"}
                    </div>
                    {/* Se enseña la foto aunque solo haya una: así se ve qué va a salir en la
                        plancha en vez de una frase, aunque no haya nada que elegir. */}
                    <div className="miniaturas-opciones">
                      {r.opciones.map((m) => (
                        <OpcionMiniatura
                          key={m.id}
                          miniatura={m}
                          activa={elegida && elegida.id === m.id}
                          sola={r.opciones.length === 1}
                          onElegir={() =>
                            r.opciones.length > 1 && setElegidas((e) => ({ ...e, [f.carta.id]: m }))
                          }
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="modal-pie">
              <button className="btn" onClick={() => setPaso(1)}>◂ Atrás</button>
              <div style={{ display: "flex", gap: 8 }}>
                <div className="resumen">
                  <b className="acento">{incluidas.length}</b> pieza(s) para recortar
                </div>
                <button className="btn btn-primario" onClick={imprimir}>
                  Imprimir plancha
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OpcionMiniatura({ miniatura, activa, sola, onElegir }) {
  const url = useAssetUrl(miniatura.imagen);
  const titulo = miniatura.modo === "bn" ? "Blanco y negro" : "Color";
  // Sin variación no hay nada que elegir: se enseña la foto igual, pero como
  // vista fija y no como botón, que invitaría a pulsar algo que no hace nada.
  if (sola) {
    return (
      <div className="miniatura-opcion activa" title={titulo}>
        {url && <img src={url} alt="" />}
      </div>
    );
  }
  return (
    <button
      className={"miniatura-opcion" + (activa ? " activa" : "")}
      onClick={onElegir}
      title={titulo}
    >
      {url && <img src={url} alt="" />}
    </button>
  );
}
