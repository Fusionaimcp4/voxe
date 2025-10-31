// /lib/chatwoot_admin.ts
import { getUserChatwootConfig } from './integrations/crm-service';

interface ChatwootCredentials {
  baseUrl: string;
  accountId: string;
  apiKey: string;
}

/**
 * Get Chatwoot credentials from user config or environment variables
 */
async function getChatwootCredentials(userId?: string): Promise<ChatwootCredentials> {
  let base: string | undefined;
  let accountId: string | undefined;
  let apiKey: string | undefined;

  // Try to get user-specific Chatwoot configuration if userId provided
  if (userId) {
    try {
      const userConfig = await getUserChatwootConfig(userId);
      if (userConfig) {
        base = userConfig.baseUrl;
        accountId = userConfig.accountId;
        apiKey = userConfig.apiKey;
      }
    } catch (error) {
      console.warn('Failed to get user Chatwoot config, falling back to env vars:', error);
    }
  }

  // Fall back to environment variables if no user config
  if (!base || !accountId || !apiKey) {
    base = process.env.CHATWOOT_BASE_URL;
    accountId = process.env.CHATWOOT_ACCOUNT_ID;
    apiKey = process.env.CHATWOOT_API_KEY;
  }

  if (!base || !accountId || !apiKey) {
    throw new Error('Missing Chatwoot credentials. Either configure a CRM integration or set environment variables.');
  }

  return { baseUrl: base, accountId, apiKey };
}

async function cwPost(path: string, body: any, credentials: ChatwootCredentials) {
  const r = await fetch(`${credentials.baseUrl}${path}`, {
    method: "POST",
    headers: {
      "api_access_token": credentials.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`chatwoot POST ${path} ${r.status} ${txt}`);
  }
  return r.json();
}

async function cwGet(path: string, credentials: ChatwootCredentials) {
  const r = await fetch(`${credentials.baseUrl}${path}`, {
    headers: { "api_access_token": credentials.apiKey },
  });
  if (!r.ok) throw new Error(`chatwoot GET ${path} ${r.status}`);
  return r.json();
}

/**
 * Create a new Agent Bot:
 *  - name: "<BusinessName> Bot"
 *  - outgoing_url (webhook): https://n8n.sost.work/webhook/<BusinessName>
 * Returns: { id, access_token }
 * @param businessName - Business name for the bot
 * @param userId - Optional user ID to fetch user-specific credentials
 */
export async function createAgentBot(businessName: string, userId?: string) {
  const credentials = await getChatwootCredentials(userId);
  
  const outgoing_url = `${process.env.N8N_BASE_URL || 'https://n8n.sost.work'}/webhook/${businessName}`;
  const payload = {
    name: `${businessName} Bot`,
    description: `Bot for ${businessName} demo`,
    outgoing_url,
    // some builds require this flag
    // "bot_config": { "webhook_url": outgoing_url }
  };

  try {
    // API path for agent bots:
    // POST /api/v1/accounts/:account_id/agent_bots
    const data = await cwPost(`/api/v1/accounts/${credentials.accountId}/agent_bots`, payload, credentials);
    return { id: data.id, access_token: data.access_token ?? data.accessToken ?? "" };
  } catch (error) {
    // If agent_bots API is not available, throw a specific error
    if (error instanceof Error && error.message.includes('404')) {
      throw new Error('AGENT_BOT_API_NOT_AVAILABLE');
    }
    throw error;
  }
}

/**
 * Assign bot to inbox using the correct Chatwoot API endpoint
 * POST /api/v1/accounts/{account_id}/inboxes/{inbox_id}/set_agent_bot
 * with payload: { "agent_bot": <bot_id> }
 * @param inboxId - Inbox ID
 * @param botId - Bot ID
 * @param userId - Optional user ID to fetch user-specific credentials
 */
export async function assignBotToInbox(inboxId: number | string, botId: number | string, userId?: string) {
  const credentials = await getChatwootCredentials(userId);
  const path = `/api/v1/accounts/${credentials.accountId}/inboxes/${inboxId}/set_agent_bot`;
  const payload = {
    agent_bot: botId
  };

  console.log(`Assigning bot ${botId} to inbox ${inboxId} using correct Chatwoot endpoint...`);
  console.log(`POST ${credentials.baseUrl}${path}`);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const result = await cwPost(path, payload, credentials);
    console.log('✅ Bot successfully assigned to inbox using /set_agent_bot endpoint');
    
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if this is just a JSON parsing error but assignment might have worked
    if (errorMsg.includes('Unexpected end of JSON input') || errorMsg.includes('JSON')) {
      console.log('⚠️ Bot assignment API returned empty response, but assignment likely succeeded');
      return {}; // Return empty object since assignment probably worked
    } else {
      console.error(`❌ Bot assignment failed: ${errorMsg}`);
      throw new Error(`Failed to assign bot ${botId} to inbox ${inboxId}: ${errorMsg}`);
    }
  }
}

/**
 * Verify that the bot is properly assigned to the inbox
 * GET /api/v1/accounts/{account_id}/inboxes/{inbox_id}
 * Check if the agent_bot field matches our bot ID
 * @param inboxId - Inbox ID
 * @param botId - Bot ID
 * @param userId - Optional user ID to fetch user-specific credentials
 */
export async function verifyBotAssignment(inboxId: number | string, botId: number | string, userId?: string) {
  const credentials = await getChatwootCredentials(userId);
  const path = `/api/v1/accounts/${credentials.accountId}/inboxes/${inboxId}`;
  
  try {
    console.log(`Verifying bot assignment for inbox ${inboxId}...`);
    const inboxDetails = await cwGet(path, credentials);
    
    // Check if the agent_bot field matches our bot ID
    const assignedBotId = inboxDetails.agent_bot?.id || inboxDetails.agent_bot;
    
    console.log('Inbox details agent_bot field:', JSON.stringify(inboxDetails.agent_bot, null, 2));
    console.log(`Expected bot ID: ${botId}, Found bot ID: ${assignedBotId}`);
    
    if (assignedBotId && assignedBotId == botId) {
      console.log('✅ Bot assignment verified - agent_bot field matches expected bot ID');
      return true;
    } else {
      console.warn('⚠️ Bot assignment verification failed - agent_bot field does not match');
      console.log('Full inbox details:', JSON.stringify(inboxDetails, null, 2));
      return false;
    }
  } catch (error) {
    console.warn('⚠️ Could not verify bot assignment:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

async function cwPut(path: string, body: any, credentials: ChatwootCredentials) {
  const r = await fetch(`${credentials.baseUrl}${path}`, {
    method: "PUT",
    headers: {
      "api_access_token": credentials.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`chatwoot PUT ${path} ${r.status} ${txt}`);
  }
  return r.json();
}

async function cwPatch(path: string, body: any, credentials: ChatwootCredentials) {
  const r = await fetch(`${credentials.baseUrl}${path}`, {
    method: "PATCH",
    headers: {
      "api_access_token": credentials.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`chatwoot PATCH ${path} ${r.status} ${txt}`);
  }
  return r.json();
}
