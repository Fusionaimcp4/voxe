/**
 * Debug script to check user's Fusion sub-account status
 * and link to existing test data if needed
 */

import { config } from 'dotenv';
import { prisma } from '../lib/prisma';
import { FusionSubAccountService } from '../lib/fusion-sub-accounts';

// Load environment variables
config();

async function debugUserFusionStatus() {
  try {
    console.log('🔍 Debugging User Fusion Status...\n');

    // Get the test user email from our previous tests
    const testEmail = 'service@mcp4.ai';
    const fusionEmail = 'service.Voxe@mcp4.ai';

    console.log(`📧 Looking for user with email: ${testEmail}`);
    console.log(`🔗 Expected Fusion email: ${fusionEmail}\n`);

    // Find user in Voxe database
    const user = await prisma.user.findFirst({
      where: { email: testEmail },
      select: {
        id: true,
        email: true,
        fusionSubAccountId: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      console.log('❌ User not found in Voxe database');
      console.log('💡 You may need to create a user account first');
      return;
    }

    console.log('✅ User found in Voxe database:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Fusion Sub-Account ID: ${user.fusionSubAccountId || 'Not set'}\n`);

    if (!user.fusionSubAccountId) {
      console.log('🔍 User has no Fusion sub-account ID. Looking for existing Fusion user...');
      
      // Check if Fusion sub-account exists
      const existingFusionUser = await FusionSubAccountService.findExistingSubAccount(user.email);
      
      if (existingFusionUser) {
        console.log('✅ Found existing Fusion sub-account:');
        console.log(`   Fusion ID: ${existingFusionUser.id}`);
        console.log(`   Fusion Email: ${existingFusionUser.email}`);
        console.log(`   Display Name: ${existingFusionUser.display_name}`);
        console.log(`   Role: ${existingFusionUser.role}`);
        console.log(`   Created: ${existingFusionUser.createdAt}\n`);

        // Update Voxe user with Fusion sub-account ID
        console.log('🔗 Linking Voxe user to Fusion sub-account...');
        await prisma.user.update({
          where: { id: user.id },
          data: { fusionSubAccountId: existingFusionUser.id.toString() }
        });

        console.log('✅ Successfully linked user to Fusion sub-account!');
        
        // Get usage metrics
        console.log('\n📊 Fetching usage metrics...');
        const usageData = await FusionSubAccountService.getUsageMetrics(existingFusionUser.id);
        
        console.log('📈 Usage Metrics:');
        console.log(`   Total Spend: $${usageData.metrics.spend}`);
        console.log(`   Total Tokens: ${usageData.metrics.tokens.toLocaleString()}`);
        console.log(`   Total Requests: ${usageData.metrics.requests}`);
        console.log(`   Activity Logs: ${usageData.activity.length} entries\n`);

        if (usageData.activity.length > 0) {
          console.log('📋 Recent Activity:');
          usageData.activity.slice(0, 3).forEach((log, index) => {
            console.log(`   ${index + 1}. ${log.timestamp}: ${log.provider}/${log.model}`);
            console.log(`      Tokens: ${log.total_tokens}, Cost: $${log.llm_provider_cost}`);
          });
        }

      } else {
        console.log('❌ No existing Fusion sub-account found');
        console.log('💡 You may need to create a Fusion sub-account first');
      }
    } else {
      console.log('✅ User already has Fusion sub-account ID');
      
      // Get usage metrics
      console.log('\n📊 Fetching usage metrics...');
      const usageData = await FusionSubAccountService.getUsageMetrics(parseInt(user.fusionSubAccountId));
      
      console.log('📈 Usage Metrics:');
      console.log(`   Total Spend: $${usageData.metrics.spend}`);
      console.log(`   Total Tokens: ${usageData.metrics.tokens.toLocaleString()}`);
      console.log(`   Total Requests: ${usageData.metrics.requests}`);
      console.log(`   Activity Logs: ${usageData.activity.length} entries\n`);

      if (usageData.activity.length > 0) {
        console.log('📋 Recent Activity:');
        usageData.activity.slice(0, 3).forEach((log, index) => {
          console.log(`   ${index + 1}. ${log.timestamp}: ${log.provider}/${log.model}`);
          console.log(`      Tokens: ${log.total_tokens}, Cost: $${log.llm_provider_cost}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugUserFusionStatus();
