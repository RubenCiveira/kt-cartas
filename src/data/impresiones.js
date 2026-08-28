// Qué barajas tienes impresas, y en qué versión.
//
// El taco de cartas que hay en la caja no lleva nada escrito, así que meses
// después no hay forma de saber si es de antes o de después de la última
// errata. Esto es ese apunte: una fila por tirada en la tabla `printed_decks`
// (ver `appwrite.js`), y encima el cálculo de lo que falta por reimprimir.
//
// Se guarda una fila **por tirada** y no un estado por baraja porque las dos
// cosas que se imprimen son distintas: el mazo entero cuando empiezas con una
// facción, y cartas sueltas cuando sale una errata. Con una fila por baraja, la
// segunda pisaría a la primera y dejaría de constar que el resto del mazo sigue
// siendo el viejo.

import { useCallback, useEffect, useState } from "react";

import { borrarImpresion, listarImpresiones, registrarImpresion } from "../appwrite.js";
import { cartasAfectadas, versionesDesde } from "./versiones.js";

export const normalizarImpresion = (row) => ({
  id: row.$id,
  baraja: row.baraja || "",
  version: row.version || "",
  cartas: Array.isArray(row.cartas) ? row.cartas : [],
  completa: row.completa === true,
  impreso: row.impreso || row.$createdAt || "",
});

const masReciente = (a, b) => (String(a).localeCompare(String(b)) >= 0 ? a : b);

// Lo que consta impreso de una baraja. `version` es la de la última tirada
// **completa**: es la única que dice algo del mazo entero. Las tiradas sueltas
// se acumulan aparte, en `cartas`, con la versión en que salió cada carta.
export function estadoImpreso(impresiones, clave) {
  const filas = impresiones.filter((i) => i.baraja === clave);
  if (!filas.length) return null;

  let version = "";
  for (const fila of filas) if (fila.completa) version = masReciente(version, fila.version);

  const cartas = new Map();
  for (const fila of filas) {
    for (const id of fila.cartas) {
      cartas.set(id, masReciente(cartas.get(id) || "", fila.version));
    }
  }

  return {
    version,
    cartas,
    ultima: filas.reduce((max, f) => masReciente(max, f.impreso), ""),
    tiradas: filas.length,
  };
}

// Las cartas de una baraja que el papel tiene desactualizadas.
//
// Parte de la última tirada completa y descuenta lo que se haya reimprimido
// suelto después: si en agosto reimprimiste solo las cuatro cartas de la errata,
// esas ya están bien aunque el resto del mazo siga siendo de junio. Es la
// diferencia entre un recordatorio útil y uno que te manda reimprimir dos veces
// lo mismo.
export function pendientesDeImprimir(baraja, impresiones) {
  const estado = estadoImpreso(impresiones, baraja.clave);
  // Sin constancia de haberla impreso no hay nada desactualizado: no hay papel
  // con el que comparar. La pantalla lo dice así en vez de marcarlo todo.
  if (!estado) return { desconocido: true, version: "", cartas: [] };

  const entradas = versionesDesde(baraja, estado.version);
  const { cambiadas } = cartasAfectadas(baraja, entradas);

  const cartas = cambiadas.filter((c) => {
    const impresa = estado.cartas.get(c.id);
    if (!impresa) return true;
    // La carta cuenta como al día si se reimprimió en la última versión en que
    // cambió, o después.
    const ultimoCambio = c.versiones[c.versiones.length - 1];
    return String(impresa).localeCompare(String(ultimoCambio)) < 0;
  });

  return { desconocido: false, version: estado.version, ultima: estado.ultima, cartas };
}

// Estado de las impresiones del usuario. Mismo patrón que `useMazosImpresion`:
// escribe en Appwrite primero y en el estado después, para que no parezca
// apuntado lo que no lo está.
export function useImpresiones(usuario) {
  const [impresiones, setImpresiones] = useState([]);
  const [estado, setEstado] = useState("inicial");
  const [error, setError] = useState("");
  const userId = usuario ? usuario.$id : "";

  useEffect(() => {
    if (!userId) {
      setImpresiones([]);
      setEstado("inicial");
      return;
    }
    let cancelado = false;
    setEstado("cargando");
    listarImpresiones(userId)
      .then((rows) => {
        if (cancelado) return;
        setImpresiones(rows.map(normalizarImpresion));
        setEstado("listo");
      })
      .catch((e) => {
        if (cancelado) return;
        // Igual que con los mazos: que falle el registro no puede impedir ver ni
        // imprimir barajas, que es lo principal.
        setError(mensaje(e, "No se pudo cargar el registro de barajas impresas."));
        setEstado("error");
      });
    return () => { cancelado = true; };
  }, [userId]);

  const registrar = useCallback(
    async (datos) => {
      if (!userId) return null;
      setError("");
      try {
        const row = await registrarImpresion(userId, datos);
        const impresion = normalizarImpresion(row);
        setImpresiones((lista) => [impresion, ...lista]);
        return impresion;
      } catch (e) {
        setError(mensaje(e, "No se pudo apuntar la impresión."));
        return null;
      }
    },
    [userId]
  );

  const borrar = useCallback(async (id) => {
    setError("");
    try {
      await borrarImpresion(id);
      setImpresiones((lista) => lista.filter((i) => i.id !== id));
      return true;
    } catch (e) {
      setError(mensaje(e, "No se pudo borrar el apunte."));
      return false;
    }
  }, []);

  return { impresiones, estado, error, limpiarError: () => setError(""), registrar, borrar };
}

function mensaje(e, porDefecto) {
  const texto = String((e && e.message) || "");
  if (/table|collection/i.test(texto) && /not be found|not found/i.test(texto)) {
    return "Falta la tabla printed_decks en Appwrite: publica la configuración de app-write.";
  }
  return texto || porDefecto;
}
