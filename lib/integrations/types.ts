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

// Calendar Provider types
export type CalendarProvider = 'GOOGLE_CALENDAR' | 'MICROSOFT_OUTLOOK' | 'CUSTOM';

// Base calendar configuration interface
export interface BaseCalendarConfiguration {
  provider: CalendarProvider;
  connectionStatus?: {
    isConnected: boolean;
    lastChecked?: string;
    errorMessage?: string;
  };
}

// Calendar scheduling settings
export interface CalendarSchedulingSettings {
  timezone?: string;
  daysAhead?: number;
  slotDurationMinutes?: number;
  slotInterval?: number;
  maxSlots?: number;
  skipPastTimeToday?: boolean;
  businessHours?: {
    mon?: [string, string];  // [start, end] in "HH:MM" format
    tue?: [string, string];
    wed?: [string, string];
    thu?: [string, string];
    fri?: [string, string];
    sat?: [string, string];
    sun?: [string, string];
  };
  closedDays?: string[];  // e.g., ["sat", "sun"]
  holidayDates?: string[];  // ISO date strings
  bufferMinutesBetweenMeetings?: number;
  maxBookingsPerDay?: number;
  maxBookingsPerWeek?: number;
}

// Google Calendar configuration
export interface CalendarConfigurationGoogle extends BaseCalendarConfiguration {
  provider: 'GOOGLE_CALENDAR';
  accountEmail?: string;
  calendarId?: string;
  timezone?: string;
  enabledForChatScheduling?: boolean;
  // Scheduling settings for "Get available time slots"
  schedulingSettings?: CalendarSchedulingSettings;
  // OAuth credentials (encrypted, user-provided or from env)
  oauthClientId?: string;      // encrypted AES-256-GCM (if user-provided)
  oauthClientSecret?: string;  // encrypted AES-256-GCM (if user-provided)
  tokens?: {
    accessToken: string;    // encrypted AES-256-GCM
    refreshToken: string;   // encrypted AES-256-GCM
    expiryDate: number;     // timestamp (ms)
  };
  // Note: We don't store n8n credentials for calendar
  // n8n workflows should call Voxe's internal APIs:
  // - POST /api/internal/calendar/get-slots
  // - POST /api/internal/calendar/book-event
}

// Union type for all calendar configurations
export type CalendarConfiguration = CalendarConfigurationGoogle;

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

