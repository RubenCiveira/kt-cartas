// Hojas de impresión. Están siempre en el DOM pero ocultas en pantalla: es
// @media print quien las revela y esconde el visor (ver estilos.js).

import { Fragment } from "react";
import CartaFace from "../cards/CartaFace.jsx";
import CartaDorso from "../cards/CartaDorso.jsx";
import HojaFichas from "./HojaFichas.jsx";
import { espejarFilas, etiquetaFormato, repartirHojas } from "./formatos.js";

export default function HojasImpresion({
  cartas, formato, incluirDorsos, nombreMazo, icono, fichas, incluirFichas,
}) {
  const { paginas, paginasFichas } = repartirHojas(cartas);
  const etiqueta = etiquetaFormato(formato);

  return (
    <div className="hoja-impresion" style={{ "--esc": formato.esc, "--esc-ficha": formato.esc * 0.95 }}>
      {paginas.map((grupo, i) => (
        <Fragment key={i}>
          <div className="hoja">
            <div className="etiqueta-hoja">
              {etiqueta} · anverso {i + 1}/{paginas.length} · imprimir al 100 %
            </div>
            <div className="pagina">
              {grupo.map((c) => (
                <div key={c.id} className="celda">
                  <CartaFace carta={c} />
                </div>
              ))}
            </div>
          </div>
          {incluirDorsos && (
            <div className="hoja">
              <div className="etiqueta-hoja">
                {etiqueta} · dorso {i + 1}/{paginas.length} · imprimir al 100 %
              </div>
              <div className="pagina">
                {espejarFilas(grupo, 2).map((c, j) =>
                  c ? (
                    <div key={c.id + "-dorso"} className="celda">
                      <CartaDorso carta={c} nombreMazo={nombreMazo} icono={icono} />
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
            <div className="etiqueta-hoja">
              {etiqueta} · fichas {i + 1}/{paginasFichas.length} · imprimir al 100 %
            </div>
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
              <div className="etiqueta-hoja">
                {etiqueta} · fichas (dorso) {i + 1}/{paginasFichas.length}
              </div>
              <div className="pagina-ficha">
                {grupo.map((c) => (
                  <div key={c.id + "-dorso"} className="celda-ficha">
                    <CartaDorso carta={c} nombreMazo={nombreMazo} icono={icono} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Fragment>
      ))}
      {incluirFichas && <HojaFichas fichas={fichas} nombreMazo={nombreMazo} />}
    </div>
  );
}
