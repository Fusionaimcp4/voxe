import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Clean empty or "Unknown"-filled sections from generated KB
 */
function cleanEmptySections(kbMarkdown: string): string {
  // Split into sections by ## headers
  const sections = kbMarkdown.split(/^## /m);
  
  const cleanedSections = sections.filter((section, index) => {
    // Always keep the first part (before any ## headers)
    if (index === 0) return true;
    
    // Extract section name and content
    const lines = section.trim().split('\n');
    const sectionName = lines[0];
    const content = lines.slice(1).join('\n');
    
    // Check if section should be removed
    const shouldRemove = (
      // Section has only "Unknown" values
      /^[\s\-\*\n]*Unknown[.\s]*$/im.test(content) ||
      
      // All sub-items are "Unknown" or "N/A"
      (content.match(/Unknown/gi)?.length || 0) >= 3 && content.length < 200 ||
      
      // Section is effectively empty
      content.trim().length < 10 ||
      
      // Section has only bullet points with Unknown
      /^[\s\-\*]*Unknown[.\s]*[\s\-\*]*Unknown/im.test(content)
    );
    
    // Log removed sections for debugging
    if (shouldRemove) {
      console.log(`🗑️ Removing empty section: "${sectionName}"`);
    }
    
    return !shouldRemove;
  });
  
  // Rejoin sections
  return cleanedSections.map((section, index) => {
    if (index === 0) return section;
    return '## ' + section;
  }).join('');
}

export async function generateKBFromWebsite(cleanedText: string, url: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const systemPrompt = `You produce a precise Business Knowledge Base in Markdown from website content.

CRITICAL RULES:
- Only include sections that contain REAL, SPECIFIC information
- Skip ENTIRE sections where all fields are "Unknown", "N/A", or cannot be determined from the website
- Quality over completeness - better to omit than to fill with "Unknown"
- Focus on actionable, useful information

Available Sections (only include if you have real data):
- Project Overview (One-liner; Goals & objectives; Unique value prop) - ALWAYS include this
- Key Features & Functionality (Core; Advanced; Integrations) - Only if specific features found
- Architecture & Tech Stack (Frontend; Backend; DB; Hosting; APIs; Deployment) - SKIP if all Unknown
- User Journey (Typical flow; 2–3 Examples) - Only if you can infer specific steps
- Operations & Processes (Onboarding; Support; Billing) - Only if mentioned on website
- Governance & Security (Auth; Data handling; Backups) - SKIP if all Unknown
- FAQs & Troubleshooting (2–5 Q&As + steps) - ALWAYS include if you find any Q&As
- Glossary (8–12 key terms) - Only include terms actually mentioned/needed

Examples of what to SKIP:
- "Frontend: Unknown" - Just omit the entire Architecture section
- "Auth: Unknown, Data handling: Unknown" - Skip Governance section entirely
- Generic user journeys with no specific details

Keep links only if on the same domain. No fluff.`;

  const userPrompt = `Website URL: ${url}
Website text (cleaned): ${cleanedText}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated from OpenAI');
    }

    // Clean up any remaining empty or "Unknown"-filled sections
    const cleanedContent = cleanEmptySections(content);
    
    return cleanedContent;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to generate knowledge base: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
