// Visor de barajas de Kill Team.
//
// Las barajas son ficheros JSON del bucket de Appwrite (ver CLAUDE.md); aquí
// solo se miran y se imprimen. Sin baraja abierta se está en la portada, el
// índice de barajas por tipo; con una baraja abierta hay tres estados: la
// rejilla de miniaturas, el detalle de una carta y el diálogo de impresión.

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

import estilos, { estilosResumen } from "./estilos.js";
import { useAssetUrl, useIconoBarajaUrl } from "./assets.js";
import { TIPOS } from "./data/tipos.js";
import { cargarBarajasRemotas, crearBarajaLocal, resolverMazo } from "./data/decks.js";
import { esResumenes } from "./data/tipos-baraja.js";
import { completeVerification, getSessionUser, login, loginWithGoogle, logout, register, requestAccessReview, sendVerification, userAvatarUrl } from "./appwrite.js";
import { getFormato, STORAGE_KEY_FORMATO } from "./print/formatos.js";
import {
  desvioDe,
  guardarImpresoraActiva,
  guardarImpresoras,
  leerImpresoraActiva,
  leerImpresoras,
} from "./print/impresoras.js";
import { escribirHash, leerHash } from "./estado-url.js";
import HojasImpresion from "./print/HojasImpresion.jsx";
import HojasResumen from "./print/HojasResumen.jsx";
import DialogoImpresion from "./print/DialogoImpresion.jsx";
import DialogoImpresionResumen from "./print/DialogoImpresionResumen.jsx";
import VisorResumenes from "./viewer/VisorResumenes.jsx";
import HojaAmpliada from "./viewer/HojaAmpliada.jsx";
import FichasAmpliadas from "./viewer/FichasAmpliadas.jsx";
import BarraSuperior from "./viewer/BarraSuperior.jsx";
import MiniCarta from "./viewer/MiniCarta.jsx";
import DetalleCarta from "./viewer/DetalleCarta.jsx";
import Indice from "./viewer/Indice.jsx";
import Portada from "./viewer/Portada.jsx";
import useDock from "./viewer/useDock.js";
import useNarrador from "./viewer/narracion.js";

// Envuelve un cambio de estado en una transición de vista, para que la
// miniatura se convierta en la carta grande en lugar de aparecer un modal.
//
// Sus promesas se ignoran a conciencia: si el usuario encadena saltos, el
// navegador aborta la transición en curso y la rechaza. Es lo esperable, no un
// error, pero sin capturarla acaba en la consola como excepción sin gestionar.
function conTransicion(fn) {
  if (!document.startViewTransition) return fn();
  const t = document.startViewTransition(() => flushSync(fn));
  const callar = () => {};
  t.ready.catch(callar);
  t.finished.catch(callar);
  t.updateCallbackDone.catch(callar);
}

// Una sola referencia para "esta baraja no tiene cartas": un [] nuevo en cada
// render volvería a disparar los useMemo y useEffect que dependen de `cartas`.
const VACIO = [];

// Centra una carta en la tira desplazando **solo la tira**.
//
// Con scrollIntoView no vale: desplaza todos los ancestros desplazables, la
// página incluida. Al abrir un enlace directo a una carta (#carta=c7) eso movía
// el documento entero y dejaba la barra superior fuera de la pantalla, que en
// móvil es donde más se nota. Aquí se calcula el desplazamiento a mano y se
// aplica al contenedor, así que la página no se entera.
function centrarEnLaTira(tira, id) {
  const el = tira && tira.querySelector('[data-id="' + id + '"]');
  if (!el) return;
  // offsetLeft es la posición de maquetación dentro de la tira (que es
  // position:relative), sin contar la escala que le pone el dock.
  const destino = el.offsetLeft - (tira.clientWidth - el.offsetWidth) / 2;
  tira.scrollTo({ left: destino, behavior: "smooth" });
}

export default function VisorCartasKT() {
  // El estado de navegación arranca de la URL (ver estado-url.js)
  const [inicial] = useState(leerHash);
  // Sin baraja (null) se está en la portada; `grupo` es el tipo de baraja que
  // la portada tiene desplegado, y solo importa mientras se está en ella.
  const [mazoActivo, setMazoActivo] = useState(inicial.baraja);
  const [grupo, setGrupo] = useState(inicial.grupo);
  // Lista de tipos elegidos; vacía = se ven todos
  const [filtro, setFiltro] = useState(inicial.tipos);
  // Guardamos las cartas *excluidas*: así una baraja recién abierta entra
  // entera en la impresión, que es lo que se quiere casi siempre.
  const [excluidas, setExcluidas] = useState([]);
  const [detalleId, setDetalleId] = useState(null);
  const [transicionId, setTransicionId] = useState(null);
  const [dialogo, setDialogo] = useState(false);
  const [indice, setIndice] = useState(false);
  // Ampliaciones: la hoja de resumen que se está leyendo (por id) y si están
  // abiertas las fichas. No van a la URL: son una lupa sobre lo que ya hay en
  // pantalla, no un sitio al que volver.
  const [hojaAmpliada, setHojaAmpliada] = useState(null);
  const [verFichas, setVerFichas] = useState(false);
  // Carta a la que hay que saltar desde el índice o el buscador; se resuelve en
  // un efecto porque puede exigir quitar antes el filtro y esperar al repintado.
  const [aCentrar, setACentrar] = useState(inicial.carta);
  const [narrando, setNarrando] = useState(false);
  const [incluirDorsos, setIncluirDorsos] = useState(true);
  const [incluirFichas, setIncluirFichas] = useState(false);
  // Solo para resúmenes: gira las páginas pares para la segunda pasada de una
  // impresión a doble cara (ver print/HojasResumen.jsx).
  const [dobleCara, setDobleCara] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [barajas, setBarajas] = useState([]);
  const [barajasLocales, setBarajasLocales] = useState([]);
  const [estadoCarga, setEstadoCarga] = useState("sesion");
  const [errorCarga, setErrorCarga] = useState("");
  const [infoAcceso, setInfoAcceso] = useState("");
  // Calibración de impresora: perfiles con nombre y desvío del dorso, guardados
  // en este navegador. Es de la máquina, no de la baraja, así que sobrevive a
  // cambiar de mazo y a recargar.
  const [impresoras, setImpresoras] = useState(leerImpresoras);
  const [impresoraId, setImpresoraId] = useState(leerImpresoraActiva);
  const [formatoId, setFormatoId] = useState(() => {
    try {
      return getFormato(localStorage.getItem(STORAGE_KEY_FORMATO)).id;
    } catch (e) {
      return getFormato().id;
    }
  });

  useEffect(() => {
    let cancelado = false;
    const errorOAuth = procesarErrorOAuthPendiente();
    if (errorOAuth) setErrorCarga(errorOAuth);
    procesarVerificacionPendiente()
      .catch((error) => {
        if (!cancelado) setErrorCarga(error.message || "No se pudo completar la verificación.");
      })
      .then(() => getSessionUser())
      .then((user) => {
      if (cancelado) return;
      setUsuario(user);
      setEstadoCarga(estadoParaUsuario(user));
      })
      .catch((error) => {
        if (cancelado) return;
        setErrorCarga(error.message || "No se pudo comprobar la sesión.");
        setEstadoCarga("error");
      });
    return () => { cancelado = true; };
  }, []);

  useEffect(() => {
    const alArrastrar = (event) => {
      if ([...event.dataTransfer.types].includes("Files")) event.preventDefault();
    };
    const alSoltar = async (event) => {
      const file = [...event.dataTransfer.files].find((f) => f.name.toLowerCase().endsWith(".json"));
      if (!file) return;

      event.preventDefault();
      setErrorCarga("");
      try {
        const data = JSON.parse(await file.text());
        const baraja = crearBarajaLocal(data, file.name);
        setBarajasLocales((actuales) => [baraja, ...actuales.filter((b) => b.clave !== baraja.clave)]);
        setEstadoCarga("listo");
        setUsuario((u) => u || null);
        cambiarMazo(baraja.clave);
      } catch (error) {
        setErrorCarga(error.message || "No se pudo leer la baraja local.");
        if (estadoCarga !== "listo") setEstadoCarga("error");
      }
    };

    window.addEventListener("dragover", alArrastrar);
    window.addEventListener("drop", alSoltar);
    return () => {
      window.removeEventListener("dragover", alArrastrar);
      window.removeEventListener("drop", alSoltar);
    };
  }, [estadoCarga]);

  useEffect(() => {
    if (!usuario || estadoParaUsuario(usuario) !== "cargando") return;
    let cancelado = false;
    setEstadoCarga("cargando");
    setErrorCarga("");
    cargarBarajasRemotas()
      .then((remotas) => {
        if (cancelado) return;
        setBarajas(remotas);
        setEstadoCarga("listo");
        // Una baraja que la URL pide y el bucket no tiene devuelve a la
        // portada, que es donde se ve lo que sí hay.
        if (mazoActivo && !remotas.some((b) => b.clave === mazoActivo)) {
          setMazoActivo(null);
        }
      })
      .catch((error) => {
        if (cancelado) return;
        setErrorCarga(error.message || "No se pudieron cargar las barajas.");
        setEstadoCarga("error");
      });
    return () => { cancelado = true; };
    // Solo se recarga al cambiar la sesión; cambiar de baraja no debe pedir el catálogo de nuevo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  // null = portada. El resto del componente sigue funcionando con una baraja
  // vacía, para no tener que colgar los hooks de que haya mazo o no.
  const todasBarajas = useMemo(() => [...barajasLocales, ...barajas], [barajasLocales, barajas]);
  const mazo = useMemo(() => resolverMazo(todasBarajas, mazoActivo), [todasBarajas, mazoActivo]);
  const cartas = mazo ? mazo.cartas : VACIO;
  const hojas = (mazo && mazo.hojas) || VACIO;
  const nombreMazo = mazo ? mazo.nombre : "";
  // Dos iconos y no uno: el dorso de las cartas y las hojas de impresión usan
  // el de la baraja tal cual —sin icono, no pintan ninguno—, mientras que el
  // selector de la barra, como la portada, cae en el icono por defecto.
  const iconoMazoUrl = useAssetUrl(mazo ? mazo.icono : "");
  const iconoSelector = useIconoBarajaUrl(mazo ? mazo.icono : "");
  const formato = getFormato(formatoId);
  // Las fichas son de la baraja, no de la tirada: se miran en pantalla aunque
  // no se vayan a imprimir, y por eso no dependen de `incluirFichas`.
  const fichas = mazo && mazo.fichas && mazo.fichas.lista && mazo.fichas.lista.length ? mazo.fichas : null;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FORMATO, formatoId);
    } catch (e) { /* almacenamiento no disponible */ }
  }, [formatoId]);

  useEffect(() => { guardarImpresoras(impresoras); }, [impresoras]);
  useEffect(() => { guardarImpresoraActiva(impresoraId); }, [impresoraId]);
  const desvio = desvioDe(impresoras, impresoraId);

  // Cambiar de baraja reinicia lo que es propio de una baraja. Va aquí y no en
  // un efecto sobre mazoActivo porque, como efecto, se dispararía también
  // cuando la baraja llega desde la URL y borraría el filtro de esa misma URL.
  const cambiarMazo = (clave) => {
    if (clave === mazoActivo) return;
    setMazoActivo(clave);
    setExcluidas([]);
    setFiltro([]);
    setDetalleId(null);
    setIndice(false);
    setNarrando(false);
    setHojaAmpliada(null);
    setVerFichas(false);
  };

  // Volver a la portada es cambiar de baraja a "ninguna", más cerrar el diálogo
  // de impresión: es lo único que puede seguir abierto por delante de la barra.
  const volverAInicio = () => {
    cambiarMazo(null);
    setDialogo(false);
  };

  const iniciarSesion = async (email, password) => {
    setEstadoCarga("sesion");
    setErrorCarga("");
    try {
      const user = await login(email, password);
      setUsuario(user);
      setEstadoCarga(estadoParaUsuario(user));
    } catch (error) {
      setErrorCarga(error.message || "No se pudo iniciar sesión.");
      setEstadoCarga("login");
    }
  };

  const registrarUsuario = async (email, password, name) => {
    setEstadoCarga("sesion");
    setErrorCarga("");
    try {
      const user = await register(email, password, name);
      setUsuario(user);
      setInfoAcceso("Te hemos enviado un email de verificación.");
      setEstadoCarga("no-verificado");
    } catch (error) {
      setErrorCarga(error.message || "No se pudo crear la cuenta.");
      setEstadoCarga("login");
    }
  };

  const reenviarVerificacion = async () => {
    setErrorCarga("");
    try {
      await sendVerification();
      setInfoAcceso("Email de verificación reenviado.");
    } catch (error) {
      setErrorCarga(error.message || "No se pudo reenviar el email de verificación.");
    }
  };

  const solicitarRevision = async () => {
    setErrorCarga("");
    try {
      const respuesta = await requestAccessReview(usuario.$id);
      if (respuesta.rateLimited && respuesta.nextAllowedAt) {
        setInfoAcceso(`Ya hay una solicitud reciente. Podrás reenviarla después de ${new Date(respuesta.nextAllowedAt).toLocaleString()}.`);
      } else {
        setInfoAcceso("Solicitud de revisión enviada al administrador.");
      }
    } catch (error) {
      setErrorCarga(error.message || "No se pudo solicitar la revisión.");
    }
  };

  const cerrarSesion = async () => {
    await logout();
    setUsuario(null);
    setBarajas([]);
    setEstadoCarga("login");
    setMazoActivo(null);
  };

  const reintentarCarga = async () => {
    if (usuario) {
      setUsuario({ ...usuario });
      return;
    }

    setEstadoCarga("sesion");
    setErrorCarga("");
    try {
      const user = await getSessionUser();
      setUsuario(user);
      setEstadoCarga(estadoParaUsuario(user));
    } catch (error) {
      setErrorCarga(error.message || "No se pudo comprobar la sesión.");
      setEstadoCarga("error");
    }
  };

  // Reflejar el estado en la URL
  useEffect(() => {
    escribirHash({ baraja: mazoActivo, grupo, tipos: filtro, carta: detalleId });
  }, [mazoActivo, grupo, filtro, detalleId]);

  // Y al revés: alguien pega una URL o usa atrás/adelante
  useEffect(() => {
    const alCambiarHash = () => {
      const h = leerHash();
      if (h.baraja !== mazoActivo) {
        setMazoActivo(h.baraja);
        setExcluidas([]);
      }
      setGrupo(h.grupo);
      setFiltro(h.tipos);
      if (h.carta) setACentrar(h.carta);
      else {
        setDetalleId(null);
        setNarrando(false);
      }
    };
    window.addEventListener("hashchange", alCambiarHash);
    return () => window.removeEventListener("hashchange", alCambiarHash);
  }, [mazoActivo]);

  // Tipos presentes en esta baraja, en el orden canónico y con su recuento
  const tipos = useMemo(() => {
    const cuenta = cartas.reduce((acc, c) => ({ ...acc, [c.tipo]: (acc[c.tipo] || 0) + 1 }), {});
    return TIPOS.filter((t) => cuenta[t.id]).map((t) => ({ id: t.id, n: cuenta[t.id] }));
  }, [cartas]);

  // Un tipo que esta baraja no tiene no pinta chip, así que un filtro sobre él
  // dejaría la tira vacía sin nada visible que lo explique ni que lo deshaga.
  // Puede llegar de una URL escrita a mano o de un enlace a otra baraja.
  // Depende también del filtro, no solo de la baraja: cambiar el hash de una
  // página ya cargada no la recarga, solo dispara hashchange, así que el tipo
  // fantasma llegaría sin que la baraja se hubiera movido.
  useEffect(() => {
    const presentes = new Set(cartas.map((c) => c.tipo));
    const podado = filtro.filter((t) => presentes.has(t));
    if (podado.length !== filtro.length) setFiltro(podado);
  }, [cartas, filtro]);

  const visibles = filtro.length ? cartas.filter((c) => filtro.includes(c.tipo)) : cartas;
  const estaSeleccionada = (id) => !excluidas.includes(id);
  const seleccionadas = cartas.filter((c) => estaSeleccionada(c.id));

  const alternar = (id) =>
    setExcluidas((ex) => (ex.includes(id) ? ex.filter((x) => x !== id) : [...ex, id]));

  const idsVisibles = visibles.map((c) => c.id);

  // Qué entra en la impresión se decide en el diálogo, sobre la baraja entera.
  const marcarTodo = () => setExcluidas([]);
  // Cartas y hojas de resumen comparten el registro de exclusiones: sus ids no
  // colisionan ("c0" frente a "h0") y una baraja nunca trae de los dos tipos.
  const desmarcarTodo = () => setExcluidas([...cartas, ...hojas].map((x) => x.id));
  const invertirTodo = () => setExcluidas(cartas.filter((c) => estaSeleccionada(c.id)).map((c) => c.id));
  const invertirHojas = () => setExcluidas(hojas.filter((h) => estaSeleccionada(h.id)).map((h) => h.id));

  const abrirDetalle = (id) => {
    flushSync(() => setTransicionId(id));
    conTransicion(() => setDetalleId(id));
  };
  const cerrarDetalle = () => {
    setNarrando(false);
    conTransicion(() => setDetalleId(null));
  };

  // Navegar entre cartas recorre lo visible, que es lo que el usuario ve
  const irRelativo = (paso) => {
    const i = idsVisibles.indexOf(detalleId);
    if (i === -1) return;
    const destino = idsVisibles[(i + paso + idsVisibles.length) % idsVisibles.length];
    // Sin transición de vista: el detalle ya está abierto y solo cambia de
    // carta. Ambos estados van en el mismo commit para que nunca haya dos
    // elementos reclamando el mismo view-transition-name.
    setTransicionId(destino);
    setDetalleId(destino);
  };

  const detalle = detalleId ? cartas.find((c) => c.id === detalleId) : null;

  // La narración va sola de carta en carta, pero no da la vuelta a la baraja
  // como hacen las flechas: al llegar a la última, se calla.
  const narrarSiguiente = () => {
    const i = idsVisibles.indexOf(detalleId);
    if (i === -1 || i === idsVisibles.length - 1) {
      setNarrando(false);
      return;
    }
    setTransicionId(idsVisibles[i + 1]);
    setDetalleId(idsVisibles[i + 1]);
  };
  useNarrador({ carta: detalle, activo: narrando, onFin: narrarSiguiente });

  // El dock remide la tira cuando cambian las cartas que hay en ella
  const tiraRef = useRef(null);
  useDock(tiraRef, [mazoActivo, filtro.join(","), indice]);

  // Saltar a una carta concreta. Si el filtro la escondía, se añade su tipo a
  // lo filtrado en vez de borrarlo todo: así no se pierde lo que ya tenías.
  const irACarta = (id) => {
    const c = cartas.find((x) => x.id === id);
    if (c && filtro.length && !filtro.includes(c.tipo)) setFiltro((f) => [...f, c.tipo]);
    setACentrar(id);
  };

  useEffect(() => {
    if (!aCentrar) return;
    // La carta puede venir de una URL que ya no corresponde a esta baraja
    if (!cartas.some((c) => c.id === aCentrar)) {
      setACentrar(null);
      return;
    }
    centrarEnLaTira(tiraRef.current, aCentrar);
    // Si el detalle ya está abierto solo cambiamos de carta: una transición de
    // vista aquí no tendría de dónde crecer y chocaría con la que ya hay.
    if (detalleId) {
      setTransicionId(aCentrar);
      setDetalleId(aCentrar);
    } else {
      abrirDetalle(aCentrar);
    }
    setACentrar(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aCentrar]);

  if (estadoCarga === "sesion" || estadoCarga === "cargando") {
    return <PantallaEstado texto={estadoCarga === "sesion" ? "Comprobando sesión…" : "Cargando barajas…"} />;
  }

  if (estadoCarga === "login") {
    return <LoginAppwrite error={errorCarga} onLogin={iniciarSesion} onGoogleLogin={loginWithGoogle} onRegister={registrarUsuario} />;
  }

  if (estadoCarga === "no-verificado") {
    return (
      <PantallaEstado
        texto="Confirma tu correo para terminar el registro"
        detalle={infoAcceso || "Te hemos enviado un email de verificación. Appwrite necesita confirmar que la dirección existe y que eres tú quien ha creado la cuenta antes de pedir acceso a las barajas."}
        ayuda="Abre el enlace del correo y vuelve a esta página. Cuando la verificación se complete, tu cuenta pasará a revisión manual. Si no encuentras el mensaje, revisa spam o promociones y usa el botón para reenviarlo."
        accion="Reenviar email de verificación"
        onAccion={reenviarVerificacion}
        accionSecundaria="Cerrar sesión"
        onAccionSecundaria={cerrarSesion}
        error={errorCarga}
      />
    );
  }

  if (estadoCarga === "pendiente") {
    return (
      <PantallaEstado
        texto="Cuenta pendiente de autorización"
        detalle={infoAcceso || "Tu correo ya está verificado, pero esta aplicación no da acceso automáticamente. Las barajas y los assets están protegidos en Appwrite y solo se cargan para cuentas aceptadas."}
        ayuda="Un administrador revisará la solicitud y añadirá la etiqueta aceptado a tu usuario si procede. Cuando eso ocurra, podrás entrar sin crear otra cuenta; basta con volver a iniciar sesión o recargar la página. Puedes reenviar la petición si crees que no llegó el aviso."
        accion="Reenviar petición de autorización"
        onAccion={solicitarRevision}
        accionSecundaria="Cerrar sesión"
        onAccionSecundaria={cerrarSesion}
        error={errorCarga}
      />
    );
  }

  if (estadoCarga === "error") {
    return <PantallaEstado texto={errorCarga} accion="Reintentar" onAccion={reintentarCarga} />;
  }

  // Sin baraja abierta no hay visor que pintar: se está en el índice.
  if (!mazo) {
    return (
      <>
        <style>{estilos}</style>
        <Portada
          barajas={todasBarajas}
          grupo={grupo}
          onGrupo={setGrupo}
          onBaraja={cambiarMazo}
          usuario={usuario}
          avatarUrl={userAvatarUrl(usuario)}
          onLogout={cerrarSesion}
        />
      </>
    );
  }

  // Una baraja de resúmenes no tiene mazo que hojear: su pantalla es la
  // previsualización de las hojas y el botón de imprimir.
  if (esResumenes(mazo.tipo)) {
    return (
      <>
        <style>{estilos}</style>
        <style>{estilosResumen}</style>
        <VisorResumenes
          hojas={hojas}
          nombreMazo={nombreMazo}
          seleccionadas={hojas.filter((h) => estaSeleccionada(h.id)).map((h) => h.id)}
          onAlternar={alternar}
          onTodas={marcarTodo}
          onNinguna={desmarcarTodo}
          onImprimir={() => setDialogo(true)}
          onAmpliar={setHojaAmpliada}
          hayFichas={!!fichas}
          onFichas={() => setVerFichas(true)}
          onInicio={volverAInicio}
          usuario={usuario}
          avatarUrl={userAvatarUrl(usuario)}
          onLogout={cerrarSesion}
        />
        {hojaAmpliada && hojas.some((h) => h.id === hojaAmpliada) && (
          <HojaAmpliada
            hoja={hojas.find((h) => h.id === hojaAmpliada)}
            onCerrar={() => setHojaAmpliada(null)}
          />
        )}
        {verFichas && fichas && (
          <FichasAmpliadas fichas={fichas} nombreMazo={nombreMazo} onCerrar={() => setVerFichas(false)} />
        )}
        {dialogo && (
          <DialogoImpresionResumen
            dobleCara={dobleCara}
            onDobleCara={setDobleCara}
            impresoras={impresoras}
            impresoraId={impresoraId}
            onImpresora={setImpresoraId}
            onImpresoras={setImpresoras}
            hojas={hojas}
            estaSeleccionada={estaSeleccionada}
            onAlternar={alternar}
            onTodas={marcarTodo}
            onNinguna={desmarcarTodo}
            onInvertir={invertirHojas}
            onCerrar={() => setDialogo(false)}
            onImprimir={() => window.print()}
          />
        )}
        <HojasResumen
          hojas={hojas.filter((h) => estaSeleccionada(h.id))}
          nombreMazo={nombreMazo}
          dobleCara={dobleCara}
          desvio={desvio}
        />
      </>
    );
  }

  return (
    <>
      <style>{estilos}</style>

      <div className={"app-visor" + (indice ? " con-indice" : "")}>
        <BarraSuperior
          barajas={todasBarajas}
          mazoActivo={mazoActivo}
          nombreMazo={nombreMazo}
          iconoMazo={iconoSelector}
          onMazo={cambiarMazo}
          onInicio={volverAInicio}
          tipos={tipos}
          filtro={filtro}
          onFiltro={setFiltro}
          cartas={cartas}
          visibles={visibles.length}
          seleccionadas={seleccionadas.length}
          total={cartas.length}
          onIndice={() => setIndice(true)}
          onIr={irACarta}
          onImprimir={() => setDialogo(true)}
          hayFichas={!!fichas}
          onFichas={() => setVerFichas(true)}
          usuario={usuario}
          avatarUrl={userAvatarUrl(usuario)}
          onLogout={cerrarSesion}
        />

        <div className="rejilla" ref={tiraRef}>
          {visibles.map((c) => (
            <MiniCarta
              key={c.id}
              carta={c}
              seleccionada={estaSeleccionada(c.id)}
              activa={c.id === transicionId && c.id !== detalleId}
              onAbrir={abrirDetalle}
              onAlternar={alternar}
            />
          ))}
          {!visibles.length && <p className="tenue">No hay cartas de este tipo en la baraja.</p>}
        </div>
      </div>

      {indice && (
        <Indice
          cartas={cartas}
          nombreMazo={nombreMazo}
          actual={detalleId}
          onIr={irACarta}
          onCerrar={() => setIndice(false)}
        />
      )}

      {detalle && (
        <DetalleCarta
          carta={detalle}
          conIndice={indice}
          nombreMazo={nombreMazo}
          icono={iconoMazoUrl}
          seleccionada={estaSeleccionada(detalle.id)}
          onAlternar={alternar}
          onCerrar={cerrarDetalle}
          onAnterior={() => irRelativo(-1)}
          onSiguiente={() => irRelativo(1)}
          narrando={narrando}
          onNarrar={() => setNarrando((n) => !n)}
        />
      )}

      {verFichas && fichas && (
        <FichasAmpliadas fichas={fichas} nombreMazo={nombreMazo} onCerrar={() => setVerFichas(false)} />
      )}

      {dialogo && (
        <DialogoImpresion
          formato={formato}
          onFormato={setFormatoId}
          incluirDorsos={incluirDorsos}
          onDorsos={setIncluirDorsos}
          fichas={fichas}
          incluirFichas={incluirFichas}
          onFichas={setIncluirFichas}
          impresoras={impresoras}
          impresoraId={impresoraId}
          onImpresora={setImpresoraId}
          onImpresoras={setImpresoras}
          cartas={cartas}
          estaSeleccionada={estaSeleccionada}
          onAlternar={alternar}
          onTodas={marcarTodo}
          onNinguna={desmarcarTodo}
          onInvertir={invertirTodo}
          seleccionadas={seleccionadas}
          total={cartas.length}
          hayFiltro={filtro.length > 0}
          onCerrar={() => setDialogo(false)}
          onImprimir={() => window.print()}
        />
      )}

      <HojasImpresion
        cartas={seleccionadas}
        formato={formato}
        incluirDorsos={incluirDorsos}
        nombreMazo={nombreMazo}
        icono={iconoMazoUrl}
        fichas={fichas}
        incluirFichas={incluirFichas}
        desvio={desvio}
      />
    </>
  );
}

async function procesarVerificacionPendiente() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId");
  const secret = params.get("secret");
  if (!params.get("verify") || !userId || !secret) return;

  await completeVerification(userId, secret);
  window.history.replaceState(null, "", window.location.pathname + window.location.hash);
}

function procesarErrorOAuthPendiente() {
  const params = new URLSearchParams(window.location.search);
  if (!params.get("oauth_error")) return "";

  params.delete("oauth_error");
  const search = params.toString();
  window.history.replaceState(null, "", window.location.pathname + (search ? `?${search}` : "") + window.location.hash);
  return "No se pudo iniciar sesión con Google.";
}

function estadoParaUsuario(user) {
  if (!user) return "login";
  if (!user.emailVerification) return "no-verificado";
  if (!Array.isArray(user.labels) || !user.labels.includes("aceptado")) return "pendiente";
  return "cargando";
}

function PantallaEstado({ texto, detalle, ayuda, accion, onAccion, accionSecundaria, onAccionSecundaria, error }) {
  return (
    <>
      <style>{estilos}</style>
      <div className="app-visor" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div className="panel" style={{ padding: 24, textAlign: "center" }}>
          <p>{texto}</p>
          {detalle && <p className="tenue">{detalle}</p>}
          {ayuda && <p className="tenue">{ayuda}</p>}
          {error && <p className="error">{error}</p>}
          {accion && <button className="btn btn-primario" onClick={onAccion}>{accion}</button>}
          {accionSecundaria && <button className="btn" onClick={onAccionSecundaria} style={{ marginLeft: 8 }}>{accionSecundaria}</button>}
        </div>
      </div>
    </>
  );
}

function LoginAppwrite({ error, onLogin, onGoogleLogin, onRegister }) {
  const [modo, setModo] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async (event) => {
    event.preventDefault();
    setEnviando(true);
    if (modo === "registro") await onRegister(email, password, name);
    else await onLogin(email, password);
    setEnviando(false);
  };

  return (
    <>
      <style>{estilos}</style>
      <div className="app-visor" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <form className="panel" onSubmit={enviar} style={{ width: "min(360px, calc(100vw - 32px))", padding: 24 }}>
          <h1 style={{ marginTop: 0 }}>KT Cartas</h1>
          <p className="tenue">{modo === "registro" ? "Crear cuenta" : "Acceso con Appwrite"}</p>
          {modo === "registro" && (
            <label style={{ display: "block", marginBottom: 12 }}>
              Nombre
              <input value={name} onChange={(e) => setName(e.target.value)} type="text" autoComplete="name" style={{ width: "100%" }} />
            </label>
          )}
          <label style={{ display: "block", marginBottom: 12 }}>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" style={{ width: "100%" }} />
          </label>
          <label style={{ display: "block", marginBottom: 16 }}>
            Contraseña
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required autoComplete="current-password" style={{ width: "100%" }} />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primario" disabled={enviando}>{enviando ? "Enviando…" : modo === "registro" ? "Registrarse" : "Entrar"}</button>
          {modo === "login" && (
            <button type="button" className="btn" onClick={onGoogleLogin} disabled={enviando} style={{ marginLeft: 8 }}>
              Entrar con Google
            </button>
          )}
          <button type="button" className="btn" onClick={() => setModo(modo === "registro" ? "login" : "registro")} style={{ marginLeft: 8 }}>
            {modo === "registro" ? "Ya tengo cuenta" : "Registrarse"}
          </button>
        </form>
      </div>
    </>
  );
}
