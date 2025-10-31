/**
 * Verify: Check n8n credential and workflow status
 */

import { config } from 'dotenv';
config();

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.sost.work';
const N8N_API_KEY = process.env.N8N_API_KEY;

async function verifyN8nStatus() {
  try {
    console.log('🔍 Verifying n8n credential and workflow status...');
    
    const CREDENTIAL_ID = 'd3v3QmPX9UruvStN';
    const WORKFLOW_ID = 'mhwfuN8ZYaHmlQHs';
    
    // Check if credential exists in n8n
    console.log(`\n📋 Checking credential: ${CREDENTIAL_ID}`);
    const credentialResponse = await fetch(`${N8N_BASE_URL}/api/v1/credentials/${CREDENTIAL_ID}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
      },
    });

    if (credentialResponse.ok) {
      const credential = await credentialResponse.json();
      console.log(`✅ Credential exists in n8n:`);
      console.log(`   Name: ${credential.name}`);
      console.log(`   Type: ${credential.type}`);
      console.log(`   nodesAccess: ${JSON.stringify(credential.nodesAccess, null, 2)}`);
    } else {
      console.log(`❌ Credential not found: ${credentialResponse.status}`);
    }

    // Check workflow Fusion nodes
    console.log(`\n📋 Checking workflow: ${WORKFLOW_ID}`);
    const workflowResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
      },
    });

    if (workflowResponse.ok) {
      const workflow = await workflowResponse.json();
      const fusionNodes = workflow.nodes.filter((node: any) => node.type === 'CUSTOM.fusionChatModel');
      
      console.log(`✅ Workflow has ${fusionNodes.length} Fusion nodes:`);
      fusionNodes.forEach((node: any) => {
        console.log(`   - ${node.name}: credentials = ${JSON.stringify(node.credentials)}`);
      });
    } else {
      console.log(`❌ Workflow not found: ${workflowResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyN8nStatus();
