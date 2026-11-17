import {
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  IWebhookResponseData,
  NodeConnectionTypes,
} from 'n8n-workflow';

export class BaserowLiteTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'BaserowLite Trigger',
    name: 'baserowLiteTrigger',
    icon: 'file:baserow.svg',
    group: ['trigger'],
    version: 1,
    description: 'Dispara un workflow en n8n instantáneamente cuando ocurren cambios de datos en BaserowLite',
    defaults: {
      name: 'BaserowLite Trigger',
    },
    inputs: [],
    outputs: [NodeConnectionTypes.Main],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'webhook',
      },
    ],
    properties: [
      {
        displayName: 'Instrucciones',
        name: 'notice',
        type: 'notice',
        default: 'Copia la URL del Webhook generada arriba y pégala en BaserowLite abriendo la tabla > botón "Webhooks" > "Nuevo Webhook".',
      },
      {
        displayName: 'Eventos Filtrados',
        name: 'events',
        type: 'multiOptions',
        options: [
          { name: 'Fila Creada (rows.created)', value: 'rows.created' },
          { name: 'Fila Actualizada (rows.updated)', value: 'rows.updated' },
          { name: 'Fila Eliminada (rows.deleted)', value: 'rows.deleted' },
        ],
        default: ['rows.created', 'rows.updated', 'rows.deleted'],
        description: 'Eventos que activarán el flujo',
      },
    ],
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const req = this.getRequestObject();
    const body = req.body || {};
    const events = (this.getNodeParameter('events', []) as string[]) || [];

    const eventType = body.event_type;

    // Si hay filtro de eventos configurado y el evento recibido no coincide, no continuar
    if (eventType && events.length > 0 && !events.includes(eventType) && eventType !== 'test.ping') {
      return {
        workflowData: [[]],
      };
    }

    // Si el payload contiene items (estilo Baserow), emitir cada item con los metadatos del evento
    const returnData = [];
    if (Array.isArray(body.items) && body.items.length > 0) {
      for (const item of body.items) {
        returnData.push({
          json: {
            ...item,
            _event: {
              id: body.event_id,
              type: body.event_type,
              tableId: body.table_id,
              timestamp: body.timestamp,
            },
          },
        });
      }
    } else {
      returnData.push({ json: body });
    }

    return {
      workflowData: [returnData],
    };
  }
}
