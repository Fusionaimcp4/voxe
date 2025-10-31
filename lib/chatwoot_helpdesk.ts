/**
 * Chatwoot Helpdesk API integration
 * Handles helpdesk user creation and inbox management
 */

import { prisma } from './prisma';
import { getUserChatwootConfig } from './integrations/crm-service';

export interface ChatwootUser {
  id: number;
  email: string;
  name: string;
  role: string;
  accounts: Array<{ id: number }>;
}

export interface ChatwootInbox {
  id: number;
  name: string;
  channel: {
    type: string;
    website_token: string;
  };
}

export interface CreateUserResponse {
  success: boolean;
  user?: ChatwootUser;
  error?: string;
}

/**
 * Get Chatwoot credentials for API calls
 */
async function getChatwootCredentials(userId: string): Promise<{
  baseUrl: string;
  accountId: string;
  apiKey: string;
}> {
  // Try to get user-specific Chatwoot configuration
  const userConfig = await getUserChatwootConfig(userId);
  
  if (userConfig) {
    return {
      baseUrl: userConfig.baseUrl,
      accountId: userConfig.accountId,
      apiKey: userConfig.apiKey,
    };
  }

  // Fall back to environment variables
  const baseUrl = process.env.CHATWOOT_BASE_URL;
  const accountId = process.env.CHATWOOT_ACCOUNT_ID;
  const apiKey = process.env.CHATWOOT_API_KEY;

  if (!baseUrl || !accountId || !apiKey) {
    throw new Error('Missing Chatwoot credentials. Please configure Chatwoot integration first.');
  }

  return { baseUrl, accountId, apiKey };
}

async function getPlatformApiKey(): Promise<string> {
  // Check for platform API key in environment
  const platformApiKey = process.env.CHATWOOT_PLATFORM_API_KEY;
  
  if (!platformApiKey) {
    throw new Error('CHATWOOT_PLATFORM_API_KEY is required for platform API operations. Please configure it in your .env file.');
  }
  
  return platformApiKey;
}

/**
 * Create a new Chatwoot helpdesk user
 * Steps: 1) Create user via Platform API, 2) Add user to account
 */
export async function createChatwootUser(
  userId: string,
  name: string,
  email: string,
  password: string,
  role: string = 'agent'
): Promise<CreateUserResponse> {
  try {
    const credentials = await getChatwootCredentials(userId);
    const platformApiKey = await getPlatformApiKey();
    
    // First create the platform user, then add to account
    // Step 1: Create user in the platform
    const createPlatformUserUrl = `${credentials.baseUrl}/platform/api/v1/users`;
    
    console.log(`📧 Creating Chatwoot platform user with email: ${email}`);
    console.log(`🔗 Chatwoot Platform API URL: ${createPlatformUserUrl}`);
    console.log(`🔑 Credentials: baseUrl=${credentials.baseUrl}, accountId=${credentials.accountId}`);
    
    // Get current date in ISO format for confirmed_at
    const confirmedAt = new Date().toISOString();
    
    console.log(`📅 Setting confirmed_at: ${confirmedAt}`);
    
    const createPlatformUserResponse = await fetch(createPlatformUserUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': platformApiKey,
      },
      body: JSON.stringify({
        name,
        display_name: name,
        email,
        password,
        confirmed_at: confirmedAt,
        account_id: credentials.accountId, // Try including account_id during creation
        custom_attributes: {},
      }),
    });

    if (!createPlatformUserResponse.ok) {
      const errorText = await createPlatformUserResponse.text();
      console.error(`Chatwoot platform user create failed: ${errorText}`);
      return {
        success: false,
        error: `Chatwoot Platform API error: ${errorText}`,
      };
    }

    const platformUserData = await createPlatformUserResponse.json();
    console.log(`✅ Platform user created:`, platformUserData);
    console.log(`📝 Created user ID: ${platformUserData.id}`);
    console.log(`📝 Created user structure:`, JSON.stringify(platformUserData, null, 2));
    
    const createdUserId = platformUserData.id;
    if (!createdUserId) {
      throw new Error('Platform user created but ID is missing');
    }
    
    // Step 2: Add user to the account using the Agents API
    // This is the endpoint used by the Chatwoot UI (Settings → Agents → Add Agent)
    const accountIdNum = typeof credentials.accountId === 'string' 
      ? parseInt(credentials.accountId, 10) 
      : Number(credentials.accountId);
    
    console.log(`🔗 Account ID: ${accountIdNum}`);
    console.log(`🔗 User ID: ${createdUserId}`);
    
    const addAgentToAccountUrl = `${credentials.baseUrl}/api/v1/accounts/${accountIdNum}/agents`;
    console.log(`🔗 Adding agent to account: ${addAgentToAccountUrl}`);
    console.log(`📝 Request payload:`, { email, role: 'agent' });
    
    // Use the regular API key (not platform API key) for account operations
    const addAgentResponse = await fetch(addAgentToAccountUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': credentials.apiKey, // Use regular API key
      },
      body: JSON.stringify({
        email: email,
        role: 'agent', // Set role as agent
      }),
    });
    
    if (!addAgentResponse.ok) {
      const errorText = await addAgentResponse.text();
      console.error(`❌ Chatwoot add agent failed: ${errorText}`);
      console.error(`📝 Response status: ${addAgentResponse.status}`);
      
      // The user was created but couldn't be added to the account
      console.warn(`⚠️ User ID ${createdUserId} was created but could not be added to account ${accountIdNum}`);
      console.warn(`⚠️ The user exists in Chatwoot but needs to be added to the account via Chatwoot UI.`);
      
      return {
        success: false,
        error: `User created in Chatwoot (ID: ${createdUserId}) but could not be added to account: ${errorText}. Please add them manually via Chatwoot UI.`,
      };
    }
    
    const agentData = await addAgentResponse.json();
    console.log(`✅ Agent added to account:`, agentData);
    
    // Return the user data
    const userData: ChatwootUser = {
      id: createdUserId,
      email,
      name,
      role,
      accounts: [],
    };
    
    console.log(`✅ Chatwoot user created:`, userData);

    
    return {
      success: true,
      user: userData,
    };
  } catch (error) {
    console.error('Failed to create Chatwoot user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    };
  }
}

/**
 * Add agent to an inbox
 */
export async function addAgentToInbox(
  userId: string,
  agentId: number,
  inboxId: number
): Promise<boolean> {
  try {
    const credentials = await getChatwootCredentials(userId);
    
    // Use the correct Chatwoot API endpoint for inbox_members
    const url = `${credentials.baseUrl}/api/v1/accounts/${credentials.accountId}/inbox_members`;
    
    console.log(`🔗 Adding agent ${agentId} to inbox ${inboxId}`);
    console.log(`🔗 URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': credentials.apiKey,
      },
      body: JSON.stringify({
        inbox_id: inboxId,
        user_ids: [agentId],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to add agent to inbox: ${errorText}`);
      console.error(`📝 Response status: ${response.status}`);
      return false;
    }

    const result = await response.json();
    console.log(`✅ Agent ${agentId} added to inbox ${inboxId} successfully:`, result);
    return true;
  } catch (error) {
    console.error('Failed to add agent to inbox:', error);
    return false;
  }
}

/**
 * Remove agent from an inbox
 */
export async function removeAgentFromInbox(
  userId: string,
  agentId: number,
  inboxId: number
): Promise<boolean> {
  try {
    const credentials = await getChatwootCredentials(userId);
    
    // Use DELETE endpoint with inbox_id and user_id in the URL
    const url = `${credentials.baseUrl}/api/v1/accounts/${credentials.accountId}/inbox_members/${inboxId}/${agentId}`;
    
    console.log(`🔗 Removing agent ${agentId} from inbox ${inboxId}`);
    console.log(`🔗 URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'api_access_token': credentials.apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to remove agent from inbox: ${errorText}`);
      console.error(`📝 Response status: ${response.status}`);
      return false;
    }

    console.log(`✅ Agent ${agentId} removed from inbox ${inboxId} successfully`);
    return response.ok;
  } catch (error) {
    console.error('Failed to remove agent from inbox:', error);
    return false;
  }
}

/**
 * List all inboxes for the account
 */
export async function listInboxes(userId: string): Promise<ChatwootInbox[]> {
  try {
    const credentials = await getChatwootCredentials(userId);
    
    const url = `${credentials.baseUrl}/api/v1/accounts/${credentials.accountId}/inboxes`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api_access_token': credentials.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch inboxes');
    }

    const data = await response.json();
    return data.payload || [];
  } catch (error) {
    console.error('Failed to list inboxes:', error);
    return [];
  }
}

/**
 * List all users in the Chatwoot account
 */
export async function listUsers(userId: string): Promise<ChatwootUser[]> {
  try {
    const credentials = await getChatwootCredentials(userId);
    
    const url = `${credentials.baseUrl}/api/v1/accounts/${credentials.accountId}/account_users`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api_access_token': credentials.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    const data = await response.json();
    return data.payload || [];
  } catch (error) {
    console.error('Failed to list users:', error);
    return [];
  }
}

/**
 * Generate email with plus-addressing
 */
export function generatePlusAddressedEmail(
  baseEmail: string,
  agentName: string
): string {
  // Convert agent name to valid email part (lowercase, replace spaces with dots)
  const emailPart = agentName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');

  const [localPart, domain] = baseEmail.split('@');
  return `${localPart}+${emailPart}@${domain}`;
}

/**
 * Get tier-based agent limits
 */
export function getAgentLimitForTier(tier: string): number {
  switch (tier) {
    case 'FREE':
      return 1;
    case 'PRO':
      return 3;
    case 'PRO_PLUS':
      return 5;
    case 'ENTERPRISE':
      return -1; // Unlimited
    default:
      return 1;
  }
}

