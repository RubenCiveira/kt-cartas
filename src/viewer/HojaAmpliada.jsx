// Una hoja de resumen a lo ancho de la pantalla, para leerla.
//
// La hoja se pinta siempre a su tamaño de diseño (140 mm) y se escala en
// bloque, igual que en la previsualización; lo único distinto es de dónde sale
// la escala: aquí no es un 55% fijo sino lo que quepa de ancho. Se mide el
// elemento sin escalar (`transform` no cambia offsetWidth) en vez de convertir
// milímetros a píxeles a mano, que depende del zoom del navegador.

import { useLayoutEffect, useRef, useState } from "react";

import HojaA5, { HOJA_ALTO, HOJA_ANCHO } from "../print/HojaA5.jsx";
import Ampliacion from "./Ampliacion.jsx";

export default function HojaAmpliada({ hoja, onCerrar }) {
  const cajaRef = useRef(null);
  const hojaRef = useRef(null);
  // Escala y alto van juntos: el lienzo recorta la hoja escalada, así que su
  // alto es el ancho disponible en la proporción de la hoja. En el primer
  // render todavía no hay medida y se pinta sin escalar ni recortar.
  const [medida, setMedida] = useState(null);

  useLayoutEffect(() => {
    const medir = () => {
      const caja = cajaRef.current;
      const el = hojaRef.current;
      if (!caja || !el || !el.offsetWidth) return;
      const ancho = caja.clientWidth;
      setMedida({ escala: ancho / el.offsetWidth, alto: ancho * (HOJA_ALTO / HOJA_ANCHO) });
    };
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  return (
    <Ampliacion titulo={hoja.titulo || "Sin título"} onCerrar={onCerrar}>
      <div className="ampliacion-lienzo" ref={cajaRef} style={{ height: medida ? medida.alto : undefined }}>
        <div ref={hojaRef} style={{ transform: medida ? `scale(${medida.escala})` : undefined }}>
          <HojaA5 hoja={hoja} />
        </div>
      </div>
    </Ampliacion>
  );
}
