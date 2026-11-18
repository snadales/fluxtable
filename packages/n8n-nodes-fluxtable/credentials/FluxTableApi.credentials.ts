import {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class FluxTableApi implements ICredentialType {
  name = 'fluxTableApi';
  displayName = 'FluxTable API';
  documentationUrl = 'https://wiki.yarken.cl';
  properties: INodeProperties[] = [
    {
      displayName: 'Host URL',
      name: 'host',
      type: 'string',
      default: 'https://fluxtable.yarken.cl',
      placeholder: 'https://fluxtable.yarken.cl',
      description: 'URL base del servidor FluxTable en el homelab Yarken',
      required: true,
    },
    {
      displayName: 'Database Token',
      name: 'databaseToken',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'Token de acceso persistente generado en My Settings > Database tokens',
      required: true,
    },
  ];

  authenticate = {
    type: 'generic' as const,
    properties: {
      headers: {
        Authorization: '={{"Token " + $credentials.databaseToken}}',
      },
    },
  };

  test = {
    request: {
      method: 'GET' as const,
      url: '={{$credentials.host.replace(/\\/$/, "") + "/api/health"}}',
    },
  };
}
