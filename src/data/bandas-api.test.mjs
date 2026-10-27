import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "vite";

// Ejecutar con BANDAS_SIM_URL=http://127.0.0.1:4900/appwrite/v1
// tras arrancar postman/simulations/bandas.sim.yaml.
test("guardado y listado mediante el SDK real contra la simulación HTTP de Appwrite", { skip: !process.env.BANDAS_SIM_URL }, async (t) => {
  const server = await createServer({
    define: { "import.meta.env.VITE_APPWRITE_ENDPOINT": JSON.stringify(process.env.BANDAS_SIM_URL) },
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
  });
  t.after(() => server.close());
  const { account, crearBanda, listarBandas, actualizarBanda } = await server.ssrLoadModule("/src/appwrite.js");
  const datos = {
    nombre: "Lobos", faccion: "faccion:wolfs", userId: "intruso",
    operadores: [
      { cartaId: "c1", titulo: "Guerrero", nombre: "Ulf" },
      { cartaId: "c1", titulo: "Guerrero", nombre: "Erik" },
    ],
  };
  account.client.setJWT("propietario");
  const banda = await crearBanda(datos);
  const operadores = banda.operadores.map((op) => JSON.parse(op));
  assert.deepEqual({
    nombre: banda.nombre, faccion: banda.faccion, propietario: banda.userId,
    permisos: banda.$permissions, nombres: operadores.map((op) => op.nombre),
    identidades: new Set(operadores.map((op) => op.id)).size,
  }, {
    nombre: "Lobos", faccion: "faccion:wolfs", propietario: "propietario",
    permisos: ['read("user:propietario")', 'update("user:propietario")', 'delete("user:propietario")'],
    nombres: ["Ulf", "Erik"], identidades: 2,
  });
  account.client.setJWT("tabla-ausente");
  await assert.rejects(crearBanda(datos), { code: 404, type: "table_not_found" });
  await assert.rejects(listarBandas("tabla-ausente"), { code: 404, type: "table_not_found" });
  account.client.setJWT("otro-usuario");
  await crearBanda({ ...datos, nombre: "Banda ajena" });
  account.client.setJWT("propietario");
  const actualizada = await actualizarBanda(banda.$id, {
    ...datos, nombre: "Lobos veteranos", operadores: [{ ...operadores[0], nombre: "Ulf veterano" }],
  });
  assert.deepEqual({ id: actualizada.$id, permisos: actualizada.$permissions, userId: actualizada.userId, faccion: actualizada.faccion, operadores: actualizada.operadores.map(JSON.parse) }, {
    id: banda.$id, permisos: banda.$permissions, userId: "propietario", faccion: "faccion:wolfs", operadores: [{ ...operadores[0], nombre: "Ulf veterano" }],
  });
  assert.deepEqual((await listarBandas("propietario")).map((row) => row.$id), [banda.$id]);
  assert.deepEqual(await listarBandas("otro-usuario"), []);
  account.client.setJWT("sin-equipos");
  await assert.rejects(actualizarBanda(banda.$id, { ...datos, operadores }), { code: 401 });
  assert.deepEqual(await listarBandas("sin-equipos"), []);
  account.client.setJWT("muchos");
  const muchas = await listarBandas("muchos");
  assert.deepEqual({ total: muchas.length, ultima: muchas.at(-1).$id }, { total: 101, ultima: "banda-100" });
  account.client.setJWT("");
  await assert.rejects(crearBanda(datos), { code: 401 });
});
