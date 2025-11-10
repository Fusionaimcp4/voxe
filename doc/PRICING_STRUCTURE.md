# Voxe Pricing Structure & Cost Breakdown

## Overview
Your application has multiple pricing models configured. This document outlines the different pricing structures and tier limits.

---

## 📊 Database Pricing Plans (From `seed-pricing-plans.ts`)

These are the plans stored in the database via the `PricingPlan` model:

### 1. **FREE** - $0/month (Forever)
- **Description**: Perfect for getting started
- **Features**:
  - 1 Demo
  - 2 Workflows
  - 1 Knowledge Base
  - 10 Documents
  - 1 Integration
  - Community Support
  - 1,000 API calls/month
- **CTA**: "Get Started" → `/dashboard/userdemo`

### 2. **PRO** - $29/month ⭐ (Popular)
- **Description**: For growing businesses
- **Features**:
  - 5 Demos
  - 10 Workflows
  - 5 Knowledge Bases
  - 100 Documents
  - 3 Integrations
  - Email Support
  - 10,000 API calls/month
  - Advanced Analytics
  - Custom Branding
  - Priority Support
- **CTA**: "Start Pro Trial" → `/pricing/pro`

### 3. **PRO_PLUS** - $99/month
- **Description**: For scaling teams
- **Features**:
  - 25 Demos
  - 50 Workflows
  - 25 Knowledge Bases
  - 1,000 Documents
  - 10 Integrations
  - Priority Support
  - 100,000 API calls/month
  - White Label
  - SSO Integration
  - API Access
  - Webhook Integrations
- **CTA**: "Start Pro+ Trial" → `/pricing/pro-plus`

### 4. **ENTERPRISE** - Custom Pricing
- **Description**: For large organizations
- **Features**:
  - Unlimited Demos
  - Unlimited Workflows
  - Unlimited Knowledge Bases
  - Unlimited Documents
  - Unlimited Integrations
  - Dedicated Support
  - Unlimited API calls
  - Custom Integrations
  - SLA Guarantees
  - On-premise Deployment
- **CTA**: "Contact Sales" → `/contact`

---

## 🔧 Feature Matrix & Tier Limits (From `lib/features.ts`)

Detailed technical limits for each tier:

### **FREE**
```yaml
Max Demos: 1
Max Workflows: 2
Max Knowledge Bases: 1
Max Documents: 10
Max Integrations: 1
Max Helpdesk Agents: 1
API Calls/Month: 1,000
Support Level: Community
Document Size Limit: 5MB
Chunk Size: 1,000
Max Chunks/Document: 50
Available Integrations: ['CRM']
Features: []
```

### **STARTER**
```yaml
Max Demos: 2
Max Workflows: 5
Max Knowledge Bases: 2
Max Documents: 50
Max Integrations: 2
Max Helpdesk Agents: 2
API Calls/Month: 5,000
Support Level: Email
Document Size Limit: 10MB
Chunk Size: 1,500
Max Chunks/Document: 100
Available Integrations: ['CRM', 'Calendar']
Features: []
```

### **TEAM** (Equivalent to PRO in database)
```yaml
Max Demos: 5
Max Workflows: 10
Max Knowledge Bases: 5
Max Documents: 100
Max Integrations: 3
Max Helpdesk Agents: 3
API Calls/Month: 10,000
Support Level: Email
Document Size Limit: 25MB
Chunk Size: 2,000
Max Chunks/Document: 200
Available Integrations: ['CRM', 'Calendar', 'Database']
Features: ['advanced_analytics', 'custom_branding', 'priority_support']
```

### **BUSINESS** (Equivalent to PRO_PLUS in database)
```yaml
Max Demos: 25
Max Workflows: 50
Max Knowledge Bases: 25
Max Documents: 1,000
Max Integrations: 10
Max Helpdesk Agents: 5
API Calls/Month: 100,000
Support Level: Priority
Document Size Limit: 100MB
Chunk Size: 4,000
Max Chunks/Document: 1,000
Available Integrations: ['CRM', 'Calendar', 'Database', 'API', 'Webhook']
Features: [
  'advanced_analytics',
  'custom_branding',
  'white_label',
  'sso',
  'api_access',
  'webhook_integrations'
]
```

### **ENTERPRISE**
```yaml
Max Demos: Unlimited
Max Workflows: Unlimited
Max Knowledge Bases: Unlimited
Max Documents: Unlimited
Max Integrations: Unlimited
Max Helpdesk Agents: Unlimited
API Calls/Month: Unlimited
Support Level: Dedicated
Document Size Limit: 500MB
Chunk Size: 8,000
Max Chunks/Document: Unlimited
Available Integrations: ['CRM', 'Calendar', 'Database', 'API', 'Webhook', 'Custom']
Features: [
  'advanced_analytics',
  'custom_branding',
  'white_label',
  'sso',
  'api_access',
  'webhook_integrations',
  'custom_integrations',
  'dedicated_support',
  'sla'
]
```

---

## 💰 Alternative Pricing Structure (From `standalone-pricing-page.tsx`)

This appears to be a different pricing model, possibly for a different product variant:

### 1. **Starter** - $49/month or $500/year (15% annual discount)
- 1 active chatbot
- Up to 12,000 chats/year
- Basic analytics

### 2. **Team** - $139/month or $1,418/year ⭐ (Popular)
- 5 active chatbots
- Up to 60,000 chats/year
- Team collaboration

### 3. **Business** - $413/month or $4,213/year
- Unlimited active chatbots
- Up to 300,000 chats/year
- Advanced analytics

### 4. **Enterprise** - Custom Pricing
- Unlimited chatbots
- Unlimited chats
- Custom features

---

## 📋 Database Schema

### `PricingPlan` Model Fields:
- `id`: Unique identifier
- `tier`: SubscriptionTier enum (FREE, PRO, PRO_PLUS, ENTERPRISE)
- `name`: Display name
- `price`: Decimal (10,2) - Monthly price
- `currency`: String (default: "USD")
- `period`: String (default: "month")
- `description`: Plan description
- `features`: String array
- `isPopular`: Boolean (marks recommended plan)
- `isActive`: Boolean
- `ctaText`: Call-to-action button text
- `ctaHref`: Call-to-action URL
- `annualDiscountPercentage`: Optional discount for yearly billing
- `stripeMonthlyPriceId`: Stripe Price ID for monthly subscriptions
- `stripeYearlyPriceId`: Stripe Price ID for yearly subscriptions

### `TierLimit` Model Fields:
- `tier`: SubscriptionTier enum
- `maxDemos`: Integer
- `maxWorkflows`: Integer
- `maxKnowledgeBases`: Integer
- `maxDocuments`: Integer
- `maxIntegrations`: Integer
- `apiCallsPerMonth`: Integer
- `documentSizeLimit`: Integer (bytes)
- `chunkSize`: Integer
- `maxChunksPerDocument`: Integer
- `maxHelpdeskAgents`: Integer
- `isActive`: Boolean

---

## 💡 Key Differences Between Models

| Model | Purpose | Pricing Source |
|-------|---------|----------------|
| `PricingPlan` | Display pricing to users, Stripe integration | Database (seeded from `seed-pricing-plans.ts`) |
| `TierLimit` | Enforce usage limits | Database (seeded from `seed-tier-limits.ts`) |
| `FEATURE_MATRIX` | Code-level feature checks | `lib/features.ts` |

**Note**: The `FEATURE_MATRIX` uses tier names (FREE, STARTER, TEAM, BUSINESS, ENTERPRISE) while `PricingPlan` uses (FREE, PRO, PRO_PLUS, ENTERPRISE). There may be a mapping needed between these.

---

## 🔍 Cost Tracking

### `ApiCallLog` Model (for cost tracking):
- Tracks API call costs per user
- Fields:
  - `inputTokens`: Integer
  - `outputTokens`: Integer
  - `totalTokens`: Integer
  - `cost`: Float (USD)
  - `provider`: String (e.g., "openai", "anthropic")
  - `model`: String
  - `endpoint`: String
  - `responseTime`: Integer (ms)

### User Balance Tracking:
- `User.balanceUsd`: Decimal(12,4) - User's account balance
- `User.apiCallsThisMonth`: Integer - Monthly API call counter
- `Transaction` model: Records all financial transactions

---

## 📝 Notes

1. **Pricing Inconsistencies**: There are two different pricing structures:
   - Database seeding uses: FREE ($0), PRO ($29), PRO_PLUS ($99)
   - Standalone pricing page uses: Starter ($49), Team ($139), Business ($413)

2. **Tier Mapping**: The feature matrix uses STARTER/TEAM/BUSINESS, while pricing plans use PRO/PRO_PLUS. Verify mapping logic.

3. **Stripe Integration**: Plans require `stripeMonthlyPriceId` and `stripeYearlyPriceId` for payment processing.

4. **Annual Billing**: Currently supports `annualDiscountPercentage` but pricing plans show different annual rates in the standalone page.

---

## 🛠️ To Update Pricing

1. **Database Plans**: Edit `scripts/seed-pricing-plans.ts` and run the seed script
2. **Feature Limits**: Edit `lib/features.ts` for tier limits
3. **Tier Limits**: Edit database via `TierLimit` model or seed script
4. **UI Display**: Update `app/pricing/page.tsx` or `components/standalone-pricing-page.tsx`

