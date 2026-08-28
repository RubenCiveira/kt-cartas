// «¿Qué cartas de esta baraja hay que volver a imprimir?»
//
// Dos pasos, porque son dos preguntas distintas. Primero **desde cuándo**: una
// baraja puede llevar varias erratas encima, y lo que te falta depende de qué
// versión tengas en papel. Después **qué**: cada carta afectada, con la vieja y
// la nueva una al lado de la otra y lo cambiado recuadrado, para poder
// comprobarlo contra el taco antes de gastar papel.
//
// El punto de partida lo propone el registro de impresiones (`data/impresiones.js`)
// cuando consta; si no consta, se elige a mano, que es lo que se podía hacer
// hasta ahora mirando las dos barajas en paralelo.

import { useState } from "react";

import CartaFace from "../cards/CartaFace.jsx";
import { cartasAfectadas, describirCampos, paraAnterior, resaltadoDe, versionesDesde } from "../data/versiones.js";

// A cuánto se encogen las dos cartas para caber una al lado de la otra dentro
// del modal ancho (780 px). Una datacard mide 121 mm de ancho: al 0,5 son ~229
// px, y las dos con su hueco entran justas.
const ESCALA = 0.5;

function Lienzo({ carta, resaltar }) {
  const apaisada = carta.tipo === "datacard";
  const ancho = apaisada ? 121 : 70;
  const alto = apaisada ? 70 : 121;
  return (
    <div
      className="comparador-lienzo"
      style={{ width: `calc(${ancho}mm * ${ESCALA})`, height: `calc(${alto}mm * ${ESCALA})` }}
    >
      <div style={{ transform: `scale(${ESCALA})`, transformOrigin: "top left" }}>
        <CartaFace carta={carta} resaltar={resaltar} />
      </div>
    </div>
  );
}

function Comparacion({ cambio, desde }) {
  const resaltado = resaltadoDe(cambio.anterior, cambio.actual);
  return (
    <div className="comparador">
      <div className="comparador-cabecera">
        <b>{cambio.titulo || cambio.id}</b>
        <span className="tenue">Cambió {describirCampos(cambio.campos)}</span>
      </div>
      <div className="comparador-par">
        <figure>
          <figcaption className="tenue">Antes{desde ? ` · ${desde}` : ""}</figcaption>
          <Lienzo carta={cambio.anterior} resaltar={paraAnterior(resaltado)} />
        </figure>
        <figure>
          <figcaption className="acento">Ahora · {cambio.versiones[cambio.versiones.length - 1]}</figcaption>
          <Lienzo carta={cambio.actual} resaltar={resaltado} />
        </figure>
      </div>
    </div>
  );
}

export default function DialogoVersiones({ baraja, impreso, onCerrar, onAMazo }) {
  const versiones = baraja.versiones || [];
  // La versión de partida: la que consta impresa si la hay, y si no, la
  // anterior a la última errata — que es lo que suele querer mirarse.
  const previa = versiones.length > 1 ? versiones[versiones.length - 2].fecha : "";
  const [desde, setDesde] = useState(impreso?.version || previa);

  const entradas = versionesDesde(baraja, desde);
  const { cambiadas, altas, bajas, huerfanas } = cartasAfectadas(baraja, entradas);

  // Los puntos de partida posibles: cada versión registrada, y «antes de todo»
  // para ver el historial entero de una baraja vieja. La última entra también
  // aunque no dé nada que reimprimir: si es la que consta impresa tiene que
  // salir marcada, y «no hay nada» es una respuesta válida a la pregunta.
  const opciones = [
    { valor: "", etiqueta: "Desde el principio" },
    ...versiones.map((v) => ({ valor: v.fecha, etiqueta: v.fecha + (v.nota ? ` · ${v.nota}` : "") })),
  ];
  // La versión que consta impresa puede no estar en el historial: una baraja que
  // se imprimió antes de que se empezara a versionar. Entra igual como opción,
  // porque si no el diálogo abriría sin ningún chip marcado y pareciendo que la
  // selección no es de nadie.
  if (desde && !opciones.some((o) => o.valor === desde)) {
    opciones.splice(1, 0, { valor: desde, etiqueta: `${desde} · la que tienes impresa` });
  }

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal ancho" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecera">
          <h2>Actualizaciones de {baraja.nombre}</h2>
          <button className="btn btn-mini" onClick={onCerrar}>Cerrar</button>
        </div>

        <p className="parrafo tenue">
          {impreso && !impreso.desconocido ? (
            <>
              Consta impresa la versión <b>{impreso.version || "inicial"}</b>. La baraja va por la{" "}
              <b>{baraja.version || versiones[versiones.length - 1].fecha}</b>.
            </>
          ) : (
            <>
              No consta que hayas impreso esta baraja, así que elige tú desde qué versión comparar.
              Al imprimir se apunta, y la próxima vez sale ya elegida.
            </>
          )}
        </p>

        <label>Comparar con la versión</label>
        <div className="chips">
          {opciones.map((o) => (
            <button
              key={o.valor || "todas"}
              className={"chip" + (desde === o.valor ? " activa" : "")}
              onClick={() => setDesde(o.valor)}
            >
              {o.etiqueta}
            </button>
          ))}
        </div>

        <div className="caja-seleccion" style={{ maxHeight: "56vh", marginTop: 12 }}>
          {!cambiadas.length && !altas.length && !bajas.length && (
            <p className="tenue" style={{ margin: 0, fontSize: 13 }}>
              Nada ha cambiado desde esa versión: lo que tengas impreso sigue valiendo.
            </p>
          )}

          {cambiadas.map((c) => (
            <Comparacion key={c.id} cambio={c} desde={desde} />
          ))}

          {altas.length > 0 && (
            <div className="comparador">
              <div className="comparador-cabecera">
                <b>Cartas nuevas</b>
                <span className="tenue">{altas.length} que no estaban</span>
              </div>
              <div className="comparador-par">
                {altas.map((a) => (
                  <figure key={a.id}>
                    <figcaption className="acento">{a.version}</figcaption>
                    <Lienzo carta={a.carta} resaltar={null} />
                  </figure>
                ))}
              </div>
            </div>
          )}

          {bajas.length > 0 && (
            <div className="comparador">
              <div className="comparador-cabecera">
                <b>Cartas retiradas</b>
                <span className="tenue">{bajas.length} que puedes sacar del taco</span>
              </div>
              <div className="comparador-par">
                {bajas.map((b) =>
                  // Sin `carta` no hay nada que pintar: es una baja de una baraja
                  // que se editó borrando la carta y sin guardar la copia. Se
                  // enseña el título, que es lo que hay, en vez de nada.
                  b.carta ? (
                    <figure key={b.id}>
                      <figcaption className="tenue">Retirada en {b.version}</figcaption>
                      <Lienzo carta={b.carta} resaltar={null} />
                    </figure>
                  ) : (
                    <figure key={b.id}>
                      <figcaption className="tenue">Retirada en {b.version}</figcaption>
                      <div className="baja-sin-carta">{b.titulo || b.id}</div>
                    </figure>
                  )
                )}
              </div>
            </div>
          )}

          {huerfanas.length > 0 && (
            <p className="aviso-filtro">
              {huerfanas.length} carta(s) del historial ya no están en la baraja
              ({huerfanas.map((c) => c.id).join(", ")}). El historial y las cartas no cuadran:
              revisa el JSON en app-write.
            </p>
          )}
        </div>

        <div className="modal-pie">
          <span className="tenue">
            {cambiadas.length
              ? `${cambiadas.length} carta(s) para reimprimir`
              : "Sin cartas que reimprimir"}
          </span>
          <button
            className="btn btn-primario"
            disabled={!cambiadas.length}
            onClick={() => onAMazo(cambiadas.map((c) => c.id))}
          >
            Añadir a un mazo de impresión
          </button>
        </div>
      </div>
    </div>
  );
}
