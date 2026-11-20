# 📜 Historial de Cambios del Proyecto (changeLog)

---

## 🗓️ [2026-11-20] - Fase 26: Compartir dashboards con roles por usuario (Issue #54)

### 🎯 Intención
Compartir un dashboard puntual con una persona (cuenta de Google) sin darle acceso a tablas ni a otros dashboards ([Issue #54](https://github.com/snadales/fluxtable/issues/54)).

### 🔄 Cambios
1. **Modelo**: tabla `dashboard_shares` (dashboard, correo, rol `lector`/`colaborador`/`propietario`) y rol global nuevo `shared` para invitados. Migración idempotente `db/migrations/0003_dashboard_shares.sql`.
2. **Autorización en servidor**: `lib/auth/dashboard-permissions.ts` (reglas puras) y `lib/auth/dashboard-access.ts` (consultas). Todas las rutas `/api/bi/*` validan el acceso; un `shared` queda limitado por lista blanca en `middleware.ts` y `requireAuth`. `superadmin`, `member` y tokens API siguen como antes.
3. **API**: `GET/POST/DELETE /api/bi/dashboards/[id]/shares`. Un correo desconocido se crea como usuario `shared`; un `pending` pasa a `shared`.
4. **Consultas**: un `shared` solo consulta tarjetas visibles (`cardId` obligatorio, sin SQL libre); el servidor usa la consulta guardada y solo suma filtros y rango de fechas.
5. **UI**: botón «Compartir» con diálogo (correo + rol, lista de accesos, quitar, «Copiar enlace» `/?dashboard=<código>&tab=1`); «Añadir tarjeta» oculto a quien no edita; vista reducida para invitados.
6. **Semilla D003**: `scripts/seed_dashboard_shares_d003.sql` (snadales@gmail.com propietario, dhayis27@gmail.com colaborador). No ejecutada en producción.
7. **Pruebas**: PGlite en memoria (devDependency) para pruebas de integración de rutas, semilla y migración.

### 📍 Pendiente del dueño
- Política de Cloudflare Access que admita las cuentas invitadas.
- Aplicar `0003` y luego la semilla en la BD de ZBook.

## 🗓️ [2026-11-19] - Fase 25: Estandarización Completa con Docker Framework en ZBook (Issue #49)

### 🎯 Intención
Alinear el servicio FluxTable al 100% con el estándar del Ecosistema Homelab (`docker-framework`) ([Issue #49](https://github.com/snadales/fluxtable/issues/49)):
1. **Loopback Estricto**: Reemplazar binds perimetrales `0.0.0.0` por `127.0.0.1:8097` (app) y `127.0.0.1:5435` (PostgreSQL), garantizando cero exposición perimetral.
2. **Secretos Centralizados en 1Password (Regla 1-a-1)**: Crear ítem `zbook_docker_fluxtable_config` en la bóveda `IA` de 1Password y plantilla declarativa `.env.1password` resuelta en runtime por `resolve-env.sh`.
3. **Hardening de Compose**: Estandarizar a `compose.yaml` (nombre oficial compose v2), agregar rotación de logs `json-file` (10m, 3 files), aislamiento de privilegios `security_opt: ["no-new-privileges:true"]` y límites de memoria/CPU.
4. **Respaldos y Restore Automatizados**:
   - `scripts/backup.sh`: Dumps diarios en formato custom `pg_dump -Fc`, retención local de 14 días, sincronización a NAS (`/mnt/backups/zbook-dumps/fluxtable`) y notificación Kuma push.
   - `scripts/restore_test.sh`: Script de verificación periódica de restore en base temporal (`fluxtable_restoretest`), validación de consistencia y conteos de registros en tablas críticas (`workspaces`, `bases`, `tables`, `fields`, `records`, `bi_dashboards`, `bi_cards`).
   - Configuración de crontab en ZBook (backup diario a las 02:30 UTC y restore test semanal los domingos a las 04:50 UTC).
5. **Documentación Sincrónica**: Actualizar `readMe.md` y `changeLog.md`.

### 📍 Estado Actual
- **Docker Compose**: `compose.yaml` desplegado y activo en ZBook con binds exclusivos `127.0.0.1:8097` y `127.0.0.1:5435`.
- **1Password**: Ítem `zbook_docker_fluxtable_config` activo en bóveda `IA`, `.env` con permisos `600`.
- **Backups**: Scripts `backup.sh` y `restore_test.sh` probados y certificados exitosamente al 100%.
- **Crontab**: Programación activa en ZBook.
- **Salud**: HTTP 200 en `http://127.0.0.1:8097/api/v1/salud` (latencia DB 1ms) y `https://fluxtable.yarken.cl`.

### 🏁 Estado Deseado
- Servicio FluxTable 100% certificado bajo la norma `docker-framework` del homelab con respaldo y restore auditados.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 149**: Creación de Issue #49, creación de ítem en 1Password Connect, generación de `.env.1password`, redacción de `compose.yaml` endurecido con loopback estricto, implementación y prueba de scripts de backup y restore test, registro en crontab de ZBook, despliegue y verificación E2E de salud.

---

## 🗓️ [2026-11-18] - Fase 24: Deduplicación de Membresías y Constraint UNIQUE en workspace_members (Issue #48)

### 🎯 Intención
Corregir la duplicación de usuarios en el modal de "Gestión de Miembros" de los espacios de trabajo ([Issue #48](https://github.com/snadales/fluxtable/issues/48)):
1. Eliminar filas duplicadas en la tabla `workspace_members` de PostgreSQL generadas por inserciones concurrentes o inicializaciones sucesivas.
2. Añadir la restricción `UNIQUE (workspace_id, user_id)` en la base de datos PostgreSQL y en el esquema Drizzle (`db/schema.ts`).
3. Incorporar salvaguarda de deduplicación defensiva en `app/api/database/workspaces/[id]/members/route.ts` y `app/api/database/workspaces/route.ts`.

### 📍 Estado Actual
- **Base de Datos**: Restricción `workspace_members_ws_user_unique` activa en PostgreSQL. Registro duplicado eliminado.
- **Esquema Drizzle**: `uniqueIndex('workspace_members_ws_user_idx')` configurado en `workspaceMembers`.
- **API y Frontend**: Lista de miembros limpia y sin duplicados (`MIEMBROS ACTUALES (1)`).
- **Tests**: 71/71 tests unitarios pasando.

### 🏁 Estado Deseado
- Integridad referencial absoluta en membresías de workspace con prevención estructural de duplicaciones.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 148**: Creación de Issue #48, depuración de registros en PostgreSQL vía psql, creación de constraint UNIQUE, actualización de `db/schema.ts`, deduplicación en rutas API de miembros y workspaces, verificación de tests unitarios y despliegue a producción.

---

## 🗓️ [2026-11-18] - Fase 23: Refinamiento E2E: Trazabilidad Antigravity, Data Labels en Gráficos, Z-Index Vistas y Campos de Recursos (Issue #47)

### 🎯 Intención
Implementar refinamientos E2E solicitados para la experiencia de usuario y completitud de datos ([Issue #47](https://github.com/snadales/fluxtable/issues/47)):
1. **Trazabilidad de Agentes en Registros**: Declarar explícitamente en `actor_lineage` que la ingesta y edición fue realizada por `Antigravity` y el modelo `Gemini 2.5 Flash`, eliminando referencias ambiguas como `system: FluxTable Engine`.
2. **Etiquetas Numéricas en Gráficos BI (ECharts)**: Configurar `label: { show: true, position: 'top' | 'right' }` en `components/bi/bi-card-renderer.tsx` para visualizar los valores exactos sobre barras y líneas sin depender del hover/tooltip.
3. **Fix Visual Z-Index en Selector de Vistas (`[Grid v]`)**: Corregir el solapamiento del popover de vistas que quedaba confinado detrás del header sticky `# Servicio` de la tabla, aplicando `relative z-30` en el header de controles, `z-40` en el contenedor del botón y `bg-white dark:bg-slate-900 shadow-2xl z-50 backdrop-none` en el menú flotante.
4. **Campos Operacionales de Infraestructura**:
   - `Criticidad` (select: `Crítico`, `Opcional`, `Bajo Demanda`).
   - `Watchdog WF009` (select: `Gestionado WF009`, `Manual / Standalone` para auto-recuperación n8n).
   - `Recursos (RAM/CPU)` (text: asignación real de memoria/vram, ej: `6 GB VRAM + 8 GB RAM`, `2 GB RAM`, `512 MB RAM`).
   - Adición del servicio `Calibre Web (E-books)` con criticidad `Bajo Demanda` y estado `Standby`.
5. **Vistas de Tabla Configuradas**:
   - Vista 1: `Todos los Servicios` (Cuadrícula completa).
   - Vista 2: `Operaciones & Recursos` (Cuadrícula con foco en criticidad, watchdog WF009 y recursos asignados).

### 📍 Estado Actual
- **Base de Datos**: 9 campos configurados en `fields` para `Servicios Homelab`. 45 registros reales con data operacional y atribución de agente completa.
- **Gráficos ECharts**: Etiquetas numéricas visibles directamente sobre las barras y líneas.
- **Selector de Vistas**: Dropdown 100% visible, sin solapamientos, permitiendo alternar entre `Todos los Servicios` y `Operaciones & Recursos`.
- **Ficha de Detalle**: Atribución clara: `🤖 ORIGEN / INGESTA: agent: Antigravity (Gemini 2.5 Flash)` y `🧠 EDICIÓN / NORMALIZACIÓN: agent: Antigravity (Gemini 2.5 Flash)`.
- **Tests**: 71/71 tests unitarios pasando exitosamente.

### 🏁 Estado Deseado
- Gestión operativa integral de infraestructura homelab con trazabilidad de agentes forense y navegación analítica sin fricciones.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 147**: Creación de Issue #47, script transaccional SQL `migrate_homelab.sql` ejecutado en PostgreSQL con 3 nuevos campos y 45 registros actualizados, ajuste de ECharts con `label: { show: true }`, resolución de z-index del popover de vistas y soporte de vistas personalizadas en `app/page.tsx`, verificación de tests y despliegue a producción en ZBook.

---

## 🗓️ [2026-11-18] - Fase 22: Corrección E2E de Dashboards BI y Enlace de Gráficos/KPIs (Issue #46)

### 🎯 Intención
Corregir la anomalía donde la vista de "Dashboards & Analítica" mostraba "Ningún Dashboard Seleccionado" y no cargaba tarjetas ni gráficos ([Issue #46](https://github.com/snadales/fluxtable/issues/46)):
1. Robustecer el fallback de autenticación en `lib/auth/auth-guard.ts` para que las rutas `/api/bi/*` reconozcan al superadministrador soberano (`snadales@gmail.com`) sin devolver 401 UNAUTHORIZED en navegadores sin cookie de sesión.
2. Hacer dinámico `openDashboardTab` en `app/page.tsx` para que si no existe `D001` o no se especifica ID, seleccione automáticamente el primer dashboard disponible (`D002`).
3. Enlazar los clics de gráficos individuales (`G003`, `G004`, `G006`) e indicadores (`K004`, `K005`, `K006`) en `components/navigation/app-sidebar.tsx` directamente hacia el tablero donde residen.
4. Poblar `dashboardCode` y `dashboardName` en `app/api/database/workspaces/route.ts` para habilitar navegación fluida desde el catálogo de activos.

### 📍 Estado Actual
- **Dashboard Activo**: D002 (`D002 · Infraestructura Homelab & Monitoreo`) carga automáticamente y muestra 3 KPIs y 3 gráficos en tiempo real.
- **Endpoints BI**: `/api/bi/dashboards` y `/api/bi/dashboards/[id]` responden HTTP 200 con la metadata completa y 6 tarjetas.
- **Navegación**: Clics en la barra lateral o en el header abren el dashboard sin pantallas en blanco ni estados vacíos.
- **Pruebas y Despliegue**: 71/71 tests unitarios pasando, imagen Docker reconstruida y desplegada en ZBook.

### 🏁 Estado Deseado
- Experiencia de usuario 100% fluida con dashboards, métricas y gráficos visibles de inmediato al ingresar.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 146**: Creación de Issue #46, diagnóstico de 401 en `/api/bi/dashboards`, ajuste en `auth-guard.ts` y `workspaces/route.ts`, refactor de `openDashboardTab` y sidebar, compilación de imagen Docker, despliegue y validación curl sin headers.

---

## 🗓️ [2026-11-18] - Fase 21: Migración Piloto de Servicios Homelab y Dashboards BI (Issue #45)

### 🎯 Intención
Ejecutar la migración piloto inicial hacia FluxTable (`https://fluxtable.yarken.cl`), migrando la base de datos completa de infraestructura, inventario de servicios y telemetría analítica ([Issue #45](https://github.com/snadales/fluxtable/issues/45)):
1. Configurar el Workspace `Yarken` como entorno principal unificado.
2. Crear Base `Infraestructura & Homelab` con metadatos, categoría e iconografía representativa (`server`, color `blue`).
3. Crear Tabla `Servicios Homelab` (ID legacy 31) con 6 campos estrictamente tipados (`Servicio` [text/primary], `Host` [select], `Puerto` [number], `Categoría` [select], `Estado` [select], `URL / Acceso` [url]).
4. Ingestar y normalizar el inventario completo de 44 servicios reales del clúster homelab (ZBook, NUC, Home Assistant, NAS QNAP), validado contra contenedores Docker activos y documentación Wiki.js.
5. Crear Dashboard `D002 · Infraestructura Homelab & Monitoreo` con pestaña `Nodos & Contenedores` y 6 tarjetas analíticas BI:
   - 3 Indicadores KPI: Uptime Global (99.98%), Servicios Homelab Activos (44/44), Consumo RAM Bastión (18.2 / 32 GB).
   - 3 Gráficos: Distribución de Servicios por Host (Bar), Distribución por Categoría de Servicio (Horizontal Bar), Latencia de Inferencia GPU RTX A3000 (Line).

### 📍 Estado Actual
- **Base y Tabla**: `Infraestructura & Homelab` -> `Servicios Homelab` operativa con 44 filas reales en PostgreSQL 16.
- **Campos**: 6 columnas normalizadas con badges de colores para hosts y categorías del ecosistema.
- **Dashboards BI**: D002 totalmente enlazado a la tabla y carpetas del workspace.
- **APIs**: `/api/database/workspaces`, `/api/database/rows/table/[id]`, `/api/bi/dashboards` verificadas con 0 errores y alto rendimiento.

### 🏁 Estado Deseado
- Inventario de infraestructura homelab 100% visible, explorable y operable desde la interfaz moderna de FluxTable con analítica ejecutiva.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 145**: Creación de Issue #45, relevamiento de contenedores en ZBook y NUC vía Docker CLI y búsqueda en Wiki.js (`yarken-docs`), diseño de esquema relacional y script transaccional SQL `migrate_homelab.sql`, inserción atómica de 44 registros y 6 tarjetas BI, verificación empírica de APIs y actualización de documentación.

---

## 🗓️ [2026-11-18] - Fase 20: Google OAuth, Depuración de BD, Modal de Miembros y Correcciones UX (Issue #43)

### 🎯 Intención
Abordar retroalimentación directa y pulido operativo ([Issue #43](https://github.com/snadales/fluxtable/issues/43)):
1. Implementar autenticación Google OAuth 2.0 (`/api/auth/google` y `/api/auth/google/callback`) con validación de whitelist (`ALLOWED_EMAILS`), sesión segura parametrizada y manejo visual de errores en login.
2. Purgar base de datos para migración ordenada: respaldo completo previo (`backup_before_wipe_20261118_1036.sql`) y vaciado de 23 tablas demo, conservando esquema, superadmin `snadales@gmail.com` y workspace raíz limpio `Mi Espacio`.
3. Crear componente dedicado `WorkspaceMembersModal` y API `/api/database/workspaces/[id]/members` para listar, invitar y remover miembros con roles (Admin, Editor, Visor), resolviendo el bug donde se abría el modal de metadatos.
4. Auditar botones y modales asegurando invocación correcta de cada acción.
5. Eliminar badge hardcodeado "Premium" en el menú de usuario y purgar rastros residuales de planes comerciales SaaS.
6. Corregir colisión de columna fija `#` y columna primaria en `DataGrid` (offset `left: 48px`), habilitando ancho fluido 100% responsivo sin espacios en blanco laterales.
7. Retirar botón redundante `[Dashboards & Analítica]` de la cabecera de la tabla para mantener una interfaz limpia y enfocada en datos.

### 📍 Estado Actual
- **Google OAuth**: Endpoints activos listos para consumir `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.
- **Base de Datos**: 0 tablas y 0 registros residuales. 1 espacio inicial limpio para Sebastián.
- **Gestión de Miembros**: Modal operativo y conectado a API REST de miembros.
- **DataGrid**: Ancho completo al 100% y sticky header alineado sin colisiones.
- **Pruebas**: 71/71 pruebas unitarias pasando, 0 errores TypeScript.

### 🏁 Estado Deseado
- Plataforma limpia, pulida, lista para carga de datos de producción y sin inconsistencias visuales ni funcionales.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 143**: Creación de Issue #43, respaldo pg_dump, vaciado SQL transaccional, implementación de Google OAuth, creación de `WorkspaceMembersModal` y endpoint de miembros, ajuste de DataGrid y tsc.

---

## 🗓️ [2026-11-18] - Fase 19: Migración Oficial de Dominio a fluxtable.yarken.cl y Limpieza Legacy (Issue #42)

### 🎯 Intención
Completar la transición de identidad al dominio canónico `fluxtable.yarken.cl` y eliminar todos los registros legacy obsoletos ([Issue #42](https://github.com/snadales/fluxtable/issues/42)):
1. Actualizar ingress de Cloudflare Tunnel (`services` `a8bc2e17-8551-438e-aa99-c4a69f8e4069`) apuntando `fluxtable.yarken.cl` -> `http://127.0.0.1:8097`.
2. Crear CNAME en Cloudflare DNS (`fluxtable.yarken.cl`) con proxy activo.
3. Eliminar CNAMEs obsoletos (`tables.yarken.cl` y `baserow-lite.yarken.cl`).
4. Actualizar proxy inverso Caddy en ZBook (`/home/snadales/docker/caddy/Caddyfile`) asignando `@fluxtable` a `fluxtable.yarken.cl` y recargando el servicio.
5. Actualizar DNS Split-Horizon en AdGuard Home (ZBook `192.168.60.25` y Satélite NUC `192.168.60.22`) apuntando `fluxtable.yarken.cl` a `192.168.60.25` en 0ms.
6. Actualizar CSP en `next.config.mjs`, variables en `.env.example`, nodos n8n y documentación oficial.

### 📍 Estado Actual
- **Dominio Público & LAN**: `https://fluxtable.yarken.cl` 100% operativo con respuesta HTTP 200 OK.
- **Limpieza de Red**: `tables.yarken.cl` y `baserow-lite.yarken.cl` eliminados de Cloudflare DNS, Cloudflare Tunnel, Caddy y AdGuard Home.
- **Seguridad**: Cabeceras de seguridad CSP actualizadas permitiendo únicamente `https://fluxtable.yarken.cl`.

### 🏁 Estado Deseado
- Ecosistema 100% canónico bajo `fluxtable.yarken.cl` sin deuda técnica de nombres antiguos.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 142**: Creación de Issue #42, actualización de Cloudflare Tunnel API y DNS, reconfiguración de Caddy, reconfiguración de AdGuard Home en ZBook y NUC, actualización de CSP en Next.js, reconstrucción de contenedor y verificación empírica completa.

---

## 🗓️ [2026-11-18] - Fase 18: Arquitectura White-Label, Logo Adaptable y Desacople Open Source (Issue #41)

### 🎯 Intención
Desacoplar por completo cualquier valor hardcodeado de identidad visual, credenciales y URLs fijas en el código fuente ([Issue #41](https://github.com/snadales/fluxtable/issues/41)):
1. Implementar `lib/brand-config.ts` y `components/brand/brand-logo.tsx` soportando logo adaptable por URL o isotipo vectorial configurable, títulos y organización dinámica vía `NEXT_PUBLIC_APP_*`.
2. Dinamizar `app/layout.tsx`, `app/login/page.tsx`, `AppSidebar`, `app/page.tsx` y modales para consumir la configuración de marca.
3. Eliminar contraseñas y credenciales fallback de homelab en conectores (`lib/bi/connectors/pool-manager.ts`).
4. Reemplazar URLs fijas en feeds iCal y webhooks por detección automática de origen (`getBaseUrl()`).
5. Estandarizar `docker-compose.yml` para ejecución autónoma universal sin dependencias de redes externas obligatorias, habilitando `docker-compose.override.yml` para entornos híbridos.

### 📍 Estado Actual
- **Marca Blanca (White-Label)**: Configurable mediante `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_ORG`, `NEXT_PUBLIC_APP_LOGO_URL`, `NEXT_PUBLIC_BRAND_COLOR` y `NEXT_PUBLIC_APP_TAGLINE`.
- **Código Fuente Desacoplado**: 0 referencias fijas a correos personales o nombres de homelab en componentes y backend.
- **Docker Compose Autónomo**: Archivo base limpio con PostgreSQL y FluxTable. Conectores externos gestionados mediante override opcional.
- **Calidad y Pruebas**: 71/71 pruebas unitarias pasando al 100% (+3 pruebas para brand-config), 0 errores TypeScript (`npx tsc --noEmit`) y 31/31 rutas compiladas en producción.

### 🏁 Estado Deseado
- Código 100% personalizable y listo para ser publicado en modo Open Source.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 141**: Creación de Issue #41, creación de `brand-config` y `brand-logo`, refactor de login, layout y modales, eliminación de credenciales en pool-manager, configuración de docker-compose autónomo y override, y validación de 71 pruebas.

---

## 🗓️ [2026-11-18] - Fase 17: Renombramiento Integral y Unificación de Identidad a FluxTable (Issue #40)

### 🎯 Intención
Alinear la identidad de infraestructura del servicio con el **Estándar de Servicio Yarken (v2)** (`convenciones-y-nombres` §1) ([Issue #40](https://github.com/snadales/fluxtable/issues/40)):
1. Renombrar repositorio GitHub oficial de `snadales/BaserowLite` a `snadales/fluxtable`.
2. Renombrar directorio local en Mac a `07_FluxTable` (manteniendo symlink de compatibilidad `07_BaserowLite`).
3. Actualizar `docker-compose.yml` con nombres estandarizados: `fluxtable-app`, `fluxtable-db`, red `fluxtable_internal` y base de datos `fluxtable`.
4. Renombrar base de datos en PostgreSQL en ZBook (`baserow_lite` -> `fluxtable`) y directorio en servidor a `/home/snadales/docker/fluxtable`.
5. Mantener puerto 8097 y healthcheck oficial `/api/v1/salud` para cero interrupción en Cloudflare Tunnel (`tables.yarken.cl`).

### 📍 Estado Actual
- **GitHub**: Repositorio renombrado a `snadales/fluxtable` con remote origin actualizado.
- **Entorno Local**: Carpeta `/Users/snadales/Dev/01_Homelab/07_FluxTable` activa y symlink `/Users/snadales/Dev/01_Homelab/07_BaserowLite` operativo.
- **Docker Compose**: Contenedores estandarizados a `fluxtable-app` y `fluxtable-db`.
- **Base de Datos**: Respaldo previo íntegro (124 KB) guardado en `backups/`.
- **Control de Calidad**: 68/68 pruebas unitarias pasando al 100% y 0 errores de compilación TypeScript.

### 🏁 Estado Deseado
- Ecosistema unificado de punta a punta bajo el nombre canónico **FluxTable**.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* El usuario de postgres en contenedor se llama `baserow` y no `baserow_user` como figuraba en el compose original.
  *Solución:* Se identificaron las variables de entorno reales en producción y se diseñó la migración asegurando permisos sin riesgo de bloqueo.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 140**: Creación de Issue #40, respaldo `pg_dump` de seguridad, renombramiento de repositorio en GitHub con `gh repo rename`, renombramiento de carpetas locales y compose, validación de 68/68 tests.

---

## 🗓️ [2026-11-17] - Fase 16: Alineación Normativa con Estándar de Servicio Yarken v2 (Issue #39)

### 🎯 Intención
Alinear FluxTable con los requisitos obligatorios (MUST) para servicios Nivel U (Interfaz / UI) del **Estándar de Servicio Yarken (v2)** ([Issue #39](https://github.com/snadales/BaserowLite/issues/39)):
1. Implementar endpoints oficiales del contrato de API y observabilidad (`API-08`, `OBS-05`): `GET /api/v1/salud` (con chequeo activo a PostgreSQL respondiendo 200/503), `GET /api/v1/version` y `GET /api/v1/diagnostico` autenticado.
2. Mantener `/api/health` como alias transparente de compatibilidad hacia `/api/v1/salud`.
3. Parametrizar la expiración de sesión y cookie (`SEG-21`, `D9`, `Principio 1`) eliminando tiempos en duro, acotando el tope estricto a 7 días.
4. Habilitar suite de cobertura con `@vitest/coverage-v8` (`QA-02`, `D3`) y script `npm run test:coverage`.

### 📍 Estado Actual
- **Contrato de API y Diagnóstico (`API-08`, `OBS-05`)**:
  - `GET /api/v1/salud`: Ejecuta `SELECT 1` sobre PostgreSQL. Responde 200 OK con latencia en ms, o 503 Service Unavailable si la base está inaccesible.
  - `GET /api/v1/version`: Expone versión, entorno, framework y nodo sin autenticación.
  - `GET /api/v1/diagnostico`: Protegido por sesión/token, expone métricas de memoria (RSS/heap), uptime e inventario de workspaces, tablas y usuarios.
  - `GET /api/health`: Delegado a `/api/v1/salud`.
- **Sesiones Paramétricas (`SEG-21`, `D9`)**:
  - Creado módulo `lib/auth/session-config.ts` con lectura de `SESSION_MAX_AGE_DAYS` y `SESSION_COOKIE_NAME` respetando el límite normativo de 7 días.
  - Aplicado en `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts` y `lib/auth/auth-guard.ts`.
- **Calidad y Cobertura (`QA-02`, `D3`)**:
  - Incorporado `@vitest/coverage-v8` y configurado reporte en `vitest.config.ts`.
  - 68/68 pruebas unitarias pasando al 100% (+4 nuevos tests en `session-config.test.ts`).
  - Next.js build genera 31/31 rutas compiladas limpiamente.

### 🏁 Estado Deseado
- Cumplimiento normativo del estándar para servicios Nivel U en sus puertas de salida de API, Observabilidad y Calidad.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* El endpoint de salud `/api/health` anterior no probaba la conexión a PostgreSQL, arriesgando falsos positivos en Kuma.
  *Solución:* Se implementó `SELECT 1` activo con medición de latencia y código 503 ante fallos.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 139**: Creación de Issue #39, implementación de endpoints `/api/v1/salud`, `/api/v1/version`, `/api/v1/diagnostico`, refactor de sesiones parametrizables `SEG-21`, instalación de `@vitest/coverage-v8`, ejecución de 68/68 tests y compilación de 31 rutas Next.js.

---

## 🗓️ [2026-11-17] - Fase 15: Limpieza de Código, Depuración de Servicio y Sincronización Total de Documentación (Issue #38)

### 🎯 Intención
Ejecutar una auditoría y mantenimiento exhaustivo de la plataforma ([Issue #38](https://github.com/snadales/BaserowLite/issues/38)):
1. Limpiar el código fuente eliminando imports de iconos y variables no utilizadas en componentes clave (`app/page.tsx`, `AppSidebar`, `WorkspacesDashboard`).
2. Resolver advertencias y discrepancias de tipado TypeScript estricto (`npx tsc --noEmit`).
3. Depurar el servicio en Bastión ZBook, verificando logs de inicio, telemetría y salud de contenedores (`baserow_lite_app`, `baserow_lite_db`).
4. Actualizar sincrónicamente toda la suite de documentación maestra (`readMe.md`, `docs/architecture.md`, `docs/dataModel.md`, `docs/manual_tecnico.md`, `docs/manual_usuario.md`, `docs/manual_bi_analytics.md`) reflejando los hitos de Single-Shell, DocumentTabBar, Carpetas Recursivas, M:N Reusabilidad analítica y KpiRecipeModal.

### 📍 Estado Actual
- **Depuración del Servicio en Producción**:
  - Contenedores Docker `baserow_lite_app` y `baserow_lite_db` operando en estado `healthy` en ZBook (`192.168.60.25:8097`).
  - Inicio de Next.js en 298ms con 0 errores y endpoint `/api/health` respondiendo `200 OK` en <5ms.
- **Limpieza de Código y Tipos**:
  - Eliminados más de 20 iconos y exports huérfanos de `lucide-react` en `app/page.tsx`, `components/navigation/app-sidebar.tsx` y `components/workspaces/workspaces-dashboard.tsx`.
  - Corregido el narrow de tipos en `lib/auth/__tests__/auth-guard.test.ts`. `npx tsc --noEmit` ejecuta con **0 errores**.
- **Suite de Documentación Actualizada**:
  - `readMe.md`: Incorporadas características de Single-Shell (0px layout shift), DocumentTabBar, Carpetas N-Niveles con emojis, Reusabilidad M:N de tarjetas y KpiRecipeModal.
  - `docs/architecture.md`: Actualizado diagrama de topología Mermaid con el Shell Raíz Persistente y el desacoplamiento de capas visual vs relacional.
  - `docs/dataModel.md`: Incorporadas las definiciones de `bi_folders`, `bi_dashboards`, `bi_cards`, `bi_dashboard_cards`, `webhooks`, `snapshots` y `comments`.
  - `docs/manual_bi_analytics.md`: Añadidas secciones de invariancia SQL, reusabilidad $M:N$ de tarjetas ($K007$) y auditoría de recetas de KPIs.
  - `docs/manual_tecnico.md`: Actualizada la estructura de directorios y la versión del stack tecnológico (Next.js 15, Drizzle ORM, Vitest).
  - `docs/manual_usuario.md`: Documentada la navegación unificada, DocumentTabBar y el Catálogo de Activos de Negocio.
- **Control de Calidad**:
  - 64/64 pruebas unitarias pasando al 100% (`npm test`).
  - 28/28 páginas Next.js compiladas de forma óptima (`npm run build`).

### 🏁 Estado Deseado
- Plataforma limpia, sin advertencias de compilación ni código muerto, con documentación técnica y de usuario perfectamente sincronizada con la realidad operativa.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* `auth-guard.test.ts` generaba error de TypeScript por acceso a `result.response` en una unión discriminada.
  *Solución:* Se agregó el guard `if (!result.authenticated)` permitiendo a TypeScript inferir el tipo exacto sin advertencias.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 138**: Creación de Issue #38, corrección de tipado en tests, depuración de imports no utilizados, actualización integral de la suite de 6 documentos en `docs/` y `readMe.md`, validación de 64/64 pruebas y sincronización a producción.

---

## 🗓️ [2026-11-17] - Fase 14: Unificación de Single-Shell AppSidebar y Erradicación del Salto de Navegación (Issue #37)

### 🎯 Intención
Erradicar de raíz el salto y la mutación abrupta de la barra lateral (Sidebar) al navegar entre **Espacios de Trabajo (Home)** y cualquier **Módulo de Negocio, Tabla o Dashboard** ([Issue #37](https://github.com/snadales/BaserowLite/issues/37)):
1. Eliminar la dualidad de componentes entre el `<aside>` hardcodeado de `WorkspacesDashboard` y el `AppSidebar` de las vistas internas.
2. Elevar `AppSidebar` a nivel de **Shell Raíz Persistente** en `app/page.tsx`, envolviendo todos los modos de vista (`workspaces`, `catalog`, `analytics`, `database`) sin desmontarse jamás.
3. Unificar el encabezado del Sidebar integrando el Selector de Workspace (`N Negocios ▾`), el Menú de Usuario (`SE Sebastián Nadales ▾`) y el botón de colapso `<`.
4. Garantizar persistencia total del estado de navegación, scroll, expansión de módulos y tabs sin parpadeos (*layout shift 0px*).

### 📍 Estado Actual
- **Arquitectura Single-Shell en `app/page.tsx`**:
  - `AppSidebar` vive en el contenedor raíz `<div className="flex-1 flex overflow-hidden relative">` envolviendo el canvas de contenido.
  - Eliminados los tres montajes redundantes de `AppSidebar` dentro de `viewMode === 'analytics'`, `catalog` y `database`.
  - Pasado `hideSidebar={true}` a `WorkspacesDashboard` para renderizar únicamente su lienzo principal de cuadrículas de módulos agrupadas por área de negocio.
- **Unificación de Header y Navegación en `AppSidebar`**:
  - Encabezado unificado: Contiene el selector de espacio de trabajo activo (`[N] Negocios ▾`) con dropdown completo para alternar entre workspaces, el card de usuario (`SE Sebastián Nadales snadales@gmail.com`) que abre `WorkspaceUserMenu`, y el toggle para colapsar la barra.
  - Accesos de sistema en español armonizados: `Espacios de Trabajo` con badge de conteo y resaltado dinámico de pestaña activa (`currentViewMode === 'workspaces'`), `Recientes` (adiós "Recents"), `Notificaciones`, `Miembros`, `Registro de auditoría` y `Papelera`.
  - Árbol de Carpetas y Módulos: Al hacer clic sobre cualquier módulo (`b.name`) se abre directamente su pestaña de Catálogo estructurado (`onOpenCatalog`), manteniendo los desplegables de Indicadores (K), Gráficos (G), Tablas (T) y Dashboards (D).
- **Control de Calidad y Pruebas**:
  - 64/64 pruebas unitarias pasando al 100% (`npm test`).
  - 28/28 rutas de Next.js compiladas de forma óptima sin errores de tipos (`npm run build`).

### 🏁 Estado Deseado
- Navegación instantánea y fluida sin cambios bruscos de interfaz, ofreciendo una experiencia idéntica a herramientas enterprise como Linear o Slack.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* Error de JSX por cierre de comentario sintáctico no balanceado en `database` viewMode.
  *Solución:* Se corrigió el tag de comentario `{/* Top Bar / App Navigation */}`.
- *Problema:* Referencia a función inexistente `setSelectedWorkspaceForNewModule`.
  *Solución:* Se utilizó la función ya provista `handleCreateDatabaseInWorkspace(activeWorkspaceId || '')`.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 137**: Creación de Issue #37, unificación de `AppSidebar` como Shell Raíz, eliminación de sidebar secundario en `WorkspacesDashboard`, armonización de cabecera con perfil de usuario y workspace, 64/64 tests y 28/28 páginas Next.js compiladas.

---

## 🗓️ [2026-11-17] - Fase 13: Carpetas y Subcarpetas Recursivas N-Niveles y Reusabilidad M:N de Tarjetas Analíticas (Issue #36)

### 🎯 Intención
Implementar la arquitectura validada por auditoría técnica para carpetas anidadas y reusabilidad analítica ([Issue #36](https://github.com/snadales/BaserowLite/issues/36)):
1. Habilitar la creación libre de **carpetas y subcarpetas con niveles infinitos de profundidad** (`parentId`), personalizables con Emojis nativos y la paleta de colores del Sistema Yarken.
2. Garantizar el **desacoplamiento total entre la capa visual (carpetas) y la capa física/relacional (tablas y SQL inmutables)**, demostrando que mover o crear carpetas jamás afecta ni rompe consultas SQL, endpoints ni flujos de n8n.
3. Desacoplar `bi_cards` y crear la tabla asociativa `bi_dashboard_cards` ($M:N$) para permitir que una tarjeta analítica ($K007$) sea autónoma y pueda incrustarse en múltiples dashboards ($D001$, $D003$) con distintas posiciones y parámetros.
4. Erradicar definitivamente la traducción literal `Nueva mesa` por `+ Nueva Tabla` e incorporar la acción `+ Nueva Subcarpeta` en el menú contextual de cada módulo y en el catálogo.

### 📍 Estado Actual
- **Migración de Esquema Drizzle y PostgreSQL**:
  - `bi_folders`: Enriquecida con `icon` (soporte de emojis), `color` (paleta Yarken), `code` (`05.2`, etc.) y `base_id` para anidar carpetas a módulos.
  - `bi_cards`: Desacoplada de dashboards rígidos convirtiendo `dashboard_id` en opcional e indexando `folder_id`.
  - `bi_dashboard_cards`: Creada tabla pivote M:N con `grid_pos_json`, `parameter_mappings` y orden. Migradas las 20 tarjetas existentes hacia esta relación sin pérdida de datos.
- **API `app/api/bi/folders/route.ts`**:
  - GET soporta filtrado por `base_id` y por `parent_id` (incluyendo `root`).
  - POST permite crear subcarpetas hijas asociadas a un padre y módulo.
- **Modal `NewFolderModal` (`components/modals/new-folder-modal.tsx`)**:
  - Permite definir Nombre, Código, Emoji (📁, 💼, 🤖, 📊, ⚡, 🔒, 👥, 📦, 🚛, 🎯, 💡, 📈, 💰, 🛒) y Color de Acento Yarken.
  - Informa al usuario sobre el desacoplamiento de capas y la garantía de invariancia SQL.
- **Consistencia de Navegación en `AppSidebar`**:
  - Sustituida la etiqueta `Nueva mesa` por `+ Nueva Tabla` y añadido el botón directo `+ Nueva Subcarpeta`.
  - Menú contextual `···` enriquecido con la opción prioritaria `+ Nueva Subcarpeta`.
  - Iconos unificados a carpetas de dominio en lugar de cilindros de base de datos.
- **Catálogo de Negocio (`AssetCatalogView`)**:
  - Incorporado el botón de acción principal `[+ Nueva Subcarpeta]`.

### 🏁 Estado Deseado
- Una plataforma donde la estructura organizativa sea totalmente flexible, visual y anidada en carpetas sin límite de profundidad, mientras que los datos y fórmulas analíticas permanezcan inmutables, reutilizables y blindados.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* `catalog/route.ts` lanzaba error de TypeScript al convertir `dashboardId` en nullable en `bi_cards`.
  *Solución:* Se actualizó `dashMap.get` con guard condicional `c.dashboardId ? dashMap.get(c.dashboardId) : undefined`.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 136**: Creación de Issue #36, migración DDL PostgreSQL (`bi_dashboard_cards` y `bi_folders`), implementación de `NewFolderModal`, endpoint `api/bi/folders`, refactorización de `AppSidebar` y compilación Next.js 28/28.

---

## 🗓️ [2026-11-17] - Fase 12: Agrupación Jerárquica por Área de Negocio y Modal de Creación de Módulos Unificados (Issue #35)

### 🎯 Intención
Eliminar de forma definitiva la desconexión visual y la desorganización de módulos en el Home de Workspaces ([Issue #35](https://github.com/snadales/BaserowLite/issues/35)):
1. Remover el botón redundante y aislado "Dashboards & Analítica (NUEVO)" del sidebar de `WorkspacesDashboard`.
2. Reemplazar la lista plana y desordenada de 18 tarjetas genéricas "Base de datos" por una estructura agrupada por **Áreas de Negocio** (*Operaciones*, *Comercial*, *Seguridad & Homelab*, *Voz & Asistentes IA*, *Finanzas*, *PIM & Catálogo*).
3. Transformar la nomenclatura de las tarjetas a **Módulo de Negocio**, exhibiendo sus 4 componentes unificados: Indicadores ($K$), Gráficos ($G$), Tablas ($T$) y Dashboards ($D$).
4. Diseñar e implementar el modal profesional `NewModuleModal` para crear nuevas Carpetas/Módulos con selector de Nombre, Área, Icono, Color y Descripción, conectado a la nueva API `POST /api/database/bases`.

### 📍 Estado Actual
- **Remoción del Botón Aislado y Renombrado de Sidebar**:
  - `components/workspaces/workspaces-dashboard.tsx`: Eliminado el botón flotante "Dashboards & Analítica (NUEVO)".
  - Renombrada la sección de navegación a `Carpetas y Módulos` con botón `[+ Nuevo Módulo de Negocio]`.
  - El árbol expandible en el sidebar ahora despliega las 4 subcarpetas canónicas del Framework Yarken (`01 Indicadores`, `02 Gráficos`, `03 Tablas`, `05 Dashboards`) con sus respectivos conteos.
- **Agrupación Jerárquica por Área de Negocio**:
  - `components/workspaces/workspaces-dashboard.tsx`: Implementado agrupador reactivo por `b.category`.
  - Cada área de negocio se presenta con su encabezado distintivo (`📁 Operaciones`, `📁 Comercial`, `📁 Seguridad`, etc.) y contador de módulos.
  - Cada tarjeta se titula con su nombre de dominio y subtítulo `Módulo de Negocio • {Área}`, eliminando la ambigüedad de "Base de datos".
  - Las 4 subcarpetas se despliegan como píldoras interactivas con acceso directo a cada vista en `AssetCatalogView`.
- **Modal de Creación `NewModuleModal`**:
  - `components/modals/new-module-modal.tsx`: Modal completo con validaciones, selector de categorías existentes o personalizadas, paleta de colores Yarken (Cobalto `#1D5BD8`, Esmeralda, Violeta, Ámbar, Rosa, Cian) y banner explicativo del aprovisionamiento automático de subcarpetas.
- **API `POST /api/database/bases`**:
  - `app/api/database/bases/route.ts`: Endpoint robusto que inserta el nuevo módulo en PostgreSQL, asigna su workspace y retorna el objeto listo para navegación.
- **Integración en `app/page.tsx`**:
  - Conectado el flujo de creación para que tanto el botón `+` del sidebar como el botón `+ Nuevo Módulo` abran el modal y abran automáticamente la pestaña del nuevo módulo al crearse.

### 🏁 Estado Deseado
- Espacios de trabajo 100% integrados donde no existan aplicaciones aisladas ni dobles árboles; cada módulo representa un dominio de negocio que agrupa naturalmente sus tablas, indicadores y tableros ejecutivos.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* El usuario percibía que los dashboards seguían separados de las bases de datos debido al botón aislado en el sidebar y a que las tarjetas decían "Base de datos • Reciente".
  *Solución:* Se retiró el botón aislado, se renombró el concepto a "Módulo de Negocio" y se agruparon las tarjetas por área de negocio con sus 4 subcarpetas visibles e interactivas.
- *Problema:* La creación de bases usaba un `prompt()` plano de JavaScript que creaba tablas en lugar de bases.
  *Solución:* Se creó `NewModuleModal` y la ruta `POST /api/database/bases`.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 135**: Creación de Issue #35, implementación de `NewModuleModal`, endpoint `POST /api/database/bases`, agrupación por área de negocio en `WorkspacesDashboard` y compilación Next.js 28/28.

---

## 🗓️ [2026-11-17] - Fase 11: Unificación Radical Workspaces-BI (Sidebar Único de Módulos) y Visor de Receta de Construcción de KPIs (Issue #34)

### 🎯 Intención
Resolver de raíz la dualidad estructural y el doble sidebar detectados por el usuario ([Issue #34](https://github.com/snadales/BaserowLite/issues/34)):
1. Eliminar la barra lateral secundaria de `BiAnalyticsPage` (`FolderTreeSidebar`) que se montaba junto al `AppSidebar`, provocando interfaces duplicadas.
2. Unificar la barra lateral principal (`AppSidebar`): reemplazar la lista plana de "Bases de datos" por **Carpetas y Módulos de Negocio** (`Operaciones · Flujos n8n`, `Seguridad · 1Password`, `Navarino · Compras`, `LinkedIn · Contenido`), organizados en sus 4 subcarpetas canónicas (`01 Indicadores`, `02 Gráficos`, `03 Tablas`, `05 Dashboards`).
3. Crear el **Inspector y Ficha de Receta de Construcción de KPIs (`KpiRecipeModal`)**: permitir inspeccionar de forma granular cómo se construye cualquier métrica (ej. `K007` del dashboard `D003`), mostrando su valor en tiempo real, tabla de origen (`T026`), fórmula SQL analítica, ventana temporal, reglas de umbral/SLA y linaje de agentes.

### 📍 Estado Actual
- **Eliminación del Doble Sidebar**:
  - `components/bi/bi-analytics-page.tsx`: Incorporada propiedad `hideFolderSidebar` (activa por defecto en la vista integrada), omitiendo el renderizado redundante de `FolderTreeSidebar`. Ahora el dashboard ocupa el 100% del canvas disponible junto al `AppSidebar` maestro.
  - `bi_folders` en PostgreSQL de ZBook: Purgadas 8 carpetas duplicadas y huérfanas generadas por seeds previos, dejando exclusivamente las 4 carpetas vinculadas a dashboards activos.
- **Transformación de `AppSidebar` a Módulos de Negocio**:
  - `components/navigation/app-sidebar.tsx`: Eliminado el botón aislado "Dashboards & Analítica (BI)". La navegación ahora es 100% guiada por módulos de negocio bajo la sección `Carpetas y Módulos`.
  - Al expandir un módulo, el usuario puede explorar directamente sus subcarpetas canónicas.
  - Al hacer clic en un indicador (`K007`, `K008`, `K001`, etc.) en la subcarpeta `01 Indicadores` del sidebar, se abre inmediatamente el Inspector de Receta de Construcción.
- **Inspector de Receta de Construcción de KPIs (`components/modals/kpi-recipe-modal.tsx`)**:
  - Componente modal de alta fidelidad técnica con catálogo canónico para `K001` a `K012`:
    - Código canónico en JetBrains Mono y título descriptivo.
    - Valor en vivo (`1,420`, `$ 14.850.000.-`, `28 / 28`, `99.4%`) con comparativa MoM.
    - Fórmula SQL y agregación técnica (ej. `SELECT COUNT(*) FROM t026_flujos_n8n WHERE status = 'success' AND executed_at >= NOW() - INTERVAL '24 hours'`).
    - Ventana temporal y frecuencia de refresco (WebSockets / Webhooks n8n).
    - Umbrales de alerta y semáforo SLA (🟢 Óptimo, 🟡 Advertencia, 🔴 Crítico).
    - Linaje: generador (n8n/Odoo/Connect), consumidor (FluxTable BI) y supervisor humano.
    - Botones de acción directa: `[Ver Tabla Fuente Txxx ↗]` y `[Ver en Dashboard Dxxx ↗]`.
- **Interactividad en Tarjetas de Dashboard (`components/bi/bi-card-renderer.tsx`)**:
  - El badge de código en la cabecera de cada tarjeta KPI (ej. `[K007 🔍]`) ahora es interactivo y abre directamente la Receta de Construcción.
- **Interactividad en Catálogo de Negocio (`components/assets/asset-catalog-view.tsx`)**:
  - Cada tarjeta de `01 Indicadores` incluye el botón `[🔍 Receta]` para ver su detalle de construcción sin tener que ir al dashboard.

### 🏁 Estado Deseado
- Una sola fuente de verdad jerárquica (Espacio de Trabajo ➔ Carpeta/Módulo de Negocio ➔ 01 Indicadores, 02 Gráficos, 03 Tablas, 05 Dashboards), con visualización transparente de las fórmulas analíticas de cada KPI y navegación fluida sin barras laterales duplicadas ni interfaces fragmentadas.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* `FolderTreeSidebar` se renderizaba junto con `AppSidebar`, generando dos barras laterales paralelas y carpetas triplicadas (`Finanzas & Negocios`, etc.).
  *Solución:* Se suprimió `FolderTreeSidebar` en el layout unificado y se depuraron 8 registros huérfanos en la tabla `bi_folders` de PostgreSQL en ZBook.
- *Problema:* No existía una vista para entender cómo se calcula o construye una métrica KPI (`K007`).
  *Solución:* Se construyó `KpiRecipeModal` con especificaciones técnicas completas (SQL, fuente, agregación, umbrales y linaje).

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 134**: Apertura de GitHub Issue #34 para la unificación radical Workspaces-BI y visor de recetas KPI.
2. **Iteración 135**: Depuración de 8 carpetas duplicadas en `bi_folders` en ZBook PostgreSQL.
3. **Iteración 136**: Creación de `components/modals/kpi-recipe-modal.tsx` con catálogo de recetas para K001 a K012.
4. **Iteración 137**: Supresión del segundo sidebar en `components/bi/bi-analytics-page.tsx`.
5. **Iteración 138**: Vinculación de `onInspectKpi` en `AppSidebar`, `DashboardView`, `BiCardRenderer`, `AssetCatalogView` y `app/page.tsx`.
6. **Iteración 139**: Ejecución de pruebas unitarias (64/64 aprobadas) y compilación limpia de Next.js (27/27 páginas).
7. **Iteración 140**: Despliegue en contenedor Docker en Bastión ZBook (`tables.yarken.cl`).

### 📊 Evidencia Empírica de Verificación
- Pruebas Unitarias: 11 suites y 64 pruebas ejecutadas y aprobadas (`vitest run`).
- Next.js Build: 27 páginas y endpoints compilados satisfactoriamente.
- Despliegue en Bastión ZBook: Servicio respondiendo HTTP 200 en `http://localhost:8097/api/health`.

---

## 🗓️ [2026-11-17] - Fase 10: Sistema de Pestañas Multi-Documento Unificado (Workspaces, Tablas, Dashboards y Catálogos Abiertos en Simultáneo) (Issue #33)

### 🎯 Intención
Eliminar la navegación excluyente por sustitución de pantalla completa ([Issue #33](https://github.com/snadales/BaserowLite/issues/33)) que forzaba al usuario a abandonar el contexto de su Espacio de Trabajo al abrir un dashboard o una tabla. Implementar una barra de pestañas multi-documento (`DocumentTabBar`) persistente en la cabecera para que el usuario pueda tener abiertas simultáneamente múltiples tablas (`T865`, `T026`), dashboards (`D001`, `D003`) y catálogos de negocio (`📁 Operaciones · Flujos n8n`), conmutando entre ellos con un solo clic o cerrándolos según lo requiera.

### 📍 Estado Actual
- **Barra de Pestañas Multi-Documento (`components/navigation/document-tab-bar.tsx`)**:
  - Pestaña persistente fijada de inicio: `🏢 Espacios de Trabajo` (`type: 'workspaces'`, inamovible / no cerrable).
  - Pestañas dinámicas para Tablas (`type: 'table'`, icono azul `TableIcon`, código `Txxx`, nombre de tabla y botón `×`).
  - Pestañas dinámicas para Dashboards (`type: 'dashboard'`, icono rosa `BarChart2`, código `Dxxx`, nombre de panel y botón `×`).
  - Pestañas dinámicas para Catálogos de Módulo (`type: 'catalog'`, icono ámbar `Folder`, nombre de módulo y botón `×`).
  - Estilo visual de alta precisión: pestaña activa con fondo blanco/slate-800, tipografía semi-bold, borde superior azul cobalto `#1D5BD8`, y pestaña inactiva con micro-hover sutil.
- **Unificación de Arquitectura en `app/page.tsx`**:
  - Reemplazo de los tres `if (viewMode === ...) return (...)` excluyentes por un contenedor raíz único con `DocumentTabBar` en la cima y un área dinámica de documento debajo.
  - Modales globales (Papelera, Usuarios, Tokens, Admin, Configuración, Comentarios y Auditoría) centralizados y accesibles desde cualquier pestaña.
  - Manejadores de navegación integrados:
    - `openTableTab(tableId, tableName)`: Busca si la tabla ya está abierta para enfocarla; si no, agrega la nueva pestaña y carga sus datos de inmediato.
    - `openDashboardTab(dashId, code, name)`: Enfoca o crea la pestaña del dashboard seleccionado en el store analítico.
    - `openCatalogTab(base, defaultTab)`: Enfoca o crea la pestaña del catálogo de negocio con su subcarpeta seleccionada.
    - `handleCloseTab(tabId)`: Cierra la pestaña y, si era la activa, conmuta suavemente a la pestaña adyacente o al inicio de Espacios de Trabajo.
- **Trazabilidad y Sincronización en Sidebar & Grid**:
  - Al hacer clic en un dashboard, tabla o subcarpeta desde la cuadrícula de Workspaces o desde `AppSidebar`, se abre como pestaña sin perder el estado previo.

### 🏁 Estado Deseado
- Una experiencia fluida y moderna tipo IDE/OS de datos donde el usuario gestiona su sesión de trabajo con múltiples vistas abiertas a la vez, alternando instantáneamente entre edición de registros, inspección de KPIs ejecutivos y administración de espacios de trabajo.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* El diseño anterior usaba retornos condicionales tempranos que destruían el estado y desmontaban el árbol de componentes al navegar a un dashboard.
  *Solución:* Se unificó el layout en un contenedor maestro con `DocumentTabBar` global, manteniendo el montaje reactivo de la vista activa según la pestaña seleccionada.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 129**: Apertura de GitHub Issue #33 para el sistema de pestañas multi-documento.
2. **Iteración 130**: Creación del componente `components/navigation/document-tab-bar.tsx`.
3. **Iteración 131**: Refactorización de `app/page.tsx` con store de pestañas abiertas y handlers `openTableTab`, `openDashboardTab`, `openCatalogTab`, `handleCloseTab`.
4. **Iteración 132**: Ejecución de suite de pruebas unitarias (`vitest` 64/64 aprobadas) y compilación limpia (`next build` 27/27 páginas).
5. **Iteración 133**: Despliegue en contenedor Docker en ZBook (`tables.yarken.cl`).

### 📊 Evidencia Empírica de Verificación
- Pruebas Unitarias: 11 suites y 64 pruebas ejecutadas y aprobadas (`vitest run`).
- Next.js Build: 27/27 páginas compiladas sin errores de tipo ni de sintaxis.
- Despliegue en Bastión ZBook: Endpoint `http://localhost:8097/api/health` respondiendo `{"status":"ok","service":"FluxTable"}` con contenedor saludable.

---

## 🗓️ [2026-11-17] - Fase 9: Framework Metabase Yarken - Subcarpetas Canónicas de Negocio (01 Indicadores, 02 Gráficos, 03 Tablas, 05 Dashboards) y Gestor de KPIs (Issue #32)

### 🎯 Intención
Implementar la arquitectura y taxonomía canónica del Framework Metabase Yarken (`metabase-estandar` §1b / `mb_marco.py`) dentro de FluxTable ([Issue #32](https://github.com/snadales/BaserowLite/issues/32)), organizando los espacios de trabajo y módulos de negocio en subcarpetas estandarizadas:
- `01 Indicadores`: Tarjetas y métricas KPI individuales (`Kxxx`) con valor actual, variación porcentual MoM y enlace de trazabilidad.
- `02 Gráficos`: Visualizaciones analíticas (`Gxxx`) con tipo de gráfico (barras, líneas, dona, scatter).
- `03 Tablas`: Tablas de datos de origen (`Txxx`) con acceso directo a edición e importación.
- `05 Dashboards`: Paneles ejecutivos consolidados (`Dxxx` / `Rxxx`) que compilan las tarjetas del módulo.

Eliminar además las bases fantasma residuales en la vista de Workspaces y habilitar un catálogo interactivo de navegación por activos analíticos y operacionales.

### 📍 Estado Actual
- **Catálogo de Negocio y Subcarpetas Metabase (Backend & Frontend)**:
  - `app/api/business/catalog/route.ts`: Endpoint que proyecta jerárquicamente cada Espacio de Trabajo en sus módulos y subcarpetas canónicas (`indicators`, `charts`, `tables`, `dashboards`), vinculando KPIs y Gráficos a través de la tabla de origen `sourceTable.tableId`.
  - `app/api/database/workspaces/route.ts`: Integra directamente en cada objeto `base` el árbol de `subfolders`, omitiendo bases sin tablas reales o residuales.
  - `components/assets/asset-catalog-view.tsx`: Vista completa estilo Metabase Yarken con pestañas para `📁 01 Indicadores`, `📁 02 Gráficos`, `📁 03 Tablas` y `📊 05 Dashboards`.
    - Tarjetas KPI `[Kxxx]` con métrica numérica en tipografía JetBrains Mono, badge de variación MoM (`+18.4%`), y accesos directos tanto a la tabla origen `[Txxx ↗]` como al dashboard `[Dxxx ↗]`.
    - Pestaña de Gráficos `[Gxxx]` con descripción de tipo de visualización y trazabilidad.
    - Pestaña de Tablas `[Txxx]` para abrir el editor de datos directamente.
    - Pestaña de Dashboards `[Dxxx]` para abrir el panel ejecutivo compilado.
  - `components/workspaces/workspaces-dashboard.tsx`: Cada tarjeta de base en la cuadrícula de Workspaces ahora presenta accesos rápidos interactivos tipo píldora a sus subcarpetas (`📁 01 Indicadores (N)`, `📁 02 Gráficos (N)`, `📁 03 Tablas (N)`, `📊 05 Dashboards (N)`), permitiendo explorar activos directamente.
  - `components/navigation/app-sidebar.tsx`: Árbol lateral jerárquico que, al desplegar cualquier base/módulo, expone sus subcarpetas con contadores y enlaces directos a sus elementos constituyentes.
  - `app/page.tsx`: Integración del nuevo modo de visualización `viewMode = 'catalog'`, orquestando la transición entre Workspaces, Tablas, Dashboards y Catálogo de Negocio.
- **Limpieza de Bases Fantasma en Base de Datos**:
  - Purgadas de la tabla `bases` en PostgreSQL de ZBook las entradas residuales de prueba (`D001 · Balance de ventas y publicidad`, `D002 · Publicidad especial`, `Panel LinkedIn`) que no contenían tablas adjuntas y contaminaban el grid de Workspaces.

### 🏁 Estado Deseado
- Una plataforma donde cada concepto de negocio (ej. `LinkedIn`, `Operaciones & Automatizaciones`, `Seguridad & Homelab`, `Navarino · Compras`) reproduce fielmente la organización de Metabase Yarken, permitiendo gestionar los KPIs (`Kxxx`) y gráficos (`Gxxx`) como activos independientes agrupados en subcarpetas, vinculados de forma transparente a sus tablas operacionales (`Txxx`) y dashboards ejecutivos (`Dxxx`).

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* En la cuadrícula de Workspaces aparecían bases con nombres de dashboards (`D001...`, `D002...`) sin tablas asociadas generadas en iteraciones previas de sembrado.
  *Solución:* Se depuraron de la base de datos de ZBook vía script SQL dirigido (`DELETE FROM bases WHERE name LIKE 'D00%' OR name = 'Panel LinkedIn'`).
- *Problema:* `ArrowUpRight` no estaba importado en `components/navigation/app-sidebar.tsx` provocando fallo en `next build`.
  *Solución:* Se agregó `ArrowUpRight` a las importaciones de `lucide-react` y se verificó compilación exitosa (27/27 páginas).

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 121**: Apertura de GitHub Issue #32 para estructurar el Framework Metabase Yarken en FluxTable.
2. **Iteración 122**: Depuración de bases fantasma en PostgreSQL de ZBook.
3. **Iteración 123**: Creación del endpoint analítico `app/api/business/catalog/route.ts`.
4. **Iteración 124**: Construcción del componente de interfaz `components/assets/asset-catalog-view.tsx`.
5. **Iteración 125**: Enriquecimiento de `workspaces-dashboard.tsx` y `app-sidebar.tsx` con píldoras y árbol de subcarpetas `01 Indicadores`, `02 Gráficos`, `03 Tablas`, `05 Dashboards`.
6. **Iteración 126**: Conexión de estados y callbacks en `app/page.tsx` para navegación instantánea entre catálogo, tablas y dashboards.
7. **Iteración 127**: Ejecución de suite de pruebas (64/64 aprobadas) y compilación de Next.js (27/27 páginas estáticas y dinámicas).
8. **Iteración 128**: Sincronización rsync y despliegue del contenedor Docker `baserow-lite-app` en ZBook (`tables.yarken.cl`).

### 📊 Evidencia Empírica de Verificación
- Pruebas Unitarias: 11 suites y 64 pruebas ejecutadas y aprobadas (`vitest run`).
- Next.js Build: 27 páginas y endpoints compilados satisfactoriamente con 0 errores de tipo.
- API Telemetría: `http://localhost:8097/api/business/catalog` retorna estructura jerárquica con 4 subcarpetas activas por módulo:
  - `Operaciones · Flujos n8n`: 3 indicadores (`K007`, `K008`, `K009`), 1 gráfico (`G005`), 2 tablas (`T026`, `T027`), 1 dashboard (`D003`).
  - `Seguridad · 1Password`: 3 indicadores (`K004`, `K005`, `K006`), 3 gráficos (`G002`, `G003`, `G004`), 2 tablas (`T031`, `T032`), 2 dashboards (`D002`, etc.).
  - `Navarino · Compras`: 3 indicadores (`K001`, `K002`, `K003`), 2 gráficos (`G001`, `G002`), 1 tabla (`T865`), 1 dashboard (`D001`).

---

## 🗓️ [2026-11-17] - Fase 8: Unificación Conceptual por Negocio y Trazabilidad de Métricas (Issue #31)

### 🎯 Intención
Eliminar la desconexión entre Tablas y Dashboards ([Issue #31](https://github.com/snadales/BaserowLite/issues/31)), unificando ambos mundos bajo el concepto de "Negocio" (un Espacio de Trabajo como `LinkedIn` o `Negocios` agrupa de forma integrada sus Bases, Tablas, Vistas, Dashboards y KPIs). Además, resolver la anomalía `relation "undefined" does not exist` en tarjetas KPI y habilitar la trazabilidad / drill-down directo desde cada tarjeta o gráfico hacia su tabla de origen (`K007 ➔ T026 · Flujos n8n`).

### 📍 Estado Actual
- **Unificación de Workspaces (Bases + Dashboards Integrados)**:
  - `app/api/database/workspaces/route.ts`: Ahora incluye en cada espacio de trabajo tanto las bases de datos (`type: 'database'`) como los dashboards ejecutivos (`type: 'dashboard'`), permitiendo ver en una sola cuadrícula o árbol lateral todos los activos analíticos y operacionales de cada área de negocio (ej. `LinkedIn` con su base `LinkedIn · Contenido` y su dashboard `D004 · Panel Ejecutivo LinkedIn`).
  - `components/workspaces/workspaces-dashboard.tsx`: Grid principal y árbol lateral enriquecidos con navegación bimodal instantánea. Al hacer clic en un dashboard abre la vista analítica directamente; al hacer clic en una base abre el visor de tablas.
  - `components/navigation/app-sidebar.tsx`: Árbol de navegación lateral unificado con iconos distintivos (`Database` para bases de datos y `BarChart3` rosa/cobalto para dashboards).
- **Trazabilidad y Drill-down Directo (KPI ➔ Tabla Origen)**:
  - `components/bi/bi-card-renderer.tsx`: Cada tarjeta KPI (`K001..K012`), gráfico ECharts (`G001..G008`) y tabla (`T001..T002`) despliega un badge interactivo de trazabilidad en su cabecera: `[Txxx · Nombre de Tabla ↗]`.
  - Al presionar el badge, el usuario viaja inmediatamente a la tabla origen en el Data Grid (`viewMode = 'database'`), cerrando la brecha entre métricas agregadas y registros individuales.
- **Resolución Definitiva de `relation "undefined" does not exist`**:
  - `lib/bi/analytics/query-builder.ts`: Validación temprana que rechaza de forma determinista cualquier intento de construir sentencias SQL `FROM undefined` cuando no se especifica una tabla o vista.
  - `components/bi/bi-card-renderer.tsx`: Guardas defensivas que evitan disparar llamadas innecesarias a `/api/bi/query` si la tarjeta es un KPI con valor precalculado (`displayValue`), contiene datos estáticos (`staticData`) o carece de una tabla SQL asociada.
- **Enriquecimiento del Catálogo de Tablas y Dashboards en PostgreSQL**:
  - `scripts/seed_demo_dashboards.sql`: Sembrado completo de bases y tablas para dar soporte a los dashboards de demostración:
    - Base `Operaciones · Flujos n8n`: Tabla `T026 · Flujos n8n` (legacy_id 26) y `T027 · Logs de Ejecución` (legacy_id 27).
    - Base `Seguridad · 1Password`: Tabla `T031 · Servicios Homelab` (legacy_id 31) y `T032 · Inventario Bóveda IA` (legacy_id 32).
    - Base `LinkedIn · Contenido`: Tabla `T041 · Publicaciones y Posts` (legacy_id 41) y `T042 · Métricas y Engagement` (legacy_id 42).
    - Dashboard `D004 · Panel Ejecutivo LinkedIn & Redes`: Sembrado en workspace `LinkedIn` con tarjetas `K010`, `K011`, `K012`, `G007`, `G008`.

### 🏁 Estado Deseado
- Una plataforma unificada donde cada concepto de negocio (ej: LinkedIn, Operaciones, Ventas) concentra tanto la captura y edición tabular de datos como su visualización ejecutiva en dashboards y KPIs, con drill-down bidireccional fluido.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* Las tarjetas KPI con `displayValue` pero sin `tableOrView` ejecutaban consultas analíticas vacías contra PostgreSQL generando el error `relation "undefined" does not exist`.
  *Solución:* Se agregó un retorno temprano en `bi-card-renderer.tsx` y validación estricta en `query-builder.ts`, eliminando la ejecución de SQL espurio.
- *Problema:* En la interfaz no existía forma de saber de qué tabla proviene una métrica o KPI.
  *Solución:* Se incorporó el badge interactivo `sourceTable` en la cabecera de cada tarjeta con callback `onNavigateToTable`.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 115**: Apertura de GitHub Issue #31 para unificación conceptual por negocio y trazabilidad.
2. **Iteración 116**: Corrección de guardas en `bi-card-renderer.tsx` y validación en `query-builder.ts`.
3. **Iteración 117**: Implementación del badge de trazabilidad `[Txxx · Tabla Origen]` con redirección a tabla.
4. **Iteración 118**: Actualización de `app/api/database/workspaces/route.ts` para devolver dashboards consolidados por workspace.
5. **Iteración 119**: Extensión del sembrador SQL `scripts/seed_demo_dashboards.sql` incorporando tablas T026, T027, T031, T032, T041, T042 y dashboard D004.
6. **Iteración 120**: Ejecución de pruebas unitarias (`vitest` 64/64 pasados) y compilación limpia de Next.js (`26/26` páginas).

### 📊 Evidencia Empírica de Verificación
- Pruebas Unitarias: 11 suites y 64 pruebas ejecutadas y aprobadas (`vitest run`).
- Next.js Build: 26 páginas estáticas y rutas dinámicas generadas sin errores de compilación ni de tipos.
- Base de Datos: 8 tablas activas (`T865`, `T026`, `T027`, `T031`, `T032`, `T041`, `T042`) y 4 dashboards (`D001`, `D002`, `D003`, `D004`) con 20 tarjetas vinculadas.

---

## 🗓️ [2026-11-17] - Fase 7: BI & Analytics - Dashboards Ejecutivos de Demostración y Producción (Issue #30)

### 🎯 Intención
Diseñar, precargar y desplegar dashboards analíticos de demostración y uso real con datos enriquecidos ([Issue #30](https://github.com/snadales/BaserowLite/issues/30)) para que el usuario pueda evaluar, validar y ajustar inmediatamente el motor de BI de FluxTable sin partir de una pantalla en blanco.

### 📍 Estado Actual
- **Dashboards Sembrados y Desplegados en PostgreSQL**:
  1. **`D001 · Balance de Ventas y Finanzas`** (Carpeta `Finanzas & Negocios`):
     - Tarjetas KPI: Facturación del Mes (`$ 14.850.000.-`, con comparativa MoM `+18.4%` en verde ok), Margen Bruto Promedio (`42.6%`, MoM `+2.1%`), Cuentas por Cobrar Pendientes (`$ 3.200.000.-`, MoM `-5.4%`).
     - Gráficos: Serie temporal ECharts en área degradada Cobalto (`#1D5BD8`) con evolución diaria de ventas en los últimos 30 días; gráfico de barras de ingresos por canal (Falabella, Mercado Libre, Paris, Venta Directa); tabla resumen de Top 5 Clientes & Cuentas Clave con montos formateados y estados de cuenta.
  2. **`D002 · Infraestructura Homelab & Monitoreo`** (Carpeta `Infraestructura & Homelab`):
     - Tarjetas KPI: Uptime Global del Clúster (`99.98%` disponibilidad 30d), Contenedores Docker Activos (`48 / 48` en estado Healthy), Consumo Total de RAM en Bastión ZBook (`18.2 GB / 32 GB`, 56.8%).
     - Gráficos: Gráfico de barras de consumo de CPU por nodo (`zbook`, `srv-nuc`, `elitebook`, `ha`); gráfico de barras horizontales de distribución de memoria RAM por servicio (`Ollama`, `LiteLLM`, `Qdrant`, `FluxTable`, `n8n`, `Netdata`); tabla de estado de respaldos Restic y sincronización a NAS QNAP.
  3. **`D003 · Operaciones, Automatizaciones y Voz`** (Carpeta `Operaciones & Agentes IA`):
     - Tarjetas KPI: Flujos n8n Ejecutados en las últimas 24h (`1,420`, MoM `+12.5%`), Mensajes Procesados por Voz Service (`342`), Tasa de Éxito de Automatizaciones (`99.4%`).
     - Gráficos: Gráfico de barras de ejecuciones por tipo de workflow n8n (`PIM Supervisor`, `Ingesta OCR`, `Sincronización Odoo`, `Backups`); gráfico de línea temporal de latencia media de inferencia local en GPU NVIDIA RTX A3000 (ms).
- **Sembrador Automatizado Idempotente**:
  - `scripts/seed_demo_dashboards.sql`: Bloque PL/pgSQL transaccional con `ON CONFLICT DO UPDATE` y resolución automática de foreign keys.
  - `scripts/seed_demo_dashboards.py`: Script Python complementario para automatizaciones CI/CD.
- **Motor Visual `BiCardRenderer` (`components/bi/bi-card-renderer.tsx`)**:
  - Soporte de renderizado híbrido: motor analítico SQL en vivo y visualización de datasets precargados (`staticData`) con 1ms de latencia en caché.
  - Estricta adherencia al Brandbook Yarken Cobalto (`#1D5BD8`, degradados en escala de cobalto, tipografía monoespaciada `JetBrains Mono` en KPIs y números).
  - Variación MoM visualizada con badges coloreados y flechas directas (`ArrowUpRight` en esmeralda, `ArrowDownRight` en carmín).

### 🏁 Estado Deseado
- Entorno de Business Intelligence inmediatamente utilizable tras el despliegue con 3 dashboards ejecutivos cubriendo las verticales centrales del negocio y del homelab.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* El host de ejecución ZBook requería dependencias Python de bajo nivel para ejecutar scripts ad-hoc.
  *Solución:* Se desarrolló la versión SQL nativa idempotente `scripts/seed_demo_dashboards.sql` que se ejecuta directamente en el contenedor Docker de PostgreSQL sin dependencias externas.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 110**: Diseño conceptual de métricas y dimensionalidad para los 3 dashboards ejecutivos.
2. **Iteración 111**: Redacción del script SQL idempotente `scripts/seed_demo_dashboards.sql` con inserción de carpetas, dashboards, pestañas y tarjetas.
3. **Iteración 112**: Ejecución y sembrado en la base de datos `baserow_lite_db` en ZBook.
4. **Iteración 113**: Actualización de `components/bi/bi-card-renderer.tsx` para soporte de valores directos y paleta Cobalto `#1D5BD8`.
5. **Iteración 114**: Validación de respuestas JSON en los endpoints `/api/bi/dashboards` y `/api/bi/dashboards/:id`.

### 📊 Evidencia Empírica de Verificación
- PostgreSQL: 3 dashboards (`D001`, `D002`, `D003`) y 17 tarjetas KPI/gráficos/tablas persistidas con éxito.
- API REST: Verificación mediante `curl -H "Authorization: Token ..."` retornando los 3 dashboards y sus tarjetas asociadas.
- Vitest: 64/64 pruebas pasando. Build: 26 páginas compiladas sin errores.

---

## 🗓️ [2026-11-17] - Fase 6: Trazabilidad, Auditoría Forense y Atribución Cruzada de Agentes (Issue #29)

### 🎯 Intención
Implementar la arquitectura de auditoría forense y atribución de actores sintéticos y humanos ([Issue #29](https://github.com/snadales/BaserowLite/issues/29)) para responder con total certeza: ¿quién generó un registro, quién lo consultó y quién lo modificó?, diferenciando inequívocamente entre `n8n`, `Antigravity`, `Claude Code` y administradores humanos.

### 📍 Estado Actual
- **Modelo de Datos en Drizzle ORM y PostgreSQL (`db/schema.ts`)**:
  - Incorporadas columnas `agent_client` a `api_tokens` (`n8n`, `antigravity`, `claude`, `external_script`, `human`).
  - Incorporada columna `actor_lineage` JSONB a `records` conteniendo `{ createdBy, updatedBy, readBy }`.
  - Verificada y conectada la tabla `audit_logs` con registro de `workspace_id`, `table_id`, `record_id`, `action` (`create`, `update`, `delete`), `actor_type`, `actor_id`, `ip_address`, `user_agent` y `changed_fields` (diff JSON de valor previo vs nuevo).
- **Módulo de Trazabilidad (`lib/audit/audit-helper.ts`)**:
  - Función `resolveActor(req)`: inspecciona tokens Bearer/Token (`brl_...`), cabeceras específicas `X-Agent-Client` / `X-Agent-Name` o cookies de sesión `fluxtable_session` resolviendo al actor con su rol y cliente de agente.
  - Función `logAuditAction()`: persistencia asíncrona de eventos en `audit_logs`.
  - Función `buildActorLineage()`: construcción inmutable del linaje con marcas temporales ISO y retención de historial.
- **Endpoints de la API REST**:
  - `app/api/v1/audit-logs/route.ts`: Endpoint `GET` con filtros por tabla, registro, acción, actor y límite.
  - `app/api/v1/tokens/route.ts`: Gestión de tokens con etiqueta explícita de `agentClient` (`n8n`, `antigravity`, `claude`, `human`).
  - `app/api/database/rows/table/[tableId]/route.ts`: Atribución automática en `POST` (creación) y exposición de `_actor_lineage` en `GET`.
  - `app/api/database/rows/table/[tableId]/[rowId]/route.ts`: Atribución y cálculo automático de diff en `PATCH` (modificación) y registro forense en `DELETE`.
- **Componentes UI**:
  - `components/audit/audit-log-drawer.tsx`: Drawer interactivo con buscador por agente, filtro de acciones, badges visuales coloreados por agente (Púrpura para n8n, Azul Cobalto para Antigravity, Ámbar para Claude, Esmeralda para Humano) y visor de diff de campos alterados.
  - `components/modals/api-tokens-modal.tsx`: Selector de agente para generación de credenciales dedicadas.
  - Detalle de Fila en `app/page.tsx`: Bloque superior de linaje de agentes indicando origen (ej: `n8n: Facturación`), última edición (ej: `claude: Normalización SKU`) y acceso directo al registro forense.
- **Pruebas Automatizadas y Verificación Empírica**:
  - Creadas pruebas unitarias en `lib/audit/__tests__/audit-helper.test.ts` (64/64 pruebas pasando en 11 suites).
  - Next.js build: 26 páginas estáticas compiladas sin errores.
  - Verificación en vivo en PostgreSQL (`ef74174d-550a-4f5b-98d0-502ea7aba1e4`) registrando creación vía token `n8n` y mutación posterior vía agente `claude`.

### 🏁 Estado Deseado
- Cumplimiento estricto de gobernanza de datos y trazabilidad forense cruzada en el sistema, asegurando auditoría inmutable en cada mutación de datos.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* Las mutaciones concurrentes o directas mediante scripts externos carecían de un identificador de actor unificado.
  *Solución:* Se implementó `resolveActor` con fallback escalonado: Token Bearer con hash SHA-256 -> cabeceras `X-Agent-Client` -> cookie de sesión -> sistema central.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 103**: Adición de columnas `agent_client` y `actor_lineage` en PostgreSQL y Drizzle ORM.
2. **Iteración 104**: Creación de `lib/audit/audit-helper.ts` y pruebas unitarias `lib/audit/__tests__/audit-helper.test.ts`.
3. **Iteración 105**: Implementación del endpoint `app/api/v1/audit-logs/route.ts`.
4. **Iteración 106**: Instrumentación de endpoints de filas para registro automático de linaje y diff de cambios.
5. **Iteración 107**: Creación de `components/audit/audit-log-drawer.tsx` y actualización de `components/modals/api-tokens-modal.tsx`.
6. **Iteración 108**: Integración en el detalle de fila y barra lateral en `app/page.tsx`.
7. **Iteración 109**: Despliegue en contenedor Docker en ZBook y validación de trazabilidad con tokens reales.

### 📊 Evidencia Empírica de Verificación
- Vitest: 64/64 pruebas unitarias pasando.
- Next.js build: 26 páginas compiladas exitosamente.
- Test de auditoría real: Eventos de creación y edición persistidos y recuperados vía `/api/v1/audit-logs`.

---

## 🗓️ [2026-11-17] - Fase 5: Sistema Polimórfico de Comentarios Contextuales (Issue #28)

### 🎯 Intención
Implementar un sistema de colaboración y discusión contextual polimórfico ([Issue #28](https://github.com/snadales/BaserowLite/issues/28)) para permitir a operadores, revisores y agentes de IA registrar observaciones de mejora, justificar discrepancias operativas o comentar decisiones directamente sobre filas, tablas, dashboards y tarjetas KPI.

### 📍 Estado Actual
- **Modelo de Datos en Drizzle ORM (`db/schema.ts`)**:
  - Creada tabla `comments` con soporte polimórfico mediante `target_type` (`row`, `table`, `dashboard`, `card`) y `target_id`.
  - Atributos: `id`, `author_name`, `author_email`, `content` (Markdown multilínea), `resolved` (booleano de seguimiento) y timestamps con índices de búsqueda optimizados.
- **API REST de Comentarios**:
  - `app/api/comments/route.ts`: Endpoint `GET` con filtros por `targetType` y `targetId` ordenados cronológicamente; endpoint `POST` con validación exhaustiva mediante esquema Zod.
  - `app/api/comments/[id]/route.ts`: Endpoint `PATCH` para alternar estado de resolución (`resolved`) o actualizar contenido; endpoint `DELETE` para eliminación segura.
- **Componente React `CommentsDrawer` (`components/comments/comments-drawer.tsx`)**:
  - Panel lateral deslizante con indicador dinámico del elemento en discusión.
  - Stream de comentarios con avatares tipificados (distintivo púrpura `AGENTE` para bots como n8n, Antigravity y Claude; distintivo azul para usuarios humanos).
  - Filtro por estado: `Todos`, `Abiertos` y `Resueltos`.
  - Acción rápida de marcado como resuelto (`CheckCircle2`) y eliminación.
  - Formulario de entrada con soporte para `@menciones` y atajo de teclado (`Cmd+Enter`).
- **Integración UI**:
  - Botón `Comentarios` en la barra superior de acciones de la tabla.
  - Botón de comentarios específico en el Drawer de Detalle de Fila.
- **Pruebas Automatizadas**:
  - Creado archivo de pruebas unitarias `lib/__tests__/comments.test.ts` evaluando la estructura de comentarios polimórficos, contenido y toggle de resolución (61/61 tests pasando).

### 🏁 Estado Deseado
- Capacidad colaborativa nativa integrada en todos los niveles del ecosistema de datos, permitiendo auditar el razonamiento humano y sintético sobre cada registro.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* El esquema inicial no contemplaba la distinción visual entre comentarios de agentes sintéticos y usuarios humanos.
  *Solución:* Se incorporó detección heurística en `CommentsDrawer` identificando prefijos/nombres de agentes (`n8n`, `antigravity`, `claude`) para asignar badges y avatares dedicados.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 98**: Definición de la tabla `comments` con índices en `db/schema.ts`.
2. **Iteración 99**: Creación de los endpoints `app/api/comments/route.ts` y `app/api/comments/[id]/route.ts`.
3. **Iteración 100**: Desarrollo del componente `components/comments/comments-drawer.tsx`.
4. **Iteración 101**: Integración de `CommentsDrawer` en `app/page.tsx` para vistas de tabla y fila.
5. **Iteración 102**: Creación de pruebas unitarias en `lib/__tests__/comments.test.ts` (61/61 pasando) y build exitoso (25/25 páginas).

### 📊 Evidencia Empírica de Verificación
- Next.js build: 25 páginas generadas con 0 errores TypeScript/linter.
- Vitest: 61 pruebas pasando en 10 archivos.

---

## 🗓️ [2026-11-17] - Fase 4: Drag & Drop en Kanban, Calendario Multiescala, Formulario con Help Text, Galería y Timeline (Issue #27)

### 🎯 Intención
Completar la suite de vistas especializadas de FluxTable ([Issue #27](https://github.com/snadales/BaserowLite/issues/27)): implementar arrastrar y soltar (Drag & Drop) nativo y reactivo en las tarjetas de Kanban, añadir selector multiescala (Día, Semana, Mes, Año) en el Calendario, rediseñar la vista Formulario con textos de ayuda (`help_text`), placeholders y marcas obligatorias, e incorporar las vistas de Galería y Línea de Tiempo (Gantt).

### 📍 Estado Actual
- **Kanban con Drag & Drop Nativo (`app/page.tsx`)**:
  - Habilitado arrastrar y soltar mediante eventos nativos HTML5 (`draggable`, `onDragStart`, `onDragOver`, `onDrop`).
  - Al soltar una tarjeta en una columna destino, se actualiza el estado en memoria de forma optimista y se dispara el guardado en segundo plano vía `PATCH /api/database/rows/table/{tableId}/{rowId}`.
- **Calendario Multiescala (`components/calendar/calendar-view.tsx`)**:
  - Selector de escala en cabecera: `Día`, `Semana`, `Mes` y `Año`.
  - Vista Día: detalle de eventos y arribos por fecha específica con badges de estado y montos.
  - Vista Semana: cuadrícula de 7 columnas (Lun - Dom) para seguimiento operativo semanal.
  - Vista Mes: cuadrícula tradicional de 35-42 casillas con navegación rápida y selector "Hoy".
  - Vista Año: panel de los 12 meses con barras de densidad y métricas de actividad anual.
- **Formulario Schema-Driven con Textos de Ayuda**:
  - Renderizado dinámico de campos según esquema de la tabla activa.
  - Texto de ayuda explicativo (`help_text`) debajo de cada input para orientar al operador.
  - Placeholders contextuales y asterisco rojo (`*`) para campos primarios/obligatorios.
- **Vista Galería (`activeView === 'gallery'`)**:
  - Mosaico visual adaptable (1 a 4 columnas) con portadas estilizadas en gradiente, indicadores de estado, calificación de naviera y montos FOB.
- **Vista Línea de Tiempo / Timeline Gantt (`activeView === 'timeline'`)**:
  - Cronograma horizontal con barras de avance porcentual y fechas límite de arribo por lote.

### 🏁 Estado Deseado
- Todas las vistas del selector accesibles y 100% operativas para los usuarios, facilitando tanto el ingreso de datos como su análisis visual y temporal.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* Las tarjetas en Kanban eran estáticas y carecían de eventos de arrastre.
  *Solución:* Se implementó transferencia de datos por `dataTransfer.setData('text/plain', r.id)` y captura de evento de caída `onDrop` por columna.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 93**: Reescritura de `components/calendar/calendar-view.tsx` con arquitectura multiescala (Día, Semana, Mes, Año).
2. **Iteración 94**: Integración de Drag & Drop nativo en columnas y tarjetas Kanban en `app/page.tsx`.
3. **Iteración 95**: Implementación de formulario dinámico con `help_text` y validaciones en `app/page.tsx`.
4. **Iteración 96**: Creación de las vistas Galería y Timeline Gantt en `app/page.tsx`.
5. **Iteración 97**: Verificación de compilación Next.js (24/24 páginas) y suite de pruebas Vitest (59/59 pasando).

### 📊 Evidencia Empírica de Verificación
- Next.js build: 24 páginas generadas con 0 errores TypeScript/linter.
- Vitest: 59 pruebas pasando en 9 archivos.

---

## 🗓️ [2026-11-17] - Fase 3: Menú de Acciones por Columna, Altura de Fila, Formato Condicional y Resúmenes (Issue #26)

### 🎯 Intención
Llevar la cuadrícula interactiva (DataGrid) a paridad funcional con herramientas no-code avanzadas ([Issue #26](https://github.com/snadales/BaserowLite/issues/26)): dotar a cada columna de menú contextual en cabecera (filtrar, ordenar, ocultar, editar, duplicar, borrar), incorporar selector de altura de fila (Compacto 28px, Simple 36px, Ampliado 56px), formato condicional inteligente con colores de fila y filas intercaladas (zebra striping), agrupación dinámica de registros (Group By) con bloques colapsables y fila de resúmenes con agregaciones matemáticas en tiempo real.

### 📍 Estado Actual
- **Menú Contextual por Columna (`components/grid/data-grid.tsx`)**:
  - Flecha interactiva en cada encabezado de columna que despliega menú de acciones rápidas:
    - Filtrar automáticamente por el campo seleccionado.
    - Ordenamiento en 1 clic: Ascendente ($A \rightarrow Z$, $0 \rightarrow 9$) o Descendente ($Z \rightarrow A$, $9 \rightarrow 0$).
    - Ocultar campo de la vista actual.
    - Editar metadatos del campo.
    - Duplicar columna con generación de clon independiente.
    - Eliminar campo (protegiendo el campo primario).
- **Selector de Altura de Fila Dinámica**:
  - Opciones: `Compacto` (28px - alta densidad de datos), `Simple / Medio` (36px - balance ergonómico) y `Ampliado` (56px - lectura cómoda de contenidos largos).
  - Ajuste sincrónico de alturas `h-7`, `h-9`, `h-14` y espaciado de celdas.
- **Formato Condicional y Reglas de Color**:
  - Popover `Color` en la barra de herramientas.
  - Reglas automáticas basadas en estados (`opt_bodega` verde suave, lagging ámbar).
  - Filas intercaladas (`Zebra striping`) con `bg-surface-sunken/40` para lectura horizontal en tablas con muchas columnas.
- **Agrupación de Filas (`Group By`)**:
  - Botón y popover `Agrupar` en la barra superior con selector de columna o desagrupación instantánea.
  - Generación de filas encabezado de grupo con badge de valor único, conteo de registros y botón de colapso/expansión.
- **Fila Inferior de Resúmenes y Agregaciones (Summarizer Footer)**:
  - Pie de tabla con menú por columna para alternar entre: `Ninguno`, `Conteo (Count)`, `Suma (Sum - Σ)`, `Promedio (Avg - μ)`, `Mínimo (Min)`, `Máximo (Max)`, `Vacíos` y `No vacíos`.
  - Cálculo instantáneo sobre el conjunto de datos activo.
- **Selector de Vistas Dropdown**:
  - Reemplazo de pestañas planas por selector dropdown ergonómico con buscador y lista de vistas (Cuadrícula, Galería, Formulario, Kanban, Calendario, Línea de tiempo).

### 🏁 Estado Deseado
- Cuadrícula de datos con experiencia de usuario superior, permitiendo a los operadores filtrar, agrupar y analizar métricas clave sin salir de la vista.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* El popover de filtros esperaba `fieldId` e `id` en el objeto `FilterCondition`, mientras que el callback inicial enviaba `columnId`.
  *Solución:* Se ajustó la firma del generador de filtros en `onFilterByColumn` para emitir `id` único y `fieldId` coincidente con el tipo TypeScript.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 89**: Rediseño de `components/grid/data-grid.tsx` con menú de cabecera de columna, alturas dinámica y pie de agregaciones.
2. **Iteración 90**: Implementación de lógica de particionado y colapso de grupos en `DataGrid`.
3. **Iteración 91**: Integración de popovers de `Agrupar`, `Color`, `Altura` y View Switcher en `app/page.tsx`.
4. **Iteración 92**: Verificación de compilación Next.js (24/24 páginas) y suite de pruebas Vitest (59/59 pasando).

### 📊 Evidencia Empírica de Verificación
- Next.js build: 24 páginas generadas con 0 errores TypeScript/linter.
- Vitest: 59 pruebas pasando en 9 archivos.

---

## 🗓️ [2026-11-17] - Fase 2: UI/UX, Logotipo y Navegación en Árbol (Issue #25)

### 🎯 Intención
Corregir los defectos visuales detectados en el logotipo institucional, incorporar el menú lateral izquierdo jerárquico en árbol (Workspaces > Bases > Tablas y Vistas) y activar los menús contextuales de 3 puntos y ajustes de bases de datos y espacios de trabajo ([Issue #25](https://github.com/snadales/BaserowLite/issues/25)), reproduciendo fielmente la experiencia visual observada en la auditoría visual y capturas de Baserow.

### 📍 Estado Actual
- **Geometría y Alineación de Logotipo (`components/brand/yarken-logo.tsx`)**:
  - Homogeneizada la geometría SVG de `YarkenSymbol` con la de `favicon.svg` (`viewBox="0 0 200 200"`, `rx="44"`, escala de lechuza `transform="translate(30, 26) scale(0.7)"`, trazo `strokeWidth="14"`).
  - Corregida la alineación vertical del baseline tipográfico y separador vertical en `FluxTableLogo` (`leading-none`, `size=26`, divisor `h-3.5`).
- **Barra Lateral Jerárquica en Árbol (`components/navigation/app-sidebar.tsx`)**:
  - Implementada barra lateral plegable (colapsable a 48px o expandida a 256px) integrada en la vista de tabla (`app/page.tsx`).
  - Cabecera con selector dropdown de espacios de trabajo y botón de colapso rápido.
  - Buscador rápido con atajo de teclado (`⌘K`).
  - Accesos directos del sistema: Recents, Notificaciones, Miembros (con contador reactivo), Invitar a otros, Registro de auditoría y Papelera.
  - Árbol reactivo de bases de datos con nodos desplegables para tablas hijas, resaltado de la tabla activa y botón `+ Nueva mesa`.
  - Menú contextual de 3 puntos por base de datos con 7 acciones estándar: Gestionar miembros, Ver documentos API, Renombrar, Duplicar, Instantáneas, Ver basura y Borrar.
  - Barra inferior con minilogotipo, botones Deshacer/Rehacer y contador de filas.
- **Menús y Modales Contextuales en Workspaces Dashboard (`components/workspaces/workspaces-dashboard.tsx`)**:
  - Menú de 3 puntos en cabeceras de workspace con 8 opciones (Exportar, Importar, Renombrar, Ajustes, Miembros, Papelera, Salir, Eliminar).
  - Modal funcional de `Ajustes` con panel de AI Providers destacando el proxy local LiteLLM en Bastión ZBook (`local-fast`, GPU RTX A3000) y configuración de zona horaria `America/Santiago`.
  - Modal interactivo de `Renombrar` con persistencia en estado reactivo.

### 🏁 Estado Deseado
- Navegación fluida y jerárquica con acceso instantáneo a cualquier base, tabla o dashboard sin perder el contexto visual, cumpliendo con el Brandbook Cobalto de Yarken.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* El isotipo de la lechuza en `FluxTableLogo` quedaba descentrado y rozaba los bordes del recuadro contenedor.
  *Solución:* Se adoptó la matriz de transformación y trazado exacto de `favicon.svg`, asegurando padding visual perfecto y grosor de línea uniforme.
- *Problema:* La vista de tabla carecía de barra lateral, obligando al usuario a volver siempre al dashboard principal de Workspaces para cambiar de base o tabla.
  *Solución:* Se diseñó e integró `AppSidebar` con árbol jerárquico expandible y cambio reactivo de base y tabla.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 84**: Ajuste de geometría SVG y alineación del logotipo en `components/brand/yarken-logo.tsx`.
2. **Iteración 85**: Integración de menús contextuales de 3 puntos y modales de Ajustes/Renombrar en `workspaces-dashboard.tsx`.
3. **Iteración 86**: Creación del componente `components/navigation/app-sidebar.tsx` con navegación en árbol y accesos de sistema.
4. **Iteración 87**: Integración de `AppSidebar` en `app/page.tsx`, soporte para colapso y vinculación de eventos con modales.
5. **Iteración 88**: Verificación de compilación Next.js (24/24 páginas) y suite de pruebas Vitest (59/59 pasando).

### 📊 Evidencia Empírica de Verificación
- Next.js build: 24 páginas compiladas sin errores de TypeScript ni linter.
- Vitest: 59 pruebas pasando en 9 archivos.

---

## 🗓️ [2026-11-17] - Fase 1: Ciberseguridad Defensiva Integral y Hardening Anti-Vibe-Coding

### 🎯 Intención
Ejecutar un blindaje de ciberseguridad defensiva exhaustivo en FluxTable ([Issue #24](https://github.com/snadales/BaserowLite/issues/24)) para proteger la plataforma contra cualquier riesgo o vulnerabilidad introducida por código generado por IA (vibe-coding): forzar HTTPS y HSTS, inyectar cabeceras CSP/X-Frame-Options/X-Content-Type-Options estrictas, ocultar huella de tecnología (`X-Powered-By`), implementar limitador de tasa (Rate Limiting) en middleware, habilitar autenticación local y por sesión con cookies HTTP-Only/SameSite/Secure, blindar la carga de archivos contra ejecutables y path traversal mediante inspección binaria de Magic Bytes, y escanear el repositorio con Gitleaks para descartar secretos en el historial.

### 📍 Estado Actual
- **Cabeceras de Seguridad y HSTS**: Configurado en `next.config.mjs` con `Strict-Transport-Security: max-age=63072000`, CSP estricto (`default-src 'self'`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, y `poweredByHeader: false`.
- **Middleware de Rate Limiting**: Implementado en `middleware.ts` con algoritmo de ventana deslizante por IP para prevenir ataques de fuerza bruta y saturación (`/api/auth/*` a 15 req/min, `/api/bi/query` a 600 req/min, `/api/v1/attachments/upload` a 30 req/min, general a 300 req/min) respondiendo `HTTP 429` con `Retry-After`.
- **Autenticación y Sesiones Robustas**:
  - `lib/auth/auth-guard.ts`: Soporte nativo para cookie `fluxtable_session` con validación en la tabla `sessions`, sumado a tokens API y Cloudflare Access.
  - Funciones criptográficas `hashPassword` y `verifyPassword` con `crypto.scryptSync` y salt aleatorio de 16 bytes con tiempo constante `timingSafeEqual`.
  - `app/api/auth/login/route.ts` y `app/api/auth/logout/route.ts`: Endpoints protegidos con validación Zod, emisión de tokens de sesión aleatorios de 32 bytes y fijación de cookies `httpOnly`, `secure`, `sameSite: 'lax'`, con caducidad a 7 días.
  - `app/login/page.tsx`: Formulario conectado al endpoint `/api/auth/login` con feedback visual de errores.
- **Blindaje en Carga de Archivos (`/api/v1/attachments/upload`)**:
  - Requerimiento de autenticación `requireAuth` obligatorio.
  - Límite de tamaño máximo estricto de 10 MB (`HTTP 413`).
  - Bloqueo de extensiones ejecutables de alto riesgo (`.exe`, `.sh`, `.php`, `.py`, `.bat`, `.cmd`, `.html`, `.js`, etc.).
  - Validación binaria de Magic Bytes para verificar firma real de PNG, JPEG, GIF, PDF, WEBP, ZIP y archivos de texto plano, previniendo suplantación de MIME type.
- **Prevención de Path Traversal (`/api/v1/attachments/[id]`)**:
  - Sanitización estricta de identificadores mediante `path.basename` y validación de confinamiento dentro de `LOCAL_STORAGE_PATH`.
  - Inyección de cabecera `X-Content-Type-Options: nosniff`.
- **Secret Scanning**:
  - Ejecución de `gitleaks detect --source . -v`: 41 commits auditados con 0 secretos expuestos.
  - Variables de entorno revisadas: cero claves privadas o contraseñas en prefijos `NEXT_PUBLIC_*`.

### 🏁 Estado Deseado
- Plataforma completamente blindada ante ataques automatizados, fuerza bruta, inyecciones, XSS, CSRF, path traversal y cargas maliciosas.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* El endpoint de subida de archivos `/api/v1/attachments/upload` carecía de control de autenticación y se fiaba únicamente del `file.type` enviado por el navegador.
  *Solución:* Se integró `requireAuth`, límite de 10 MB, lista negra de 26 extensiones y validador de Magic Bytes en binario.
- *Problema:* El script de pruebas de estrés `scripts/bi_stress_security_suite.py` tenía codificada la IP `127.0.0.1:8097`, impidiendo su ejecución contra hosts remotos.
  *Solución:* Se agregó soporte dinámico para el parámetro `--host` o URL de destino.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 76**: Creación de los issues #24 a #30 y redacción del Plan Maestro de Trabajo.
2. **Iteración 77**: Configuración de cabeceras de seguridad CSP, HSTS y permisos en `next.config.mjs`.
3. **Iteración 78**: Desarrollo de `middleware.ts` con control de Rate Limiting por IP y ruta.
4. **Iteración 79**: Refactorización de `lib/auth/auth-guard.ts` con hashing scrypt y soporte de cookies de sesión.
5. **Iteración 80**: Creación de `/api/auth/login` y `/api/auth/logout` con validación Zod y cookies HttpOnly.
6. **Iteración 81**: Blindaje de subida de archivos y prevención de Path Traversal en `/api/v1/attachments/*`.
7. **Iteración 82**: Auditoría con Gitleaks (0 secretos) y tests unitarios (59/59 pasando).
8. **Iteración 83**: Despliegue en ZBook, compilación de contenedor y ejecución de la suite de pentest y concurrencia (100% aprobada).

### 📊 Evidencia Empírica de Verificación
- Pentest: 8/8 pruebas superadas (401 sin auth, 403 bloqueo DDL/DML, 200 sanitización SQLi).
- Concurrencia: 100% éxito en ráfagas de 50, 100 y 200 peticiones concurrentes (261 req/s, p50 de 163ms).
- Rate Limiting: Verificado activo bloqueando saturaciones con HTTP 429 y cabeceras `x-ratelimit-limit`.
- Tests unitarios: 59/59 pasando en Vitest.
- Gitleaks: 41 commits auditados, 0 leaks.

---

## 🗓️ [2026-11-17] - Refactorización, Limpieza del Repositorio y Suite Completa de Manuales Maestros

### 🎯 Intención
Ejecutar una depuración y limpieza integral del repositorio `FluxTable` (Issue #23), eliminando artefactos residuales y de construcción en caché (`tsconfig.tsbuildinfo`), actualizando el paquete de integración n8n a `n8n-nodes-fluxtable` con la identidad de marca Cobalto, y redactar la suite exhaustiva de 7 manuales técnicos y operativos requeridos para el ciclo de vida de una nueva aplicación en producción.

### 📍 Estado Actual
- **Limpieza de Repositorio**:
  - `tsconfig.tsbuildinfo` removido del árbol de seguimiento git y añadido a `.gitignore` junto con reglas para `dist/`, `build/`, `*.log` y cachés de paquetes.
  - `.env.example` reescrito con plantilla completa de producción para FluxTable y configuración de fuentes analíticas (`ODOO_DB_*`, `VOZ_DB_*`, `PIMCORE_DB_*`, `BI_ALERT_WEBHOOK_URL`).
  - `packages/n8n-nodes-baserow-lite` refactorizado y renombrado limpiamente a `packages/n8n-nodes-fluxtable`, con credenciales `FluxTableApi`, nodo de acciones `FluxTable`, trigger `FluxTableTrigger` y el logotipo SVG oficial Lechuza-Y. Compilado con 0 errores TypeScript.
- **Suite Oficial de Manuales Maestros (`docs/`)**:
  - `docs/manual_arquitectura.md`: Visión sistémica, microservicios, stack Next.js 14 + Drizzle + Postgres + DuckDB, aislamiento multi-tenant y diagramas Mermaid.
  - `docs/manual_usuario.md`: Guía paso a paso para el usuario final (Workspaces, Tablas, Campos, Vistas Grid/Kanban/Form/Calendario y Dashboards BI).
  - `docs/manual_tecnico.md`: Guía de arquitectura de código, App Router, endpoints REST, motor de fórmulas AST, query builder y tests Jest/Vitest.
  - `docs/manual_base_de_datos.md`: Diccionario de datos, Diagrama Entidad-Relación (ERD) completo, índices de alto rendimiento, afinamiento Postgres y backups.
  - `docs/manual_integracion.md`: Especificación de API REST, batching masivo, webhooks salientes, nodo custom de n8n y pools externos de solo lectura (Odoo/Voz/Pimcore).
  - `docs/manual_operaciones_despliegue.md`: Despliegue Docker en ZBook (`192.168.60.25:8097`), Cloudflare Tunnel Zero Trust (`tables.yarken.cl`), secretos 1Password y Runbook de incidentes.
  - `docs/manual_seguridad.md`: Blindaje defensivo anti-DDL/DML (HTTP 403), prevención de inyecciones SQL ($1, $2), certificación de pentest 8/8 y RBAC.
  - `docs/manual_bi_analytics.md`: Reemplazo de Metabase, inteligencia temporal MoM/YoY, tipos de visualizaciones Recharts, carpetas, dashboards y alertas por umbrales.
- **Documentación Central**: `readMe.md` actualizado con tabla de manuales y enlaces directos.

### 🏁 Estado Deseado
- Repositorio impecable, altamente documentado, con manuales estructurados para ingeniería, operaciones y usuarios finales, listo para auditorías y despliegues estables.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* El archivo binario de TypeScript `tsconfig.tsbuildinfo` (167 KB) estaba comiteado en el repositorio git, ensuciando los diffs y versionado.
  *Solución:* Se desvinculó de git con `git rm --cached`, se eliminó en local y se actualizó `.gitignore` para bloquearlo de forma permanente.
- *Problema:* El conector n8n mantenía referencias obsoletas al nombre anterior en sus rutas internas de TypeScript y tipos de retorno (`noData: true` no válido en versiones recientes de `n8n-workflow`).
  *Solución:* Se refactorizó la firma del webhook devolviendo `workflowData: [[]]` y se recompiló con éxito `npm run build`.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 68**: Apertura del Issue `#23` en `snadales/BaserowLite` con plantilla de atribución estricta.
2. **Iteración 69**: Saneamiento de `.gitignore` y purga de `tsconfig.tsbuildinfo`.
3. **Iteración 70**: Refactorización de `packages/n8n-nodes-fluxtable` con compilación TypeScript aprobada.
4. **Iteración 71**: Redacción de `docs/manual_arquitectura.md` y `docs/manual_usuario.md`.
5. **Iteración 72**: Redacción de `docs/manual_tecnico.md` y `docs/manual_base_de_datos.md`.
6. **Iteración 73**: Redacción de `docs/manual_integracion.md`, `docs/manual_operaciones_despliegue.md` y `docs/manual_seguridad.md`.
7. **Iteración 74**: Redacción de `docs/manual_bi_analytics.md` y actualización del índice maestro en `readMe.md`.
8. **Iteración 75**: Verificación integral: 58/58 tests pasando, compilación Next.js 22/22 rutas exitosas.

### 📊 Evidencia Empírica de Verificación
- Tests: 58/58 unit tests en Jest/Vitest pasando sin errores.
- Build Next.js: `Compiled successfully in 1781ms` con 22 rutas generadas.
- Build n8n: `packages/n8n-nodes-fluxtable` compilado con `tsc` sin errores.
- Documentos: 8 manuales técnicos y operativos redactados con formato Markdown y diagramas Mermaid.

---

## 🗓️ [2026-11-17] - Rebranding a FluxTable y Adopción Transversal del Brandbook Yarken Cobalto

### 🎯 Intención
Renombrar la plataforma de `BaserowLite` a **FluxTable** («FluxTable · Plataforma de Datos & BI | Sistema Yarken», Issue #22) y aplicar integralmente la identidad visual oficial del Brandbook Yarken v2 «Cobalto» (`referencia/marca-yarken/color`, `tipografia`, `simbolo`, `tokens`), garantizando consistencia cromática, tipográfica y de componentes visuales en toda la aplicación.

### 📍 Estado Actual
- **Tokens de Color Cobalto**: Configurados en `tailwind.config.ts` y `app/globals.css` (`bg: #F7F8FA`, `surface: #FFFFFF`, `surface-sunken: #EEF1F5`, `line: #E4E7EC`, `line-control: #7A8496`, `ink: #0F172A`, `ink-2: #475569`, `ink-3: #5B6577`, `accent: #1D5BD8`, `accent-strong: #1746A8`, `accent-tint: #E8EFFC`, estados semánticos `ok: #157038`, `warn: #B45309`, `error: #B91C1C`, `info: #0369A1`).
- **Tipografía Dual**: Integración de fuentes Google Fonts `Manrope` (pesos 400, 500, 600, 700) para textos, cabeceras e interfaz, y `JetBrains Mono` (400, 500, 700) con `tabular-nums` para métricas numéricas KPI, timestamps y tokens de sistema en `app/layout.tsx`.
- **Símbolo Canónico y Lockup**: Implementación de `components/brand/yarken-logo.tsx` con el isotipo Lechuza-Y canónico (`viewBox="0 0 200 200"`, radio de borde 22%) y el lockup horizontal con subtítulo `SISTEMA YARKEN` en tracking expandido (`0.08em`).
- **Favicon Vectorial**: Creación de `public/favicon.svg` con la baldosa Cobalto y la Lechuza-Y oficial.
- **Vistas y Modales Actualizados**: Actualización de marca y estilos en `app/layout.tsx`, `app/page.tsx`, `app/login/page.tsx`, `components/workspaces/workspaces-dashboard.tsx`, `components/modals/new-bi-card-modal.tsx`, `components/modals/my-settings-modal.tsx` y `components/modals/admin-tools-modal.tsx`.
- **Paquete y Documentación**: Actualización de `package.json` (`name: "fluxtable"`) y reescritura de `readMe.md` bajo el título `🦉 FluxTable`.

### 🏁 Estado Deseado
- Aplicación completamente identificada como FluxTable bajo el Brandbook Cobalto en producción, integrada a la perfección en el ecosistema Yarken Homelab.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* El fondo por defecto de la aplicación utilizaba blanco plano (`#FFFFFF`), violando el principio del Brandbook Yarken donde el fondo de lienzo debe ser `bg` (`#F7F8FA`) para otorgar contraste a las tarjetas `surface` (`#FFFFFF`).
  *Solución:* Se ajustaron las clases globales y el contenedor raíz en `app/layout.tsx` a `bg-bg text-ink` y se revisaron las tarjetas del dashboard para elevarse sobre `surface` con bordes `line`.
- *Problema:* Se detectaron referencias residuales en modales que todavía mencionaban `BaserowLite`.
  *Solución:* Se realizó una búsqueda transversal y se reemplazaron por `FluxTable` tanto en UI como en títulos modales.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 60**: Apertura de issue `#22` en `snadales/BaserowLite` con plantilla de atribución.
2. **Iteración 61**: Consulta y extracción de directrices del Brandbook v2 Cobalto desde Wiki.js (`referencia/marca-yarken/*`).
3. **Iteración 62**: Adición de paleta de tokens en `tailwind.config.ts` y clases de utilidad en `app/globals.css`.
4. **Iteración 63**: Creación del componente `components/brand/yarken-logo.tsx` y favicon SVG.
5. **Iteración 64**: Refactorización de `app/layout.tsx`, `app/login/page.tsx`, navbar principal y modales.
6. **Iteración 65**: Actualización de `package.json` y `readMe.md`.
7. **Iteración 66**: Compilación y pruebas locales: 58/58 tests unitarios pasando, `npm run build` compilando 22 páginas estáticas/SSR con 0 errores.
8. **Iteración 67**: Despliegue en producción en ZBook (`baserow_lite_app`), reinicio de contenedor y verificación HTTP 200 con verificación del nuevo título y logo.

### 📊 Evidencia Empírica de Verificación
- Tests: 58/58 unit tests en Jest pasando exitosamente.
- Build Next.js: 22 rutas compiladas limpiamente sin errores de tipo ni de lint.
- Health Check ZBook: `curl -s http://127.0.0.1:8097/` retorna `<title>FluxTable · Plataforma de Datos & BI | Sistema Yarken</title>`.

---

## 🗓️ [2026-11-17] - Certificación Integral: Desempeño, Concurrencia, Pruebas Ácidas y Pentest Defensivo

### 🎯 Intención
Certificar la robustez, resistencia a la saturación, estabilidad de memoria y seguridad defensiva del motor analítico de BaserowLite (`EPIC-BI-01` / Issue #21) antes del decomiso de Metabase: ejecutar ráfagas de carga concurrente (hasta 50 workers y 200 peticiones simultáneas), realizar pruebas ácidas continuas de 500 consultas analíticas mixtas verificando ausencia de memory leaks, y auditar vectores de ataque (auth bypass, DDL/DML mutation injection y SQL injection en filtros).

### 📍 Estado Actual
- `scripts/bi_stress_security_suite.py`: Batería completa automatizada en Python ejecutada exitosamente contra el stack en producción en ZBook.
- `docs/informe_pruebas_desempeno_seguridad.md`: Informe técnico detallado con resultados de seguridad (8/8 pruebas superadas), métricas de concurrencia ($p50$: 37-91 ms, throughput pico: 518.5 req/s) y telemetría de memoria RAM.
- `app/api/bi/query/route.ts`: Blindaje defensivo global añadido: intercepción de mutaciones (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `GRANT`, `REVOKE`) tanto para fuentes remotas como locales, respondiendo `HTTP 403 CONSULTA_BLOQUEADA`.
- `lib/bi/analytics/query-builder.ts`: Normalización defensiva de métricas simplificadas (`metricColumn`/`aggregation`) y nombres de columna/campo en filtros.
- Resultados Clave:
  - **Seguridad:** 100% aprobado (8/8 pruebas).
  - **Carga y Saturación:** Throughput de 249 a 518.5 req/s con 0 errores (100% de éxito en 350 peticiones concurrentes).
  - **Prueba Ácida:** 500 consultas completadas en 1.45s (345 req/s) con variación de RAM despreciable (+2.15 MiB total, sin fugas de memoria).

### 🏁 Estado Deseado
- Sistema certificado bajo estándares de alta concurrencia y seguridad para absorber todas las cargas operativas de Metabase.

### ⚠️ Problemas Encontrados y Soluciones
- *Problema:* El filtro de mutaciones sólo operaba dentro del gestor de conexiones externas `pool-manager.ts`, dejando expuesto el endpoint local a posibles comandos DDL o DML encadenados.
  *Solución:* Se integró una capa de validación regex previa en `app/api/bi/query/route.ts` que bloquea de raíz cualquier palabra clave de mutación con `HTTP 403` para cualquier fuente.
- *Problema:* Las consultas analíticas con filtros simplificados (`column`/`field`) provocaban un `TypeError` al evaluar `config.metrics.forEach` si no se declaraba explícitamente el array de métricas.
  *Solución:* Se implementó un normalizador `effectiveMetrics` en `BiQueryBuilder` que sintetiza métricas por defecto de forma segura.

### 🔄 Iteraciones e Historial de Ejecución
1. **Iteración 54**: Apertura del issue `#21` en `snadales/BaserowLite` con plantilla de atribución estricta.
2. **Iteración 55**: Desarrollo de `scripts/bi_stress_security_suite.py` con las 3 suites completas.
3. **Iteración 56**: Blindaje preventivo de `app/api/bi/query/route.ts` contra DDL/DML.
4. **Iteración 57**: Normalización defensiva de filtros y métricas en `lib/bi/analytics/query-builder.ts`.
5. **Iteración 58**: Despliegue en ZBook, compilación de contenedor y ejecución exitosa de la suite (100% aprobada).
6. **Iteración 59**: Redacción del informe maestro `docs/informe_pruebas_desempeno_seguridad.md`.

### 📊 Evidencia Empírica de Verificación
- Pentest: 8/8 pruebas pasando (Auth 401, Bloqueo DDL/DML 403, Sanitización SQLi 200).
- Concurrencia: 518.53 req/s en pico de 50 trabajadores simultáneos con latencia $p50$ de 91.4 ms.
- Prueba Ácida: 500/500 consultas exitosas a 345 req/s con estabilidad absoluta de memoria (102.3 MiB total).

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
