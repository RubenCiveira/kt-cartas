// Un desplegable abierto se cierra al pulsar fuera o con Escape. Es el mismo
// gesto en el menú de usuario y en el selector de barajas, así que el estado y
// los dos escuchadores viven aquí en vez de duplicarse en cada popup.
//
// Los escuchadores solo se enganchan mientras está abierto: cerrado no hay nada
// que cerrar y no tiene sentido pagar un handler global por cada popup.

import { useCallback, useEffect, useRef, useState } from "react";

export default function useCierreExterno() {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrarSiFuera = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setAbierto(false);
    };
    const cerrarConEscape = (event) => {
      if (event.key === "Escape") setAbierto(false);
    };
    document.addEventListener("pointerdown", cerrarSiFuera);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("pointerdown", cerrarSiFuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [abierto]);

  const cerrar = useCallback(() => setAbierto(false), []);
  const alternar = useCallback(() => setAbierto((v) => !v), []);

  return { ref, abierto, cerrar, alternar };
}
