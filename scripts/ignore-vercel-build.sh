#!/bin/bash
# Ignorar despliegues de Vercel cuando solo hay cambios en Móvil o Servidor.
# Código 0: cancela el despliegue porque no hay cambios en Web/Admin.
# Código 1: permite el despliegue porque hay cambios en Web/Admin.

echo "Verificando si hay cambios en la Web App / Admin..."

PREV="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"
CURR="${VERCEL_GIT_COMMIT_SHA:-HEAD}"

if ! git rev-parse "$PREV" >/dev/null 2>&1; then
  echo "No se encontró commit previo para comparar. Procediendo con el despliegue."
  exit 1
fi

# Solo los directorios y puntos de entrada de los frontends Web y Admin.
if git diff --quiet "$PREV" "$CURR" -- \
  src/app/web/ \
  src/app/admin/ \
  src/index.css \
  index.html \
  admin.html \
  vite.config.ts \
  vercel.json; then
  echo "No se detectaron cambios en Web ni Admin. Cancelando despliegue en Vercel."
  exit 0
else
  echo "Cambios detectados en Web o Admin. Continuando despliegue en Vercel..."
  exit 1
fi
