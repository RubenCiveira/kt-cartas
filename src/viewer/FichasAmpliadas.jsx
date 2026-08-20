// Las fichas de la baraja, en pantalla. Es la misma plancha que se imprime
// (`print/HojaFichas.jsx`), sin escalar: cada ficha mide en pantalla los
// milímetros que medirá sobre la mesa, que es justo lo que se quiere mirar
// antes de gastar cartulina. Va sobre blanco porque la plancha está dibujada
// para el papel, no para el fondo oscuro del visor.

import HojaFichas from "../print/HojaFichas.jsx";
import Ampliacion from "./Ampliacion.jsx";

export default function FichasAmpliadas({ fichas, nombreMazo, onCerrar }) {
  return (
    <Ampliacion
      titulo="Fichas y marcadores"
      nota="Tamaño real: lo que ves es lo que sale por la impresora. Para imprimirlas, márcalas en el diálogo de imprimir."
      onCerrar={onCerrar}
    >
      <div className="ampliacion-papel">
        <HojaFichas fichas={fichas} nombreMazo={nombreMazo} />
      </div>
    </Ampliacion>
  );
}
