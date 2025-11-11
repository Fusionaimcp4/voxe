/**
 * Helpdesk Service Layer
 * Handles connections and operations for different helpdesk providers
 */

import { 
  CRMConfiguration, 
  ChatwootConfiguration,
  SalesforceConfiguration,
  HubSpotConfiguration,
  CustomCRMConfiguration,
  TestConnectionResponse 
} from './types';
import { decrypt } from './encryption';

/**
 * Test Chatwoot connection
 */
async function testChatwootConnection(config: ChatwootConfiguration): Promise<TestConnectionResponse> {
  try {
    const { baseUrl, accountId, apiKey } = config;
    
    // Decrypt API key if it's encrypted
    let decryptedApiKey = apiKey;
    if (apiKey.includes(':')) {
      try {
        decryptedApiKey = decrypt(apiKey);
      } catch (e) {
        // If decryption fails, assume it's already decrypted (for initial save)
        decryptedApiKey = apiKey;
      }
    }
    
    // Test connection by fetching account details
    const response = await fetch(`${baseUrl}/api/v1/accounts/${accountId}`, {
      method: 'GET',
      headers: {
        'api_access_token': decryptedApiKey,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        success: false,
        message: 'Failed to connect to Chatwoot',
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }
    
    const accountData = await response.json();
    
    // Fetch available features/capabilities
    const inboxesResponse = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/inboxes`, {
      method: 'GET',
      headers: {
        'api_access_token': decryptedApiKey,
        'Content-Type': 'application/json',
      },
    });
    
    const features = [];
    if (inboxesResponse.ok) {
      features.push('Inboxes Management');
    }
    
    // Check for agent bots endpoint
    const botsResponse = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/agent_bots`, {
      method: 'GET',
      headers: {
        'api_access_token': decryptedApiKey,
        'Content-Type': 'application/json',
      },
    });
    
    if (botsResponse.ok) {
      features.push('Agent Bots');
    }
    
    return {
      success: true,
      message: 'Successfully connected to Chatwoot',
      details: {
        accountInfo: {
          id: accountData.id,
          name: accountData.name,
          locale: accountData.locale,
        },
        features,
        version: 'API v1',
      },
    };
  } catch (error) {
    console.error('Chatwoot connection test error:', error);
    return {
      success: false,
      message: 'Failed to connect to Chatwoot',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test Salesforce connection (placeholder for future implementation)
 */
async function testSalesforceConnection(): Promise<TestConnectionResponse> {
  return {
    success: false,
    message: 'Salesforce integration coming soon',
    error: 'Not implemented yet',
  };
}

/**
 * Test HubSpot connection (placeholder for future implementation)
 */
async function testHubSpotConnection(): Promise<TestConnectionResponse> {
  return {
    success: false,
    message: 'HubSpot integration coming soon',
    error: 'Not implemented yet',
  };
}

/**
 * Test custom helpdesk connection
 */
async function testCustomCRMConnection(config: any): Promise<TestConnectionResponse> {
  try {
    const { apiEndpoint, authType, credentials } = config;
    
    // Decrypt credentials if encrypted
    let decryptedCredentials = credentials;
    if (typeof credentials === 'string' && credentials.includes(':')) {
      try {
        const decrypted = decrypt(credentials);
        decryptedCredentials = JSON.parse(decrypted);
      } catch (e) {
        // Not encrypted or failed to decrypt
        try {
          decryptedCredentials = JSON.parse(credentials);
        } catch {
          decryptedCredentials = credentials;
        }
      }
    }
    
    // Build headers based on auth type
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    switch (authType) {
      case 'API_KEY':
        if (decryptedCredentials.api_key) {
          headers['X-API-Key'] = decryptedCredentials.api_key;
        }
        break;
      case 'BEARER':
        if (decryptedCredentials.token) {
          headers['Authorization'] = `Bearer ${decryptedCredentials.token}`;
        }
        break;
      case 'BASIC':
        if (decryptedCredentials.username && decryptedCredentials.password) {
          const auth = Buffer.from(
            `${decryptedCredentials.username}:${decryptedCredentials.password}`
          ).toString('base64');
          headers['Authorization'] = `Basic ${auth}`;
        }
        break;
    }
    
    // Test basic connectivity
    const response = await fetch(apiEndpoint, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to connect to custom helpdesk',
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
    
    return {
      success: true,
      message: 'Successfully connected to custom helpdesk',
      details: {
        features: ['Custom API Integration'],
      },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to connect to custom helpdesk',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main function to test helpdesk connection
 */
export async function testCRMConnection(
  configuration: CRMConfiguration
): Promise<TestConnectionResponse> {
  switch (configuration.provider) {
    case 'CHATWOOT':
      return testChatwootConnection(configuration as ChatwootConfiguration);
    case 'SALESFORCE':
      return testSalesforceConnection();
    case 'HUBSPOT':
      return testHubSpotConnection();
    case 'CUSTOM':
      return testCustomCRMConnection(configuration);
    default:
      return {
        success: false,
        message: 'Unsupported helpdesk provider',
        error: `Provider ${(configuration as any).provider} is not supported`,
      };
  }
}

/**
 * Get user's Chatwoot configuration
 * This replaces the global .env-based configuration
 */
export async function getUserChatwootConfig(
  userId: string
): Promise<ChatwootConfiguration | null> {
  try {
    const { prisma } = await import('./../../lib/prisma');
    
    if (!prisma) {
      console.warn('[getUserChatwootConfig] Prisma not available');
      return null;
    }
    
    // First, check all CRM integrations for this user (for debugging)
    const allIntegrations = await prisma.integration.findMany({
      where: {
        userId,
        type: 'CRM',
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        configuration: true,
      },
    });
    
    console.log(`[getUserChatwootConfig] Found ${allIntegrations.length} CRM integration(s) for user ${userId}:`, 
      allIntegrations.map(i => ({
        id: i.id,
        name: i.name,
        isActive: i.isActive,
        provider: (i.configuration as any)?.provider,
        hasBaseUrl: !!(i.configuration as any)?.baseUrl,
        hasAccountId: !!(i.configuration as any)?.accountId,
        hasApiKey: !!(i.configuration as any)?.apiKey,
      }))
    );
    
    const integration = await prisma.integration.findFirst({
      where: {
        userId,
        type: 'CRM',
        isActive: true,
      },
    });
    
    if (!integration) {
      console.log(`[getUserChatwootConfig] No active CRM integration found for user ${userId}`);
      console.log(`[getUserChatwootConfig] Available integrations:`, allIntegrations.map(i => ({
        id: i.id,
        name: i.name,
        isActive: i.isActive,
      })));
      return null;
    }
    
    const config = integration.configuration as any;
    
    console.log(`[getUserChatwootConfig] Found active integration ${integration.id} (${integration.name}), provider: ${config?.provider}`);
    
    if (!config || config.provider !== 'CHATWOOT') {
      console.log(`[getUserChatwootConfig] Integration found but provider is not CHATWOOT (found: ${config?.provider})`);
      console.log(`[getUserChatwootConfig] Full config keys:`, config ? Object.keys(config) : 'null');
      return null;
    }
    
    // Decrypt sensitive fields
    try {
      let decryptedApiKey = config.apiKey;
      if (config.apiKey && config.apiKey.includes(':')) {
        decryptedApiKey = decrypt(config.apiKey);
        console.log(`[getUserChatwootConfig] Decrypted API key for user ${userId}`);
      } else {
        console.log(`[getUserChatwootConfig] API key not encrypted (or missing) for user ${userId}`);
      }
      
      // Normalize baseUrl to remove trailing slash
      const normalizedBaseUrl = config.baseUrl?.replace(/\/+$/, '') || config.baseUrl;
      
      console.log(`[getUserChatwootConfig] ✅ Returning config for user ${userId}:`, {
        baseUrl: normalizedBaseUrl,
        accountId: config.accountId,
        hasApiKey: !!decryptedApiKey,
        apiKeyPrefix: decryptedApiKey ? `${decryptedApiKey.substring(0, 10)}...` : 'MISSING',
      });
      
      return {
        ...config,
        baseUrl: normalizedBaseUrl,
        apiKey: decryptedApiKey,
      } as ChatwootConfiguration;
    } catch (decryptError) {
      console.error('[getUserChatwootConfig] Failed to decrypt API key:', decryptError);
      return null;
    }
  } catch (error) {
    console.error('[getUserChatwootConfig] Error getting user Chatwoot config:', error);
    return null;
  }
}

/**
 * Deactivate CHATVOXE integration and clear sensitive credentials
 * This is called when user switches from CHATVOXE to their own Chatwoot instance
 * 
 * @param userId - User ID
 * @returns Information about the deactivated integration, or null if none found
 */
export async function deactivateChatvoxeIntegration(
  userId: string
): Promise<{ id: string; name: string; accountId?: string; baseUrl?: string } | null> {
  try {
    const { prisma } = await import('./../../lib/prisma');
    
    if (!prisma) {
      console.warn('[deactivateChatvoxeIntegration] Prisma not available');
      return null;
    }
    
    // Find active CHATVOXE integration
    // First try to find by name
    let chatvoxeIntegration = await prisma.integration.findFirst({
      where: {
        userId,
        type: 'CRM',
        isActive: true,
        name: 'CHATVOXE',
      },
    });
    
    // If not found by name, try to find by voxeCreated flag in configuration
    if (!chatvoxeIntegration) {
      const allActiveIntegrations = await prisma.integration.findMany({
        where: {
          userId,
          type: 'CRM',
          isActive: true,
        },
      });
      
      // Check each integration's configuration for voxeCreated flag
      for (const integration of allActiveIntegrations) {
        const config = integration.configuration as any;
        if (config?.voxeCreated === true) {
          chatvoxeIntegration = integration;
          break;
        }
      }
    }
    
    if (!chatvoxeIntegration) {
      console.log(`[deactivateChatvoxeIntegration] No active CHATVOXE integration found for user ${userId}`);
      return null;
    }
    
    const config = chatvoxeIntegration.configuration as any;
    const accountId = config?.accountId;
    const baseUrl = config?.baseUrl;
    
    // Clear sensitive credentials (apiKey) but keep baseUrl and accountId for reference
    const updatedConfig = { ...config };
    if (updatedConfig.apiKey) {
      delete updatedConfig.apiKey;
    }
    
    // Deactivate the integration
    await prisma.integration.update({
      where: { id: chatvoxeIntegration.id },
      data: {
        isActive: false,
        configuration: updatedConfig,
      },
    });
    
    console.log(`[deactivateChatvoxeIntegration] ✅ Deactivated CHATVOXE integration ${chatvoxeIntegration.id} for user ${userId}`);
    console.log(`[deactivateChatvoxeIntegration] Cleared credentials, preserved baseUrl: ${baseUrl}, accountId: ${accountId}`);
    
    return {
      id: chatvoxeIntegration.id,
      name: chatvoxeIntegration.name,
      accountId,
      baseUrl,
    };
  } catch (error) {
    console.error('[deactivateChatvoxeIntegration] Error deactivating CHATVOXE integration:', error);
    return null;
  }
}

/**
 * Deactivate all active helpdesk integrations for a user (except the one being activated)
 * This ensures only one helpdesk integration is active at a time
 * 
 * @param userId - User ID
 * @param excludeIntegrationId - Integration ID to exclude from deactivation (the one being activated)
 * @returns Array of deactivated integration IDs
 */
export async function deactivateAllActiveHelpdeskIntegrations(
  userId: string,
  excludeIntegrationId?: string
): Promise<string[]> {
  try {
    const { prisma } = await import('./../../lib/prisma');
    
    if (!prisma) {
      console.warn('[deactivateAllActiveHelpdeskIntegrations] Prisma not available');
      return [];
    }
    
    // Find all active CRM integrations for the user
    const activeIntegrations = await prisma.integration.findMany({
      where: {
        userId,
        type: 'CRM',
        isActive: true,
        ...(excludeIntegrationId && {
          id: { not: excludeIntegrationId },
        }),
      },
    });
    
    if (activeIntegrations.length === 0) {
      console.log(`[deactivateAllActiveHelpdeskIntegrations] No active helpdesk integrations to deactivate for user ${userId}`);
      return [];
    }
    
    const deactivatedIds: string[] = [];
    
    // Deactivate each integration WITHOUT clearing credentials
    // Credentials should be preserved so they can be used when the integration is reactivated
    // Only clear credentials when the integration is explicitly removed/deleted
    for (const integration of activeIntegrations) {
      // Just set isActive to false, preserve all configuration including API keys
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          isActive: false,
          // Don't update configuration - preserve it as-is including API keys
        },
      });
      
      deactivatedIds.push(integration.id);
      console.log(`[deactivateAllActiveHelpdeskIntegrations] ✅ Deactivated helpdesk integration ${integration.id} (${integration.name}) for user ${userId}`);
      console.log(`[deactivateAllActiveHelpdeskIntegrations] Preserved credentials for reactivation`);
    }
    
    console.log(`[deactivateAllActiveHelpdeskIntegrations] Deactivated ${deactivatedIds.length} helpdesk integration(s) for user ${userId}`);
    
    return deactivatedIds;
  } catch (error) {
    console.error('[deactivateAllActiveHelpdeskIntegrations] Error deactivating helpdesk integrations:', error);
    return [];
  }
}

/**
 * Helper to get decrypted configuration
 */
export function decryptConfiguration(config: CRMConfiguration): CRMConfiguration {
  const decryptedConfig = { ...config };
  
  switch (config.provider) {
    case 'CHATWOOT': {
      const chatwootConfig = config as ChatwootConfiguration;
      if (chatwootConfig.apiKey && chatwootConfig.apiKey.includes(':')) {
        (decryptedConfig as ChatwootConfiguration).apiKey = decrypt(chatwootConfig.apiKey);
      }
      break;
    }
    case 'SALESFORCE': {
      const salesforceConfig = config as SalesforceConfiguration;
      if (salesforceConfig.clientSecret && salesforceConfig.clientSecret.includes(':')) {
        (decryptedConfig as SalesforceConfiguration).clientSecret = decrypt(salesforceConfig.clientSecret);
      }
      if (salesforceConfig.securityToken && salesforceConfig.securityToken.includes(':')) {
        (decryptedConfig as SalesforceConfiguration).securityToken = decrypt(salesforceConfig.securityToken);
      }
      break;
    }
    case 'HUBSPOT': {
      const hubspotConfig = config as HubSpotConfiguration;
      if (hubspotConfig.apiKey && hubspotConfig.apiKey.includes(':')) {
        (decryptedConfig as HubSpotConfiguration).apiKey = decrypt(hubspotConfig.apiKey);
      }
      break;
    }
    case 'CUSTOM': {
      const customConfig = config as CustomCRMConfiguration;
      if (customConfig.credentials) {
        // credentials can be stored as encrypted string in database
        const credentialsValue = customConfig.credentials as any;
        if (typeof credentialsValue === 'string' && credentialsValue.includes(':')) {
          (decryptedConfig as CustomCRMConfiguration).credentials = JSON.parse(decrypt(credentialsValue));
        }
      }
      break;
    }
  }
  
  return decryptedConfig;
}

