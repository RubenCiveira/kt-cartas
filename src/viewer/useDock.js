// Dock: la tira de cartas reacciona a la distancia real al puntero.
//
// Cada carta se amplía según una campana centrada en el cursor, y además se
// aparta para hacer sitio a las que han crecido, igual que el dock de macOS.
// Es continuo (no hay estados "vecina" ni "lejana"), así que no depende de
// quién esté al lado en el DOM y no se rompe con distintas anchuras: las
// fichas de datos son apaisadas y entran en el mismo cálculo.
//
// Se activa solo con puntero fino. En táctil manda el carrusel con foco
// central (scroll-snap + animation-timeline), que vive en los estilos.

import { useEffect } from "react";

const AMPLITUD = 0.3; // cuánto crece la carta justo bajo el cursor
const ALCANCE = 190; // px hasta donde se nota el efecto (sigma de la campana)
const CORTE = 3 * ALCANCE; // más allá, la carta ni se entera

export default function useDock(ref, deps) {
  useEffect(() => {
    const tira = ref.current;
    if (!tira) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    tira.classList.add("dock");

    // Posiciones de reposo, medidas en el espacio del contenido de la tira
    // (sin desplazar). Se limpian antes los transform para leer la maquetación
    // real, y no se usa offsetLeft: ese depende de quién sea el offsetParent,
    // y basta que algo mueva la tira —abrir el índice, por ejemplo— para que
    // las cuentas se desplacen sin avisar.
    let bases = [];
    const medir = () => {
      const cartas = [...tira.querySelectorAll(".mini")];
      cartas.forEach((el) => { el.style.transform = ""; });
      const origen = tira.getBoundingClientRect().left - tira.scrollLeft;
      bases = cartas.map((el) => {
        const r = el.getBoundingClientRect();
        return { el, w: r.width, centro: r.left - origen + r.width / 2, ultimo: "" };
      });
    };
    medir();

    let punteroX = null; // en coordenadas de viewport
    let pendiente = 0;

    const pintar = () => {
      pendiente = 0;
      if (!bases.length) return;

      if (punteroX === null) {
        for (const b of bases) {
          if (b.ultimo !== "") { b.el.style.transform = ""; b.ultimo = ""; }
        }
        return;
      }

      // El puntero, en el mismo espacio que offsetLeft (contenido sin desplazar)
      const x = punteroX - tira.getBoundingClientRect().left + tira.scrollLeft;

      const escalas = bases.map((b) => {
        const d = b.centro - x;
        if (Math.abs(d) > CORTE) return { s: 1, crece: 0 };
        const s = 1 + AMPLITUD * Math.exp(-0.5 * (d / ALCANCE) ** 2);
        return { s, crece: b.w * (s - 1) };
      });

      // Cuánto ha crecido todo lo que queda a la izquierda del cursor: es lo
      // que hay que descontar para que el punto que estás señalando no se mueva.
      let ancla = 0;
      bases.forEach((b, i) => {
        const t = Math.min(1, Math.max(0, (x - (b.centro - b.w / 2)) / b.w));
        ancla += escalas[i].crece * t;
      });

      let acumulado = 0;
      bases.forEach((b, i) => {
        const desplaza = acumulado + escalas[i].crece / 2 - ancla;
        acumulado += escalas[i].crece;
        const t =
          escalas[i].s === 1 && Math.abs(desplaza) < 0.5
            ? ""
            : `translateX(${desplaza.toFixed(2)}px) scale(${escalas[i].s.toFixed(4)})`;
        if (t !== b.ultimo) { b.el.style.transform = t; b.ultimo = t; }
      });
    };

    const encolar = () => {
      if (!pendiente) pendiente = requestAnimationFrame(pintar);
    };

    const alMover = (e) => {
      tira.classList.remove("reposo");
      punteroX = e.clientX;
      encolar();
    };
    const alSalir = () => {
      // Al salir sí queremos una transición: el dock se deshace con suavidad
      tira.classList.add("reposo");
      punteroX = null;
      encolar();
    };
    // La rueda vertical es la única que tiene la mayoría de ratones: sin esto
    // una tira horizontal es innavegable.
    const alRodar = (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      tira.scrollLeft += e.deltaY;
      e.preventDefault();
    };

    tira.addEventListener("pointermove", alMover);
    tira.addEventListener("pointerleave", alSalir);
    tira.addEventListener("wheel", alRodar, { passive: false });
    tira.addEventListener("scroll", encolar, { passive: true });
    const alRedimensionar = () => { medir(); encolar(); };
    window.addEventListener("resize", alRedimensionar);

    return () => {
      cancelAnimationFrame(pendiente);
      tira.removeEventListener("pointermove", alMover);
      tira.removeEventListener("pointerleave", alSalir);
      tira.removeEventListener("wheel", alRodar);
      tira.removeEventListener("scroll", encolar);
      window.removeEventListener("resize", alRedimensionar);
      tira.classList.remove("dock", "reposo");
      bases.forEach((b) => { b.el.style.transform = ""; });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
