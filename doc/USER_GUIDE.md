---
title: Voxe User Guide
date: '2025-11-11'
author: Voxe Team
excerpt: >-
  Welcome to Voxe! This guide will help you get started with creating AI-powered
  customer support chatbots for your business.
image: /images/blog/Voxe_User_Guide1.PNG
tags:
  - Voxe
  - How to
  - user
  - Guide
---
## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating Your First Demo](#creating-your-first-demo)
3. [Managing Knowledge Bases](#managing-knowledge-bases)
4. [Configuring Workflows](#configuring-workflows)
5. [Setting Up Integrations](#setting-up-integrations)
6. [Understanding Your Subscription](#understanding-your-subscription)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Account Setup

1. **Sign Up**: Create your account using email/password or Google OAuth
2. **Verify Email**: Check your inbox and click the verification link (required for dashboard access)
3. **Free Trial**: All new accounts receive a 14-day free trial with access to FREE tier features

### Dashboard Overview

After logging in, you'll see your dashboard with:

- **Overview Statistics**: Total demos, active workflows, contacts, and knowledge bases
- **Quick Actions**: Create demo, manage workflows, upload documents
- **Navigation Menu**: Access all features from the sidebar

### Key Concepts

- **Demo**: A customer-facing chatbot page created from a website URL
- **Workflow**: The AI automation that processes customer messages
- **Knowledge Base**: Document library that provides context to your AI
- **Integration**: Enables connections to both internal systems and optional external platforms, such as helpdesk and CRM solutions.

---

## Creating Your First Demo

A demo is an AI-powered chatbot page that answers questions about your business based on your website content.

### Step-by-Step Process

#### Step 1: Enter Website URL

1. Navigate to **Dashboard** → **Create Demo** (or `/dashboard/userdemo`)
2. Enter your business website URL (e.g., `https://example.com`)
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
3. **Primary Color** (optional): Hex color code (e.g., `#7ee787`)
4. **Secondary Color** (optional): Hex color code (e.g., `#f4a261`)

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
5. Generate a demo page at `/demo/[slug]`

**Processing Time**: Demo creation typically takes 2-5 minutes. You'll see a success message when complete.

#### Step 6: Access Your Demo

Once created, you'll receive:
- **Demo URL**: Public link to your chatbot (e.g., `https://voxe.mcp4.ai/demo/your-business-name`)
- **System Message File**: Link to the generated AI prompt template

You can share the demo URL with your team to test how the chat widget and AI chatbot interact, or embed it directly on your website.
The Chat Widget Script becomes instantly available in your dashboard under the Chat Widget Script section once the demo is created.

### What Happens Behind the Scenes

When you create a demo, the system:

1. **Scrapes Your Website**: Extracts text content, structure, and metadata
2. **Generates Knowledge Base**: Uses AI to create structured knowledge from your content
3. **Creates System Message**: Combines your business knowledge with AI instructions
4. **Sets Up Helpdesk**: Creates an inbox for managing conversations
5. **Creates Workflow**: Configures workflow to process messages
6. **Generates Demo Page**: Creates a public-facing chatbot interface

### Tier Limits

- **FREE**: 1 chatbot
- **STARTER**: 2 chatbot
- **TEAM**: 5 chatbot
- **BUSINESS**: 25 chatbot
- **ENTERPRISE**: Unlimited chatbot

If you reach your limit, you'll see an upgrade prompt when trying to create additional demos.

---

## Managing Knowledge Bases

Knowledge bases store documents that provide context to your AI chatbot, enabling it to answer questions accurately.

### Creating a Knowledge Base

1. Navigate to **Dashboard** → **Knowledge Bases**
2. Click **Create Knowledge Base**
3. Enter:
   - **Name**: Descriptive name (e.g., "Product Documentation")
   - **Description** (optional): Brief description of the content
4. Click **Create**

### Uploading Documents

1. Open your knowledge base
2. Click **Upload Document**
3. Select a file (PDF, DOCX, TXT, or other supported formats)
4. Wait for processing to complete

**Supported Formats**: PDF, DOCX, DOC, TXT, MD, and more

### Document Processing

After upload, documents are automatically:

1. **Extracted**: Text is extracted from the file
2. **Chunked**: Content is split into manageable pieces
3. **Embedded**: Each chunk is converted to a vector embedding
4. **Indexed**: Stored for semantic search

**Processing Status**:
- **PENDING**: Uploaded, waiting for processing
- **PROCESSING**: Currently being processed
- **COMPLETED**: Ready to use
- **FAILED**: Error occurred (check error message)

### Linking Knowledge Bases to Workflows

To use a knowledge base with a workflow:

1. Navigate to **Dashboard** → **Workflows**
2. Select your workflow
3. Go to **Knowledge Bases** section
4. Click **Link Knowledge Base**
5. Select the knowledge base and configure:
   - **Priority**: Order of search (lower numbers searched first)
   - **Retrieval Limit**: Number of chunks to retrieve (default: 5)
   - **Similarity Threshold**: Minimum similarity score (default: 0.7)

### Document Limits

- **FREE**: 1 knowledge base, 10 documents total
- **STARTER**: 2 knowledge bases, 50 documents total
- **TEAM**: 5 knowledge bases, 100 documents total
- **BUSINESS**: 25 knowledge bases, 1,000 documents total
- **ENTERPRISE**: Unlimited knowledge bases and documents

### Best Practices

- **Organize by Topic**: Create separate knowledge bases for different topics
- **Keep Documents Focused**: Smaller, focused documents work better than large ones
- **Update Regularly**: Keep your knowledge bases current with your latest information
- **Use Descriptive Names**: Name knowledge bases clearly for easy identification

---

## Configuring Workflows

Workflows are the automation engines that process customer messages and generate AI responses.

### Understanding Workflow Status

- **ACTIVE**: Workflow is running and processing messages
- **INACTIVE**: Workflow is stopped (not processing messages)
- **ERROR**: Workflow encountered an error (check logs)
- **PENDING**: Workflow is being set up

### Starting and Stopping Workflows

1. Navigate to **Dashboard** → **Workflows**
2. Find your workflow in the list
3. Click **Start** to activate or **Stop** to deactivate

**Note**: Only ACTIVE workflows process customer messages. Inactive workflows won't respond to chats.

### Switching AI Models

You can change the AI model used by your workflow (optional):

1. Open your workflow
2. Click **Switch Model**
3. Select from available models:
4. Click **Confirm**

**Model Selection Considerations**:
- **Speed**: Smaller models respond faster
- **Capability**: Larger models handle complex queries better.

### Configuring Timing Thresholds

Based on the complexity of the question and the customer’s needs, the AI support agent can escalate a conversation to your human team when required.
Timing thresholds control when the Holding AI steps in — sending friendly follow-up messages if a team member takes too long to respond, so customers stay engaged and never feel ignored.

1. Open your workflow
2. Go to **Timing Thresholds**
3. Configure:
   - **Assignee Threshold**: Seconds to wait after human response when assigned to agent (default: 300 seconds / 5 minutes)
   - **Team Threshold**: Seconds to wait when assigned to team (default: 100 seconds / ~1.7 minutes)
   - **Escalation Threshold**: Seconds before escalating to supervisor (default: 1800 seconds / 30 minutes)
   - **Escalation Contact**: Supervisor name for escalation notifications
   - **Escalation Message**: Custom message for escalation notifications
4. Click **Save**

### Viewing Workflow Logs

To troubleshoot workflow issues:

1. Open your workflow
2. Click **View Logs**
3. Review execution history, errors, and performance metrics

---

## Setting Up Integrations

Integrations connect Voxe to external services like helpdesks, CRMs, and automation tools — helping you manage conversations, sync contacts, and streamline workflows.

### One-Click Automatic Connection

Voxe handles most integrations automatically.

Voxe sets up a ready-to-use helpdesk admin acount and inbox and workflow with one click.

Your AI chatbot, helpdesk, and automation system are instantly linked and ready to respond.

You can manage or expand integrations anytime from your Dashboard → Integrations page.

### Manual Integration Setup

For advanced connections or custom helpdesk, you can still add integrations manually.

### Supported CRM Providers

- **Chatwoot**: customer engagement platform (auto-connected by default)
- **Salesforce**: Enterprise CRM (coming soon)
- **HubSpot**: Marketing and sales platform (coming soon)
- **Zoho**: Business software suite (coming soon)
- **Pipedrive**: Sales CRM (coming soon)
- **Custom**: Connect any REST API-based CRM using your own credentials

### Chat Widget Script (Paid Tiers Only)

Generate an embeddable chat widget script for your website.

**Available on**: STARTER, TEAM, BUSINESS, and ENTERPRISE tiers

1. Navigate to **Dashboard** → **Integrations**
2. Click **Add Integration** → **Chat Widget Script**
3. Select:
   - **Demo**: Choose which demo's chatbot to embed
   - **Position**: Left or right side of screen
   - **Type**: Standard or expanded bubble
4. Click **Copy Script**
5. Paste the script into your website's HTML (before `</body>` tag)

The widget will appear on your website and connect visitors to your AI chatbot.

### Helpdesk Setup

Create and manage helpdesk agents for human handoff.

1. Navigate to **Dashboard** → **Integrations**
2. Click **Add Integration** → **Helpdesk Setup**
3. **Create Agent Tab**:
   - Enter agent name
   - Set password (8+ characters, 1 number, 1 special character)
   - Click **Create Agent**
4. **Manage Collaborators Tab**:
   - View all agents
   - Assign agents to inboxes using checkboxes
   - Click **Save Assignments**

**Agent Limits**:
- **FREE**: 1 agent
- **STARTER**: 2 agents
- **TEAM**: 3 agents
- **BUSINESS**: 5 agents
- **ENTERPRISE**: Unlimited agents

### Integration Limits

- **FREE**: 1 integration
- **STARTER**: 2 integrations
- **TEAM**: 3 integrations
- **BUSINESS**: 10 integrations
- **ENTERPRISE**: Unlimited integrations

### Managing Integrations

- **Edit**: Click on an integration to modify its configuration
- **Test Connection**: Verify integration is working
- **Activate/Deactivate**: Toggle integration on/off
- **Delete**: Remove integration (requires confirmation)

---

## Understanding Your Subscription

### Subscription Tiers

Voxe offers five subscription tiers with different features and limits:

#### FREE Tier

- **Price**: $0/month (14 days)
- **Demos**: 1
- **Workflows**: 2
- **Knowledge Bases**: 1
- **Documents**: 10 total
- **Integrations**: 1
- **Helpdesk Agents**: 1
- **API Calls**: 100/month
- **Document Size**: 5MB max
- **Support**: Community

#### STARTER Tier

- **Demos**: 2
- **Workflows**: 5
- **Knowledge Bases**: 2
- **Documents**: 50 total
- **Integrations**: 2
- **Helpdesk Agents**: 2
- **API Calls**: 5,000/month
- **Document Size**: 10MB max
- **Support**: Email
- **Additional Features**: Chat Widget Script

**Note**: Pricing for STARTER tier may vary. Check the Pricing page for current rates.

#### TEAM Tier

- **Demos**: 5
- **Workflows**: 10
- **Knowledge Bases**: 5
- **Documents**: 100 total
- **Integrations**: 3
- **Helpdesk Agents**: 3
- **API Calls**: 10,000/month
- **Document Size**: 25MB max
- **Support**: Priority Email
- **Additional Features**: Advanced Analytics, Custom Branding, Priority Support

**Note**: Pricing for TEAM tier may vary. Check the Pricing page for current rates.

#### BUSINESS Tier

- **Demos**: 25
- **Workflows**: 50
- **Knowledge Bases**: 25
- **Documents**: 1,000 total
- **Integrations**: 10
- **Helpdesk Agents**: 5
- **API Calls**: 100,000/month
- **Document Size**: 100MB max
- **Support**: Priority
- **Additional Features**: White Label, SSO, API Access, Webhook Integrations

**Note**: Pricing for BUSINESS tier may vary. Check the Pricing page for current rates.

#### ENTERPRISE Tier

- **Price**: Custom pricing
- **Demos**: Unlimited
- **Workflows**: Unlimited
- **Knowledge Bases**: Unlimited
- **Documents**: Unlimited
- **Integrations**: Unlimited
- **Helpdesk Agents**: Unlimited
- **API Calls**: Unlimited
- **Document Size**: 500MB max
- **Support**: Dedicated
- **Additional Features**: Custom Integrations, Dedicated Support, SLA Guarantees

### Free Trial

All new accounts receive a **14-day free trial** with access to FREE tier features.

- Trial starts immediately upon account creation
- You'll receive email reminders 3 days before expiration
- After expiration, your account will be downgraded to FREE tier
- Upgrade anytime during or after the trial

### Viewing Your Usage

1. Navigate to **Dashboard** → **Usage**
2. View:
   - **API Calls This Month**: Current usage vs. monthly limit
   - **Fusion Requests**: AI model usage
   - **Spend**: Current month's costs
   - **Trial Status**: Days remaining (if applicable)

### Viewing Billing Information

1. Navigate to **Dashboard** → **Billing**
2. View:
   - **Current Plan**: Your subscription tier and status
   - **Credits Balance**: Available account credits
   - **Recent Transactions**: Payment history
   - **Upgrade Options**: Links to upgrade your plan

### Upgrading Your Plan

1. Navigate to **Dashboard** → **Billing** or **Pricing** page
2. Select your desired tier
3. Click **Upgrade** or **Get Started**
4. Complete payment via Stripe checkout
5. Your account will be upgraded immediately

### API Call Limits

API calls are counted for:
- AI model requests (chat responses)
- Embedding generation (knowledge base processing)
- RAG retrieval (context search)

Monthly limits reset on your subscription renewal date.

**Note**: If you reach your monthly limit, you can continue using Voxe by adding credits through the Top-Up System in your dashboard.
Additional credits are applied instantly and will be used before the next billing cycle begins.

---

## Troubleshooting

### Demo Creation Issues

**Problem**: Demo creation fails or takes too long

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
- Upgrade your plan to increase limits

### Knowledge Base Issues

**Problem**: Document upload fails

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
- Verify retrieval limit is set appropriately

### Workflow Issues

**Problem**: Workflow status shows "ERROR"

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
- Ensure knowledge base documents are up-to-date

### Integration Issues

**Problem**: "Connection test failed"

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
- Recreate integration if necessary

### Authentication Issues

**Problem**: Can't log in

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
- Contact support if issue persists

### General Issues

**Problem**: Feature not available

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
- Contact support if consistently slow

### Getting Help

If you need additional assistance:

1. **Check Documentation**: Review this guide and other documentation
2. **Contact Support**: 
   - **FREE/STARTER**: Community support forums
   - **TEAM+**: Email support (priority response)
   - **BUSINESS+**: Priority support
   - **ENTERPRISE**: Dedicated account manager
3. **Report Bugs**: Use the support contact form or email
4. **Feature Requests**: Submit via support channels

---

## Additional Resources

### System Messages

System messages are AI prompt templates that control how your chatbot responds. They're automatically generated when you create a demo, but you can customize them:

1. Navigate to **Dashboard** → **System Messages**
2. Select a system message
3. Edit the content
4. Save changes

**Note**: Changes to system messages may require workflow restart to take effect.

### Usage Analytics

Monitor your usage and costs:

1. Navigate to **Dashboard** → **Usage**
2. View detailed analytics including:
   - API call trends
   - Cost breakdown
   - Model usage statistics
   - Activity logs

### Best Practices

1. **Keep Knowledge Bases Updated**: Regularly update documents with latest information
2. **Monitor Usage**: Check usage dashboard regularly to avoid hitting limits
3. **Test Workflows**: Test your workflows before going live
4. **Review Logs**: Check workflow logs periodically for issues
5. **Optimize Documents**: Use focused, well-structured documents for better results
6. **Configure Thresholds**: Set appropriate timing thresholds for your use case

---

## Glossary

- **Demo**: A customer-facing chatbot page created from a website URL
- **Workflow**: The automation engine that processes customer messages
- **Knowledge Base**: A collection of documents that provide context to AI
- **Document Chunk**: A piece of a document that's been split for processing
- **Embedding**: A vector representation of text used for semantic search
- **RAG**: Retrieval-Augmented Generation - using knowledge bases to enhance AI responses
- **System Message**: The AI prompt template that controls chatbot behavior
- **Integration**: Connection to external services (CRM, Chatwoot, etc.)
- **Inbox**: A Chatwoot inbox where customer conversations are managed
- **Workflow Status**: Current state of a workflow (ACTIVE, INACTIVE, ERROR, PENDING)
- **Tier**: Subscription level that determines features and limits
- **API Call**: A request to an AI model or service

---

*Last updated: Based on current codebase as of documentation creation*

