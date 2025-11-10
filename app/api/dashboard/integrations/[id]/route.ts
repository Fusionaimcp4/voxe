import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/integrations/encryption';
import { UpdateIntegrationRequest, CRMConfiguration } from '@/lib/integrations/types';
import { getCRMFormFields } from '@/lib/integrations/crm-providers';
import { deactivateAllActiveHelpdeskIntegrations } from '@/lib/integrations/crm-service';
import fs from 'fs/promises';
import path from 'path';

// GET - Fetch single integration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if prisma is available
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;

    const integration = await prisma.integration.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ integration });

  } catch (error) {
    console.error('Get integration API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integration' },
      { status: 500 }
    );
  }
}

// PUT - Update integration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if prisma is available
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;
    const body: UpdateIntegrationRequest = await request.json();

    // Verify integration belongs to user
    const existing = await prisma.integration.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Process configuration if provided
    let processedConfiguration = body.configuration;
    
    if (body.configuration && existing.type === 'CRM') {
      const existingConfig = existing.configuration as any;
      const updatedConfig = { ...existingConfig, ...body.configuration };
      
      // Get form fields to determine which fields are sensitive
      const formFields = getCRMFormFields(updatedConfig.provider);
      const sensitiveFields = formFields
        .filter(field => field.sensitive)
        .map(field => field.name);
      
      // Encrypt sensitive fields if they're being updated
      for (const fieldPath of sensitiveFields) {
        const keys = fieldPath.split('.');
        let obj: any = updatedConfig;
        
        // Navigate to the nested field
        for (let i = 0; i < keys.length - 1; i++) {
          if (!obj[keys[i]]) obj[keys[i]] = {};
          obj = obj[keys[i]];
        }
        
        const lastKey = keys[keys.length - 1];
        if (obj[lastKey]) {
          // Only encrypt if not already encrypted
          if (!obj[lastKey].includes(':')) {
            obj[lastKey] = encrypt(obj[lastKey]);
          }
        }
      }
      
      processedConfiguration = updatedConfig;
      
      // Check if this is a Chatwoot integration (CHATVOXE or regular Chatwoot) and API key was just added/updated
      const isChatwootIntegration = updatedConfig.provider === 'CHATWOOT';
      const existingApiKey = existingConfig?.apiKey;
      const newApiKey = updatedConfig?.apiKey;
      
      // Check if API key was just added or updated (and teams haven't been created yet)
      const apiKeyWasAdded = !existingApiKey && newApiKey;
      const apiKeyWasUpdated = existingApiKey && newApiKey && existingApiKey !== newApiKey;
      const teamsNotCreatedYet = !(updatedConfig as any)?.teamsCreated;
      
      if (isChatwootIntegration && (apiKeyWasAdded || apiKeyWasUpdated) && teamsNotCreatedYet) {
        const isChatvoxe = existing.name === 'CHATVOXE' || (existingConfig as any)?.voxeCreated === true;
        console.log(`[update-integration] ${isChatvoxe ? 'CHATVOXE' : 'Chatwoot'} integration detected, API key ${apiKeyWasAdded ? 'added' : 'updated'}, creating teams...`);
        
        try {
          // Get user tier
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { subscriptionTier: true },
          });
          
          const userTier = user?.subscriptionTier || 'FREE';
          
          // Load teams configuration based on user tier
          const teamsConfigPath = path.join(process.cwd(), `public/teams/${userTier.toLowerCase()}.json`);
          let teamsConfig: Array<{name: string, description: string}> = [];
          
          try {
            const teamsConfigContent = await fs.readFile(teamsConfigPath, 'utf-8');
            teamsConfig = JSON.parse(teamsConfigContent);
            console.log(`[update-integration] Loaded teams config for tier ${userTier}: ${teamsConfig.length} teams`);
          } catch (fileError) {
            // Fallback to team.json if tier-specific file doesn't exist
            console.warn(`[update-integration] Tier-specific teams file not found (${userTier.toLowerCase()}.json), using default team.json`);
            const defaultTeamsPath = path.join(process.cwd(), 'public/teams/team.json');
            const defaultTeamsContent = await fs.readFile(defaultTeamsPath, 'utf-8');
            teamsConfig = JSON.parse(defaultTeamsContent);
            console.log(`[update-integration] Loaded default teams config: ${teamsConfig.length} teams`);
          }
          
          // Use user's configured baseUrl and accountId (not from env)
          const userBaseUrl = updatedConfig.baseUrl as string;
          const userAccountId = updatedConfig.accountId as string;
          
          if (teamsConfig.length > 0 && userBaseUrl && userAccountId) {
            // Decrypt API key if encrypted
            let decryptedApiKey = newApiKey;
            if (newApiKey && typeof newApiKey === 'string' && newApiKey.includes(':')) {
              try {
                decryptedApiKey = decrypt(newApiKey);
              } catch (decryptError) {
                console.error(`[update-integration] Failed to decrypt API key:`, decryptError);
                // Continue with encrypted key (might work if it's not encrypted)
              }
            }
            
            // Normalize baseUrl (remove trailing slash) - use user's configured baseUrl
            const normalizedBaseUrl = userBaseUrl.replace(/\/+$/, '');
            const accountId = userAccountId;
            
            console.log(`[update-integration] Creating ${teamsConfig.length} teams for tier ${userTier} in account ${accountId} using baseUrl: ${normalizedBaseUrl}...`);
            
            const createdTeams: Array<{id: number, name: string}> = [];
            const failedTeams: Array<{name: string, error: string}> = [];
            
            // Create each team sequentially using user's API key
            for (let i = 0; i < teamsConfig.length; i++) {
              const team = teamsConfig[i];
              const createTeamUrl = `${normalizedBaseUrl}/api/v1/accounts/${accountId}/teams`;
              
              console.log(`[update-integration] Creating team ${i + 1}/${teamsConfig.length}: "${team.name}"...`);
              
              try {
                const createTeamResponse = await fetch(createTeamUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': decryptedApiKey, // Use user's API key from their config
                  },
                  body: JSON.stringify({
                    name: team.name,
                    description: team.description,
                  }),
                });
                
                if (createTeamResponse.ok) {
                  const teamData = await createTeamResponse.json();
                  createdTeams.push({ 
                    id: teamData.id || teamData.team?.id, 
                    name: teamData.name || teamData.team?.name || team.name 
                  });
                  console.log(`[update-integration] ✅ Team created: ${team.name} (ID: ${teamData.id || teamData.team?.id})`);
                } else {
                  const errorText = await createTeamResponse.text();
                  let errorMessage = errorText;
                  try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorData.message || errorText;
                  } catch {
                    // Keep original errorText if not JSON
                  }
                  failedTeams.push({ name: team.name, error: errorMessage });
                  console.warn(`[update-integration] ⚠️ Failed to create team "${team.name}": ${errorMessage}`);
                  // Continue with next team even if one fails
                }
              } catch (teamError) {
                const errorMessage = teamError instanceof Error ? teamError.message : String(teamError);
                failedTeams.push({ name: team.name, error: errorMessage });
                console.error(`[update-integration] ❌ Error creating team "${team.name}":`, teamError);
                // Continue with next team even if one fails
              }
            }
            
            console.log(`[update-integration] Teams creation completed: ${createdTeams.length}/${teamsConfig.length} teams created successfully`);
            
            if (failedTeams.length > 0) {
              console.warn(`[update-integration] Failed teams:`, failedTeams.map(t => `"${t.name}" (${t.error})`).join(', '));
            }
            
            // Mark teams as created in configuration (even if some failed, to prevent retrying all)
            if (createdTeams.length > 0) {
              (processedConfiguration as any).teamsCreated = true;
              (processedConfiguration as any).teamsCreatedAt = new Date().toISOString();
              (processedConfiguration as any).createdTeams = createdTeams;
              if (failedTeams.length > 0) {
                (processedConfiguration as any).failedTeams = failedTeams;
              }
              console.log(`[update-integration] Created teams:`, createdTeams.map(t => `${t.name} (ID: ${t.id})`).join(', '));
            } else {
              console.warn(`[update-integration] No teams were created, will retry on next API key update`);
            }
          } else {
            console.warn(`[update-integration] Missing baseUrl or accountId in user config, skipping team creation`);
            console.warn(`[update-integration] baseUrl: ${userBaseUrl || 'missing'}, accountId: ${userAccountId || 'missing'}`);
          }
        } catch (teamsError) {
          console.error(`[update-integration] ❌ Error during teams creation process:`, teamsError);
          // Don't fail the integration update if teams creation fails
        }
      }
    }

    // If activating a CRM integration, deactivate all other active helpdesk integrations
    // This ensures only one helpdesk integration is active at a time
    if (body.isActive === true && existing.type === 'CRM') {
      const deactivatedIds = await deactivateAllActiveHelpdeskIntegrations(userId, id);
      if (deactivatedIds.length > 0) {
        console.log(`[update-integration] Deactivated ${deactivatedIds.length} other active helpdesk integration(s) before activating ${id}`);
      }
    }

    // Update integration
    const integration = await prisma.integration.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(processedConfiguration && { configuration: processedConfiguration }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        name: integration.name,
        type: integration.type,
        isActive: integration.isActive,
        updatedAt: integration.updatedAt,
      },
    });

  } catch (error) {
    console.error('Update integration API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update integration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if prisma is available
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;

    // Verify integration belongs to user
    const existing = await prisma.integration.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Delete integration
    await prisma.integration.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Integration deleted successfully',
    });

  } catch (error) {
    console.error('Delete integration API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete integration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

