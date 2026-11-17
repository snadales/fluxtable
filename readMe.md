# 📌 BaserowLite

> Reemplazo personal, moderno y ligero para Baserow self-hosted, construido con **Next.js 15 (App Router)**, **TypeScript**, **PostgreSQL 16**, **Drizzle ORM** y **Docker Compose**.

---

## 🎯 Objetivo y Descripción

### Objetivo
Proporcionar una plataforma de base de datos relacional no-code de inicio rápido local con un único comando, con una huella de memoria mínima, sin intermediarios asíncronos pesados, enfocada en la gestión de colores, formatos numéricos/monetarios, vistas canónicas (Grid, Kanban, Formulario, Detalle) y API REST tokenizada.

### Descripción
BaserowLite implementa el modelo estructurado **Workspace ➔ Base ➔ Tabla ➔ Campo ➔ Registro ➔ Vista**:
- **Almacenamiento Híbrido:** Esquema relacional estricto gestionado con Drizzle ORM combinado con columnas JSONB tipadas para campos dinámicos sin penalización DDL.
- **Rico Soporte Visual:** Paleta semántica de 9 colores para etiquetas y estados, formato de moneda chilena (`$ 190.000`) e internacional, fechas y formateo condicional de filas/celdas.
- **Vistas Canónicas:** Grid virtualizado con edición en celda y teclado, Kanban interactivo con drag-and-drop, Formularios públicos de captura con validación Zod y Vista Detalle con historial de auditoría.
- **Motor de Fórmulas Ligeras (`formula-lite`):** Evaluador seguro con analizador sintáctico AST propio en TypeScript (sin `eval()`).
- **Seguridad e Integridad:** Concurrencia optimista basada en versiones (`version`), auditoría de cambios (`audit_logs`), papelera con restauración y API REST dinámica asegurada con tokens Bearer.

---

## 🗺️ Índice de Navegación y Documentación Técnica

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
- Node.js 20+ y pnpm / npm (para desarrollo local fuera de Docker).

### Puesta en Marcha Rápida (1 Solo Comando)
```bash
# 1. Acceder al proyecto
cd /Users/snadales/Dev/01_Homelab/07_BaserowLite

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Iniciar servicios en contenedores
docker compose up -d --build
```
La aplicación estará disponible en `http://localhost:3000`.

---

## 📦 Respaldo y Ubicación de Datos

Todos los datos se almacenan localmente en la carpeta raíz del proyecto:
- Base de datos: `./data/postgres/`
- Archivos adjuntos: `./data/uploads/`
- Respaldos automáticos: `./backups/`
