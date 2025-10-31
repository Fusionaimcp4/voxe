/**
 * Debug: Check user info for workflow u0P4WLTZJPIoxFyw
 */

import { config } from 'dotenv';
config();

import { prisma } from '../lib/prisma';

async function debugUserInfo() {
  try {
    console.log('🔍 Debugging user info for workflow u0P4WLTZJPIoxFyw...');
    
    // Find the workflow record
    const workflow = await prisma.workflow.findFirst({
      where: { 
        n8nWorkflowId: 'u0P4WLTZJPIoxFyw'
      },
      include: { 
        user: true,
        demo: true
      }
    });

    if (workflow) {
      console.log(`\n📋 Workflow Info:`);
      console.log(`   ID: ${workflow.id}`);
      console.log(`   n8nWorkflowId: ${workflow.n8nWorkflowId}`);
      console.log(`   Status: ${workflow.status}`);
      console.log(`   Demo Name: ${workflow.demo.businessName}`);
      
      console.log(`\n👤 User Info:`);
      console.log(`   Email: ${workflow.user.email}`);
      console.log(`   fusionSubAccountId: ${workflow.user.fusionSubAccountId}`);
      console.log(`   fusionCredentialName: ${workflow.user.fusionCredentialName}`);
      console.log(`   fusionCredentialId: ${workflow.user.fusionCredentialId ? 'ENCRYPTED' : 'null'}`);
      
      if (!workflow.user.fusionSubAccountId) {
        console.log(`\n❌ PROBLEM: User does not have fusionSubAccountId!`);
        console.log(`   This means updateWorkflowCredential() would fail with error:`);
        console.log(`   "User does not have a Fusion sub-account"`);
      } else {
        console.log(`\n✅ User has fusionSubAccountId: ${workflow.user.fusionSubAccountId}`);
      }
      
    } else {
      console.log('❌ No workflow found for n8nWorkflowId u0P4WLTZJPIoxFyw');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugUserInfo();
