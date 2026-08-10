// Vocabulario compartido de las cartas: tipos, arquetipos y constantes de
// maquetación que usan tanto el anverso como el dorso.

import iconoEquipo from "../icons/equipo.png";
import iconoGambito from "../icons/gambito.png";
import iconoOperacionCritica from "../icons/operacion-critica.png";
import iconoOperacionTactica from "../icons/operacion-tactica.png";
import iconoPersonaje from "../icons/personaje.png";
import iconoReglas from "../icons/reglas.png";
import iconoMapa from "../icons/mapas.png";
import iconoFaccion from "../icons/faccion.png";
import iconoGlosario from "../icons/glosario.png";

export const TIPOS = [
  { id: "tacop", label: "Tac Op" },
  { id: "critop", label: "Crit Op" },
  { id: "primary", label: "Primary Op" },
  { id: "datacard", label: "Datos de personaje" },
  { id: "ploy_estrategico", label: "Ploy Estratégico" },
  { id: "ploy_fuego", label: "Ploy de Fuego" },
  { id: "equipo", label: "Equipo" },
  { id: "custom", label: "Personalizada" },
  { id: "faccion", label: "Regla de facción" },
  { id: "reglas", label: "Reglas" },
  { id: "glosario", label: "Glosario" },
  { id: "mapa", label: "Mapa" },
];

export const etiquetaTipo = (id) => (TIPOS.find((t) => t.id === id) || {}).label || id;

// Color de los recuadros de acción (banda y borde), como en las cartas oficiales
export const COLOR_ACCION = "#C7431F";

// Cartas "de misión": banda negra con el tipo centrado y banda de arquetipo debajo
export const TIPOS_MISION = ["tacop", "critop", "primary"];

// 1pt en mm, para el atributo opcional "compacto" de las cartas
export const PT_MM = 0.3528;

export const ICONOS_DORSO_TIPO = {
  tacop: iconoOperacionTactica,
  critop: iconoOperacionCritica,
  datacard: iconoPersonaje,
  ploy_estrategico: iconoGambito,
  ploy_fuego: iconoGambito,
  equipo: iconoEquipo,
  reglas: iconoReglas,
  glosario: iconoGlosario,
  mapa: iconoMapa,
  faccion: iconoFaccion,
};

export const ARQUETIPOS = [
  { id: "ninguno", label: "— Sin arquetipo —", color: "#5A6B7A", gem: "#8FA3B3" },
  { id: "recon", label: "Reconocimiento", color: "#1F7A6D", gem: "#2FB8A6" },
  { id: "infiltracion", label: "Infiltración", color: "#4B3A78", gem: "#8B6FD0" },
  { id: "seguridad", label: "Seguridad", color: "#8A6414", gem: "#E0A83C" },
  { id: "buscar", label: "Buscar y Destruir", color: "#8A2C2C", gem: "#D9534F" },
];
