# Bandas · contexto de simulación

## Purpose

Probar el guardado, la actualización y la lectura de bandas con el SDK real. El contrato parcial
está en `../mocks/appwrite-bandas/default.js`, basado en el SDK instalado y en
`app-write/appwrite.config.json`.

## Execution

Los comandos de arranque y prueba están en `web-app/CLAUDE.md`, «Bandas privadas».
Esperar al evento `listening` y usar su dirección. Parar la simulación con
`pkill -INT -f 'simulation run .*bandas.sim.yaml'`.

## Assumptions

- Reiniciar antes de cada prueba: el mock conserva las altas en `pm.state`.
  Una ejecución anterior añade filas al listado. (observado 2026-10-27)
- La privacidad se simula por usuario; el resultado no demuestra el aislamiento
  de cuentas en Appwrite real. (razonado 2026-10-27, handler del mock)

## Observations

<!-- begin:observations -->
2026-10-27: `appwrite` sirvió también PATCH sobre la misma banda; la prueba
conservó IDs, facción, propietario y permisos, y rechazó actualizar desde otro
usuario. Pasó `bandas-api.test.mjs`.
2026-10-27: el único miembro, `appwrite`, sirvió altas, consultas filtradas,
lista vacía, paginación de 101 bandas y errores 401/404. Pasó `bandas-api.test.mjs`.
<!-- end:observations -->

## What didn't work

- 2026-10-27: el sandbox bloquea escuchar o conectar a localhost con `EPERM`;
  servidor y prueba HTTP necesitan ejecución con permisos de red.
