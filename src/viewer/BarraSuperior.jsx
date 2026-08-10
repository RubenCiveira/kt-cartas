// Cabecera del visor: qué baraja hay abierta (y el salto rápido a otra),
// filtrar por tipo de carta y moverse por la baraja (índice y búsqueda). Qué se
// imprime se decide en el diálogo de imprimir; aquí no hay controles de
// selección. El filtro es solo visual.

import { etiquetaTipo } from "../data/tipos.js";
import Buscador from "./Buscador.jsx";
import MenuUsuario from "./MenuUsuario.jsx";
import SelectorBarajas from "./SelectorBarajas.jsx";

export default function BarraSuperior({
  mazoActivo,
  nombreMazo,
  iconoMazo,
  onMazo,
  onInicio,
  tipos,
  filtro,
  onFiltro,
  cartas,
  visibles,
  seleccionadas,
  total,
  barajas,
  onIndice,
  onIr,
  onImprimir,
  usuario,
  avatarUrl,
  onLogout,
}) {
  return (
    <header className="barra">
      <div className="barra-fila">
        <button className="btn btn-mini" onClick={onInicio} title="Volver al índice de barajas">
          ⌂<span className="larga"> Inicio</span>
        </button>
        <SelectorBarajas
          barajas={barajas}
          mazoActivo={mazoActivo}
          nombreMazo={nombreMazo}
          icono={iconoMazo}
          onMazo={onMazo}
          onInicio={onInicio}
        />
        <div style={{ marginLeft: "auto" }}>
          <MenuUsuario usuario={usuario} avatarUrl={avatarUrl} onLogout={onLogout} />
        </div>
      </div>

      <div className="barra-fila">
        {/* Multiselección: cada chip suma o resta su tipo; "Todas" es el estado
            en que no hay ninguno elegido, no un chip más que compita con ellos. */}
        <div className="chips">
          <button
            className={"chip" + (!filtro.length ? " activa" : "")}
            onClick={() => onFiltro([])}
          >
            Todas <em>{total}</em>
          </button>
          {tipos.map(({ id, n }) => (
            <button
              key={id}
              className={"chip" + (filtro.includes(id) ? " activa" : "")}
              aria-pressed={filtro.includes(id)}
              onClick={() =>
                onFiltro(filtro.includes(id) ? filtro.filter((t) => t !== id) : [...filtro, id])
              }
            >
              {etiquetaTipo(id)} <em>{n}</em>
            </button>
          ))}
        </div>
      </div>

      <div className="barra-fila acciones">
        <button className="btn btn-mini" onClick={onIndice} title="Ver todas las cartas de la baraja">
          ☰<span className="larga"> Índice</span>
        </button>
        <Buscador cartas={cartas} onIr={onIr} />
        <div className="contador">
          <b className="acento">{seleccionadas}</b>
          <span className="larga"> de {total} para imprimir</span>
          <span className="corta">/{total}</span>
          {filtro.length > 0 && <span className="tenue larga"> · viendo {visibles}</span>}
        </div>
        <button className="btn btn-primario" onClick={onImprimir} disabled={!seleccionadas}>
          Imprimir…
        </button>
      </div>
    </header>
  );
}
