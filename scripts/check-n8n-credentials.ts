/**
 * Test script to check existing n8n credentials
 */

import { config } from 'dotenv';
config();

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.sost.work';
const N8N_API_KEY = process.env.N8N_API_KEY;

async function checkExistingCredentials() {
  try {
    console.log('🔍 Checking existing n8n credentials...');
    
    const response = await fetch(`${N8N_BASE_URL}/api/v1/credentials`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get credentials: ${response.status}`);
    }

    const credentials = await response.json();
    console.log('📋 Found credentials:');
    
    credentials.data.forEach((cred: any) => {
      console.log(`- ${cred.name} (${cred.type})`);
      console.log(`  ID: ${cred.id}`);
      console.log(`  Data: ${JSON.stringify(cred.data, null, 2)}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Failed to check credentials:', error);
  }
}

checkExistingCredentials();
