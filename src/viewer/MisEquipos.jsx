import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { actualizarBanda, listarBandas } from "../appwrite.js";
import { useIconoBarajaUrl } from "../assets.js";
import { agruparBandas, normalizarBanda } from "../data/bandas.js";
import HojasCenitales from "../print/HojasCenitales.jsx";
import DialogoFichasCenitales from "./DialogoFichasCenitales.jsx";
import CabeceraPrincipal from "./CabeceraPrincipal.jsx";

export default function MisEquipos({ usuario, barajas, onInicio, onMazosImpresion, mazosImpresion, avatarUrl, onLogout }) {
  const [intento, setIntento] = useState(0);
  const [resultado, setResultado] = useState({ estado: "cargando", bandas: [], error: "" });
  const [bandaAbierta, setBandaAbierta] = useState(null);
  const [plancha, setPlancha] = useState(null);
  const userId = usuario.$id;
  const baraja = barajas.find((b) => b.clave === bandaAbierta?.faccion);

  useEffect(() => {
    let cancelado = false;
    setResultado({ estado: "cargando", bandas: [], error: "" });
    listarBandas(userId)
      .then((rows) => {
        if (!cancelado) setResultado({ estado: "listo", bandas: rows.map(normalizarBanda), error: "" });
      })
      .catch((e) => {
        if (!cancelado) setResultado({ estado: "error", bandas: [], error: e.message || "No se pudieron cargar tus bandas." });
      });
    return () => { cancelado = true; };
  }, [userId, intento]);

  return (
    <>
      <div className="portada">
        <CabeceraPrincipal
          seccion="operadores"
          onBarajas={onInicio}
          onMazosImpresion={onMazosImpresion}
          mazosImpresion={mazosImpresion}
          usuario={usuario}
          avatarUrl={avatarUrl}
          onLogout={onLogout}
        />
        <div className="portada-cuerpo">
          {resultado.estado === "cargando" && <p className="parrafo" role="status">Cargando tus bandas…</p>}
          {resultado.estado === "error" && (
            <>
              <p className="aviso-filtro" role="alert">{resultado.error}</p>
              <button className="btn btn-mini" onClick={() => setIntento((i) => i + 1)}>Reintentar</button>
            </>
          )}
          {resultado.estado === "listo" && !resultado.bandas.length && (
            <p className="parrafo">Todavía no tienes bandas guardadas. Selecciona operativos en «Fichas cenitales» y pulsa «Guardar como banda».</p>
          )}
          {agruparBandas(resultado.bandas, barajas).map((grupo) => (
            <section className="portada-grupo" key={grupo.faccion}>
              <div className="portada-grupo-titulo">
                <h2>{grupo.baraja?.nombre || grupo.faccion}</h2>
                <p className="tenue">{grupo.bandas.length} banda(s)</p>
              </div>
              <div className="portada-rejilla">
                {grupo.bandas.map((banda) => (
                  <TarjetaBanda key={banda.id} banda={banda} baraja={grupo.baraja} onAbrir={() => setBandaAbierta(banda)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      {bandaAbierta && baraja && (
        <DialogoFichasCenitales
          key={bandaAbierta.id}
          banda={bandaAbierta}
          cartas={baraja.cartas}
          tokens={baraja.fichas}
          onCerrar={() => { setBandaAbierta(null); setPlancha(null); }}
          onGuardarBanda={async (datos) => {
            const banda = normalizarBanda(await actualizarBanda(bandaAbierta.id, { ...datos, faccion: bandaAbierta.faccion }));
            setResultado((previo) => ({ ...previo, bandas: previo.bandas.map((b) => b.id === banda.id ? banda : b) }));
            setBandaAbierta(banda);
          }}
          onImprimir={(seleccion) => {
            flushSync(() => setPlancha(seleccion));
            window.print();
          }}
        />
      )}
      {plancha && bandaAbierta && baraja && <HojasCenitales plancha={plancha} nombreMazo={bandaAbierta.nombre} tokens={baraja.fichas} />}
    </>
  );
}

function TarjetaBanda({ banda, baraja, onAbrir }) {
  const icono = useIconoBarajaUrl(baraja?.icono);
  return (
    <button className="portada-baraja" type="button" disabled={!baraja} onClick={onAbrir}>
      <span className="portada-baraja-icono"><img src={icono} alt="" /></span>
      <span className="portada-baraja-texto">
        <strong>{banda.nombre}</strong>
        <span className="tenue">{banda.operadores.length} operativo(s){banda.familia && ` · ${banda.familia}`}</span>
        <span className="portada-baraja-tipos">{banda.operadores.map((op) => op.nombre).join(", ")}</span>
        {!baraja && <span className="tenue">Facción no disponible</span>}
      </span>
    </button>
  );
}
