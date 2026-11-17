# 📜 Historial de Cambios del Proyecto (changeLog)

---

## 🗓️ [2026-11-16] - Inicialización y Diseño Técnico Completo

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
