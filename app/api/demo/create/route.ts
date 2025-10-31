import { NextRequest, NextResponse } from 'next/server';
import { fetchAndClean } from '@/lib/scrape';
import { generateKBFromWebsite } from '@/lib/llm';
import { mergeKBIntoSkeleton, injectWebsiteLinksSection, CanonicalUrl } from '@/lib/merge';
import { createWebsiteInbox } from '@/lib/chatwoot';
import { renderDemoHTML } from '@/lib/renderDemo';
import { slugify } from '@/lib/slug';
import { writeTextFile, readTextFileIfExists, atomicJSONUpdate } from '@/lib/fsutils';
import { getPublishedSystemMessageTemplate } from '@/lib/system-message-template';
import { duplicateWorkflowViaWebhook } from '@/lib/n8n-webhook';
import { createAgentBot, assignBotToInbox } from '@/lib/chatwoot_admin';
import { n8nCredentialService } from '@/lib/n8n-credentials';
import { ensureFusionSubAccount } from '@/lib/fusion-sub-accounts';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canPerformAction, trackUsage } from '@/lib/usage-tracking';

export const runtime = "nodejs";

// Generate slug with hash for uniqueness (same as inspect API)
function generateSlugWithHash(url: string): string {
  // Normalize URL for consistent hashing
  const normalizedUrl = url.toLowerCase().replace(/\/$/, ''); // Remove trailing slash, lowercase
  const hostname = new URL(normalizedUrl).hostname.replace(/^www\./, '');
  const urlHash = crypto.createHash('md5').update(normalizedUrl).digest('hex').substring(0, 8);
  return `${slugify(hostname)}-${urlHash}`;
}

// Check if file is fresh (within TTL)
async function isFileFresh(filePath: string, ttlHours: number = 24): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    const ageMs = Date.now() - stats.mtime.getTime();
    const ttlMs = ttlHours * 60 * 60 * 1000;
    return ageMs < ttlMs;
  } catch {
    return false; // File doesn't exist
  }
}

interface CreateDemoPayload {
  url: string;
  businessName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  canonicalUrls?: CanonicalUrl[];
  lead?: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    consent?: boolean;
  };
}

interface DemoRegistry {
  [slug: string]: {
    slug: string;
    business: string;
    url: string;
    system_message_file: string;
    demo_url: string;
    chatwoot: {
      inbox_id: number;
      website_token: string;
    };
    workflow_duplication?: 'success' | 'failed';
    agent_bot?: {
      id: number | string;
      access_token: string;
    };
    lead?: {
      name: string;
      email: string;
      company?: string;
      phone?: string;
    };
    created_at: string;
    updated_at?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const userId = session.user.id;
    const payload: CreateDemoPayload = await request.json();
    
    // Ensure Fusion sub-account exists before demo creation
    // This works for both email/password users and OAuth users
    console.log(`🔄 [Demo Create] Ensuring Fusion sub-account for user: ${userId}`);
    await ensureFusionSubAccount(userId);
    
    // Check tier limits before proceeding
    const usageCheck = await canPerformAction(userId, 'create_demo');
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Tier limit exceeded',
          message: usageCheck.reason,
          usage: usageCheck.usage,
          upgradeRequired: true
        },
        { status: 403 }
      );
    }
    
    // Validate input
    if (!payload.url) {
      return NextResponse.json(
        { error: 'url is required' },
        { status: 400 }
      );
    }

    // Validate URL
    let url: URL;
    try {
      url = new URL(payload.url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Infer business name from hostname if not provided
    const businessName = payload.businessName || url.hostname.replace(/^www\./, '');
    const slug = generateSlugWithHash(payload.url); // Use hashed slug for consistency

    if (!slug) {
      return NextResponse.json(
        { error: 'Could not generate valid slug from business name' },
        { status: 400 }
      );
    }

    // Check for existing KB file from user preview
    const previewSystemMessageFile = `./public/system_messages/n8n_System_Message_${slug}.md`;
    
    let finalSystemMessage: string = '';
    let systemMessageFile: string = previewSystemMessageFile;
    let reusingPreview = false;

    // Check if we have a fresh preview file to reuse
    const hasPreviewFile = await isFileFresh(previewSystemMessageFile);
    
    if (hasPreviewFile) {
      // Reuse existing preview file
      console.log(`Reusing preview KB for ${businessName}`);
      const previewContent = await readTextFileIfExists(previewSystemMessageFile);
      if (previewContent) {
        finalSystemMessage = previewContent;
        // Replace ${businessName} placeholder even in reused files
        finalSystemMessage = finalSystemMessage.replace(/\$\{businessName\}/g, businessName);
        systemMessageFile = previewSystemMessageFile;
        reusingPreview = true;
      }
    }
    
    if (!reusingPreview) {
      // Generate new KB (original flow)
      console.log(`Generating new KB for ${businessName}`);
      
      // Step 1: Fetch and clean website content
      const { cleanedText } = await fetchAndClean(payload.url);

      // Step 2: Generate knowledge base
      const kbMarkdown = await generateKBFromWebsite(cleanedText, payload.url);

      // Step 3: Load skeleton template from database or file
      const skeletonText = await getPublishedSystemMessageTemplate();

      // Step 4: Merge KB into skeleton
      finalSystemMessage = mergeKBIntoSkeleton(skeletonText, kbMarkdown);

      // Step 4.5: Replace ${businessName} placeholder with actual business name
      finalSystemMessage = finalSystemMessage.replace(/\$\{businessName\}/g, businessName);

      // Step 5: Set system message file path
      systemMessageFile = previewSystemMessageFile; // Use hashed naming
    }
    
    // Always inject/update Website links section (for both new and reused files)
    if (finalSystemMessage) {
      finalSystemMessage = injectWebsiteLinksSection(
        finalSystemMessage, 
        payload.url, 
        payload.canonicalUrls || []
      );
      
      // Write the updated system message file
      await writeTextFile(systemMessageFile, finalSystemMessage);
    }

    // Step 6: Create demo URL and Chatwoot inbox
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://${process.env.DEMO_DOMAIN || 'localhost:3000'}`);
    const demoUrl = `${baseUrl}/demo/${slug}`;
    
    const { inbox_id, website_token } = await createWebsiteInbox(businessName, demoUrl, userId);

    // Step 7: Render demo HTML
    const chatwootBaseUrl = process.env.CHATWOOT_BASE_URL || 'https://chatwoot.mcp4.ai';
    const demoHTML = renderDemoHTML({
      businessName,
      slug,
      primary: payload.primaryColor,
      secondary: payload.secondaryColor,
      logoUrl: payload.logoUrl,
      chatwootBaseUrl,
      websiteToken: website_token
    });

    // Step 8: Write demo HTML file
    const demoRoot = process.env.DEMO_ROOT || './public/demos';
    const demoIndexPath = path.join(demoRoot, slug, 'index.html');
    await writeTextFile(demoIndexPath, demoHTML);

    // Step 9: Save demo to database FIRST (before n8n webhook)
    let demo;
    try {
      demo = await prisma.demo.create({
        data: {
          userId,
          slug,
          businessName,
          businessUrl: payload.url,
          demoUrl,
          systemMessageFile: `/system-message/n8n_System_Message_${slug}`,
          chatwootInboxId: inbox_id,
          chatwootWebsiteToken: website_token,
          primaryColor: payload.primaryColor || '#7ee787',
          secondaryColor: payload.secondaryColor || '#f4a261',
          logoUrl: payload.logoUrl
        }
      });

      // Create associated workflow record
      await prisma.workflow.create({
        data: {
          userId,
          demoId: demo.id,
          n8nWorkflowId: null, // Will be updated by n8n workflow duplicator
          status: 'ACTIVE',
          configuration: {
            aiModel: 'gpt-4o-mini',
            confidenceThreshold: 0.8,
            escalationRules: [],
            externalIntegrations: []
          }
        }
      });

      // Create system message record
      await prisma.systemMessage.create({
        data: {
          demoId: demo.id,
          content: finalSystemMessage,
          version: 1,
          isActive: true
        }
      });

      console.log(`✅ Demo saved to database: ${demo.id}`);
      
      // Track usage
      await trackUsage(userId, 'demo_created');
    } catch (dbError) {
      console.error('❌ Failed to save demo to database:', dbError);
      console.error('❌ Database error details:', {
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        code: (dbError as any)?.code,
        meta: (dbError as any)?.meta
      });
      // Continue with demo creation even if database save fails
    }

    // Step 10: Setup Chatwoot bot and trigger n8n workflow duplication
    let botId: number | string | undefined;
    let botAccessToken: string | undefined;
    let workflowDuplicationResult: { success: boolean; error?: string; workflowId?: string } | undefined;

    try {
      // Create Chatwoot Agent Bot
      console.log(`Creating agent bot for ${businessName}...`);
      const bot = await createAgentBot(businessName, userId);
      botId = bot.id;
      botAccessToken = bot.access_token;

      // Assign bot to inbox
      if (botId) {
        try {
          await assignBotToInbox(inbox_id, botId, userId);
        } catch (assignError) {
          console.warn(`Bot assignment failed:`, assignError);
        }
      }

      // Update workflow with bot information
      if (demo) {
        await prisma.workflow.updateMany({
          where: { demoId: demo.id },
          data: {
            configuration: {
              aiModel: 'gpt-4o-mini',
              confidenceThreshold: 0.8,
              escalationRules: [],
              externalIntegrations: [],
              chatwootAgentBotId: botId || null,
              chatwootAgentBotAccessToken: botAccessToken || null
            }
          }
        });
      }

      // Trigger n8n workflow duplication
      if (botAccessToken) {
        workflowDuplicationResult = await duplicateWorkflowViaWebhook(
          businessName,
          botAccessToken,
          finalSystemMessage
        );

        // If workflow duplication succeeded and we got a workflow ID, save it first
        if (workflowDuplicationResult.success && workflowDuplicationResult.workflowId && demo) {
          try {
            // Update the workflow record with the n8n workflow ID FIRST
            await prisma.workflow.updateMany({
              where: {
                userId,
                demoId: demo.id,
                n8nWorkflowId: null
              },
              data: {
                n8nWorkflowId: workflowDuplicationResult.workflowId
              }
            });
            
            console.log(`✅ Workflow ${workflowDuplicationResult.workflowId} saved to database`);
            
            // Credential update will happen in /api/workflow/update-id endpoint
            // This follows the same pattern as system message updates
            
          } catch (credentialError) {
            console.error('Failed to save workflow ID:', credentialError);
            // Don't fail the entire demo creation if workflow save fails
          }
        }
      }
    } catch (e: any) {
      console.error("Auto-create bot failed:", e);
      // Continue without bot setup
    }

    // Step 10: Update registry
    const registryPath = './data/registry/demos.json';
    await atomicJSONUpdate<DemoRegistry>(registryPath, (registry) => {
      const now = new Date().toISOString();
      const existingEntry = registry[slug];
      
      registry[slug] = {
        slug,
        business: businessName,
        url: payload.url,
        system_message_file: systemMessageFile,
        demo_url: demoUrl,
        chatwoot: {
          inbox_id,
          website_token
        },
        ...(workflowDuplicationResult?.success && { workflow_duplication: 'success' }),
        ...(botId && botAccessToken && { 
          agent_bot: { 
            id: botId, 
            access_token: botAccessToken 
          } 
        }),
        ...(payload.lead && {
          lead: {
            name: payload.lead.name,
            email: payload.lead.email,
            company: payload.lead.company,
            phone: payload.lead.phone
          }
        }),
        created_at: existingEntry?.created_at || now,
        ...(existingEntry && { updated_at: now })
      };
      
      return registry;
    });

    // Step 11: Create/update Chatwoot contact if lead information is provided
    if (payload.lead) {
      try {
        const leadPayload = {
          lead: {
            name: payload.lead.name,
            email: payload.lead.email,
            company: payload.lead.company,
            phone: payload.lead.phone,
            consent: payload.lead.consent
          },
          demo: {
            slug,
            business_url: payload.url,
            demo_url: demoUrl,
            system_message_file: systemMessageFile,
            inbox_id: inbox_id
          }
        };

        // Call the lead endpoint internally
        const leadResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || `http://${process.env.DEMO_DOMAIN || 'localhost:3000'}`}/api/demo/lead`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadPayload)
        });

        if (!leadResponse.ok) {
          console.warn('Lead creation failed during demo creation:', await leadResponse.text());
        }
      } catch (leadError) {
        console.warn('Lead creation failed during demo creation (non-blocking):', leadError);
        // Continue with demo creation even if lead creation fails
      }
    }

    // Database save already completed in Step 9

    // Step 13: Return success response (simplified for user-facing API)
    const response = {
      demo_url: demoUrl,
      system_message_file: `/system-message/n8n_System_Message_${slug}`
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Demo create API error:', error);
    
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      // Website fetching errors
      if (errorMessage.includes('not accessible') || errorMessage.includes('connection refused')) {
        return NextResponse.json(
          { error: `Website not accessible: ${errorMessage}` },
          { status: 400 }
        );
      }
      
      if (errorMessage.includes('SSL certificate error')) {
        return NextResponse.json(
          { error: `SSL certificate issue: ${errorMessage}` },
          { status: 400 }
        );
      }
      
      if (errorMessage.includes('Timeout error')) {
        return NextResponse.json(
          { error: `Website timeout: ${errorMessage}` },
          { status: 408 }
        );
      }
      
      // Chatwoot errors
      if (errorMessage.includes('Chatwoot')) {
        return NextResponse.json(
          { error: `Chat service error: ${errorMessage}` },
          { status: 502 }
        );
      }
      
      // OpenAI errors
      if (errorMessage.includes('OpenAI') || errorMessage.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service error. Please try again later.' },
          { status: 502 }
        );
      }
      
      return NextResponse.json(
        { error: `Demo creation failed: ${errorMessage}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
