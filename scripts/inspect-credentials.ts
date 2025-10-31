/**
 * Script to inspect existing credentials to understand the correct format
 */

import { config } from 'dotenv';
config();

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.sost.work';
const N8N_API_KEY = process.env.N8N_API_KEY;

async function inspectExistingCredentials() {
  try {
    console.log('🔍 Inspecting existing credentials to understand format...');
    
    // Try different endpoints to get credentials
    const endpoints = [
      '/api/v1/credentials',
      '/api/credentials',
      '/credentials'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`\n📡 Trying endpoint: ${endpoint}`);
        
        const response = await fetch(`${N8N_BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json',
          },
        });

        console.log(`📊 Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Success! Found ${Array.isArray(data) ? data.length : data.data?.length || 0} credentials`);
          
          if (data.data && data.data.length > 0) {
            console.log(`\n📋 Sample credential structure:`);
            console.log(JSON.stringify(data.data[0], null, 2));
          } else if (Array.isArray(data) && data.length > 0) {
            console.log(`\n📋 Sample credential structure:`);
            console.log(JSON.stringify(data[0], null, 2));
          }
          break;
        } else {
          const errorText = await response.text();
          console.log(`❌ Error: ${errorText}`);
        }
      } catch (error) {
        console.log(`❌ Request failed: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Failed to inspect credentials:', error);
  }
}

inspectExistingCredentials();
