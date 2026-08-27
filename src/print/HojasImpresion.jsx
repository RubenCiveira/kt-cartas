// Hojas de impresión. Están siempre en el DOM pero ocultas en pantalla: es
// @media print quien las revela y esconde el visor (ver estilos.js).

import { Fragment } from "react";
import { assetUrl } from "../assets.js";
import CartaFace from "../cards/CartaFace.jsx";
import CartaDorso from "../cards/CartaDorso.jsx";
import HojaFichas from "./HojaFichas.jsx";
import { colsFicha, espejarFilas, etiquetaFormato, medidas, repartirHojas, variablesFormato } from "./formatos.js";

export default function HojasImpresion({
  cartas, formato, incluirDorsos, nombreMazo, icono, fichas, incluirFichas, desvio,
}) {
  const { paginas, paginasFichas } = repartirHojas(cartas, formato);
  const etiqueta = etiquetaFormato(formato);
  // Una ficha de datos está diseñada apaisada (121 × 70). En los formatos que la
  // giran ocupa una celda vertical como cualquier otra carta.
  const clase = (c) =>
    "celda" + (formato.giraFichas && c.tipo === "datacard" ? " celda-girada" : "");
  const claseDorso = (c) => clase(c) + " celda-dorso";
  // En un mazo de impresión las cartas vienen de barajas distintas y cada una
  // se lleva la suya en `origen`: el dorso tiene que seguir siendo el de SU
  // baraja, o media tirada saldría con el nombre de otra facción detrás. En una
  // baraja normal no hay `origen` y manda el mazo, como siempre.
  const dorsoDe = (c) =>
    c.origen
      ? { nombre: c.origen.nombre, icono: assetUrl(c.origen.icono) }
      : { nombre: nombreMazo, icono };
  const m = medidas(formato);
  // La barra mide 50 mm de diseño. Si sobre el papel no mide 50, la página se ha
  // reescalado y ninguna otra medida de la hoja es de fiar: es lo primero que
  // hay que descartar cuando una carta sale de un tamaño que no toca.
  const Etiqueta = ({ children }) => (
    <div className="etiqueta-hoja">
      {children}
      <span className="regla-50" aria-hidden="true" />
      <span className="regla-pie">50 mm · celda {m.ancho} × {m.alto}</span>
    </div>
  );

  return (
    <div className="hoja-impresion hoja-cartas" style={variablesFormato(formato, desvio)}>
      {paginas.map((grupo, i) => (
        <Fragment key={i}>
          <div className="hoja">
            <Etiqueta>
              {etiqueta} · anverso {i + 1}/{paginas.length} · imprimir al 100 %
            </Etiqueta>
            <div className="pagina">
              {grupo.map((c) => (
                <div key={c.id} className={clase(c)}>
                  <CartaFace carta={c} />
                </div>
              ))}
            </div>
          </div>
          {incluirDorsos && (
            <div className="hoja">
              <Etiqueta>
                {etiqueta} · dorso {i + 1}/{paginas.length} · imprimir al 100 %
              </Etiqueta>
              <div className="pagina pagina-dorso">
                {espejarFilas(grupo, formato.cols || 2).map((c, j) =>
                  c ? (
                    <div key={c.id + "-dorso"} className={claseDorso(c)}>
                      <CartaDorso carta={c} nombreMazo={dorsoDe(c).nombre} icono={dorsoDe(c).icono} />
                    </div>
                  ) : (
                    <div key={"vacia-" + j} className="celda celda-vacia" />
                  )
                )}
              </div>
            </div>
          )}
        </Fragment>
      ))}
      {paginasFichas.map((grupo, i) => (
        <Fragment key={"f" + i}>
          <div className="hoja">
            <Etiqueta>
              {etiqueta} · fichas {i + 1}/{paginasFichas.length} · imprimir al 100 %
            </Etiqueta>
            <div className="pagina-ficha">
              {grupo.map((c) => (
                <div key={c.id} className="celda-ficha">
                  <CartaFace carta={c} />
                </div>
              ))}
            </div>
          </div>
          {incluirDorsos && (
            <div className="hoja">
              <Etiqueta>
                {etiqueta} · fichas (dorso) {i + 1}/{paginasFichas.length}
              </Etiqueta>
              <div className="pagina-ficha pagina-ficha-dorso">
                {espejarFilas(grupo, colsFicha(formato)).map((c, j) =>
                  c ? (
                    <div key={c.id + "-dorso"} className="celda-ficha celda-dorso">
                      <CartaDorso carta={c} nombreMazo={dorsoDe(c).nombre} icono={dorsoDe(c).icono} />
                    </div>
                  ) : (
                    <div key={"vacia-f-" + j} className="celda-ficha celda-vacia" />
                  )
                )}
              </div>
            </div>
          )}
        </Fragment>
      ))}
      {incluirFichas && <HojaFichas fichas={fichas} nombreMazo={nombreMazo} />}
    </div>
  );
}
