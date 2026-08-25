// El diseño base de la carta mide 70 × 121 mm (tamaño "tarot" oficial). Los
// demás formatos son ese mismo bloque escalado, para que un mazo impreso a
// destiempo no acabe mezclando cartas de dos anchuras distintas.
//
// Un formato declara además cómo se reparte en el folio: `cols` y `filas`. El
// A4 deja 198 × 285 mm imprimibles con los 6 mm de `@page`, y de ahí sale que
// dos columnas de 70 mm entren y tres no. Para tres hace falta bajar a 64 mm.
//
// `celda` es la caja de corte cuando no coincide con el dibujo. "Seis por hoja"
// la usa para dejar 3,2 mm de aire arriba y abajo: el dibujo sigue siendo
// proporcional (64 × 110,6) y lo que crece es el papel alrededor, que es lo que
// necesita una plastificadora térmica para sellar sin comerse el diseño.

import { SIN_DESVIO } from "./impresoras.js";

export const STORAGE_KEY_FORMATO = "kt-formato-v1";

export const FORMATOS = [
  { id: "tarot", label: "Tarot (oficial)", esc: 1, cols: 2, filas: 2 },
  { id: "mini", label: "Mazo pequeño", esc: 66 / 70, cols: 2, filas: 2 },
  {
    id: "seis",
    label: "Seis por hoja",
    esc: 64 / 70,
    cols: 3,
    filas: 2,
    celda: { ancho: 64, alto: 117 },
    // Tres columnas de 64 mm con 3 mm de hueco suman justo los 198 imprimibles.
    // Con 2 quedan 2 mm de holgura, que es lo que salva un redondeo del
    // navegador o una impresora descentrada.
    hueco: 2,
    // Las fichas de datos se giran 90° y comparten tamaño de rejilla con el
    // resto. Se paginan aparte para que el navegador no reescale trabajos con
    // celdas verticales y apaisadas mezcladas en la misma hoja.
    giraFichas: true,
  },
];

export const FORMATO_DEF = FORMATOS[0];

export const getFormato = (id) => FORMATOS.find((f) => f.id === id) || FORMATO_DEF;

const mm = (n) => n.toFixed(1).replace(/\.0$/, "");

// Medidas reales de corte de un formato, en mm y ya redondeadas. Con `celda` se
// corta por la caja, no por el dibujo.
export const medidas = (f) => ({
  ancho: mm(f.celda ? f.celda.ancho : 70 * f.esc),
  alto: mm(f.celda ? f.celda.alto : 121 * f.esc),
});

// Lo que ocupa el dibujo dentro de la caja de corte, si es que sobra papel.
export const medidasDibujo = (f) =>
  f.celda ? { ancho: mm(70 * f.esc), alto: mm(121 * f.esc) } : null;

export const porHoja = (f) => (f.cols || 2) * (f.filas || 2);

// Las variables que la hoja de impresión le pasa al CSS. El aire sobrante se
// reparte arriba y abajo para que el dibujo quede centrado en su recorte.
// `desvio` es la calibración de la impresora elegida (ver print/impresoras.js);
// mueve solo las hojas de dorso, y con {x:0,y:0} no hace nada.
export function variablesFormato(f, desvio = SIN_DESVIO) {
  const v = {
    "--desvio-dorso-x": (desvio.x || 0) + "mm",
    "--desvio-dorso-y": (desvio.y || 0) + "mm",
    "--esc": f.esc,
    // El 0,95 existe para que quepan cuatro fichas apaisadas en un A4. Girada,
    // una ficha tiene que medir lo mismo que sus compañeras de hoja.
    "--esc-ficha": f.giraFichas ? f.esc : f.ficha ? f.ficha.esc : f.esc * 0.95,
    "--cols": f.cols || 2,
    "--cols-ficha": f.ficha ? f.ficha.cols : 1,
  };
  if (f.hueco) v["--hueco"] = f.hueco + "mm";
  // El dorso no tiene variables propias: se imprime con la misma escala y la
  // misma caja que el anverso. Lo único suyo es el desvío de calibración, que es
  // calibración de impresora, no maquetación.
  if (f.celda) {
    v["--celda-ancho"] = f.celda.ancho + "mm";
    v["--celda-alto"] = f.celda.alto + "mm";
    v["--aire"] = (f.celda.alto - 121 * f.esc) / 2 + "mm";
  }
  return v;
}

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
export const porHojaFicha = (f) => (f.ficha ? f.ficha.cols * f.ficha.filas : 4);

export const colsFicha = (f) => (f.ficha ? f.ficha.cols : 1);

export function repartirHojas(cartas, formato = FORMATO_DEF) {
  const fichas = cartas.filter((c) => c.tipo === "datacard");
  const normales = cartas.filter((c) => c.tipo !== "datacard");
  if (formato.giraFichas) {
    return {
      paginas: [...chunk(normales, porHoja(formato)), ...chunk(fichas, porHoja(formato))],
      paginasFichas: [],
    };
  }
  return {
    paginas: chunk(normales, porHoja(formato)),
    paginasFichas: chunk(fichas, porHojaFicha(formato)),
  };
}
