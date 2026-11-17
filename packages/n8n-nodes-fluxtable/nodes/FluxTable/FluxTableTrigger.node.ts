import {
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  IWebhookResponseData,
  NodeConnectionTypes,
} from 'n8n-workflow';

export class FluxTableTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'FluxTable Trigger',
    name: 'fluxTableTrigger',
    icon: 'file:fluxtable.svg',
    group: ['trigger'],
    version: 1,
    description: 'Dispara un workflow en n8n instantáneamente cuando ocurren cambios de datos en FluxTable',
    defaults: {
      name: 'FluxTable Trigger',
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
        default: 'Copia la URL del Webhook generada arriba y pégala en FluxTable abriendo la tabla > botón "Webhooks" > "Nuevo Webhook".',
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
    const body = req.body;
    const selectedEvents = this.getNodeParameter('events', []) as string[];

    if (body && body.event && selectedEvents.length > 0 && !selectedEvents.includes(body.event)) {
      return {
        workflowData: [[]],
      };
    }

    return {
      workflowData: [this.helpers.returnJsonArray(body || {})],
    };
  }
}
