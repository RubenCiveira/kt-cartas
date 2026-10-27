import { useId, useState } from "react";
import { MAX_NOMBRE_BANDA } from "../data/bandas.js";

export default function DialogoGuardarBanda({ cuantos, onGuardar, onCerrar }) {
  const idNombre = useId();
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar(e) {
    e.preventDefault();
    if (guardando || !nombre.trim()) return;
    setGuardando(true);
    setError("");
    try {
      await onGuardar(nombre.trim());
    } catch (e) {
      setError(e.type === "table_not_found" || e.type === "collection_not_found"
        ? "Falta la tabla bandas en Appwrite. Publica la configuración del backend."
        : e.message || "No se pudo guardar la banda. Inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-fondo" onClick={() => !guardando && onCerrar()}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${idNombre}-titulo`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === "Escape" && !guardando) onCerrar(); }}
        onSubmit={guardar}
      >
        <div className="modal-cabecera">
          <h2 id={`${idNombre}-titulo`}>Guardar como banda</h2>
          <button type="button" className="btn btn-mini" disabled={guardando} onClick={onCerrar}>Cerrar</button>
        </div>
        <p className="parrafo">Se guardarán los {cuantos} operativos seleccionados con sus nombres. Solo tú podrás acceder a esta banda.</p>
        <label htmlFor={idNombre}>Nombre de la banda</label>
        <input
          id={idNombre}
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={MAX_NOMBRE_BANDA}
          required
          autoFocus
          disabled={guardando}
        />
        {error && <p className="aviso-filtro" role="alert">{error}</p>}
        <div className="modal-pie">
          <button type="button" className="btn" disabled={guardando} onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn btn-primario" disabled={guardando || !nombre.trim()}>
            {guardando ? "Guardando…" : "Guardar banda"}
          </button>
        </div>
      </form>
    </div>
  );
}
