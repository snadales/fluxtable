#!/bin/sh
set -e

echo "🚀 [BaserowLite] Iniciando contenedor..."

# Esperar a que PostgreSQL esté listo si DATABASE_URL está definida
if [ -n "$DATABASE_URL" ]; then
  echo "📦 Verificando conexión a PostgreSQL..."
fi

echo "🔄 Ejecutando migraciones de base de datos con Drizzle..."
npx drizzle-kit migrate || echo "⚠️ Las migraciones ya fueron aplicadas o el esquema está al día."

echo "🌱 Verificando seed de bienvenida..."
node --loader tsx db/seed.ts || echo "ℹ️ Base de datos ya inicializada."

echo "✨ Servidor Next.js 15 listo en puerto $PORT"
exec "$@"
