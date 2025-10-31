/**
 * Debug: Check credential nodesAccess vs workflow node names
 */

import { config } from 'dotenv';
config();

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.sost.work';
const N8N_API_KEY = process.env.N8N_API_KEY;

async function debugCredentialMismatch() {
  try {
    console.log('🔍 Debugging credential nodesAccess vs workflow node names...');
    
    const CREDENTIAL_ID = 'd3v3QmPX9UruvStN';
    const WORKFLOW_ID = 'mhwfuN8ZYaHmlQHs';
    
    // Get the workflow to see actual node names
    console.log(`\n📋 Getting workflow: ${WORKFLOW_ID}`);
    const workflowResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
      },
    });

    if (workflowResponse.ok) {
      const workflow = await workflowResponse.json();
      const fusionNodes = workflow.nodes.filter((node: any) => node.type === 'CUSTOM.fusionChatModel');
      
      console.log(`\n🔍 Workflow Fusion nodes:`);
      fusionNodes.forEach((node: any) => {
        console.log(`   - Node Name: "${node.name}"`);
        console.log(`   - Node Type: ${node.type}`);
        console.log(`   - Credentials: ${JSON.stringify(node.credentials)}`);
        console.log('');
      });
    }

    // Try to get credential info (even though GET might not work)
    console.log(`\n🔍 Attempting to get credential: ${CREDENTIAL_ID}`);
    try {
      const credentialResponse = await fetch(`${N8N_BASE_URL}/api/v1/credentials/${CREDENTIAL_ID}`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
        },
      });

      if (credentialResponse.ok) {
        const credential = await credentialResponse.json();
        console.log(`✅ Credential nodesAccess:`);
        console.log(JSON.stringify(credential.nodesAccess, null, 2));
      } else {
        console.log(`❌ Cannot get credential details: ${credentialResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Error getting credential: ${error}`);
    }

    console.log('\n🎯 Analysis:');
    console.log('The issue is likely that:');
    console.log('1. Credential was created with nodesAccess: ["Fusionsubacountid-18-1", "Fusionsubacountid-18-2"]');
    console.log('2. But workflow nodes are named: "Fusionsubacountid-id-1", "Fusionsubacountid-id-2"');
    console.log('3. The names don\'t match, so n8n doesn\'t apply the credential restrictions');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugCredentialMismatch();
