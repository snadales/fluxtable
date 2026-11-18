# 🛠️ FluxTable - Manual Técnico y Guía del Desarrollador

> **Plataforma de Datos & Business Intelligence | Sistema Yarken**  
> *Versión 2.0 (Edición Cobalto) - Fecha: 2026-11-17*  
> *Repositorio: `https://github.com/snadales/BaserowLite.git` (Rama `main`)*

---

## 1. Stack Tecnológico

FluxTable está construido bajo un enfoque moderno full-stack en TypeScript sobre el runtime de Node.js, optimizado para mínima latencia y bajo consumo de memoria:

| Capa | Tecnología | Versión | Propósito |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `15.5.x` | Renderizado SSR, Server Components, API Routes |
| **Lenguaje** | TypeScript | `5.6.x` | Tipado estático estricto en frontend, backend y ORM |
| **Estilos** | Tailwind CSS | `3.4.x` | Utilidades de diseño, tokens del Brandbook Cobalto |
| **Base de Datos** | PostgreSQL Alpine | `16.x` | Persistencia relacional, soporte JSONB y transacciones |
| **ORM** | Drizzle ORM + Kit | `0.33.x` | Mapeo tipado, migraciones reproducibles y queries SQL |
| **Motor Analítico** | BI Engine + QueryBuilder | `1.0.x` | Agregaciones complejas, time intelligence y percentiles |
| **Visualización** | Recharts + Lucide Icons | `2.12.x` | Gráficos vectoriales SVG y suite de iconografía |
| **Testing** | Vitest + TypeScript | `2.1.x` | 64 unit tests y suites de pruebas de estrés y pentest |

---

## 2. Estructura del Código Fuente

```
07_BaserowLite/
├── app/                              # Next.js 15 App Router
│   ├── api/                          # Endpoints REST del backend
│   │   ├── admin/                    # Herramientas administrativas y métricas
│   │   ├── auth/                     # Autenticación y sesiones
│   │   ├── bi/                       # Motor analítico (/query, /dashboards, /cards, /folders)
│   │   ├── business/                 # Catálogo estructurado de activos (/catalog)
│   │   ├── database/                 # Tablas, campos, filas, bases, webhooks, snapshots
│   │   ├── health/                   # Endpoint de telemetría y health check
│   │   └── v1/                       # APIs públicas de attachments, audit-logs, calendar ical
│   ├── login/                        # Pantalla de inicio de sesión Cobalto
│   ├── globals.css                   # Variables CSS y estilos base del Brandbook
│   ├── layout.tsx                    # Root Layout con fuentes Manrope y JetBrains Mono
│   └── page.tsx                      # Vista principal (Arquitectura Single-Shell)
├── components/                       # Componentes React reutilizables
│   ├── assets/                       # Catálogo de Activos de Negocio (AssetCatalogView)
│   ├── audit/                        # Auditoría forense en drawer lateral (AuditLogDrawer)
│   ├── bi/                           # Componentes analíticos (BiAnalyticsPage, BiCardRenderer)
│   ├── brand/                        # Logotipo Yarken Lechuza-Y y lockup oficial
│   ├── calendar/                     # Vista de calendario con sincronización iCal
│   ├── comments/                     # Comentarios contextuales polimórficos
│   ├── grid/                         # DataGrid virtualizado, filtros, orden y columnas
│   ├── modals/                       # KpiRecipeModal, NewFolderModal, NewModuleModal, etc.
│   ├── navigation/                   # AppSidebar persistente y DocumentTabBar multi-pestaña
│   ├── ui/                           # Badges, ProgressBar, Rating
│   └── workspaces/                   # WorkspacesDashboard (Grid de módulos agrupados por área)
├── db/                               # Capa de Base de Datos y ORM
│   ├── index.ts                      # Instancia del cliente PostgreSQL con Drizzle
│   ├── schema.ts                     # Definición de tablas y relaciones tipadas
│   ├── seed.ts                       # Sembrado de datos de demostración
│   └── migrations/                   # Archivos SQL de migración versionados
├── lib/                              # Lógica de negocio del servidor y utilidades
│   ├── audit/                        # Trazabilidad y actor lineage
│   ├── auth/                         # Guard de autenticación y RBAC
│   ├── bi/                           # Query builder, pool manager, threshold checker
│   ├── formula/                      # Evaluador AST seguro (Formula-Lite)
│   └── storage/                      # Almacenamiento local de adjuntos
```
│   ├── auth.ts                       # Verificación de JWT, cookies de sesión y API tokens
│   ├── bi/                           # Motor analítico y conectores
│   │   ├── analytics/query-builder.ts# Generador de consultas SQL parametrizadas y filtros
│   │   └── analytics/pool-manager.ts # Gestor de conexiones externas (Odoo, Voz, Pimcore)
│   ├── formula-engine.ts             # Parser AST y evaluador seguro de fórmulas
│   └── utils.ts                      # Funciones auxiliares de formateo y validación
├── packages/                         # Monorepo de paquetes auxiliares
│   └── n8n-nodes-fluxtable/          # Nodo comunitario custom para automatización en n8n
├── public/                           # Assets estáticos y favicon.svg oficial
├── scripts/                          # Herramientas de despliegue, tests y benchmarking
│   ├── bi_stress_security_suite.py   # Suite de pruebas de estrés, saturación y pentest
│   ├── bi_parity_checker.py          # Verificador de paridad frente a Metabase
│   └── seed_workspaces.py            # Sembrador de datos iniciales
├── docker-compose.yml                # Definición de infraestructura en producción
├── Dockerfile                        # Imagen de producción multi-etapa
├── package.json                      # Manifiesto de dependencias npm
└── tailwind.config.ts                # Configuración de tokens y paleta Cobalto
```

---

## 3. Endpoints Principales de la API

Todos los endpoints requieren autenticación mediante cookie de sesión o encabezado `Authorization: Token <DATABASE_TOKEN>`:

### 3.1. Operaciones de Tablas y Filas (`/api/v1/database/*`)
- `GET /api/v1/database/tables/{tableId}/rows`: Retorna los registros de una tabla con soporte para paginación (`page`, `size`), ordenamiento (`sort`) y filtros (`filter`).
- `POST /api/v1/database/tables/{tableId}/rows`: Inserta un registro individual.
- `POST /api/v1/database/tables/{tableId}/rows/batch`: Inserción masiva de hasta 1,000 registros por llamada.
- `PATCH /api/v1/database/tables/{tableId}/rows/{rowId}`: Actualización parcial de campos de una fila.
- `DELETE /api/v1/database/tables/{tableId}/rows/{rowId}`: Eliminación física de una fila.

### 3.2. Motor de BI & Analytics (`/api/bi/*`)
- `POST /api/bi/query`: Ejecuta una consulta analítica agregada.
  - **Payload de Entrada**:
    ```json
    {
      "source": "local_baserow",
      "table": "table_gastos",
      "metrics": [
        { "field": "monto", "aggregation": "SUM", "alias": "total_gastos" }
      ],
      "groupBy": ["categoria"],
      "timeIntelligence": {
        "dateField": "fecha",
        "period": "month",
        "compareWith": "previous_period"
      },
      "filters": [
        { "field": "estado", "operator": "equals", "value": "Aprobado" }
      ]
    }
    ```
  - **Mecanismo de Seguridad**: La ruta pasa el query por un validador regex preventivo. Si se detectan palabras reservadas de modificación (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`), el servidor aborta la petición con `HTTP 403 CONSULTA_BLOQUEADA`.
- `GET /api/bi/dashboards`: Lista los cuadros de mando configurados con sus respectivas tarjetas asociadas.
- `POST /api/bi/cards`: Crea o actualiza una tarjeta analítica visual.

### 3.3. Monitoreo y Telemetría (`/api/health`)
- `GET /api/health`: Verifica el estado de la conexión a PostgreSQL local, latencia de base de datos y memoria utilizada por el proceso de Node.js.

---

## 4. Motor de Fórmulas (`lib/formula-engine.ts`)

El motor de fórmulas evalúa expresiones de usuario mediante tres fases deterministas:
1. **Tokenización (Lexer)**: Analiza el texto identificando literales numéricos, cadenas, operadores aritméticos/lógicos y referencias a campos `field('Nombre')`.
2. **Construcción del AST (Parser)**: Genera un árbol de sintaxis abstracta jerárquico según la precedencia matemática estándar.
3. **Evaluación (Evaluator)**: Recorre el árbol sustituyendo los valores de la fila actual y ejecutando las funciones de forma pura y aislada.

```typescript
// Ejemplo de llamada interna
import { evaluateFormula } from '@/lib/formula-engine';

const context = { precio: 1500, impuesto: 0.19, descuento: 100 };
const formula = "(field('precio') * (1 + field('impuesto'))) - field('descuento')";
const resultado = evaluateFormula(formula, context); // 1685
```

---

## 5. Estrategia y Ejecución de Pruebas

FluxTable dispone de dos capas de validación automatizada:

### 5.1. Pruebas Unitarias e Integración (TypeScript / Jest)
Ejecutan la verificación de modelos Drizzle, validación de esquemas, endpoints de API y lógica de fórmulas.
```bash
# Ejecución en el entorno local
npm test
# Salida esperada: 58 tests pasando exitosamente
```

### 5.2. Suite de Estrés, Concurrencia y Pentest (`scripts/bi_stress_security_suite.py`)
Script en Python 3 que valida la resistencia del servidor en ZBook:
1. **Suite 1: Pentest Defensivo**: Valida rechazo de peticiones anónimas (`401`), bloqueo de comandos DDL/DML (`403`) y resistencia contra inyecciones SQL en filtros (`200` sanitizado).
2. **Suite 2: Concurrencia**: Dispara hasta 50 hilos concurrentes generando 200 peticiones en ráfaga para medir latencia $p50$ y tasa de errores.
3. **Suite 3: Prueba Ácida**: Lanza ráfaga de 500 consultas aleatorias registrando la telemetría de memoria RAM antes y después.

```bash
# Ejecutar contra ZBook
python3 scripts/bi_stress_security_suite.py --host http://192.168.60.25:8097
```

---

## 6. Configuración de Entorno de Desarrollo Local

### Prerrequisitos
- Node.js 20 LTS o superior.
- Docker & Docker Compose (para PostgreSQL local).
- Clave de repositorio y acceso a 1Password Connect para secretos.

### Pasos de Instalación
```bash
# 1. Clonar el repositorio
git clone https://github.com/snadales/BaserowLite.git fluxtable
cd fluxtable

# 2. Instalar dependencias
npm install

# 3. Copiar archivo de entorno
cp .env.example .env.local

# 4. Iniciar base de datos local
docker compose up -d postgres

# 5. Aplicar migraciones
npm run db:push

# 6. Iniciar servidor de desarrollo
npm run dev
# Abrir http://localhost:3000
```
