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
