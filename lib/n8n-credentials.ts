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
      if (!prisma) {
        throw new Error('Prisma client not initialized');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fusionSubAccountId: true }
      });

      if (!user?.fusionSubAccountId) {
        throw new Error('User does not have a Fusion sub-account');
      }

      const credentialName = `Fusionsubacountid-${user.fusionSubAccountId}`;
      
      // Generate API key for the user (never stored)
      const apiKeyResponse = await FusionSubAccountService.createApiKey(parseInt(user.fusionSubAccountId), credentialName);
      const apiKey = apiKeyResponse.apiKey;

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
        console.error(`Failed to create n8n credential: ${response.status} - ${errorText}`);
        throw new Error(`Failed to create n8n credential: ${response.status} ${errorText}`);
      }

      const credential: N8nCredentialResponse = await response.json();
      return credential.id;
    } catch (error) {
      console.error('Error creating Fusion credential:', error);
      throw error;
    }
  }

  /**
   * Get or create Fusion credential for a user
   * Reuses existing credential if available, creates new one if needed
   */
  async getOrCreateFusionCredential(userId: string): Promise<string> {
    try {
      if (!prisma) {
        throw new Error('Prisma client not initialized');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          fusionSubAccountId: true,
          fusionCredentialName: true,
          fusionCredentialId: true
        }
      });

      if (!user?.fusionSubAccountId) {
        throw new Error('User does not have a Fusion sub-account');
      }

      const credentialName = `Fusionsubacountid-${user.fusionSubAccountId}`;

      // Check if user already has a credential
      if (user.fusionCredentialId) {
        try {
          const decryptedCredentialId = EncryptionService.decrypt(user.fusionCredentialId);
          return decryptedCredentialId;
        } catch (error) {
          // Failed to decrypt, will create new credential
        }
      }

      // Create new credential
      const credentialId = await this.createFusionCredential(userId);
      
      // Store encrypted credential ID in database
      try {
        const encryptedId = EncryptionService.encrypt(credentialId);
        await prisma.user.update({
          where: { id: userId },
          data: { 
            fusionCredentialId: encryptedId,
            fusionCredentialName: credentialName
          }
        });
      } catch (dbError) {
        console.error('Failed to store credential in database:', dbError);
        // Still return the credential ID even if database storage fails
      }
      
      return credentialId;
    } catch (error) {
      console.error('Error getting or creating Fusion credential:', error);
      throw error;
    }
  }

  /**
   * Update workflow nodes to use user-specific Fusion credentials
   * Reuses existing credential or creates new one
   */
  async updateWorkflowCredential(workflowId: string, userId: string): Promise<void> {
    try {
      // Get or create credential for this user
      const credentialId = await this.getOrCreateFusionCredential(userId);
      
      // Get user info for credential name
      if (!prisma) {
        throw new Error('Prisma client not initialized');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fusionSubAccountId: true }
      });
      
      if (!user?.fusionSubAccountId) {
        throw new Error('User does not have a Fusion sub-account ID');
      }
      
      const credentialName = `Fusionsubacountid-${user.fusionSubAccountId}`;

      // Get the workflow from n8n
      const workflowResponse = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.apiKey,
        },
      });

      if (!workflowResponse.ok) {
        const errorText = await workflowResponse.text().catch(() => 'Unknown error');
        console.error(`Failed to fetch workflow: ${workflowResponse.status} - ${errorText}`);
        throw new Error(`Failed to get workflow: ${workflowResponse.status} - ${errorText}`);
      }

      const workflow = await workflowResponse.json();

      // Update Fusion nodes in the workflow
      // Support both node type formats:
      // - 'CUSTOM.fusionChatModel' (local/older format)
      // - 'n8n-nodes-fusion.fusionChatModel' (production package-based format)
      const fusionNodeTypes = [
        'CUSTOM.fusionChatModel',
        'n8n-nodes-fusion.fusionChatModel'
      ];
      
      let workflowUpdated = false;
      let fusionNodesUpdated = 0;
      
      for (const node of workflow.nodes || []) {
        const isFusionNode = fusionNodeTypes.includes(node.type);
        
        if (isFusionNode) {
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

      if (workflowUpdated) {
        // Prepare the workflow data for update
        const workflowUpdateData = {
          name: workflow.name,
          nodes: workflow.nodes,
          connections: workflow.connections,
          settings: workflow.settings
        };

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
          console.error(`Failed to update workflow: ${updateResponse.status} - ${errorText}`);
          throw new Error(`Failed to update workflow: ${updateResponse.status} - ${errorText}`);
        }
      } else {
        console.warn(`No Fusion nodes found in workflow ${workflowId}`);
      }
    } catch (error) {
      console.error('Error updating workflow credential:', error);
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