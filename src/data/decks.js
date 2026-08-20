import { Query } from "appwrite";

import { fetchJsonFile, listBucketFiles } from "../appwrite.js";
import { normalizarTipoBaraja } from "./tipos-baraja.js";

export const CLAVE_DEFECTO = "juego:base";

const CAMPOS_CARTA = {
  tipo: "tacop",
  arquetipo: "ninguno",
  titulo: "",
  revelado: "",
  cuerpo: "",
  pv: "",
  flavor: "",
  coste: "",
  continuacion: false,
  foto: "",
};

// Normaliza una carta del JSON: rellena los campos que falten, traduce los
// nombres antiguos y le da un id estable (posición dentro de la baraja).
export function migrarCarta(c, i) {
  const base = { ...CAMPOS_CARTA, ...c, id: c.id || "c" + i };
  if (c.tipo === "ploy") base.tipo = "ploy_estrategico";
  if (c.tipo === "continuacion") {
    base.tipo = "custom";
    base.continuacion = true;
  }
  base.stats = c.stats || { apl: "", mov: "", salv: "", her: "" };
  base.armas = (Array.isArray(c.armas) ? c.armas : []).map((a, j) => ({
    id: a.id || "a" + j,
    nombre: a.nombre || "",
    atq: a.atq || a.ataque || "",
    imp: a.imp || a.impacto || "",
    dn: a.dn || a["daño"] || a.dano || "",
    reglas: a.reglas || "",
  }));
  let acciones = c.acciones;
  if (acciones && !Array.isArray(acciones)) acciones = [acciones];
  base.acciones = (acciones || []).map((a, j) => ({
    id: a.id || "ac" + j,
    nombre: a.nombre || a.titulo || "",
    coste: a.coste || "",
    texto: a.texto || "",
  }));
  return base;
}

// La carta que enseña las fichas de la baraja.
//
// Sin ella los tokens no aparecen en ninguna parte del visor: solo existen como
// una casilla del diálogo de imprimir, y para cuando la marcas ya estás
// decidiendo qué imprimir, sin haber visto lo que hay. La carta se genera a
// partir del bloque `fichas` del JSON, así que ninguna baraja tiene que
// mantener a mano una lista que ya ha declarado.
//
// Las barajas de banda traen una carta de guía con una imagen de relleno donde
// debería ir esa lista; cuando aparece, la generada ocupa su sitio en vez de
// añadirse detrás, para no dejar dos cartas con el mismo título.
export const ID_GUIA_FICHAS = "fichas";

function esGuiaDeFichas(carta) {
  return /fichas\s+y\s+marcadores/i.test(carta.titulo || "");
}

export function conGuiaDeFichas(cartas, fichas) {
  const lista = Array.isArray(fichas && fichas.lista) ? fichas.lista : [];
  if (!lista.length) return cartas;

  const porDefecto = (fichas && fichas.mm) || 20;
  const piezas = lista.map((f, i) => ({
    id: "f" + i,
    nombre: f.nombre || "",
    imagen: f.imagen || "",
    texto: f.texto || "",
    invertido: f.invertido === true,
    cantidad: f.cantidad || 1,
    mm: f.mm || porDefecto,
  }));
  const copias = piezas.reduce((n, f) => n + f.cantidad, 0);

  const guia = migrarCarta({
    id: ID_GUIA_FICHAS,
    tipo: "custom",
    arquetipo: "ninguno",
    titulo: "FICHAS Y MARCADORES",
    revelado: `${piezas.length} piezas distintas · ${copias} para recortar`,
    fichas: piezas,
  });

  const i = cartas.findIndex(esGuiaDeFichas);
  if (i === -1) return [...cartas, guia];
  return cartas.map((c, j) => (j === i ? { ...guia, id: c.id } : c));
}

// Una hoja de resumen: A5 apaisada, a una o dos columnas, con bloques de texto
// escritos en el mismo mini-lenguaje que el cuerpo de las cartas (ver
// cards/texto.jsx): "# " encabezado, "> " y "- " viñetas y "|" tablas.
export function migrarHoja(h, i) {
  const columnas = h.columnas === 1 || h.columnas === 2 ? h.columnas : 2;
  return {
    id: h.id || "h" + i,
    titulo: h.titulo || "",
    subtitulo: h.subtitulo || "",
    columnas,
    // Encoge cuerpo e interlínea de toda la hoja (ver print/HojaA5.jsx).
    compacto: h.compacto === true,
    pie: h.pie || "",
    bloques: (Array.isArray(h.bloques) ? h.bloques : []).map((b, j) => ({
      id: b.id || "b" + j,
      titulo: b.titulo || "",
      texto: b.texto || "",
      // Un bloque con coste se pinta como el recuadro de acción de las cartas,
      // no como un bloque de texto: el título pasa a ser el nombre de la acción.
      coste: b.coste || "",
      // Un bloque ancho ocupa las dos columnas: es para las tablas, que a media
      // hoja salen ilegibles. En hojas de una columna no cambia nada.
      ancho: b.ancho === true,
    })),
  };
}

export async function cargarBarajasRemotas() {
  const files = await listBucketFiles([Query.equal("mimeType", "application/json")]);
  const jsonFiles = files
    .filter((file) => esBaraja(file.$id))
    .sort((a, b) => ordenDeck(a.$id) - ordenDeck(b.$id) || a.$id.localeCompare(b.$id));

  const decks = await Promise.all(jsonFiles.map(async (file) => {
    const data = await fetchJsonFile(file.$id, file.signature || file.$updatedAt || "");
    const id = file.$id.replace(/\.json$/, "").replace(/-deck$/, "");
    const clave = file.$id === "default-deck.json" ? CLAVE_DEFECTO : "faccion:" + id;
    return {
      clave,
      id,
      nombre: data.nombre || id,
      tipo: normalizarTipoBaraja(data.tipo),
      cartas: conGuiaDeFichas((data.cartas || []).map(migrarCarta), data.fichas),
      hojas: (data.hojas || []).map(migrarHoja),
      icono: data.icono || "",
      fichas: data.fichas || null,
    };
  }));

  return decks;
}

export function crearBarajaLocal(data, nombreArchivo) {
  const id = idLocal(data.nombre || nombreArchivo.replace(/\.json$/i, "") || "baraja-local");
  return normalizarBaraja(data, {
    clave: "dev:" + id,
    id,
    nombre: data.nombre || nombreArchivo,
  });
}

// Devuelve null si no hay baraja elegida o la clave no corresponde a ninguna
// publicada. Es un estado normal, no un error: es lo que pinta la portada.
export function resolverMazo(barajas, clave) {
  if (!clave) return null;
  return barajas.find((baraja) => baraja.clave === clave) || null;
}

function esBaraja(id) {
  return (
    id.endsWith("-deck.json") ||
    id.endsWith("-resumen.json")
  );
}

function ordenDeck(id) {
  if (id === "default-deck.json") return 0;
  if (id === "glosario.json") return 1;
  if (id === "mapas-basicos.json") return 2;
  if (id.endsWith("-resumen.json")) return 20;
  return 10;
}

function normalizarBaraja(data, { clave, id, nombre }) {
  return {
    clave,
    id,
    nombre,
    tipo: normalizarTipoBaraja(data.tipo),
    cartas: conGuiaDeFichas((data.cartas || []).map(migrarCarta), data.fichas),
    hojas: (data.hojas || []).map(migrarHoja),
    icono: data.icono || "",
    fichas: data.fichas || null,
  };
}

function idLocal(nombre) {
  return String(nombre)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "baraja-local";
}
