/**
 * TypeScript types and interfaces for helpdesk integrations
 */

// Base integration status
export type IntegrationStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'TESTING' | 'PENDING';

export type IntegrationType = 'CALENDAR' | 'DATABASE' | 'API' | 'WEBHOOK' | 'CRM';

// Helpdesk Provider types
export type CRMProvider = 'CHATWOOT' | 'SALESFORCE' | 'HUBSPOT' | 'FRONT' | 'ZENDESK' | 'CUSTOM';

// Base helpdesk configuration interface
export interface BaseCRMConfiguration {
  provider: CRMProvider;
  connectionStatus?: {
    isConnected: boolean;
    lastChecked?: string;
    errorMessage?: string;
  };
}

// Chatwoot-specific configuration
export interface ChatwootConfiguration extends BaseCRMConfiguration {
  provider: 'CHATWOOT';
  baseUrl: string;
  accountId: string;
  apiKey: string; // Will be encrypted in database
  features?: {
    autoCreateInboxes: boolean;
    autoCreateBots: boolean;
    syncContacts: boolean;
  };
  webhookSettings?: {
    enabled: boolean;
    url?: string;
  };
}

// Salesforce configuration
export interface SalesforceConfiguration extends BaseCRMConfiguration {
  provider: 'SALESFORCE';
  instanceUrl: string;
  clientId: string;
  clientSecret: string; // Will be encrypted
  username: string;
  securityToken: string; // Will be encrypted
  apiVersion?: string;
  syncSettings?: {
    syncLeads: boolean;
    syncContacts: boolean;
    syncAccounts: boolean;
    syncInterval: number;
  };
}

// HubSpot configuration
export interface HubSpotConfiguration extends BaseCRMConfiguration {
  provider: 'HUBSPOT';
  apiKey: string; // Will be encrypted
  portalId: string;
  syncSettings?: {
    syncContacts: boolean;
    syncDeals: boolean;
    syncCompanies: boolean;
    syncInterval: number;
  };
}

// Custom helpdesk configuration
export interface CustomCRMConfiguration extends BaseCRMConfiguration {
  provider: 'CUSTOM';
  name: string;
  apiEndpoint: string;
  authType: 'API_KEY' | 'BEARER' | 'BASIC' | 'OAUTH2';
  credentials: Record<string, string>; // Will be encrypted as JSON
  customHeaders?: Record<string, string>;
  syncEndpoints?: {
    contacts?: string;
    deals?: string;
    companies?: string;
  };
}

// Front configuration
export interface FrontConfiguration extends BaseCRMConfiguration {
  provider: 'FRONT';
  apiKey: string; // Will be encrypted
  baseUrl: string;
  syncSettings?: {
    syncContacts: boolean;
    syncInboxes: boolean;
    syncInterval: number;
  };
}

// Zendesk configuration
export interface ZendeskConfiguration extends BaseCRMConfiguration {
  provider: 'ZENDESK';
  subdomain: string;
  email: string;
  apiToken: string; // Will be encrypted
  syncSettings?: {
    syncContacts: boolean;
    syncTickets: boolean;
    syncInterval: number;
  };
}

// Union type for all helpdesk configurations
export type CRMConfiguration = 
  | ChatwootConfiguration 
  | SalesforceConfiguration 
  | HubSpotConfiguration 
  | FrontConfiguration
  | ZendeskConfiguration
  | CustomCRMConfiguration;

// Integration model (matches Prisma schema)
export interface Integration {
  id: string;
  userId: string;
  name: string;
  type: IntegrationType;
  configuration: CRMConfiguration | any; // any for non-CRM types
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// API request/response types
export interface CreateIntegrationRequest {
  name: string;
  type: IntegrationType;
  configuration: CRMConfiguration | any;
}

export interface UpdateIntegrationRequest {
  name?: string;
  configuration?: Partial<CRMConfiguration> | any;
  isActive?: boolean;
}

export interface TestConnectionRequest {
  type: IntegrationType;
  configuration: CRMConfiguration | any;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  details?: {
    accountInfo?: any;
    features?: string[];
    version?: string;
  };
  error?: string;
}

// Helpdesk capabilities/features
export interface CRMFeatures {
  supportsContacts: boolean;
  supportsDeals: boolean;
  supportsCompanies: boolean;
  supportsInboxes: boolean;
  supportsBots: boolean;
  supportsWebhooks: boolean;
  supportsCustomFields: boolean;
}

// Helpdesk provider metadata
export interface CRMProviderInfo {
  id: CRMProvider;
  name: string;
  description: string;
  icon: string;
  documentationUrl?: string;
  features: CRMFeatures;
  requiresOAuth: boolean;
}

// Field validation rules
export interface FieldValidation {
  required: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  customValidator?: (value: string) => boolean | string;
}

// Form field definition for dynamic forms
export interface FormFieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'number' | 'select' | 'checkbox' | 'textarea';
  placeholder?: string;
  helpText?: string;
  validation: FieldValidation;
  options?: Array<{ label: string; value: string }>;
  sensitive?: boolean; // If true, value will be encrypted
  defaultValue?: any;
}

