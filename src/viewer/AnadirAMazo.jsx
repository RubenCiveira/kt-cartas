// Popup de «a qué mazo de impresión va esto». Lo abren tanto el detalle de una
// carta (una) como el diálogo de imprimir (las marcadas), así que habla de
// cartas en plural y dice cuántas son.
//
// Crear un mazo desde aquí es la vía normal, no un extra: la primera vez que
// quieres apartar una carta todavía no tienes ningún mazo, y mandarte a otra
// pantalla a crearlo te haría perder de vista la carta que ibas a añadir.

import { useState } from "react";

export default function AnadirAMazo({ mazos, cuantas, estado, error, onAnadir, onCrear, onCerrar }) {
  const [nombre, setNombre] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const con = async (fn) => {
    setOcupado(true);
    const ok = await fn();
    setOcupado(false);
    // Un fallo deja el popup abierto con su aviso: cerrarlo daría por hecho
    // que la carta está guardada cuando no lo está.
    if (ok) onCerrar();
  };

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecera">
          <h2>Añadir a un mazo de impresión</h2>
          <button className="btn btn-mini" onClick={onCerrar}>Cerrar</button>
        </div>

        <p className="parrafo tenue">
          {cuantas === 1 ? "Una carta" : `${cuantas} cartas`} para reimprimir más adelante junto a
          las de otras barajas. El mazo guarda la referencia, así que si la carta se corrige en su
          baraja saldrá corregida.
        </p>

        {error && <p className="aviso-filtro">{error}</p>}

        <label>Mazos existentes</label>
        <div className="caja-seleccion" style={{ maxHeight: "34vh" }}>
          {estado === "cargando" && <p className="tenue" style={{ margin: 0, fontSize: 13 }}>Cargando…</p>}
          {estado !== "cargando" && !mazos.length && (
            <p className="tenue" style={{ margin: 0, fontSize: 13 }}>
              Todavía no tienes ninguno. Crea el primero aquí abajo.
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {mazos.map((m) => (
              <button
                key={m.id}
                className="mazo-fila"
                disabled={ocupado}
                onClick={() => con(() => onAnadir(m.id))}
              >
                <span className="nombre">{m.nombre}</span>
                <span className="tenue">{m.refs.length} carta(s)</span>
              </button>
            ))}
          </div>
        </div>

        <label>Mazo nuevo</label>
        <div className="mazos-nuevo">
          <input
            type="text"
            value={nombre}
            placeholder="Actualizaciones de marzo…"
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && nombre.trim() && con(() => onCrear(nombre))}
          />
          <button
            className="btn btn-primario btn-mini"
            disabled={ocupado || !nombre.trim()}
            onClick={() => con(() => onCrear(nombre))}
          >
            Crear y añadir
          </button>
        </div>
      </div>
    </div>
  );
}
