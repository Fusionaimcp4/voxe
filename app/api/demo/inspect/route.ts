import { NextRequest, NextResponse } from 'next/server';
import { fetchAndClean } from '@/lib/scrape';
import { generateKBFromWebsite } from '@/lib/llm';
import { mergeKBIntoSkeleton, injectWebsiteLinksSection, CanonicalUrl } from '@/lib/merge';
import { slugify } from '@/lib/slug';
import { writeTextFile, readTextFileIfExists } from '@/lib/fsutils';
import { promises as fs } from 'fs';
import crypto from 'crypto';

export const runtime = "nodejs";

interface InspectRequest {
  url: string;
  generateKB?: boolean;
  force?: boolean;
  canonicalUrls?: CanonicalUrl[];
}

interface KnowledgePreview {
  project_overview?: string;
  goals_objectives?: string;
  unique_value_prop?: string;
  key_features?: string[];
  architecture_tech_stack?: string;
  user_journey?: string;
}

// Parse knowledge base sections from .md content
function parseKnowledgeBase(mdContent: string): KnowledgePreview {
  const sections: KnowledgePreview = {};
  
  // Find the Knowledge Base section
  const kbStartIndex = mdContent.indexOf('## Knowledge Base');
  if (kbStartIndex === -1) return sections;
  
  // Extract content after Knowledge Base header
  let kbContent = mdContent.substring(kbStartIndex);
  
  // If content is in a markdown code block, extract it
  const codeBlockStart = kbContent.indexOf('```markdown');
  if (codeBlockStart !== -1) {
    const contentStart = kbContent.indexOf('\n', codeBlockStart) + 1;
    const codeBlockEnd = kbContent.indexOf('```', contentStart);
    if (codeBlockEnd !== -1) {
      kbContent = kbContent.substring(contentStart, codeBlockEnd);
    }
  }
  
  // Find the end of KB section (next # header or end of content)
  const nextHeaderIndex = kbContent.indexOf('\n# ');
  if (nextHeaderIndex !== -1) {
    kbContent = kbContent.substring(0, nextHeaderIndex);
  }
  
  // Split by ## headers and process each section
  const lines = kbContent.split('\n');
  let currentSectionKey: keyof KnowledgePreview | null = null;
  let currentContent: string[] = [];
  
  for (const line of lines) {
    if (line.startsWith('## ')) {
      // Save previous section if exists
      if (currentSectionKey && currentContent.length > 0) {
        const content = currentContent.join('\n').trim();
        if (content) {
          saveSection(sections, currentSectionKey, content);
        }
      }
      
      // Start new section (only if it's one we want to process)
      const newSectionKey = getCurrentSectionKey(line);
      currentSectionKey = newSectionKey;
      currentContent = [];
    } else if (currentSectionKey) {
      currentContent.push(line);
    }
  }
  
  // Save final section
  if (currentSectionKey && currentContent.length > 0) {
    const content = currentContent.join('\n').trim();
    if (content) {
      saveSection(sections, currentSectionKey, content);
    }
  }
  
  return sections;
}

function getCurrentSectionKey(firstLine: string): keyof KnowledgePreview | null {
  const lower = firstLine.toLowerCase();
  if (lower.includes('project overview')) return 'project_overview';
  if (lower.includes('goals') || lower.includes('objectives')) return 'goals_objectives';
  if (lower.includes('unique value') || lower.includes('value prop')) return 'unique_value_prop';
  if (lower.includes('key features') || lower.includes('functionality')) return 'key_features';
  if (lower.includes('architecture') || lower.includes('tech stack')) return 'architecture_tech_stack';
  if (lower.includes('user journey')) return 'user_journey';
  return null; // Only process sections we explicitly want
}

function saveSection(sections: KnowledgePreview, key: keyof KnowledgePreview, content: string) {
  if (key === 'key_features') {
    // Extract bullet points for features
    const features = content.split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map(line => line.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean);
    sections[key] = features;
  } else if (key === 'project_overview') {
    // Extract specific parts from project overview
    const lines = content.split('\n').filter(line => line.trim());
    let oneLiner = '';
    let goalsObjectives = '';
    let uniqueValueProp = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.includes('One-liner:')) {
        // Handle both formats: "- **One-liner:** ..." and "**One-liner:** ..."
        oneLiner = trimmedLine.replace(/^[-*\s]*\*\*One-liner:\*\*\s*/, '').trim();
      } else if (trimmedLine.includes('Goals & objectives:')) {
        goalsObjectives = trimmedLine.replace(/^[-*\s]*\*\*Goals & objectives:\*\*\s*/, '').trim();
      } else if (trimmedLine.includes('Unique value prop:')) {
        uniqueValueProp = trimmedLine.replace(/^[-*\s]*\*\*Unique value prop:\*\*\s*/, '').trim();
      }
    }
    
    // Combine all parts into a comprehensive overview
    const parts = [];
    if (oneLiner) parts.push(`**One-liner:** ${oneLiner}`);
    if (goalsObjectives) parts.push(`**Goals & objectives:** ${goalsObjectives}`);
    if (uniqueValueProp) parts.push(`**Unique value prop:** ${uniqueValueProp}`);
    
    sections[key] = parts.length > 0 ? parts.join('\n\n') : content;
  } else {
    sections[key] = content;
  }
}

// Generate slug with hash for uniqueness
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Validate URL
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(url);
      if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch and clean website content
    const { cleanedText } = await fetchAndClean(url);
    
    // Extract basic business info (simplified version)
    const businessName = validatedUrl.hostname.replace(/^www\./, '');
    
    // Create a simple summary from the cleaned text
    const summary = cleanedText.length > 200 
      ? cleanedText.substring(0, 200) + '...' 
      : cleanedText;

    const businessInfo = {
      url,
      name: businessName,
      summary: summary,
      primaryColor: '#0ea5e9',
      secondaryColor: '#38bdf8',
      // logoUrl could be extracted from the page if needed
    };

    return NextResponse.json(businessInfo, { status: 200 });

  } catch (error) {
    console.error('Demo inspect API error:', error);
    
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
      
      return NextResponse.json(
        { error: `Failed to inspect website: ${errorMessage}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload: InspectRequest = await request.json();
    
    if (!payload.url) {
      return NextResponse.json(
        { error: 'url is required' },
        { status: 400 }
      );
    }

    // Validate URL
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(payload.url);
      if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const businessName = validatedUrl.hostname.replace(/^www\./, '');
    const slug = generateSlugWithHash(payload.url);
    
    let knowledgePreview: KnowledgePreview = {};
    let systemMessageFile = '';
    let fromCache = false;
    let generatedAt = new Date().toISOString();

    if (payload.generateKB) {
      // Check if we should generate or reuse KB
      systemMessageFile = `./public/system_messages/n8n_System_Message_${slug}.md`;
      const publicPath = `/system-message/n8n_System_Message_${slug}`;
      
      const shouldRegenerate = payload.force || !(await isFileFresh(systemMessageFile));
      
      if (shouldRegenerate) {
        // Generate new KB
        console.log(`Generating KB for ${businessName}...`);
        
        // Fetch and clean website content
        const { cleanedText } = await fetchAndClean(payload.url);
        
        // Generate knowledge base
        const kbMarkdown = await generateKBFromWebsite(cleanedText, payload.url);
        
        // Load skeleton template and merge
        const skeletonPath = process.env.SKELETON_PATH || './data/templates/n8n_System_Message.md';
        const skeletonText = await readTextFileIfExists(skeletonPath);
        
        if (!skeletonText) {
          return NextResponse.json(
            { error: 'System template not found', system_message_file: null, retry_suggested: true },
            { status: 500 }
          );
        }
        
        const finalSystemMessage = mergeKBIntoSkeleton(skeletonText, kbMarkdown);
        
        // Inject Website links section
        const systemMessageWithLinks = injectWebsiteLinksSection(
          finalSystemMessage, 
          payload.url, 
          payload.canonicalUrls || []
        );
        
        // Save the system message file
        await writeTextFile(systemMessageFile, systemMessageWithLinks);
        
        // Parse knowledge base sections
        knowledgePreview = parseKnowledgeBase(finalSystemMessage);
        generatedAt = new Date().toISOString();
        fromCache = false;
        
        console.log(`✅ Generated KB for ${businessName}`);
      } else {
        // Reuse existing file
        console.log(`Reusing existing KB for ${businessName}`);
        const existingContent = await readTextFileIfExists(systemMessageFile);
        if (existingContent) {
          // Always inject/update Website links section (even for cached files)
          const systemMessageWithLinks = injectWebsiteLinksSection(
            existingContent, 
            payload.url, 
            payload.canonicalUrls || []
          );
          
          // Update the file with website links
          await writeTextFile(systemMessageFile, systemMessageWithLinks);
          
          knowledgePreview = parseKnowledgeBase(systemMessageWithLinks);
          const stats = await fs.stat(systemMessageFile);
          generatedAt = stats.mtime.toISOString();
          fromCache = true;
        }
      }
      
      // Return rich response with KB preview
      return NextResponse.json({
        url: payload.url,
        name: businessName,
        slug,
        knowledge_preview: knowledgePreview,
        system_message_file: publicPath,
        generated_at: generatedAt,
        from_cache: fromCache
      }, { status: 200 });
      
    } else {
      // Fallback to simple business info (backward compatibility)
      const { cleanedText } = await fetchAndClean(payload.url);
      const summary = cleanedText.length > 200 
        ? cleanedText.substring(0, 200) + '...' 
        : cleanedText;

      return NextResponse.json({
        url: payload.url,
        name: businessName,
        summary,
        primaryColor: '#0ea5e9',
        secondaryColor: '#38bdf8'
      }, { status: 200 });
    }

  } catch (error) {
    console.error('Demo inspect POST API error:', error);
    
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      // Website fetching errors
      if (errorMessage.includes('not accessible') || errorMessage.includes('connection refused')) {
        return NextResponse.json(
          { error: `Website not accessible: ${errorMessage}`, system_message_file: null, retry_suggested: true },
          { status: 400 }
        );
      }
      
      if (errorMessage.includes('SSL certificate error')) {
        return NextResponse.json(
          { error: `SSL certificate issue: ${errorMessage}`, system_message_file: null, retry_suggested: true },
          { status: 400 }
        );
      }
      
      if (errorMessage.includes('Timeout error')) {
        return NextResponse.json(
          { error: `Website timeout: ${errorMessage}`, system_message_file: null, retry_suggested: true },
          { status: 408 }
        );
      }
      
      // AI errors
      if (errorMessage.includes('OpenAI') || errorMessage.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable', system_message_file: null, retry_suggested: true },
          { status: 502 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to inspect website: ${errorMessage}`, system_message_file: null, retry_suggested: true },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', system_message_file: null, retry_suggested: true },
      { status: 500 }
    );
  }
}
