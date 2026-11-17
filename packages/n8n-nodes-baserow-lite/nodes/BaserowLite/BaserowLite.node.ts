import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IHttpRequestOptions,
  NodeConnectionTypes,
} from 'n8n-workflow';

export class BaserowLite implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'BaserowLite',
    name: 'baserowLite',
    icon: 'file:baserow.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Conector de alto rendimiento para BaserowLite con batching masivo, gestión de esquemas, snapshots y rows',
    defaults: {
      name: 'BaserowLite',
    },
    usableAsTool: true,
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [
      {
        name: 'baserowLiteApi',
        required: true,
      },
    ],
    properties: [
      // ----------------------------------
      // Resources
      // ----------------------------------
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Row', value: 'row' },
          { name: 'Field (Esquema)', value: 'field' },
          { name: 'Snapshot (Respaldo)', value: 'snapshot' },
          { name: 'Table', value: 'table' },
        ],
        default: 'row',
      },

      // ----------------------------------
      // Operations: Row
      // ----------------------------------
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['row'],
          },
        },
        options: [
          { name: 'Get', value: 'get', description: 'Obtener una fila por ID', action: 'Get a row' },
          { name: 'Get Many', value: 'getAll', description: 'Listar filas con filtros y nombres de campo legibles', action: 'Get all rows' },
          { name: 'Create', value: 'create', description: 'Crear una nueva fila', action: 'Create a row' },
          { name: 'Update', value: 'update', description: 'Actualizar una fila existente', action: 'Update a row' },
          { name: 'Delete', value: 'delete', description: 'Eliminar una fila', action: 'Delete a row' },
          { name: 'Batch Create', value: 'batchCreate', description: 'Creación masiva de hasta 500 filas en 1 llamada HTTP', action: 'Batch create rows' },
          { name: 'Batch Update', value: 'batchUpdate', description: 'Actualización masiva de filas en 1 llamada HTTP', action: 'Batch update rows' },
          { name: 'Batch Delete', value: 'batchDelete', description: 'Eliminación masiva de filas en 1 llamada HTTP', action: 'Batch delete rows' },
        ],
        default: 'getAll',
      },

      // ----------------------------------
      // Operations: Field
      // ----------------------------------
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['field'],
          },
        },
        options: [
          { name: 'Get Many', value: 'getAll', description: 'Listar columnas de una tabla', action: 'Get all fields' },
          { name: 'Create', value: 'create', description: 'Crear una columna dinámica', action: 'Create a field' },
        ],
        default: 'getAll',
      },

      // ----------------------------------
      // Operations: Snapshot
      // ----------------------------------
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['snapshot'],
          },
        },
        options: [
          { name: 'Create', value: 'create', description: 'Crear respaldo instantáneo en caliente', action: 'Create a snapshot' },
          { name: 'Get Many', value: 'getAll', description: 'Listar respaldos de la tabla', action: 'Get snapshots' },
          { name: 'Restore', value: 'restore', description: 'Restaurar tabla desde un snapshot', action: 'Restore a snapshot' },
        ],
        default: 'create',
      },

      // ----------------------------------
      // Operations: Table
      // ----------------------------------
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['table'],
          },
        },
        options: [
          { name: 'Get Many', value: 'getAll', description: 'Listar todas las tablas disponibles', action: 'Get all tables' },
        ],
        default: 'getAll',
      },

      // ----------------------------------
      // Parámetros comunes: Table ID
      // ----------------------------------
      {
        displayName: 'Table ID',
        name: 'tableId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            resource: ['row', 'field'],
          },
        },
        description: 'ID o Legacy ID de la tabla (ej. 865 o UUID)',
      },
      {
        displayName: 'Table ID',
        name: 'tableId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            resource: ['snapshot'],
            operation: ['create', 'getAll'],
          },
        },
        description: 'ID de la tabla para el snapshot',
      },

      // ----------------------------------
      // Parámetros: Row ID
      // ----------------------------------
      {
        displayName: 'Row ID',
        name: 'rowId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            resource: ['row'],
            operation: ['get', 'update', 'delete'],
          },
        },
        description: 'ID o UUID de la fila',
      },

      // ----------------------------------
      // Parámetros: Row Data (Single Row)
      // ----------------------------------
      {
        displayName: 'Row Data (JSON)',
        name: 'data',
        type: 'json',
        required: true,
        default: '{\n  "Nombre": "Ejemplo"\n}',
        displayOptions: {
          show: {
            resource: ['row'],
            operation: ['create', 'update'],
          },
        },
        description: 'Objeto JSON con los campos y valores de la fila',
      },

      // ----------------------------------
      // Parámetros: Batch Items (Batch Create / Update)
      // ----------------------------------
      {
        displayName: 'Items (Array de Objetos)',
        name: 'items',
        type: 'json',
        required: true,
        default: '[\n  { "Nombre": "Fila 1" },\n  { "Nombre": "Fila 2" }\n]',
        displayOptions: {
          show: {
            resource: ['row'],
            operation: ['batchCreate', 'batchUpdate'],
          },
        },
        description: 'Lista de filas en JSON. En batchUpdate cada fila debe tener "id".',
      },

      // ----------------------------------
      // Parámetros: Batch Delete (Array de IDs)
      // ----------------------------------
      {
        displayName: 'Row IDs (Array o Comma-Separated)',
        name: 'rowIds',
        type: 'json',
        required: true,
        default: '["id-1", "id-2"]',
        displayOptions: {
          show: {
            resource: ['row'],
            operation: ['batchDelete'],
          },
        },
        description: 'Lista de IDs a eliminar',
      },

      // ----------------------------------
      // Parámetros: Field Data (Create Field)
      // ----------------------------------
      {
        displayName: 'Field Data (JSON)',
        name: 'fieldData',
        type: 'json',
        required: true,
        default: '{\n  "name": "Nuevo Campo",\n  "type": "text"\n}',
        displayOptions: {
          show: {
            resource: ['field'],
            operation: ['create'],
          },
        },
        description: 'Definición de columna (name, type)',
      },

      // ----------------------------------
      // Parámetros: Snapshot Name
      // ----------------------------------
      {
        displayName: 'Snapshot Name',
        name: 'name',
        type: 'string',
        default: '',
        placeholder: 'Respaldo antes de sync n8n',
        displayOptions: {
          show: {
            resource: ['snapshot'],
            operation: ['create'],
          },
        },
      },

      // ----------------------------------
      // Parámetros: Snapshot ID (Restore)
      // ----------------------------------
      {
        displayName: 'Snapshot ID',
        name: 'snapshotId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            resource: ['snapshot'],
            operation: ['restore'],
          },
        },
        description: 'UUID del snapshot para restaurar',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = await this.getCredentials('baserowLiteApi');
    const host = ((credentials.host as string) || 'http://192.168.60.25:8097').replace(/\/$/, '');
    const token = (credentials.databaseToken as string) || '';

    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    const authHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      authHeaders.Authorization = `Token ${token}`;
    }

    const makeRequest = async (options: IHttpRequestOptions) => {
      options.headers = { ...authHeaders, ...(options.headers || {}) };
      return await this.helpers.httpRequest(options);
    };

    for (let i = 0; i < items.length; i++) {
      try {
        if (resource === 'row') {
          const tableId = this.getNodeParameter('tableId', i) as string;

          if (operation === 'get') {
            const rowId = this.getNodeParameter('rowId', i) as string;
            const res = await makeRequest({
              method: 'GET',
              url: `${host}/api/database/rows/table/${tableId}/${rowId}/?user_field_names=true`,
            });
            returnData.push({ json: res, pairedItem: { item: i } });
          } else if (operation === 'getAll') {
            const res = await makeRequest({
              method: 'GET',
              url: `${host}/api/database/rows/table/${tableId}/?user_field_names=true`,
            });
            const results = Array.isArray(res.results) ? res.results : [res];
            for (const r of results) {
              returnData.push({ json: r, pairedItem: { item: i } });
            }
          } else if (operation === 'create') {
            const dataParam = this.getNodeParameter('data', i);
            const body = typeof dataParam === 'string' ? JSON.parse(dataParam) : dataParam;
            const res = await makeRequest({
              method: 'POST',
              url: `${host}/api/database/rows/table/${tableId}/?user_field_names=true`,
              body,
            });
            returnData.push({ json: res, pairedItem: { item: i } });
          } else if (operation === 'update') {
            const rowId = this.getNodeParameter('rowId', i) as string;
            const dataParam = this.getNodeParameter('data', i);
            const body = typeof dataParam === 'string' ? JSON.parse(dataParam) : dataParam;
            const res = await makeRequest({
              method: 'PATCH',
              url: `${host}/api/database/rows/table/${tableId}/${rowId}/?user_field_names=true`,
              body,
            });
            returnData.push({ json: res, pairedItem: { item: i } });
          } else if (operation === 'delete') {
            const rowId = this.getNodeParameter('rowId', i) as string;
            await makeRequest({
              method: 'DELETE',
              url: `${host}/api/database/rows/table/${tableId}/${rowId}/`,
            });
            returnData.push({ json: { success: true, id: rowId }, pairedItem: { item: i } });
          } else if (operation === 'batchCreate') {
            const rawItems = this.getNodeParameter('items', i);
            const parsedItems = typeof rawItems === 'string' ? JSON.parse(rawItems) : rawItems;
            const res = await makeRequest({
              method: 'POST',
              url: `${host}/api/database/rows/table/${tableId}/batch/?user_field_names=true`,
              body: { items: parsedItems },
            });
            const createdItems = Array.isArray(res.items) ? res.items : [res];
            for (const item of createdItems) {
              returnData.push({ json: item, pairedItem: { item: i } });
            }
          } else if (operation === 'batchUpdate') {
            const rawItems = this.getNodeParameter('items', i);
            const parsedItems = typeof rawItems === 'string' ? JSON.parse(rawItems) : rawItems;
            const res = await makeRequest({
              method: 'PATCH',
              url: `${host}/api/database/rows/table/${tableId}/batch/?user_field_names=true`,
              body: { items: parsedItems },
            });
            const updatedItems = Array.isArray(res.items) ? res.items : [res];
            for (const item of updatedItems) {
              returnData.push({ json: item, pairedItem: { item: i } });
            }
          } else if (operation === 'batchDelete') {
            const rawIds = this.getNodeParameter('rowIds', i);
            const parsedIds = typeof rawIds === 'string' ? JSON.parse(rawIds) : rawIds;
            const res = await makeRequest({
              method: 'DELETE',
              url: `${host}/api/database/rows/table/${tableId}/batch/`,
              body: { items: parsedIds },
            });
            returnData.push({ json: res, pairedItem: { item: i } });
          }
        } else if (resource === 'field') {
          const tableId = this.getNodeParameter('tableId', i) as string;
          if (operation === 'getAll') {
            const res = await makeRequest({
              method: 'GET',
              url: `${host}/api/database/fields/table/${tableId}/`,
            });
            const fields = Array.isArray(res) ? res : [res];
            for (const f of fields) {
              returnData.push({ json: f, pairedItem: { item: i } });
            }
          } else if (operation === 'create') {
            const rawField = this.getNodeParameter('fieldData', i);
            const body = typeof rawField === 'string' ? JSON.parse(rawField) : rawField;
            const res = await makeRequest({
              method: 'POST',
              url: `${host}/api/database/fields/table/${tableId}/`,
              body,
            });
            returnData.push({ json: res, pairedItem: { item: i } });
          }
        } else if (resource === 'snapshot') {
          if (operation === 'create') {
            const tableId = this.getNodeParameter('tableId', i) as string;
            const name = this.getNodeParameter('name', i, '') as string;
            const res = await makeRequest({
              method: 'POST',
              url: `${host}/api/database/snapshots/table/${tableId}`,
              body: { name: name || undefined },
            });
            returnData.push({ json: res, pairedItem: { item: i } });
          } else if (operation === 'getAll') {
            const tableId = this.getNodeParameter('tableId', i) as string;
            const res = await makeRequest({
              method: 'GET',
              url: `${host}/api/database/snapshots/table/${tableId}`,
            });
            const snaps = Array.isArray(res) ? res : [res];
            for (const s of snaps) {
              returnData.push({ json: s, pairedItem: { item: i } });
            }
          } else if (operation === 'restore') {
            const snapshotId = this.getNodeParameter('snapshotId', i) as string;
            const res = await makeRequest({
              method: 'POST',
              url: `${host}/api/database/snapshots/${snapshotId}/restore`,
            });
            returnData.push({ json: res, pairedItem: { item: i } });
          }
        } else if (resource === 'table') {
          if (operation === 'getAll') {
            const res = await makeRequest({
              method: 'GET',
              url: `${host}/api/database/tables`,
            });
            const tbls = Array.isArray(res) ? res : [res];
            for (const t of tbls) {
              returnData.push({ json: t, pairedItem: { item: i } });
            }
          }
        }
      } catch (error: any) {
        if (this.continueOnFail()) {
          returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
