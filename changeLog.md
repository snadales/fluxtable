# 📜 Historial de Cambios del Proyecto (changeLog)

---

## 🗓️ [2026-11-17] - Paridad Total (Webhooks, Snapshots) y Conector Especializado para n8n

### 🎯 Intención
Implementar la paridad funcional completa en BaserowLite requerida por la auditoría visual frente a Baserow clásico (Webhooks salientes asíncronos y Snapshots con rollback en caliente), omitiendo la migración de datos reales por orden explícita del usuario, y desarrollar e instalar el conector especializado nativo para n8n (`n8n-nodes-baserow-lite`).

### 📍 Estado Actual
- Webhooks salientes operativos en PostgreSQL y despachador en `lib/webhook-dispatcher.ts` con disparadores automáticos en `/rows` y `/batch` (crear, actualizar, eliminar).
- Endpoints REST `/api/database/webhooks/table/[tableId]` y `/api/database/webhooks/[webhookId]/test` verificados (HTTP 200/201).
- Snapshots en caliente operativos con guardado atómico en JSONB y restauración instantánea (`POST /api/database/snapshots/[id]/restore`).
- Modales interactivos `TableWebhooksModal` y `TableSnapshotsModal` integrados en la barra de herramientas de la tabla.
- Paquete npm de conector comunitario de n8n `n8n-nodes-baserow-lite` desarrollado, compilado con TypeScript, desplegado en ZBook en `/home/snadales/docker/n8n/n8n_data/nodes/node_modules/n8n-nodes-baserow-lite/`, y registrado en `package.json` de n8n.
- Contenedores en ZBook: `baserow_lite_app` (45.42 MiB) y `baserow_lite_db` (38.9 MiB) saludables (~84 MiB de consumo total vs 2.55 GiB de Baserow clásico).
- Suite de pruebas vitest: 41/41 pasando. Build de Next.js: 16/16 rutas estáticas y dinámicas compiladas.

### 🏁 Estado Deseado
- Sistema 100% preparado para reemplazar a Baserow clásico cuando el usuario ordene la migración de datos.
- n8n con nodo dedicado capaz de ejecutar operaciones batch de 500 filas en una sola petición HTTP, manipular esquemas dinámicamente y disparar triggers instantáneos por webhook.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* El healthcheck del contenedor `baserow_lite_app` fallaba reportando "connection refused" en `[::1]:3000`.
  *Causa:* `localhost` resolvía a IPv6 `::1`, mientras que Node/Next.js escuchaba en IPv4.
  *Solución:* Se actualizó el healthcheck en `docker-compose.yml` para apuntar explícitamente a `http://127.0.0.1:3000/api/health`.
- *Problema:* El build de Docker de Next.js fallaba al escanear los tipos de `packages/n8n-nodes-baserow-lite/credentials/BaserowLiteApi.credentials.ts` por falta de `n8n-workflow`.
  *Solución:* Se excluyó `packages/` en `tsconfig.json` y `.dockerignore` del proyecto Next.js raíz, manteniendo el paquete de n8n desacoplado e independiente.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 10**: Creación del issue `#14` en `snadales/BaserowLite` con atribución automática.
2. **Iteración 11**: Extensión del esquema de base de datos Drizzle (`db/schema.ts`) con las tablas `webhooks` y `snapshots`, y migración SQL `0001_webhooks_and_snapshots.sql`.
3. **Iteración 12**: Desarrollo del despachador asíncrono `lib/webhook-dispatcher.ts` con soporte de eventos (`rows.created`, `rows.updated`, `rows.deleted`, `test.ping`) y vinculación a los endpoints de filas simples y por lote.
4. **Iteración 13**: Creación de las rutas REST para Webhooks (`/api/database/webhooks/...`) y Snapshots (`/api/database/snapshots/...`).
5. **Iteración 14**: Creación de los componentes visuales `TableWebhooksModal` y `TableSnapshotsModal` e integración en el toolbar de la tabla en `app/page.tsx`.
6. **Iteración 15**: Desarrollo completo del conector para n8n `n8n-nodes-baserow-lite` (Credential `BaserowLiteApi`, Node `BaserowLite` y Trigger `BaserowLiteTrigger`), compilación en TypeScript y despliegue en ZBook dentro de `/home/snadales/docker/n8n/n8n_data/nodes/node_modules/`.
7. **Iteración 16**: Reinicio y validación de `n8n_core` y despliegue del contenedor `baserow_lite_app` en producción.

### 📊 Evidencia Empírica de Verificación
- `npm test`: 41/41 tests passing.
- `next build`: 16/16 páginas generadas.
- `POST /api/database/snapshots/table/865`: Snapshot creado con 5 registros.
- `POST /api/database/snapshots/[id]/restore`: Tabla restaurada con 5 registros recuperados.
- `POST /api/database/webhooks/table/865`: Webhook creado con URL `https://n8n.yarken.cl/webhook/test-lotes`.
- Consumo RAM en ZBook: `baserow_lite_app` (45.42 MiB) + `baserow_lite_db` (38.9 MiB) = 84.32 MiB.
- `n8n_core`: Saludable, clases `{ BaserowLite, BaserowLiteTrigger, BaserowLiteApi }` cargadas.

### 🎯 Intención
Inicializar el repositorio independiente `07_BaserowLite` y elaborar el diseño técnico de arquitectura exhaustivo para reemplazar la instancia de Baserow por una solución moderna, ligera y de alto rendimiento basada en Next.js 15, TypeScript, PostgreSQL, Drizzle ORM y Docker Compose.

### 📍 Estado Actual
- Repositorio Git independiente inicializado con branch `main`.
- Issue de control y trazabilidad abierto en `#1263` (`snadales/YarkenSystem`).
- Estándares de documentación modular y seguridad aplicados.

### 🏁 Estado Deseado
- Repositorio con estructura base de documentación técnica completa en `docs/`.
- Especificación formal del modelo de datos híbrido (Drizzle + JSONB tipado).
- Definición detallada del motor de colores, badges, formato de monedas, números y fechas.
- Arquitectura de vistas (Grid, Kanban, Formulario, Detalle de Registro).
- Motor de fórmulas ligeras (`formula-lite`) con evaluador AST seguro en TypeScript.
- Especificación de la API REST tokenizada, concurrencia optimista, auditoría y dockerización.

### ⚠️ Problemas Encontrados
- Ninguno. La fase de construcción de código queda pausada a la espera de la validación del diseño completo por parte del usuario.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 1**: Creación de la estructura del repositorio independiente en `/Users/snadales/Dev/01_Homelab/07_BaserowLite`.
2. **Iteración 2**: Configuración de `.gitignore` y plantilla de variables de entorno `.env.example`.
3. **Iteración 3**: Creación del issue `#1263` en `snadales/YarkenSystem` con atribución automática de agente y sesión.
4. **Iteración 4**: Redacción de la documentación modular de arquitectura y diseño en `docs/` y actualización del `readMe.md`.
5. **Iteración 5**: Creación del repositorio remoto privado `snadales/BaserowLite`, proyecto GitHub v2 `#20` y creación de la Épica `#1` y los 11 issues de desglose (`#2` al `#12`).
6. **Iteración 6**: Análisis avanzado de capacidades inspiradas en Airtable (Rollups, Lookups, Progress, Rating) y Notion (Canvas de notas en registro, Tabs superiores) documentado en `docs/advancedAnalysis.md`.
7. **Iteración 7**: Auditoría técnica forense (puntos ciegos de PostgreSQL TOAST, N+1 queries, auto-merge de celda, códigos de error en fórmulas y stack Undo/Redo) documentada en `docs/auditReport.md`.
8. **Iteración 8**: Análisis forense de migración y paridad 100% sobre los datos reales de ZBook (12.424 filas, 3.5 MB, scripts de Navarino/Postulaciones/Voz) documentado en `docs/migrationCheck.md`.
9. **Iteración 9**: Especificación completa de Usuarios, Login con Google OAuth nativo (sin licencias Enterprise), logs estructurados JSON con Pino y trazabilidad forense documentada en `docs/authAndObservability.md`.
10. **Iteración 10**: Implementación y verificación de la suite de producción:
    - Login visual con botón de Google SSO y formulario local (`app/login/page.tsx`).
    - Endpoints de adjuntos con subida/descarga segura SHA-256 (`/api/v1/attachments/upload` y `/api/v1/attachments/[id]`).
    - Popover de filtros dinámicos multinivel (`components/grid/filter-popover.tsx`).
    - Script de migración masiva desde Baserow oficial (`scripts/migrate_from_baserow.py`).
    - 39 pruebas automatizadas en verde y build de producción Next.js 15 compilando exitosamente.
11. **Iteración 11**: Despliegue en ambiente Staging de ZBook (:8097), verificación de rendimiento y retrocompatibilidad de API:
    - Despliegue de contenedores `baserow_lite_app` y `baserow_lite_db` (Postgres 16) en ZBook.
    - Consumo verificado de RAM en tiempo real: **~65 MiB totales** (frente a 2.55 GiB en Baserow oficial, **97.5% de ahorro**).
    - Soporte transparente para IDs numéricos legacy (`legacy_id` en PostgreSQL y `lib/table-resolver.ts`), permitiendo invocar `/api/database/rows/table/865/?user_field_names=true` sin cambiar scripts clientes.
    - Validación de ciclo de vida completo: Healthcheck 200 OK, endpoints de CRUD, papelera con restore, subida y descarga de adjuntos, y ejecución exitosa del script de backup con réplica al NAS.
    - Cierre exitoso del Hito 5 con issue `#13` en `snadales/BaserowLite`.
12. **Iteración 12**: Formalización de la estrategia de convivencia en paralelo y validación continua (Zero Impact):
    - Se excluye expresamente cualquier migración destructiva o cambio de DNS del plan operativo.
    - Baserow clásico se mantiene 100% activo en `:8090` atendiendo los flujos de producción existentes sin ninguna alteración.
    - BaserowLite opera en paralelo en `:8097` para validación funcional integral (ergonomía de UI, pruebas de fórmulas, concurrencia y estabilidad de memoria a largo plazo).
    - Creación del documento rector `docs/parallelValidationPlan.md` y actualización del `readMe.md`.
13. **Iteración 13**: Publicación global en Cloudflare Tunnel y habilitación de firewall UFW:
    - Se agregó la regla de Ingress en Cloudflare Tunnel ('a8bc2e17-8551-438e-aa99-c4a69f8e4069') para 'baserow-lite.yarken.cl' -> 'http://127.0.0.1:8097'.
    - Se habilitó la regla de red en UFW de ZBook para la subred LAN '192.168.0.0/16' en el puerto 8097.
    - Acceso HTTPS verificado y operativo desde dispositivos móviles (iPhone) y externos bajo 'https://baserow-lite.yarken.cl'.
14. **Iteración 14**: Split-Horizon DNS en AdGuard Home y confirmación multi-vista (Grid, Kanban, Formulario):
    - Configuración de DNS rewrites en AdGuard Home (`192.168.60.25` y réplica en `192.168.60.22`) para `baserow-lite.yarken.cl` y `tables.yarken.cl` resolviendo en 0ms hacia Caddy (`192.168.60.25`).
    - Validación de acceso exitosa desde iPhone bajo el dominio `https://tables.yarken.cl`.
    - Preservación íntegra de la suite completa de vistas interactivas conectadas a PostgreSQL 16: Tabla (Grid con edición en vivo), Kanban (agrupación por estados y subtotales) y Formulario (alta schema-driven).
    - Suite de 39 pruebas automáticas en vitest verificadas y compilación TypeScript limpia.
15. **Iteración 15**: Implementación de Vista de Calendario (`components/calendar/calendar-view.tsx`):
    - Creación de la vista `CalendarView` con cuadrícula mensual completa (Lunes a Domingo) vinculada dinámicamente al campo `Fecha Estimada Arribo`.
    - Controles de navegación mensual (Mes anterior, Mes siguiente y botón rápido 'Hoy').
    - Representación visual de contenedores programados con píldoras tipadas, colores según estado de embarque e integración con el Drawer lateral de notas.
    - Soporte interactivo para agregar nuevos lotes y apertura de detalle sin recargar página.
16. **Iteración 16**: Implementación completa de parámetros avanzados y opciones de vista (Todos):
    - **Feed iCal RFC 5545 (`/api/v1/calendar/ical`)**: Generación dinámica de eventos de calendario para sincronización con Apple Calendar, Google Calendar y Outlook vía `webcal://` o HTTPS.
    - **Visibilidad de Columnas (`FieldsPopover`)**: Control interactivo para encender o apagar campos en la cuadrícula en tiempo real con recuento dinámico.
    - **Filtros Avanzados (`FilterPopover`)**: Motor de filtrado reactivo multinivel con operadores `equal`, `not_equal`, `contains`, `not_contains`, `greater`, `less`, `empty` y `not_empty`.
    - **Ordenamientos Multinivel (`SortPopover`)**: Clasificación encadenada de filas por múltiples columnas en orden Ascendente (A → Z) y Descendente (Z → A).
    - **Formato Condicional Inteligente**: Resaltado visual en `DataGrid` según reglas de negocio (verde para `Recibido en Bodega`, advertencias para avance bajo y valores destacados) con botón toggle `Colores`.
    - **Modal de Suscripción en Calendario**: Diálogo con botón de copia rápida y enlace directo `webcal://` optimizado para iPhone (iOS) y Mac.
    - Compilación de producción Next.js 15 exitosa (10/10 páginas estáticas y dinámicas) y 39 pruebas automáticas vitest en verde.
17. **Iteración 17**: Personalización de Metadatos (Logos, Iconos, Colores, Nombres, Descripciones, Categorías y Tags) + Menú de Usuario y Gestión de Tokens API:
    - Columnas añadidas a PostgreSQL 16: `description`, `category`, `tags` en tabla `bases`, y `description`, `icon`, `color`, `tags` en tabla `tables`.
    - Endpoints REST implementados: `GET|PATCH /api/database/tables/[tableId]`, `GET /api/v1/auth/me` (detección Zero Trust) y `GET|POST /api/v1/tokens`.
    - Modales interactivos implementados: `BaseSettingsModal` (personalización completa de logos, iconos, paleta de colores, categorías del homelab y tags) y `ApiTokensModal` (generación de tokens para scripts).
    - Header y barra de pestañas enriquecidos con chip de base interactivo, avatar de usuario `SN` con menú de sesión y pestañas temáticas con etiquetas.
18. **Iteración 18**: Implementación de Endpoints Masivos (`Batch`) y Gestión Dinámica de Columnas (`Fields`):
    - **Operaciones en Lote (`/batch`)**: `POST|PATCH|DELETE /api/database/rows/table/[tableId]/batch` para inserción, modificación y eliminación masiva de registros en una sola llamada HTTP con soporte para `user_field_names=true`.
    - **Gestión de Esquema por API (`/fields`)**: `GET|POST /api/database/fields/table/[tableId]` y `GET|PATCH|DELETE /api/database/fields/[fieldId]` para crear y configurar columnas dinámicamente desde scripts de Python o n8n.
    - Compilación de producción Next.js 15 exitosa (12/12 rutas dinámicas y estáticas) y suite completa de pruebas en verde.
19. **Iteración 19**: Endpoints de Gestión de Tablas (`/tables`), Conmutación Multi-Tabla Fluida en UI y Modales Dinámicos (`NewTableModal` y `NewFieldModal`):
    - **API de Tablas (`/api/database/tables`)**: `GET /api/database/tables` para listar tablas activas y `POST /api/database/tables` para crear tablas con columna primaria por defecto (`Nombre`), además de `DELETE /api/database/tables/[tableId]` para soft-delete.
    - **Conmutación Multi-Tabla**: Barra superior de pestañas con renderizado reactivo de todas las tablas activas de la base, mostrando icono, color, recuento dinámico de filas y tags asociados. Al hacer clic en una pestaña, se cargan asíncronamente sus metadatos, columnas y registros correspondientes.
    - **Modal Nueva Tabla (`NewTableModal`)**: Creación visual de tablas con selector de iconos Lucide, paleta de colores distintivos, categorías y chips de tags.
    - **Modal Nueva Columna (`NewFieldModal`)**: Adición interactiva de campos tipados (`text`, `number`, `currency`, `date`, `select`, `rating`, `progress`, `boolean`) directamente desde la barra de herramientas de la cuadrícula, conectado a `/api/database/fields/table/[tableId]`.
    - Build de producción Next.js 15 verificado (13/13 rutas estáticas y dinámicas compiladas limpiamente) y 39 pruebas automáticas vitest en verde.
20. **Iteración 20**: Dashboard Global de Workspaces (Prints 1 y 7), Panel de Administración Completo (Prints 2, 4, 5) y Modal My Settings (Print 8):
    - **Dashboard de Workspaces (`components/workspaces/workspaces-dashboard.tsx`)**: Recreación fiel de la interfaz principal de Baserow clásico (Print 7) con barra lateral (`All workspaces`, `Recently viewed`, `Templates`, `Trash`), agrupación por espacio de trabajo (`Negocios`, `LinkedIn`, `Yarken`, `Salud`), tarjetas tipadas de bases/dashboards y navegación instantánea.
    - **Menú Desplegable de Usuario & Workspaces (`components/modals/workspace-user-menu.tsx`)**: Menú contextual superior (Print 1) con buscador de espacios, indicador activo, accesos directos a `Admin tools`, `My settings` y cierre de sesión.
    - **Panel de Administración (`components/modals/admin-tools-modal.tsx`)**: Panel de control con métricas generales de usuarios, workspaces y aplicaciones con gráfico de actividad SVG (Print 2), tabla de usuarios con workspaces asignados y fechas (Print 4), y tabla de espacios de trabajo con volumen de registros (Print 5).
    - **Modal de Ajustes de Cuenta (`components/modals/my-settings-modal.tsx`)**: Configuración de perfil (Print 8), idioma de interfaz, gestión integrada de tokens de base de datos y detalles de conexión al servidor MCP.
    - **Endpoints de Soporte**: `/api/database/workspaces` (listado y creación), `/api/admin/metrics` (cálculo de totales y series temporales) y `/api/admin/users` (detalle de cuentas).
    - Compilación Next.js 15 validada (16/16 rutas) y 39 pruebas automáticas vitest en verde sin migración destructiva ni alteración de datos de producción.
