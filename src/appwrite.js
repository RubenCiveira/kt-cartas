import { Account, Avatars, Client, Functions, ID, OAuthProvider, Permission, Query, Role, Storage, TablesDB } from "appwrite";

export const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || "https://appwrite.civeira.net/v1";
export const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || "6a78dce100015acd19b2";
export const APPWRITE_ASSETS_BUCKET_ID = import.meta.env.VITE_APPWRITE_ASSETS_BUCKET_ID || "deck_assets";
export const APPWRITE_REVIEW_FUNCTION_ID = import.meta.env.VITE_APPWRITE_REVIEW_FUNCTION_ID || "notify_verified_user";
export const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || "kt_cartas";
export const APPWRITE_PRINT_DECKS_TABLE_ID = import.meta.env.VITE_APPWRITE_PRINT_DECKS_TABLE_ID || "print_decks";

const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
let storageJwt = "";

export const account = new Account(client);
export const avatars = new Avatars(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
export const tablesDB = new TablesDB(client);

export function userAvatarUrl(user) {
  const name = user?.name || user?.email || "Usuario";
  return avatars.getInitials(name, 80, 80).toString();
}

export function fileUrl(fileId) {
  const url = new URL(storage.getFileView(APPWRITE_ASSETS_BUCKET_ID, fileId).toString());
  if (storageJwt) url.searchParams.set("jwt", storageJwt);
  return url.toString();
}

export async function getSessionUser() {
  try {
    clearClientJwt();
    const user = await account.get();
    await refreshStorageJwt();
    return user;
  } catch (error) {
    if (error.code !== 401) throw error;
    return null;
  }
}

export async function login(email, password) {
  clearClientJwt();
  try {
    await account.createEmailPasswordSession(email, password);
  } catch (error) {
    if (!String(error.message || "").includes("another session is active")) throw error;
  }
  return getSessionUser();
}

export function loginWithGoogle() {
  clearClientJwt();
  const successUrl = cleanCurrentUrl();
  const failureUrl = new URL(successUrl);
  failureUrl.searchParams.set("oauth_error", "1");
  account.createOAuth2Session({
    provider: OAuthProvider.Google,
    success: successUrl.toString(),
    failure: failureUrl.toString(),
  });
}

export async function register(email, password, name) {
  clearClientJwt();
  await account.create(ID.unique(), email, password, name || undefined);
  await account.createEmailPasswordSession(email, password);
  await refreshStorageJwt();
  await sendVerification();
  return account.get();
}

export async function sendVerification() {
  const url = `${window.location.origin}${window.location.pathname}?verify=1`;
  return account.createVerification(url);
}

export async function completeVerification(userId, secret) {
  return account.updateVerification(userId, secret);
}

export async function requestAccessReview(userId) {
  const execution = await functions.createExecution({
    functionId: APPWRITE_REVIEW_FUNCTION_ID,
    body: JSON.stringify({ userId }),
  });
  const body = execution.responseBody ? JSON.parse(execution.responseBody) : {};
  if (execution.responseStatusCode >= 400 || body.ok === false) {
    throw new Error(body.message || body.reason || "No se pudo solicitar la revisión.");
  }
  return body;
}

export async function logout() {
  storageJwt = "";
  clearClientJwt();
  await account.deleteSession("current");
}

export async function fetchFileBlobUrl(fileId) {
  const apiPath = `/storage/buckets/${encodeURIComponent(APPWRITE_ASSETS_BUCKET_ID)}/files/${encodeURIComponent(fileId)}/view`;
  const url = new URL(APPWRITE_ENDPOINT + apiPath);
  const data = await client.call("get", url, {
    "X-Appwrite-Project": APPWRITE_PROJECT_ID,
    accept: "*/*",
  }, {}, "arrayBuffer");
  return URL.createObjectURL(new Blob([data]));
}

async function refreshStorageJwt() {
  clearClientJwt();
  const token = await account.createJWT({ duration: 3600 });
  storageJwt = token.jwt;
}

function clearClientJwt() {
  delete client.headers["X-Appwrite-JWT"];
  client.config.jwt = "";
}

function cleanCurrentUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("oauth_error");
  url.searchParams.delete("verify");
  url.searchParams.delete("userId");
  url.searchParams.delete("secret");
  return url;
}

// ---------- Mazos de impresión ----------
//
// Filas de la tabla `print_decks`, una por mazo. Van en Appwrite y no en
// localStorage para que el mazo sea el mismo en el portátil que en el móvil que
// tienes al lado de la impresora, que es justo cuando se usa.
//
// La tabla tiene rowSecurity, así que los permisos se ponen fila a fila: solo
// su dueño la lee, la cambia y la borra. El `userId` de la columna es para
// poder consultarlos desde el servidor; quien filtra de verdad es Appwrite.

const permisosDe = (userId) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
];

export async function listarMazosImpresion(userId) {
  const page = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: APPWRITE_PRINT_DECKS_TABLE_ID,
    queries: [Query.equal("userId", userId), Query.orderDesc("$updatedAt"), Query.limit(100)],
  });
  return page.rows;
}

export async function crearMazoImpresion(userId, nombre, cartas = []) {
  return tablesDB.createRow({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: APPWRITE_PRINT_DECKS_TABLE_ID,
    rowId: ID.unique(),
    data: { userId, nombre, cartas, actualizado: new Date().toISOString() },
    permissions: permisosDe(userId),
  });
}

// Los permisos no se tocan al actualizar: son los del alta, y reenviarlos
// obligaría a acertar con el userId en cada guardado.
export async function guardarMazoImpresion(rowId, datos) {
  return tablesDB.updateRow({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: APPWRITE_PRINT_DECKS_TABLE_ID,
    rowId,
    data: { ...datos, actualizado: new Date().toISOString() },
  });
}

export async function borrarMazoImpresion(rowId) {
  return tablesDB.deleteRow({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: APPWRITE_PRINT_DECKS_TABLE_ID,
    rowId,
  });
}

export async function listBucketFiles(queries = []) {
  const files = [];
  for (let offset = 0; ; offset += 100) {
    const page = await storage.listFiles(APPWRITE_ASSETS_BUCKET_ID, [
      ...queries,
      Query.limit(100),
      Query.offset(offset),
    ]);
    files.push(...page.files);
    if (files.length >= page.total || page.files.length === 0) return files;
  }
}

export async function fetchJsonFile(fileId, version = "") {
  const apiPath = `/storage/buckets/${encodeURIComponent(APPWRITE_ASSETS_BUCKET_ID)}/files/${encodeURIComponent(fileId)}/view`;
  const url = new URL(APPWRITE_ENDPOINT + apiPath);
  if (version) url.searchParams.set("v", version);
  const data = await client.call("get", url, {
    "X-Appwrite-Project": APPWRITE_PROJECT_ID,
    "cache-control": "no-cache",
    accept: "application/json",
  });
  if (typeof data?.message === "string") return JSON.parse(data.message);
  return data;
}
