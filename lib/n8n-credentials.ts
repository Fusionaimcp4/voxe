import { FusionSubAccountService } from '@/lib/fusion-sub-accounts';
import { prisma } from '@/lib/prisma';
import { EncryptionService } from '@/lib/encryption';

export interface N8nCredentialResponse {
  id: string;
  name: string;
  type: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Service for managing n8n credentials
 * One credential per user, reused across all workflows
 */
export class N8nCredentialService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.apiKey = process.env.N8N_API_KEY || '';
  }

  /**
   * Create a Fusion API credential for a user
   * Uses nodeType/date format for security restrictions
   * API keys are never stored - only passed directly to n8n
   */
  async createFusionCredential(userId: string): Promise<string> {
    try {
      console.log(`🆕 [Credential Create] Starting credential creation for user: ${userId}`);
      
      if (!prisma) {
        throw new Error('Prisma client not initialized');
      }

      // Get user's Fusion sub-account ID
      console.log(`📥 [Credential Create] Fetching user Fusion sub-account...`);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fusionSubAccountId: true }
      });

      if (!user?.fusionSubAccountId) {
        console.error(`❌ [Credential Create] User does not have Fusion sub-account`);
        throw new Error('User does not have a Fusion sub-account');
      }

      const credentialName = `Fusionsubacountid-${user.fusionSubAccountId}`;
      console.log(`✅ [Credential Create] User Fusion sub-account ID: ${user.fusionSubAccountId}`);
      console.log(`   Credential name will be: ${credentialName}`);
      
      // Generate API key for the user (never stored)
      console.log(`🔑 [Credential Create] Generating Fusion API key for sub-account ${user.fusionSubAccountId}...`);
      const apiKeyResponse = await FusionSubAccountService.createApiKey(parseInt(user.fusionSubAccountId), credentialName);
      const apiKey = apiKeyResponse.apiKey;
      console.log(`✅ [Credential Create] API key generated: ${apiKey.substring(0, 20)}...`);

      // Create nodesAccess with nodeType/date format for security
      const currentDate = new Date().toISOString();
      const nodesAccess = [
        {
          nodeType: `${credentialName}-1`,
          date: currentDate
        },
        {
          nodeType: `${credentialName}-2`,
          date: currentDate
        }
      ];
      console.log(`🔒 [Credential Create] Node access restrictions: ${nodesAccess.map(n => n.nodeType).join(', ')}`);

      // Create the credential in n8n
      const credentialData = {
        name: credentialName,
        type: 'fusionApi',
        data: {
          apiKey: apiKey, // API key passed directly, never stored
          baseUrl: process.env.FUSION_BASE_URL || 'https://api.mcp4.ai',
          allowedDomains: 'All'
        },
        nodesAccess: nodesAccess
      };

      console.log(`📤 [Credential Create] Creating credential in n8n: ${this.baseUrl}/api/v1/credentials`);
      console.log(`   Credential name: ${credentialName}`);
      console.log(`   Type: fusionApi`);
      console.log(`   Base URL: ${credentialData.data.baseUrl}`);

      const response = await fetch(`${this.baseUrl}/api/v1/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': this.apiKey,
        },
        body: JSON.stringify(credentialData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [Credential Create] Failed to create credential: ${response.status} - ${errorText}`);
        throw new Error(`Failed to create n8n credential: ${response.status} ${errorText}`);
      }

      const credential: N8nCredentialResponse = await response.json();
      console.log(`✅ [Credential Create] Successfully created Fusion credential in n8n`);
      console.log(`   Credential ID: ${credential.id}`);
      console.log(`   Credential name: ${credential.name}`);
      console.log(`   Created at: ${credential.createdAt}`);

      return credential.id;
    } catch (error) {
      console.error(`❌ [Credential Create] Error creating Fusion credential:`, error);
      if (error instanceof Error) {
        console.error(`   Error message: ${error.message}`);
        console.error(`   Stack trace: ${error.stack}`);
      }
      throw error;
    }
  }

  /**
   * Get or create Fusion credential for a user
   * Reuses existing credential if available, creates new one if needed
   */
  async getOrCreateFusionCredential(userId: string): Promise<string> {
    try {
      console.log(`🔍 [Credential Get/Create] Starting for user: ${userId}`);
      
      if (!prisma) {
        throw new Error('Prisma client not initialized');
      }

      // Get user's existing credential info
      console.log(`📥 [Credential Get/Create] Fetching user from database...`);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          fusionSubAccountId: true,
          fusionCredentialName: true,
          fusionCredentialId: true
        }
      });

      if (!user?.fusionSubAccountId) {
        console.error(`❌ [Credential Get/Create] User does not have Fusion sub-account`);
        throw new Error('User does not have a Fusion sub-account');
      }

      const credentialName = `Fusionsubacountid-${user.fusionSubAccountId}`;
      console.log(`✅ [Credential Get/Create] User has Fusion sub-account: ${user.fusionSubAccountId}`);

      // Check if user already has a credential
      if (user.fusionCredentialId) {
        try {
          console.log(`🔍 [Credential Get/Create] User has encrypted credential ID in database`);
          console.log(`   Encrypted ID: ${user.fusionCredentialId.substring(0, 20)}...`);
          console.log(`   Credential name: ${user.fusionCredentialName || 'N/A'}`);
          
          // Decrypt the credential ID from database
          console.log(`🔓 [Credential Get/Create] Decrypting credential ID...`);
          const decryptedCredentialId = EncryptionService.decrypt(user.fusionCredentialId);
          console.log(`   Decrypted ID: ${decryptedCredentialId}`);
          console.log(`✅ [Credential Get/Create] Reusing existing credential: ${credentialName} (${decryptedCredentialId})`);
          return decryptedCredentialId;
        } catch (error) {
          console.log(`❌ [Credential Get/Create] Failed to decrypt credential: ${error}`);
          console.log(`   Will create new credential instead`);
        }
      } else {
        console.log(`❌ [Credential Get/Create] User does not have credential ID in database`);
        console.log(`   Will create new credential`);
      }

      // Create new credential
      console.log(`🆕 [Credential Get/Create] Creating new credential for user ${userId}...`);
      const credentialId = await this.createFusionCredential(userId);
      console.log(`✅ [Credential Get/Create] Credential created successfully, ID: ${credentialId}`);
      
      // Store encrypted credential ID in database
      console.log(`💾 [Credential Get/Create] Storing encrypted credential ID in database...`);
      try {
        const encryptedId = EncryptionService.encrypt(credentialId);
        console.log(`   Encrypted credential ID (first 20 chars): ${encryptedId.substring(0, 20)}...`);
        
        await prisma.user.update({
          where: { id: userId },
          data: { 
            fusionCredentialId: encryptedId,
            fusionCredentialName: credentialName
          }
        });
        
        console.log(`✅ [Credential Get/Create] Stored encrypted credential ID for user ${userId}`);
        console.log(`   Credential name: ${credentialName}`);
        console.log(`   Credential ID: ${credentialId}`);
      } catch (dbError) {
        console.error(`❌ [Credential Get/Create] Failed to store credential in database:`, dbError);
        if (dbError instanceof Error) {
          console.error(`   Error message: ${dbError.message}`);
          console.error(`   Stack trace: ${dbError.stack}`);
        }
        // Still return the credential ID even if database storage fails
        // The credential was created in n8n, so it can still be used
        console.log(`⚠️  [Credential Get/Create] Continuing despite database storage failure`);
      }
      
      return credentialId;
      
    } catch (error) {
      console.error(`❌ [Credential Get/Create] Error getting or creating Fusion credential:`, error);
      if (error instanceof Error) {
        console.error(`   Error message: ${error.message}`);
        console.error(`   Stack trace: ${error.stack}`);
      }
      throw error;
    }
  }

  /**
   * Update workflow nodes to use user-specific Fusion credentials
   * Reuses existing credential or creates new one
   */
  async updateWorkflowCredential(workflowId: string, userId: string): Promise<void> {
    try {
      console.log(`🔄 [Credential Update] Starting update for workflow ${workflowId} (user: ${userId})`);

      // Get or create credential for this user
      console.log(`🔍 [Credential Update] Getting or creating Fusion credential for user ${userId}...`);
      const credentialId = await this.getOrCreateFusionCredential(userId);
      console.log(`✅ [Credential Update] Got credential ID: ${credentialId}, continuing to workflow update...`);
      
      // Get user info for credential name
      if (!prisma) {
        throw new Error('Prisma client not initialized');
      }

      console.log(`📥 [Credential Update] Fetching user info from database for credential name...`);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fusionSubAccountId: true }
      });
      
      if (!user?.fusionSubAccountId) {
        console.error(`❌ [Credential Update] User ${userId} does not have Fusion sub-account ID`);
        throw new Error('User does not have a Fusion sub-account ID');
      }
      
      const credentialName = `Fusionsubacountid-${user.fusionSubAccountId}`;
      console.log(`✅ [Credential Update] Using credential: ${credentialName} (ID: ${credentialId})`);

      // Get the workflow from n8n
      console.log(`📥 [Credential Update] Fetching workflow from n8n: ${this.baseUrl}/api/v1/workflows/${workflowId}`);
      const workflowResponse = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.apiKey,
        },
      });

      if (!workflowResponse.ok) {
        const errorText = await workflowResponse.text().catch(() => 'Unknown error');
        console.error(`❌ [Credential Update] Failed to fetch workflow: ${workflowResponse.status} - ${errorText}`);
        throw new Error(`Failed to get workflow: ${workflowResponse.status} - ${errorText}`);
      }

      const workflow = await workflowResponse.json();
      console.log(`✅ [Credential Update] Workflow fetched successfully: "${workflow.name}"`);
      console.log(`📊 [Credential Update] Workflow has ${workflow.nodes?.length || 0} nodes`);

      // Log all node types for debugging
      console.log(`🔍 [Credential Update] All node types in workflow:`);
      const nodeTypesMap = new Map<string, number>();
      workflow.nodes?.forEach((node: any) => {
        const count = nodeTypesMap.get(node.type) || 0;
        nodeTypesMap.set(node.type, count + 1);
      });
      nodeTypesMap.forEach((count, type) => {
        console.log(`   - ${type}: ${count} node(s)`);
      });

      // Update Fusion nodes in the workflow
      let workflowUpdated = false;
      let fusionNodesFound = 0;
      let fusionNodesUpdated = 0;
      
      console.log(`🔍 [Credential Update] Searching for Fusion nodes (type: 'CUSTOM.fusionChatModel')...`);
      
      for (const node of workflow.nodes || []) {
        if (node.type === 'CUSTOM.fusionChatModel') {
          fusionNodesFound++;
          console.log(`   ✅ Found Fusion node #${fusionNodesFound}: "${node.name}" (ID: ${node.id})`);
          
          // Log current credentials if any
          if (node.credentials?.fusionApi) {
            console.log(`      Current credentials: ${node.credentials.fusionApi.name} (${node.credentials.fusionApi.id})`);
          } else {
            console.log(`      No existing credentials attached`);
          }
          
          console.log(`   🔧 Updating node credentials to: ${credentialName} (${credentialId})`);
          node.credentials = {
            fusionApi: {
              id: credentialId,
              name: credentialName
            }
          };
          workflowUpdated = true;
          fusionNodesUpdated++;
        }
      }

      if (fusionNodesFound === 0) {
        console.log(`⚠️  [Credential Update] No Fusion nodes found in workflow ${workflowId}`);
        console.log(`   Expected node type: 'CUSTOM.fusionChatModel'`);
        console.log(`   Available node types: ${Array.from(nodeTypesMap.keys()).join(', ')}`);
      } else {
        console.log(`✅ [Credential Update] Found ${fusionNodesFound} Fusion node(s), updated ${fusionNodesUpdated}`);
      }

      if (workflowUpdated) {
        console.log(`💾 [Credential Update] Preparing workflow update payload...`);
        // Prepare the workflow data for update
        const workflowUpdateData = {
          name: workflow.name,
          nodes: workflow.nodes,
          connections: workflow.connections,
          settings: workflow.settings
        };

        console.log(`📤 [Credential Update] Sending PUT request to update workflow in n8n...`);
        // Save the updated workflow
        const updateResponse = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-N8N-API-KEY': this.apiKey,
          },
          body: JSON.stringify(workflowUpdateData),
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error(`❌ [Credential Update] Failed to update workflow: ${updateResponse.status} - ${errorText}`);
          throw new Error(`Failed to update workflow: ${updateResponse.status} - ${errorText}`);
        }

        const updatedWorkflow = await updateResponse.json().catch(() => null);
        console.log(`✅ [Credential Update] Workflow ${workflowId} successfully updated in n8n`);
        console.log(`   Workflow name: "${updatedWorkflow?.name || workflow.name}"`);
        console.log(`   Fusion credentials set: ${credentialName} (${credentialId})`);
        console.log(`   Nodes updated: ${fusionNodesUpdated}`);
      } else {
        console.log(`⚠️  [Credential Update] No workflow update performed - no Fusion nodes found`);
        console.log(`   Workflow ID: ${workflowId}`);
        console.log(`   This means credentials were created but not attached to any nodes`);
      }
    } catch (error) {
      console.error(`❌ [Credential Update] Error updating workflow credential:`, error);
      if (error instanceof Error) {
        console.error(`   Error message: ${error.message}`);
        console.error(`   Stack trace: ${error.stack}`);
      }
      throw error;
    }
  }

  /**
   * Delete a credential (cleanup method)
   */
  async deleteCredential(credentialId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/credentials/${credentialId}`, {
        method: 'DELETE',
        headers: {
          'X-N8N-API-KEY': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete credential: ${response.status}`);
      }

      console.log(`✅ Deleted credential ${credentialId}`);
    } catch (error) {
      console.error('Failed to delete credential:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const n8nCredentialService = new N8nCredentialService();