import { Account, Avatars, Client, Functions, ID, Query, Storage } from "appwrite";

export const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || "https://appwrite.civeira.net/v1";
export const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || "6a78dce100015acd19b2";
export const APPWRITE_ASSETS_BUCKET_ID = import.meta.env.VITE_APPWRITE_ASSETS_BUCKET_ID || "deck_assets";
export const APPWRITE_REVIEW_FUNCTION_ID = import.meta.env.VITE_APPWRITE_REVIEW_FUNCTION_ID || "notify_verified_user";

const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
let storageJwt = "";

export const account = new Account(client);
export const avatars = new Avatars(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

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

export async function fetchJsonFile(fileId) {
  const apiPath = `/storage/buckets/${encodeURIComponent(APPWRITE_ASSETS_BUCKET_ID)}/files/${encodeURIComponent(fileId)}/view`;
  const url = new URL(APPWRITE_ENDPOINT + apiPath);
  const data = await client.call("get", url, {
    "X-Appwrite-Project": APPWRITE_PROJECT_ID,
    accept: "application/json",
  });
  if (typeof data?.message === "string") return JSON.parse(data.message);
  return data;
}
