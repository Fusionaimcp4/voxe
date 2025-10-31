/**
 * Test: Update workflow mhwfuN8ZYaHmlQHs to use credential 6LCt5ypnvtAHPRqC
 */

import { config } from 'dotenv';
config();

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.sost.work';
const N8N_API_KEY = process.env.N8N_API_KEY;

async function updateWorkflowCredential() {
  try {
    console.log('🧪 Updating workflow mhwfuN8ZYaHmlQHs to use credential 6LCt5ypnvtAHPRqC...');
    
    const WORKFLOW_ID = 'mhwfuN8ZYaHmlQHs';
    const CREDENTIAL_ID = '6LCt5ypnvtAHPRqC';
    const CREDENTIAL_NAME = 'Fusionsubacountid-18';
    
    // Step 1: Get the current workflow
    console.log('\n🔍 Getting current workflow...');
    const workflowResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
      },
    });
    
    if (!workflowResponse.ok) {
      console.log(`❌ Failed to get workflow: ${workflowResponse.status}`);
      return;
    }
    
    const workflow = await workflowResponse.json();
    console.log(`✅ Got workflow: ${workflow.name}`);
    
    // Step 2: Update Fusion nodes to use the new credential
    console.log('\n🔧 Updating Fusion nodes with new credential...');
    let updatedNodes = 0;
    
    workflow.nodes.forEach((node: any) => {
      if (node.type === 'CUSTOM.fusionChatModel') {
        console.log(`   Updating node: ${node.name}`);
        node.credentials = {
          fusionApi: {
            id: CREDENTIAL_ID,
            name: CREDENTIAL_NAME
          }
        };
        updatedNodes++;
      }
    });
    
    console.log(`✅ Updated ${updatedNodes} Fusion nodes`);
    
    // Step 3: Update the workflow
    console.log('\n💾 Updating workflow...');
    const workflowUpdateData = {
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings
    };
    
    const updateResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY,
      },
      body: JSON.stringify(workflowUpdateData),
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.log(`❌ Failed to update workflow: ${errorText}`);
      return;
    }
    
    console.log(`✅ Successfully updated workflow ${WORKFLOW_ID}`);
    console.log(`   Using credential: ${CREDENTIAL_NAME} (${CREDENTIAL_ID})`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

updateWorkflowCredential();
