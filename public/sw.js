const CACHE_NAME = "kt-cartas-shell-v1";
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./favicon.png", "./pwa-192.png", "./pwa-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("./index.html")));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      // La copia se saca ya: cuando abra la cache, la pagina habra leido la
      // respuesta y no se podra clonar. waitUntil mantiene vivo el worker
      // hasta que termine de guardarla.
      if (response.ok) {
        const copia = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copia)));
      }
      return response;
    }))
  );
});
