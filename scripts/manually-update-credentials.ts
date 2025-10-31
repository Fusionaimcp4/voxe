/**
 * Test: Manually update workflow u0P4WLTZJPIoxFyw credentials
 */

import { config } from 'dotenv';
config();

import { n8nCredentialService } from '../lib/n8n-credentials';

async function manuallyUpdateCredentials() {
  try {
    console.log('🔧 Manually updating credentials for workflow u0P4WLTZJPIoxFyw...');
    
    const WORKFLOW_ID = 'u0P4WLTZJPIoxFyw';
    const USER_ID = 'cmgv0uje00006ifbc7m8ke4hv'; // service@mcp4.ai
    
    console.log(`\n📋 Updating workflow: ${WORKFLOW_ID}`);
    console.log(`👤 For user: ${USER_ID}`);
    
    // This should reuse the existing credential since user already has one
    await n8nCredentialService.updateWorkflowCredential(WORKFLOW_ID, USER_ID);
    
    console.log('\n✅ Manual update completed!');
    console.log('Check the workflow in n8n to see if credentials were updated.');
    
  } catch (error) {
    console.error('❌ Manual update failed:', error);
  }
}

manuallyUpdateCredentials();
