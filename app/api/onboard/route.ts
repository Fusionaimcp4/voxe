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
import { logger } from '@/lib/logger';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import path from 'path';

export const runtime = "nodejs";

// Generate slug with hash for uniqueness (same as inspect API)
function generateSlugWithHash(url: string): string {
  const hostname = new URL(url).hostname.replace(/^www\./, '');
  const urlHash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
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

export interface OnboardPayload {
  business_url: string;
  business_name?: string;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  canonicalUrls?: CanonicalUrl[];
}

export interface DemoRegistry {
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
    created_at: string;
    updated_at?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload: OnboardPayload = await request.json();
    
    // Validate input
    if (!payload.business_url) {
      return NextResponse.json(
        { error: 'business_url is required' },
        { status: 400 }
      );
    }

    // Validate URL
    let url: URL;
    try {
      url = new URL(payload.business_url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid business_url format' },
        { status: 400 }
      );
    }

    // Infer business name from hostname if not provided
    const businessName = payload.business_name || url.hostname.replace(/^www\./, '');
    const slug = slugify(businessName);

    if (!slug) {
      return NextResponse.json(
        { error: 'Could not generate valid slug from business name' },
        { status: 400 }
      );
    }

    // Check for existing KB file from user preview
    const slugWithHash = generateSlugWithHash(payload.business_url);
    const previewSystemMessageFile = `./public/system_messages/n8n_System_Message_${slugWithHash}.md`;
    const adminSystemMessageFile = `./public/system_messages/n8n_System_Message_${businessName}.md`;
    
    let finalSystemMessage: string;
    let systemMessageFile: string;
    let reusingPreview = false;

    // Check if we have a fresh preview file to reuse
    const hasPreviewFile = await isFileFresh(previewSystemMessageFile);
    
    if (hasPreviewFile && slugWithHash !== businessName) {
      // Reuse preview file but copy it to admin naming convention
      logger.debug(`Reusing preview KB for ${businessName} from ${slugWithHash}`);
      const previewContent = await readTextFileIfExists(previewSystemMessageFile);
      if (previewContent) {
        finalSystemMessage = previewContent;
        systemMessageFile = adminSystemMessageFile;
        await writeTextFile(systemMessageFile, finalSystemMessage);
        reusingPreview = true;
      }
    } else if (hasPreviewFile && slugWithHash === businessName) {
      // Preview file has same name as admin file, just use it
      logger.debug(`Reusing preview KB for ${businessName}`);
      const previewContent = await readTextFileIfExists(previewSystemMessageFile);
      if (previewContent) {
        finalSystemMessage = previewContent;
        systemMessageFile = previewSystemMessageFile;
        reusingPreview = true;
      }
    }
    
    if (!reusingPreview) {
      // Generate new KB (original flow)
      logger.info(`Generating new KB for ${businessName}`);
      
      // Step 1: Fetch and clean website content
      const { cleanedText } = await fetchAndClean(payload.business_url);

      // Step 2: Generate knowledge base
      const kbMarkdown = await generateKBFromWebsite(cleanedText, payload.business_url);

      // Step 3: Load skeleton template from database or file
      const skeletonText = await getPublishedSystemMessageTemplate();

      // Step 4: Merge KB into skeleton
      finalSystemMessage = mergeKBIntoSkeleton(skeletonText, kbMarkdown);

      // Step 5: Set system message file path
      systemMessageFile = adminSystemMessageFile;
    }
    
    // Always inject/update Website links section (for both new and reused files)
    if (finalSystemMessage) {
      finalSystemMessage = injectWebsiteLinksSection(
        finalSystemMessage, 
        payload.business_url, 
        payload.canonicalUrls || []
      );
      
      // Write the updated system message file
      await writeTextFile(systemMessageFile, finalSystemMessage);
    }

    // Step 6: Create demo URL and Chatwoot inbox
    // Use Next.js route structure for both local and production
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : `http://${process.env.DEMO_DOMAIN || 'localhost:3000'}`;
    const demoUrl = `${baseUrl}/demo/${slug}`;
    
    const { inbox_id, website_token } = await createWebsiteInbox(businessName, demoUrl);

    // Step 7: Render demo HTML
    const chatwootBaseUrl = process.env.CHATWOOT_BASE_URL || 'https://chatwoot.mcp4.ai';
    const demoHTML = renderDemoHTML({
      businessName,
      slug,
      primary: payload.primary_color,
      secondary: payload.secondary_color,
      logoUrl: payload.logo_url,
      chatwootBaseUrl,
      websiteToken: website_token
    });

    // Step 8: Write demo HTML file
    const demoRoot = process.env.DEMO_ROOT || './public/demos';
    const demoIndexPath = path.join(demoRoot, slug, 'index.html');
    await writeTextFile(demoIndexPath, demoHTML);

    // Step 9: Setup Chatwoot bot and trigger n8n workflow duplication
    let botId: number | string | undefined;
    let botAccessToken: string | undefined;
    let botSetupSkipped = false;
    let botSetupReason = '';
    let workflowDuplicationResult: { success: boolean; error?: string } | undefined;

    try {
      // 1) Create Chatwoot Agent Bot named "<BusinessName> Bot" with webhook https://n8n.sost.work/webhook/<BusinessName>
      logger.info(`Creating agent bot for ${businessName}...`);
      const bot = await createAgentBot(businessName);
      botId = bot.id;
      botAccessToken = bot.access_token;
      logger.info(`Agent bot created with ID: ${botId}`);

      // 2) Assign bot to the newly created inbox
      logger.info(`Assigning bot ${botId} to inbox ${inbox_id}...`);
      try {
        await assignBotToInbox(inbox_id, botId);
        logger.info(`Bot successfully assigned to inbox`);
      } catch (assignError) {
        logger.warn(`Bot assignment failed, but continuing with workflow creation:`, assignError);
        // Don't fail the entire process if bot assignment fails
        // The bot was created successfully, assignment can be done manually
      }

      // 3) Trigger n8n workflow duplication via webhook (fire-and-forget)
      if (botAccessToken) {
        workflowDuplicationResult = await duplicateWorkflowViaWebhook(
          businessName,
          botAccessToken,
          finalSystemMessage
        );
      } else {
        logger.warn('No bot access token available, skipping workflow duplication');
        workflowDuplicationResult = { success: false, error: 'No bot access token available' };
      }
    } catch (e: any) {
      logger.error("Auto-create bot failed:", e);
      
      // Handle specific error types
      if (e.message === 'AGENT_BOT_API_NOT_AVAILABLE') {
        botSetupSkipped = true;
        botSetupReason = 'Agent bot API not available; configure via UI.';
      } else if (e.message && e.message.includes('chatwoot')) {
        botSetupSkipped = true;
        botSetupReason = 'Chatwoot API error; check configuration and try again.';
      } else {
        logger.warn('Bot creation failed, but demo creation continues:', e.message);
        botSetupSkipped = true;
        botSetupReason = 'Bot creation failed; ' + e.message;
      }
    }

    // Step 10: Update registry
    const registryPath = './data/registry/demos.json';
    await atomicJSONUpdate<DemoRegistry>(registryPath, (registry) => {
      const now = new Date().toISOString();
      const existingEntry = registry[slug];
      
      registry[slug] = {
        slug,
        business: businessName,
        url: payload.business_url,
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
        created_at: existingEntry?.created_at || now,
        ...(existingEntry && { updated_at: now })
      };
      
      return registry;
    });

    // Step 11: Return success response
    const response: any = {
      slug,
      business: businessName,
      url: payload.business_url,
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
      kb_reused: reusingPreview,
      created_at: new Date().toISOString()
    };

    // Handle bot setup failures
    if (botSetupSkipped) {
      response.bot_setup_skipped = true;
      response.reason = botSetupReason;
      response.suggested_steps = ["Create bot", "Set webhook", "Assign to inbox"];
    } else if (botId) {
      // Add success notes
      response.notes = {
        chatwoot_bot: `Created ${businessName} Bot, webhook set to https://n8n.sost.work/webhook/${businessName}, assigned to the new inbox.`,
        n8n_webhook_trigger: workflowDuplicationResult?.success 
          ? `Workflow duplication request sent successfully to n8n webhook endpoint.`
          : `Workflow duplication failed: ${workflowDuplicationResult?.error || 'Unknown error'}`,
        automation_status: workflowDuplicationResult?.success ? "✅ Complete" : "⚠️ Partial (manual setup may be required)"
      };
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    logger.error('Onboard API error:', error);
    
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
      
      if (errorMessage.includes('DNS error')) {
        return NextResponse.json(
          { error: `DNS resolution failed: ${errorMessage}` },
          { status: 400 }
        );
      }
      
      // Chatwoot errors
      if (errorMessage.includes('Chatwoot')) {
        return NextResponse.json(
          { error: `Chatwoot API error: ${errorMessage}` },
          { status: 502 }
        );
      }
      
      // OpenAI errors
      if (errorMessage.includes('OpenAI') || errorMessage.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service error. Please check API configuration.' },
          { status: 502 }
        );
      }
      
      // File system errors
      if (errorMessage.includes('EACCES') || errorMessage.includes('permission')) {
        return NextResponse.json(
          { error: 'File permission denied. Check DEMO_ROOT permissions.' },
          { status: 500 }
        );
      }
      
      // Generic error with message
      return NextResponse.json(
        { error: `Request failed: ${errorMessage}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
