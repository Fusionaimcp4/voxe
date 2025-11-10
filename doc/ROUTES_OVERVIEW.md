# Voxe Codebase - Complete Routes Overview

This document provides a comprehensive overview of all API routes in the Voxe application, organized by category.

## Table of Contents
1. [Authentication Routes](#authentication-routes)
2. [Admin Routes](#admin-routes)
3. [Dashboard Routes](#dashboard-routes)
4. [Demo Routes](#demo-routes)
5. [Stripe/Billing Routes](#stripebilling-routes)
6. [Knowledge Base Routes](#knowledge-base-routes)
7. [Integration Routes](#integration-routes)
8. [Workflow Routes](#workflow-routes)
9. [Other Routes](#other-routes)

---

## Authentication Routes

### `/api/auth/[...nextauth]` - NextAuth Handler
- **Methods**: GET, POST
- **Purpose**: Main authentication endpoint using NextAuth.js
- **Features**: Handles OAuth, email/password authentication, session management

### `/api/auth/register` - User Registration
- **Method**: POST
- **Purpose**: Register new users
- **Process**:
  1. Validates email, name, password
  2. Checks for existing users
  3. Hashes password with bcrypt
  4. Creates user with 14-day free trial
  5. Sets `isVerified: false` by default
  6. Issues email verification token
  7. Sends verification email
- **Response**: User object with `isVerified: false`

### `/api/auth/verify-email` - Email Verification
- **Method**: GET
- **Purpose**: Verify user email via token
- **Process**:
  1. Validates token and user ID from query params
  2. Consumes verification token
  3. Updates user `isVerified: true`
  4. Sets `emailVerifiedAt` timestamp
  5. Redirects to sign-in page

### `/api/auth/resend-verification` - Resend Verification Email
- **Method**: POST
- **Purpose**: Resend verification email to unverified users
- **Features**:
  - Rate limited (2 requests per 5 minutes)
  - Requires active session
  - Invalidates old tokens before issuing new one

### `/api/auth/forgot-password` - Password Reset Request
- **Method**: POST
- **Purpose**: Initiate password reset flow
- **Process**:
  1. Validates email
  2. Rate limited by IP (5/5min) and email (3/5min)
  3. Issues password reset token (1 hour TTL)
  4. Sends reset email
  5. Returns success even if email doesn't exist (prevents enumeration)

### `/api/auth/reset-password` - Password Reset
- **Method**: POST
- **Purpose**: Complete password reset
- **Process**:
  1. Validates token and new password
  2. Enforces password policy
  3. Checks against pwned passwords
  4. Hashes and updates password
  5. Invalidates all reset tokens

### `/api/auth/2fa/setup` - 2FA Setup
- **Method**: GET
- **Purpose**: Generate TOTP secret and QR code
- **Access**: Admin/SUPER_ADMIN only
- **Returns**: Secret, OTPAuth URL, QR code data URL

### `/api/auth/2fa/verify` - 2FA Verification
- **Method**: POST
- **Purpose**: Verify 2FA code during login
- **Process**: Validates TOTP code against user's secret

### `/api/auth/2fa/enable` - Enable 2FA
- **Method**: POST
- **Purpose**: Enable 2FA for admin account
- **Access**: Admin/SUPER_ADMIN only
- **Process**: Verifies code, saves secret to database

### `/api/auth/2fa/disable` - Disable 2FA
- **Method**: POST
- **Purpose**: Disable 2FA for admin account
- **Access**: Admin/SUPER_ADMIN only
- **Process**: Verifies code, removes secret from database

---

## Admin Routes

### `/api/admin/dashboard` - Admin Dashboard Stats
- **Method**: GET
- **Purpose**: Get admin dashboard statistics
- **Returns**: Total demos, users, workflows, contacts, active workflows, recent demos

### `/api/admin/users` - User Management
- **GET**: List users with pagination, filtering, sorting
  - Filters: search, role, tier, status, verified
  - Sorting: configurable field and order
  - Returns: Users with demos, workflows, API call logs
- **POST**: Create new user (admin only)
  - Validates email uniqueness
  - Hashes password
  - Sets role, tier, verification status

### `/api/admin/users/[id]` - User Details
- **GET**: Get specific user with full details
- **PATCH**: Update user (name, email, role, tier, status, password, verification)
  - Normalizes legacy tier names (PRO → TEAM, PRO_PLUS → BUSINESS)
  - Validates email uniqueness
- **DELETE**: Delete user
  - Prevents self-deletion
  - Prevents non-super-admin from deleting super-admins
  - Cascades to related records

### `/api/admin/demos` - List All Demos
- **Method**: GET
- **Purpose**: Get all demos with user information
- **Returns**: Demos with user details, workflows, stats

### `/api/admin/system-messages` - System Message Template Management
- **GET**: Get active system message template with version history
  - Creates from file if not in database
- **PUT**: Update template (save draft)
  - Updates content without publishing

### `/api/admin/system-messages/publish` - Publish Template Version
- **Method**: POST
- **Purpose**: Publish new version of system message template
- **Process**:
  1. Unpublishes current version
  2. Creates new published version
  3. Updates template content
  4. Updates template file on disk
  5. Logs version history

### `/api/admin/system-messages/rollback/[versionId]` - Rollback Template
- **Method**: POST
- **Purpose**: Rollback to specific template version
- **Process**:
  1. Finds version by ID
  2. Unpublishes current version
  3. Publishes selected version
  4. Updates template content and file

### `/api/admin/tier-limits` - Tier Limits Management
- **GET**: Get all tier limits
- **PUT**: Update tier limits for specific tier
- **POST**: Reset tier limits to defaults
- **Validates**: Tier must be FREE, STARTER, TEAM, BUSINESS, or ENTERPRISE

### `/api/admin/auth` - Admin Page Authentication
- **Method**: POST
- **Purpose**: Authenticate admin pages (separate from NextAuth)
- **Uses**: Environment variables `PAGE_AUTH_USER` and `PAGE_AUTH_PASS`

### `/api/admin/add-demo` - Add Demo (Admin)
- **Method**: POST
- **Purpose**: Create demo from admin panel
- **Process**: Creates demo, workflow, and system message records

---

## Dashboard Routes

### `/api/dashboard` - User Dashboard
- **Method**: GET
- **Purpose**: Get user's dashboard data
- **Returns**: Stats (total demos, active workflows, contacts), recent demos
- **Optimization**: Uses transactions for aggregated queries

### `/api/dashboard/billing` - Billing Status
- **Method**: GET
- **Purpose**: Get subscription, credits, and usage information
- **Returns**:
  - Subscription details (tier, status, expiration, Stripe ID)
  - API usage (calls this month, Fusion requests, spend, quota)
  - Credits balance
  - Recent transactions

### `/api/dashboard/usage` - Usage Statistics
- **Method**: GET
- **Purpose**: Get detailed usage stats
- **Returns**: Usage stats, trial expiration date, subscription info

### `/api/dashboard/models` - Available AI Models
- **Method**: GET
- **Purpose**: Get list of available Fusion AI models
- **Returns**: Formatted model list with capabilities, costs, context lengths

### `/api/dashboard/tier-limits` - Get Tier Limits
- **Method**: GET
- **Purpose**: Get tier limits for specific tier
- **Query Params**: `tier` (required)

### `/api/dashboard/demos` - User's Demos
- **Method**: GET
- **Purpose**: List all demos for authenticated user
- **Returns**: Demos with workflow status

### `/api/dashboard/demos/[slug]/delete` - Delete Demo
- **Method**: DELETE
- **Purpose**: Delete demo and all associated resources
- **Process**:
  1. Verifies ownership and domain name confirmation
  2. Stops n8n workflows
  3. Deletes database records (workflows, system messages, demo)
  4. Cleans up file system (demo directory, system message file)
  5. Deletes Chatwoot inbox
- **Security**: Requires domain name confirmation

### `/api/dashboard/workflows` - List Workflows
- **Method**: GET
- **Purpose**: Get all workflows for user
- **Returns**: Workflows with demo info, stats (total, active, inactive, error)

### `/api/dashboard/workflows/[workflowId]` - Workflow Details
- **Method**: GET
- **Purpose**: Get specific workflow details
- **Returns**: Workflow with demo information

### `/api/dashboard/system-messages` - List System Messages
- **Method**: GET
- **Purpose**: Get all system messages for user's demos
- **Returns**: Messages with demo information

### `/api/dashboard/system-messages/[messageId]` - Update System Message
- **Method**: PUT
- **Purpose**: Update system message content
- **Process**:
  1. Verifies ownership
  2. Replaces `${businessName}` placeholder
  3. Updates database and file system
  4. Updates n8n workflow if active

### `/api/dashboard/knowledge-bases` - Knowledge Base Management
- **GET**: List all knowledge bases for user
  - Returns: KBs with document/workflow counts, stats
- **POST**: Create new knowledge base
  - Validates tier limits
  - Tracks usage

### `/api/dashboard/knowledge-bases/[id]` - Knowledge Base Details
- **GET**: Get KB with documents and workflows
- **PUT**: Update KB (name, description, active status)
- **DELETE**: Delete KB and all documents
  - Cleans up file system

### `/api/dashboard/knowledge-bases/[id]/upload` - Upload Document
- **Method**: POST
- **Purpose**: Upload document to knowledge base
- **Process**:
  1. Validates file type and size
  2. Checks tier limits
  3. Saves file to disk
  4. Creates document record
  5. Triggers async processing (text extraction, chunking, embedding)
  6. Updates KB stats

### `/api/dashboard/knowledge-bases/search` - Search Knowledge Base
- **Method**: POST (likely)
- **Purpose**: Search knowledge base content

### `/api/dashboard/integrations` - Integration Management
- **GET**: List user's integrations
- **POST**: Create integration
  - Validates tier limits
  - Checks for paid features (Chat Widget Script)
  - Encrypts sensitive configuration data

### `/api/dashboard/integrations/create` - Create Integration
- **Method**: POST
- **Purpose**: Create integration with encrypted credentials
- **Process**:
  1. Validates required fields
  2. Encrypts sensitive fields (API keys, tokens)
  3. Creates integration record

### `/api/dashboard/integrations/[id]` - Integration Details
- **Methods**: GET, PUT, DELETE (likely)
- **Purpose**: Manage specific integration

### `/api/dashboard/integrations/test` - Test Integration
- **Method**: POST (likely)
- **Purpose**: Test integration connection

### `/api/dashboard/integrations/chatwoot/*` - Chatwoot Integration
- **agents**: List Chatwoot agents
- **assign-agent**: Assign agent to inbox
- **create-user**: Create Chatwoot user
- **inboxes**: List Chatwoot inboxes

### `/api/dashboard/fusion/usage` - Fusion Usage Metrics
- **Method**: GET
- **Purpose**: Get Fusion API usage data
- **Returns**: User metrics, spend, tokens, requests, activity logs

---

## Demo Routes

### `/api/demo/create` - Create Demo
- **Method**: POST
- **Purpose**: Create new demo from website URL
- **Process**:
  1. Ensures Fusion sub-account exists
  2. Validates tier limits
  3. Generates slug with hash for uniqueness
  4. Reuses preview KB if fresh (< 24 hours)
  5. Otherwise: fetches website, generates KB, merges with template
  6. Injects website links section
  7. Creates Chatwoot inbox
  8. Renders demo HTML
  9. Saves to database (demo, workflow, system message)
  10. Creates Chatwoot agent bot
  11. Triggers n8n workflow duplication
  12. Updates registry
  13. Creates lead contact if provided
- **Features**: Reuses cached KB, handles errors gracefully

### `/api/demo/inspect` - Inspect Website
- **GET**: Quick website inspection
  - Returns: Business name, summary, colors
- **POST**: Full inspection with KB generation
  - **Query Params**: `url` (required), `generateKB`, `force`, `canonicalUrls`
  - **Process**:
    1. Validates URL
    2. Checks for cached KB file
    3. Generates KB if needed or forced
    4. Parses KB sections for preview
    5. Returns knowledge preview with sections
  - **Returns**: URL, name, slug, knowledge preview, system message file path

### `/api/demo/lead` - Create Lead Contact
- **Method**: POST
- **Purpose**: Create/update Chatwoot contact from demo form
- **Process**:
  1. Validates lead data (name, email, company)
  2. Searches for existing contact by email
  3. Creates or updates contact
  4. Associates with inbox
  5. Handles phone number validation (E.164 format)
- **Features**: Handles duplicate emails/phones gracefully

---

## Stripe/Billing Routes

### `/api/stripe/create-checkout-session` - Create Checkout Session
- **Method**: POST
- **Purpose**: Create Stripe checkout for subscription or credit top-up
- **Process**:
  1. Validates billing is enabled
  2. Authenticates user
  3. Gets or creates Stripe customer
  4. Creates checkout session:
     - **Subscription**: Uses Stripe Price ID (monthly/yearly)
     - **Top-up**: One-time payment for credits
  5. Handles customer ID mismatches (recreates if needed)
- **Returns**: Checkout URL and session ID

### `/api/stripe/webhook` - Stripe Webhook Handler
- **Method**: POST
- **Purpose**: Process Stripe events
- **Security**: Verifies webhook signature
- **Events Handled**:
  - `checkout.session.completed`: Activates subscription or adds credits
  - `invoice.payment_succeeded`: Resets monthly API counters
  - `invoice.payment_failed`: Logs failed payment
  - `customer.subscription.created/updated`: Updates subscription
  - `customer.subscription.deleted`: Downgrades to FREE tier

### `/api/stripe/customer-portal` - Customer Portal
- **Method**: GET
- **Purpose**: Generate Stripe customer portal session
- **Returns**: Portal URL for managing billing

---

## Knowledge Base Routes

### `/api/dashboard/knowledge-bases` - See Dashboard Routes

### `/api/dashboard/knowledge-bases/[id]/link-workflow` - Link Workflow
- **Method**: POST (likely)
- **Purpose**: Link knowledge base to workflow

### `/api/dashboard/knowledge-bases/[id]/unlink-workflow` - Unlink Workflow
- **Method**: POST (likely)
- **Purpose**: Unlink knowledge base from workflow

### `/api/dashboard/knowledge-bases/[id]/workflow-links` - Get Workflow Links
- **Method**: GET (likely)
- **Purpose**: Get workflows linked to knowledge base

### `/api/dashboard/documents/[id]` - Document Management
- **Methods**: GET, DELETE (likely)
- **Purpose**: Manage individual documents

### `/api/rag/retrieve` - RAG Context Retrieval
- **Method**: POST
- **Purpose**: Retrieve relevant context from knowledge bases for RAG
- **Process**:
  1. Validates API key (if required)
  2. Finds workflow by ID or demo ID
  3. Gets linked knowledge bases
  4. Generates query embedding (OpenAI)
  5. Searches chunks by cosine similarity
  6. Filters by similarity threshold
  7. Returns formatted context for AI
- **Used by**: n8n workflows for RAG functionality

---

## Integration Routes

### `/api/dashboard/integrations` - See Dashboard Routes

### `/api/dashboard/integrations/chatwoot/*` - See Dashboard Routes

---

## Workflow Routes

### `/api/dashboard/workflows` - See Dashboard Routes

### `/api/dashboard/workflows/[workflowId]/[action]` - Workflow Actions
- **Method**: POST (likely)
- **Purpose**: Perform actions on workflow (start, stop, etc.)

### `/api/dashboard/workflows/[workflowId]/switch-model` - Switch AI Model
- **Method**: POST (likely)
- **Purpose**: Change AI model for workflow

### `/api/dashboard/workflows/[workflowId]/timing-thresholds` - Update Thresholds
- **Method**: PUT (likely)
- **Purpose**: Update timing thresholds for workflow

### `/api/dashboard/workflows/[workflowId]/logs` - Workflow Logs
- **Method**: GET (likely)
- **Purpose**: Get workflow execution logs

### `/api/workflow/update-id` - Update Workflow ID
- **Method**: POST
- **Purpose**: Update n8n workflow ID after duplication
- **Process**:
  1. Finds demo by business name
  2. Updates workflow with n8n ID
  3. Updates Fusion credentials for workflow
  4. Optionally updates Chatwoot IDs

### `/api/workflows/update-credentials` - Update Workflow Credentials
- **Method**: POST
- **Purpose**: Update Fusion credentials for workflow
- **Process**: Verifies ownership, updates credentials via n8n service

---

## Other Routes

### `/api/health` - Health Check
- **Method**: GET
- **Purpose**: Basic health check endpoint
- **Returns**: Status, timestamp, uptime

### `/api/pricing` - Pricing Plans
- **GET**: Get all active pricing plans (public)
- **POST**: Create/update pricing plan (admin only)
- **PUT**: Update pricing plan (admin only)
- **DELETE**: Delete pricing plan (admin only)

### `/api/cron/trial-expiration` - Trial Expiration Cron
- **GET**: Process trial expiration (requires CRON_SECRET)
  - **Query Params**: `secret` (required), `action` (remind/expire/all)
- **POST**: Manual trigger (admin only)
- **Purpose**: 
  - Send expiring trial reminders
  - Process expired trials (downgrade to FREE, send emails)

### `/api/n8n/credential-webhook` - n8n Credential Webhook
- **Method**: POST
- **Purpose**: Generate Fusion API credentials for n8n workflows
- **Process**:
  1. Verifies workflow ownership
  2. Gets user's Fusion sub-account
  3. Creates API key
  4. Returns credential data for n8n

### `/api/onboard` - Onboard New Demo (Admin)
- **Method**: POST
- **Purpose**: Create demo from admin panel
- **Process**: Similar to `/api/demo/create` but for admin use
- **Features**: Uses admin naming convention for system messages

---

## Key Features & Patterns

### Authentication & Authorization
- NextAuth.js for session management
- Middleware protects routes based on:
  - Authentication status
  - Email verification
  - User role (USER, ADMIN, SUPER_ADMIN)
  - Subscription tier
  - 2FA status

### Tier-Based Access Control
- Dynamic tier limits stored in database
- Tiers: FREE, STARTER, TEAM, BUSINESS, ENTERPRISE
- Limits checked before resource creation
- Usage tracking for API calls, demos, KBs, etc.

### Usage Tracking
- Tracks: API calls, demos created, documents uploaded, integrations created
- Monthly API call counters reset on subscription renewal
- Fusion API usage tracked separately

### File Management
- System messages stored in `public/system_messages/`
- Demo HTML in `public/demos/[slug]/`
- Knowledge base documents in `public/knowledge-bases/[userId]/[kbId]/`
- Caching: KB files cached for 24 hours

### Integration Points
- **Chatwoot**: Helpdesk integration, inboxes, agents, bots
- **n8n**: Workflow automation, webhooks, credential management
- **Fusion API**: AI model access, sub-accounts, usage tracking
- **Stripe**: Subscription management, payment processing

### Error Handling
- Graceful degradation (continues even if some steps fail)
- Detailed error messages for different failure types
- Rate limiting on sensitive endpoints
- Validation at multiple levels

### Security Features
- Password hashing (bcrypt)
- Token-based verification (email, password reset)
- Rate limiting
- API key validation
- Webhook signature verification
- Encrypted integration credentials
- Tier-based access control

---

## Database Schema (Key Entities)

- **User**: Authentication, subscription, Fusion sub-account
- **Demo**: Business demos with Chatwoot integration
- **Workflow**: n8n workflows linked to demos
- **SystemMessage**: AI system prompts for workflows
- **KnowledgeBase**: User knowledge bases
- **Document**: Uploaded documents in KBs
- **DocumentChunk**: Chunked and embedded document content
- **Integration**: Third-party integrations (CRM, etc.)
- **PricingPlan**: Subscription pricing tiers
- **TierLimit**: Dynamic tier limits
- **Transaction**: Payment and credit transactions
- **VerificationToken**: Email verification and password reset tokens

---

## Environment Variables (Key)

- `NEXTAUTH_URL`: Base URL for authentication
- `NEXTAUTH_SECRET`: NextAuth secret key
- `DATABASE_URL`: Prisma database connection
- `STRIPE_SECRET_KEY`: Stripe API key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signature
- `OPENAI_API_KEY`: OpenAI API key
- `CHATWOOT_API_KEY`: Chatwoot API key
- `CHATWOOT_BASE_URL`: Chatwoot instance URL
- `FUSION_BASE_URL`: Fusion API base URL
- `CRON_SECRET`: Secret for cron job endpoints
- `PAGE_AUTH_USER/PASS`: Admin page authentication

---

This codebase implements a comprehensive AI support platform with:
- Multi-tenant demo creation
- Knowledge base management with RAG
- Workflow automation via n8n
- Subscription billing via Stripe
- Helpdesk integration via Chatwoot
- Tier-based access control
- Usage tracking and limits

