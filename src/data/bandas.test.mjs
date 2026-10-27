import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { agruparBandas, datosDeBanda, normalizarBanda, seleccionDeBanda } from "./bandas.js";

test("reabre cada miembro por su carta y conserva su nombre e identidad aunque cambie el título", () => {
  assert.deepEqual(seleccionDeBanda(seleccion, [{ cartaId: "c12", titulo: "Guerrero nuevo" }]), {
    cuantos: { "Guerrero nuevo": 2 }, nombres: { "Guerrero nuevo": ["  Ulf  ", "Erik"] },
    ids: { "Guerrero nuevo": ["agente-1", "agente-2"] }, faltantes: [],
  });
});

test("detecta miembros cuya carta ya no existe para impedir sobrescribirlos", () => {
  assert.deepEqual(seleccionDeBanda(seleccion, []).faltantes, seleccion.operadores);
});

test("agrupa por la facción guardada y conserva bandas de facciones no disponibles", () => {
  const baraja = { clave: "faccion:wolfs", nombre: "Lobos", icono: "/lobos.png" };
  const bandas = [{ id: "1", faccion: baraja.clave }, { id: "2", faccion: "faccion:otra" }, { id: "3", faccion: baraja.clave }];
  assert.deepEqual(agruparBandas(bandas, [baraja]), [
    { faccion: baraja.clave, baraja, bandas: [bandas[0], bandas[2]] },
    { faccion: "faccion:otra", baraja: undefined, bandas: [bandas[1]] },
  ]);
});

test("recupera los nombres y referencias guardados en Appwrite", () => {
  assert.deepEqual(normalizarBanda({ $id: "banda-1", ...datosDeBanda(seleccion) }), {
    id: "banda-1", nombre: "Los lobos", faccion: "faccion:wolfs", familia: "Orkos",
    operadores: [
      { id: "agente-1", cartaId: "c12", titulo: "Guerrero", nombre: "Ulf" },
      { id: "agente-2", cartaId: "c12", titulo: "Guerrero", nombre: "Erik" },
    ],
  });
});

const seleccion = {
  nombre: "  Los lobos  ", faccion: "faccion:wolfs", familia: "Orkos",
  operadores: [
    { id: "agente-1", cartaId: "c12", titulo: "Guerrero", nombre: "  Ulf  ", foto: "no-guardar" },
    { id: "agente-2", cartaId: "c12", titulo: "Guerrero", nombre: "Erik" },
  ],
};

test("guarda cada copia con su identidad y nombre, sin copiar reglas ni aceptar un dueño externo", () => {
  assert.deepEqual(datosDeBanda({ ...seleccion, userId: "otro", permissions: ["read(\"any\")"] }), {
    nombre: "Los lobos", faccion: "faccion:wolfs", familia: "Orkos",
    operadores: [
      JSON.stringify({ id: "agente-1", cartaId: "c12", titulo: "Guerrero", nombre: "Ulf" }),
      JSON.stringify({ id: "agente-2", cartaId: "c12", titulo: "Guerrero", nombre: "Erik" }),
    ],
  });
});

for (const [caso, cambios] of Object.entries({
  "nombre vacío": { nombre: "   " },
  "nombre demasiado largo": { nombre: "a".repeat(121) },
  "sin facción": { faccion: "" },
  "sin operativos": { operadores: [] },
  "operativo sin carta": { operadores: [{ ...seleccion.operadores[0], cartaId: "" }] },
  "operativo sin nombre": { operadores: [{ ...seleccion.operadores[0], nombre: " " }] },
  "nombre de operativo demasiado largo": { operadores: [{ ...seleccion.operadores[0], nombre: "a".repeat(161) }] },
  "identidades duplicadas": { operadores: [seleccion.operadores[0], seleccion.operadores[0]] },
})) {
  test(`rechaza ${caso}`, () => assert.throws(() => datosDeBanda({ ...seleccion, ...cambios })));
}

test("la tabla solo concede crear, con lectura y escritura restringidas por fila", () => {
  const config = JSON.parse(readFileSync(new URL("../../../app-write/appwrite.config.json", import.meta.url)));
  const tabla = config.tables.find((t) => t.$id === "bandas");
  assert.deepEqual(
    { permisos: tabla.$permissions, seguridad: tabla.rowSecurity, cifrado: tabla.columns.filter((c) => c.type === "string").every((c) => c.encrypt === false) },
    { permisos: ['create("label:aceptado")'], seguridad: true, cifrado: true },
  );
});
