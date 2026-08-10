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

export async function cargarBarajasRemotas() {
  const files = await listBucketFiles([Query.equal("mimeType", "application/json")]);
  const jsonFiles = files
    .filter((file) => esBaraja(file.$id))
    .sort((a, b) => ordenDeck(a.$id) - ordenDeck(b.$id) || a.$id.localeCompare(b.$id));

  const decks = await Promise.all(jsonFiles.map(async (file) => {
    const data = await fetchJsonFile(file.$id);
    const id = file.$id.replace(/\.json$/, "").replace(/-deck$/, "");
    const clave = file.$id === "default-deck.json" ? CLAVE_DEFECTO : "faccion:" + id;
    return {
      clave,
      id,
      nombre: data.nombre || id,
      tipo: normalizarTipoBaraja(data.tipo),
      cartas: (data.cartas || []).map(migrarCarta),
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
  return id === "default-deck.json" || id === "glosario.json" || id === "mapas-basicos.json" || id.endsWith("-deck.json");
}

function ordenDeck(id) {
  if (id === "default-deck.json") return 0;
  if (id === "glosario.json") return 1;
  if (id === "mapas-basicos.json") return 2;
  return 10;
}

function normalizarBaraja(data, { clave, id, nombre }) {
  return {
    clave,
    id,
    nombre,
    tipo: normalizarTipoBaraja(data.tipo),
    cartas: (data.cartas || []).map(migrarCarta),
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
