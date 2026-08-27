// Mazos de impresión: listas de cartas tomadas de varias barajas, para imprimir
// de una tacada las cartas sueltas que hagan falta —una que se ha estropeado,
// otra que se ha quedado desactualizada— sin sacar la baraja entera de cada una
// ni ir de una en una desperdiciando media hoja cada vez.
//
// Un mazo guarda REFERENCIAS, no copias: "faccion:novitiates|c12" es la carta
// c12 de esa baraja. Así una carta que se corrija en su JSON sale corregida al
// imprimir el mazo, que es justo lo que se quiere cuando lo que estás
// reimprimiendo son actualizaciones. El precio es que una carta puede
// desaparecer de su baraja; entonces la referencia queda huérfana y se enseña
// como tal en vez de desaparecer sin avisar.

import { useCallback, useEffect, useState } from "react";

import {
  borrarMazoImpresion,
  crearMazoImpresion,
  guardarMazoImpresion,
  listarMazosImpresion,
} from "../appwrite.js";

// La clave de baraja lleva dos puntos ("faccion:novitiates"), así que el
// separador tiene que ser otra cosa; la barra vertical no aparece en ninguna
// de las dos partes.
const SEP = "|";

export const refDe = (claveBaraja, cartaId) => `${claveBaraja}${SEP}${cartaId}`;

export function partirRef(ref) {
  const i = String(ref).lastIndexOf(SEP);
  if (i === -1) return { clave: "", cartaId: "" };
  return { clave: ref.slice(0, i), cartaId: ref.slice(i + 1) };
}

// Una fila de Appwrite tal cual llega, con lo que nos importa y nada más.
export const normalizarMazo = (row) => ({
  id: row.$id,
  nombre: row.nombre || "Sin nombre",
  refs: Array.isArray(row.cartas) ? row.cartas : [],
  actualizado: row.actualizado || row.$updatedAt || "",
});

// Resuelve las referencias contra las barajas cargadas. Devuelve una entrada
// por referencia, en el orden en que se guardaron, y las que no se pueden
// resolver vienen con `carta: null`: la pantalla las enseña como huérfanas y
// deja quitarlas, en vez de que el mazo mienta sobre cuántas cartas tiene.
export function resolverRefs(refs, barajas) {
  return refs.map((ref) => {
    const { clave, cartaId } = partirRef(ref);
    const baraja = barajas.find((b) => b.clave === clave) || null;
    const carta = baraja ? baraja.cartas.find((c) => c.id === cartaId) || null : null;
    return { ref, clave, cartaId, baraja, carta };
  });
}

// Las cartas listas para imprimir. Cada una se lleva de dónde vino en `origen`,
// porque su dorso tiene que seguir siendo el de SU baraja: en un mazo mezclado
// no hay un nombre ni un icono común que poner detrás.
//
// El id se reescribe con la referencia entera: dos barajas distintas usan "c3"
// las dos, y las hojas de impresión (y React) necesitan ids únicos dentro de la
// tirada.
export function cartasParaImprimir(refs, barajas) {
  return resolverRefs(refs, barajas)
    .filter((e) => e.carta)
    .map((e) => ({
      ...e.carta,
      id: e.ref,
      origen: { clave: e.clave, nombre: e.baraja.nombre, icono: e.baraja.icono || "" },
    }));
}

// Estado de los mazos del usuario. Vive aquí y no en App.jsx porque son cinco
// operaciones que van todas contra la misma fila y comparten el mismo manejo de
// error; en el componente serían cinco `try` repetidos.
//
// Cada operación escribe primero en Appwrite y luego en el estado, con lo que
// la fila devuelta por el servidor es la que manda. Es más lento que pintar
// antes de guardar, pero un mazo que parece guardado y no lo está es peor: te
// enteras en la otra máquina, cuando ya no puedes arreglarlo.
export function useMazosImpresion(usuario) {
  const [mazos, setMazos] = useState([]);
  const [estado, setEstado] = useState("inicial");
  const [error, setError] = useState("");
  const userId = usuario ? usuario.$id : "";

  useEffect(() => {
    if (!userId) {
      setMazos([]);
      setEstado("inicial");
      return;
    }
    let cancelado = false;
    setEstado("cargando");
    listarMazosImpresion(userId)
      .then((rows) => {
        if (cancelado) return;
        setMazos(rows.map(normalizarMazo));
        setEstado("listo");
      })
      .catch((e) => {
        if (cancelado) return;
        // Un fallo aquí no puede tumbar el visor: las barajas se ven igual y
        // los mazos de impresión son una función aparte.
        setError(mensaje(e, "No se pudieron cargar los mazos de impresión."));
        setEstado("error");
      });
    return () => { cancelado = true; };
  }, [userId]);

  const conError = useCallback(async (texto, fn) => {
    setError("");
    try {
      return await fn();
    } catch (e) {
      setError(mensaje(e, texto));
      return null;
    }
  }, []);

  const crear = useCallback(
    (nombre, refs = []) =>
      conError("No se pudo crear el mazo.", async () => {
        const row = await crearMazoImpresion(userId, nombre.trim() || "Mazo de impresión", refs);
        const mazo = normalizarMazo(row);
        setMazos((lista) => [mazo, ...lista]);
        return mazo;
      }),
    [conError, userId]
  );

  const guardar = useCallback(
    (id, datos) =>
      conError("No se pudo guardar el mazo.", async () => {
        const row = await guardarMazoImpresion(id, datos);
        const mazo = normalizarMazo(row);
        setMazos((lista) => lista.map((m) => (m.id === id ? mazo : m)));
        return mazo;
      }),
    [conError]
  );

  const borrar = useCallback(
    (id) =>
      conError("No se pudo borrar el mazo.", async () => {
        await borrarMazoImpresion(id);
        setMazos((lista) => lista.filter((m) => m.id !== id));
        return true;
      }),
    [conError]
  );

  // Añadir es lo que más se usa —una carta suelta desde el detalle— y por eso
  // no duplica: un mazo de impresión es una lista de qué reimprimir, y pedir
  // dos veces la misma carta es un descuido, no una intención.
  const anadir = useCallback(
    (id, nuevas) => {
      const mazo = mazos.find((m) => m.id === id);
      if (!mazo) return Promise.resolve(null);
      const refs = [...mazo.refs, ...nuevas.filter((r) => !mazo.refs.includes(r))];
      if (refs.length === mazo.refs.length) return Promise.resolve(mazo);
      return guardar(id, { cartas: refs });
    },
    [guardar, mazos]
  );

  const quitar = useCallback(
    (id, ref) => {
      const mazo = mazos.find((m) => m.id === id);
      if (!mazo) return Promise.resolve(null);
      return guardar(id, { cartas: mazo.refs.filter((r) => r !== ref) });
    },
    [guardar, mazos]
  );

  return { mazos, estado, error, limpiarError: () => setError(""), crear, guardar, borrar, anadir, quitar };
}

function mensaje(e, porDefecto) {
  const texto = String((e && e.message) || "");
  // La tabla puede no estar creada todavía en el servidor (falta un push de la
  // configuración); decirlo ahorra buscar el fallo en el sitio equivocado.
  if (/table|collection/i.test(texto) && /not be found|not found/i.test(texto)) {
    return "Falta la tabla print_decks en Appwrite: publica la configuración de app-write.";
  }
  return texto || porDefecto;
}
