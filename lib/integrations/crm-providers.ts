/**
 * CRM Provider definitions and configurations
 */

import { CRMProviderInfo, FormFieldDefinition, CRMProvider } from './types';

// CRM Provider metadata
export const CRM_PROVIDERS: Record<CRMProvider, CRMProviderInfo> = {
  CHATWOOT: {
    id: 'CHATWOOT',
    name: 'Chatwoot',
    description: 'Open-source customer engagement platform with live chat, email, and social media support',
    icon: '💬',
    documentationUrl: 'https://www.chatwoot.com/docs',
    features: {
      supportsContacts: true,
      supportsDeals: false,
      supportsCompanies: false,
      supportsInboxes: true,
      supportsBots: true,
      supportsWebhooks: true,
      supportsCustomFields: true,
    },
    requiresOAuth: false,
  },
  SALESFORCE: {
    id: 'SALESFORCE',
    name: 'Salesforce',
    description: 'World\'s #1 CRM platform for sales, service, and marketing',
    icon: '☁️',
    documentationUrl: 'https://developer.salesforce.com/docs',
    features: {
      supportsContacts: true,
      supportsDeals: true,
      supportsCompanies: true,
      supportsInboxes: false,
      supportsBots: false,
      supportsWebhooks: true,
      supportsCustomFields: true,
    },
    requiresOAuth: true,
  },
  HUBSPOT: {
    id: 'HUBSPOT',
    name: 'HubSpot',
    description: 'All-in-one CRM platform for marketing, sales, and customer service',
    icon: '🧲',
    documentationUrl: 'https://developers.hubspot.com/docs/api/overview',
    features: {
      supportsContacts: true,
      supportsDeals: true,
      supportsCompanies: true,
      supportsInboxes: false,
      supportsBots: false,
      supportsWebhooks: true,
      supportsCustomFields: true,
    },
    requiresOAuth: false,
  },
  ZOHO: {
    id: 'ZOHO',
    name: 'Zoho CRM',
    description: 'Cloud-based CRM for sales, marketing, and customer support',
    icon: '📊',
    documentationUrl: 'https://www.zoho.com/crm/developer/docs/',
    features: {
      supportsContacts: true,
      supportsDeals: true,
      supportsCompanies: true,
      supportsInboxes: false,
      supportsBots: false,
      supportsWebhooks: true,
      supportsCustomFields: true,
    },
    requiresOAuth: true,
  },
  PIPEDRIVE: {
    id: 'PIPEDRIVE',
    name: 'Pipedrive',
    description: 'Sales-focused CRM and pipeline management tool',
    icon: '🔄',
    documentationUrl: 'https://developers.pipedrive.com/docs',
    features: {
      supportsContacts: true,
      supportsDeals: true,
      supportsCompanies: true,
      supportsInboxes: false,
      supportsBots: false,
      supportsWebhooks: true,
      supportsCustomFields: true,
    },
    requiresOAuth: false,
  },
  CUSTOM: {
    id: 'CUSTOM',
    name: 'Custom CRM',
    description: 'Connect any CRM system with custom API configuration',
    icon: '🔧',
    features: {
      supportsContacts: true,
      supportsDeals: true,
      supportsCompanies: true,
      supportsInboxes: false,
      supportsBots: false,
      supportsWebhooks: true,
      supportsCustomFields: false,
    },
    requiresOAuth: false,
  },
};

// Form field definitions for each CRM provider
export const CRM_FORM_FIELDS: Record<CRMProvider, FormFieldDefinition[]> = {
  CHATWOOT: [
    {
      name: 'baseUrl',
      label: 'Chatwoot Base URL',
      type: 'url',
      placeholder: 'https://app.chatwoot.com',
      helpText: 'Your Chatwoot installation URL (e.g., https://app.chatwoot.com or your self-hosted URL)',
      validation: {
        required: true,
        pattern: /^https?:\/\/.+/,
      },
      sensitive: false,
    },
    {
      name: 'accountId',
      label: 'Account ID',
      type: 'text',
      placeholder: '1',
      helpText: 'Your Chatwoot account ID (found in Settings > Account)',
      validation: {
        required: true,
        pattern: /^\d+$/,
      },
      sensitive: false,
    },
    {
      name: 'apiKey',
      label: 'API Access Token',
      type: 'password',
      placeholder: 'Enter your API token',
      helpText: 'Your Chatwoot API access token (found in Profile Settings > Access Token)',
      validation: {
        required: true,
        minLength: 10,
      },
      sensitive: true,
    },
    {
      name: 'features.autoCreateInboxes',
      label: 'Auto-create Inboxes',
      type: 'checkbox',
      helpText: 'Automatically create Chatwoot inboxes for new demos',
      validation: {
        required: false,
      },
      defaultValue: true,
      sensitive: false,
    },
    {
      name: 'features.autoCreateBots',
      label: 'Auto-create Agent Bots',
      type: 'checkbox',
      helpText: 'Automatically create and assign agent bots for AI responses',
      validation: {
        required: false,
      },
      defaultValue: true,
      sensitive: false,
    },
    {
      name: 'features.syncContacts',
      label: 'Sync Contacts',
      type: 'checkbox',
      helpText: 'Synchronize demo leads with Chatwoot contacts',
      validation: {
        required: false,
      },
      defaultValue: true,
      sensitive: false,
    },
  ],
  SALESFORCE: [
    {
      name: 'instanceUrl',
      label: 'Salesforce Instance URL',
      type: 'url',
      placeholder: 'https://yourcompany.salesforce.com',
      helpText: 'Your Salesforce instance URL',
      validation: {
        required: true,
        pattern: /^https?:\/\/.+salesforce\.com/,
      },
      sensitive: false,
    },
    {
      name: 'username',
      label: 'Username',
      type: 'text',
      placeholder: 'user@company.com',
      helpText: 'Your Salesforce username',
      validation: {
        required: true,
      },
      sensitive: false,
    },
    {
      name: 'clientId',
      label: 'Client ID (Consumer Key)',
      type: 'text',
      placeholder: 'Enter Client ID',
      helpText: 'From your Connected App settings',
      validation: {
        required: true,
      },
      sensitive: false,
    },
    {
      name: 'clientSecret',
      label: 'Client Secret (Consumer Secret)',
      type: 'password',
      placeholder: 'Enter Client Secret',
      helpText: 'From your Connected App settings',
      validation: {
        required: true,
      },
      sensitive: true,
    },
    {
      name: 'securityToken',
      label: 'Security Token',
      type: 'password',
      placeholder: 'Enter Security Token',
      helpText: 'Your Salesforce security token (sent to your email)',
      validation: {
        required: true,
      },
      sensitive: true,
    },
  ],
  HUBSPOT: [
    {
      name: 'apiKey',
      label: 'HubSpot API Key',
      type: 'password',
      placeholder: 'Enter your API key',
      helpText: 'Your HubSpot API key (found in Settings > Integrations > API Key)',
      validation: {
        required: true,
        minLength: 20,
      },
      sensitive: true,
    },
    {
      name: 'portalId',
      label: 'Portal ID (Hub ID)',
      type: 'text',
      placeholder: '12345678',
      helpText: 'Your HubSpot portal ID (found in Settings > Account Setup)',
      validation: {
        required: true,
        pattern: /^\d+$/,
      },
      sensitive: false,
    },
  ],
  ZOHO: [
    {
      name: 'datacenter',
      label: 'Data Center',
      type: 'select',
      helpText: 'Select your Zoho CRM data center',
      options: [
        { label: 'United States (.com)', value: 'com' },
        { label: 'Europe (.eu)', value: 'eu' },
        { label: 'India (.in)', value: 'in' },
        { label: 'Australia (.com.au)', value: 'com.au' },
        { label: 'Japan (.jp)', value: 'jp' },
      ],
      validation: {
        required: true,
      },
      sensitive: false,
    },
    {
      name: 'clientId',
      label: 'Client ID',
      type: 'text',
      placeholder: 'Enter Client ID',
      helpText: 'From your Zoho API console',
      validation: {
        required: true,
      },
      sensitive: false,
    },
    {
      name: 'clientSecret',
      label: 'Client Secret',
      type: 'password',
      placeholder: 'Enter Client Secret',
      helpText: 'From your Zoho API console',
      validation: {
        required: true,
      },
      sensitive: true,
    },
    {
      name: 'refreshToken',
      label: 'Refresh Token',
      type: 'password',
      placeholder: 'Enter Refresh Token',
      helpText: 'Generated OAuth refresh token',
      validation: {
        required: true,
      },
      sensitive: true,
    },
  ],
  PIPEDRIVE: [
    {
      name: 'apiToken',
      label: 'API Token',
      type: 'password',
      placeholder: 'Enter your API token',
      helpText: 'Your Pipedrive API token (found in Settings > Personal > API)',
      validation: {
        required: true,
        minLength: 20,
      },
      sensitive: true,
    },
    {
      name: 'companyDomain',
      label: 'Company Domain',
      type: 'text',
      placeholder: 'yourcompany',
      helpText: 'Your Pipedrive company domain (from yourcompany.pipedrive.com)',
      validation: {
        required: true,
        pattern: /^[a-z0-9-]+$/,
      },
      sensitive: false,
    },
  ],
  CUSTOM: [
    {
      name: 'name',
      label: 'CRM Name',
      type: 'text',
      placeholder: 'My Custom CRM',
      helpText: 'A friendly name for your custom CRM',
      validation: {
        required: true,
        minLength: 2,
      },
      sensitive: false,
    },
    {
      name: 'apiEndpoint',
      label: 'API Base URL',
      type: 'url',
      placeholder: 'https://api.yourcrm.com',
      helpText: 'The base URL for your CRM API',
      validation: {
        required: true,
        pattern: /^https?:\/\/.+/,
      },
      sensitive: false,
    },
    {
      name: 'authType',
      label: 'Authentication Type',
      type: 'select',
      helpText: 'Select how your CRM API authenticates',
      options: [
        { label: 'API Key', value: 'API_KEY' },
        { label: 'Bearer Token', value: 'BEARER' },
        { label: 'Basic Auth', value: 'BASIC' },
        { label: 'OAuth 2.0', value: 'OAUTH2' },
      ],
      validation: {
        required: true,
      },
      sensitive: false,
    },
    {
      name: 'credentials',
      label: 'Authentication Credentials',
      type: 'textarea',
      placeholder: '{"api_key": "your-key", "username": "user"}',
      helpText: 'Enter credentials as JSON (will be encrypted)',
      validation: {
        required: true,
        customValidator: (value: string) => {
          try {
            JSON.parse(value);
            return true;
          } catch {
            return 'Must be valid JSON';
          }
        },
      },
      sensitive: true,
    },
  ],
};

// Helper function to get provider info
export function getCRMProvider(provider: CRMProvider): CRMProviderInfo {
  return CRM_PROVIDERS[provider];
}

// Helper function to get form fields for a provider
export function getCRMFormFields(provider: CRMProvider): FormFieldDefinition[] {
  return CRM_FORM_FIELDS[provider];
}

// Get all available CRM providers
export function getAllCRMProviders(): CRMProviderInfo[] {
  return Object.values(CRM_PROVIDERS);
}

