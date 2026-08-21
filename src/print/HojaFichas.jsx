// Hoja de fichas recortables. A diferencia de las cartas, aquí no hay un
// diseño que escalar: cada ficha se imprime a su tamaño real sobre la mesa,
// que es el que declara la baraja en su bloque "fichas" (ver README).
//
// Cada ficha lleva un margen de guillotina alrededor y un contorno de corte
// discontinuo, porque recortar justo por el borde del dibujo deja el canto
// pelado y la ficha se ve pequeña al lado de las oficiales.
//
// Una ficha puede traer `imagen` (recorte del PDF) o `texto` (se dibuja aquí).
// Las de texto son para las piezas que no salen de ningún PDF —los números de
// agente— y se pintan con tipografía en vez de con un PNG: a 15 mm un número
// rasterizado se ve sucio, y así no hay 40 imágenes que subir al bucket.
//
// Las de texto salen con la silueta de segmento de las fichas oficiales de
// facción, salvo que pidan `forma: "circulo"`.

import { useAssetUrl } from "../assets.js";

const SANGRE_MM = 1.2; // margen alrededor del dibujo, para el corte

export default function HojaFichas({ fichas, nombreMazo }) {
  if (!fichas || !fichas.lista || !fichas.lista.length) return null;
  const porDefecto = fichas.mm || 20;

  // Una entrada por copia: la hoja es lo que vas a recortar, no un inventario
  const copias = fichas.lista.flatMap((f, fi) =>
    Array.from({ length: f.cantidad || 1 }, (_, i) => ({ ...f, clave: fi + "-" + i }))
  );

  return (
    <div className="hoja hoja-fichas">
      <div className="etiqueta-hoja">
        {nombreMazo} · fichas y marcadores · tamaño real · imprimir al 100 %
      </div>
      <div className="rejilla-fichas">
        {copias.map((f) => (
          <PiezaFicha key={f.clave} ficha={f} mm={(f.mm || porDefecto) + SANGRE_MM * 2} corte />
        ))}
      </div>
      <p className="pie-fichas">
        Recorta por la línea. Para que aguanten sobre la mesa, imprime en cartulina
        o pega la hoja sobre cartón fino antes de recortar.
      </p>
    </div>
  );
}

// Una pieza suelta, del tamaño que se le pida. La exporta también la carta de
// guía (`cards/GuiaFichas.jsx`), que enseña las mismas piezas más pequeñas y
// sin línea de corte: ahí no se recorta nada, solo se mira. Por eso `corte` es
// una opción y no lo que hace el componente siempre.
export function PiezaFicha({ ficha, mm, corte }) {
  const url = useAssetUrl(ficha.imagen);
  const clase = corte ? "ficha-corte" : "ficha-guia";
  if (ficha.texto) return <FichaTexto ficha={ficha} mm={mm} clase={clase} />;
  return (
    <div className={clase} style={{ width: mm + "mm", height: mm + "mm" }}>
      {url && <img src={url} alt={ficha.nombre} />}
    </div>
  );
}

// La silueta por defecto imita la de las fichas oficiales de facción: un
// segmento de corona circular —lados abiertos hacia abajo, cantos superior e
// inferior algo curvados— con las esquinas redondeadas. El redondeo lo da el
// propio trazo (`linejoin: round`), que además hace de borde visible y de línea
// de corte.
//
// `forma: "circulo"` cambia esa silueta por un disco. Es para las piezas que
// representan un punto del tablero y no una ficha de estado que acompaña a un
// operativo —los puntos de despliegue de JcE—: sobre la mesa se leen como
// marcadores, no como parte de una miniatura. El segmento sigue siendo lo que
// sale si la ficha no pide nada.
//
// `invertido` es el segundo juego —tinta plena, número en blanco—, que es lo
// que separa a un bando del otro sin gastar color, y vale para las dos formas.
const SEGMENTO = "M26,12 Q50,7 74,12 L92,88 Q50,94 8,88 Z";

function FichaTexto({ ficha, mm, clase }) {
  const tinta = "#1A1A1A";
  const redonda = ficha.forma === "circulo";
  const relleno = ficha.invertido ? tinta : "#FFFFFF";
  return (
    <div className={clase} style={{ width: mm + "mm", height: mm + "mm" }}>
      <svg className="ficha-texto" viewBox="0 0 100 100" role="img" aria-label={ficha.nombre}>
        {redonda ? (
          <circle cx="50" cy="50" r="45" fill={relleno} stroke={tinta} strokeWidth="6" />
        ) : (
          <path
            d={SEGMENTO}
            fill={relleno}
            stroke={tinta}
            strokeWidth="6"
            strokeLinejoin="round"
          />
        )}
        <text
          x="50"
          /* El segmento tiene la masa abajo, así que su número baja un poco
             para quedar ópticamente centrado; el disco ya está centrado. */
          y={redonda ? "50" : "57"}
          textAnchor="middle"
          dominantBaseline="central"
          fill={ficha.invertido ? "#FFFFFF" : tinta}
        >
          {ficha.texto}
        </text>
      </svg>
    </div>
  );
}
