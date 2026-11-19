# 🦉 FluxTable

> Plataforma unificada de datos estructurados, hojas de cálculo colaborativas y Business Intelligence analítico de alto rendimiento del **Sistema Yarken**, construida con **Next.js 15 (App Router)**, **TypeScript**, **PostgreSQL 16**, **Drizzle ORM** y **Docker Compose**.
> Aplica el **Brandbook Yarken v2 «Cobalto»** (`Manrope` + `JetBrains Mono` y paleta de contraste accesible WCAG AAA).

---

## 🎨 Personalización de Marca y White-Label (Open Source Ready)

FluxTable cuenta con una arquitectura de marca desacoplada que permite adaptar la identidad visual completa (nombre, logo, organización, lema y colores) mediante variables de entorno en runtime, sin tocar el código fuente:

| Variable de Entorno | Valor por Defecto | Descripción |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_NAME` | `FluxTable` | Nombre de la aplicación en el encabezado, login y títulos. |
| `NEXT_PUBLIC_APP_ORG` | *(vacío)* | Nombre de la empresa u organización visible como subtítulo. |
| `NEXT_PUBLIC_APP_TAGLINE` | `Plataforma de Datos & Business Intelligence` | Lema o subtítulo descriptivo en la pantalla de inicio de sesión. |
| `NEXT_PUBLIC_APP_LOGO_URL` | *(vacío)* | URL o ruta a un archivo PNG/SVG corporativo propio. Si no se define, utiliza el isotipo geométrico vectorizado. |
| `NEXT_PUBLIC_BRAND_COLOR` | `#1D5BD8` | Color de acento primario para el símbolo de marca y elementos destacados. |
| `NEXT_PUBLIC_APP_FAVICON_URL` | `/favicon.svg` | Ruta del favicon para pestañas del navegador. |
| `NEXT_PUBLIC_APP_URL` | *(autodetectado)* | URL base pública de la instancia para feeds iCal y webhooks. |

---

## 🎯 Objetivo y Descripción

### Objetivo
Proporcionar una plataforma integral de datos y BI analítico de inicio rápido local con un único comando (`docker compose up -d`), con una huella de memoria mínima (<100 MB de RAM total), sin intermediarios asíncronos pesados (sin JVM, sin Celery ni Redis), combinando hojas de cálculo colaborativas con un motor analítico avanzado (Time Intelligence MoM/YoY/YTD, percentiles p50/p90, semáforos, cross-filtering dimensional en caliente y alertas a Telegram/n8n).

### Descripción
FluxTable implementa el modelo estructurado **Workspace ➔ Base ➔ Tabla ➔ Campo ➔ Registro ➔ Vista** y el módulo analítico **Carpeta ➔ Dashboard ➔ Pestaña ➔ Tarjeta (KPI / ECharts / Tabla / Markdown)**:
- **Identidad Visual y Brandbook:** Dirección estética «Cobalto» v2 con tokens semánticos (`bg`, `surface`, `ink`, `accent` `#1D5BD8`, `ok`, `warn`, `error`, `info`), tipografía dual `Manrope` (lectura/títulos) y `JetBrains Mono` (métricas/KPIs), y símbolo canónico de la Lechuza-Y Yarken.
- **Arquitectura Single-Shell (Cero Salto de Layout):** Barra lateral `AppSidebar` unificada y persistente en el shell raíz (`app/page.tsx`). El encabezado (Workspace `N Negocios ▾` + Perfil de Usuario `SE Sebastián Nadales ▾`), el buscador y el árbol de carpetas jamás se desmontan ni parpadean entre vistas.
- **Navegación Multi-Documento con Pestañas (`DocumentTabBar`):** Permite abrir y alternar de forma simultánea múltiples contextos de trabajo (Espacios de Trabajo, Tablas de datos `T865`, Dashboards consolidados `D001`, y Catálogos de Módulos) con memoria de estado y cierre individual.
- **Carpetas y Subcarpetas Recursivas N-Niveles (`bi_folders`):** Anidamiento jerárquico infinito con soporte de Emojis nativos y paleta Yarken Cobalto. Desacoplamiento total entre la capa visual organizativa y la capa relacional física (garantía de invariancia absoluta de SQL y endpoints).
- **Reusabilidad Analítica $M:N$ (`bi_dashboard_cards`):** Tarjetas de métricas ($K001-K999$), gráficos ($G001-G999$) y tablas ($T001-T999$) desacopladas como activos de negocio autónomos, reutilizables en múltiples dashboards con parámetros independientes.
- **Inspector de Recetas de Construcción de KPIs (`KpiRecipeModal`):** Auditoría en 1 clic de la receta técnica de cada indicador: consulta SQL / Metabase en vivo, tabla fuente, umbrales operativos de alerta SLA (Óptimo, Advertencia, Crítico) y trazabilidad de agentes.
- **Motor Analítico BI Integrado:** Reemplazo nativo para Metabase con soporte para percentiles continuos (`PERCENTILE_CONT`), comparativas entre periodos (MoM/YoY), caché LRU determinista (1 ms de respuesta) y conectores de sólo lectura a Odoo 20, Voz-Service y Pimcore PIM.
- **Almacenamiento Híbrido:** Esquema relacional estricto gestionado con Drizzle ORM combinado con columnas JSONB tipadas y vistas analíticas materializables `bi_views`.
- **Rico Soporte Visual:** Paleta semántica de 9 colores para etiquetas y estados, formato de moneda chilena (`$ 190.000`) e internacional (`US$ 1,250.50`), fechas y formateo condicional de filas/celdas.
- **Vistas Canónicas:** Grid virtualizado con edición en celda y teclado, Kanban interactivo con drag-and-drop, Formularios públicos de captura con validación Zod y Vista Detalle con notas Markdown (estilo Notion).
- **Motor de Fórmulas Ligeras (`formula-lite`):** Evaluador seguro con analizador sintáctico AST propio en TypeScript (sin `eval()`) con soporte para códigos de error (`#DIV/0!`, `#REF!`, `#VALUE!`).
- **Seguridad e Integridad:** Concurrencia optimista basada en versiones (`version`), auditoría forense (`audit_logs`), papelera con restauración y API REST dinámica asegurada con tokens Bearer y Cloudflare Zero Trust.
- **Webhooks y Snapshots:** Disparador asíncrono de eventos HTTP a n8n (`rows.created`, `rows.updated`, `rows.deleted`) y sistema de snapshots atómicos en JSONB para respaldo y rollback instantáneo con 1 clic.
- **Conector Nativo para n8n (`n8n-nodes-fluxtable`):** Nodo comunitario empaquetado con soporte para operaciones masivas de 1000 filas (`batchCreate`, `batchUpdate`, `batchDelete`), gestión dinámica de campos y trigger webhook.

---

## 📚 Suite Oficial de Documentación y Manuales Maestros

FluxTable cuenta con una suite completa de manuales técnicos, operativos y de usuario:

| Manual / Documento | Enlace | Audiencia y Contenido |
| :--- | :--- | :--- |
| **🏛️ Manual de Arquitectura** | [docs/manual_arquitectura.md](file:///Users/snadales/Dev/01_Homelab/07_FluxTable/docs/manual_arquitectura.md) | Visión sistémica, microservicios, stack Next.js 14 + Drizzle + Postgres + DuckDB, aislamiento multi-tenant y diagramas Mermaid. |
| **📖 Manual de Usuario Final** | [docs/manual_usuario.md](file:///Users/snadales/Dev/01_Homelab/07_FluxTable/docs/manual_usuario.md) | Guía paso a paso para usuarios y analistas: Workspaces, Tablas, Campos, Vistas (Grid, Kanban, Form, Calendario) y Dashboards BI. |
| **🛠️ Manual Técnico y de Desarrollo** | [docs/manual_tecnico.md](file:///Users/snadales/Dev/01_Homelab/07_FluxTable/docs/manual_tecnico.md) | Guía para desarrolladores: estructura del código, API Routes, motor de fórmulas AST, query builder y testing con Jest/Vitest. |
| **🗄️ Manual de Base de Datos** | [docs/manual_base_de_datos.md](file:///Users/snadales/Dev/01_Homelab/07_FluxTable/docs/manual_base_de_datos.md) | Diccionario de datos, Diagrama Entidad-Relación (ERD), índices de alto rendimiento, afinamiento Postgres y backups. |
| **🔌 Manual de Integración y APIs** | [docs/manual_integracion.md](file:///Users/snadales/Dev/01_Homelab/07_FluxTable/docs/manual_integracion.md) | Especificación de API REST, batching masivo, webhooks salientes, nodo custom de n8n (`n8n-nodes-fluxtable`) y pools externos (Odoo/Voz/Pimcore). |
| **🚢 Manual de Operaciones y Despliegue** | [docs/manual_operaciones_despliegue.md](file:///Users/snadales/Dev/01_Homelab/07_FluxTable/docs/manual_operaciones_despliegue.md) | Despliegue Docker en ZBook (`192.168.60.25:8097`), Cloudflare Tunnel Zero Trust (`fluxtable.yarken.cl`), secretos 1Password y Runbook de incidentes. |
| **🛡️ Manual de Seguridad y Pentest** | [docs/manual_seguridad.md](file:///Users/snadales/Dev/01_Homelab/07_FluxTable/docs/manual_seguridad.md) | Blindaje defensivo anti-DDL/DML (HTTP 403), prevención de inyecciones SQL ($1, $2), certificación de pentest 8/8 y RBAC. |
| **📊 Manual Especializado de BI & Analytics** | [docs/manual_bi_analytics.md](file:///Users/snadales/Dev/01_Homelab/07_FluxTable/docs/manual_bi_analytics.md) | Reemplazo de Metabase, inteligencia temporal MoM/YoY, tipos de visualizaciones Recharts, carpetas, dashboards y alertas por umbrales. |
| **🧪 Informe de Pruebas y Pentest** | [docs/informe_pruebas_desempeno_seguridad.md](file:///Users/snadales/Dev/01_Homelab/07_FluxTable/docs/informe_pruebas_desempeno_seguridad.md) | Resultados empíricos de concurrencia (518 req/s), saturación, prueba ácida (500 queries) y telemetría de memoria RAM. |
| **📋 Plan de Decomiso de Metabase** | [docs/plan_decomiso_metabase.md](file:///Users/snadales/Dev/01_Homelab/07_FluxTable/docs/plan_decomiso_metabase.md) | Plan de coexistencia paralela de 7 días, benchmarks de CPU/RAM (94% ahorro) y transición definitiva. |

---

## 🗺️ Índice de Referencias Adicionales

- 📜 [Historial de Cambios (changeLog.md)](file:///Users/snadales/Dev/01_Homelab/07_FluxTable/changeLog.md)
- 🔐 [Usuarios, Google OAuth, Logs y Trazabilidad (docs/authAndObservability.md)](file:///Users/snadales/Dev/01_Homelab/07_FluxTable/docs/authAndObservability.md)
- 🔍 [Análisis de Paridad y Factibilidad de Migración (docs/migrationCheck.md)](file:///Users/snadales/Dev/01_Homelab/07_FluxTable/docs/migrationCheck.md)
- 🎨 [Motor de Vistas, Colores y Formatos (docs/viewEngine.md)](file:///Users/snadales/Dev/01_Homelab/07_FluxTable/docs/viewEngine.md)
- 🧮 [Motor de Fórmulas Ligeras AST (docs/formulaEngine.md)](file:///Users/snadales/Dev/01_Homelab/07_FluxTable/docs/formulaEngine.md)
- 🌐 [Especificación de la API REST y OpenAPI (docs/apiSpec.md)](file:///Users/snadales/Dev/01_Homelab/07_FluxTable/docs/apiSpec.md)
- 🔒 [Plantilla de Variables de Entorno (.env.example)](file:///Users/snadales/Dev/01_Homelab/07_FluxTable/.env.example)

---

## 💻 Prerrequisitos e Instalación

### Prerrequisitos
- Docker Engine 24+ y Docker Compose v2.
- Node.js 20+ y npm (para desarrollo local fuera de Docker).

### Puesta en Marcha Rápida (1 Solo Comando)
```bash
# 1. Acceder al directorio del proyecto
cd /Users/snadales/Dev/01_Homelab/07_FluxTable

# 2. Configurar variables de entorno iniciales
cp .env.example .env

# 3. Iniciar el servicio completo en Docker
docker compose up -d --build
```
La aplicación estará disponible inmediatamente en `http://localhost:3000`.

### Despliegue en Servidor ZBook (`docker-framework`)
En el servidor de producción (ZBook), el despliegue se rige estrictamente por el estándar `docker-framework`:
1. **Secretos 1Password:** Se utiliza `.env.1password` resuelto mediante `/home/snadales/docker/1password/resolve-env.sh /home/snadales/docker/fluxtable`.
2. **Loopback Estricto:** Los puertos quedan confinados exclusivamente a `127.0.0.1` (`127.0.0.1:8097` para la app y `127.0.0.1:5435` para PostgreSQL), sin exposición a `0.0.0.0`.
3. **Archivo Canónico:** Se utiliza `compose.yaml` (especificación Docker Compose v2) con rotación de logs `json-file` y directivas de seguridad (`no-new-privileges:true`).
4. **Respaldos & Restore:** Programados en crontab de ZBook con `scripts/backup.sh` (diario 02:30 UTC a NAS y Kuma) y `scripts/restore_test.sh` (semanal domingos 04:50 UTC con validación de integridad relacional).

```bash
# Despliegue / Actualización en ZBook:
/home/snadales/docker/1password/resolve-env.sh /home/snadales/docker/fluxtable
cd /home/snadales/docker/fluxtable && docker compose up -d
```

---

## 🔄 Convivencia en Paralelo (Cero Impacto a Producción)

BaserowLite opera bajo una estricta política de **convivencia en paralelo**:
- **Baserow Clásico (Producción):** Permanece 100% activo en el puerto `:8090` (`https://baserow.yarken.cl`) atendiendo todos los flujos vigentes de Navarino Compras, n8n y Postulaciones.
- **BaserowLite (Validación):** Se ejecuta de forma aislada en el puerto `:8097` (`http://192.168.60.25:8097`) con su propio PostgreSQL en `:5435` y almacenamiento local independiente.
- **Sin Migración Forzada:** No se ejecutan cortes, ni migración destructiva, ni redirecciones de DNS. Ambos sistemas coexisten pacíficamente para validar a fondo la estabilidad, el rendimiento y la experiencia de usuario antes de cualquier decisión futura.
- Guía detallada: [Plan de Convivencia en Paralelo (docs/parallelValidationPlan.md)](file:///Users/snadales/Dev/01_Homelab/07_FluxTable/docs/parallelValidationPlan.md).

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
gunzip -c ./data/backups/baserow_lite_pg_archivo.sql.gz | docker exec -i fluxtable-db psql -U baserow_user -d baserow_lite
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

## 🧪 Pruebas Automatizadas y Cobertura

Para ejecutar la batería completa de 68 pruebas unitarias y de integración:
```bash
npm test
```
Para auditar la cobertura de código (V8 Coverage, QA-02 / D3):
```bash
npm run test:coverage
```
Para compilar la versión de producción de Next.js 15:
```bash
npm run build
```

## 📡 Endpoints de Diagnóstico y Salud (Estándar Yarken v2)

| Endpoint | Método | Autenticación | Función |
| :--- | :--- | :--- | :--- |
| `/api/v1/salud` | `GET` | Abierto (Red Interna) | Verificación activa de PostgreSQL (`SELECT 1`). Devuelve `200 OK` o `503 Service Unavailable`. |
| `/api/v1/version` | `GET` | Abierto | Información de versión, framework, commit y runtime. |
| `/api/v1/diagnostico` | `GET` | Sesión / Token | Diagnóstico detallado: conteo de workspaces, tablas, usuarios, memoria y uptime. |
| `/api/health` | `GET` | Abierto | Alias retrocompatible hacia `/api/v1/salud`. |
