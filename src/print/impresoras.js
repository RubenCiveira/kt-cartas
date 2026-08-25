// Calibración de impresora: cuánto hay que mover las hojas de DORSO para que
// caigan detrás de su anverso.
//
// Casi ninguna impresora centra el papel igual por las dos caras, y el desvío
// es de la máquina, no del mazo ni del formato: la misma corrección vale para
// todas las barajas y no cambia hasta que se cambia de impresora. Por eso se
// guarda como una lista de perfiles con nombre en localStorage, en vez de
// pedirla en cada tirada. El diálogo del navegador no puede hacer esto: sus
// márgenes se aplican a TODAS las páginas por igual, y aquí hace falta mover
// solo una de las dos caras.
//
// El desvío se guarda en milímetros, con el signo en la dirección en la que hay
// que MOVER el dorso: si el dorso sale 7 mm a la izquierda de donde debería,
// x = 7 lo devuelve a su sitio.

export const STORAGE_KEY_IMPRESORAS = "kt-impresoras-v1";
export const STORAGE_KEY_IMPRESORA = "kt-impresora-v1";

// Sin perfil elegido no se corrige nada, que es lo correcto mientras no se haya
// medido una impresora concreta.
export const SIN_DESVIO = { x: 0, y: 0 };

// Un desvío de más de dos centímetros no es una impresora descentrada, es un
// dedazo en el campo; y dejaría el dorso fuera del papel sin decir por qué.
const TOPE_MM = 20;

const aMm = (n) => {
  const v = typeof n === "number" ? n : parseFloat(n);
  if (!isFinite(v)) return 0;
  return Math.max(-TOPE_MM, Math.min(TOPE_MM, Math.round(v * 10) / 10));
};

const normalizar = (p, i) => ({
  id: String(p && p.id ? p.id : "imp-" + i),
  nombre: String((p && p.nombre) || "Impresora"),
  x: aMm(p && p.x),
  y: aMm(p && p.y),
});

export function leerImpresoras() {
  try {
    const crudo = JSON.parse(localStorage.getItem(STORAGE_KEY_IMPRESORAS));
    return Array.isArray(crudo) ? crudo.map(normalizar) : [];
  } catch (e) {
    // Un localStorage ilegible (o bloqueado) no puede tumbar la impresión:
    // sin perfiles se imprime sin corregir, como se hacía antes.
    return [];
  }
}

export function guardarImpresoras(lista) {
  try {
    localStorage.setItem(STORAGE_KEY_IMPRESORAS, JSON.stringify(lista.map(normalizar)));
  } catch (e) {
    /* sin persistencia se sigue pudiendo imprimir; solo no se recuerda */
  }
}

export function leerImpresoraActiva() {
  try {
    return localStorage.getItem(STORAGE_KEY_IMPRESORA) || "";
  } catch (e) {
    return "";
  }
}

export function guardarImpresoraActiva(id) {
  try {
    localStorage.setItem(STORAGE_KEY_IMPRESORA, id || "");
  } catch (e) {
    /* ídem */
  }
}

export const desvioDe = (impresoras, id) => impresoras.find((p) => p.id === id) || SIN_DESVIO;

export function nuevaImpresora(lista) {
  const usados = new Set(lista.map((p) => p.nombre));
  let n = lista.length + 1;
  while (usados.has("Impresora " + n)) n += 1;
  return { id: "imp-" + Date.now().toString(36), nombre: "Impresora " + n, x: 0, y: 0 };
}

export { aMm as milimetros };
