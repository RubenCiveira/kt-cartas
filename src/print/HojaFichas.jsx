// Hoja de fichas recortables. A diferencia de las cartas, aquí no hay un
// diseño que escalar: cada ficha se imprime a su tamaño real sobre la mesa,
// que es el que declara la baraja en su bloque "fichas" (ver README).
//
// Cada ficha lleva un margen de guillotina alrededor y un contorno de corte
// discontinuo, porque recortar justo por el borde del dibujo deja el canto
// pelado y la ficha se ve pequeña al lado de las oficiales.

import { useAssetUrl } from "../assets.js";

const SANGRE_MM = 1.2; // margen alrededor del dibujo, para el corte

export default function HojaFichas({ fichas, nombreMazo }) {
  if (!fichas || !fichas.lista || !fichas.lista.length) return null;
  const porDefecto = fichas.mm || 20;

  // Una entrada por copia: la hoja es lo que vas a recortar, no un inventario
  const copias = fichas.lista.flatMap((f) =>
    Array.from({ length: f.cantidad || 1 }, (_, i) => ({ ...f, clave: f.imagen + "-" + i }))
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
  return (
    <div className="ficha-corte" style={{ width: mm + "mm", height: mm + "mm" }}>
      {url && <img src={url} alt={ficha.nombre} />}
    </div>
  );
}
