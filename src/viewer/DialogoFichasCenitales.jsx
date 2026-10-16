// Diálogo de «Fichas cenitales»: aparte del de imprimir cartas, como el de
// miniaturas, porque no imprime la baraja sino una plancha de recortables
// (ver print/HojasCenitales.jsx).
//
// Enseña todos los operativos de la baraja y deja decidir cuántos de cada uno
// entran y con qué nombre. No hay tope: `cantidadMaximo` (lo que admite la
// composición del comando) solo se enseña como referencia y avisa al pasarlo,
// porque hay partidas —JcE, escenarios, refuerzos— que piden más.
//
// El nombre sale en el banner del disco y en la hoja de control de escuadra:
// con seis guerreros iguales sobre la mesa, es lo único que los distingue. Por
// defecto cada copia toma el primer nombre sugerido de su operativo
// (`nombresSugeridos`) que no use ya otra ficha de la escuadra; agotados, el
// del operativo numerado. Se puede escribir otro, y la lista de sugerencias
// sigue a mano en el desplegable del campo.
//
// Las fichas genéricas de ANJ de JcE no son de ninguna facción: traen
// `familiaFotos`, una foto por familia (tiránidos, orkos…). Si alguna la trae,
// el diálogo ofrece un desplegable de familia, y los operativos que la tengan
// salen con esa foto; los que no, con la suya.

import { useMemo, useState } from "react";
import { FotoEncuadrada, TAMANOS_CENITALES } from "../print/HojasCenitales.jsx";

// Un operativo por título: la ficha de datos que sigue en el reverso repite
// título y no es otro operativo.
export function operativosDe(cartas) {
  const porTitulo = new Map();
  for (const c of cartas) {
    if (c.tipo !== "datacard" || !c.titulo) continue;
    const previo = porTitulo.get(c.titulo);
    if (!previo) {
      porTitulo.set(c.titulo, {
        titulo: c.titulo, foto: c.foto, fotoCentro: c.fotoCentro, stats: c.stats,
        maximo: c.cantidadMaximo, sugeridos: c.nombresSugeridos, familias: c.familiaFotos || {},
      });
    } else if (!previo.foto && c.foto) {
      Object.assign(previo, { foto: c.foto, fotoCentro: c.fotoCentro });
    }
  }
  return [...porTitulo.values()];
}

const MAX_POR_OPERATIVO = 30; // solo para que un dedazo no genere cien discos

export default function DialogoFichasCenitales({ cartas, onCerrar, onImprimir }) {
  const operativosBase = useMemo(() => operativosDe(cartas), [cartas]);
  const familias = useMemo(
    () => [...new Set(operativosBase.flatMap((op) => Object.keys(op.familias)))],
    [operativosBase]
  );
  const [familia, setFamilia] = useState(() => familias[0] || "");
  // Con familia elegida, la foto de cada operativo es la de esa familia si la
  // tiene; el resto del diálogo no distingue.
  const operativos = useMemo(
    () => operativosBase.map((op) => {
      const f = op.familias[familia];
      return f ? { ...op, foto: f.foto, fotoCentro: f.fotoCentro } : op;
    }),
    [operativosBase, familia]
  );
  const [tamano, setTamano] = useState("28mm");
  const [cuantos, setCuantos] = useState({});
  const [nombres, setNombres] = useState({});

  const cuantosDe = (op) => cuantos[op.titulo] || 0;
  const cambiar = (op, n) => setCuantos((c) => ({ ...c, [op.titulo]: Math.max(0, Math.min(MAX_POR_OPERATIVO, n)) }));
  const nombrar = (op, i, valor) =>
    setNombres((ns) => {
      const lista = [...(ns[op.titulo] || [])];
      lista[i] = valor;
      return { ...ns, [op.titulo]: lista };
    });

  // Nombre de cada copia: el escrito, o el siguiente sugerido libre. Se resuelve
  // en orden para toda la escuadra, así dos operativos con sugerencias
  // parecidas tampoco repiten.
  const fichas = [];
  const usados = new Set(
    operativos.flatMap((op) => (nombres[op.titulo] || []).slice(0, cuantosDe(op)).map((n) => (n || "").trim()).filter(Boolean))
  );
  const porDefecto = {};
  for (const op of operativos) {
    const n = cuantosDe(op);
    porDefecto[op.titulo] = [];
    for (let i = 0; i < n; i++) {
      const escrito = (nombres[op.titulo]?.[i] || "").trim();
      let nombre = escrito;
      if (!nombre) {
        nombre = op.sugeridos.find((s) => !usados.has(s)) || (n > 1 ? `${op.titulo} ${i + 1}` : op.titulo);
        usados.add(nombre);
      }
      porDefecto[op.titulo].push(nombre);
      fichas.push({ clave: op.titulo + "-" + i, titulo: op.titulo, foto: op.foto, fotoCentro: op.fotoCentro, stats: op.stats, nombre });
    }
  }

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal ancho" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecera">
          <h2>Fichas cenitales</h2>
          <button className="btn btn-mini" onClick={onCerrar}>Cerrar</button>
        </div>

        <p className="parrafo">
          Un disco por agente, del tamaño de su peana, con la foto de su ficha y su nombre, para
          jugar sobre la escenografía de papel. Detrás sale una hoja de control de escuadra con los
          mismos nombres.
        </p>
        <div className="modal-opciones">
          <div>
            <label>Escala</label>
            <select value={tamano} onChange={(e) => setTamano(e.target.value)}>
              {Object.entries(TAMANOS_CENITALES).map(([id, t]) => (
                <option key={id} value={id}>{t.etiqueta}</option>
              ))}
            </select>
          </div>
          {familias.length > 0 && (
            <div>
              <label>Familia de fotos</label>
              <select value={familia} onChange={(e) => setFamilia(e.target.value)}>
                {familias.map((f) => <option key={f} value={f}>{f}</option>)}
                <option value="">Sin familia (foto de la ficha)</option>
              </select>
            </div>
          )}
        </div>

        <div className="modal-cabecera" style={{ margin: "16px 0 8px" }}>
          <label style={{ margin: 0 }}>Agentes</label>
        </div>
        <div className="caja-seleccion" style={{ maxHeight: "52vh" }}>
          {operativos.map((op) => {
            const n = cuantosDe(op);
            const lista = "sugeridos-" + op.titulo.replace(/\W+/g, "-");
            return (
              <div key={op.titulo} className={"cenital-fila" + (n ? " activa" : "")}>
                <div className="cenital-cabeza">
                  <span className="cenital-retrato">
                    <FotoEncuadrada foto={op.foto} centro={op.fotoCentro} />
                  </span>
                  <span className="nombre">{op.titulo}</span>
                  <div className="cenital-contador">
                    <button className="btn btn-mini" onClick={() => cambiar(op, n - 1)} disabled={!n}>−</button>
                    <b>{n}</b>
                    <button className="btn btn-mini" onClick={() => cambiar(op, n + 1)}>+</button>
                    <span className={n > op.maximo ? "cenital-exceso" : "tenue"}>
                      {n > op.maximo ? `más de ${op.maximo} del comando` : `${op.maximo} en el comando`}
                    </span>
                  </div>
                </div>
                {n > 0 && (
                  <div className="cenital-nombres">
                    {op.sugeridos.length > 0 && (
                      <datalist id={lista}>
                        {op.sugeridos.map((s) => <option key={s} value={s} />)}
                      </datalist>
                    )}
                    {Array.from({ length: n }, (_, i) => (
                      <input
                        key={i}
                        type="text"
                        list={op.sugeridos.length ? lista : undefined}
                        value={nombres[op.titulo]?.[i] || ""}
                        placeholder={porDefecto[op.titulo][i]}
                        onChange={(e) => nombrar(op, i, e.target.value)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="modal-pie">
          <div className="resumen">
            <b className="acento">{fichas.length}</b> ficha(s) + hoja de control
          </div>
          <button className="btn btn-primario" onClick={() => onImprimir({ tamano, fichas })} disabled={!fichas.length}>
            Imprimir fichas
          </button>
        </div>
      </div>
    </div>
  );
}
