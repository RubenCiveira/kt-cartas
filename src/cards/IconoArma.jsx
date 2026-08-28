// El icono que la tabla de armas pone delante de cada perfil: proyectiles para
// las armas a distancia, espada para las de combate. Son los dos símbolos de
// las tarjetas oficiales, y en la carta hacen el mismo trabajo que allí: leer
// una fila de un vistazo sin tener que interpretar sus reglas.
//
// Van dibujados en SVG y no como PNG del bucket porque son parte de la
// maquetación, como los iconos de tipo de carta de `src/icons/`: se imprimen a
// cualquier tamaño sin pixelarse y toman el color del arquetipo, que es lo que
// los ata al resto de la carta.
//
// `tipo` viene del JSON de la baraja ("distancia" | "combate") y lo rellena
// `clasificar-armas.mjs` en app-write leyendo el icono del PDF. Una baraja
// antigua no lo trae: entonces no se pinta nada y la fila se maqueta como
// siempre (ver CartaFace).

// El lienzo de los dos dibujos, y con él su proporción. El ancho del icono sale
// de aquí y no de una constante aparte: son la misma medida vista de dos formas,
// y separarlas deja el dibujo estirado sin que se note a 2 mm.
const VB_ANCHO = 26;
const VB_ALTO = 12;

// Alto por defecto. Manda sobre el tamaño del icono; el ancho lo sigue.
//
// A 1,73 mm el símbolo se lee sin competir con el nombre del arma, que es el
// dato que se busca al recorrer la tabla. Si se toca, hay que mover con él la
// pista de la rejilla en `CartaFace` (`columnasArmas`), o el icono se queda
// nadando en una columna de otro ancho.
const ALTO = "1.73mm";

export default function IconoArma({ tipo, color, alto = ALTO }) {
  if (tipo !== "distancia" && tipo !== "combate") return null;

  const comun = {
    height: alto,
    width: `calc(${alto} * ${VB_ANCHO} / ${VB_ALTO})`,
    // Con `display:block` la fila no le reserva el hueco de la línea base y el
    // icono queda centrado con los números.
    display: "block",
    fill: color,
    flex: "none",
  };
  const lienzo = `0 0 ${VB_ANCHO} ${VB_ALTO}`;

  if (tipo === "distancia") {
    // Tres proyectiles: cuerpo recto y punta redondeada, como en las tarjetas.
    return (
      <svg viewBox={lienzo} style={comun} aria-hidden="true">
        {[0, 9, 18].map((x) => (
          <path key={x} d={`M${x} 12 V4 A3 3 0 0 1 ${x + 6} 4 V12 Z`} />
        ))}
      </svg>
    );
  }

  // Espada apuntando a la derecha, con su guarda: una sola silueta, para que a
  // menos de 2 mm siga leyéndose como una espada y no como una mancha.
  return (
    <svg viewBox={lienzo} style={comun} aria-hidden="true">
      <path d="M0 4.6 H14 V4.6 H16 V0.6 H18.4 V4.6 L26 6 L18.4 7.4 V11.4 H16 V7.4 H14 V7.4 H0 Z" />
    </svg>
  );
}
