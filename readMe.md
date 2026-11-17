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
- **Webhooks y Snapshots:** Disparador asíncrono de eventos HTTP a n8n (`rows.created`, `rows.updated`, `rows.deleted`) y sistema de snapshots atómicos en JSONB para respaldo y rollback instantáneo con 1 clic.
- **Conector Nativo para n8n (`n8n-nodes-baserow-lite`):** Nodo comunitario empaquetado con soporte para operaciones masivas de 500 filas (`batchCreate`, `batchUpdate`, `batchDelete`), gestión dinámica de campos y trigger webhook.

---

## 🗺️ Índice de Navegación y Documentación Técnica

- 🔄 [Plan de Convivencia en Paralelo y Validación Continua (docs/parallelValidationPlan.md)](file:///Users/snadales/Dev/01_Homelab/07_BaserowLite/docs/parallelValidationPlan.md)
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

## 🔄 Convivencia en Paralelo (Cero Impacto a Producción)

BaserowLite opera bajo una estricta política de **convivencia en paralelo**:
- **Baserow Clásico (Producción):** Permanece 100% activo en el puerto `:8090` (`https://baserow.yarken.cl`) atendiendo todos los flujos vigentes de Navarino Compras, n8n y Postulaciones.
- **BaserowLite (Validación):** Se ejecuta de forma aislada en el puerto `:8097` (`http://192.168.60.25:8097`) con su propio PostgreSQL en `:5435` y almacenamiento local independiente.
- **Sin Migración Forzada:** No se ejecutan cortes, ni migración destructiva, ni redirecciones de DNS. Ambos sistemas coexisten pacíficamente para validar a fondo la estabilidad, el rendimiento y la experiencia de usuario antes de cualquier decisión futura.
- Guía detallada: [Plan de Convivencia en Paralelo (docs/parallelValidationPlan.md)](file:///Users/snadales/Dev/01_Homelab/07_BaserowLite/docs/parallelValidationPlan.md).

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

## 🌐 Endpoints y Gestión Completa por API REST

BaserowLite permite gestionar programáticamente todas las bases, tablas, columnas (fields) y registros:

### 1. Gestión de Tablas (`/api/database/tables`)
- `GET /api/database/tables`: Lista todas las tablas activas con su metadata (icono, color, tags, descripción).
- `POST /api/database/tables`: Crea una nueva tabla relacional con columna primaria por defecto.
- `GET /api/database/tables/:tableId`: Obtiene la metadata y relación de base de una tabla específica.
- `PATCH /api/database/tables/:tableId`: Actualiza nombre, descripción, icono, color y tags de la tabla o base.
- `DELETE /api/database/tables/:tableId`: Mueve la tabla a la papelera (soft-delete).

### 2. Gestión de Columnas / Esquema (`/api/database/fields`)
- `GET /api/database/fields/table/:tableId`: Lista los campos tipados de la tabla ordenados.
- `POST /api/database/fields/table/:tableId`: Crea una nueva columna (`text`, `number`, `currency`, `date`, `select`, `rating`, `progress`, `boolean`).
- `GET /api/database/fields/:fieldId`: Obtiene la definición y opciones de un campo.
- `PATCH /api/database/fields/:fieldId`: Actualiza nombre, opciones o ancho de la columna.
- `DELETE /api/database/fields/:fieldId`: Soft-delete del campo.

### 3. Operaciones de Registros y Lotes / Batch (`/api/database/rows`)
- `GET /api/database/rows/table/:tableId?user_field_names=true`: Consulta paginada con nombres humanos.
- `POST /api/database/rows/table/:tableId`: Inserta un registro individual.
- `PATCH /api/database/rows/table/:tableId/:rowId`: Actualiza celdas con concurrencia optimista.
- `DELETE /api/database/rows/table/:tableId/:rowId`: Envía registro a la papelera.
- `POST /api/database/rows/table/:tableId/batch`: Inserción masiva de registros en una sola transacción.
- `PATCH /api/database/rows/table/:tableId/batch`: Actualización masiva de registros (`{ items: [{ id, ...campos }] }`).
- `DELETE /api/database/rows/table/:tableId/batch`: Eliminación masiva hacia la papelera (`{ items: [id1, id2, ...] }`).

### 4. Calendario RFC 5545 e iCal Feed (`/api/v1/calendar/ical`)
- `GET /api/v1/calendar/ical?tableId=:id&dateField=:field`: Genera un feed `.ics` estándar RFC 5545 para suscripción directa en Apple Calendar (`webcal://`), Google Calendar o Microsoft Outlook.

### 5. Sesión, Tokens y Papelera
- `GET /api/v1/auth/me`: Detecta usuario autenticado y sesión Zero Trust Cloudflare Access.
- `GET|POST /api/v1/tokens`: Genera y lista tokens Bearer de base de datos (`baserow_lite_...`).
- `GET /api/v1/trash`: Lista registros eliminados disponibles para recuperación.
- `POST /api/v1/trash/:id/restore`: Restaura registros eliminados de vuelta a su tabla.

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
