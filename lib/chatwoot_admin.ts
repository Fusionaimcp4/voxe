// /lib/chatwoot_admin.ts
const CW_BASE = process.env.CHATWOOT_BASE_URL!;
const CW_ACCT = process.env.CHATWOOT_ACCOUNT_ID!;
const CW_KEY = process.env.CHATWOOT_API_KEY!;

async function cwPost(path: string, body: any) {
  const r = await fetch(`${CW_BASE}${path}`, {
    method: "POST",
    headers: {
      "api_access_token": CW_KEY,
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

async function cwGet(path: string) {
  const r = await fetch(`${CW_BASE}${path}`, {
    headers: { "api_access_token": CW_KEY },
  });
  if (!r.ok) throw new Error(`chatwoot GET ${path} ${r.status}`);
  return r.json();
}

/**
 * Create a new Agent Bot:
 *  - name: "<BusinessName> Bot"
 *  - outgoing_url (webhook): https://n8n.sost.work/webhook/<BusinessName>
 * Returns: { id, access_token }
 */
export async function createAgentBot(businessName: string) {
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
    const data = await cwPost(`/api/v1/accounts/${CW_ACCT}/agent_bots`, payload);
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
 */
export async function assignBotToInbox(inboxId: number | string, botId: number | string) {
  const path = `/api/v1/accounts/${CW_ACCT}/inboxes/${inboxId}/set_agent_bot`;
  const payload = {
    agent_bot: botId
  };

  console.log(`Assigning bot ${botId} to inbox ${inboxId} using correct Chatwoot endpoint...`);
  console.log(`POST ${CW_BASE}${path}`);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const result = await cwPost(path, payload);
    console.log('✅ Bot successfully assigned to inbox using /set_agent_bot endpoint');
    
    // Verify assignment by checking inbox agent bot
    await verifyBotAssignment(inboxId, botId);
    
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if this is just a JSON parsing error but assignment might have worked
    if (errorMsg.includes('Unexpected end of JSON input') || errorMsg.includes('JSON')) {
      console.log('⚠️ Bot assignment API returned empty response, verifying if assignment actually worked...');
      
      // Try to verify if the assignment actually worked despite the JSON error
      const isAssigned = await verifyBotAssignment(inboxId, botId);
      if (isAssigned) {
        console.log('✅ Bot assignment actually succeeded despite empty API response');
        return {}; // Return empty object since assignment worked
      } else {
        console.error(`❌ Bot assignment verification failed: ${errorMsg}`);
        throw new Error(`Failed to assign bot ${botId} to inbox ${inboxId}: Assignment verification failed`);
      }
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
 */
export async function verifyBotAssignment(inboxId: number | string, botId: number | string) {
  const path = `/api/v1/accounts/${CW_ACCT}/inboxes/${inboxId}`;
  
  try {
    console.log(`Verifying bot assignment for inbox ${inboxId}...`);
    const inboxDetails = await cwGet(path);
    
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

async function cwPut(path: string, body: any) {
  const r = await fetch(`${CW_BASE}${path}`, {
    method: "PUT",
    headers: {
      "api_access_token": CW_KEY,
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

async function cwPatch(path: string, body: any) {
  const r = await fetch(`${CW_BASE}${path}`, {
    method: "PATCH",
    headers: {
      "api_access_token": CW_KEY,
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
