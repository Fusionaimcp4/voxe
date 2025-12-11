/**
 * Update RAG (Retrieve Knowledge Base Context) node settings in n8n workflow
 */
import { getN8nWorkflow } from './n8n-api';
import { prisma } from '@/lib/prisma';

interface N8nWorkflowResponse {
  id: string;
  name: string;
  active: boolean;
  nodes: any[];
  connections: any;
  settings?: any;
  staticData?: any;
}

/**
 * Get n8n API configuration
 */
function getN8nConfig() {
  const baseUrl = process.env.N8N_BASE_URL || 'https://n8n.sost.work';
  const apiKey = process.env.N8N_API_KEY;
  
  if (!apiKey) {
    throw new Error('N8N_API_KEY environment variable is required');
  }
  
  return { baseUrl, apiKey };
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
        throw error;
      }
      
      const waitTime = Math.pow(2, attempt - 1) * 1000;
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

export async function updateN8nWorkflowRAGSettings(
  workflowId: string,
  ragSettings: {
    retrievalLimit: number;
    similarityThreshold: number;
    ragApiUrl?: string; // Optional: defaults to ngrok URL or localhost
  }
): Promise<N8nWorkflowResponse> {
  console.log(`🔄 Updating RAG settings for workflow ${workflowId}...`);
  
  // Get current workflow
  const workflow = await getN8nWorkflow(workflowId);
  
  // Debug: Log all nodes to find the RAG tool
  console.log('🔍 Available nodes in workflow:');
  workflow.nodes.forEach((node: any, index: number) => {
    console.log(`  ${index + 1}. Name: "${node.name}", Type: "${node.type}"`);
  });
  
  // Find and update "Retrieve Knowledge Base Context" node
  const updatedNodes = workflow.nodes.map((node: any) => {
    const isRAGNode = (node.name === 'Retrieve Knowledge Base Context' || 
                       node.name.includes('Knowledge Base')) && 
                      node.type === 'n8n-nodes-base.httpRequestTool';
    
    if (isRAGNode) {
      console.log(`✅ Found RAG node: "${node.name}" (${node.type})`);
      console.log('Current parameters:', JSON.stringify(node.parameters, null, 2));
      
      // Determine RAG API URL (use provided or extract from current config)
      let apiUrl = ragSettings.ragApiUrl;
      
      if (!apiUrl && node.parameters.url) {
        // Extract base URL from current config
        const currentUrl = node.parameters.url;
        if (typeof currentUrl === 'string') {
          apiUrl = currentUrl;
        }
      }
      
      // Fallback to default ngrok URL pattern
      if (!apiUrl) {
        apiUrl = 'https://ac691440db0c.ngrok-free.app/api/rag/retrieve';
        console.log('⚠️  No URL provided, using default ngrok pattern');
      }
      
      // Create updated JSON body with proper n8n expression syntax
      // Use the correct field name from AI Agent: user_messages
      const updatedJsonBody = `={
  "query": "={{ $json.user_messages }}",
  "workflowId": "${workflowId}",
  "limit": ${ragSettings.retrievalLimit},
  "similarityThreshold": ${ragSettings.similarityThreshold}
}`;
      
      console.log(`✅ Updating RAG node with:`, {
        url: apiUrl,
        limit: ragSettings.retrievalLimit,
        threshold: ragSettings.similarityThreshold,
        workflowId: workflowId
      });
      
      return {
        ...node,
        parameters: {
          ...node.parameters,
          url: apiUrl,
          jsonBody: updatedJsonBody,
          method: 'POST',
          sendBody: true,
          specifyBody: 'json',
          sendHeaders: true,
          headerParameters: {
            parameters: [
              {
                name: 'Content-Type',
                value: 'application/json'
              }
            ]
          }
        }
      };
    }
    return node;
  });
  
  // Check if we actually found and updated a RAG node
  const ragNodeFound = updatedNodes.some((node: any, index: number) => 
    workflow.nodes[index] !== node && 
    (node.name === 'Retrieve Knowledge Base Context' || node.name.includes('Knowledge Base'))
  );
  
  if (!ragNodeFound) {
    console.warn('⚠️  WARNING: No RAG node found in workflow. Skipping update.');
    console.log('💡 Make sure the node is named "Retrieve Knowledge Base Context"');
    return workflow; // Return unchanged workflow
  }
  
  // Update the workflow
  console.log('🔄 Sending updated workflow to n8n...');
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
 * Toggle disabled state of RAG (Knowledge Base) nodes in n8n workflows
 * @param userId - User ID to find all workflows
 * @param disabled - true to disable nodes, false to enable
 */
export async function toggleN8nRAGNodes(userId: string, disabled: boolean): Promise<void> {
  if (!prisma) {
    throw new Error('Prisma client not initialized');
  }

  // Get all workflows for this user
  const workflows = await prisma.workflow.findMany({
    where: {
      userId: userId,
      n8nWorkflowId: { not: null },
    },
    select: {
      n8nWorkflowId: true,
    },
  });

  console.log(`🔄 ${disabled ? 'Disabling' : 'Enabling'} RAG nodes in ${workflows.length} workflows...`);

  const { baseUrl: n8nBaseUrl, apiKey: n8nApiKey } = (() => {
    const baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    const apiKey = process.env.N8N_API_KEY || '';
    return { baseUrl, apiKey };
  })();

  for (const workflow of workflows) {
    if (!workflow.n8nWorkflowId) continue;

    try {
      // Get current workflow
      const n8nWorkflow = await getN8nWorkflow(workflow.n8nWorkflowId);

      // Find and update RAG nodes
      const updatedNodes = n8nWorkflow.nodes.map((node: any) => {
        const isRAGNode = 
          (node.name === 'Retrieve Knowledge Base Context' || 
           node.name.includes('Knowledge Base') ||
           node.name.includes('RAG')) && 
          (node.type === 'n8n-nodes-base.httpRequestTool' ||
           node.type === 'n8n-nodes-base.httpRequest');

        if (isRAGNode) {
          console.log(`  ${disabled ? 'Disabling' : 'Enabling'} node: "${node.name}"`);
          return {
            ...node,
            disabled: disabled,
          };
        }

        return node;
      });

      // Check if any nodes were updated
      const hasChanges = updatedNodes.some((node: any, index: number) => 
        node.disabled !== n8nWorkflow.nodes[index]?.disabled
      );

      if (hasChanges) {
        // Update workflow in n8n
        const response = await fetch(`${n8nBaseUrl}/api/v1/workflows/${workflow.n8nWorkflowId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-N8N-API-KEY': n8nApiKey,
          },
          body: JSON.stringify({
            name: n8nWorkflow.name,
            nodes: updatedNodes,
            connections: n8nWorkflow.connections,
            settings: n8nWorkflow.settings || {},
            staticData: n8nWorkflow.staticData || {}
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Failed to update workflow ${workflow.n8nWorkflowId}: ${errorText}`);
          // Continue with other workflows even if one fails
        } else {
          console.log(`✅ Updated workflow ${workflow.n8nWorkflowId}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error updating workflow ${workflow.n8nWorkflowId}:`, error);
      // Continue with other workflows even if one fails
    }
  }

  console.log(`✅ ${disabled ? 'Disabled' : 'Enabled'} RAG nodes in ${workflows.length} workflows`);
}

