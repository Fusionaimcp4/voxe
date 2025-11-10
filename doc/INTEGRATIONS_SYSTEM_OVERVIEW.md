# Dashboard Integrations System - Complete Overview

This document provides a comprehensive breakdown of how the dashboard/integrations system works in the Voxe application.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Frontend Components](#frontend-components)
3. [Backend API Routes](#backend-api-routes)
4. [Integration Types](#integration-types)
5. [Data Flow](#data-flow)
6. [Security & Encryption](#security--encryption)
7. [Key Features](#key-features)

---

## System Architecture

### Overview
The integrations system allows users to connect external services (CRM, helpdesk, etc.) to enhance their AI workflows. It supports multiple integration types with a flexible, provider-based architecture.

### Core Components

```
Frontend (React/Next.js)
├── app/dashboard/integrations/page.tsx (Main page)
├── components/integrations/
│   ├── CRMConfigModal.tsx (CRM configuration modal)
│   ├── ChatwootConfigForm.tsx (Chatwoot-specific form)
│   ├── CustomCRMConfigForm.tsx (Custom CRM form)
│   └── HelpdeskModal.tsx (Helpdesk agent management)

Backend (API Routes)
├── app/api/dashboard/integrations/
│   ├── route.ts (List/Create integrations)
│   ├── create/route.ts (Create with encryption)
│   ├── [id]/route.ts (Get/Update/Delete)
│   ├── test/route.ts (Test connection)
│   └── chatwoot/
│       ├── agents/route.ts
│       ├── create-user/route.ts
│       ├── assign-agent/route.ts
│       └── inboxes/route.ts

Libraries
├── lib/integrations/
│   ├── types.ts (TypeScript types)
│   ├── crm-providers.ts (Provider definitions)
│   ├── crm-service.ts (Connection testing)
│   └── encryption.ts (AES-256-GCM encryption)
```

---

## Frontend Components

### 1. Main Integrations Page (`app/dashboard/integrations/page.tsx`)

**Purpose**: Main dashboard page for managing all integrations

**Key Features**:
- Displays integration statistics (total, active, inactive, errors)
- Shows available integration types with tier-based access control
- Lists user's existing integrations
- Handles integration creation, editing, deletion, and activation

**State Management**:
```typescript
- integrations: Integration[] - List of user's integrations
- stats: IntegrationStats - Statistics about integrations
- showCRMModal: boolean - Controls CRM config modal
- showChatScriptModal: boolean - Controls chat widget script modal
- showHelpdeskModal: boolean - Controls helpdesk modal
- editingIntegration: Integration | null - Currently editing integration
```

**Key Functions**:
- `fetchIntegrations()` - Fetches user's integrations from API
- `handleAddIntegration(type)` - Opens appropriate modal for integration type
- `handleEditIntegration(integration)` - Opens edit modal
- `handleDeleteIntegration(id)` - Deletes integration with confirmation
- `handleToggleActive(id, status)` - Activates/deactivates integration
- `handleSaveCRM(name, config)` - Saves CRM integration (create or update)
- `handleCopyScript()` - Copies chat widget script to clipboard

**Integration Types Available**:
1. **CRM Integration** (FREE tier)
   - Chatwoot, Salesforce, HubSpot, Zoho, Pipedrive, Custom
   - Opens `CRMConfigModal`

2. **Chat Widget Script** (Paid tiers only)
   - Generates embeddable Chatwoot widget script
   - Configurable position (left/right) and type (standard/expanded)
   - Selects from user's demos

3. **Helpdesk Setup** (FREE tier)
   - Create and manage Chatwoot agents
   - Assign agents to inboxes
   - Opens `HelpdeskModal`

4. **Database/API/Webhook** (Coming soon)
   - Placeholder for future integrations

**Tier-Based Access Control**:
- FREE: CRM, Helpdesk
- STARTER+: Chat Widget Script
- PRO_PLUS+: Database, API, Webhook (coming soon)

---

### 2. CRM Configuration Modal (`components/integrations/CRMConfigModal.tsx`)

**Purpose**: Modal for configuring CRM integrations

**Features**:
- Provider selection (Chatwoot, Salesforce, HubSpot, Zoho, Pipedrive, Custom)
- Dynamic form fields based on selected provider
- Connection testing before saving
- Edit existing integrations

**State**:
```typescript
- selectedProvider: CRMProvider
- integrationName: string
- configuration: Partial<CRMConfiguration>
- isTesting: boolean
- testResult: TestConnectionResponse | null
```

**Flow**:
1. User selects provider
2. Provider-specific form renders (ChatwootConfigForm or CustomCRMConfigForm)
3. User fills in credentials
4. User can test connection (calls `/api/dashboard/integrations/test`)
5. On save, encrypts sensitive fields and saves to database

**Provider-Specific Forms**:
- **Chatwoot**: Uses `ChatwootConfigForm` with fields:
  - Base URL
  - Account ID
  - API Access Token (encrypted)
  - Feature toggles (auto-create inboxes, bots, sync contacts)

- **Custom**: Uses `CustomCRMConfigForm` with fields:
  - CRM Name
  - API Base URL
  - Authentication Type (API_KEY, BEARER, BASIC, OAUTH2)
  - Credentials (JSON format, encrypted)

---

### 3. Chatwoot Config Form (`components/integrations/ChatwootConfigForm.tsx`)

**Purpose**: Dynamic form for Chatwoot configuration

**How it works**:
- Uses `getCRMFormFields('CHATWOOT')` to get field definitions
- Dynamically renders fields based on definitions
- Handles nested fields (e.g., `features.autoCreateInboxes`)
- Supports text, password, url, checkbox field types

**Field Definitions** (from `crm-providers.ts`):
```typescript
{
  name: 'baseUrl',
  label: 'Chatwoot Base URL',
  type: 'url',
  validation: { required: true, pattern: /^https?:\/\/.+/ },
  sensitive: false
},
{
  name: 'apiKey',
  label: 'API Access Token',
  type: 'password',
  validation: { required: true, minLength: 10 },
  sensitive: true  // Will be encrypted
}
```

---

### 4. Helpdesk Modal (`components/integrations/HelpdeskModal.tsx`)

**Purpose**: Manage Chatwoot helpdesk agents and inbox assignments

**Features**:
- **Create Agent Tab**:
  - Create new Chatwoot agent accounts
  - Password validation (8+ chars, 1 number, 1 special char)
  - Tier limit enforcement
  - Uses plus-addressing for email (user+agent@domain.com)

- **Manage Collaborators Tab**:
  - View all agents
  - Assign/remove agents from inboxes
  - Checkbox-based inbox assignment

**API Calls**:
- `GET /api/dashboard/integrations/chatwoot/agents` - List agents
- `GET /api/dashboard/integrations/chatwoot/inboxes` - List inboxes
- `POST /api/dashboard/integrations/chatwoot/create-user` - Create agent
- `POST /api/dashboard/integrations/chatwoot/assign-agent` - Assign to inbox

**Tier Limits**:
- FREE: 1 agent
- STARTER: 2 agents
- TEAM: 3 agents
- BUSINESS: 5 agents
- ENTERPRISE: Unlimited (-1)

---

## Backend API Routes

### 1. `/api/dashboard/integrations` (GET, POST)

**GET**: List user's integrations
```typescript
Response: {
  integrations: Integration[],
  stats: {
    totalIntegrations: number,
    activeIntegrations: number,
    inactiveIntegrations: number,
    errorIntegrations: number
  }
}
```

**POST**: Create integration (legacy, redirects to `/create`)

---

### 2. `/api/dashboard/integrations/create` (POST)

**Purpose**: Create new integration with encryption

**Process**:
1. Validates user session
2. Validates required fields (name, type)
3. Checks tier limits (`canPerformAction`)
4. **Encrypts sensitive fields**:
   - Gets form field definitions for provider
   - Identifies sensitive fields (marked with `sensitive: true`)
   - Encrypts each sensitive field using AES-256-GCM
   - Format: `iv:tag:encrypted` (hex strings)
5. Creates integration record in database
6. Tracks usage

**Encryption Logic**:
```typescript
// For each sensitive field:
if (!fieldValue.includes(':')) {  // Not already encrypted
  fieldValue = encrypt(fieldValue);
}
```

**Example**:
```typescript
// Input:
{
  provider: 'CHATWOOT',
  apiKey: 'my-secret-token'
}

// After encryption:
{
  provider: 'CHATWOOT',
  apiKey: 'a1b2c3d4:...:encrypted_hex_string'
}
```

---

### 3. `/api/dashboard/integrations/[id]` (GET, PUT, DELETE)

**GET**: Fetch single integration
- Verifies ownership
- Returns integration (credentials still encrypted)

**PUT**: Update integration
- Verifies ownership
- Merges existing config with updates
- Re-encrypts sensitive fields if changed
- Updates database

**DELETE**: Remove integration
- Verifies ownership
- Deletes from database

---

### 4. `/api/dashboard/integrations/test` (POST)

**Purpose**: Test CRM connection before saving

**Process**:
1. Validates request (type, configuration)
2. Calls `testCRMConnection()` from `crm-service.ts`
3. Returns test result with success/error details

**Supported Providers**:
- **Chatwoot**: Tests by fetching account details and checking features
- **Custom**: Tests basic connectivity with provided auth
- **Salesforce/HubSpot**: Placeholder (coming soon)

**Response**:
```typescript
{
  success: boolean,
  message: string,
  details?: {
    accountInfo?: any,
    features?: string[],
    version?: string
  },
  error?: string
}
```

---

### 5. Chatwoot Integration Routes

#### `/api/dashboard/integrations/chatwoot/agents` (GET)
- Lists all Chatwoot agents for user
- Uses user's CRM integration to authenticate

#### `/api/dashboard/integrations/chatwoot/inboxes` (GET)
- Lists all Chatwoot inboxes
- Uses user's CRM integration

#### `/api/dashboard/integrations/chatwoot/create-user` (POST)
- Creates new Chatwoot agent
- Validates password requirements
- Checks tier limits
- Uses plus-addressing for email

#### `/api/dashboard/integrations/chatwoot/assign-agent` (POST)
- Assigns/removes agent from inbox
- Action: 'add' or 'remove'

---

## Integration Types

### 1. CRM Integration

**Supported Providers**:
- **Chatwoot** ✅ (Fully implemented)
- **Salesforce** 🚧 (Placeholder)
- **HubSpot** 🚧 (Placeholder)
- **Zoho** 🚧 (Placeholder)
- **Pipedrive** 🚧 (Placeholder)
- **Custom** ✅ (Fully implemented)

**Configuration Structure**:
```typescript
interface CRMConfiguration {
  provider: CRMProvider;
  // Provider-specific fields...
  connectionStatus?: {
    isConnected: boolean;
    lastChecked?: string;
    errorMessage?: string;
  };
}
```

**Chatwoot Configuration**:
```typescript
{
  provider: 'CHATWOOT',
  baseUrl: 'https://app.chatwoot.com',
  accountId: '1',
  apiKey: 'encrypted:...',  // Encrypted
  features: {
    autoCreateInboxes: true,
    autoCreateBots: true,
    syncContacts: true
  }
}
```

**Custom CRM Configuration**:
```typescript
{
  provider: 'CUSTOM',
  name: 'My Custom CRM',
  apiEndpoint: 'https://api.example.com',
  authType: 'BEARER',  // API_KEY | BEARER | BASIC | OAUTH2
  credentials: {  // Encrypted as JSON string
    token: 'encrypted:...'
  }
}
```

---

### 2. Chat Widget Script

**Purpose**: Generate embeddable Chatwoot widget script

**Features**:
- Select from user's demos
- Configure widget position (left/right)
- Configure widget type (standard/expanded_bubble)
- Copy script to clipboard

**Generated Script**:
```html
<script>
  window.chatwootSettings = {
    "position": "right",
    "type": "standard",
    "launcherTitle": "Chat with us"
  };
  (function(d,t) {
    var BASE_URL = "https://chatvoxe.mcp4.ai";
    var g = d.createElement(t), s = d.getElementsByTagName(t)[0];
    g.src = BASE_URL + "/packs/js/sdk.js";
    g.async = true;
    s.parentNode.insertBefore(g,s);
    g.onload = function() {
      window.chatwootSDK.run({
        websiteToken: 'user-website-token',
        baseUrl: BASE_URL
      });
    };
  })(document,"script");
</script>
```

**Access Control**: Paid tiers only (STARTER+)

---

### 3. Helpdesk Setup

**Purpose**: Manage Chatwoot helpdesk agents

**Features**:
- Create agent accounts
- Assign agents to inboxes
- Tier-based agent limits
- Password validation

**Agent Creation**:
- Email format: `user+agentname@domain.com` (plus-addressing)
- Password requirements: 8+ chars, 1 number, 1 special char
- Creates Chatwoot user via API

---

## Data Flow

### Creating a CRM Integration

```
1. User clicks "Add Integration" → "CRM"
   ↓
2. CRMConfigModal opens
   ↓
3. User selects provider (e.g., Chatwoot)
   ↓
4. ChatwootConfigForm renders with fields
   ↓
5. User fills in credentials
   ↓
6. User clicks "Test Connection"
   ↓
7. Frontend → POST /api/dashboard/integrations/test
   ↓
8. Backend → testCRMConnection()
   ↓
9. Decrypts API key (if needed)
   ↓
10. Makes API call to Chatwoot
   ↓
11. Returns test result
   ↓
12. User sees success/error message
   ↓
13. User clicks "Save Integration"
   ↓
14. Frontend → POST /api/dashboard/integrations/create
   ↓
15. Backend identifies sensitive fields
   ↓
16. Encrypts sensitive fields (apiKey, etc.)
   ↓
17. Saves to database
   ↓
18. Returns success
   ↓
19. Modal closes, integrations list refreshes
```

### Using Integration Credentials

```
1. System needs Chatwoot credentials
   ↓
2. Fetches user's CRM integration from database
   ↓
3. Configuration has encrypted fields
   ↓
4. Decrypts using decrypt() function
   ↓
5. Uses decrypted credentials for API calls
```

---

## Security & Encryption

### Encryption Algorithm
- **Algorithm**: AES-256-GCM
- **Key**: From `INTEGRATION_ENCRYPTION_KEY` environment variable
- **Format**: `iv:tag:encrypted` (all hex strings)

### Encryption Process
```typescript
1. Generate random IV (16 bytes)
2. Create cipher with key and IV
3. Encrypt plaintext
4. Get authentication tag
5. Return: `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
```

### Decryption Process
```typescript
1. Split encrypted string by ':'
2. Extract IV, tag, and encrypted data
3. Create decipher with key and IV
4. Set authentication tag
5. Decrypt and return plaintext
```

### Field Encryption
- Only fields marked `sensitive: true` in form definitions are encrypted
- Encryption happens automatically in `/create` and `/update` routes
- Decryption happens in `crm-service.ts` when testing connections

### Security Best Practices
- ✅ Credentials never stored in plaintext
- ✅ Encryption key stored in environment variable
- ✅ Authentication required for all operations
- ✅ Ownership verification before access
- ✅ Rate limiting on sensitive endpoints
- ✅ Tier-based access control

---

## Key Features

### 1. Dynamic Form Generation
- Form fields defined in `crm-providers.ts`
- Forms generated dynamically based on provider
- Supports nested fields (e.g., `features.autoCreateInboxes`)
- Validation rules defined per field

### 2. Provider Abstraction
- Easy to add new CRM providers
- Each provider has:
  - Metadata (name, description, icon, features)
  - Form field definitions
  - Connection test function

### 3. Tier-Based Limits
- Integration creation checked against tier limits
- Helpdesk agents limited by tier
- Chat widget script requires paid tier

### 4. Connection Testing
- Test before saving
- Validates credentials
- Returns detailed error messages
- Checks available features

### 5. Flexible Configuration
- Supports multiple authentication methods
- Custom CRM option for any API
- Feature toggles for automation

### 6. User Experience
- Modal-based configuration
- Real-time validation
- Clear error messages
- Help text and documentation links
- Copy-to-clipboard for scripts

---

## Database Schema

### Integration Model
```prisma
model Integration {
  id            String   @id @default(cuid())
  userId        String
  name          String
  type          String   // CRM, CALENDAR, DATABASE, etc.
  configuration Json     // Encrypted sensitive fields
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  user          User     @relation(fields: [userId], references: [id])
}
```

**Configuration JSON Structure**:
```json
{
  "provider": "CHATWOOT",
  "baseUrl": "https://app.chatwoot.com",
  "accountId": "1",
  "apiKey": "iv:tag:encrypted_hex",  // Encrypted
  "features": {
    "autoCreateInboxes": true,
    "autoCreateBots": true,
    "syncContacts": true
  }
}
```

---

## Environment Variables

```bash
# Required for encryption
INTEGRATION_ENCRYPTION_KEY=your-32-byte-hex-key-or-string

# Chatwoot (if using global config)
CHATWOOT_BASE_URL=https://app.chatwoot.com
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_API_KEY=your-api-key
```

---

## Future Enhancements

### Planned Features
1. **Salesforce Integration** - OAuth flow, lead/contact sync
2. **HubSpot Integration** - API key auth, contact sync
3. **Database Integrations** - PostgreSQL, MySQL, MongoDB
4. **API Integrations** - Generic REST/GraphQL connectors
5. **Webhook Integrations** - Custom webhook endpoints
6. **Integration Templates** - Pre-configured setups
7. **Sync Scheduling** - Automated data synchronization
8. **Integration Logs** - Activity tracking and debugging

---

## Common Use Cases

### Use Case 1: Connect Chatwoot
1. User goes to Integrations page
2. Clicks "Add Integration" → "CRM"
3. Selects "Chatwoot" provider
4. Enters Base URL, Account ID, API Token
5. Tests connection (validates credentials)
6. Saves integration
7. Integration now available for use in workflows

### Use Case 2: Create Helpdesk Agent
1. User clicks "Helpdesk Setup"
2. Goes to "Create Agent" tab
3. Enters agent name and password
4. System creates Chatwoot user
5. Switches to "Manage Collaborators" tab
6. Assigns agent to inboxes via checkboxes

### Use Case 3: Get Chat Widget Script
1. User clicks "Chat Widget Script" (paid tier)
2. Selects demo from dropdown
3. Chooses widget position and type
4. Clicks "Copy Script"
5. Pastes script into website HTML

---

## Troubleshooting

### Common Issues

1. **"Failed to test connection"**
   - Check credentials are correct
   - Verify API key has proper permissions
   - Check network connectivity

2. **"Encryption key not found"**
   - Set `INTEGRATION_ENCRYPTION_KEY` environment variable
   - Generate key: `crypto.randomBytes(32).toString('hex')`

3. **"Tier limit exceeded"**
   - Check user's subscription tier
   - Upgrade to higher tier if needed

4. **"Integration not found"**
   - Verify integration belongs to user
   - Check integration ID is correct

---

This system provides a flexible, secure, and user-friendly way to integrate external services with the Voxe platform, with strong encryption, tier-based access control, and extensible architecture for adding new providers.

