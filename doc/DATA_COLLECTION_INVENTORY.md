# Data Collection Inventory & GDPR Compliance Analysis

## Overview
This document identifies all data collected by Voxe, defines purposes for collection, and assigns lawful bases for processing under GDPR/CCPA.

---

## 1. DATA COLLECTED

### 1.1 User Account Data
**Source:** `prisma/schema.prisma` - `User` model
- **Email** (unique identifier)
- **Name** (optional)
- **Company** (optional)
- **Password** (hashed with bcrypt)
- **Role** (USER, ADMIN, SUPER_ADMIN)
- **Tenant ID** (optional)
- **Avatar URL** (optional)
- **Email verification status** (`isVerified`, `emailVerifiedAt`)
- **2FA secret** (`totpSecret`)
- **Subscription tier** (FREE, STARTER, TEAM, BUSINESS, ENTERPRISE)
- **Subscription status** (ACTIVE, EXPIRED, CANCELLED, SUSPENDED)
- **Subscription expiration date**
- **Free trial end date** (`freeTrialEndsAt`)
- **Account creation timestamp** (`createdAt`)
- **Account update timestamp** (`updatedAt`)

**Purpose:** User authentication, account management, subscription management, service delivery
**Lawful Basis:** **Contract** (necessary for service provision) + **Legitimate Interest** (fraud prevention, account security)

---

### 1.2 Login & Security Data
**Source:** `prisma/schema.prisma` - `User` model + `lib/auth.ts`
- **IP Address** (`lastLoginIp`) - collected on successful login
- **Last login timestamp** (`lastLoginAt`)
- **Failed login count** (`failedLoginCount`)
- **Login attempt tracking** (via rate limiting in `lib/auth.ts`)
- **Session tokens** (`prisma/schema.prisma` - `Session` model)
- **Session expiration dates**
- **User-Agent** (implicitly via HTTP headers, but not explicitly stored in our DB)

**Purpose:** Security, fraud prevention, account protection, session management
**Lawful Basis:** **Legitimate Interest** (security, fraud prevention, abuse prevention)

---

### 1.3 Chat & Conversation Data
**Source:** Chatwoot integration (external service)
- **Chat messages/transcripts** (stored in Chatwoot, not directly in Voxe DB)
- **Contact information** (`prisma/schema.prisma` - `Contact` model):
  - Name
  - Email
  - Company (optional)
  - Phone (optional)
- **Conversation metadata** (routing, timestamps, agent assignments)
- **Attachments** (if uploaded via chat)

**Purpose:** Customer support, conversation routing, quality assurance, service delivery
**Lawful Basis:** **Contract** (necessary for providing support services) + **Consent** (when user initiates chat)

**Note:** Chat data is stored in Chatwoot (third-party service). Users should be aware of Chatwoot's privacy policy.

---

### 1.4 Analytics & Usage Data
**Source:** `prisma/schema.prisma` - `Analytics` model + `lib/usage-tracking.ts`
- **Event types** (demo_created, workflow_created, knowledge_base_created, document_uploaded, integration_created, api_call)
- **Event data** (JSON)
- **Timestamps**
- **User ID** (linked to user)
- **Demo ID** (optional, linked to demo)

**Source:** Vercel Analytics (`app/layout.tsx`)
- **Page views**
- **User interactions** (aggregated, anonymized)
- **Performance metrics**

**Purpose:** Service improvement, performance monitoring, usage analytics, feature development
**Lawful Basis:** **Legitimate Interest** (service improvement, performance monitoring) + **Consent** (for marketing analytics if applicable)

---

### 1.5 API Usage & Cost Tracking
**Source:** `prisma/schema.prisma` - `ApiCallLog` model + `lib/api-call-tracking.ts`
- **User ID**
- **Provider** (e.g., "fusion", "openai")
- **Model** (e.g., "gpt-4", "claude-3")
- **Endpoint** (API endpoint called)
- **Input/output tokens**
- **Total tokens**
- **Cost** (calculated)
- **Response time**
- **Context** (optional)
- **Document ID** (optional, if related to knowledge base)
- **Knowledge Base ID** (optional)
- **Workflow ID** (optional)
- **Success/failure status**
- **Error messages** (if failed)

**Purpose:** Billing, usage tracking, cost management, service optimization
**Lawful Basis:** **Contract** (necessary for billing and service limits)

---

### 1.6 Knowledge Base & Document Data
**Source:** `prisma/schema.prisma` - `KnowledgeBase`, `Document`, `DocumentChunk` models
- **Knowledge base name & description**
- **Document files** (stored in `public/knowledge-bases/`)
- **Document metadata**:
  - Filename, original name
  - File type, size
  - Extracted text
  - Summary
  - Page count, word count
  - Language
  - Processing status
- **Document chunks** (text segments with embeddings)
- **Embedding vectors** (for AI search)
- **Processing timestamps**

**Purpose:** Service delivery (AI-powered search and retrieval), knowledge management
**Lawful Basis:** **Contract** (necessary for core service functionality)

---

### 1.7 Demo & Workflow Data
**Source:** `prisma/schema.prisma` - `Demo`, `Workflow`, `SystemMessage` models
- **Business name & URL**
- **Demo configuration** (colors, logo)
- **System messages** (AI instructions)
- **Workflow configurations** (JSON)
- **n8n workflow IDs** (external service reference)
- **Chatwoot inbox IDs & website tokens**

**Purpose:** Service delivery, demo creation, workflow management
**Lawful Basis:** **Contract** (necessary for service provision)

---

### 1.8 Integration Data
**Source:** `prisma/schema.prisma` - `Integration` model
- **Integration type** (CALENDAR, DATABASE, API, WEBHOOK, CRM, HELPDESK)
- **Integration configuration** (JSON - may contain API keys, credentials)
- **Integration status** (active/inactive)

**Purpose:** Service delivery, third-party integrations
**Lawful Basis:** **Contract** (necessary for service functionality)

**Note:** Integration configurations may contain sensitive credentials. These should be encrypted.

---

### 1.9 Payment & Billing Data
**Source:** `prisma/schema.prisma` - `Transaction` model + Stripe integration
- **Transaction type & amount**
- **Currency** (default: USD)
- **Stripe payment intent IDs**
- **Stripe checkout session IDs**
- **Stripe invoice IDs**
- **Stripe customer ID** (stored in User model)
- **Stripe subscription ID** (stored in User model)
- **Subscription tier**
- **Transaction metadata** (JSON)

**Purpose:** Payment processing, billing, subscription management
**Lawful Basis:** **Contract** (necessary for payment processing)

**Note:** Full payment card details are NOT stored - only Stripe handles PCI-sensitive data.

---

### 1.10 Helpdesk Agent Data
**Source:** `prisma/schema.prisma` - `HelpdeskUser`, `HelpdeskUserInbox` models
- **Agent name**
- **Agent email** (plus-addressed: admin+agentname@domain.com)
- **Chatwoot user ID** (external service reference)
- **Chatwoot role** (agent)
- **Inbox assignments**

**Purpose:** Helpdesk management, agent assignment
**Lawful Basis:** **Contract** (necessary for helpdesk functionality)

---

### 1.11 API Keys & Credentials
**Source:** `prisma/schema.prisma` - `ApiKey` model + encrypted storage
- **Provider** (e.g., "openai", "anthropic")
- **Model**
- **API key** (stored, should be encrypted)
- **Usage stats** (JSON)
- **Fusion credential ID** (encrypted in User model)
- **Fusion credential name**

**Purpose:** Service delivery, API integrations
**Lawful Basis:** **Contract** (necessary for service functionality)

**Security Note:** API keys should be encrypted at rest. Current implementation uses `EncryptionService` for credential IDs.

---

### 1.12 Cookies & Session Data
**Source:** `lib/auth.ts` - NextAuth configuration
- **Session cookies** (`__Secure-next-auth.session-token` in production)
- **Session tokens** (stored in `Session` model)
- **Session expiration dates**

**Purpose:** Authentication, session management, user preferences
**Lawful Basis:** **Legitimate Interest** (necessary for authentication and security)

**Cookie Settings:**
- `httpOnly: true` (prevents JavaScript access)
- `secure: true` (HTTPS only in production)
- `sameSite: 'lax'` (CSRF protection)

---

### 1.13 Third-Party Service Data
**Source:** External integrations

#### Chatwoot (Customer Support Widget)
- **Chat messages** (stored in Chatwoot)
- **User identification** (via website token)
- **User interactions** (via Chatwoot SDK)

**Purpose:** Customer support, live chat functionality
**Lawful Basis:** **Consent** (user initiates chat) + **Legitimate Interest** (customer support)

#### Vercel Analytics
- **Page views** (aggregated, anonymized)
- **Performance metrics**
- **User interactions** (aggregated)

**Purpose:** Website analytics, performance monitoring
**Lawful Basis:** **Legitimate Interest** (service improvement) + **Consent** (for marketing analytics)

#### Google OAuth (if enabled)
- **Google profile data** (name, email, avatar)
- **OAuth tokens** (stored in `Account` model)

**Purpose:** Authentication, user convenience
**Lawful Basis:** **Consent** (user chooses Google login)

#### Stripe
- **Payment processing data** (handled by Stripe)
- **Subscription management**

**Purpose:** Payment processing, billing
**Lawful Basis:** **Contract** (necessary for payments)

#### n8n (Workflow Automation)
- **Workflow configurations**
- **Workflow execution data**

**Purpose:** Service delivery, workflow automation
**Lawful Basis:** **Contract** (necessary for service functionality)

#### Fusion API
- **API usage metrics**
- **Cost tracking**

**Purpose:** Service delivery, billing
**Lawful Basis:** **Contract** (necessary for service and billing)

---

## 2. DATA COLLECTION PURPOSES

### 2.1 Service Delivery (Contract)
- User authentication & account management
- Knowledge base management
- Workflow execution
- Chat/conversation handling
- Document processing
- API integrations

### 2.2 Billing & Payment (Contract)
- Subscription management
- Payment processing
- Usage tracking
- Cost calculation
- Invoice generation

### 2.3 Security & Fraud Prevention (Legitimate Interest)
- IP address logging (login attempts)
- Failed login tracking
- Rate limiting
- Session management
- Account protection

### 2.4 Analytics & Improvement (Legitimate Interest + Consent)
- Usage analytics
- Performance monitoring
- Feature development
- Service optimization
- Error tracking

### 2.5 Customer Support (Contract + Consent)
- Chat conversations
- Support ticket management
- Agent assignment
- Issue resolution

### 2.6 Marketing (Consent - if applicable)
- Email communications (trial reminders, expiration notices)
- Product updates
- Feature announcements

---

## 3. LAWFUL BASES FOR PROCESSING

### 3.1 Contract (Article 6(1)(b) GDPR)
**Applies to:**
- User account data
- Service delivery data (knowledge bases, workflows, documents)
- Payment & billing data
- API usage & cost tracking
- Integration configurations

**Justification:** Data necessary to fulfill the service contract with the user.

---

### 3.2 Legitimate Interest (Article 6(1)(f) GDPR)
**Applies to:**
- IP addresses (security, fraud prevention)
- Login timestamps & failed login counts
- Session management
- Analytics (aggregated, anonymized where possible)
- Performance monitoring
- Security logs

**Justification:** Necessary for security, fraud prevention, and service improvement. Legitimate interests outweigh potential privacy impact.

---

### 3.3 Consent (Article 6(1)(a) GDPR)
**Applies to:**
- Marketing communications (if sent)
- Cookie usage for analytics (where required by jurisdiction)
- Chat widget usage (user initiates)
- Google OAuth (user chooses)

**Justification:** User explicitly provides consent for these activities.

---

### 3.4 Legal Obligation (Article 6(1)(c) GDPR)
**Applies to:**
- Transaction records (for accounting/tax purposes)
- Data retention for legal compliance

**Justification:** Required by law (e.g., tax records, accounting).

---

## 4. DATA RETENTION

### 4.1 Active User Data
- **Retained:** For duration of account + legal retention period
- **Deletion:** Upon account deletion (subject to legal obligations)

### 4.2 Transaction Data
- **Retained:** 7 years (for accounting/tax compliance)
- **Deletion:** After legal retention period expires

### 4.3 Analytics Data
- **Retained:** Aggregated data retained indefinitely (anonymized)
- **Personal data:** Deleted after account deletion

### 4.4 Log Data (IP addresses, failed logins)
- **Retained:** 90 days (for security purposes)
- **Deletion:** Automated after retention period

### 4.5 Chat/Conversation Data
- **Retained:** As long as account is active (stored in Chatwoot)
- **Deletion:** Upon account deletion or user request

---

## 5. DATA SHARING

### 5.1 Third-Party Services
- **Chatwoot:** Chat messages, contact information
- **Stripe:** Payment data (card details NOT stored by us)
- **Vercel:** Analytics (aggregated, anonymized)
- **Google OAuth:** Authentication data (if user chooses)
- **n8n:** Workflow configurations
- **Fusion API:** API usage metrics

### 5.2 Service Providers
- **Hosting:** Vercel/cloud provider (infrastructure)
- **Database:** PostgreSQL (data storage)
- **Email:** SMTP provider (transactional emails)

### 5.3 No Data Selling
- Voxe does NOT sell personal data to third parties.

---

## 6. USER RIGHTS (GDPR/CCPA)

### 6.1 Right of Access
- Users can request a copy of their data.
- **Implementation:** Export user data via API or admin dashboard.

### 6.2 Right to Rectification
- Users can correct inaccurate data.
- **Implementation:** Users can update profile information via dashboard.

### 6.3 Right to Erasure (Right to be Forgotten)
- Users can request deletion of their data.
- **Implementation:** Account deletion removes personal data (subject to legal obligations).

### 6.4 Right to Data Portability
- Users can export their data in a machine-readable format.
- **Implementation:** Data export functionality (to be implemented if not present).

### 6.5 Right to Object
- Users can object to processing based on legitimate interest.
- **Implementation:** Users can opt-out of analytics or marketing communications.

### 6.6 Right to Restrict Processing
- Users can request restriction of processing.
- **Implementation:** Account suspension/deactivation.

---

## 7. SECURITY MEASURES

### 7.1 Encryption
- **In Transit:** HTTPS/TLS
- **At Rest:** Database encryption (via hosting provider)
- **Sensitive Data:** API keys encrypted via `EncryptionService`

### 7.2 Access Controls
- Role-based access (USER, ADMIN, SUPER_ADMIN)
- Session-based authentication
- 2FA support (TOTP)

### 7.3 Security Practices
- Password hashing (bcrypt)
- Rate limiting
- Captcha verification (Turnstile)
- Secure cookies (httpOnly, secure, sameSite)

---

## 8. COOKIES & TRACKING

### 8.1 Essential Cookies
- **Session cookies:** Authentication (no consent required)
- **Security cookies:** CSRF protection (no consent required)

### 8.2 Analytics Cookies
- **Vercel Analytics:** Performance monitoring (may require consent in some jurisdictions)

### 8.3 Third-Party Cookies
- **Chatwoot:** Chat widget functionality
- **Google OAuth:** Authentication (if enabled)

---

## 9. RECOMMENDATIONS

### 9.1 Privacy Policy Updates
- ✅ Privacy policy exists (`app/privacy-policy/page.tsx`)
- ⚠️ Should be updated to reflect all data collection points identified above
- ⚠️ Should specify retention periods explicitly
- ⚠️ Should list all third-party services

### 9.2 Cookie Consent
- ⚠️ Consider implementing cookie consent banner for analytics cookies (if required by jurisdiction)
- ✅ Essential cookies (session, security) do not require consent

### 9.3 Data Minimization
- ✅ Only collect data necessary for service delivery
- ⚠️ Review if all fields in User model are necessary
- ✅ Sensitive data (API keys, credentials) are encrypted

### 9.4 User Rights Implementation
- ✅ Users can update profile data
- ⚠️ Implement data export functionality
- ⚠️ Implement explicit account deletion with data removal
- ✅ Support email for data requests: `contact@mcp4.com`

### 9.5 Data Processing Agreements
- ⚠️ Ensure DPAs are in place with:
  - Chatwoot
  - Stripe
  - Vercel
  - Hosting provider
  - Email provider

---

## 10. SUMMARY TABLE

| Data Type | Purpose | Lawful Basis | Retention |
|-----------|---------|--------------|-----------|
| Account Data | Service delivery, authentication | Contract | Account duration |
| IP Address | Security, fraud prevention | Legitimate Interest | 90 days |
| Chat Messages | Customer support | Contract + Consent | Account duration |
| Analytics | Service improvement | Legitimate Interest + Consent | Aggregated (anonymized) |
| API Usage | Billing, usage tracking | Contract | Account duration |
| Documents | Service delivery | Contract | Account duration |
| Payment Data | Billing | Contract | 7 years (legal) |
| Session Data | Authentication | Legitimate Interest | Session duration |

---

**Last Updated:** 2025-01-XX
**Next Review:** Annually or when data collection practices change

