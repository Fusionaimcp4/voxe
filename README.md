# Voxe

Voxe is a self-hosted AI-first customer support platform that ensures customers are always acknowledged while cutting operational costs. Unlike legacy vendors, you pay once for setup, own your data, and scale with unlimited agents and unlimited AI resolutions.

## Features

- **Unlimited Usage**: No per-seat or per-resolution fees
- **Self-Hosted Control**: You own your customer data and run on your infrastructure
- **AI + Human Hybrid**: Intelligent routing with "Holding AI" to prevent customer wait gaps
- **95%+ Automation**: Automated response rate with seamless human handoff
- **Full Data Ownership**: Complete control over your customer support data

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Integrations**: Chatwoot chat widget, Vercel Analytics
- **AI**: OpenAI GPT-4o-mini for knowledge base generation

## Business Demo Workflow

The Business Demo Workflow allows you to automatically generate AI-powered demo sites with custom knowledge bases extracted from any website.

### API Usage

```bash
POST /api/onboard
Content-Type: application/json

{
  "business_url": "https://example.com",
  "business_name": "Example Corp",
  "primary_color": "#0ea5e9",
  "secondary_color": "#111827",
  "logo_url": "https://example.com/logo.png"
}
```

### CLI Usage

```bash
ts-node scripts/onboard-business.ts --url https://fusion.mcp4.ai --name Fusion --primary "#0ea5e9" --secondary "#111827"
```

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Chatwoot
CHATWOOT_BASE_URL=https://chatvoxe.mcp4.ai
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_API_KEY=your_chatwoot_api_key_here

# n8n Integration (webhook-based workflow duplication)
N8N_DUPLICATE_ENDPOINT=https://n8n.mcp4.ai/webhook/duplicate-agent

# LLM
OPENAI_API_KEY=sk-your_openai_api_key_here

# Application URL (for demo links)
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Local development
# NEXT_PUBLIC_BASE_URL=https://your-domain.com  # Production

# Files/hosting (legacy - now uses Next.js routes)
SKELETON_PATH=./data/templates/n8n_System_Message.md
DEMO_ROOT=./public/demos
DEMO_DOMAIN=localboxs.com
```

### Workflow Outputs

The system generates:

1. **Knowledge Base**: AI-extracted business information in Markdown format
2. **System Message**: Merged skeleton template with business-specific knowledge at `/public/system_messages/n8n_System_Message_<Business>.md`
3. **Demo Site**: Custom-branded HTML page served via Next.js route `/demo/<slug>`
4. **System Message View**: Formatted view via Next.js route `/system-message/<filename>`
5. **Chatwoot Inbox**: Dedicated chat inbox for the business demo
6. **n8n Workflow**: Auto-cloned and configured workflow with business-specific settings (when n8n API is configured)
7. **Chatwoot Agent Bot**: Automated bot assigned to the inbox with proper webhook configuration (when n8n API is configured)
8. **JSON Registry**: Persistent record of created demos for tracking

### Automated Workflow Integration

When the n8n webhook endpoint is configured, the system automatically:

- **Creates** a Chatwoot website inbox for the business demo
- **Creates** a Chatwoot Agent Bot named `<BusinessName> Bot` with webhook URL pointing to n8n
- **Assigns** the bot to the inbox using the correct `/set_agent_bot` endpoint with `{"agent_bot": <bot_id>}`
- **Verifies** bot assignment by checking inbox details
- **Triggers** n8n workflow duplication via webhook endpoint
- **Sends** business name, bot access token, and system message to your n8n automation
- **Provides** fire-and-forget integration that doesn't block the demo creation process
- **Logs** success/failure status for monitoring and troubleshooting

### File Structure

```
/data/templates/n8n_System_Message.md        # Skeleton template
/data/registry/demos.json                    # Demo registry
/public/system_messages/                     # Generated system messages
/public/demos/<slug>/index.html              # Demo landing pages
/lib/                                        # Core utilities
/app/admin/onboard/                          # Admin UI
/app/api/onboard/                            # API endpoint
/scripts/onboard-business.ts                 # CLI tool
```

### Manual Steps After Generation

**With n8n webhook endpoint configured (automatic):**
1. ✅ Chatwoot bot automatically created and assigned
2. ✅ n8n workflow duplication automatically triggered via webhook
3. ✅ System message and bot configuration sent to your n8n automation
4. ✅ Webhook automation handles workflow setup
5. Test the demo URL to ensure the chat widget works end-to-end

**Without n8n webhook (manual):**
1. Create and assign Chatwoot bot manually
2. Duplicate the Main n8n workflow in the n8n UI  
3. Name the new workflow with the business name
4. Open the "Main AI" node and paste the generated system message content
5. Set webhook path to the business name and configure bot authentication
6. Test the demo URL to ensure the chat widget works end-to-end

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure your API keys
4. Run the development server: `npm run dev`
5. Access the admin interface at `/admin/onboard`

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run CLI onboarding
ts-node scripts/onboard-business.ts --url https://example.com
```

## License

This project is private and proprietary to Voxe/Fusion AI.
