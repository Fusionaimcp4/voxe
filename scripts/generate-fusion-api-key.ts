/**
 * Script to generate a Fusion API key for the user
 */

import { config } from 'dotenv';
config();

import { FusionSubAccountService } from '../lib/fusion-sub-accounts';

const TEST_USER_ID = 'service@mcp4.ai';
const FUSION_SUB_ACCOUNT_ID = 18;

async function generateApiKey() {
  try {
    console.log('🔑 Generating Fusion API key...');
    console.log(`👤 User: ${TEST_USER_ID}`);
    console.log(`🔢 Fusion Sub-Account ID: ${FUSION_SUB_ACCOUNT_ID}`);
    
    const apiKey = await FusionSubAccountService.createApiKey(FUSION_SUB_ACCOUNT_ID, `Fusionsubacountid-${FUSION_SUB_ACCOUNT_ID}`);
    
    console.log(`\n✅ Generated API Key:`);
    console.log(`📋 ${apiKey.apiKey}`);
    
    console.log(`\n📝 Next steps:`);
    console.log(`1. Go to n8n and create a new Fusion API credential`);
    console.log(`2. Name: Fusionsubacountid-18`);
    console.log(`3. API Key: ${apiKey.apiKey}`);
    console.log(`4. Base URL: https://api.mcp4.ai`);
    console.log(`5. Allowed Domains: All`);
    
  } catch (error) {
    console.error('❌ Failed to generate API key:', error);
  }
}

generateApiKey();
