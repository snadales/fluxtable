# 📌 BaserowLite

> Reemplazo personal, moderno y ligero para Baserow self-hosted, construido con **Next.js 15 (App Router)**, **TypeScript**, **PostgreSQL 16**, **Drizzle ORM** y **Docker Compose**.

---

## 🎯 Objetivo y Descripción

### Objetivo
Proporcionar una plataforma de base de datos relacional no-code de inicio rápido local con un único comando (`docker compose up -d`), con una huella de memoria mínima (<250 MB de RAM), sin intermediarios asíncronos pesados (sin Celery ni Redis), enfocada en la gestión de colores, formatos numéricos/monetarios (`es-CL`), vistas canónicas (Grid, Kanban, Formulario, Detalle) y API REST tokenizada 100% compatible con Baserow API v2.

### Descripción
BaserowLite implementa el modelo estructurado **Workspace ➔ Base ➔ Tabla ➔ Campo ➔ Registro ➔ Vista**:
- **Almacenamiento Híbrido:** Esquema relacional estricto gestionado con Drizzle ORM combinado con columnas JSONB tipadas para campos dinámicos sin penalización DDL.
- **Rico Soporte Visual:** Paleta semántica de 9 colores para etiquetas y estados, formato de moneda chilena (`$ 190.000`) e internacional (`US$ 1,250.50`), fechas y formateo condicional de filas/celdas.
- **Vistas Canónicas:** Grid virtualizado con edición en celda y teclado, Kanban interactivo con drag-and-drop, Formularios públicos de captura con validación Zod y Vista Detalle con notas Markdown (estilo Notion).
- **Motor de Fórmulas Ligeras (`formula-lite`):** Evaluador seguro con analizador sintáctico AST propio en TypeScript (sin `eval()`) con soporte para códigos de error (`#DIV/0!`, `#REF!`, `#VALUE!`).
- **Seguridad e Integridad:** Concurrencia optimista basada en versiones (`version`), auditoría forense (`audit_logs`), papelera con restauración y API REST dinámica asegurada con tokens Bearer.

---

## 🗺️ Índice de Navegación y Documentación Técnica

- 🔐 [Usuarios, Google OAuth, Logs y Trazabilidad (docs/authAndObservability.md)](file:///Users/snadales/Dev/01_Homelab/07_BaserowLite/docs/authAndObservability.md)
- 🔍 [Análisis de Paridad y Factibilidad de Migración (docs/migrationCheck.md)](file:///Users/snadales/Dev/01_Homelab/07_BaserowLite/docs/migrationCheck.md)
- 🛡️ [Informe de Auditoría y Blindaje de Arquitectura (docs/auditReport.md)](file:///Users/snadales/Dev/01_Homelab/07_BaserowLite/docs/auditReport.md)
- 💎 [Análisis Avanzado (Airtable vs Baserow vs Notion) y Manual (docs/advancedAnalysis.md)](file:///Users/snadales/Dev/01_Homelab/07_BaserowLite/docs/advancedAnalysis.md)
- 📜 [Historial de Cambios (changeLog.md)](file:///Users/snadales/Dev/01_Homelab/07_BaserowLite/changeLog.md)
- 🏗️ [Arquitectura del Sistema y Despliegue (docs/architecture.md)](file:///Users/snadales/Dev/01_Homelab/07_BaserowLite/docs/architecture.md)
- 🗄️ [Modelo de Datos y Esquema Drizzle (docs/dataModel.md)](file:///Users/snadales/Dev/01_Homelab/07_BaserowLite/docs/dataModel.md)
- 🎨 [Motor de Vistas, Colores y Formatos (docs/viewEngine.md)](file:///Users/snadales/Dev/01_Homelab/07_BaserowLite/docs/viewEngine.md)
- 🧮 [Motor de Fórmulas Ligeras AST (docs/formulaEngine.md)](file:///Users/snadales/Dev/01_Homelab/07_BaserowLite/docs/formulaEngine.md)
- 🌐 [Especificación de la API REST y OpenAPI (docs/apiSpec.md)](file:///Users/snadales/Dev/01_Homelab/07_BaserowLite/docs/apiSpec.md)
- 🔒 [Plantilla de Variables de Entorno (.env.example)](file:///Users/snadales/Dev/01_Homelab/07_BaserowLite/.env.example)

---

## 💻 Prerrequisitos e Instalación

### Prerrequisitos
- Docker Engine 24+ y Docker Compose v2.
- Node.js 20+ y npm (para desarrollo local fuera de Docker).

### Puesta en Marcha Rápida (1 Solo Comando)
```bash
# 1. Acceder al directorio del proyecto
cd /Users/snadales/Dev/01_Homelab/07_BaserowLite

# 2. Configurar variables de entorno iniciales
cp .env.example .env

# 3. Iniciar el servicio completo en Docker
docker compose up -d --build
```
La aplicación estará disponible inmediatamente en `http://localhost:3000`.

---

## 🛡️ Permisos y Control de Acceso (RBAC)

- **Roles de Espacio de Trabajo:**
  - `owner`: Control absoluto, gestión de base de datos, facturación/configuración y borrado de workspaces.
  - `admin`: Gestión de bases, creación de tablas y gestión de tokens API.
  - `editor`: Creación, edición y borrado de filas en tablas permitidas.
  - `viewer`: Solo lectura de registros y vistas.
- **Tokens de Base de Datos:**
  - Compatibilidad total con la cabecera `Authorization: Token <TOKEN>` de Baserow.
  - Permisos granulares por tabla (`read`, `write`, `admin`).

---

## 📦 Ubicación de Datos Locales

Todos los datos se almacenan estrictamente de forma local en la carpeta raíz del proyecto (sin servicios cloud forzosos):
- **Base de Datos PostgreSQL:** `./data/postgres/`
- **Archivos Adjuntos:** `./data/uploads/` (organizados por hash criptográfico SHA-256).
- **Respaldos Automatizados:** `./data/backups/`

---

## 💾 Respaldos y Recuperación (Backup & Restore)

### 1. Ejecutar Respaldo Manual
```bash
bash scripts/backup.sh
```
El script genera un dump comprimido en `./data/backups/baserow_lite_pg_<timestamp>.sql.gz`, valida la integridad con `gzip -t` y envía el heartbeat push a Uptime Kuma.

### 2. Restauración Rápida
```bash
gunzip -c ./data/backups/baserow_lite_pg_archivo.sql.gz | docker exec -i baserow_lite_db psql -U baserow_user -d baserow_lite
```

---

## 🧪 Pruebas Automatizadas

Para ejecutar la batería completa de 39 pruebas unitarias y de integración:
```bash
npm test
```
Para compilar la versión de producción de Next.js 15:
```bash
npm run build
```
