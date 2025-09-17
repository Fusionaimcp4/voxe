export function mergeKBIntoSkeleton(skeleton: string, kb: string): string {
  if (!kb?.trim()) {
    throw new Error('Empty KB provided');
  }
  
  const hasSection = /##\s*Knowledge Base/i.test(skeleton);
  
  if (hasSection) {
    return skeleton.replace(
      /##\s*Knowledge Base[\s\S]*?(?=(\n#|\n##|\n$))/i,
      `## Knowledge Base\n\n${kb}\n\n`
    );
  }
  
  return `${skeleton}\n\n## Knowledge Base\n\n${kb}\n`;
}

export interface CanonicalUrl {
  title: string;
  url: string;
}

export function injectWebsiteLinksSection(
  systemMessage: string, 
  websiteUrl: string, 
  canonicalUrls: CanonicalUrl[] = []
): string {
  // Create the website links section
  const websiteLinksSection = createWebsiteLinksSection(websiteUrl, canonicalUrls);
  
  // Check if section already exists
  const existingSectionRegex = /##\s*Website links \(canonical\)[\s\S]*?(?=(\n#|\n##|\n$))/i;
  const hasExistingSection = existingSectionRegex.test(systemMessage);
  
  if (hasExistingSection) {
    // Replace existing section
    return systemMessage.replace(existingSectionRegex, websiteLinksSection);
  } else {
    // Find the best insertion point after Knowledge Base section
    const kbSectionRegex = /##\s*Knowledge Base[\s\S]*?(?=(\n#|\n##|\n$))/i;
    const kbMatch = systemMessage.match(kbSectionRegex);
    
    if (kbMatch) {
      // Insert after Knowledge Base section
      const kbEndIndex = kbMatch.index! + kbMatch[0].length;
      return systemMessage.slice(0, kbEndIndex) + '\n\n' + websiteLinksSection + systemMessage.slice(kbEndIndex);
    } else {
      // Append at the end if no Knowledge Base section found
      return systemMessage + '\n\n' + websiteLinksSection;
    }
  }
}

function createWebsiteLinksSection(websiteUrl: string, canonicalUrls: CanonicalUrl[]): string {
  const primarySite = websiteUrl || '(not provided)';
  
  let canonicalUrlsMd = '- (none provided)';
  if (canonicalUrls.length > 0) {
    canonicalUrlsMd = canonicalUrls
      .map(url => `- ${url.title}: ${url.url}`)
      .join('\n');
  }
  
  return `## Website links (canonical)

Primary site: ${primarySite}

When answering:
- Provide a clear and complete answer directly in the chat.
- If the user explicitly asks for a link, or if the answer relies on a specific page/resource, then include a Markdown link on first mention.
- Use only the canonical URLs listed below (do not invent slugs).
- If no exact page exists, say so briefly and (optionally) provide the closest relevant page.
- Do not automatically add "Read more" lines unless the user asks for further resources.

### Canonical URLs
${canonicalUrlsMd}

### Output style
- Keep links in Markdown: \`[anchor text](https://YOUR-DOMAIN.com/...)\`
- End with: \`🔗 Read more: <URL>\``;
}