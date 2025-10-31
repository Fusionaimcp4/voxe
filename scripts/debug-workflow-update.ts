/**
 * Debug: Check if workflow update actually saved the credential changes
 */

import { config } from 'dotenv';
config();

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.sost.work';
const N8N_API_KEY = process.env.N8N_API_KEY;

async function debugWorkflowUpdate() {
  try {
    console.log('🔍 Debugging if workflow update actually saved credential changes...');
    
    const WORKFLOW_ID = 'mhwfuN8ZYaHmlQHs';
    
    // Get the workflow to see current state
    console.log(`\n📋 Getting current workflow state: ${WORKFLOW_ID}`);
    const workflowResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
      },
    });

    if (workflowResponse.ok) {
      const workflow = await workflowResponse.json();
      const fusionNodes = workflow.nodes.filter((node: any) => node.type === 'CUSTOM.fusionChatModel');
      
      console.log(`\n🔍 Current Fusion nodes state:`);
      fusionNodes.forEach((node: any) => {
        console.log(`   - Node Name: "${node.name}"`);
        console.log(`   - Credentials: ${JSON.stringify(node.credentials)}`);
        console.log(`   - Has credentials: ${node.credentials?.fusionApi ? 'YES' : 'NO'}`);
        if (node.credentials?.fusionApi) {
          console.log(`   - Credential ID: ${node.credentials.fusionApi.id}`);
          console.log(`   - Credential Name: ${node.credentials.fusionApi.name}`);
        }
        console.log('');
      });
    } else {
      console.log(`❌ Failed to get workflow: ${workflowResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugWorkflowUpdate();
