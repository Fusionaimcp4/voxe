import { FusionSubAccountService } from '@/lib/fusion-sub-accounts';
import { prisma } from '@/lib/prisma';
import { EncryptionService } from '@/lib/encryption';
import { decryptCalendarConfiguration } from '@/lib/integrations/calendar-service';
import { CalendarConfigurationGoogle as CalendarConfigType } from '@/lib/integrations/types';
import { decrypt as calendarDecrypt } from '@/lib/integrations/encryption';

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
   * Create a Google Calendar credential for a user
   * Stores OAuth tokens in n8n credential (n8n encrypts them)
   */
  async createGoogleCalendarCredential(
    userId: string,
    accessToken: string,
    refreshToken: string,
    accountEmail: string,
    calendarId: string,
    timezone: string,
    clientId?: string,
    clientSecret?: string
  ): Promise<{ credentialId: string; credentialName: string }> {
    try {
      if (!prisma) {
        throw new Error('Prisma client not initialized');
      }

      // Use userId directly for credential name (unique per user, like Fusion pattern)
      // This ensures each user gets their own credential
      const credentialName = `GoogleCalendar-${userId}`;
      
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
      // Google Calendar nodes in n8n use 'googleOAuth2Api' credential type
      // n8n's OAuth2 credentials require clientId/clientSecret and handle tokens internally
      // We'll create the credential with client credentials, then update it with tokens
      if (!clientId || !clientSecret) {
        throw new Error('OAuth client ID and secret are required to create Google Calendar credential');
      }

      // Create credential following Fusion pattern: simple structure with required fields
      // Fusion passes: { apiKey, baseUrl, allowedDomains }
      // Google OAuth2 requires specific fields based on n8n's schema
      const credentialData = {
        name: credentialName,
        type: 'googleOAuth2Api',
        data: {
          // OAuth2 client credentials (required) - passed directly like Fusion API key
          clientId: clientId,
          clientSecret: clientSecret,
          // Scopes required for Google Calendar
          scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
          // Required by n8n's googleOAuth2Api schema (for OAuth2 generic flow)
          sendAdditionalBodyProperties: false,
          additionalBodyProperties: {}, // Object, not string
        },
        nodesAccess: nodesAccess
      };

      console.log(`Creating credential in n8n at ${this.baseUrl}/api/v1/credentials`);
      console.log(`Credential name: ${credentialName}, type: ${credentialData.type}`);
      console.log(`Credential data:`, JSON.stringify(credentialData.data, null, 2));
      
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
        console.error(`❌ Failed to create n8n Google Calendar credential: ${response.status} - ${errorText}`);
        console.error(`Request payload was:`, JSON.stringify(credentialData, null, 2));
        throw new Error(`Failed to create n8n credential: ${response.status} ${errorText}`);
      }

      const credential: N8nCredentialResponse = await response.json();
      console.log(`✅ Successfully created credential in n8n: ${credential.id}`);
      
      // Note: Following Fusion pattern - we create credential with just the required fields
      // Fusion: { apiKey, baseUrl, allowedDomains }
      // Google OAuth2: { clientId, clientSecret, scope }
      // n8n's googleOAuth2Api type doesn't accept accessToken/refreshToken directly
      // Those are managed internally by n8n through OAuth flow
      // The tokens we have are stored in Voxe's Integration table for our internal APIs
      
      return {
        credentialId: credential.id,
        credentialName: credentialName
      };
    } catch (error) {
      console.error('Error creating Google Calendar credential:', error);
      throw error;
    }
  }

  /**
   * Get or create Google Calendar credential for a user
   * NOTE: This function is deprecated - we no longer create n8n credentials for calendar.
   * n8n workflows call Voxe's internal APIs instead.
   * This function is kept for backward compatibility but always returns null.
   */
  async getOrCreateGoogleCalendarCredential(userId: string): Promise<{ credentialId: string; credentialName: string } | null> {
    // No longer creating n8n credentials for calendar
    // n8n workflows call Voxe's internal APIs: /api/internal/calendar/get-slots and /book-event
    return null;
  }

  /**
   * Update workflow nodes to use user-specific Google Calendar credentials
   * Finds all Google Calendar HTTP Request nodes and updates them
   */
  async updateWorkflowCalendarCredential(workflowId: string, userId: string): Promise<void> {
    try {
      // Get or create credential for this user (reads from Integration table)
      const credentialInfo = await this.getOrCreateGoogleCalendarCredential(userId);
      
      if (!credentialInfo) {
        console.log(`No calendar integration found for user ${userId}, skipping calendar credential update`);
        return; // No calendar integration, nothing to update
      }

      const { credentialId, credentialName } = credentialInfo;

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

      // Find Google Calendar nodes
      // n8n has native Google Calendar nodes (e.g., 'n8n-nodes-base.googleCalendar')
      // These nodes use OAuth2 credentials
      let workflowUpdated = false;
      let calendarNodesUpdated = 0;
      
      for (const node of workflow.nodes || []) {
        // Check if this is a Google Calendar node
        // n8n Google Calendar nodes typically have:
        // - type: 'n8n-nodes-base.googleCalendar' or similar
        // - name containing "Calendar" or "Google Calendar"
        const isCalendarNode = 
          node.type?.includes('googleCalendar') ||
          node.type?.includes('google') && node.type?.includes('calendar') ||
          (
            node.name?.toLowerCase().includes('calendar') &&
            (node.name?.toLowerCase().includes('google') || node.type?.includes('google'))
          );

        if (isCalendarNode) {
          // Attach OAuth2 credential to the node
          // Google Calendar nodes in n8n use 'googleOAuth2Api' credential type
          node.credentials = {
            ...node.credentials,
            googleOAuth2Api: {
              id: credentialId,
              name: credentialName
            }
          };
          workflowUpdated = true;
          calendarNodesUpdated++;
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

        console.log(`✅ Updated ${calendarNodesUpdated} Google Calendar nodes in workflow ${workflowId}`);
      } else {
        console.log(`ℹ️ No Google Calendar nodes found in workflow ${workflowId}`);
      }
    } catch (error) {
      console.error('Error updating workflow calendar credential:', error);
      throw error;
    }
  }

  /**
   * Update all workflows for a user with Google Calendar credentials
   * Called when user connects their calendar
   */
  async updateAllWorkflowsCalendarCredential(userId: string): Promise<void> {
    try {
      if (!prisma) {
        throw new Error('Prisma client not initialized');
      }

      // Find all workflows for this user that have n8n workflow IDs
      const workflows = await prisma.workflow.findMany({
        where: {
          userId,
          n8nWorkflowId: { not: null },
        },
        select: {
          n8nWorkflowId: true,
        },
      });

      console.log(`🔄 Updating ${workflows.length} workflows with Google Calendar credentials for user ${userId}...`);

      // Update each workflow
      for (const workflow of workflows) {
        if (workflow.n8nWorkflowId) {
          try {
            await this.updateWorkflowCalendarCredential(workflow.n8nWorkflowId, userId);
          } catch (error) {
            console.error(`Failed to update workflow ${workflow.n8nWorkflowId}:`, error);
            // Continue with other workflows even if one fails
          }
        }
      }

      console.log(`✅ Finished updating workflows with Google Calendar credentials`);
    } catch (error) {
      console.error('Error updating all workflows calendar credentials:', error);
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