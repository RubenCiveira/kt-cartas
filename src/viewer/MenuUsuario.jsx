// Menú de la cuenta: avatar en la barra y, al pulsarlo, quién eres y la salida.
// Vive aparte porque lo usan las dos cabeceras, la de la portada y la del visor.

import useCierreExterno from "./useCierreExterno.js";

export default function MenuUsuario({ usuario, avatarUrl, onLogout }) {
  const { ref, abierto, alternar } = useCierreExterno();

  if (!usuario) return null;

  const nombre = usuario.name || usuario.email || "Usuario";

  return (
    <div className="usuario-menu" ref={ref}>
      <button
        className="usuario-boton"
        type="button"
        onClick={alternar}
        aria-haspopup="menu"
        aria-expanded={abierto}
        title="Menú de usuario"
      >
        <img src={avatarUrl} alt="" />
        <span className="larga">{nombre}</span>
      </button>
      {abierto && (
        <div className="usuario-popup" role="menu">
          <div className="usuario-resumen">
            <img src={avatarUrl} alt="" />
            <div>
              <strong>{nombre}</strong>
              <span>{usuario.email}</span>
            </div>
          </div>
          <button className="btn ancho" type="button" onClick={onLogout} role="menuitem">
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
