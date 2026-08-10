// El estado de navegación vive en el hash: qué baraja, qué tipos de carta hay
// filtrados y qué carta está resaltada. Así una URL pegada en un chat abre
// exactamente lo mismo que estabas viendo, y recargar no te devuelve al
// principio.
//
//   #baraja=faccion:novitiates&tipos=datacard,equipo&carta=c7
//
// Sin `baraja` estás en la portada, y entonces `grupo` dice qué tipo de baraja
// tiene abierto (reglas, equipos, campañas):
//
//   #grupo=equipos
//
// Se escribe con replaceState a propósito: si cada carta abierta dejara una
// entrada en el historial, el botón «atrás» tardaría veinte pulsaciones en
// sacarte de la aplicación.

import { TIPOS } from "./data/tipos.js";
import { esTipoBaraja } from "./data/tipos-baraja.js";

const IDS_TIPO = new Set(TIPOS.map((t) => t.id));

// Todo lo que viene del hash es texto de fuera: se valida contra lo que existe
// de verdad y lo que no encaje se descarta en silencio.
export function leerHash() {
  const crudo = (window.location.hash || "").replace(/^#/, "");
  const p = new URLSearchParams(crudo);
  const grupo = p.get("grupo");
  return {
    baraja: p.get("baraja") || null,
    grupo: esTipoBaraja(grupo) ? grupo : null,
    tipos: (p.get("tipos") || "").split(",").filter((t) => IDS_TIPO.has(t)),
    carta: p.get("carta") || null,
  };
}

export function componerHash({ baraja, grupo, tipos, carta }) {
  // A mano en vez de con URLSearchParams: sus claves de baraja llevan ":" y
  // acabarían como "%3A", que convierte un enlace legible en un jeroglífico.
  const partes = [];
  if (baraja) partes.push("baraja=" + baraja);
  // El grupo es estado de la portada: con una baraja abierta no pinta nada.
  if (!baraja && grupo) partes.push("grupo=" + grupo);
  if (baraja && tipos && tipos.length) partes.push("tipos=" + tipos.join(","));
  if (baraja && carta) partes.push("carta=" + carta);
  return partes.join("&");
}

export function escribirHash(estado) {
  const nuevo = componerHash(estado);
  if (nuevo === (window.location.hash || "").replace(/^#/, "")) return;
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", pathname + search + (nuevo ? "#" + nuevo : ""));
}
