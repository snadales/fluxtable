# 🏗️ Arquitectura General del Sistema y Despliegue

Este documento describe la arquitectura global, la infraestructura en contenedores, las políticas de seguridad y la operación local de **BaserowLite**.

---

## 1. Topología del Sistema

```mermaid
flowchart TD
    User["Usuario / Navegador / API Client"] --> ReverseProxy["Next.js 15 Standalone (:3000)"]
    
    subgraph Containerized Application
        ReverseProxy --> AppRouter["App Router (Dashboard, Grid, Kanban, Form)"]
        ReverseProxy --> RouteHandlers["Route Handlers (/api/v1/...)"]
        ReverseProxy --> ServerActions["Server Actions (Mutaciones atómicas)"]
        
        AppRouter --> ViewEngine["Motor de Vistas (TanStack Virtual, DND)"]
        RouteHandlers --> AuthGuard["Guard de Tokens & RBAC"]
        ServerActions --> FormulaEngine["Evaluador AST Formula-Lite"]
        
        AuthGuard --> DrizzleORM["Drizzle ORM Engine"]
        FormulaEngine --> DrizzleORM
        
        StorageModule["LocalStorageProvider"] --> UploadsVol[("./data/uploads (Volumen Local)")]
    end

    subgraph Data Storage
        DrizzleORM --> Postgres[(PostgreSQL 16 Alpine)]
        Postgres --> DBVol[("./data/postgres (Volumen Local)")]
    end
```

---

## 2. Docker Compose para Ejecución Local con Un Solo Comando

El proyecto se inicia completamente con:
```bash
docker compose up -d
```

### Definición de `docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: baserow_lite_db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-baserow_lite}
      POSTGRES_USER: ${POSTGRES_USER:-baserow_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-baserow_pass}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-baserow_user} -d ${POSTGRES_DB:-baserow_lite}"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: baserow_lite_app
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://${POSTGRES_USER:-baserow_user}:${POSTGRES_PASSWORD:-baserow_pass}@postgres:5432/${POSTGRES_DB:-baserow_lite}
      APP_SECRET: ${APP_SECRET}
      STORAGE_DRIVER: ${STORAGE_DRIVER:-local}
      LOCAL_STORAGE_PATH: /app/storage/uploads
    ports:
      - "${PORT:-3000}:3000"
    volumes:
      - ./data/uploads:/app/storage/uploads
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 3
```

---

## 3. Estrategia de Inicialización y Migraciones Automáticas

Para garantizar que el primer inicio funcione sin intervención manual:
1. El contenedor `app` ejecuta un script de entrada (`entrypoint.sh`):
   ```bash
   #!/bin/sh
   echo "Ejecutando migraciones de base de datos..."
   npx drizzle-kit migrate
   
   echo "Ejecutando seed de bienvenida si la base de datos está vacía..."
   node dist/db/seed.js
   
   echo "Iniciando servidor Next.js..."
   exec node server.js
   ```
2. **Seed de Bienvenida:** Crea automáticamente un Workspace "Principal", una Base "Proyectos y Tareas" con dos tablas vinculadas y registros de demostración con diferentes colores y formatos para probar el sistema de inmediato.

---

## 4. Políticas de Backup y Recuperación de Datos

Todos los datos residen en la carpeta local `./data/`:
- `./data/postgres/`: Datos binarios de PostgreSQL.
- `./data/uploads/`: Archivos adjuntos originales organizados por hash.

### Comando de Respaldo Automatizado (Dump SQL):
```bash
docker exec -t baserow_lite_db pg_dump -U baserow_user -d baserow_lite | gzip > ./backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Comando de Restauración:
```bash
gunzip -c ./backups/backup_archivo.sql.gz | docker exec -i baserow_lite_db psql -U baserow_user -d baserow_lite
```
