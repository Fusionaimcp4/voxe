/**
 * Simple n8n webhook integration for workflow duplication
 * Replaces the complex API-based workflow cloning with a fire-and-forget webhook call
 */

interface DuplicateAgentPayload {
  businessName: string;
  apiKey: string;
  systemMessage: string;
}

/**
 * Send a fire-and-forget request to duplicate an n8n workflow
 * This calls your custom n8n webhook endpoint that handles the workflow duplication
 * 
 * @param businessName - The business name for the new workflow
 * @param apiKey - The bot access token from Chatwoot
 * @param systemMessage - The complete system message content
 */
export async function duplicateWorkflowViaWebhook(
  businessName: string,
  apiKey: string,
  systemMessage: string
): Promise<{ success: boolean; workflowId?: string; error?: string }> {
  const endpoint = process.env.N8N_DUPLICATE_ENDPOINT;
  
  if (!endpoint) {
    console.warn('N8N_DUPLICATE_ENDPOINT not configured, skipping workflow duplication');
    return { success: false, error: 'N8N_DUPLICATE_ENDPOINT not configured' };
  }

  try {
    console.log(`Sending workflow duplication request for ${businessName}...`);
    console.log(`Endpoint: ${endpoint}`);
    
    const payload: DuplicateAgentPayload = {
      businessName,
      apiKey,
      systemMessage
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`✅ Workflow duplication request sent successfully for ${businessName}`);
      
      // Try to parse the response to get the workflow ID
      try {
        const responseData = await response.json();
        const workflowId = responseData.workflowId || responseData.id || responseData.workflow_id;
        
        if (workflowId) {
          console.log(`📋 Workflow ID received: ${workflowId}`);
          return { success: true, workflowId };
        } else {
          console.log(`⚠️ No workflow ID in response, but request succeeded`);
          return { success: true };
        }
      } catch (parseError) {
        console.log(`⚠️ Could not parse response, but request succeeded`);
        return { success: true };
      }
    } else {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`❌ Workflow duplication failed for ${businessName}: ${response.status} ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to send workflow duplication request for ${businessName}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}
