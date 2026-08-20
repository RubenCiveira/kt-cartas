// Visor de una baraja de resúmenes. No hay tira de cartas ni detalle: una hoja
// de resumen no se hojea, se mira entera y se imprime, así que la pantalla es
// la previsualización a escala de las hojas y poco más.

import HojaA5, { HOJA_ALTO, HOJA_ANCHO } from "../print/HojaA5.jsx";
import MenuUsuario from "./MenuUsuario.jsx";

export default function VisorResumenes({
  hojas,
  nombreMazo,
  seleccionadas,
  onAlternar,
  onTodas,
  onNinguna,
  onImprimir,
  onAmpliar,
  hayFichas,
  onFichas,
  onInicio,
  usuario,
  avatarUrl,
  onLogout,
}) {
  const marcadas = hojas.filter((h) => seleccionadas.includes(h.id));

  return (
    <div className="app-visor resumenes">
      <header className="barra">
        <div className="barra-fila">
          <button className="btn btn-mini" onClick={onInicio}>Inicio</button>
          <strong>{nombreMazo}</strong>
          <span className="tenue larga">
            {hojas.length} hoja(s) A5 · {HOJA_ANCHO} × {HOJA_ALTO} mm
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            {hayFichas && (
              <button className="btn btn-mini" onClick={onFichas} title="Ver las fichas a tamaño real">
                Fichas
              </button>
            )}
            <button className="btn btn-mini" onClick={onTodas}>Todas</button>
            <button className="btn btn-mini" onClick={onNinguna}>Ninguna</button>
            <button
              className="btn btn-primario btn-mini"
              onClick={onImprimir}
              disabled={!marcadas.length}
            >
              Imprimir {marcadas.length} hoja(s)
            </button>
            <MenuUsuario usuario={usuario} avatarUrl={avatarUrl} onLogout={onLogout} />
          </div>
        </div>
      </header>

      <div className="resumenes-cuerpo">
        {!hojas.length && <p className="tenue">Esta baraja no declara ninguna hoja de resumen.</p>}
        {hojas.map((h) => {
          const activa = seleccionadas.includes(h.id);
          return (
            <div key={h.id} className={"resumen-item" + (activa ? " activa" : "")}>
              <label className="resumen-marca">
                <input type="checkbox" checked={activa} onChange={() => onAlternar(h.id)} />
                <span>{h.titulo || "Sin título"}</span>
                <span className="tenue">{h.columnas === 1 ? "una columna" : "dos columnas"}</span>
              </label>
              {/* La casilla decide qué se imprime; el lienzo, en cambio, abre
                  la hoja para leerla. Son dos gestos distintos a propósito:
                  mirar una hoja no debería cambiar la tirada. */}
              <button
                type="button"
                className="resumen-lienzo"
                onClick={() => onAmpliar(h.id)}
                title="Abrir la hoja para leerla"
              >
                <HojaA5 hoja={h} />
              </button>
            </div>
          );
        })}
      </div>

      <p className="resumenes-nota tenue">
        Se imprimen dos hojas por cada A4 <b>apaisado</b>, para cortar por la vertical central.
        Comprueba que el diálogo del navegador dice «horizontal»; imprime al 100 %, sin «ajustar a
        la página», y con gráficos de fondo activados.
      </p>
    </div>
  );
}
