// Subconjunto del contrato Appwrite: sesión, creación y listado de bandas.
// Las respuestas se basan en el SDK instalado y en appwrite.config.json.
const http = require("http");

http.createServer(async (req, res) => {
  const usuario = req.headers["x-appwrite-jwt"];
  const responder = (code, body) => {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
  if (!usuario) return responder(401, { code: 401, type: "user_unauthorized", message: "Inicia sesión para guardar tu banda." });
  if (req.method === "GET" && req.url === "/v1/account") return responder(200, { $id: usuario });
  const url = new URL(req.url, "http://localhost");
  const rutaBandas = "/v1/tablesdb/kt_cartas/tables/bandas/rows";
  if (req.method === "PATCH" && url.pathname.startsWith(rutaBandas + "/")) {
    const rows = (await pm.state.get("appwrite-bandas.rows")) || [];
    const actual = rows.find((row) => row.$id === url.pathname.slice(rutaBandas.length + 1));
    if (!actual) return responder(404, { code: 404, type: "row_not_found", message: "Row not found" });
    if (actual.userId !== usuario) return responder(401, { code: 401, type: "user_unauthorized", message: "Sin acceso" });
    if (req.body.permissions || "userId" in req.body.data) return responder(400, { code: 400, message: "No se deben cambiar los permisos ni el propietario" });
    const actualizado = { ...actual, ...req.body.data };
    await pm.state.set("appwrite-bandas.rows", rows.map((row) => row.$id === actual.$id ? actualizado : row));
    return responder(200, actualizado);
  }
  if (url.pathname === rutaBandas && usuario === "tabla-ausente") {
    return responder(404, { code: 404, type: "table_not_found", message: "Table not found" });
  }
  if (req.method === "GET" && url.pathname === rutaBandas) {
    const queries = [...url.searchParams].filter(([key]) => key.startsWith("queries")).map(([, value]) => JSON.parse(value));
    const propietario = queries.find((q) => q.method === "equal" && q.attribute === "userId");
    if (!propietario) return responder(400, { code: 400, message: "Falta el filtro de propietario" });
    const limite = queries.find((q) => q.method === "limit")?.values[0] || 25;
    const cursor = queries.find((q) => q.method === "cursorAfter")?.values[0];
    const rows = usuario === "muchos"
      ? Array.from({ length: 101 }, (_, i) => ({ $id: `banda-${i}`, nombre: `Equipo ${i}`, faccion: "faccion:wolfs", userId: usuario, operadores: [] }))
      : (await pm.state.get("appwrite-bandas.rows")) || [];
    const propias = rows.filter((row) => row.userId === usuario && row.userId === propietario.values[0]);
    const inicio = cursor ? propias.findIndex((row) => row.$id === cursor) + 1 : 0;
    return responder(200, { total: propias.length, rows: propias.slice(inicio, inicio + limite) });
  }
  if (req.method === "POST" && req.url === "/v1/tablesdb/kt_cartas/tables/bandas/rows") {
    if (usuario === "tabla-ausente") return responder(404, { code: 404, type: "table_not_found", message: "Table not found" });
    const { rowId, data, permissions } = req.body;
    if (data.userId !== usuario || JSON.stringify(permissions) !== JSON.stringify([
      `read("user:${usuario}")`, `update("user:${usuario}")`, `delete("user:${usuario}")`,
    ])) return responder(400, { code: 400, message: "Propietario o permisos incorrectos" });
    const row = { $id: rowId, $permissions: permissions, ...data };
    await pm.state.set("appwrite-bandas.rows", [row, ...((await pm.state.get("appwrite-bandas.rows")) || [])]);
    return responder(201, row);
  }
  responder(501, { code: 501, message: "Endpoint no modelado" });
}).listen(process.env.PORT);
