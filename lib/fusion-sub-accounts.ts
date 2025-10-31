/**
 * Fusion Sub-User Service
 * Handles complete Fusion sub-user lifecycle management
 * - Create sub-users with role "sub_user"
 * - Find existing sub-users by email
 * - Create API keys for sub-users
 * - Track usage metrics
 * - Delete sub-users when needed
 */

export class FusionSubAccountService {
  private static get FUSION_BASE_URL() {
    return process.env.FUSION_BASE_URL || 'https://fusion.mcp4.ai';
  }
  
  private static get FUSION_API_KEY() {
    return process.env.FUSION_API_KEY;
  }

  /**
   * Transform email for Fusion sub-account creation
   * user@test.com -> user.Voxe@test.com
   */
  private static transformEmailForFusion(email: string): string {
    const [localPart, domain] = email.split('@');
    return `${localPart}+Voxe@${domain}`;
  }

  /**
   * Create a Fusion sub-user for a Voxe user
   * Returns only the user ID - no API key handling
   */
  static async createSubAccount(user: { id: string; email: string }) {
    try {
      if (!this.FUSION_API_KEY) {
        throw new Error('FUSION_API_KEY is not configured');
      }

      // Transform email to avoid conflicts
      const fusionEmail = this.transformEmailForFusion(user.email);

      const userData = {
        email: fusionEmail,
        display_name: `Voxe-${user.email}`,
        role: "sub_user"
      };

      const response = await fetch(`${this.FUSION_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `ApiKey ${this.FUSION_API_KEY}`
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Fusion API error: ${error}`);
      }

      const fusionResponse = await response.json();
      
      if (!fusionResponse.success) {
        throw new Error(`Fusion API returned error: ${fusionResponse.error || 'Unknown error'}`);
      }

      const fusionUser = fusionResponse.data;
      
      console.log(`✅ Created Fusion sub-user for user ${user.id}: ${fusionUser.id}`);
      
      // Return only user ID - no API key
      return {
        id: fusionUser.id,
        createdAt: fusionUser.created_at
      };
      
    } catch (error) {
      console.error(`❌ Failed to create Fusion sub-user for user ${user.id}:`, error);
      throw error;
    }
  }

  /**
   * Find existing Fusion sub-user by Voxe user email
   * Uses transformed email format to search by listing all users
   */
  static async findExistingSubAccount(userEmail: string) {
    try {
      if (!this.FUSION_API_KEY) {
        throw new Error('FUSION_API_KEY is not configured');
      }

      // Transform email to match Fusion format
      const fusionEmail = this.transformEmailForFusion(userEmail);

      // List all users and find by email (Fusion doesn't have direct email search)
      const response = await fetch(`${this.FUSION_BASE_URL}/api/admin/users`, {
        method: 'GET',
        headers: {
          'Authorization': `ApiKey ${this.FUSION_API_KEY}`
        }
      });

      if (!response.ok) {
        console.log(`⚠️  Could not list users to search for existing: ${response.statusText}`);
        return null;
      }

      const users = await response.json();
      
      // Handle different response structures
      const userList = Array.isArray(users) ? users : (users.data || users.users || []);
      
      const existingUser = userList.find((user: any) => user.email === fusionEmail);
      
      if (existingUser) {
        console.log(`✅ Found existing Fusion sub-user: ${existingUser.email} (ID: ${existingUser.id})`);
        return {
          id: existingUser.id,
          email: existingUser.email,
          display_name: existingUser.display_name,
          role: existingUser.role,
          createdAt: existingUser.created_at
        };
      }
      
      console.log(`🔍 No existing Fusion user found with email: ${fusionEmail}`);
      return null;
    } catch (error) {
      console.error('Failed to find existing Fusion sub-user:', error);
      return null;
    }
  }

  /**
   * Create API key for a Fusion sub-user
   * Returns the API key for Voxe to use
   */
  static async createApiKey(fusionUserId: number, keyName: string) {
    try {
      if (!this.FUSION_API_KEY) {
        throw new Error('FUSION_API_KEY is not configured');
      }

      const response = await fetch(`${this.FUSION_BASE_URL}/api/admin/users/${fusionUserId}/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `ApiKey ${this.FUSION_API_KEY}`
        },
        body: JSON.stringify({ name: keyName })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create API key: ${response.statusText} - ${errorText}`);
      }

      const apiKeyData = await response.json();
      
      console.log(`✅ Created API key for Fusion user ${fusionUserId}: ${apiKeyData.data.api_key.substring(0, 20)}...`);
      
      return {
        apiKey: apiKeyData.data.api_key,
        keyId: apiKeyData.data.id,
        name: apiKeyData.data.name,
        createdAt: apiKeyData.data.created_at
      };
      
    } catch (error) {
      console.error(`❌ Failed to create API key for Fusion user ${fusionUserId}:`, error);
      throw error;
    }
  }

  /**
   * Get usage metrics for a Fusion sub-user
   */
  static async getUsageMetrics(fusionUserId: number) {
    try {
      if (!this.FUSION_API_KEY) {
        throw new Error('FUSION_API_KEY is not configured');
      }

      const response = await fetch(`${this.FUSION_BASE_URL}/api/admin/users/${fusionUserId}/usage`, {
        method: 'GET',
        headers: {
          'Authorization': `ApiKey ${this.FUSION_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get usage metrics: ${response.statusText}`);
      }

      const usageData = await response.json();
      
      console.log(`✅ Retrieved usage metrics for Fusion user ${fusionUserId}`);
      
      return {
        user: usageData.data.user,
        metrics: usageData.data.metrics,
        activity: usageData.data.activity,
        pagination: usageData.data.pagination
      };
      
    } catch (error) {
      console.error(`❌ Failed to get usage metrics for Fusion user ${fusionUserId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a Fusion sub-user
   */
  static async deleteSubAccount(fusionUserId: number) {
    try {
      if (!this.FUSION_API_KEY) {
        throw new Error('FUSION_API_KEY is not configured');
      }

      const response = await fetch(`${this.FUSION_BASE_URL}/api/admin/users/${fusionUserId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `ApiKey ${this.FUSION_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete Fusion user: ${response.statusText}`);
      }

      const deleteData = await response.json();
      
      console.log(`✅ Deleted Fusion sub-user ${fusionUserId}: ${deleteData.data.message}`);
      
      return deleteData.data;
      
    } catch (error) {
      console.error(`❌ Failed to delete Fusion sub-user ${fusionUserId}:`, error);
      throw error;
    }
  }

  /**
   * Test Fusion API connection
   */
  static async testConnection() {
    try {
      if (!this.FUSION_API_KEY) {
        throw new Error('FUSION_API_KEY is not configured');
      }

      // Test with a simple API call to check connection
      const response = await fetch(`${this.FUSION_BASE_URL}/api/admin/users`, {
        method: 'GET',
        headers: {
          'Authorization': `ApiKey ${this.FUSION_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`Fusion API connection test failed: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to test Fusion API connection:', error);
      throw error;
    }
  }
}

/**
 * Ensure Fusion sub-account exists for a user
 * This function is called during demo creation to ensure all users have Fusion sub-accounts
 * Works for both email/password users and OAuth users
 */
export async function ensureFusionSubAccount(userId: string): Promise<void> {
  try {
    console.log(`🔍 [Fusion] Checking Fusion sub-account for user: ${userId}`);
    
    // Import prisma here to avoid circular dependencies
    const { prisma } = await import('@/lib/prisma');
    
    if (!prisma) {
      console.error(`❌ [Fusion] Prisma client not available`);
      return;
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fusionSubAccountId: true }
    });

    if (!user) {
      console.error(`❌ [Fusion] User not found: ${userId}`);
      return;
    }

    // Skip if already has Fusion sub-account
    if (user.fusionSubAccountId) {
      console.log(`✅ [Fusion] User ${userId} already has Fusion sub-account: ${user.fusionSubAccountId}`);
      return;
    }

    console.log(`🔄 [Fusion] User ${userId} (${user.email}) needs Fusion sub-account creation`);

    // Check for existing sub-account
    const existingSubAccount = await FusionSubAccountService.findExistingSubAccount(user.email);
    
    if (existingSubAccount) {
      // Link to existing sub-account
      await prisma.user.update({
        where: { id: userId },
        data: { fusionSubAccountId: String(existingSubAccount.id) }
      });
      console.log(`✅ [Fusion] Linked existing Fusion sub-account for user ${userId}: ${existingSubAccount.id}`);
    } else {
      // Create new sub-account
      console.log(`🆕 [Fusion] Creating new Fusion sub-account for user ${userId}`);
      const fusionSubAccount = await FusionSubAccountService.createSubAccount({
        id: user.id,
        email: user.email
      });

      await prisma.user.update({
        where: { id: userId },
        data: { fusionSubAccountId: String(fusionSubAccount.id) }
      });
      console.log(`✅ [Fusion] Created Fusion sub-account for user ${userId}: ${fusionSubAccount.id}`);
    }
  } catch (error) {
    console.error(`❌ [Fusion] Failed to ensure Fusion sub-account for user ${userId}:`, error);
    // Don't throw - let demo creation continue even if Fusion fails
    console.log(`⚠️ [Fusion] Demo creation will continue despite Fusion sub-account creation failure`);
  }
}
