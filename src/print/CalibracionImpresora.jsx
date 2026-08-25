// El bloque de calibración del diálogo de imprimir: elegir impresora y ajustar
// cuánto se mueve su cara de dorso. Lo comparten el diálogo del mazo y el de
// resúmenes, porque el desvío es de la máquina y no de lo que se imprima.

import { milimetros, nuevaImpresora } from "./impresoras.js";

export default function CalibracionImpresora({
  impresoras,
  impresoraId,
  onImpresora,
  onImpresoras,
  // Qué cara se mueve, para nombrarla como la ve el usuario en cada diálogo.
  queSeMueve = "los dorsos",
}) {
  const activa = impresoras.find((p) => p.id === impresoraId) || null;

  const editar = (campo, valor) =>
    onImpresoras(
      impresoras.map((p) => (p.id === impresoraId ? { ...p, [campo]: valor } : p))
    );

  const anadir = () => {
    const p = nuevaImpresora(impresoras);
    onImpresoras([...impresoras, p]);
    onImpresora(p.id);
  };

  const borrar = () => {
    onImpresoras(impresoras.filter((p) => p.id !== impresoraId));
    onImpresora("");
  };

  return (
    <div className="calibracion">
      <div className="calibracion-fila">
        <div style={{ flex: 1, minWidth: 180 }}>
          <label>Impresora</label>
          <select value={impresoraId} onChange={(e) => onImpresora(e.target.value)}>
            <option value="">Sin calibrar (0 mm)</option>
            {impresoras.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} — {p.x} / {p.y} mm
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-mini" onClick={anadir}>Añadir impresora</button>
        {activa && (
          <button className="btn btn-mini" onClick={borrar}>Borrar</button>
        )}
      </div>

      {activa ? (
        <div className="calibracion-fila">
          <div style={{ flex: 1, minWidth: 140 }}>
            <label>Nombre</label>
            <input
              type="text"
              value={activa.nombre}
              onChange={(e) => editar("nombre", e.target.value)}
            />
          </div>
          <div className="campo-mm">
            <label>→ Dcha. mm</label>
            <input
              type="number"
              step="0.5"
              value={activa.x}
              onChange={(e) => editar("x", milimetros(e.target.value))}
            />
          </div>
          <div className="campo-mm">
            <label>↓ Abajo mm</label>
            <input
              type="number"
              step="0.5"
              value={activa.y}
              onChange={(e) => editar("y", milimetros(e.target.value))}
            />
          </div>
        </div>
      ) : (
        <p className="parrafo tenue" style={{ margin: "8px 0 0" }}>
          Sin calibrar se imprime tal cual. Añade una impresora si al voltear el papel{" "}
          {queSeMueve} no caen justo detrás.
        </p>
      )}

      <p className="parrafo tenue" style={{ margin: "8px 0 0" }}>
        Cómo medir: imprime una tirada corta a doble cara, mira un folio al trasluz y comprueba
        cuánto se ha ido {queSeMueve} respecto a su cara. Escribe aquí ese desplazamiento en la
        dirección en la que hay que <b>devolverlos</b>: si salen 7 mm a la izquierda, pon 7 en
        «derecha». Se guarda en este navegador y vale para todas las barajas.
      </p>
    </div>
  );
}
