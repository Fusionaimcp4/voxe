/**
 * Script to revert the workflow back to the original credential
 */

import { config } from 'dotenv';
config();

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.sost.work';
const N8N_API_KEY = process.env.N8N_API_KEY;
const TEST_WORKFLOW_ID = 'mhwfuN8ZYaHmlQHs';

async function revertWorkflowCredentials() {
  try {
    console.log('🔄 Reverting workflow credentials to original state...');
    console.log(`📋 Workflow ID: ${TEST_WORKFLOW_ID}`);
    
    // Get the workflow
    const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${TEST_WORKFLOW_ID}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get workflow: ${response.status}`);
    }

    const workflow = await response.json();
    console.log(`📝 Workflow Name: ${workflow.name}`);
    
    // Revert Fusion nodes back to original credential
    let workflowUpdated = false;
    
    for (const node of workflow.nodes) {
      if (node.type === 'CUSTOM.fusionChatModel') {
        console.log(`🔄 Reverting Fusion node: ${node.name}`);
        // Set back to original credential
        node.credentials = {
          fusionApi: {
            id: "aYAUUhRw5j73MQ76",
            name: "n8n new"
          }
        };
        workflowUpdated = true;
      }
    }

    if (workflowUpdated) {
      // Prepare the workflow data for update
      const workflowUpdateData = {
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings
      };

      // Save the reverted workflow
      const updateResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${TEST_WORKFLOW_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': N8N_API_KEY,
        },
        body: JSON.stringify(workflowUpdateData),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Failed to update workflow: ${updateResponse.status} - ${errorText}`);
      }

      console.log(`✅ Workflow ${TEST_WORKFLOW_ID} reverted successfully to original credentials`);
    } else {
      console.log(`No Fusion nodes found in workflow ${TEST_WORKFLOW_ID}`);
    }

  } catch (error) {
    console.error('❌ Failed to revert workflow:', error);
  }
}

revertWorkflowCredentials();
