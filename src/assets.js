import { useEffect, useState } from "react";

import { fetchFileBlobUrl, fileUrl } from "./appwrite.js";

import iconoPorDefecto from "./icons/default.png";

const cacheAssets = new Map();

// TEMPORAL: para probar imágenes de miniatura locales (public/test-miniaturas/)
// arrastrando un JSON de baraja, sin publicarlas antes en Appwrite. Un valor
// que ya es una ruta o URL se sirve tal cual; cualquier otro sigue yendo al
// bucket como siempre. Quitar cuando se termine de probar.
function esRutaLocal(valor) {
  return /^(https?:)?\/\//.test(valor) || valor.startsWith("/");
}

export function assetUrl(fileId) {
  if (!fileId) return null;
  return esRutaLocal(fileId) ? fileId : fileUrl(fileId);
}

export function useAssetUrl(fileId) {
  const [url, setUrl] = useState(() => (fileId && esRutaLocal(fileId) ? fileId : urlCacheada(fileId)));

  useEffect(() => {
    let cancelado = false;
    if (!fileId) {
      setUrl(null);
      return () => { cancelado = true; };
    }
    if (esRutaLocal(fileId)) {
      setUrl(fileId);
      return () => { cancelado = true; };
    }

    const cacheada = urlCacheada(fileId);
    if (cacheada) setUrl(cacheada);
    cargarAsset(fileId)
      .then((u) => {
        if (!cancelado) setUrl(u);
      })
      .catch(() => {
        if (!cancelado) setUrl(assetUrl(fileId));
      });

    return () => { cancelado = true; };
  }, [fileId]);

  return url;
}

export function useIconoBarajaUrl(fileId) {
  return useAssetUrl(fileId) || iconoPorDefecto;
}

// Icono con el que se lista una baraja que no trae el suyo. Es solo para las
// listas de barajas —la portada y el selector de la barra—, donde un hueco
// vacío rompe la rejilla: en el dorso de las cartas manda el icono del tipo de
// carta, y ahí una baraja sin icono no pinta nada.
export function iconoBarajaUrl(fileId) {
  return assetUrl(fileId) || iconoPorDefecto;
}

function urlCacheada(fileId) {
  if (!fileId) return null;
  const cacheada = cacheAssets.get(fileId);
  return typeof cacheada === "string" ? cacheada : null;
}

async function cargarAsset(fileId) {
  const cacheada = cacheAssets.get(fileId);
  if (cacheada) return cacheada;

  const carga = fetchFileBlobUrl(fileId).then((url) => {
    cacheAssets.set(fileId, url);
    return url;
  }).catch((error) => {
    cacheAssets.delete(fileId);
    throw error;
  });
  cacheAssets.set(fileId, carga);
  return carga;
}
