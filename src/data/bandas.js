// Una entrada por copia de operativo, con identidad propia para su futuro
// historial. Se guardan referencias a las cartas, no fotos ni reglas del mazo.
export const MAX_NOMBRE_BANDA = 120;
export const MAX_NOMBRE_OPERADOR = 160;

export function seleccionDeBanda(banda, operativos) {
  const seleccion = { cuantos: {}, nombres: {}, ids: {}, faltantes: [] };
  for (const miembro of banda?.operadores || []) {
    const op = operativos.find((op) => op.cartaId === miembro.cartaId);
    if (!op) {
      seleccion.faltantes.push(miembro);
      continue;
    }
    seleccion.cuantos[op.titulo] = (seleccion.cuantos[op.titulo] || 0) + 1;
    (seleccion.nombres[op.titulo] ||= []).push(miembro.nombre);
    (seleccion.ids[op.titulo] ||= []).push(miembro.id);
  }
  return seleccion;
}

export function agruparBandas(bandas, barajas) {
  const grupos = new Map();
  for (const banda of bandas) {
    if (!grupos.has(banda.faccion)) {
      const baraja = barajas.find((b) => b.clave === banda.faccion);
      grupos.set(banda.faccion, { faccion: banda.faccion, baraja, bandas: [] });
    }
    grupos.get(banda.faccion).bandas.push(banda);
  }
  return [...grupos.values()];
}

export function normalizarBanda(row) {
  return {
    id: row.$id,
    nombre: row.nombre,
    faccion: row.faccion,
    familia: row.familia || "",
    operadores: (row.operadores || []).map((op) => JSON.parse(op)),
  };
}

export function datosDeBanda({ nombre, faccion, familia = "", operadores }) {
  if (typeof nombre !== "string" || !nombre.trim() || nombre.trim().length > MAX_NOMBRE_BANDA) {
    throw new Error(`El nombre de la banda debe tener entre 1 y ${MAX_NOMBRE_BANDA} caracteres.`);
  }
  if (typeof faccion !== "string" || !faccion || faccion.length > 64) {
    throw new Error("Falta una facción válida para la banda.");
  }
  if (typeof familia !== "string" || familia.length > 120) {
    throw new Error("La familia de fotos no es válida.");
  }
  if (!Array.isArray(operadores) || !operadores.length) {
    throw new Error("Selecciona al menos un operativo para guardar la banda.");
  }
  const ids = new Set();
  return {
    nombre: nombre.trim(),
    faccion,
    familia,
    operadores: operadores.map(({ id, cartaId, titulo, nombre }) => {
      if (typeof id !== "string" || !id || id.length > 36 || ids.has(id)
        || typeof cartaId !== "string" || !cartaId || cartaId.length > 64
        || typeof titulo !== "string" || !titulo.trim() || titulo.length > MAX_NOMBRE_OPERADOR
        || typeof nombre !== "string" || !nombre.trim() || nombre.trim().length > MAX_NOMBRE_OPERADOR) {
        throw new Error("Cada operativo debe tener un identificador único, una carta y un nombre válido.");
      }
      ids.add(id);
      return JSON.stringify({ id, cartaId, titulo, nombre: nombre.trim() });
    }),
  };
}
