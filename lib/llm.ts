import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateKBFromWebsite(cleanedText: string, url: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const systemPrompt = `You produce a precise Business Knowledge Base in Markdown from website content.
Sections (exact names):
- Project Overview (One-liner; Goals & objectives; Unique value prop)
- Key Features & Functionality (Core; Advanced; Integrations)
- Architecture & Tech Stack (Frontend; Backend; DB; Hosting; APIs; Deployment)
- User Journey (Typical flow; 2–3 Examples)
- Operations & Processes (Onboarding; Support; Billing)
- Governance & Security (Auth; Data handling; Backups)
- FAQs & Troubleshooting (2–5 Q&As + steps)
- Glossary (8–12 key terms)
If unknown, write "Unknown". Keep links only if on the same domain. No fluff.`;

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

    return content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to generate knowledge base: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
