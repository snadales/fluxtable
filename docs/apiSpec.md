# 🌐 Especificación de la API REST Dinámica y OpenAPI

Este documento define la interfaz de programación REST de **BaserowLite**, permitiendo la integración de scripts, n8n, Odoo o agentes mediante tokens con control de acceso por roles.

---

## 1. Autenticación y Cabeceras

Todas las llamadas a la API requieren una cabecera de autorización Bearer:

```http
Authorization: Bearer br_live_abc123...
Content-Type: application/json
```

- Los tokens se generan desde la interfaz web con prefijo `br_live_` y se almacenan hasheados en PostgreSQL con algoritmo `sha256`.
- Scopes soportados: `records:read`, `records:write`, `schema:read`, `admin`.

---

## 2. Endpoints de Datos (CRUD Dinámico de Registros)

### 2.1. Listar Registros con Filtros y Paginación
```http
GET /api/v1/workspaces/{workspaceId}/tables/{tableId}/records?page=1&limit=50&filter[fld_estado]=aprobado&sort=-fld_fecha
```

**Respuesta (`200 OK`):**
```json
{
  "total": 124,
  "page": 1,
  "limit": 50,
  "totalPages": 3,
  "records": [
    {
      "id": "e4b6d05f-7c1a-4c2d-8e6f-9a1b2c3d4e5f",
      "version": 3,
      "order": 1,
      "createdAt": "2026-11-16T12:00:00Z",
      "updatedAt": "2026-11-16T15:30:00Z",
      "data": {
        "fld_sku": "PRD-001",
        "fld_precio": 190000,
        "fld_estado": "opt_aprobado",
        "fld_activo": true
      },
      "relations": {
        "fld_proveedor": [
          { "id": "rec_999", "displayValue": "Navarino Corp" }
        ]
      },
      "attachments": {
        "fld_foto": [
          { "id": "att_111", "filename": "ficha.pdf", "url": "/api/v1/attachments/att_111" }
        ]
      }
    }
  ]
}
```

---

### 2.2. Crear Registro
```http
POST /api/v1/workspaces/{workspaceId}/tables/{tableId}/records
```

**Cuerpo (`application/json`):**
```json
{
  "data": {
    "fld_sku": "PRD-002",
    "fld_precio": 250000,
    "fld_estado": "opt_pendiente",
    "fld_activo": true
  }
}
```

**Respuesta (`201 Created`):**
Retorna el registro completo creado con `id`, `version: 1`, y timestamps.

---

### 2.3. Actualizar Registro (Concurrencia Optimista)
```http
PATCH /api/v1/workspaces/{workspaceId}/tables/{tableId}/records/{recordId}
```

**Cuerpo (`application/json`):**
```json
{
  "version": 3,
  "data": {
    "fld_precio": 240000
  }
}
```

**Respuestas:**
- `200 OK`: Modificación exitosa, devuelve registro con `version: 4`.
- `409 Conflict`: Si la versión en BD es mayor a la enviada.
  ```json
  {
    "error": "VERSION_CONFLICT",
    "message": "El registro fue modificado por otro proceso.",
    "currentVersion": 4
  }
  ```

---

### 2.4. Eliminar Registro (Soft Delete / Papelera)
```http
DELETE /api/v1/workspaces/{workspaceId}/tables/{tableId}/records/{recordId}
```
**Respuesta:** `204 No Content`. El registro se marca con `deleted_at: NOW()` y es visible en la papelera durante 30 días.

---

## 3. Endpoints de Papelera y Restauración

- `GET /api/v1/workspaces/{workspaceId}/trash`: Lista registros, tablas y campos eliminados.
- `POST /api/v1/workspaces/{workspaceId}/trash/{recordId}/restore`: Restaura el elemento a su tabla original.

---

## 4. Importación y Exportación CSV

- `POST /api/v1/workspaces/{workspaceId}/tables/{tableId}/import-csv`: Carga archivo `multipart/form-data`, infiere automáticamente tipos de datos (número, fecha, texto) o permite mapear encabezados contra campos existentes.
- `GET /api/v1/workspaces/{workspaceId}/tables/{tableId}/export-csv`: Genera stream de descarga CSV con delimitador configurable (coma o punto y coma para Excel es-CL) y nombres legibles de columnas.
