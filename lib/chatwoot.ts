import { logger } from './logger';
import { getUserChatwootConfig } from './integrations/crm-service';

export interface ChatwootInboxResponse {
  inbox_id: number;
  website_token: string;
}

export interface ChatwootCredentials {
  baseUrl: string;
  accountId: string;
  apiKey: string;
}

/**
 * Create a Chatwoot website inbox
 * @param name - Business/demo name
 * @param demoUrl - Demo URL
 * @param userId - Optional user ID to fetch user-specific credentials
 */
export async function createWebsiteInbox(
  name: string, 
  demoUrl: string,
  userId?: string
): Promise<ChatwootInboxResponse> {
  let base: string | undefined;
  let accountId: string | undefined;
  let token: string | undefined;

  // Try to get user-specific Chatwoot configuration if userId provided
  if (userId) {
    try {
      console.log(`[createWebsiteInbox] Attempting to get user-specific Chatwoot config for user ${userId}...`);
      const userConfig = await getUserChatwootConfig(userId);
      if (userConfig) {
        console.log(`[createWebsiteInbox] ✅ Using user-specific Chatwoot config for user ${userId}:`, {
          baseUrl: userConfig.baseUrl,
          accountId: userConfig.accountId,
          hasApiKey: !!userConfig.apiKey,
          apiKeyPrefix: userConfig.apiKey ? `${userConfig.apiKey.substring(0, 10)}...` : 'MISSING',
        });
        base = userConfig.baseUrl;
        accountId = userConfig.accountId;
        token = userConfig.apiKey;
      } else {
        console.warn(`[createWebsiteInbox] ⚠️ No user-specific Chatwoot config found for user ${userId}, will use env vars`);
      }
    } catch (error) {
      console.error('[createWebsiteInbox] Failed to get user Chatwoot config, falling back to env vars:', error);
      logger.warn('Failed to get user Chatwoot config, falling back to env vars:', error);
    }
  } else {
    console.log(`[createWebsiteInbox] No userId provided, will use env vars`);
  }

  // Fall back to environment variables if no user config
  if (!base || !accountId || !token) {
    console.log(`[createWebsiteInbox] Falling back to environment variables:`, {
      hasBaseUrl: !!process.env.CHATWOOT_BASE_URL,
      hasAccountId: !!process.env.CHATWOOT_ACCOUNT_ID,
      hasApiKey: !!process.env.CHATWOOT_API_KEY,
    });
    base = process.env.CHATWOOT_BASE_URL;
    accountId = process.env.CHATWOOT_ACCOUNT_ID;
    token = process.env.CHATWOOT_API_KEY;
  }

  if (!base || !accountId || !token) {
    throw new Error('Missing Chatwoot credentials. Either configure a CRM integration or set environment variables: CHATWOOT_BASE_URL, CHATWOOT_ACCOUNT_ID, CHATWOOT_API_KEY');
  }

  // Normalize baseUrl to remove trailing slash
  base = base.replace(/\/+$/, '');

  const url = `${base}/api/v1/accounts/${accountId}/inboxes`;
  const payload = {
    name: `${name} Demo`,
    channel: {
      type: 'web_widget',
      website_url: demoUrl
    }
  };

  logger.debug('Using Chatwoot config:', {
    baseUrl: base,
    accountId: accountId,
    tokenPrefix: token ? `${token.substring(0, 10)}...` : 'MISSING',
    url: url,
    payload: payload
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'api_access_token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Chatwoot inbox create failed: ${res.status} ${res.statusText} - ${errorText}`);
    }

    const data = await res.json();
    
    return {
      inbox_id: data.id,
      website_token: data.website_token
    };
  } catch (error) {
    logger.error('Chatwoot API error:', error);
    throw new Error(`Chatwoot inbox create failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
