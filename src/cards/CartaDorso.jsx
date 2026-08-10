// Dorso de la carta: emblema de arquetipo, nombre de la baraja e icono de tipo.

import { ARQUETIPOS, ICONOS_DORSO_TIPO, TIPOS, TIPOS_MISION } from "../data/tipos.js";
import { ICONOS_ARQ, IconoArquetipo } from "./iconos.jsx";

// ---------- Dorso ----------
export default function CartaDorso({ carta, nombreMazo, icono }) {
  // Las Tac Ops se eligen en secreto: su dorso es neutro e idéntico para todas,
  // sin color ni emblema de arquetipo que las delate.
  const arqId = carta && carta.tipo !== "tacop" ? carta.arquetipo : "ninguno";
  const arq = ARQUETIPOS.find((a) => a.id === arqId) || ARQUETIPOS[0];
  const tipo = TIPOS.find((t) => t.id === (carta ? carta.tipo : "custom")) || TIPOS[TIPOS.length - 1];
  const conIcono = carta && TIPOS_MISION.includes(carta.tipo) && ICONOS_ARQ[arqId];
  const esFicha = carta && carta.tipo === "datacard";
  const iconoTipo = carta ? ICONOS_DORSO_TIPO[carta.tipo] : null;

  return (
    <div
      style={{
        width: esFicha ? "121mm" : "70mm",
        height: esFicha ? "70mm" : "121mm",
        background: `
          radial-gradient(circle at 50% 42%, rgba(20, 28, 43, 0.14) 0 18mm, transparent 18.5mm),
          linear-gradient(135deg, rgba(31, 122, 109, 0.18), transparent 40%, rgba(90, 107, 122, 0.18)),
          repeating-linear-gradient(45deg, rgba(20, 28, 43, 0.12) 0 0.28mm, transparent 0.28mm 3.2mm),
          #DDE4E8
        `,
        borderRadius: "2.5mm",
        border: `0.4mm solid ${arq.color}`,
        boxSizing: "border-box",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Barlow Condensed', sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "2.6mm",
          border: `0.25mm solid ${arq.color}`,
          borderRadius: "1.6mm",
          opacity: 0.65,
        }}
      />
      {iconoTipo ? (
        <img
          src={iconoTipo}
          alt=""
          style={{
            width: esFicha ? "18mm" : "26mm",
            maxHeight: esFicha ? "18mm" : "26mm",
            objectFit: "contain",
            marginBottom: "6mm",
            opacity: 0.9,
          }}
        />
      ) : conIcono ? (
        <div
          style={{
            width: "18mm",
            height: "18mm",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.62)",
            border: `0.45mm solid ${arq.color}`,
            boxShadow: `0 0 0 0.25mm ${arq.gem}`,
            display: "grid",
            placeItems: "center",
            color: arq.color,
            marginBottom: "6mm",
          }}
        >
          <IconoArquetipo id={carta.arquetipo} size="10.5mm" />
        </div>
      ) : (
        <div
          style={{
            width: "16mm",
            height: "16mm",
            transform: "rotate(45deg)",
            background: "rgba(255, 255, 255, 0.62)",
            border: `0.45mm solid ${arq.color}`,
            boxShadow: `0 0 0 0.25mm ${arq.gem}`,
            marginBottom: "6mm",
          }}
        />
      )}
      <div
        style={{
          color: "#1B1F26",
          fontWeight: 700,
          fontSize: "4.2mm",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        {tipo.label}
      </div>
      <div
        style={{
          color: arq.color,
          fontSize: "2.8mm",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginTop: "1.4mm",
          padding: "0 4mm",
          textAlign: "center",
        }}
      >
        {nombreMazo}
      </div>
      {icono && (
        <img
          src={icono}
          alt=""
          style={{
            width: esFicha ? "16mm" : "22mm",
            maxHeight: esFicha ? "12mm" : "18mm",
            objectFit: "contain",
            marginTop: esFicha ? "2.6mm" : "4mm",
            opacity: 0.9,
          }}
        />
      )}
      {[
        { top: "5mm", left: "5mm" },
        { top: "5mm", right: "5mm" },
        { bottom: "5mm", left: "5mm" },
        { bottom: "5mm", right: "5mm" },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            ...pos,
            width: "2.2mm",
            height: "2.2mm",
            transform: "rotate(45deg)",
            border: `0.35mm solid ${arq.gem}`,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}
