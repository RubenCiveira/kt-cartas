import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true, watch: null, hmr: false, ws: false } });
after(() => server.close());
const { default: HojasCenitales } = await server.ssrLoadModule("/src/print/HojasCenitales.jsx");
const { default: DialogoFichasCenitales } = await server.ssrLoadModule("/src/viewer/DialogoFichasCenitales.jsx");

test("abrir una banda restaura los nombres y ofrece actualizarla sin crear otra", () => {
  const html = renderToStaticMarkup(createElement(DialogoFichasCenitales, {
    cartas: [{ id: "c1", tipo: "datacard", titulo: "Guerrero", cantidadMaximo: 3, nombresSugeridos: [], stats: {} }],
    banda: { nombre: "Lobos", familia: "", operadores: [
      { id: "uno", cartaId: "c1", titulo: "Guerrero", nombre: "Ulf" },
      { id: "dos", cartaId: "c1", titulo: "Guerrero", nombre: "Erik" },
    ] },
    onGuardarBanda: () => {},
  }));
  assert.deepEqual({
    ulf: html.includes('value="Ulf"'), erik: html.includes('value="Erik"'),
    actualizar: html.includes("Guardar cambios"), crear: html.includes("Guardar como banda"),
  }, { ulf: true, erik: true, actualizar: true, crear: false });
});

for (const [estiloControl, clase] of Object.entries({
  escribir: "control-tabla",
  tablero: "tablero-rejilla",
  tarjeta: "tablero-lineas",
  carta: "ctl-carta-b",
})) {
  for (const control of [true, false]) {
    test(`${estiloControl}: control ${control ? "activado" : "desactivado"}`, () => {
      const html = renderToStaticMarkup(createElement(HojasCenitales, {
        nombreMazo: "Prueba",
        plancha: {
          tamano: "28mm", estiloControl, control, agentes: false, tokens: false,
          fichas: [{ clave: "agente-1", nombre: "Agente", titulo: "Operativo", stats: { her: 8 }, datos: [] }],
        },
      }));
      assert.deepEqual(
        ["control-tabla", "tablero-rejilla", "tablero-lineas", "ctl-carta-b"].filter((c) => new RegExp(`class="[^"]*\\b${c}\\b`).test(html)),
        control ? [clase] : [],
      );
    });
  }
}
