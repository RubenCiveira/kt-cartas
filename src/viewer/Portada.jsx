// Portada: el índice de barajas por el que se empieza a navegar. Primero el
// tipo de baraja (reglas, equipos, campañas) y dentro de él las barajas.
//
// El tipo elegido no filtra en silencio: cuando no hay ninguno se ven todos los
// grupos seguidos, que con pocas barajas es la vista más útil. Elegir uno lo
// deja solo en pantalla y queda en el hash (`#grupo=equipos`), así que un enlace
// a «los equipos» es una URL como cualquier otra.

import { useIconoBarajaUrl } from "../assets.js";
import { etiquetaTipo } from "../data/tipos.js";
import { agruparPorTipo } from "../data/tipos-baraja.js";
import MenuUsuario from "./MenuUsuario.jsx";

export default function Portada({ barajas, grupo, onGrupo, onBaraja, usuario, avatarUrl, onLogout }) {
  const grupos = agruparPorTipo(barajas);
  // Un grupo que ya no existe (baraja despublicada, URL a mano) no deja la
  // portada en blanco: se cae a verlos todos.
  const activo = grupos.some((g) => g.id === grupo) ? grupo : null;
  const visibles = activo ? grupos.filter((g) => g.id === activo) : grupos;
  const totalCartas = barajas.reduce((n, b) => n + b.cartas.length, 0);

  return (
    <div className="portada">
      <header className="barra portada-barra">
        <div className="barra-fila">
          <h1 className="portada-marca">KT Cartas</h1>
          <span className="tenue larga">
            {barajas.length} barajas · {totalCartas} cartas
          </span>
          <div style={{ marginLeft: "auto" }}>
            <MenuUsuario usuario={usuario} avatarUrl={avatarUrl} onLogout={onLogout} />
          </div>
        </div>
      </header>

      <div className="portada-cuerpo">
        <div className="chips portada-grupos">
          <button
            className={"chip" + (!activo ? " activa" : "")}
            onClick={() => onGrupo(null)}
          >
            Todas <em>{barajas.length}</em>
          </button>
          {grupos.map((g) => (
            <button
              key={g.id}
              className={"chip" + (g.id === activo ? " activa" : "")}
              aria-pressed={g.id === activo}
              onClick={() => onGrupo(g.id === activo ? null : g.id)}
            >
              {g.label} <em>{g.barajas.length}</em>
            </button>
          ))}
        </div>

        {visibles.map((g) => (
          <section key={g.id} className="portada-grupo">
            <div className="portada-grupo-titulo">
              <h2>{g.titulo}</h2>
              <p className="tenue">{g.descripcion}</p>
            </div>
            <div className="portada-rejilla">
              {g.barajas.map((b) => (
                <TarjetaBaraja key={b.clave} baraja={b} onAbrir={() => onBaraja(b.clave)} />
              ))}
            </div>
          </section>
        ))}

        {!grupos.length && <p className="tenue">No hay barajas publicadas en el bucket.</p>}
      </div>
    </div>
  );
}

// Cada baraja se presenta por lo que trae dentro: su icono, cuántas cartas son
// y de qué tipos, que es lo que distingue una baraja de facción de un glosario.
function TarjetaBaraja({ baraja, onAbrir }) {
  const tipos = resumenTipos(baraja.cartas);
  const icono = useIconoBarajaUrl(baraja.icono);

  return (
    <button className="portada-baraja" type="button" onClick={onAbrir}>
      <span className="portada-baraja-icono">
        <img src={icono} alt="" />
      </span>
      <span className="portada-baraja-texto">
        <strong>{baraja.nombre}</strong>
        <span className="tenue">{baraja.cartas.length} cartas</span>
        <span className="portada-baraja-tipos">{tipos}</span>
      </span>
    </button>
  );
}

// Los tres tipos de carta más numerosos, que bastan para reconocer la baraja de
// un vistazo; la lista entera cabría, pero deja de leerse.
function resumenTipos(cartas) {
  const cuenta = new Map();
  cartas.forEach((c) => cuenta.set(c.tipo, (cuenta.get(c.tipo) || 0) + 1));
  return [...cuenta.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => etiquetaTipo(id))
    .join(" · ");
}
