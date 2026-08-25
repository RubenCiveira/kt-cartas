// Hojas de impresión de los resúmenes: dos A5 verticales por cada A4 apaisado,
// para cortar por la mitad. Vive oculta en el DOM y la revela @media print,
// igual que HojasImpresion. La orientación apaisada de la página la pone
// `estilosResumen`, que App.jsx inyecta solo en esta pantalla.
//
// Con `dobleCara` las páginas PARES salen giradas 180°: son las que se imprimen
// en la segunda pasada, sobre folios que ya llevan una cara y que se han girado
// por el lateral.

import HojaA5 from "./HojaA5.jsx";
import { chunk } from "./formatos.js";
import { SIN_DESVIO } from "./impresoras.js";

// A cara única las hojas caen en el orden natural, de dos en dos. A doble cara
// no: lo que se corta es una TARJETA de dos caras, y las dos caras de una
// tarjeta no están una al lado de la otra, sino una detrás de la otra. Con las
// hojas 1-2-3-4 seguidas, la 2 quedaría a la derecha de la 1 y detrás de ella
// caería la 4; para que detrás de una hoja esté la siguiente hay que repartir
// cada grupo de cuatro entre las dos caras del mismo folio:
//
//     cara A (página 1) → 1 | 3        al cortar: tarjeta izquierda 1/2
//     cara B (página 2) → 4 | 2                   tarjeta derecha   3/4
//
// La cara B va **cruzada** porque además se gira entera (ver .hoja-a5-girada):
// el giro cambia de lado las dos hojas, así que la que ha de caer detrás de la
// izquierda se maqueta a la derecha. Sin cruzar, detrás de la 1 acabaría la 4.
//
// El grupo final puede venir corto, y entonces la ranura que sobra tiene que
// seguir ocupando su sitio —un hueco a la izquierda empuja a su compañera al
// lado que no es—: por eso las páginas se devuelven con `undefined` en las
// ranuras vacías y el render pinta una celda en blanco. Una cara B entera vacía
// sí se descarta.
export function paginar(hojas, dobleCara) {
  if (!dobleCara) return chunk(hojas, 2);
  const paginas = [];
  for (const [a, b, c, d] of chunk(hojas, 4)) {
    paginas.push([a, c]);
    paginas.push([d, b]);
  }
  return paginas.filter((p) => p.some(Boolean));
}

export default function HojasResumen({ hojas, nombreMazo, dobleCara, desvio = SIN_DESVIO }) {
  const paginas = paginar(hojas, dobleCara);
  // La calibración solo tiene sentido en la cara B; a cara única no hay nada
  // que casar y las variables se quedan a cero.
  const vars = dobleCara
    ? { "--desvio-dorso-x": (desvio.x || 0) + "mm", "--desvio-dorso-y": (desvio.y || 0) + "mm" }
    : undefined;

  return (
    <div className="hoja-impresion" style={vars}>
      {paginas.map((grupo, i) => (
        <div className={"hoja" + (dobleCara && i % 2 === 1 ? " hoja-a5-girada" : "")} key={i}>
          <div className="etiqueta-hoja">
            {nombreMazo} · A5 {i + 1}/{paginas.length} · A4 apaisado, al 100 %, cortar por la vertical central
            {dobleCara
              ? ` · folio ${Math.floor(i / 2) + 1}, cara ${i % 2 === 1 ? "B (girada)" : "A"}`
              : ""}
          </div>
          <div className="pagina-a5">
            {grupo.map((h, j) =>
              h ? (
                <div key={h.id} className="celda-a5">
                  <HojaA5 hoja={h} />
                </div>
              ) : (
                <div key={"vacia" + j} className="celda-a5" />
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
