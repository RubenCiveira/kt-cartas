// Anverso de la carta. Se pinta siempre al tamaño de diseño (70 × 121 mm, o
// 121 × 70 mm en las fichas de datos); quien la muestre la escala en bloque.

import { ARQUETIPOS, COLOR_ACCION, PT_MM, TIPOS, TIPOS_MISION } from "../data/tipos.js";
import { useAssetUrl } from "../assets.js";
import { ICONOS_ARQ, IconoArquetipo } from "./iconos.jsx";
import GuiaFichas from "./GuiaFichas.jsx";
import { conMarcas, LineasTexto } from "./texto.jsx";

// Marca de «esto ha cambiado», para comparar una carta con su versión anterior
// (ver viewer/DialogoVersiones.jsx). Es `outline` y no `border` ni `background`
// a propósito: el outline no ocupa sitio, así que la carta resaltada se maqueta
// **exactamente igual** que sin resaltar. Si el resaltado moviera una línea, la
// comparación entre las dos cartas dejaría de ser fiable, que es para lo único
// que existe.
const RESALTE = {
  outline: "0.5mm solid #E0876B",
  outlineOffset: "0.3mm",
  borderRadius: "0.8mm",
};

export default function CartaFace({ carta, resaltar = null }) {
  // `seccion` es un campo de la carta ("cuerpo", "armas"…); con `fila`, además,
  // la posición dentro de esa lista. Sin `resaltar` no marca nada, que es el
  // caso de todo el visor salvo el diálogo de versiones.
  const marca = (seccion, fila) => {
    if (!resaltar) return null;
    if (fila === undefined) return resaltar.campos?.has(seccion) ? RESALTE : null;
    return resaltar[seccion]?.has(fila) ? RESALTE : null;
  };
  const marcaStat = (clave) => (resaltar?.stats?.has(clave) ? RESALTE : null);

  const arqConocido = ARQUETIPOS.find((a) => a.id === carta.arquetipo);
  const arq = arqConocido || ARQUETIPOS[0];
  // Si el arquetipo no es uno de los conocidos pero hay texto (p.ej. "Volkus" en
  // las cartas de mapa), se muestra ese texto tal cual en vez de "— Sin arquetipo —".
  const arqLabel = arqConocido ? arqConocido.label : carta.arquetipo;
  const tipo = TIPOS.find((t) => t.id === carta.tipo) || TIPOS[TIPOS.length - 1];
  const esDatacard = carta.tipo === "datacard";
  const esContinuacion = carta.continuacion === true;
  const esMision = TIPOS_MISION.includes(carta.tipo);
  const esReglas = carta.tipo === "reglas" || carta.tipo === "glosario";
  const stats = carta.stats || {};
  const armas = Array.isArray(carta.armas) ? carta.armas : [];
  const acciones = Array.isArray(carta.acciones) ? carta.acciones : [];
  const fotoUrl = useAssetUrl(carta.foto);
  const compacto = Array.isArray(carta.compacto || carta.compactar) ? (carta.compacto || carta.compactar) : [];
  const tam = (seccion, base) =>
    compacto.includes(seccion) ? (parseFloat(base) - 2 * PT_MM).toFixed(2) + "mm" : base;
  const alto = (seccion, base = 1.3) => (compacto.includes(seccion) ? 1.15 : base);
  // En las fichas de datos, el texto del cuerpo a dos columnas (revelado, cuerpo
  // y acciones) se reduce al 85% para densar mejor. No afecta al título, los
  // atributos principales ni la tabla de armas.
  const ESC_CUERPO_FICHA = 0.85;
  // Los recuadros de acción llevan una reducción extra sobre el cuerpo.
  const ESC_ACCION_FICHA = 0.9;
  const tamCuerpo = (seccion, base) => {
    const t = tam(seccion, base);
    return esDatacard ? (parseFloat(t) * ESC_CUERPO_FICHA).toFixed(2) + "mm" : t;
  };
  const tamAccion = (base) =>
    esDatacard ? (parseFloat(base) * ESC_CUERPO_FICHA * ESC_ACCION_FICHA).toFixed(2) + "mm" : base;

  return (
    <div
      style={{
        width: esDatacard ? "121mm" : "70mm",
        height: esDatacard ? "70mm" : "121mm",
        background: "#FFFFFF",
        color: "#1B1F26",
        borderRadius: "2.5mm",
        border: `0.6mm solid ${arq.color}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Barlow', sans-serif",
        boxSizing: "border-box",
        position: "relative",
        zIndex: 0,
        textAlign: "left",
      }}
    >
      {!esContinuacion && esMision && (
        <div style={{ position: "relative" }}>
          <div
            style={{
              background: "#14181F",
              color: "#F5F0E4",
              padding: "2.2mm 2.5mm 2mm",
              textAlign: "center",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 600,
              letterSpacing: "0.1em",
              fontSize: "4.2mm",
              lineHeight: 1,
              textTransform: "uppercase",
            }}
          >
            {tipo.label}
          </div>
          {carta.arquetipo !== "ninguno" && (
            <div
              style={{
                background: arq.color,
                color: "#F5F0E4",
                padding: "1.2mm 2.5mm 1mm",
                textAlign: "center",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 600,
                letterSpacing: "0.1em",
                fontSize: "3.3mm",
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              {arqLabel}
            </div>
          )}
          {carta.arquetipo !== "ninguno" && ICONOS_ARQ[carta.arquetipo] && (
            <div
              style={{
                position: "absolute",
                top: "0.8mm",
                left: "1.8mm",
                width: "13mm",
                height: "13mm",
                borderRadius: "50%",
                background: "#14181F",
                border: "0.6mm solid #F5F0E4",
                boxSizing: "border-box",
                display: "grid",
                placeItems: "center",
                color: "#F5F0E4",
              }}
            >
              <IconoArquetipo id={carta.arquetipo} size="8mm" />
            </div>
          )}
        </div>
      )}

      {!esContinuacion && !esMision && !esDatacard && !esReglas && (
      <>
      <div
        style={{
          background: arq.color,
          color: "#F5F0E4",
          padding: "2.2mm 2.5mm 2mm",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 600,
            letterSpacing: "0.08em",
            fontSize: "4.2mm",
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          {tipo.label}
        </span>
        {carta.coste ? (
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "4mm",
              lineHeight: 1,
              letterSpacing: "0.05em",
              background: "#F5F0E4",
              color: arq.color,
              borderRadius: "1mm",
              padding: "0.4mm 1.8mm 0.3mm",
            }}
          >
            {carta.coste}
          </span>
        ) : carta.arquetipo !== "ninguno" ? (
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "3.6mm",
              lineHeight: 1,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              opacity: 0.9,
            }}
          >
            {arqLabel}
          </span>
        ) : null}
      </div>
      </>
      )}

      {!esContinuacion && !esDatacard && (
      <div
        style={{
          padding: "3.4mm 2.5mm 1mm",
          textAlign: "center",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "4.2mm",
          lineHeight: 1.05,
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          color: "#14181F",
          ...marca("titulo"),
        }}
      >
        {carta.titulo || "SIN TÍTULO"}
      </div>
      )}

      {esDatacard && (
        <div style={{ display: "flex", alignItems: "stretch", gap: "0.8mm", padding: "1.6mm 2mm 1mm" }}>
          <div
            style={{
              flex: 1,
              background: "#14181F",
              color: "#F5F0E4",
              display: "flex",
              alignItems: "center",
              padding: "0 2mm",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "3.4mm",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              borderRadius: "0.8mm 0 0 0.8mm",
              ...marca("titulo"),
            }}
          >
            {carta.titulo || "SIN TÍTULO"}
          </div>
          {fotoUrl && (
            <img src={fotoUrl} alt="" style={{ height: "10mm", alignSelf: "center", flex: "0 0 auto" }} />
          )}
          {[
            { k: "LPA", clave: "apl", v: stats.apl },
            { k: "MOV", clave: "mov", v: stats.mov },
            { k: "SALV", clave: "salv", v: stats.salv },
            { k: "HER", clave: "her", v: stats.her },
          ].map((s, i) => (
            <div
              key={s.k}
              style={{
                flex: "0 0 auto",
                width: "9.5mm",
                background: "#14181F",
                color: "#F5F0E4",
                textAlign: "center",
                padding: "0.9mm 0 0.7mm",
                borderRadius: i === 3 ? "0 0.8mm 0.8mm 0" : 0,
                ...marcaStat(s.clave),
              }}
            >
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "2mm",
                  letterSpacing: "0.06em",
                  color: "#E0876B",
                }}
              >
                {s.k}
              </div>
              <div style={{ fontWeight: 600, fontSize: "3.2mm", lineHeight: 1.1 }}>{s.v || "—"}</div>
            </div>
          ))}
        </div>
      )}

      {esDatacard && armas.length > 0 && (
        <div style={{ padding: "0 2.5mm 1.4mm" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 6.5mm 7mm 8.5mm 1.3fr",
              gap: "0 1mm",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "2.2mm",
              letterSpacing: "0.06em",
              color: "#F5F0E4",
              background: arq.color,
              borderRadius: "1mm 1mm 0 0",
              padding: "0.7mm 1.4mm",
            }}
          >
            <span>NOMBRE</span>
            <span style={{ textAlign: "center" }}>ATQ</span>
            <span style={{ textAlign: "center" }}>IMP.</span>
            <span style={{ textAlign: "center" }}>DAÑO</span>
            <span>REGLAS DE ARMAS</span>
          </div>
          {armas.map((a, i) => (
            <div
              key={a.id || i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 6.5mm 7mm 8.5mm 1.3fr",
                gap: "0 1mm",
                fontSize: "2.6mm",
                padding: "0.7mm 1.4mm",
                background: i % 2 === 0 ? "#F1F1F1" : "#FFFFFF",
                borderLeft: `0.35mm solid ${arq.color}`,
                borderRight: `0.35mm solid ${arq.color}`,
                borderBottom: i === armas.length - 1 ? `0.35mm solid ${arq.color}` : "none",
                borderRadius: i === armas.length - 1 ? "0 0 1mm 1mm" : 0,
                ...marca("armas", i),
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nombre}</span>
              <span style={{ textAlign: "center" }}>{a.atq}</span>
              <span style={{ textAlign: "center" }}>{a.imp}</span>
              <span style={{ textAlign: "center" }}>{a.dn}</span>
              <span>{a.reglas || "-"}</span>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          padding: esContinuacion ? "3mm 2.5mm 0" : "0 2.5mm",
          flex: 1,
          overflow: "hidden",
          ...(esDatacard ? { columnCount: 2, columnGap: "3mm" } : {}),
        }}
      >
        {carta.revelado && (
          <p
            style={{
              fontStyle: esContinuacion ? "normal" : "italic",
              fontWeight: esContinuacion ? 700 : 400,
              fontSize: tamCuerpo("revelado", esContinuacion ? "2.4mm" : "2.7mm"),
              lineHeight: alto("revelado", 1.25),
              margin: "0 0 1.5mm",
              color: "#3A4250",
              ...marca("revelado"),
            }}
          >
            {conMarcas(carta.revelado)}
          </p>
        )}
        {/* El cuerpo no tiene contenedor propio; el resaltado necesita uno.
            Sin marca, el div es transparente y no cambia nada. */}
        <div style={marca("cuerpo") || undefined}>
          <LineasTexto texto={carta.cuerpo} color={arq.color} fontSize={tamCuerpo("cuerpo", "2.8mm")} lineHeight={alto("cuerpo")} />
        </div>
        {/* Solo la lleva la carta que genera `conGuiaDeFichas` (ver data/decks.js) */}
        <GuiaFichas fichas={carta.fichas} />
        {!esDatacard &&
          armas.map((a, i) => (
            <div key={a.id} style={{ margin: "0.8mm 0 1.8mm", ...marca("armas", i) }}>
              <div
                style={{
                  borderTop: "0.5mm solid #14181F",
                  display: "grid",
                  gridTemplateColumns: "1fr 7mm 8mm 9mm",
                  gap: "0 1mm",
                  padding: "0.6mm 0 0.2mm",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "2.4mm",
                  letterSpacing: "0.05em",
                  color: "#14181F",
                }}
              >
                <span>NOMBRE</span>
                <span style={{ textAlign: "center" }}>ATQ</span>
                <span style={{ textAlign: "center" }}>IMP.</span>
                <span style={{ textAlign: "center" }}>DAÑO</span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 7mm 8mm 9mm",
                  gap: "0 1mm",
                  padding: "0.2mm 0 1mm",
                  fontSize: tam("armas", "2.7mm"),
                  fontWeight: 600,
                }}
              >
                <span>
                  <span style={{ color: COLOR_ACCION, marginRight: "0.8mm" }}>▮▮</span>
                  {a.nombre}
                </span>
                <span style={{ textAlign: "center" }}>{a.atq}</span>
                <span style={{ textAlign: "center" }}>{a.imp}</span>
                <span style={{ textAlign: "center" }}>{a.dn}</span>
              </div>
              {a.reglas && (
                <>
                  <div
                    style={{
                      borderTop: "0.5mm solid #14181F",
                      padding: "0.6mm 0 0.2mm",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: "2.4mm",
                      letterSpacing: "0.05em",
                      color: "#14181F",
                    }}
                  >
                    REGLAS DE ARMA
                  </div>
                  <div style={{ fontSize: tam("armas", "2.7mm"), lineHeight: alto("armas") }}>{a.reglas}</div>
                </>
              )}
            </div>
          ))}
        {acciones.map((a, i) => (
          <div
            key={a.id}
            style={{
              margin: esDatacard ? "0.8mm 0 0.8mm" : "1mm 0 1.8mm",
              border: `0.4mm solid ${COLOR_ACCION}`,
              borderRadius: "1mm",
              overflow: "hidden",
              breakInside: "avoid",
              ...marca("acciones", i),
            }}
          >
            <div
              style={{
                background: COLOR_ACCION,
                color: "#F5F0E4",
                display: "flex",
                justifyContent: "space-between",
                gap: "2mm",
                padding: esDatacard ? "0.6mm 1.4mm 0.4mm" : "0.8mm 1.6mm 0.6mm",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: tamAccion("2.9mm"),
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <span>{a.nombre}</span>
              <span style={{ flex: "0 0 auto" }}>{a.coste}</span>
            </div>
            <div style={{ padding: esDatacard ? "0.9mm 1.4mm 0.2mm" : "1.2mm 1.6mm 0.2mm" }}>
              <LineasTexto texto={a.texto} color={COLOR_ACCION} fontSize={tamAccion("2.7mm")} lineHeight={alto("acciones")} />
            </div>
          </div>
        ))}
      </div>

      {carta.pv && (
        <div
          style={{
            margin: "0 2.5mm 1.8mm",
            border: `0.35mm solid ${arq.color}`,
            borderRadius: "1.2mm",
            padding: "1.4mm 1.8mm",
            ...marca("pv"),
          }}
        >
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "2.6mm",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: arq.color,
              marginBottom: "0.6mm",
            }}
          >
            Puntos de victoria
          </div>
          <div style={{ lineHeight: alto("pv") }}>
            <LineasTexto texto={carta.pv} color={arq.color} fontSize={tam("pv", "2.7mm")} lineHeight={alto("pv")} />
          </div>
        </div>
      )}

      {carta.flavor && (
        <div
          style={{
            padding: "0 2.5mm 2.2mm",
            fontSize: tam("flavor", "2.4mm"),
            fontStyle: "italic",
            lineHeight: alto("flavor", 1.25),
            textAlign: "center",
            color: "#5A6270",
            ...marca("flavor"),
          }}
        >
          {conMarcas(carta.flavor)}
        </div>
      )}
    </div>
  );
}
