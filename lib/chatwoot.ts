import { logger } from './logger';

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
      const userConfig = await getUserChatwootConfig(userId);
      if (userConfig) {
        base = userConfig.baseUrl;
        accountId = userConfig.accountId;
        token = userConfig.apiKey;
      }
    } catch (error) {
      logger.warn('Failed to get user Chatwoot config, falling back to env vars:', error);
    }
  }

  // Fall back to environment variables if no user config
  if (!base || !accountId || !token) {
    base = process.env.CHATWOOT_BASE_URL;
    accountId = process.env.CHATWOOT_ACCOUNT_ID;
    token = process.env.CHATWOOT_API_KEY;
  }

  if (!base || !accountId || !token) {
    throw new Error('Missing Chatwoot credentials. Either configure a CRM integration or set environment variables: CHATWOOT_BASE_URL, CHATWOOT_ACCOUNT_ID, CHATWOOT_API_KEY');
  }

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
