// Static help center data extracted from USER_GUIDE.md
// This file contains all help articles - update manually when USER_GUIDE.md changes

export interface HelpArticle {
  id: string
  title: string
  slug: string
  category: string
  categorySlug: string
  content: string
  excerpt: string
}

export interface HelpCategory {
  id: string
  title: string
  slug: string
  description: string
  articles: HelpArticle[]
}

export const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    slug: 'getting-started',
    description: 'Learn how to set up your account and understand key concepts',
    articles: [
      {
        id: 'account-setup',
        title: 'Account Setup',
        slug: 'account-setup',
        category: 'Getting Started',
        categorySlug: 'getting-started',
        excerpt: 'Create your account, verify your email, and start your free trial',
        content: `1. **Sign Up**: Create your account using email/password or Google OAuth
2. **Verify Email**: Check your inbox and click the verification link (required for dashboard access)
3. **Free Trial**: All new accounts receive a 14-day free trial with access to FREE tier features`,
      },
      {
        id: 'dashboard-overview',
        title: 'Dashboard Overview',
        slug: 'dashboard-overview',
        category: 'Getting Started',
        categorySlug: 'getting-started',
        excerpt: 'Navigate your dashboard and understand the main features',
        content: `After logging in, you'll see your dashboard with:

- **Overview Statistics**: Total demos, active workflows, contacts, and knowledge bases
- **Quick Actions**: Create demo, manage workflows, upload documents
- **Navigation Menu**: Access all features from the sidebar`,
      },
      {
        id: 'key-concepts',
        title: 'Key Concepts',
        slug: 'key-concepts',
        category: 'Getting Started',
        categorySlug: 'getting-started',
        excerpt: 'Understand the core concepts: demos, workflows, knowledge bases, and integrations',
        content: `- **Demo**: A customer-facing chatbot page created from a website URL
- **Workflow**: The AI automation that processes customer messages
- **Knowledge Base**: Document library that provides context to your AI
- **Integration**: Enables connections to both internal systems and optional external platforms, such as helpdesk and CRM solutions.`,
      },
    ],
  },
  {
    id: 'creating-your-first-demo',
    title: 'Creating Your First Demo',
    slug: 'creating-your-first-demo',
    description: 'Step-by-step guide to creating an AI-powered chatbot from your website',
    articles: [
      {
        id: 'step-by-step-process',
        title: 'Step-by-Step Process',
        slug: 'step-by-step-process',
        category: 'Creating Your First Demo',
        categorySlug: 'creating-your-first-demo',
        excerpt: 'Complete walkthrough of creating a demo from website URL to working chatbot',
        content: `#### Step 1: Enter Website URL

1. Navigate to **Dashboard** → **Create Demo** (or \`/dashboard/userdemo\`)
2. Enter your business website URL (e.g., \`https://example.com\`)
3. Click **Inspect Website**

The system will:
- Analyze your website content
- Extract business information
- Generate a knowledge preview
- Identify your brand colors and logo

**Note**: This process may take 1-2 minutes depending on your website size.

#### Step 2: Review Business Information

After inspection, you'll see:
- Business name (auto-detected or editable)
- Business summary
- Knowledge preview sections (project overview, goals, features, etc.)
- Logo and color scheme

You can edit the business name if needed before proceeding.

#### Step 3: Configure Demo Settings

1. **Business Name**: Verify or update the business name
2. **Logo URL** (optional): Provide a direct image URL for your logo
3. **Primary Color** (optional): Hex color code (e.g., \`#7ee787\`)
4. **Secondary Color** (optional): Hex color code (e.g., \`#f4a261\`)

#### Step 4: Provide Contact Information

Enter contact details that will be associated with this demo:

- **Consent**: Check the box to confirm data processing consent.

**Note**: Contact information is pre-filled from your account if available.

#### Step 5: Create Demo

Click **Create Demo** to start the creation process. This will:

1. Generate a knowledge base from your website
2. Create a system message template for the AI
3. Set up a inbox for customer conversations
4. Create a workflow to process messages
5. Generate a demo page at \`/demo/[slug]\`

**Processing Time**: Demo creation typically takes 2-5 minutes. You'll see a success message when complete.

#### Step 6: Access Your Demo

Once created, you'll receive:
- **Demo URL**: Public link to your chatbot (e.g., \`https://voxe.mcp4.ai/demo/your-business-name\`)
- **System Message File**: Link to the generated AI prompt template

You can share the demo URL with your team to test how the chat widget and AI chatbot interact, or embed it directly on your website.
The Chat Widget Script becomes instantly available in your dashboard under the Chat Widget Script section once the demo is created.`,
      },
      {
        id: 'what-happens-behind-scenes',
        title: 'What Happens Behind the Scenes',
        slug: 'what-happens-behind-scenes',
        category: 'Creating Your First Demo',
        categorySlug: 'creating-your-first-demo',
        excerpt: 'Understanding the automated process of demo creation',
        content: `When you create a demo, the system:

1. **Scrapes Your Website**: Extracts text content, structure, and metadata
2. **Generates Knowledge Base**: Uses AI to create structured knowledge from your content
3. **Creates System Message**: Combines your business knowledge with AI instructions
4. **Sets Up Helpdesk**: Creates an inbox for managing conversations
5. **Creates Workflow**: Configures workflow to process messages
6. **Generates Demo Page**: Creates a public-facing chatbot interface`,
      },
    ],
  },
  {
    id: 'managing-knowledge-bases',
    title: 'Managing Knowledge Bases',
    slug: 'managing-knowledge-bases',
    description: 'Create, upload documents, and link knowledge bases to workflows',
    articles: [
      {
        id: 'creating-knowledge-base',
        title: 'Creating a Knowledge Base',
        slug: 'creating-knowledge-base',
        category: 'Managing Knowledge Bases',
        categorySlug: 'managing-knowledge-bases',
        excerpt: 'Create and organize your document libraries',
        content: `1. Navigate to **Dashboard** → **Knowledge Bases**
2. Click **Create Knowledge Base**
3. Enter:
   - **Name**: Descriptive name (e.g., "Product Documentation")
   - **Description** (optional): Brief description of the content
4. Click **Create**`,
      },
      {
        id: 'uploading-documents',
        title: 'Uploading Documents',
        slug: 'uploading-documents',
        category: 'Managing Knowledge Bases',
        categorySlug: 'managing-knowledge-bases',
        excerpt: 'Add documents to your knowledge base',
        content: `1. Open your knowledge base
2. Click **Upload Document**
3. Select a file (PDF, DOCX, TXT, or other supported formats)
4. Wait for processing to complete

**Supported Formats**: PDF, DOCX, DOC, TXT, MD, and more`,
      },
      {
        id: 'document-processing',
        title: 'Document Processing',
        slug: 'document-processing',
        category: 'Managing Knowledge Bases',
        categorySlug: 'managing-knowledge-bases',
        excerpt: 'How documents are processed and indexed',
        content: `After upload, documents are automatically:

1. **Extracted**: Text is extracted from the file
2. **Chunked**: Content is split into manageable pieces
3. **Embedded**: Each chunk is converted to a vector embedding
4. **Indexed**: Stored for semantic search

**Processing Status**:
- **PENDING**: Uploaded, waiting for processing
- **PROCESSING**: Currently being processed
- **COMPLETED**: Ready to use
- **FAILED**: Error occurred (check error message)`,
      },
      {
        id: 'linking-to-workflows',
        title: 'Linking Knowledge Bases to Workflows',
        slug: 'linking-to-workflows',
        category: 'Managing Knowledge Bases',
        categorySlug: 'managing-knowledge-bases',
        excerpt: 'Connect your knowledge bases to workflows for AI context',
        content: `To use a knowledge base with a workflow:

1. Navigate to **Dashboard** → **Workflows**
2. Select your workflow
3. Go to **Knowledge Bases** section
4. Click **Link Knowledge Base**
5. Select the knowledge base and configure:
   - **Priority**: Order of search (lower numbers searched first)
   - **Retrieval Limit**: Number of chunks to retrieve (default: 5)
   - **Similarity Threshold**: Minimum similarity score (default: 0.7)`,
      },
      {
        id: 'best-practices-kb',
        title: 'Best Practices',
        slug: 'best-practices-kb',
        category: 'Managing Knowledge Bases',
        categorySlug: 'managing-knowledge-bases',
        excerpt: 'Tips for organizing and maintaining knowledge bases',
        content: `- **Organize by Topic**: Create separate knowledge bases for different topics
- **Keep Documents Focused**: Smaller, focused documents work better than large ones
- **Update Regularly**: Keep your knowledge bases current with your latest information
- **Use Descriptive Names**: Name knowledge bases clearly for easy identification`,
      },
    ],
  },
  {
    id: 'configuring-workflows',
    title: 'Configuring Workflows',
    slug: 'configuring-workflows',
    description: 'Manage workflow status, AI models, and timing thresholds',
    articles: [
      {
        id: 'workflow-status',
        title: 'Understanding Workflow Status',
        slug: 'workflow-status',
        category: 'Configuring Workflows',
        categorySlug: 'configuring-workflows',
        excerpt: 'Learn about different workflow states',
        content: `- **ACTIVE**: Workflow is running and processing messages
- **INACTIVE**: Workflow is stopped (not processing messages)
- **ERROR**: Workflow encountered an error (check logs)
- **PENDING**: Workflow is being set up`,
      },
      {
        id: 'starting-stopping-workflows',
        title: 'Starting and Stopping Workflows',
        slug: 'starting-stopping-workflows',
        category: 'Configuring Workflows',
        categorySlug: 'configuring-workflows',
        excerpt: 'Control when your workflows are active',
        content: `1. Navigate to **Dashboard** → **Workflows**
2. Find your workflow in the list
3. Click **Start** to activate or **Stop** to deactivate

**Note**: Only ACTIVE workflows process customer messages. Inactive workflows won't respond to chats.`,
      },
      {
        id: 'switching-ai-models',
        title: 'Switching AI Models',
        slug: 'switching-ai-models',
        category: 'Configuring Workflows',
        categorySlug: 'configuring-workflows',
        excerpt: 'Change the AI model used by your workflow',
        content: `You can change the AI model used by your workflow (optional):

1. Open your workflow
2. Click **Switch Model**
3. Select from available models
4. Click **Confirm**

**Model Selection Considerations**:
- **Speed**: Smaller models respond faster
- **Capability**: Larger models handle complex queries better.`,
      },
      {
        id: 'timing-thresholds',
        title: 'Configuring Timing Thresholds',
        slug: 'timing-thresholds',
        category: 'Configuring Workflows',
        categorySlug: 'configuring-workflows',
        excerpt: 'Set up escalation and response timing rules',
        content: `Based on the complexity of the question and the customer's needs, the AI support agent can escalate a conversation to your human team when required.
Timing thresholds control when the Holding AI steps in — sending friendly follow-up messages if a team member takes too long to respond, so customers stay engaged and never feel ignored.

1. Open your workflow
2. Go to **Timing Thresholds**
3. Configure:
   - **Assignee Threshold**: Seconds to wait after human response when assigned to agent (default: 300 seconds / 5 minutes)
   - **Team Threshold**: Seconds to wait when assigned to team (default: 100 seconds / ~1.7 minutes)
   - **Escalation Threshold**: Seconds before escalating to supervisor (default: 1800 seconds / 30 minutes)
   - **Escalation Contact**: Supervisor name for escalation notifications
   - **Escalation Message**: Custom message for escalation notifications
4. Click **Save**`,
      },
      {
        id: 'viewing-logs',
        title: 'Viewing Workflow Logs',
        slug: 'viewing-logs',
        category: 'Configuring Workflows',
        categorySlug: 'configuring-workflows',
        excerpt: 'Troubleshoot workflow issues with logs',
        content: `To troubleshoot workflow issues:

1. Open your workflow
2. Click **View Logs**
3. Review execution history, errors, and performance metrics`,
      },
    ],
  },
  {
    id: 'setting-up-integrations',
    title: 'Setting Up Integrations',
    slug: 'setting-up-integrations',
    description: 'Connect external services and manage integrations',
    articles: [
      {
        id: 'automatic-connection',
        title: 'One-Click Automatic Connection',
        slug: 'automatic-connection',
        category: 'Setting Up Integrations',
        categorySlug: 'setting-up-integrations',
        excerpt: 'Voxe automatically sets up most integrations',
        content: `Voxe handles most integrations automatically.

Voxe sets up a ready-to-use helpdesk admin account and inbox and workflow with one click.

Your AI chatbot, helpdesk, and automation system are instantly linked and ready to respond.

You can manage or expand integrations anytime from your Dashboard → Integrations page.`,
      },
      {
        id: 'manual-setup',
        title: 'Manual Integration Setup',
        slug: 'manual-setup',
        category: 'Setting Up Integrations',
        categorySlug: 'setting-up-integrations',
        excerpt: 'Set up custom integrations manually',
        content: `For advanced connections or custom helpdesk, you can still add integrations manually.

### Supported CRM Providers

- **Chatwoot**: customer engagement platform (auto-connected by default)
- **Salesforce**: Enterprise CRM (coming soon)
- **HubSpot**: Marketing and sales platform (coming soon)
- **Zoho**: Business software suite (coming soon)
- **Pipedrive**: Sales CRM (coming soon)
- **Custom**: Connect any REST API-based CRM using your own credentials`,
      },
      {
        id: 'chat-widget-script',
        title: 'Chat Widget Script',
        slug: 'chat-widget-script',
        category: 'Setting Up Integrations',
        categorySlug: 'setting-up-integrations',
        excerpt: 'Generate embeddable chat widget for your website',
        content: `Generate an embeddable chat widget script for your website.

1. Navigate to **Dashboard** → **Integrations**
2. Click **Add Integration** → **Chat Widget Script**
3. Select:
   - **Demo**: Choose which demo's chatbot to embed
   - **Position**: Left or right side of screen
   - **Type**: Standard or expanded bubble
4. Click **Copy Script**
5. Paste the script into your website's HTML (before \`</body>\` tag)

The widget will appear on your website and connect visitors to your AI chatbot.`,
      },
      {
        id: 'helpdesk-setup',
        title: 'Helpdesk Setup',
        slug: 'helpdesk-setup',
        category: 'Setting Up Integrations',
        categorySlug: 'setting-up-integrations',
        excerpt: 'Create and manage helpdesk agents',
        content: `Create and manage helpdesk agents for human handoff.

1. Navigate to **Dashboard** → **Integrations**
2. Click **Add Integration** → **Helpdesk Setup**
3. **Create Agent Tab**:
   - Enter agent name
   - Set password (8+ characters, 1 number, 1 special character)
   - Click **Create Agent**
4. **Manage Collaborators Tab**:
   - View all agents
   - Assign agents to inboxes using checkboxes
   - Click **Save Assignments**`,
      },
      {
        id: 'managing-integrations',
        title: 'Managing Integrations',
        slug: 'managing-integrations',
        category: 'Setting Up Integrations',
        categorySlug: 'setting-up-integrations',
        excerpt: 'Edit, test, and manage your integrations',
        content: `- **Edit**: Click on an integration to modify its configuration
- **Test Connection**: Verify integration is working
- **Activate/Deactivate**: Toggle integration on/off
- **Delete**: Remove integration (requires confirmation)`,
      },
    ],
  },
  {
    id: 'understanding-your-subscription',
    title: 'Understanding Your Subscription',
    slug: 'understanding-your-subscription',
    description: 'Learn about free trials, usage tracking, and account management',
    articles: [
      {
        id: 'free-trial',
        title: 'Free Trial',
        slug: 'free-trial',
        category: 'Understanding Your Subscription',
        categorySlug: 'understanding-your-subscription',
        excerpt: 'Learn about the 14-day free trial',
        content: `All new accounts receive a **14-day free trial** with access to FREE tier features.

- Trial starts immediately upon account creation
- You'll receive email reminders 3 days before expiration
- After expiration, your account will be downgraded to FREE tier
- Upgrade anytime during or after the trial`,
      },
      {
        id: 'viewing-usage',
        title: 'Viewing Your Usage',
        slug: 'viewing-usage',
        category: 'Understanding Your Subscription',
        categorySlug: 'understanding-your-subscription',
        excerpt: 'Monitor your API usage and costs',
        content: `1. Navigate to **Dashboard** → **Usage**
2. View:
   - **API Calls This Month**: Current usage vs. monthly limit
   - **Fusion Requests**: AI model usage
   - **Spend**: Current month's costs
   - **Trial Status**: Days remaining (if applicable)`,
      },
      {
        id: 'viewing-billing',
        title: 'Viewing Billing Information',
        slug: 'viewing-billing',
        category: 'Understanding Your Subscription',
        categorySlug: 'understanding-your-subscription',
        excerpt: 'Check your subscription and payment details',
        content: `1. Navigate to **Dashboard** → **Billing**
2. View:
   - **Current Plan**: Your subscription tier and status
   - **Credits Balance**: Available account credits
   - **Recent Transactions**: Payment history
   - **Upgrade Options**: Links to upgrade your plan`,
      },
      {
        id: 'upgrading-plan',
        title: 'Upgrading Your Plan',
        slug: 'upgrading-plan',
        category: 'Understanding Your Subscription',
        categorySlug: 'understanding-your-subscription',
        excerpt: 'How to upgrade your subscription',
        content: `1. Navigate to **Dashboard** → **Billing** or **Pricing** page
2. Select your desired tier
3. Click **Upgrade** or **Get Started**
4. Complete payment via Stripe checkout
5. Your account will be upgraded immediately`,
      },
      {
        id: 'api-call-limits',
        title: 'API Call Limits',
        slug: 'api-call-limits',
        category: 'Understanding Your Subscription',
        categorySlug: 'understanding-your-subscription',
        excerpt: 'Understanding API usage and limits',
        content: `API calls are counted for:
- AI model requests (chat responses)
- Embedding generation (knowledge base processing)
- RAG retrieval (context search)

Monthly limits reset on your subscription renewal date.

**Note**: If you reach your monthly limit, you can continue using Voxe by adding credits through the Top-Up System in your dashboard.
Additional credits are applied instantly and will be used before the next billing cycle begins.`,
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    slug: 'troubleshooting',
    description: 'Common issues and solutions',
    articles: [
      {
        id: 'demo-creation-issues',
        title: 'Demo Creation Issues',
        slug: 'demo-creation-issues',
        category: 'Troubleshooting',
        categorySlug: 'troubleshooting',
        excerpt: 'Fix problems with demo creation',
        content: `**Problem**: Demo creation fails or takes too long

**Solutions**:
- Verify your website URL is accessible and public
- Check that the website doesn't require authentication
- Ensure the website has sufficient content to analyze
- Try again after a few minutes (servers may be busy)
- Contact support if the issue persists

**Problem**: "Tier limit exceeded" error

**Solutions**:
- Check your current tier limits in **Dashboard** → **Usage**
- Delete unused demos to free up space
- Upgrade your plan to increase limits`,
      },
      {
        id: 'knowledge-base-issues',
        title: 'Knowledge Base Issues',
        slug: 'knowledge-base-issues',
        category: 'Troubleshooting',
        categorySlug: 'troubleshooting',
        excerpt: 'Resolve document upload and processing problems',
        content: `**Problem**: Document upload fails

**Solutions**:
- Verify file size is within your tier limit
- Check file format is supported (PDF, DOCX, TXT, etc.)
- Ensure file is not corrupted
- Try a different file format

**Problem**: Document processing stuck on "PROCESSING"

**Solutions**:
- Wait a few minutes (large documents take longer)
- Refresh the page
- If stuck for more than 10 minutes, delete and re-upload
- Check for error messages in the document details

**Problem**: AI not using knowledge base content

**Solutions**:
- Verify knowledge base is linked to your workflow
- Check knowledge base has completed documents (status: COMPLETED)
- Ensure similarity threshold isn't too high
- Verify retrieval limit is set appropriately`,
      },
      {
        id: 'workflow-issues',
        title: 'Workflow Issues',
        slug: 'workflow-issues',
        category: 'Troubleshooting',
        categorySlug: 'troubleshooting',
        excerpt: 'Fix workflow errors and chatbot problems',
        content: `**Problem**: Workflow status shows "ERROR"

**Solutions**:
- Check workflow logs for error details
- Verify Chatwoot integration is configured correctly
- Ensure AI model credentials are valid
- Try restarting the workflow
- Contact support with error details

**Problem**: Chatbot not responding to messages

**Solutions**:
- Verify workflow status is "ACTIVE"
- Check Chatwoot inbox is properly configured
- Ensure demo URL is correct
- Verify system message is properly configured
- Check API call limits haven't been exceeded

**Problem**: AI responses are inaccurate

**Solutions**:
- Add more relevant documents to knowledge base
- Lower similarity threshold to retrieve more context
- Increase retrieval limit to get more information
- Review and improve system message template
- Ensure knowledge base documents are up-to-date`,
      },
      {
        id: 'integration-issues',
        title: 'Integration Issues',
        slug: 'integration-issues',
        category: 'Troubleshooting',
        categorySlug: 'troubleshooting',
        excerpt: 'Troubleshoot integration connection problems',
        content: `**Problem**: "Connection test failed"

**Solutions**:
- Verify API credentials are correct
- Check base URL is correct (no trailing slash)
- Ensure API token has proper permissions
- Verify network connectivity
- Check if service is experiencing downtime

**Problem**: Integration shows "ERROR" status

**Solutions**:
- Test connection again
- Verify credentials haven't expired
- Check integration configuration
- Review integration logs
- Recreate integration if necessary`,
      },
      {
        id: 'authentication-issues',
        title: 'Authentication Issues',
        slug: 'authentication-issues',
        category: 'Troubleshooting',
        categorySlug: 'troubleshooting',
        excerpt: 'Resolve login and email verification problems',
        content: `**Problem**: Can't log in

**Solutions**:
- Verify email and password are correct
- Check if account is locked (too many failed attempts)
- Try password reset if forgotten
- Verify email is verified
- Contact support if account is locked

**Problem**: Email verification not received

**Solutions**:
- Check spam/junk folder
- Verify email address is correct
- Request new verification email from sign-in page
- Wait a few minutes (emails may be delayed)
- Contact support if issue persists`,
      },
      {
        id: 'general-issues',
        title: 'General Issues',
        slug: 'general-issues',
        category: 'Troubleshooting',
        categorySlug: 'troubleshooting',
        excerpt: 'Other common problems and solutions',
        content: `**Problem**: Feature not available

**Solutions**:
- Check if feature requires a higher tier
- Verify your subscription status
- Check if feature is in beta or coming soon
- Review tier limits in **Dashboard** → **Usage**

**Problem**: Slow performance

**Solutions**:
- Check API call usage (high usage may cause throttling)
- Verify network connection
- Try refreshing the page
- Clear browser cache
- Contact support if consistently slow`,
      },
      {
        id: 'getting-help',
        title: 'Getting Help',
        slug: 'getting-help',
        category: 'Troubleshooting',
        categorySlug: 'troubleshooting',
        excerpt: 'Additional support resources',
        content: `If you need additional assistance:

1. **Check Documentation**: Review this guide and other documentation
2. **Contact Support**: 
   - **FREE/STARTER**: Community support forums
   - **TEAM+**: Email support (priority response)
   - **BUSINESS+**: Priority support
   - **ENTERPRISE**: Dedicated account manager
3. **Report Bugs**: Use the support contact form or email
4. **Feature Requests**: Submit via support channels`,
      },
    ],
  },
]

// Helper functions
export function getAllCategories(): HelpCategory[] {
  return helpCategories
}

export function getCategoryBySlug(slug: string): HelpCategory | undefined {
  return helpCategories.find((cat) => cat.slug === slug)
}

export function getArticle(categorySlug: string, articleSlug: string): HelpArticle | undefined {
  const category = getCategoryBySlug(categorySlug)
  return category?.articles.find((article) => article.slug === articleSlug)
}

export function getAllArticles(): HelpArticle[] {
  return helpCategories.flatMap((cat) => cat.articles)
}

export function searchArticles(query: string, articles: HelpArticle[]): HelpArticle[] {
  if (!query.trim()) return articles

  const lowerQuery = query.toLowerCase()
  return articles.filter(
    (article) =>
      article.title.toLowerCase().includes(lowerQuery) ||
      article.excerpt.toLowerCase().includes(lowerQuery) ||
      article.content.toLowerCase().includes(lowerQuery) ||
      article.category.toLowerCase().includes(lowerQuery)
  )
}

