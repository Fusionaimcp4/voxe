/**
 * CRM Service Layer
 * Handles connections and operations for different CRM providers
 */

import { 
  CRMConfiguration, 
  ChatwootConfiguration,
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
 * Test custom CRM connection
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
        message: 'Failed to connect to custom CRM',
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
    
    return {
      success: true,
      message: 'Successfully connected to custom CRM',
      details: {
        features: ['Custom API Integration'],
      },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to connect to custom CRM',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main function to test CRM connection
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
        message: 'Unsupported CRM provider',
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
    
    const integration = await prisma.integration.findFirst({
      where: {
        userId,
        type: 'CRM',
        isActive: true,
      },
    });
    
    if (!integration) {
      return null;
    }
    
    const config = integration.configuration as any;
    
    if (config.provider !== 'CHATWOOT') {
      return null;
    }
    
    // Decrypt sensitive fields
    return {
      ...config,
      apiKey: decrypt(config.apiKey),
    } as ChatwootConfiguration;
  } catch (error) {
    console.error('Error getting user Chatwoot config:', error);
    return null;
  }
}

/**
 * Helper to get decrypted configuration
 */
export function decryptConfiguration(config: CRMConfiguration): CRMConfiguration {
  const decryptedConfig = { ...config };
  
  switch (config.provider) {
    case 'CHATWOOT':
      if (config.apiKey && config.apiKey.includes(':')) {
        decryptedConfig.apiKey = decrypt(config.apiKey);
      }
      break;
    case 'SALESFORCE':
      if (config.clientSecret && config.clientSecret.includes(':')) {
        decryptedConfig.clientSecret = decrypt(config.clientSecret);
      }
      if (config.securityToken && config.securityToken.includes(':')) {
        decryptedConfig.securityToken = decrypt(config.securityToken);
      }
      break;
    case 'HUBSPOT':
      if (config.apiKey && config.apiKey.includes(':')) {
        decryptedConfig.apiKey = decrypt(config.apiKey);
      }
      break;
    case 'CUSTOM':
      if (config.credentials) {
        if (typeof config.credentials === 'string' && config.credentials.includes(':')) {
          decryptedConfig.credentials = JSON.parse(decrypt(config.credentials));
        }
      }
      break;
  }
  
  return decryptedConfig;
}

