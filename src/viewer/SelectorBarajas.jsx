// Selector de baraja de la barra: un botón con la baraja abierta y, debajo, un
// popup con el mismo árbol que la portada (tipo de baraja → barajas). Sustituye
// a la tira de botones que había antes, que crecía con cada baraja publicada
// hasta necesitar scroll propio.
//
// Los grupos son <details> nativos: colapsan y responden al teclado sin código.
// El que contiene la baraja abierta viene desplegado, porque el motivo habitual
// de abrir esto es saltar a una baraja vecina.

import { useIconoBarajaUrl } from "../assets.js";
import { agruparPorTipo } from "../data/tipos-baraja.js";
import useCierreExterno from "./useCierreExterno.js";

export default function SelectorBarajas({ barajas, mazoActivo, nombreMazo, icono, onMazo, onInicio }) {
  const { ref, abierto, cerrar, alternar } = useCierreExterno();
  const grupos = agruparPorTipo(barajas);

  const elegir = (clave) => {
    cerrar();
    onMazo(clave);
  };

  return (
    <div className="selector" ref={ref}>
      <button
        className="selector-boton"
        type="button"
        onClick={alternar}
        aria-haspopup="menu"
        aria-expanded={abierto}
        title="Cambiar de baraja"
      >
        <img src={icono} alt="" />
        <span className="selector-nombre">{nombreMazo}</span>
        <span className="selector-flecha" aria-hidden="true">▾</span>
      </button>

      {abierto && (
        <div className="selector-popup" role="menu">
          <button
            className="selector-inicio"
            type="button"
            role="menuitem"
            onClick={() => { cerrar(); onInicio(); }}
          >
            ⌂ Índice de barajas
          </button>
          <div className="selector-cuerpo">
            {grupos.map((g) => (
              <details key={g.id} open={g.barajas.some((b) => b.clave === mazoActivo)}>
                <summary>
                  {g.label} <em>{g.barajas.length}</em>
                </summary>
                <ul>
                  {g.barajas.map((b) => (
                    <OpcionBaraja
                      key={b.clave}
                      baraja={b}
                      activa={b.clave === mazoActivo}
                      onElegir={() => elegir(b.clave)}
                    />
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OpcionBaraja({ baraja, activa, onElegir }) {
  const icono = useIconoBarajaUrl(baraja.icono);
  return (
    <li>
      <button
        className={activa ? "activa" : ""}
        type="button"
        role="menuitem"
        onClick={onElegir}
      >
        <img src={icono} alt="" />
        <span className="selector-item-nombre">{baraja.nombre}</span>
        <em>{baraja.cartas.length}</em>
      </button>
    </li>
  );
}
