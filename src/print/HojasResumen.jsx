// Hojas de impresión de los resúmenes: dos A5 verticales por cada A4 apaisado,
// para cortar por la mitad. Vive oculta en el DOM y la revela @media print,
// igual que HojasImpresion. La rotación de la página la pone `estilosResumen`,
// que App.jsx inyecta solo en esta pantalla.

import HojaA5 from "./HojaA5.jsx";
import { chunk } from "./formatos.js";

export default function HojasResumen({ hojas, nombreMazo }) {
  const paginas = chunk(hojas, 2);

  return (
    <div className="hoja-impresion">
      {paginas.map((grupo, i) => (
        <div className="hoja" key={i}>
          <div className="etiqueta-hoja">
            {nombreMazo} · A5 {i + 1}/{paginas.length} · A4 apaisado, al 100 %, cortar por la vertical central
          </div>
          <div className="pagina-a5">
            {grupo.map((h) => (
              <div key={h.id} className="celda-a5">
                <HojaA5 hoja={h} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
