// Ampliación: la capa de lectura. Lo que se ve en el visor son maquetaciones
// pensadas para el papel —una hoja A5, una plancha de fichas—, y en pantalla
// caben reducidas, donde el texto no se lee. Esta capa las muestra a lo ancho
// de la ventana y deja que la página se desplace hacia abajo, que es como se
// lee un manual; no sustituye a la vista previa de impresión, la evita.
//
// Solo pone el marco (fondo, barra de cierre y el desplazamiento). Quien la usa
// decide qué mete dentro y a qué escala: la hoja de resumen se ajusta al ancho,
// las fichas van a tamaño real porque ya son pequeñas.

import { useEffect } from "react";

export default function Ampliacion({ titulo, nota, children, onCerrar }) {
  useEffect(() => {
    const tecla = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);

  return (
    <div className="ampliacion" onClick={onCerrar}>
      {/* El clic en el fondo cierra; dentro de la caja no, o cerraría al
          intentar seleccionar texto o al arrastrar para desplazarse. */}
      <div className="ampliacion-caja" onClick={(e) => e.stopPropagation()}>
        <div className="ampliacion-barra">
          <strong>{titulo}</strong>
          <button className="btn btn-mini" onClick={onCerrar}>Cerrar</button>
        </div>
        {children}
        {nota && <p className="ampliacion-nota tenue">{nota}</p>}
      </div>
    </div>
  );
}
