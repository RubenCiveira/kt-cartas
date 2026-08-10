// Vocabulario de los *tipos de baraja*. No confundir con `tipos.js`, que
// clasifica las cartas de dentro de una baraja: aquí se clasifican las barajas
// enteras, que es lo que ordena la portada y el selector de la barra.
//
// El tipo lo declara cada JSON en su raíz (`"tipo": "equipos"`). Una baraja sin
// el campo, o con un valor que no está en esta lista, cuenta como "reglas": es
// lo que eran todas antes de que existiera la clasificación.

export const TIPOS_BARAJA = [
  {
    id: "reglas",
    label: "Reglas",
    titulo: "Reglas del juego",
    descripcion: "El núcleo: operaciones, glosario y mapas.",
  },
  {
    id: "equipos",
    label: "Equipos",
    titulo: "Equipos y bandas",
    descripcion: "Una baraja por facción, con sus operativos, ardides y equipo.",
  },
  {
    id: "campanas",
    label: "Campañas",
    titulo: "Campañas",
    descripcion: "Narrativas y operaciones enlazadas partida a partida.",
  },
];

export const TIPO_BARAJA_DEFECTO = "reglas";

const IDS = new Set(TIPOS_BARAJA.map((t) => t.id));

export const esTipoBaraja = (id) => IDS.has(id);

export const normalizarTipoBaraja = (id) => (IDS.has(id) ? id : TIPO_BARAJA_DEFECTO);

export const etiquetaTipoBaraja = (id) =>
  (TIPOS_BARAJA.find((t) => t.id === id) || {}).label || id;

// Agrupa las barajas en el orden canónico de TIPOS_BARAJA, y deja fuera los
// tipos que ahora mismo no tienen ninguna baraja publicada: la portada enseña
// lo que hay en el bucket, no el catálogo teórico.
export function agruparPorTipo(barajas) {
  return TIPOS_BARAJA
    .map((t) => ({ ...t, barajas: barajas.filter((b) => b.tipo === t.id) }))
    .filter((g) => g.barajas.length);
}
