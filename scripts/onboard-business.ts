#!/usr/bin/env ts-node

import { fetchAndClean } from '../lib/scrape';
import { generateKBFromWebsite } from '../lib/llm';
import { mergeKBIntoSkeleton } from '../lib/merge';
import { createWebsiteInbox } from '../lib/chatwoot';
import { renderDemoHTML } from '../lib/renderDemo';
import { slugify } from '../lib/slug';
import { writeTextFile, readTextFileIfExists, atomicJSONUpdate } from '../lib/fsutils';
import path from 'path';

interface CliArgs {
  url: string;
  name?: string;
  primary?: string;
  secondary?: string;
  logo?: string;
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
    created_at: string;
    updated_at?: string;
  };
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = { url: '' };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--url':
        if (!nextArg) throw new Error('--url requires a value');
        result.url = nextArg;
        i++;
        break;
      case '--name':
        if (!nextArg) throw new Error('--name requires a value');
        result.name = nextArg;
        i++;
        break;
      case '--primary':
        if (!nextArg) throw new Error('--primary requires a value');
        result.primary = nextArg;
        i++;
        break;
      case '--secondary':
        if (!nextArg) throw new Error('--secondary requires a value');
        result.secondary = nextArg;
        i++;
        break;
      case '--logo':
        if (!nextArg) throw new Error('--logo requires a value');
        result.logo = nextArg;
        i++;
        break;
      default:
        if (arg.startsWith('--')) {
          throw new Error(`Unknown flag: ${arg}`);
        }
        break;
    }
  }
  
  if (!result.url) {
    console.error('Usage: ts-node scripts/onboard-business.ts --url <string> [--name <string>] [--primary <#hex>] [--secondary <#hex>] [--logo <url>]');
    process.exit(1);
  }
  
  return result;
}

async function main() {
  try {
    const args = parseArgs();
    
    // Validate URL
    let url: URL;
    try {
      url = new URL(args.url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      throw new Error('Invalid URL format');
    }

    // Infer business name from hostname if not provided
    const businessName = args.name || url.hostname.replace(/^www\./, '');
    const slug = slugify(businessName);

    if (!slug) {
      throw new Error('Could not generate valid slug from business name');
    }

    console.error('🔍 Fetching and cleaning website content...');
    const { cleanedText } = await fetchAndClean(args.url);

    console.error('🤖 Generating knowledge base with AI...');
    const kbMarkdown = await generateKBFromWebsite(cleanedText, args.url);

    console.error('📄 Loading skeleton template...');
    const skeletonPath = process.env.SKELETON_PATH || './data/templates/n8n_System_Message.md';
    const skeletonText = await readTextFileIfExists(skeletonPath);
    
    if (!skeletonText) {
      throw new Error('Skeleton template not found');
    }

    console.error('🔗 Merging knowledge base into skeleton...');
    const finalSystemMessage = mergeKBIntoSkeleton(skeletonText, kbMarkdown);

    console.error('💾 Writing system message file...');
    const systemMessageFile = `./public/system_messages/n8n_System_Message_${businessName}.md`;
    await writeTextFile(systemMessageFile, finalSystemMessage);

    console.error('💬 Creating Chatwoot inbox...');
    // Use Next.js route structure for both local and production
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : `http://${process.env.DEMO_DOMAIN || 'localhost:3000'}`;
    const demoUrl = `${baseUrl}/demo/${slug}`;
    
    const { inbox_id, website_token } = await createWebsiteInbox(businessName, demoUrl);

    console.error('🎨 Rendering demo HTML...');
    const chatwootBaseUrl = process.env.CHATWOOT_BASE_URL || 'https://chatwoot.mcp4.ai';
    const demoHTML = renderDemoHTML({
      businessName,
      slug,
      primary: args.primary,
      secondary: args.secondary,
      logoUrl: args.logo,
      chatwootBaseUrl,
      websiteToken: website_token
    });

    console.error('📁 Writing demo HTML file...');
    const demoRoot = process.env.DEMO_ROOT || './public/demos';
    const demoIndexPath = path.join(demoRoot, slug, 'index.html');
    await writeTextFile(demoIndexPath, demoHTML);

    console.error('📋 Updating registry...');
    const registryPath = './data/registry/demos.json';
    await atomicJSONUpdate<DemoRegistry>(registryPath, (registry) => {
      const now = new Date().toISOString();
      const existingEntry = registry[slug];
      
      registry[slug] = {
        slug,
        business: businessName,
        url: args.url,
        system_message_file: systemMessageFile,
        demo_url: demoUrl,
        chatwoot: {
          inbox_id,
          website_token
        },
        created_at: existingEntry?.created_at || now,
        ...(existingEntry && { updated_at: now })
      };
      
      return registry;
    });

    // Output JSON summary to stdout
    const response = {
      slug,
      business: businessName,
      url: args.url,
      system_message_file: systemMessageFile,
      demo_url: demoUrl,
      chatwoot: {
        inbox_id,
        website_token
      },
      created_at: new Date().toISOString()
    };

    console.log(JSON.stringify(response, null, 2));

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
