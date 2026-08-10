// Narración de cartas con la síntesis de voz del navegador.
//
// Dos piezas: convertir una carta en frases legibles en voz alta (el texto de
// las cartas está pensado para leerse con los ojos: tablas, viñetas, "3+",
// "4/6", comillas de pulgadas…) y un hook que las va diciendo y avisa al
// terminar para que quien llame pase a la siguiente carta.

import { useEffect, useRef } from "react";

export const HAY_VOZ = typeof window !== "undefined" && "speechSynthesis" in window;

const IDIOMA = "es-ES";

// "3+" → "3 o más"; se usa en salvación, impacto y en el texto libre
const masQueMenos = (t) =>
  t.replace(/(\d)\s*\+/g, "$1 o más").replace(/(\d)\s*-(?=\s|$|[.,;)])/g, "$1 o menos");

// Las pulgadas van como comillas dobles pegadas al número
const pulgadas = (t) => t.replace(/(\d)\s*"/g, "$1 pulgadas");

// Los costes se escriben "1PM" / "2PA"
const puntos = (t) =>
  t
    .replace(/(\d+)\s*PM\b/g, (_, n) => `${n} ${n === "1" ? "punto" : "puntos"} de mando`)
    .replace(/(\d+)\s*PA\b/g, (_, n) => `${n} ${n === "1" ? "punto" : "puntos"} de acción`);

// Normaliza un trozo de texto de carta para decirlo en voz alta
function decible(texto) {
  if (!texto) return "";
  let t = String(texto);
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, " "); // imágenes embebidas
  t = pulgadas(t);
  t = puntos(t);
  t = masQueMenos(t);
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

// Daño se escribe "4/6": normal y crítico
const dano = (v) => {
  const m = String(v || "").match(/^\s*(\S+)\s*\/\s*(\S+)\s*$/);
  return m ? `${masQueMenos(m[1])} normal, ${masQueMenos(m[2])} crítico` : decible(v);
};

// Una línea de tabla ("| a | b | c") se dice como celdas separadas por comas
const filaTabla = (l) =>
  l.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim()).filter(Boolean).join(", ");

// Convierte el cuerpo de una carta (con su mini-markdown) en frases sueltas.
// Una frase por línea, y las líneas muy largas se parten por puntos: las voces
// del navegador se atragantan con textos de varios párrafos y así además se
// puede cortar la narración a mitad de carta sin esperar.
function frasesDeCuerpo(texto) {
  const salida = [];
  for (const bruta of (texto || "").split("\n")) {
    const l = bruta.trim();
    if (!l || l === "[columna]") continue;
    let linea = l;
    if (linea.startsWith("|")) linea = filaTabla(linea);
    else if (linea.startsWith("# ")) linea = linea.slice(2);
    else if (linea.startsWith("- ") || linea.startsWith("> ")) linea = linea.slice(2);
    const dicha = decible(linea);
    if (!dicha) continue;
    if (dicha.length <= 220) {
      salida.push(dicha);
      continue;
    }
    // Partir por frases sin perder el punto final
    const trozos = dicha.match(/[^.:;]+[.:;]?\s*/g) || [dicha];
    let acc = "";
    for (const trozo of trozos) {
      if ((acc + trozo).length > 220 && acc) {
        salida.push(acc.trim());
        acc = "";
      }
      acc += trozo;
    }
    if (acc.trim()) salida.push(acc.trim());
  }
  return salida;
}

// Las frases que se dicen de una carta, en el orden en que se leen a ojo.
export function frasesCarta(carta) {
  if (!carta) return [];
  const f = [];
  const stats = carta.stats || {};
  const armas = Array.isArray(carta.armas) ? carta.armas : [];
  const acciones = Array.isArray(carta.acciones) ? carta.acciones : [];
  const esDatacard = carta.tipo === "datacard";

  if (carta.titulo) f.push(decible(carta.titulo) + ".");
  if (carta.coste) f.push("Coste: " + decible(carta.coste) + ".");

  if (esDatacard && (stats.apl || stats.mov || stats.salv || stats.her)) {
    const partes = [];
    if (stats.apl) partes.push("LPA " + decible(stats.apl));
    if (stats.mov) partes.push("movimiento " + decible(stats.mov));
    if (stats.salv) partes.push("salvación " + decible(stats.salv));
    if (stats.her) partes.push("heridas " + decible(stats.her));
    f.push(partes.join(", ") + ".");
  }

  for (const a of armas) {
    const partes = [decible(a.nombre)];
    if (a.atq) partes.push("ataques " + decible(a.atq));
    if (a.imp) partes.push("impacto " + masQueMenos(String(a.imp)));
    if (a.dn) partes.push("daño " + dano(a.dn));
    let frase = "Arma: " + partes.join(", ") + ".";
    if (a.reglas && a.reglas.trim() !== "-") frase += " Reglas: " + decible(a.reglas) + ".";
    f.push(frase);
  }

  if (carta.revelado) f.push(decible(carta.revelado));
  f.push(...frasesDeCuerpo(carta.cuerpo));

  for (const a of acciones) {
    f.push("Acción: " + decible(a.nombre) + (a.coste ? ", " + decible(a.coste) : "") + ".");
    f.push(...frasesDeCuerpo(a.texto));
  }

  if (carta.pv) {
    f.push("Puntos de victoria.");
    f.push(...frasesDeCuerpo(carta.pv));
  }
  // El flavor de las fichas de datos son las palabras clave del operativo, que
  // sí importan en partida; en el resto de cartas es solo ambientación.
  if (esDatacard && carta.flavor) f.push("Palabras clave: " + decible(carta.flavor) + ".");

  return f;
}

// Voz en español, si el sistema tiene alguna. La lista llega de forma asíncrona
// en varios navegadores, así que se consulta en cada arranque de narración.
function vozEspanola() {
  const voces = window.speechSynthesis.getVoices() || [];
  return (
    voces.find((v) => v.lang && v.lang.replace("_", "-") === IDIOMA) ||
    voces.find((v) => v.lang && v.lang.toLowerCase().startsWith("es")) ||
    null
  );
}

// Narra la carta indicada mientras `activo` sea cierto; al acabarla llama a
// `onFin`. Cambiar de carta con la narración puesta empieza a leer la nueva.
export default function useNarrador({ carta, activo, onFin }) {
  const finRef = useRef(onFin);
  finRef.current = onFin;
  const cartaId = carta ? carta.id : null;

  useEffect(() => {
    if (!HAY_VOZ || !activo || !carta) return;
    const sintesis = window.speechSynthesis;
    const frases = frasesCarta(carta);
    if (!frases.length) {
      const t = setTimeout(() => finRef.current && finRef.current(), 300);
      return () => clearTimeout(t);
    }

    // Si el efecto se rehace (cambio de carta, parada), lo que quede de la
    // narración anterior tiene que callarse sin disparar su "hemos acabado".
    let vigente = true;
    const voz = vozEspanola();

    sintesis.cancel();
    for (let i = 0; i < frases.length; i++) {
      const u = new SpeechSynthesisUtterance(frases[i]);
      u.lang = IDIOMA;
      if (voz) u.voice = voz;
      if (i === frases.length - 1) {
        u.onend = () => {
          if (vigente && finRef.current) finRef.current();
        };
      }
      sintesis.speak(u);
    }

    // Chrome corta la síntesis a los ~15 s si no se la toca; pausar y reanudar
    // periódicamente la mantiene viva sin que se note en el audio.
    const latido = setInterval(() => {
      if (!sintesis.speaking) return;
      sintesis.pause();
      sintesis.resume();
    }, 10000);

    return () => {
      vigente = false;
      clearInterval(latido);
      sintesis.cancel();
    };
    // La carta se identifica por su id: el objeto se recrea en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, cartaId]);
}
