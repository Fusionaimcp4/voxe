/**
 * n8n API integration for workflow control
 */

export interface N8nWorkflowResponse {
  id: string;
  name: string;
  active: boolean;
  nodes: any[];
  connections: any;
  settings?: any;
  staticData?: any;
}

interface N8nExecutionResponse {
  id: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt?: string;
  workflowData: {
    id: string;
    name: string;
  };
}

/**
 * Get n8n API configuration
 */
function getN8nConfig() {
  const baseUrl = process.env.N8N_BASE_URL;
  const apiKey = process.env.N8N_API_KEY;
  
  if (!baseUrl) {
    throw new Error('N8N_BASE_URL environment variable is required. Please configure it in your .env file.');
  }
  
  if (!apiKey) {
    throw new Error('N8N_API_KEY environment variable is required. Please configure it in your .env file.');
  }
  
  // Normalize baseUrl to remove trailing slash
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
  
  return { baseUrl: normalizedBaseUrl, apiKey };
}

/**
 * Make authenticated request to n8n API with retry logic
 */
async function n8nRequest(endpoint: string, options: RequestInit = {}, retries: number = 3) {
  const { baseUrl, apiKey } = getN8nConfig();
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 n8n API request attempt ${attempt}/${retries}: ${options.method || 'GET'} ${endpoint}`);
      
      const response = await fetch(`${baseUrl}/api/v1${endpoint}`, {
        ...options,
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        // Add timeout to prevent hanging connections
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`n8n API error: ${response.status} ${errorText}`);
      }
      
      console.log(`✅ n8n API request successful on attempt ${attempt}`);
      return response.json();
      
    } catch (error) {
      console.error(`❌ n8n API request attempt ${attempt} failed:`, error);
      
      if (attempt === retries) {
        throw error; // Re-throw on final attempt
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s...
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * Get workflow details from n8n
 */
export async function getN8nWorkflow(workflowId: string): Promise<N8nWorkflowResponse> {
  return n8nRequest(`/workflows/${workflowId}`);
}

/**
 * Update workflow active status in n8n
 * Note: n8n doesn't allow direct active field updates via PUT
 * Instead, we'll use the workflow activation endpoint
 */
export async function updateN8nWorkflowStatus(workflowId: string, active: boolean): Promise<N8nWorkflowResponse> {
  if (active) {
    // Activate workflow
    return n8nRequest(`/workflows/${workflowId}/activate`, {
      method: 'POST'
    });
  } else {
    // Deactivate workflow
    return n8nRequest(`/workflows/${workflowId}/deactivate`, {
      method: 'POST'
    });
  }
}

/**
 * Start a workflow execution in n8n
 */
export async function startN8nWorkflow(workflowId: string): Promise<N8nExecutionResponse> {
  return n8nRequest(`/workflows/${workflowId}/execute`, {
    method: 'POST',
    body: JSON.stringify({
      workflowId,
      mode: 'manual'
    })
  });
}

/**
 * Stop a running workflow execution in n8n
 */
export async function stopN8nWorkflow(executionId: string): Promise<void> {
  await n8nRequest(`/executions/${executionId}/stop`, {
    method: 'POST'
  });
}

/**
 * Get workflow executions
 */
export async function getN8nWorkflowExecutions(workflowId: string, limit: number = 10): Promise<N8nExecutionResponse[]> {
  const response = await n8nRequest(`/executions?workflowId=${workflowId}&limit=${limit}`);
  return response.data || [];
}

/**
 * Update workflow system message in n8n
 */
export async function updateN8nWorkflowSystemMessage(
  workflowId: string, 
  systemMessage: string, 
  businessName: string
): Promise<N8nWorkflowResponse> {
  // Get current workflow
  const workflow = await getN8nWorkflow(workflowId);
  
  // Debug: Log all nodes to understand the structure
  console.log('🔍 Available nodes in workflow:');
  workflow.nodes.forEach((node: any, index: number) => {
    console.log(`  ${index + 1}. Name: "${node.name}", Type: "${node.type}"`);
  });
  
  // Find the main AI Agent node (not AI Agent1) and update its system message
  const updatedNodes = workflow.nodes.map((node: any) => {
    // Look specifically for the main "AI Agent" node (not "AI Agent1")
    const isMainAIAgentNode = (
      node.type === '@n8n/n8n-nodes-langchain.agent' &&
      node.name === 'AI Agent' // Exact match for main AI Agent
    );
    
    if (isMainAIAgentNode) {
      console.log(`✅ Found main AI Agent node: "${node.name}" (${node.type})`);
      console.log('Current parameters:', JSON.stringify(node.parameters, null, 2));
      
      // Update the system message in the AI Agent parameters
      // Based on the Duplicator workflow, system message is in options.systemMessage
      return {
        ...node,
        parameters: {
          ...node.parameters,
          options: {
            ...node.parameters.options,
            systemMessage: systemMessage
          }
        }
      };
    }
    return node;
  });
  
  // Update the workflow - only send the properties that n8n expects
  // Note: 'active' is read-only and cannot be updated via PUT
  return n8nRequest(`/workflows/${workflowId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: workflow.name,
      nodes: updatedNodes,
      connections: workflow.connections,
      settings: workflow.settings || {},
      staticData: workflow.staticData || {}
    })
  });
}

/**
 * Update Fusion Chat Model nodes in n8n workflow
 */
export async function updateN8nWorkflowModel(
  workflowId: string, 
  model: string
): Promise<N8nWorkflowResponse> {
  // Get current workflow
  const workflow = await getN8nWorkflow(workflowId);
  
  // Debug: Log all nodes to understand the structure
  console.log('🔍 Available nodes in workflow:');
  workflow.nodes.forEach((node: any, index: number) => {
    console.log(`  ${index + 1}. Name: "${node.name}", Type: "${node.type}"`);
  });
  
  // Find and update Fusion Chat Model nodes
  const updatedNodes = workflow.nodes.map((node: any) => {
    const isFusionChatModel = node.type === 'CUSTOM.fusionChatModel';
    
    if (isFusionChatModel) {
      console.log(`✅ Found Fusion Chat Model node: "${node.name}" (${node.type})`);
      console.log('Current model:', node.parameters.model);
      
      // Update the model parameter
      return {
        ...node,
        parameters: {
          ...node.parameters,
          model: model
        }
      };
    }
    return node;
  });
  
  // Update the workflow - only send the properties that n8n expects
  return n8nRequest(`/workflows/${workflowId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: workflow.name,
      nodes: updatedNodes,
      connections: workflow.connections,
      settings: workflow.settings || {},
      staticData: workflow.staticData || {}
    })
  });
}

/**
 * Inject timing thresholds into Code node template
 */
function injectTimingThresholds(codeTemplate: string, thresholds: {
  assigneeThreshold: number;
  teamThreshold: number;
  escalationThreshold: number;
}): string {
  return codeTemplate
    .replace('{{ASSIGNEE_THRESHOLD}}', thresholds.assigneeThreshold.toString())
    .replace('{{TEAM_THRESHOLD}}', thresholds.teamThreshold.toString())
    .replace('{{ESCALATION_THRESHOLD}}', thresholds.escalationThreshold.toString());
}

/**
 * Update timing thresholds and escalation configuration in n8n workflow
 */
export async function updateN8nWorkflowTimingThresholds(
  workflowId: string,
  config: {
    assigneeThreshold: number;
    teamThreshold: number;
    escalationThreshold: number;
    escalationContact?: string;
    escalationMessage?: string;
  }
): Promise<N8nWorkflowResponse> {
  // Get current workflow
  const workflow = await getN8nWorkflow(workflowId);
  
  // Debug: Log all nodes to understand the structure
  console.log('🔍 Available nodes in workflow:');
  workflow.nodes.forEach((node: any, index: number) => {
    console.log(`  ${index + 1}. Name: "${node.name}", Type: "${node.type}"`);
  });
  
  // Update multiple nodes: Code, Filter, and HTTP Notify Supervisor
  const updatedNodes = workflow.nodes.map((node: any) => {
    // 1. Update Code node with timing thresholds
    const isCodeNode = node.name === 'Code' && node.type === 'n8n-nodes-base.code';
    if (isCodeNode) {
      console.log(`✅ Found Code node: "${node.name}" (${node.type})`);
      
      const codeTemplate = `const conv = {
  account_id: $input.first().json.account_id,
  conversation_id: $input.first().json.conversation_id,
  message_type: $input.first().json.message_type,
  user_name: $input.first().json.user_name,
  user_email: $input.first().json.user_email,
  user_messages: $input.first().json.user_messages,
  assignee_id: $input.first().json.assignee_id,
  team_id: $input.first().json.team_id,
  unread_count: $input.first().json.unread_count,
  waiting_since: $input.first().json.waiting_since,
  agent_last_seen_at: $input.first().json.agent_last_seen_at,
  contact_last_seen_at: $input.first().json.contact_last_seen_at,
  last_activity_at: $input.first().json.last_activity_at,
};

// Current timestamp
const now = Math.floor(Date.now() / 1000);

// Elapsed time calcs
const elapsed_since_agent = conv.agent_last_seen_at ? now - conv.agent_last_seen_at : null;
const waiting_time = conv.waiting_since ? now - conv.waiting_since : null;

// Fallback: treat agent_last_seen as proxy for human reply
const elapsed_since_human_reply = elapsed_since_agent;

// Decision logic
let decision = "reply";

// Timing thresholds (injected by Voxe)
const ASSIGNEE_THRESHOLD = {{ASSIGNEE_THRESHOLD}}; // seconds
const TEAM_THRESHOLD = {{TEAM_THRESHOLD}}; // seconds
const ESCALATION_THRESHOLD = {{ESCALATION_THRESHOLD}}; // seconds

if (conv.assignee_id) {
  if (elapsed_since_human_reply !== null && elapsed_since_human_reply < ASSIGNEE_THRESHOLD) {
    decision = "silent";
  } else if (elapsed_since_human_reply !== null && elapsed_since_human_reply >= ASSIGNEE_THRESHOLD) {
    decision = "holding";
  }
} else if (conv.team_id) {
  if (elapsed_since_human_reply !== null && elapsed_since_human_reply < TEAM_THRESHOLD) {
    decision = "silent";
  } else if (elapsed_since_human_reply !== null && elapsed_since_human_reply >= TEAM_THRESHOLD) {
    decision = "holding";
  }
}

return [{
  json: {
    ...conv,
    decision,
    elapsed_since_agent,
    elapsed_since_human_reply,
    waiting_time,
    timestamp: now,
  },
}];`;

      const updatedCode = injectTimingThresholds(codeTemplate, config);
      
      console.log(`✅ Updated Code node with thresholds:`, {
        assignee: config.assigneeThreshold,
        team: config.teamThreshold,
        escalation: config.escalationThreshold
      });
      
      return {
        ...node,
        parameters: {
          ...node.parameters,
          jsCode: updatedCode
        }
      };
    }

    // 2. Update Filter node with escalation threshold
    const isFilterNode = node.name === 'Filter' && node.type === 'n8n-nodes-base.filter';
    if (isFilterNode) {
      console.log(`✅ Found Filter node: "${node.name}" (${node.type})`);
      
      return {
        ...node,
        parameters: {
          ...node.parameters,
          conditions: {
            ...node.parameters.conditions,
            conditions: node.parameters.conditions.conditions.map((condition: any) => {
              if (condition.leftValue === "={{ $('Switch2').item.json.waiting_time }}") {
                return {
                  ...condition,
                  rightValue: config.escalationThreshold
                };
              }
              return condition;
            })
          }
        }
      };
    }

    // 3. Update HTTP Notify Supervisor node with escalation contact and message
    const isSupervisorNode = node.name === 'HTTP Notify Supervisor' && node.type === 'n8n-nodes-base.httpRequest';
    if (isSupervisorNode && config.escalationContact) {
      console.log(`✅ Found HTTP Notify Supervisor node: "${node.name}" (${node.type})`);
      
      const updatedJsonBody = `{
  "content": "[@${config.escalationContact}](mention://user/2/${encodeURIComponent(config.escalationContact)}) Chat #{{ $('Edit Fields').item.json.conversation_id }} has been waiting for {{ Math.round(($('Switch2').item.json.waiting_time / 60) * 10) / 10 }} minutes without a response.${config.escalationMessage ? ` - ${config.escalationMessage}` : ''}",
  "private": true
}`;

      return {
        ...node,
        parameters: {
          ...node.parameters,
          jsonBody: `=${updatedJsonBody}`
        }
      };
    }

    return node;
  });
  
  // Update the workflow - only send the properties that n8n expects
  return n8nRequest(`/workflows/${workflowId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: workflow.name,
      nodes: updatedNodes,
      connections: workflow.connections,
      settings: workflow.settings || {},
      staticData: workflow.staticData || {}
    })
  });
}

