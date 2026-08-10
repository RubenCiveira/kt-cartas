// Buscador con autocompletado. Busca por título y, en segundo plano, por el
// texto de la carta: en una baraja se busca tanto "¿cómo se llamaba la carta
// del francotirador?" como "¿en qué carta salía lo de Letal 5+?".

import { useEffect, useMemo, useRef, useState } from "react";
import { etiquetaTipo } from "../data/tipos.js";

const norm = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Un poco de orden en los resultados: primero lo que empieza por lo tecleado,
// luego lo que lo contiene en el título, y al final lo que solo sale en el texto.
function buscar(cartas, consulta) {
  const q = norm(consulta).trim();
  if (q.length < 2) return [];
  const cuerpoDe = (c) =>
    norm([c.cuerpo, c.revelado, c.flavor, c.pv, (c.acciones || []).map((a) => a.nombre + " " + a.texto).join(" "),
      (c.armas || []).map((a) => a.nombre + " " + a.reglas).join(" ")].join(" "));

  return cartas
    .map((c) => {
      const titulo = norm(c.titulo);
      if (titulo.startsWith(q)) return { c, peso: 0 };
      if (titulo.includes(q)) return { c, peso: 1 };
      if (cuerpoDe(c).includes(q)) return { c, peso: 2 };
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.peso - b.peso)
    .slice(0, 8);
}

export default function Buscador({ cartas, onIr }) {
  const [consulta, setConsulta] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const caja = useRef(null);

  const resultados = useMemo(() => buscar(cartas, consulta), [cartas, consulta]);

  useEffect(() => setActivo(0), [consulta]);

  // Cerrar al pulsar fuera
  useEffect(() => {
    const fuera = (e) => {
      if (caja.current && !caja.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, []);

  const elegir = (id) => {
    setConsulta("");
    setAbierto(false);
    onIr(id);
  };

  const tecla = (e) => {
    if (!resultados.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActivo((i) => (i + 1) % resultados.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((i) => (i - 1 + resultados.length) % resultados.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      elegir(resultados[activo].c.id);
    } else if (e.key === "Escape") {
      setAbierto(false);
    }
  };

  return (
    <div className="buscador" ref={caja}>
      <input
        type="search"
        value={consulta}
        placeholder="Buscar carta…"
        onChange={(e) => { setConsulta(e.target.value); setAbierto(true); }}
        onFocus={() => setAbierto(true)}
        onKeyDown={tecla}
        aria-label="Buscar carta en la baraja"
      />
      {abierto && consulta.trim().length >= 2 && (
        <ul className="sugerencias">
          {!resultados.length && <li className="vacio">Sin resultados</li>}
          {resultados.map((r, i) => (
            <li key={r.c.id}>
              <button
                className={i === activo ? "activa" : ""}
                onMouseEnter={() => setActivo(i)}
                onClick={() => elegir(r.c.id)}
              >
                <span className="nombre">{r.c.titulo || "Sin título"}</span>
                <span className="tipo">{etiquetaTipo(r.c.tipo)}</span>
                {r.peso === 2 && <span className="donde">en el texto</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
