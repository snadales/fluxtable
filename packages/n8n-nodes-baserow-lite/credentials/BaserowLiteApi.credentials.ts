import {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class BaserowLiteApi implements ICredentialType {
  name = 'baserowLiteApi';
  displayName = 'BaserowLite API';
  documentationUrl = 'https://wiki.yarken.cl';
  properties: INodeProperties[] = [
    {
      displayName: 'Host URL',
      name: 'host',
      type: 'string',
      default: 'http://192.168.60.25:8097',
      placeholder: 'https://tables.yarken.cl',
      description: 'URL base del servidor BaserowLite en el homelab',
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
