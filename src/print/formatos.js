// El diseño base de la carta mide 70 × 121 mm (tamaño "tarot" oficial). Los
// demás formatos son ese mismo bloque escalado, para que un mazo impreso a
// destiempo no acabe mezclando cartas de dos anchuras distintas.

export const STORAGE_KEY_FORMATO = "kt-formato-v1";

export const FORMATOS = [
  { id: "tarot", label: "Tarot (oficial)", esc: 1 },
  { id: "mini", label: "Mazo pequeño", esc: 66 / 70 },
];

export const FORMATO_DEF = FORMATOS[0];

export const getFormato = (id) => FORMATOS.find((f) => f.id === id) || FORMATO_DEF;

// Medidas reales de corte de un formato, en mm y ya redondeadas
export const medidas = (f) => ({
  ancho: (70 * f.esc).toFixed(1).replace(/\.0$/, ""),
  alto: (121 * f.esc).toFixed(1).replace(/\.0$/, ""),
});

export const etiquetaFormato = (f) => {
  const m = medidas(f);
  return `${f.label} · ${m.ancho} × ${m.alto} mm`;
};

export function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// Invierte cada fila para que, al imprimir a doble cara con giro por el borde
// largo, cada dorso caiga detrás de su anverso.
export function espejarFilas(grupo, porFila) {
  const relleno = [...grupo];
  while (relleno.length % porFila !== 0) relleno.push(null);
  const filas = chunk(relleno, porFila).map((f) => [...f].reverse());
  return filas.flat();
}

// Reparte la selección en hojas A4: las fichas de datos son apaisadas y van
// en sus propias hojas.
export function repartirHojas(cartas) {
  const fichas = cartas.filter((c) => c.tipo === "datacard");
  const normales = cartas.filter((c) => c.tipo !== "datacard");
  return { paginas: chunk(normales, 4), paginasFichas: chunk(fichas, 4) };
}
