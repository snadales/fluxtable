# 📜 Historial de Cambios del Proyecto (changeLog)

---

## 🗓️ [2026-11-17] - Fase 5: Validación en Paralelo, Paridad Analítica y Plan de Decomiso de Metabase

### 🎯 Intención
Ejecutar la validación en paralelo y auditoría de paridad del motor de BI & Analytics de BaserowLite (`EPIC-BI-01` / Issue #20) frente a Metabase (`:3100`), auditar discrepancia numérica en consultas analíticas complejas y percentiles, medir la reducción de huella de memoria RAM y CPU, desarrollar el script de auditoría automática `scripts/bi_parity_checker.py`, y redactar el plan maestro de transición y apagado definitivo de Metabase (`docs/plan_decomiso_metabase.md`).

### 📍 Estado Actual
- `scripts/bi_parity_checker.py`: Script de auditoría de paridad y benchmarks en ZBook. Valida consultas sobre `local_baserow` (percentiles p50/p90), `odoo_ro` (compras agrupadas) y `voz_ro` (borradores y telemetría de voz), reportando 0.00% de discrepancia numérica frente a los motores subyacentes.
- `docs/plan_decomiso_metabase.md`: Documento maestro de transición que establece el periodo de coexistencia en paralelo de 7 días (2026-11-17 al 2026-11-24), el catálogo de mapeo de las 24 vistas/dashboards de Metabase a BaserowLite BI, el procedimiento seguro de respaldo `pg_dump` de `metabase-db`, el apagado de contenedores y la reasignación de rutas en Cloudflare Tunnel.
- `docker-compose.yml` & `lib/bi/connectors/pool-manager.ts`: Configuración definitiva de variables de entorno seguras para los pools multi-base de datos (`ODOO_DB_HOST: odoo20_db`, `VOZ_DB_HOST: voz-db`, `PIMCORE_DB_HOST: pimcore-db-1`) utilizando el rol de sólo lectura unificado `baserow_ro`.
- Recursos y Rendimiento en ZBook:
  - BaserowLite Stack: **82.16 MiB RAM** (`app` 52.5 MiB + `db` 29.7 MiB).
  - Metabase Stack: **1,181 MiB RAM** (`app` 1,054 MiB + `db` 127.2 MiB).
  - Ahorro de memoria verificado: **~1,099 MiB (-93% / 14.3x menos consumo)**.
  - Latencia de consulta uncached: 4-25 ms; latencia en caché LRU: 1 ms.

### 🏁 Estado Deseado
- Periodo de observación en paralelo durante 7 días asegurando estabilidad continua.
- Al término de los 7 días, apagado definitivo de Metabase liberando 1.18 GB de RAM en ZBook.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* Nombre de host de Odoo PostgreSQL en Docker no resolvía por defecto a `odoo20-db-1` en `pool-manager.ts`.
  *Solución:* Se corrigió el alias canónico en Docker Compose a `odoo20_db` y se creó el rol de sólo lectura `baserow_ro` en `odoo_prod`, `voz` y `pimcore` con contraseña segura y límite estricto de conexiones concurrentes.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 47**: Cierre con evidencia empírica de la Fase 4 (Issue #19) en `snadales/BaserowLite`.
2. **Iteración 48**: Apertura formal del issue `#20` para la Fase 5 con atribución obligatoria (`gh-issue`).
3. **Iteración 49**: Configuración de credenciales de sólo lectura `baserow_ro` en `odoo20_db`, `voz-db` y `pimcore-db-1`.
4. **Iteración 50**: Actualización de `docker-compose.yml` y defaults en `pool-manager.ts`.
5. **Iteración 51**: Desarrollo del script `scripts/bi_parity_checker.py`.
6. **Iteración 52**: Redacción del documento maestro `docs/plan_decomiso_metabase.md`.
7. **Iteración 53**: Despliegue en ZBook, compilación exitosa del contenedor y ejecución de la auditoría de paridad.

### 📊 Evidencia Empírica de Verificación
- `bi_parity_checker.py`:
  - `local_baserow`: Percentiles p50 y p90 exactos, latencia SQL 4ms, caché hit 1ms.
  - `odoo_ro`: 13 facturas procesadas con suma exacta de $1,624,440 CLP agrupadas por comprador en 25ms.
  - `voz_ro`: 850 borradores clasificados por estado en 20ms.
  - Discrepancia numérica: 0.00%.
- Docker Stats en ZBook: BaserowLite 82 MiB vs Metabase 1,181 MiB.

---

## 🗓️ [2026-11-17] - Fase 4: Automatizaciones, Umbrales de Semáforo y Alertas hacia n8n/Telegram

### 🎯 Intención
Construir el subsistema de observabilidad analítica, umbrales y alertas automáticas en BaserowLite (`EPIC-BI-01` / Issue #19): implementar la clase evaluadora `ThresholdChecker` para clasificar métricas en tres niveles (`normal`, `warning`, `critical`) en dirección ascendente o descendente, desarrollar el despachador de alertas `POST /api/bi/alerts/evaluate` con integración hacia webhooks de n8n o hacia `yarken-comms:8105` para despacho inmediato a Telegram, y crear el modal interactivo `ThresholdConfigModal` para configurar umbrales por tarjeta.

### 📍 Estado Actual
- `lib/bi/alerts/threshold-checker.ts`: Evaluador matemático de umbrales condicionales con mapeo de clases CSS (`bg-emerald-50`, `bg-amber-50`, `bg-rose-50 animate-pulse`), mensajes informativos y compatibilidad con directivas `above` (sobrecostos, retrasos) y `below` (márgenes, stock de seguridad).
- `app/api/bi/alerts/evaluate/route.ts`: Endpoint REST protegido por RBAC que escanea las reglas activas de `bi_alerts`, ejecuta la consulta analítica más reciente de la tarjeta, compara los valores contra los umbrales configurados en `bi_thresholds` y despacha el webhook saliente en caso de transgresión.
- `components/modals/threshold-config-modal.tsx`: Modal visual para parametrizar umbrales de advertencia, críticos, dirección del semáforo y URL del webhook de notificación.
- Pruebas automatizadas: 58 tests pasando en 9 suites de prueba (100% éxito) y compilación `next build` limpia (22 páginas).

### 🏁 Estado Deseado
- Sistema analítico con observabilidad proactiva capaz de alertar a Sebastián en Telegram cuando un KPI del homelab o negocio se desvíe de los umbrales operativos.
- Preparado para la Fase 5 (Issue #6: Migración y Validación en Paralelo frente a Metabase y Baserow clásico).

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* Error de casteo en TypeScript al invocar `BiQueryBuilder.buildQuery(card.queryConfigJson)` por inferencia estricta de interfaz.
  *Solución:* Se casteó explícitamente el campo JSONB a la interfaz analítica `BiQueryConfig`.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 42**: Creación del issue `#19` en `snadales/BaserowLite` para la Fase 4 de `EPIC-BI-01`.
2. **Iteración 43**: Desarrollo de `lib/bi/alerts/threshold-checker.ts` con lógica de semáforos tricolor.
3. **Iteración 44**: Implementación de `app/api/bi/alerts/evaluate/route.ts` con evaluador y despachador de webhooks.
4. **Iteración 45**: Creación de `components/modals/threshold-config-modal.tsx`.
5. **Iteración 46**: Creación de tests unitarios en `lib/bi/__tests__/threshold-checker.test.ts` (58/58 pasando) y build de producción Next.js (22 páginas).

### 📊 Evidencia Empírica de Verificación
- `npm test`: 58/58 tests pasando en 9 suites de prueba.
- `next build`: 22/22 páginas compiladas exitosamente.
- `ThresholdChecker`: Pruebas de dirección ascendente y descendente verificadas con rangos de advertencia y crítico.

---

## 🗓️ [2026-11-17] - Fase 3: UI de Dashboards, Pestañas, Visualizador ECharts & Cross-Filtering interactivo

### 🎯 Intención
Construir la experiencia de usuario analítica completa en BaserowLite (`EPIC-BI-01` / Issue #18): implementar el árbol de navegación lateral de carpetas y dashboards (`FolderTreeSidebar`), el contenedor principal de dashboard (`DashboardView`), el visualizador multi-tipo con Apache ECharts (`BiCardRenderer`), el selector de rangos de fecha (`TimeRangePicker`), modales de creación (`NewBiDashboardModal`, `NewBiCardModal`), endpoints REST de metadatos (`/api/bi/dashboards`, `/api/bi/folders`, `/api/bi/cards`), y el gestor de estado reactivo global con Zustand (`useDashboardStore`) que coordina el Cross-Filtering dimensional en caliente.

### 📍 Estado Actual
- `lib/bi/state/dashboard-store.ts`: Store Zustand reactivo con soporte para `crossFilters` (toggle y clear), `activeTimeRange`, `activeTabId`, `isKioskMode`, `autoRefreshSeconds` y búsqueda de reportes.
- `components/bi/bi-card-renderer.tsx`: Renderizador reactivo de tarjetas:
  - `kpi`: Métrica principal grande con formato numérico/moneda, variación porcentual MoM/YoY (`ArrowUpRight`/`ArrowDownRight`) y semáforo de umbrales.
  - `line`: Gráfico interactivo con Apache ECharts, curvas suaves, tooltip formateado y brush slider temporal.
  - `bar` / `horizontal_bar`: Gráficos de barra con paleta corporativa y evento `click` que dispara `setCrossFilter` instantáneamente sobre el dashboard.
  - `table`: Tabla de datos densa y scrolleable con cabeceras fijas.
  - `markdown`: Banner explicativo o alertas contextuales.
- `components/bi/time-range-picker.tsx`: Selector de rango temporal con presets directos (`Hoy`, `Últimos 7 días`, `Últimos 30 días`, `Este mes`, `Mes anterior`, `Este año (YTD)`) e intervalo personalizado.
- `components/bi/folder-tree-sidebar.tsx`: Árbol jerárquico colapsable con insignia de código (`D001`, `D002`), buscador rápido y favoritos.
- `components/bi/dashboard-view.tsx`: Contenedor principal con selector de pestañas, badges de filtros cruzados activos, temporizador de auto-refresco, modo Kiosko pantalla completa y exportación a PDF vía `window.print()`.
- Endpoints REST desarrollados:
  - `GET /api/bi/folders`, `POST /api/bi/folders`
  - `GET /api/bi/dashboards`, `POST /api/bi/dashboards`, `GET /api/bi/dashboards/[id]`, `PATCH`, `DELETE`
  - `POST /api/bi/cards`, `PATCH /api/bi/cards/[id]`, `DELETE`
- Integración en `app/page.tsx`: Nuevo modo `'analytics'` accesible directamente desde la barra superior y desde el panel de espacios de trabajo (`WorkspacesDashboard`).
- Pruebas automatizadas: 56 tests pasando en 8 suites (100% éxito) y compilación `next build` limpia (21 páginas).

### 🏁 Estado Deseado
- Plataforma de BI 100% interactiva en BaserowLite (`tables.yarken.cl`), preparada para la Fase 4 (Issue #5: Automatizaciones, Umbrales de Semáforo y Alertas hacia n8n/Telegram).

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* Error de compilación en Next.js `Type error: 'echarts' has no exported member named 'EChartsOption'`.
  *Solución:* Se tipó la configuración del gráfico de ECharts de forma flexible evitando la discrepancia de exportación de tipos entre `@types/echarts` y `echarts@6`.
- *Problema:* El renderizado de múltiples gráficos ECharts en el mismo dashboard podía provocar fugas de memoria o colisiones de instancias.
  *Solución:* Uso de `useRef` dedicado por tarjeta con listeners de resize en window y limpieza estricta con `chartInstance.current.dispose()` en el unmount.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 34**: Creación del issue `#18` en `snadales/BaserowLite` para la Fase 3 de `EPIC-BI-01`.
2. **Iteración 35**: Desarrollo de endpoints REST para carpetas, dashboards y tarjetas (`/api/bi/folders`, `/api/bi/dashboards`, `/api/bi/cards`).
3. **Iteración 36**: Implementación de `lib/bi/state/dashboard-store.ts` con Zustand.
4. **Iteración 37**: Creación de `components/bi/time-range-picker.tsx` y `components/bi/folder-tree-sidebar.tsx`.
5. **Iteración 38**: Creación de `components/bi/bi-card-renderer.tsx` con soporte para KPI, ECharts y tablas.
6. **Iteración 39**: Creación de `components/bi/dashboard-view.tsx` y modales `NewBiDashboardModal` y `NewBiCardModal`.
7. **Iteración 40**: Integración de la vista `BiAnalyticsPage` y botón de navegación en `app/page.tsx` y `WorkspacesDashboard`.
8. **Iteración 41**: Creación de tests unitarios en `lib/bi/__tests__/bi-store.test.ts` (56/56 pasando) y build de producción Next.js (21 páginas).

### 📊 Evidencia Empírica de Verificación
- `npm test`: 56/56 tests pasando en 8 suites de prueba.
- `next build`: 21/21 páginas compiladas sin errores.
- Store Zustand verificado: Manipulación atómica de filtros cruzados y alternancia de modo kiosko.

---

## 🗓️ [2026-11-17] - Fase 2: Motor Analítico SQL con Time Intelligence, Percentiles p50/p90, Cross-Filtering y Caché LRU

### 🎯 Intención
Implementar el motor analítico avanzado en BaserowLite (`EPIC-BI-01` / Issue #17): construir el generador de consultas dinámicas `BiQueryBuilder` con funciones de Time Intelligence (MoM, YoY, YTD, Rolling 7d/30d), estadísticas avanzadas (`PERCENTILE_CONT(0.50)`, `PERCENTILE_CONT(0.90)`, `STDDEV`), filtros cruzados dimensionales, rangos de fechas con intervalos PostgreSQL, gestor de caché determinista en memoria `BiCacheManager` con `lru-cache`, y el endpoint REST unificado `POST /api/bi/query`.

### 📍 Estado Actual
- `lib/bi/analytics/query-builder.ts`: Generador SQL capaz de construir consultas planas o basadas en CTEs (`base_summary`) para Time Intelligence (`LAG` para MoM/YoY, `SUM(...) OVER (PARTITION BY EXTRACT(YEAR FROM ...))` para YTD, `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` para rolling averages).
- `lib/bi/analytics/cache-manager.ts`: Gestor de caché LRU con claves SHA-256 deterministas sobre `{ fuente, sql, params, filtros }` y TTL configurable (60s por defecto).
- `app/api/bi/query/route.ts`: Endpoint unificado protegido por RBAC que ejecuta analítica sobre vistas locales `bi_views.*` o sobre conectores remotos (`odoo_ro`, `voz_ro`, `pimcore_ro`), devolviendo telemetría (`durationMs`, `cached`, `rowCount`).
- Pruebas automatizadas: 53 tests pasando en 7 suites de prueba (100% éxito) y compilación `next build` limpia (18 páginas).

### 🏁 Estado Deseado
- Motor analítico preparado para alimentar los dashboards interactivos en el frontend (Fase 3: Issue #4: UI Dashboards, Tabs, Visualizador ECharts & Cross-Filtering interactivo).

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* El filtrado temporal con fechas ISO requería casteos seguros para no degradar el índice de partición o fallar con timestamps con zona horaria.
  *Solución:* Parametrización con casteo explícito `$N::timestamptz` y uso de funciones nativas de PostgreSQL `CURRENT_DATE` y `INTERVAL`.
- *Problema:* En consultas locales que pasan por `db.execute(sql.raw(...))`, la interpolación de parámetros requería sanitización anti-inyección SQL.
  *Solución:* Mapeo y escape estricto de comillas simples (`replace(/'/g, "''")`) en parámetros de texto dentro del endpoint `/api/bi/query`.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 29**: Creación del issue `#17` en `snadales/BaserowLite` para la Fase 2 de `EPIC-BI-01`.
2. **Iteración 30**: Desarrollo de `lib/bi/analytics/cache-manager.ts` con `lru-cache` y hash SHA-256.
3. **Iteración 31**: Desarrollo de `lib/bi/analytics/query-builder.ts` con Time Intelligence, percentiles p50/p90, medias móviles y rangos de fecha.
4. **Iteración 32**: Implementación del endpoint unificado `app/api/bi/query/route.ts`.
5. **Iteración 33**: Creación de tests unitarios en `lib/bi/__tests__/query-builder.test.ts` (53/53 pasando) y build de producción Next.js (18 páginas).

### 📊 Evidencia Empírica de Verificación
- `npm test`: 53/53 tests pasando en 7 suites de prueba.
- `next build`: 18/18 páginas compiladas exitosamente.
- Hash determinista de caché validado: consultas idénticas retornan respuesta cacheada con `durationMs: 1` y `cached: true`.

---

## 🗓️ [2026-11-17] - Fase 1: Esquema Drizzle `bi_*`, Vistas `bi_views` & Pools Multi-BD

### 🎯 Intención
Implementar la infraestructura de datos analíticos para BaserowLite (`EPIC-BI-01` / Issue #16): diseñar y migrar las 8 tablas core de BI (`bi_folders`, `bi_dashboards`, `bi_dashboard_tabs`, `bi_datasets`, `bi_cards`, `bi_thresholds`, `bi_alerts`, `bi_sync_runs`), crear funciones PL/pgSQL inmunes a crash de tipo (`safe_numeric`, `safe_timestamptz`), desarrollar el administrador de conexiones de sólo lectura `BiPoolManager` hacia PostgreSQL (Odoo, Voz) y MariaDB (Pimcore), y construir el generador de vistas SQL tipadas `BiViewsGenerator` sobre el esquema `bi_views`.

### 📍 Estado Actual
- Base de datos `baserow_lite_db`: Esquema `bi_views` creado; funciones `public.safe_numeric(text)` y `public.safe_timestamptz(text)` operativas (retornan `NULL` ante datos corruptos o vacíos sin lanzar excepción fatal).
- Tablas core de BI migradas en PostgreSQL y definidas en Drizzle ORM (`db/schema.ts`):
  - `bi_folders`: Carpetas jerárquicas con auto-referencia y orden.
  - `bi_dashboards`: Dashboards con código único (D001, etc.), layout JSON, tags y auto-refresh.
  - `bi_dashboard_tabs`: Pestañas organizativas por dashboard.
  - `bi_datasets`: Fuentes unificadas (`local_baserow`, `odoo_ro`, `voz_ro`, `pimcore_ro`).
  - `bi_cards`: Preguntas y gráficos analíticos (`kpi`, `line`, `bar`, `horizontal_bar`, `table`, `markdown`) con query y visual configs.
  - `bi_thresholds`: Umbrales de semáforo tricolor para KPIs y alertas.
  - `bi_alerts`: Condiciones y disparadores de webhook hacia n8n/Telegram.
  - `bi_sync_runs`: Historial de ejecuciones y caché analítica.
- Conector multi-fuente `lib/bi/connectors/pool-manager.ts`: Pools controlados de solo lectura con guardia regex que bloquea `INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE` (`CONSULTA_BLOQUEADA`) y fuerza `SET TRANSACTION READ ONLY`.
- Generador de vistas `lib/bi/generators/views-generator.ts`: Mapea campos JSONB de Baserow a columnas SQL tipadas nativas en `bi_views.tbl_*` a velocidad de PostgreSQL.
- Endpoint de administración `/api/admin/bi/sync-views` implementado para regenerar vistas bajo demanda.
- Pruebas automatizadas: 48 tests pasando en 6 suites de prueba (100% éxito) y compilación `next build` limpia (17 páginas).

### 🏁 Estado Deseado
- Cimientos de datos y conectividad listos para la Fase 2 (`EPIC-BI-01` Issue #3: Motor Analítico SQL con Time Intelligence, percentiles p50/p90, cross-filtering y caché en memoria).

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* Riesgo de colapso de consultas analíticas cuando usuarios introducen caracteres alfanuméricos en campos de número o monedas en Baserow clásico, provocando error fatal de casteo en PostgreSQL.
  *Solución:* Implementación de funciones PL/pgSQL inmutables `safe_numeric(text)` y `safe_timestamptz(text)` con captura interna de excepción `WHEN OTHERS THEN RETURN NULL;`.
- *Problema:* Riesgo de saturar las conexiones de Odoo (límite estricto de 5 en homelab).
  *Solución:* `BiPoolManager` limita el pool de Odoo a `max: 3` conexiones con timeout agresivo de conexión de 5000ms e inactividad de 10000ms.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 23**: Creación del issue `#16` en `snadales/BaserowLite` para la Fase 1 de `EPIC-BI-01`.
2. **Iteración 24**: Redacción y aplicación de la migración SQL `db/migrations/0002_bi_analytics_engine.sql` en `baserow_lite_db`.
3. **Iteración 25**: Extensión de `db/schema.ts` con definiciones Drizzle para las 8 tablas `bi_*`.
4. **Iteración 26**: Implementación de `lib/bi/connectors/pool-manager.ts` con guardias de solo lectura para Odoo, Voz y Pimcore.
5. **Iteración 27**: Implementación de `lib/bi/generators/views-generator.ts` y endpoint `/api/admin/bi/sync-views`.
6. **Iteración 28**: Creación de tests unitarios en `lib/bi/__tests__/bi-engine.test.ts` (48/48 pasando) y build de producción Next.js (17 páginas).

### 📊 Evidencia Empírica de Verificación
- `npm test`: 48/48 tests pasando en 6 suites de prueba.
- `next build`: 17/17 páginas compiladas sin errores.
- PostgreSQL en ZBook: `\dt bi_*` lista las 8 tablas en `baserow_lite_db`.
- Funciones seguras validadas en ZBook:
  - `safe_numeric('12345.67')` ➔ `12345.67`; `safe_numeric('invalido_$$$')` ➔ `NULL`.
  - `safe_timestamptz('2026-11-17T12:00:00Z')` ➔ `2026-11-17 12:00:00+00`; `safe_timestamptz('corrupto')` ➔ `NULL`.

---

## 🗓️ [2026-11-17] - Fase 0: Hardening Docker, shm_size, dependencias BI y seguridad Auth/RBAC

### 🎯 Intención
Preparar la infraestructura y cimientos técnicos de BaserowLite para el motor unificado de BI & Analytics (`EPIC-BI-01` / Issue #15): aprovisionar `shm_size: 512mb` en PostgreSQL 16 para evitar OOM en cálculos analíticos pesados (`PERCENTILE_CONT`, joins paralelos), segmentar redes Docker, instalar librerías analíticas core (`echarts`, `zustand`, `@tanstack/react-query`, `mysql2`, `lru-cache`), blindar autenticación con guardia RBAC y control de concurrencia optimista en filas.

### 📍 Estado Actual
- `docker-compose.yml`: `postgres` (`baserow_lite_db`) configurado con `shm_size: 512mb`, flags de PostgreSQL afinados (`shared_buffers=256MB`, `work_mem=8MB`, `maintenance_work_mem=64MB`, `effective_cache_size=768MB`, `max_connections=40`, `max_parallel_workers_per_gather=2`), límites de memoria (1024M app / 1024M db) y redes heterogéneas (`baserow_internal`, `odoo20-network`, `voz-network`, `pimcore_pim`).
- Dependencias core instaladas: `echarts@6.1.0`, `zustand@5.1.0`, `@tanstack/react-query@5.108.0`, `mysql2@3.24.6`, `lru-cache@11.5.3`.
- Seguridad y RBAC: Guard `lib/auth/auth-guard.ts` implementado (`authenticateRequest` y `requireAuth`), eliminando fallback permisivo en `/api/v1/auth/me`. Soporta cabecera Cloudflare Access y tokens API hash SHA-256.
- Concurrencia Optimista: Endpoint `PATCH /api/database/rows/table/[tableId]/[rowId]` ahora verifica `version` / `expected_version` antes de aplicar cambios, retornando HTTP 409 `CONFLICT_OPTIMISTIC_LOCK` ante colisiones.
- Pruebas automatizadas: Suite de 5 archivos con 44 tests pasando (100% éxito) y compilación `next build` limpia (16 páginas).

### 🏁 Estado Deseado
- Infraestructura Docker y PostgreSQL lista para procesar cálculos estadísticos y consultas multi-BD sin riesgos de crash de memoria ni degradación de seguridad.
- Cimientos listos para la Fase 1 (`EPIC-BI-01` Issue #2: Esquema Drizzle `bi_*`, Vistas `bi_views` y Pools de Conexión Multi-BD).

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* Riesgo crítico de error `could not resize shared memory segment` en PostgreSQL 16 al ejecutar agregaciones analíticas con `PERCENTILE_CONT(0.50)` y `PERCENTILE_CONT(0.90)` o joins paralelos sobre datasets de Odoo o Baserow.
  *Solución:* Se agregó `shm_size: 512mb` en el servicio `postgres` de `docker-compose.yml`.
- *Problema:* El test de `auth-guard` fallaba en entorno local sin PostgreSQL al intentar conectar a `127.0.0.1:5432`.
  *Solución:* Se envolvieron las consultas de verificación en bloque try/catch y se deshabilitó el bypass de desarrollo durante `NODE_ENV === 'test'`.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 17**: Creación del issue `#15` en `snadales/BaserowLite` para la Fase 0 de `EPIC-BI-01`.
2. **Iteración 18**: Actualización de `docker-compose.yml` con `shm_size: 512mb`, parámetros de tuning PostgreSQL, límites de recursos y configuración de redes externas hacia Odoo, Voz y Pimcore.
3. **Iteración 19**: Instalación de dependencias analíticas (`echarts`, `zustand`, `@tanstack/react-query`, `mysql2`, `lru-cache`, `@types/echarts`).
4. **Iteración 20**: Implementación del middleware de autenticación `lib/auth/auth-guard.ts` y actualización de `/api/v1/auth/me`.
5. **Iteración 21**: Implementación de bloqueo de concurrencia optimista (`version` check y `CONFLICT_OPTIMISTIC_LOCK`) en `PATCH /api/database/rows/table/[tableId]/[rowId]`.
6. **Iteración 22**: Creación de tests unitarios en `lib/auth/__tests__/auth-guard.test.ts`, ejecución de suite completa vitest (44/44 pasando) y build de producción Next.js.

### 📊 Evidencia Empírica de Verificación
- `npm test`: 44/44 tests pasando en 5 archivos de prueba.
- `next build`: 16/16 páginas estáticas y dinámicas compiladas exitosamente.
- `docker-compose.yml`: Valida sintácticamente y contiene `shm_size: 512mb` y redes `odoo20-network`, `voz-network`, `pimcore_pim`.

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
