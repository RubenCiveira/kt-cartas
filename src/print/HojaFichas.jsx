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
          <Ficha key={f.clave} ficha={f} mm={(f.mm || porDefecto) + SANGRE_MM * 2} />
        ))}
      </div>
      <p className="pie-fichas">
        Recorta por la línea. Para que aguanten sobre la mesa, imprime en cartulina
        o pega la hoja sobre cartón fino antes de recortar.
      </p>
    </div>
  );
}

function Ficha({ ficha, mm }) {
  const url = useAssetUrl(ficha.imagen);
  if (ficha.texto) return <FichaTexto ficha={ficha} mm={mm} />;
  return (
    <div className="ficha-corte" style={{ width: mm + "mm", height: mm + "mm" }}>
      {url && <img src={url} alt={ficha.nombre} />}
    </div>
  );
}

// La silueta imita la de las fichas oficiales de facción: un segmento de corona
// circular —lados abiertos hacia abajo, cantos superior e inferior algo
// curvados— con las esquinas redondeadas. El redondeo lo da el propio trazo
// (`linejoin: round`), que además hace de borde visible y de línea de corte.
// `invertido` es el segundo juego —tinta plena, número en blanco—, que es lo
// que separa a un bando del otro sin gastar color.
const SEGMENTO = "M26,12 Q50,7 74,12 L92,88 Q50,94 8,88 Z";

function FichaTexto({ ficha, mm }) {
  const tinta = "#1A1A1A";
  return (
    <div className="ficha-corte" style={{ width: mm + "mm", height: mm + "mm" }}>
      <svg className="ficha-texto" viewBox="0 0 100 100" role="img" aria-label={ficha.nombre}>
        <path
          d={SEGMENTO}
          fill={ficha.invertido ? tinta : "#FFFFFF"}
          stroke={tinta}
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <text
          x="50"
          y="57"
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
