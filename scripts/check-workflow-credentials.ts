/**
 * Script to check the current state of the workflow and its credentials
 */

import { config } from 'dotenv';
config();

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.sost.work';
const N8N_API_KEY = process.env.N8N_API_KEY;
const TEST_WORKFLOW_ID = 'mhwfuN8ZYaHmlQHs';

async function checkWorkflowCredentials() {
  try {
    console.log('🔍 Checking current workflow credentials...');
    console.log(`📋 Workflow ID: ${TEST_WORKFLOW_ID}`);
    
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
    
    // Check Fusion nodes and their credentials
    const fusionNodes = workflow.nodes.filter((node: any) => node.type === 'CUSTOM.fusionChatModel');
    
    console.log(`\n🔍 Found ${fusionNodes.length} Fusion nodes:`);
    
    fusionNodes.forEach((node: any, index: number) => {
      console.log(`\n${index + 1}. Node: ${node.name}`);
      console.log(`   ID: ${node.id}`);
      console.log(`   Type: ${node.type}`);
      
      if (node.credentials && node.credentials.fusionApi) {
        console.log(`   ✅ Has credentials:`);
        console.log(`      ID: ${node.credentials.fusionApi.id}`);
        console.log(`      Name: ${node.credentials.fusionApi.name}`);
      } else {
        console.log(`   ❌ No credentials found`);
      }
    });

  } catch (error) {
    console.error('❌ Failed to check workflow:', error);
  }
}

checkWorkflowCredentials();
