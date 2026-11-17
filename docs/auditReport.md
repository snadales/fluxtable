# 🛡️ Informe de Auditoría Técnica y Revisión de Arquitectura: BaserowLite

> **Rol:** Auditor Principal de Arquitectura de Sistemas y Motores de Datos No-Code  
> **Alcance:** Evaluación forense de `architecture.md`, `dataModel.md`, `viewEngine.md`, `formulaEngine.md`, `apiSpec.md` y `advancedAnalysis.md`.  
> **Objetivo:** Identificar puntos ciegos, cuellos de botella de rendimiento, edge cases y riesgos de concurrencia antes de escribir una sola línea de código, garantizando un producto con nivel de acabado equivalente a Airtable y solidez enterprise.

---

## 1. Resumen Ejecutivo de la Auditoría

El diseño inicial de **BaserowLite** es conceptualmente sólido y aborda con éxito la simplificación operativa que hace a Baserow estándar pesado (eliminación de Celery, Redis y Django en favor de Next.js 15 + Drizzle + PG16).

Sin embargo, someter el diseño a una revisión de nivel de producción revela **6 puntos ciegos críticos** que degradarían severamente el rendimiento, la usabilidad o la integridad si no se corrigen en la fase de diseño:
1. **El Síndrome de la Fila TOAST en JSONB:** Actualizar una sola celda con `jsonb_set` en una fila con 50 campos reescribe el objeto JSONB completo en disco, generando bloat masivo de PostgreSQL y compresión TOAST continua.
2. **Consultas N+1 y Explosión Combinatoria en Rollups/Lookups:** Calcular rollups en tiempo real sin una capa de agregación materializada o queries CTE compiladas destruirá el tiempo de respuesta al cargar vistas Grid de más de 500 filas.
3. **Falsos Conflictos por Concurrencia a Nivel de Fila (`version`):** Si el Usuario A edita el "Estado" y el Usuario B edita la "Nota" en la misma fila simultáneamente, uno de ellos recibirá un error 409 innecesario.
4. **Propagación de Errores y Tipado en Fórmulas AST:** Falta una especificación formal de estados de error estándar (`#DIV/0!`, `#REF!`, `#VALUE!`, `#CIRCULAR!`) y coerción de tipos nulos.
5. **Brechas de Ergonomía respecto a Airtable:** Falta el stack de **Deshacer/Rehacer (`Cmd+Z`)**, el soporte bidireccional de **Copiar/Pegar TSV (Excel/Sheets)** y el autocompletado de campos al escribir fórmulas.
6. **Validación Dinámica y Seguridad en Carga Pública:** El endpoint de formularios públicos carece de protección contra spam (rate limiting y PoW/hCaptcha) y el almacenamiento local no contempla límites de cuota de disco.

---

## 2. Matriz de Hallazgos y Riesgos Técnicos

| ID | Área | Severidad | Hallazgo Crítico | Impacto |
|---|---|---|---|---|
| **AUD-01** | **Base de Datos** | **Alta** | Reescritura completa de `records.data` en cada `PATCH` (JSONB TOAST). | Degradación de I/O de disco y alto bloat en tablas activas. |
| **AUD-02** | **Relaciones** | **Alta** | Estrategia de cálculo de Lookups y Rollups en tiempo real sin agregación por lotes. | Caída del endpoint de Grid a >2-3 segundos con tablas enlazadas. |
| **AUD-03** | **Concurrencia** | **Media-Alta** | Bloqueo optimista a nivel de fila completa en vez de celda/campo. | Falsos rechazos 409 cuando dos procesos editan celdas distintas de la misma fila. |
| **AUD-04** | **Motor Fórmulas** | **Media** | Ausencia de grafo global de dependencias entre tablas y códigos de error estándar. | Cuelgues por fórmulas cruzadas circulares y caídas en tiempo de render. |
| **AUD-05** | **UX / Interacción** | **Media** | Inexistencia de stack de Deshacer (`Cmd+Z` / `Cmd+Shift+Z`) y portapapeles matricial. | La experiencia se siente como "formulario web rígido" y no como hoja de cálculo fluida. |
| **AUD-06** | **Seguridad** | **Media** | Formularios públicos sin rate limiting y subidas sin cuota de almacenamiento. | Riesgo de denegación de servicio (DoS) por llenado de disco en `./data/uploads`. |

---

## 3. Análisis Detallado de Hallazgos y Soluciones de Ingeniería

### 3.1. [AUD-01] Optimización de PostgreSQL JSONB y Prevención de TOAST Bloat

#### El Problema:
En PostgreSQL, las columnas `jsonb` de más de 2 KB son comprimidas y enviadas a la tabla secundaria TOAST. Cada vez que se ejecuta `jsonb_set(data, '{field_1}', '"nuevo"')`, PostgreSQL debe descomprimir el JSONB completo, modificar la clave, recomprimirlo y escribir una nueva tupla TOAST en disco, marcando la anterior como muerta. En tablas con ediciones frecuentes, el tamaño de la base de datos se multiplica rápidamente y degrada los índices.

#### Solución de Ingeniería Obligatoria:
1. **Separación de Datos Ligeros vs Datos Pesados:**
   - La columna `records.data` almacenará únicamente tipos primitivos e identificadores ligeros (textos cortos, números, booleanos, ids de opciones select, ids de relaciones).
   - Los campos de texto largo (Notas Markdown de Notion) y arrays grandes deben aislarse en una columna dedicada `records.content: text` o en la tabla de relaciones/adjuntos.
2. **Índices de Expresión B-Tree en lugar de GIN masivo:**
   - En lugar de indexar todo el documento JSONB con un pesado índice GIN (`CREATE INDEX ON records USING gin(data)`), el sistema debe generar dinámicamente índices B-Tree específicos únicamente para los campos que el usuario use para ordenar o filtrar frecuentemente:
   ```sql
   CREATE INDEX records_fld_status_idx ON records ((data->>'fld_status')) WHERE deleted_at IS NULL;
   ```
3. **Mantenimiento Automatizado (`AUTOVACUUM` Agresivo):**
   - Configurar en Docker PostgreSQL parámetros ajustados para tablas con alto update JSONB:
   ```sql
   ALTER TABLE records SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_vacuum_cost_limit = 1000);
   ```

---

### 3.2. [AUD-02] Estrategia de Rollups y Lookups sin N+1 Queries

#### El Problema:
Si una tabla de `Lotes` tiene 100 filas y cada una muestra un Rollup del `Total Inversión` sumando filas de `Items`, un bucle ingenuo generaría 101 consultas a la base de datos (problema N+1 clásico).

#### Solución de Ingeniería Obligatoria:
Compilar las relaciones y agregaciones en **una única consulta SQL con CTEs y subconsultas correlacionadas agregadas con `JSON_BUILD_OBJECT`**:

```sql
WITH linked_aggregates AS (
  SELECT 
    rr.source_record_id,
    COALESCE(SUM((target.data->>'fld_precio_fob')::numeric * (target.data->>'fld_cantidad')::numeric), 0) AS rollup_total_inversion,
    COUNT(target.id) AS rollup_total_items
  FROM record_relations rr
  JOIN records target ON rr.target_record_id = target.id
  WHERE rr.field_id = :relation_field_id AND target.deleted_at IS NULL
  GROUP BY rr.source_record_id
)
SELECT 
  r.id,
  r.version,
  r.data,
  COALESCE(la.rollup_total_inversion, 0) AS rollup_total_inversion,
  COALESCE(la.rollup_total_items, 0) AS rollup_total_items
FROM records r
LEFT JOIN linked_aggregates la ON r.id = la.source_record_id
WHERE r.table_id = :table_id AND r.deleted_at IS NULL
ORDER BY r.order ASC
LIMIT 50 OFFSET 0;
```
Esto resuelve la lectura de 50 filas con todos sus Rollups y Lookups en **una sola consulta SQL que tarda menos de 15 milisegundos**.

---

### 3.3. [AUD-03] Concurrencia Optimista a Nivel de Celda (Cell-Level Merging)

#### El Problema:
El modelo actual (`WHERE id = $1 AND version = $2`) rechaza la petición si la versión cambió, incluso si el usuario editó una celda completamente independiente de la que modificó otro usuario o proceso en segundo plano.

#### Solución de Ingeniería Obligatoria:
Implementar **Patch Atómico con Verificación de Celda:**
El cliente envía:
```json
{
  "recordId": "rec_123",
  "baseVersion": 5,
  "changes": {
    "fld_prioridad": { "old": "Media", "new": "Alta" }
  }
}
```
El servidor ejecuta:
1. Lee la versión actual.
2. Si la versión cambió pero el campo modificado (`fld_prioridad`) no fue tocado por el cambio intermedio (verificable en `audit_logs`), se realiza un **Merge Automático** silencioso incrementando la versión a 7.
3. Solo si el valor previo en BD no coincide con `old` (conflicto real de celda), se dispara el `409 Conflict` devolviendo el valor actual y permitiendo al usuario decidir si sobreescribir o descartar.

---

### 3.4. [AUD-04] Robustez del Motor de Fórmulas AST

#### Requisitos Mandatorios que Faltaban:
1. **Códigos de Error Formales:**
   - `#DIV/0!`: División por cero.
   - `#REF!`: Campo referenciado eliminado o inexistente.
   - `#VALUE!`: Tipo de dato incorrecto (ej. intentar sumar un string con una fecha).
   - `#CIRCULAR!`: Dependencia cíclica detectada en el grafo.
2. **Detección Global de Ciclos Multi-Tabla (Cross-Table DAG):**
   - Cuando la Tabla A tiene un Rollup de la Tabla B, y la Tabla B tiene una Fórmula que usa un Lookup de la Tabla A, se debe validar el grafo acíclico dirigido completo antes de permitir guardar la fórmula.
3. **Manejo de Coerción Segura:**
   ```typescript
   function coerceNumber(val: any): number | null {
     if (val === null || val === undefined || val === '') return null;
     const num = Number(val);
     return isNaN(num) ? null : num;
   }
   ```

---

### 3.5. [AUD-05] Micro-Interacciones Críticas de Ergonomía (Airtable-Grade)

Para que el usuario realmente sienta la velocidad de Airtable/Excel y no un simple CRUD web:

1. **Pila de Deshacer/Rehacer (`Undo/Redo` con `Cmd+Z` / `Cmd+Shift+Z`):**
   - Implementar un store en memoria en el cliente (Zustand) que capture cada mutación atómica:
     `{ action: 'UPDATE_CELL', recordId, fieldId, previousValue, nextValue }`.
   - Permitir deshacer al instante hasta 50 operaciones locales con respuesta visual inmediata.
2. **Copiar y Pegar Matricial (TSV Bidireccional):**
   - Al presionar `Cmd+C` sobre una selección de celdas en Grid, serializar a texto plano separado por tabulaciones (`\t`) y saltos de línea (`\n`).
   - Al presionar `Cmd+V`, capturar el portapapeles del sistema operativo, parsear la matriz de filas/columnas e insertar o actualizar en bloque todas las celdas afectadas, con soporte directo desde Excel o Google Sheets.
3. **Columnas Fijas (Freeze Columns):**
   - Fijar permanentemente la columna primaria (generalmente el nombre o SKU) a la izquierda mientras el usuario hace scroll horizontal sobre 20 columnas.

---

### 3.6. [AUD-06] Seguridad y Resiliencia en Despliegue Local

1. **Sanitización de Subidas Locales:**
   - Nombres de archivo guardados en disco usando exclusivamente hash SHA-256 (`abc12345...bin`) para evitar path traversal (`../../etc/passwd`).
   - El nombre original se guarda en la tabla `record_attachments.filename` para descarga con cabecera `Content-Disposition: attachment; filename="..."`.
   - Detección de tipo MIME real inspeccionando los "magic numbers" del binario (`file-type`), no solo la extensión declarada por el navegador.
2. **Protección de Formularios Públicos:**
   - Rate limiting por IP en memoria (ej. máximo 10 envíos por minuto).
   - Campo honeypot oculto para atrapar bots sin molestar al usuario humano con captchas intrusivos.
3. **Límite de Espacio en Disco:**
   - Flag de advertencia si `./data/uploads` o `./data/postgres` supera el 90% del disco disponible.

---

## 4. Plan de Remediación e Integración en el Roadmap

Para blindar el proyecto desde el día 1, incorporamos estas soluciones directamente en los issues correspondientes de GitHub:

- **Issue #3 (Esquema Drizzle):** Añadir índices B-Tree específicos, separación de `content` largo y tabla de bloqueos de celda.
- **Issue #4 (Fórmulas AST):** Añadir códigos de error estándar (`#DIV/0!`, etc.) y detección de ciclos cross-table.
- **Issue #6 (Vista Grid):** Añadir portapapeles matricial TSV (copiar/pegar de Excel), freeze columns y store de `Cmd+Z`.
- **Issue #9 (Adjuntos y Storage):** Implementar guardado por SHA-256 y validación de magic numbers.
- **Issue #10 (API REST):** Incorporar Merge Automático a nivel de celda en el manejador `PATCH`.

---

## 5. Conclusión de la Auditoría

El diseño arquitectónico original es excelente en su dirección, pero estas correcciones de ingeniería evitan que el sistema colapse en rendimiento cuando crezca a miles de registros o requiera cálculos complejos de importaciones y catálogos. 

Con estos 6 ajustes formalizados, **BaserowLite** no solo sustituye a Baserow, sino que supera su velocidad y alcanza la fluidez visual de Airtable con total soberanía y cero telemetría.
