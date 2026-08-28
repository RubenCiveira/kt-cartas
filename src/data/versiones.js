// Historial de erratas de una baraja: qué cartas cambiaron, cuándo, y en qué.
//
// El caso de uso es de papel, no de pantalla: tienes la baraja impresa en su
// caja, sale una errata, y la pregunta es **qué cartas hay que volver a
// imprimir**. Reimprimir el mazo entero por tres frases es tinta y tijera de
// más.
//
// Los datos vienen dentro del JSON de la baraja (`version` y `versiones`, ver
// `data/decks.js`), escritos por `versionar-baraja.mjs` en app-write a partir de
// git. Aquí solo se consultan.
//
// Una entrada de `versiones` describe **el salto** a esa fecha, y guarda la
// carta tal como estaba **antes**. Por eso «qué ha cambiado desde la versión que
// imprimí» es la unión de todas las entradas *posteriores* a esa fecha, y el
// «antes» que hay que enseñar es el de la entrada **más antigua** del tramo: es
// el papel que el usuario tiene en la mano.

export function tieneHistorial(baraja) {
  return Boolean(baraja && Array.isArray(baraja.versiones) && baraja.versiones.length);
}

// Las versiones de la baraja de la más reciente a la más antigua, que es como se
// leen en una lista: lo último primero.
export function versionesDescendentes(baraja) {
  return tieneHistorial(baraja) ? [...baraja.versiones].reverse() : [];
}

// Las entradas posteriores a `fecha`. Sin fecha, todas: es lo que hay que
// enseñar cuando no consta que la baraja se haya impreso nunca.
export function versionesDesde(baraja, fecha) {
  if (!tieneHistorial(baraja)) return [];
  if (!fecha) return [...baraja.versiones];
  return baraja.versiones.filter((v) => v.fecha.localeCompare(fecha) > 0);
}

// Funde varias versiones en una sola lista de cartas a reimprimir.
//
// Una carta tocada en dos erratas seguidas sale **una vez**, con la unión de los
// campos y con el `anterior` de la primera: lo que importa no es cada paso
// intermedio, sino la diferencia entre el papel impreso y la carta de ahora.
export function cartasAfectadas(baraja, entradas) {
  const porId = new Map();
  const cartas = baraja.cartas || [];

  for (const version of entradas) {
    for (const cambio of version.cambios) {
      const previo = porId.get(cambio.id);
      if (previo) {
        previo.campos = [...new Set([...previo.campos, ...cambio.campos])].sort();
        previo.versiones.push(version.fecha);
        continue;
      }
      porId.set(cambio.id, {
        id: cambio.id,
        titulo: cambio.titulo,
        campos: [...cambio.campos],
        anterior: cambio.anterior,
        actual: cartas.find((c) => c.id === cambio.id) || null,
        versiones: [version.fecha],
      });
    }
  }

  // Una carta que cambió y **después se retiró** no hay que reimprimirla: se
  // quita del taco. Se marca como baja para poder decirlo, en vez de que
  // desaparezca de la lista sin explicación.
  //
  // La carta se busca en `retiradas`, que es donde `data/decks.js` aparta las
  // que llevan la marca; `baja.carta` es el respaldo para las que se borraron
  // del JSON en vez de marcarlas, y de las que no queda otra copia.
  const retiradas = baraja.retiradas || [];
  const bajas = [];
  for (const version of entradas) {
    for (const baja of version.bajas) {
      porId.delete(baja.id);
      const carta = retiradas.find((c) => c.id === baja.id) || baja.carta || null;
      bajas.push({ id: baja.id, titulo: baja.titulo || carta?.titulo || "", carta, version: version.fecha });
    }
  }

  const altas = [];
  for (const version of entradas) {
    for (const alta of version.altas) {
      const carta = cartas.find((c) => c.id === alta.id);
      if (carta) altas.push({ ...alta, carta, version: version.fecha });
    }
  }

  return {
    cambiadas: [...porId.values()].filter((c) => c.actual),
    // Una carta cuyo id ya no está en la baraja: el historial y las cartas se
    // han desincronizado (una baraja reeditada a mano). Se enseña para que se
    // note, en lugar de descontarla en silencio.
    huerfanas: [...porId.values()].filter((c) => !c.actual),
    altas,
    bajas,
  };
}

const ETIQUETAS = {
  titulo: "el título",
  revelado: "el subtítulo",
  cuerpo: "el texto",
  pv: "los puntos de victoria",
  flavor: "las palabras clave",
  coste: "el coste",
  stats: "los atributos",
  armas: "las armas",
  acciones: "las acciones",
  foto: "la foto",
  tipo: "el tipo",
  arquetipo: "el arquetipo",
};

export function describirCampos(campos) {
  const nombres = campos.map((c) => ETIQUETAS[c] || c);
  if (nombres.length <= 1) return nombres[0] || "";
  return nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1];
}

// Empareja dos listas de armas o acciones por nombre, con la posición como
// respaldo. El nombre es lo estable: una errata cambia el ATQ de «Colmillos»,
// no lo renombra. Recolocar la lista sin el nombre marcaría todas las filas.
function indicePorNombre(lista) {
  const mapa = new Map();
  lista.forEach((x, i) => {
    const k = (x.nombre || "").trim().toLowerCase();
    if (!mapa.has(k)) mapa.set(k, []);
    mapa.get(k).push(i);
  });
  return mapa;
}

function filasCambiadas(antes, ahora, claves) {
  const cambiadas = new Set();
  const porNombre = indicePorNombre(antes);
  ahora.forEach((fila, i) => {
    const cola = porNombre.get((fila.nombre || "").trim().toLowerCase());
    const previa = cola && cola.length ? antes[cola.shift()] : antes[i];
    // Sin pareja es una fila nueva, y una fila nueva también hay que verla.
    if (!previa) return cambiadas.add(i);
    if (claves.some((k) => (previa[k] || "") !== (fila[k] || ""))) cambiadas.add(i);
  });
  return cambiadas;
}

const CAMPOS_SIMPLES = ["titulo", "revelado", "cuerpo", "pv", "flavor", "coste", "foto"];
const CLAVES_ARMA = ["nombre", "atq", "imp", "dn", "reglas"];
const CLAVES_ACCION = ["nombre", "coste", "texto"];
const CLAVES_STAT = ["apl", "mov", "salv", "her"];

// Qué partes de la carta hay que resaltar al pintarla junto a su versión
// anterior. Lo consume `CartaFace` por su prop `resaltar`.
//
// Se calcula sobre las **dos** cartas y se pasa el mismo objeto a las dos, para
// que un arma retirada se marque en la vieja y una añadida en la nueva sin
// tener que llevar dos resaltados distintos.
export function resaltadoDe(anterior, actual) {
  if (!anterior || !actual) return null;
  const campos = new Set(CAMPOS_SIMPLES.filter((k) => (anterior[k] || "") !== (actual[k] || "")));

  const statsA = anterior.stats || {};
  const statsB = actual.stats || {};
  const stats = new Set(CLAVES_STAT.filter((k) => (statsA[k] || "") !== (statsB[k] || "")));
  if (stats.size) campos.add("stats");

  const armasA = anterior.armas || [];
  const armasB = actual.armas || [];
  const accionesA = anterior.acciones || [];
  const accionesB = actual.acciones || [];

  return {
    campos,
    stats,
    // Cada lado marca sus propias filas: la vieja se compara contra la nueva y
    // al revés, así que una fila que solo existe en un lado sale resaltada ahí.
    armas: filasCambiadas(armasA, armasB, CLAVES_ARMA),
    armasAnterior: filasCambiadas(armasB, armasA, CLAVES_ARMA),
    acciones: filasCambiadas(accionesA, accionesB, CLAVES_ACCION),
    accionesAnterior: filasCambiadas(accionesB, accionesA, CLAVES_ACCION),
  };
}

// El mismo resaltado visto desde la carta antigua: intercambia las listas de
// filas, porque `resaltadoDe` las calcula desde la nueva.
export function paraAnterior(resaltado) {
  if (!resaltado) return null;
  return {
    ...resaltado,
    armas: resaltado.armasAnterior,
    acciones: resaltado.accionesAnterior,
  };
}
