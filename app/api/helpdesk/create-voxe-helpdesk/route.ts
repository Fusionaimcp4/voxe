import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserChatwootConfig } from '@/lib/integrations/crm-service';
import fs from 'fs/promises';
import path from 'path';

export const runtime = "nodejs";

/**
 * Create Voxe Helpdesk Workflow:
 * 1. Authenticate user and validate email
 * 2. Check if user already has a Chatwoot integration (limit: 1 per user)
 * 3. Load tier configuration from tier.json
 * 4. Get Chatwoot credentials from environment variables
 * 5. Create new Chatwoot account with tier limits and features
 * 6. Send invitation from account 1 to user's email
 * 7. Get user ID from invitation response
 * 8. Assign user to newly created account as administrator
 * 9. Remove user from account 1 (cleanup)
 * 10. Attempt to retrieve user's access token from Platform API
 * 11. Save integration to database with baseUrl, accountId, and apiToken (if retrieved)
 * 12. Return success response with detailed instructions if token not retrieved
 */
export async function POST(request: NextRequest) {
  try {
    // Check if prisma is available
    if (!prisma) {
      return NextResponse.json(
        { status: 'error', error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Step 1: Authentication & validation
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { status: 'error', error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    const userName = session.user.name || userEmail || 'User';

    if (!userEmail) {
      return NextResponse.json(
        { status: 'error', error: 'User email is required' },
        { status: 400 }
      );
    }

    // Step 2: Check existing Chatwoot integration (limit to 1 per user)
    // Check database first for active Chatwoot integrations
    const existingIntegration = await prisma.integration.findFirst({
      where: {
        userId,
        type: 'CRM',
        isActive: true,
      },
    });

    if (existingIntegration) {
      const config = existingIntegration.configuration as any;
      if (config?.provider === 'CHATWOOT') {
        return NextResponse.json(
          {
            status: 'exists',
            message: 'You already have a Chatwoot integration. Only one Chatwoot integration is allowed per user.',
          },
          { status: 200 }
        );
      }
    }

    // Also check via getUserChatwootConfig for consistency
    const existingConfig = await getUserChatwootConfig(userId);
    if (existingConfig && existingConfig.provider === 'CHATWOOT') {
      return NextResponse.json(
        {
          status: 'exists',
          message: 'You already have a Chatwoot integration. Only one Chatwoot integration is allowed per user.',
        },
        { status: 200 }
      );
    }

    // Step 3: Load tier configuration
    const tierConfigPath = path.join(process.cwd(), 'public/tier/tier.json');
    const tierConfigContent = await fs.readFile(tierConfigPath, 'utf-8');
    const tierConfig = JSON.parse(tierConfigContent);

    // Get user's tier from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });

    const userTier = user?.subscriptionTier || 'FREE';
    const tierLimits = tierConfig[userTier] || tierConfig['STARTER']; // Fallback to STARTER

    // Step 4: Get Chatwoot credentials from environment
    const platformApiKey = process.env.CHATWOOT_PLATFORM_API_KEY;
    const baseUrl = process.env.CHATWOOT_BASE_URL || 'https://chatvoxe.mcp4.ai';
    const account1Id = process.env.CHATWOOT_ACCOUNT_ID; // Account 1 ID for sending invitation
    const account1ApiKey = process.env.CHATWOOT_API_KEY; // Account 1 API key for sending invitation

    if (!platformApiKey) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Chatwoot platform API key not configured. Please contact support.',
        },
        { status: 500 }
      );
    }

    if (!baseUrl) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Chatwoot base URL not configured. Please contact support.',
        },
        { status: 500 }
      );
    }

    if (!account1Id || !account1ApiKey) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Account 1 credentials not configured. Please contact support.',
        },
        { status: 500 }
      );
    }

    // Normalize baseUrl (remove trailing slash)
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');

    // Step 5: Prepare account creation payload with tier properties
    const createAccountUrl = `${normalizedBaseUrl}/platform/api/v1/accounts`;
    const accountName = `${userName} Helpdesk`;

    console.log(`[create-voxe-helpdesk] Creating Chatwoot account for user ${userId}: ${accountName}`);
    console.log(`[create-voxe-helpdesk] Applying tier: ${userTier}`);
    console.log(`[create-voxe-helpdesk] Tier limits:`, tierLimits);

    // Prepare account payload with tier properties
    const accountPayload: any = {
      name: accountName,
    };

    // Apply tier limits if Chatwoot API supports it
    if (tierLimits?.limits) {
      accountPayload.limits = tierLimits.limits;
    }

    // Apply tier features if Chatwoot API supports it
    if (tierLimits?.features) {
      accountPayload.features = tierLimits.features;
    }

    console.log(`[create-voxe-helpdesk] Account payload:`, JSON.stringify(accountPayload, null, 2));

    const createAccountResponse = await fetch(createAccountUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': platformApiKey,
      },
      body: JSON.stringify(accountPayload),
    });

    if (!createAccountResponse.ok) {
      const errorText = await createAccountResponse.text();
      console.error(`[create-voxe-helpdesk] Failed to create Chatwoot account: ${errorText}`);
      return NextResponse.json(
        {
          status: 'error',
          error: `Failed to create Chatwoot account: ${errorText}`,
        },
        { status: 500 }
      );
    }

    const accountData = await createAccountResponse.json();
    const newAccountId = accountData.id || accountData.account?.id;

    if (!newAccountId) {
      console.error('[create-voxe-helpdesk] Account created but ID is missing:', accountData);
      return NextResponse.json(
        {
          status: 'error',
          error: 'Account created but ID is missing from response',
        },
        { status: 500 }
      );
    }

    console.log(`[create-voxe-helpdesk] Chatwoot account created with ID: ${newAccountId}`);
    console.log(`[create-voxe-helpdesk] Account tier: ${userTier}`);
    console.log(`[create-voxe-helpdesk] Tier limits applied:`, tierLimits);

    // Variable to store user API token (will be retrieved after user assignment)
    let userApiToken: string | null = null;

    // Step 6: Send invitation from account 1 using .env credentials
    console.log(`[create-voxe-helpdesk] Sending invitation from account 1 (${account1Id}) to ${userEmail}`);
    
    const invitationUrl = `${normalizedBaseUrl}/api/v1/accounts/${account1Id}/agents`;
    
    const invitationResponse = await fetch(invitationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': account1ApiKey,
      },
      body: JSON.stringify({
        email: userEmail,
        name: userName,
        role: 'agent',
      }),
    });

    if (!invitationResponse.ok) {
      const errorText = await invitationResponse.text();
      console.warn(`[create-voxe-helpdesk] Failed to send invitation from account 1: ${errorText}`);
      // Continue anyway - account is created
    } else {
      const invitationData = await invitationResponse.json();
      console.log(`[create-voxe-helpdesk] Invitation sent successfully from account 1`);
      console.log(`[create-voxe-helpdesk] Invitation response:`, JSON.stringify(invitationData, null, 2));
      
      // Step 7: Get user ID from invitation response or find user in account 1
      let userId: number | null = null;
      
      // Check if invitation response contains user ID
      if (invitationData.id) {
        userId = invitationData.id;
        console.log(`[create-voxe-helpdesk] User ID from invitation response: ${userId}`);
      } else if (invitationData.user_id) {
        userId = invitationData.user_id;
        console.log(`[create-voxe-helpdesk] User ID from invitation response (user_id): ${userId}`);
      } else if (invitationData.user && invitationData.user.id) {
        userId = invitationData.user.id;
        console.log(`[create-voxe-helpdesk] User ID from invitation response (user.id): ${userId}`);
      }
      
      // If not in response, find user in account 1 by email
      if (!userId) {
        console.log(`[create-voxe-helpdesk] User ID not in invitation response, searching in account 1 by email: ${userEmail}`);
        
        // Wait a moment for the invitation to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Find the user in account 1's users list (retry up to 3 times)
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!userId && retryCount < maxRetries) {
          // Get users from account 1
          const account1UsersUrl = `${normalizedBaseUrl}/api/v1/accounts/${account1Id}/account_users`;
          const findUserResponse = await fetch(account1UsersUrl, {
            method: 'GET',
            headers: {
              'api_access_token': account1ApiKey,
            },
          });

          if (findUserResponse.ok) {
            const usersData = await findUserResponse.json();
            const users = Array.isArray(usersData) ? usersData : (usersData.payload || []);
            const foundUser = users.find((u: any) => u.email === userEmail);
            
            if (foundUser && foundUser.id) {
              userId = foundUser.id;
              console.log(`[create-voxe-helpdesk] Found user in account 1 with ID: ${userId}`);
              break;
            }
          }
          
          if (!userId) {
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`[create-voxe-helpdesk] User not found yet in account 1, retrying... (${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
      }
      
      // Assign user to the newly created account as administrator using platform API
      if (userId) {
        const assignUserUrl = `${normalizedBaseUrl}/platform/api/v1/accounts/${newAccountId}/account_users`;
        console.log(`[create-voxe-helpdesk] Assigning user ${userId} to account ${newAccountId} as administrator`);
        
        const assignUserResponse = await fetch(assignUserUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api_access_token': platformApiKey,
          },
          body: JSON.stringify({
            user_id: userId,
            role: 'administrator',
          }),
        });

        if (assignUserResponse.ok) {
          const assignUserData = await assignUserResponse.json();
          console.log(`[create-voxe-helpdesk] User assigned to account ${newAccountId} as administrator successfully`);
          console.log(`[create-voxe-helpdesk] Assignment response:`, JSON.stringify(assignUserData, null, 2));
          
          // Check if assignment response contains access token
          if (assignUserData.access_token) {
            userApiToken = assignUserData.access_token;
            console.log(`[create-voxe-helpdesk] ✅ Access token found in assignment response`);
          } else if (assignUserData.user && assignUserData.user.access_token) {
            userApiToken = assignUserData.user.access_token;
            console.log(`[create-voxe-helpdesk] ✅ Access token found in assignment response (user.access_token)`);
          }
          
          // Step 8: Get user's access token BEFORE removing from Account 1
          // According to Chatwoot API docs: https://developers.chatwoot.com/api-reference/profile/fetch-user-profile
          // The /api/v1/profile endpoint returns the access_token in the response
          // Header format: 'api_access_token: <api-key>' (with underscore)
          // Note: /api/v1/profile returns the profile of the authenticated user (the one whose API token is used)
          // So we'll try multiple approaches to get the user's access token
          console.log(`[create-voxe-helpdesk] Getting access token for user ${userId} (while still in Account 1)...`);
          
          // Only try to get access token if we don't already have it from assignment response
          if (!userApiToken) {
            // Approach 1: Try Profile API endpoint using Account 1 API key
            // Note: This will return Account 1's owner's profile, not the new user's profile
            // But let's try it to see if it works
            console.log(`[create-voxe-helpdesk] Trying profile endpoint with Account 1 API key...`);
            const profileUrl = `${normalizedBaseUrl}/api/v1/profile`;
            const profileResponse = await fetch(profileUrl, {
              method: 'GET',
              headers: {
                'api_access_token': account1ApiKey, // Correct header format: api_access_token (with underscore)
              },
            });

            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              console.log(`[create-voxe-helpdesk] Profile data from /api/v1/profile:`, JSON.stringify(profileData, null, 2));
              
              // Check if this is the correct user's profile by matching email or ID
              if (profileData.email === userEmail || profileData.id === userId) {
                if (profileData.access_token) {
                  userApiToken = profileData.access_token;
                  console.log(`[create-voxe-helpdesk] ✅ Access token retrieved from profile endpoint for user ${userId}`);
                } else {
                  console.warn(`[create-voxe-helpdesk] Profile response doesn't contain access_token`);
                }
              } else {
                console.warn(`[create-voxe-helpdesk] Profile response is for different user (expected ${userEmail}, got ${profileData.email})`);
                console.warn(`[create-voxe-helpdesk] This is expected - /api/v1/profile returns the profile of the authenticated user`);
              }
            } else {
              const errorText = await profileResponse.text();
              console.warn(`[create-voxe-helpdesk] Profile endpoint failed: ${errorText}`);
            }
            
            // Approach 2: Get user details from Account 1's account_users endpoint
            if (!userApiToken) {
              console.log(`[create-voxe-helpdesk] Profile endpoint didn't work, trying account_users endpoint...`);
              const account1UsersUrl = `${normalizedBaseUrl}/api/v1/accounts/${account1Id}/account_users`;
              const account1UsersResponse = await fetch(account1UsersUrl, {
                method: 'GET',
                headers: {
                  'api_access_token': account1ApiKey, // Use Account 1 API key while user is still there
                },
              });

              if (account1UsersResponse.ok) {
                const usersData = await account1UsersResponse.json();
                const users = Array.isArray(usersData) ? usersData : (usersData.payload || []);
                const userInAccount1 = users.find((u: any) => u.id === userId || u.user_id === userId || u.email === userEmail);
                
                if (userInAccount1) {
                  console.log(`[create-voxe-helpdesk] Found user in Account 1:`, JSON.stringify(userInAccount1, null, 2));
                  
                  // Check if access token is in the user data
                  if (userInAccount1.access_token) {
                    userApiToken = userInAccount1.access_token;
                    console.log(`[create-voxe-helpdesk] ✅ Access token retrieved from account_users for user ${userId}`);
                  } else {
                    console.warn(`[create-voxe-helpdesk] Access token not found in account_users response`);
                  }
                } else {
                  console.warn(`[create-voxe-helpdesk] User not found in Account 1 account_users list`);
                }
              } else {
                const errorText = await account1UsersResponse.text();
                console.warn(`[create-voxe-helpdesk] Failed to get account_users: ${errorText}`);
              }
            }
            
            // Approach 3: Try Platform API to get user details (should include access_token)
            if (!userApiToken) {
              console.log(`[create-voxe-helpdesk] account_users didn't return token, trying Platform API...`);
              const getUserUrl = `${normalizedBaseUrl}/platform/api/v1/users/${userId}`;
              const getUserResponse = await fetch(getUserUrl, {
                method: 'GET',
                headers: {
                  'api_access_token': platformApiKey,
                },
              });

              if (getUserResponse.ok) {
                const userData = await getUserResponse.json();
                console.log(`[create-voxe-helpdesk] User data from platform API:`, JSON.stringify(userData, null, 2));
                
                // Extract access token from user data
                if (userData.access_token) {
                  userApiToken = userData.access_token;
                  console.log(`[create-voxe-helpdesk] ✅ Access token retrieved from platform API for user ${userId}`);
                } else if (userData.data && userData.data.access_token) {
                  userApiToken = userData.data.access_token;
                  console.log(`[create-voxe-helpdesk] ✅ Access token retrieved from nested data for user ${userId}`);
                }
              } else {
                const errorText = await getUserResponse.text();
                console.warn(`[create-voxe-helpdesk] Platform API failed: ${errorText}`);
              }
            }
            
            // If still no token, user will need to get it manually
            if (!userApiToken) {
              console.warn(`[create-voxe-helpdesk] ⚠️ Could not retrieve access token automatically`);
              console.warn(`[create-voxe-helpdesk] User will need to provide API token manually from Profile Settings`);
              console.warn(`[create-voxe-helpdesk] After logging in, user can get token from: ${normalizedBaseUrl}/app/accounts/${newAccountId}/profile/settings`);
            }
          } else {
            console.log(`[create-voxe-helpdesk] ✅ Access token already retrieved from assignment response`);
          }
          
          // Step 9: Remove user from account 1 AFTER retrieving access token
          console.log(`[create-voxe-helpdesk] Removing agent ${userId} from account 1 (${account1Id}) using account API`);
          const removeUserUrl = `${normalizedBaseUrl}/api/v1/accounts/${account1Id}/agents/${userId}`;
          
          const removeUserResponse = await fetch(removeUserUrl, {
            method: 'DELETE',
            headers: {
              'api_access_token': account1ApiKey, // Use CHATWOOT_API_KEY from .env
            },
          });

          if (removeUserResponse.ok) {
            console.log(`[create-voxe-helpdesk] User removed from account 1 successfully`);
          } else {
            const errorText = await removeUserResponse.text();
            console.warn(`[create-voxe-helpdesk] Failed to remove user from account 1: ${errorText}`);
            // Continue anyway - user is already assigned to new account
          }
        } else {
          const errorText = await assignUserResponse.text();
          console.warn(`[create-voxe-helpdesk] Failed to assign user to account: ${errorText}`);
        }
      } else {
        console.warn(`[create-voxe-helpdesk] Could not find user ID from invitation response or account 1`);
      }
    }

    // Step 10: Save integration to database (with API token if retrieved)
    // Use "CHATVOXE" as the name for Voxe-created integrations to differentiate from manual Chatwoot setups
    const integration = await prisma.integration.create({
      data: {
        userId,
        name: 'CHATVOXE', // Voxe-created integration name (different from manual "Chatwoot" setup)
        type: 'CRM',
        configuration: {
          provider: 'CHATWOOT',
          baseUrl: normalizedBaseUrl,
          accountId: String(newAccountId),
          ...(userApiToken && { apiKey: userApiToken }), // Include API token if retrieved
          tier: userTier, // Store tier for reference
          tierLimits: tierLimits, // Store tier limits for reference
          features: {
            autoCreateInboxes: true,
            autoCreateBots: true,
            syncContacts: true,
          },
          // Mark as Voxe-created for identification
          voxeCreated: true,
        },
        isActive: true,
      },
    });

    console.log(`[create-voxe-helpdesk] Integration saved to database with ID: ${integration.id}`);
    console.log(`[create-voxe-helpdesk] Saved configuration:`, {
      baseUrl: normalizedBaseUrl,
      accountId: String(newAccountId),
      hasApiToken: !!userApiToken,
      tier: userTier,
    });

    // Step 10: Return success response
    const successMessage = userApiToken 
      ? `Your chatvoxe Helpdesk has been created and configured successfully with ${userTier} tier limits. Your API token has been automatically retrieved and saved.`
      : `Your chatvoxe Helpdesk has been created successfully with ${userTier} tier limits. To complete the setup, please follow these steps:\n\n1. Check your email (${userEmail}) for the Chatwoot invitation\n2. Click the invitation link and set your password\n3. Log in to your admin account at ${normalizedBaseUrl}/app/accounts/${newAccountId}\n4. Go to Profile Settings → Access Token\n5. Copy your API token and paste it in the form below`;

    return NextResponse.json(
      {
        status: 'success',
        message: successMessage,
        account_id: String(newAccountId),
        base_url: normalizedBaseUrl,
        tier: userTier,
        tier_limits: tierLimits,
        ...(userApiToken && { api_token: userApiToken }), // Include API token if retrieved
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[create-voxe-helpdesk] Error creating chatvoxe helpdesk:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to create helpdesk',
      },
      { status: 500 }
    );
  }
}

