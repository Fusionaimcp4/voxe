# Helpdesk Requirement Implementation Plan

## Executive Summary

This document outlines the analysis and implementation plan for requiring paid customers to have an active helpdesk integration before creating agents, demos, or workflows. Free users will continue to be able to explore the platform without a helpdesk requirement.

---

## Current System Analysis

### 1. Helpdesk Creation Flow

**Location:** `app/api/helpdesk/create-voxe-helpdesk/route.ts`

**How it works:**
- Users can create a Voxe helpdesk via the "Create Voxe Helpdesk" button in the integrations page
- Creates a Chatwoot account via Platform API
- Saves integration to database with:
  - `type: 'CRM'`
  - `name: 'CHATVOXE'` (or manual Chatwoot setup)
  - `configuration.provider: 'CHATWOOT'`
  - `isActive: true`
- Integration stored in `Integration` table

**Key Function:** `getUserChatwootConfig(userId)` in `lib/integrations/crm-service.ts`
- Checks for active CRM integration with `provider === 'CHATWOOT'`
- Returns `null` if no active helpdesk found

### 2. Demo Creation Flow

**Location:** `app/api/demo/create/route.ts`

**Current State:**
- ✅ Checks tier limits via `canPerformAction(userId, 'create_demo')`
- ✅ Validates URL and input
- ✅ Creates Chatwoot inbox via `createWebsiteInbox()`
- ❌ **NO CHECK for helpdesk integration**
- Creates workflow record automatically as part of demo creation

**Dependencies:**
- Uses `getUserChatwootConfig(userId)` to get Chatwoot base URL (but doesn't require it)
- Falls back to `CHATWOOT_BASE_URL` env var if no user config

### 3. Agent Creation Flow

**Location:** `app/api/dashboard/integrations/chatwoot/create-user/route.ts`

**Current State:**
- ✅ Checks tier limits for max agents
- ✅ Validates input (name, password, email)
- ❌ **NO CHECK for helpdesk integration**
- Creates Chatwoot user via `createChatwootUser()` which internally uses `getUserChatwootConfig()`

**Note:** The `createChatwootUser()` function in `lib/chatwoot_helpdesk.ts` will fail if no helpdesk exists, but the error handling doesn't clearly indicate this requirement.

### 4. Workflow Creation Flow

**Current State:**
- Workflows are created **automatically** as part of demo creation (in `app/api/demo/create/route.ts`)
- No separate workflow creation endpoint for users
- Workflows are linked to demos via `demoId`

**Conclusion:** Since workflows are created with demos, enforcing helpdesk requirement on demo creation will automatically cover workflows.

### 5. User Tier System

**Location:** `prisma/schema.prisma`

**Tiers:**
- `FREE` - Free tier (should allow exploration without helpdesk)
- `STARTER` - Paid tier (requires helpdesk)
- `TEAM` - Paid tier (requires helpdesk)
- `BUSINESS` - Paid tier (requires helpdesk)
- `ENTERPRISE` - Paid tier (requires helpdesk)

**User Model Fields:**
- `subscriptionTier: SubscriptionTier` - Current tier
- `subscriptionStatus: SubscriptionStatus` - ACTIVE, EXPIRED, CANCELLED, SUSPENDED

### 6. Integration Model

**Location:** `prisma/schema.prisma`

**Integration Table:**
- `type: IntegrationType` - Can be 'CRM' (for helpdesk)
- `isActive: Boolean` - Whether integration is active
- `configuration: Json` - Contains:
  - `provider: 'CHATWOOT'` - For Chatwoot helpdesks
  - `baseUrl: string` - Chatwoot instance URL
  - `accountId: string` - Chatwoot account ID
  - `apiKey: string` - Encrypted API token
  - `voxeCreated: boolean` - Flag for Voxe-created helpdesks

**Query Pattern:**
```typescript
const integration = await prisma.integration.findFirst({
  where: {
    userId,
    type: 'CRM',
    isActive: true,
  },
});
```

---

## Implementation Plan

### Phase 1: Create Helper Function

**File:** `lib/usage-tracking.ts` (or create new `lib/helpdesk-validation.ts`)

**Function:** `hasActiveHelpdesk(userId: string): Promise<boolean>`

**Purpose:** Centralized function to check if user has active helpdesk integration.

**Implementation:**
```typescript
export async function hasActiveHelpdesk(userId: string): Promise<boolean> {
  try {
    const integration = await prisma!.integration.findFirst({
      where: {
        userId,
        type: 'CRM',
        isActive: true,
      },
    });
    
    if (!integration) {
      return false;
    }
    
    const config = integration.configuration as any;
    return config?.provider === 'CHATWOOT';
  } catch (error) {
    console.error('Error checking helpdesk:', error);
    return false;
  }
}
```

**Alternative:** Extend `canPerformAction()` to include helpdesk check for paid users.

---

### Phase 2: Update Demo Creation API

**File:** `app/api/demo/create/route.ts`

**Location:** After tier limit check (around line 117), before URL validation

**Implementation:**
```typescript
// After: const usageCheck = await canPerformAction(userId, 'create_demo');
// Add:

// Check if paid user requires helpdesk
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { subscriptionTier: true },
});

const userTier = user?.subscriptionTier || 'FREE';
const isPaidUser = userTier !== 'FREE';

if (isPaidUser) {
  const hasHelpdesk = await hasActiveHelpdesk(userId);
  if (!hasHelpdesk) {
    return NextResponse.json(
      {
        error: 'Helpdesk required',
        message: 'Paid customers must create or connect a helpdesk before creating demos. Please set up your helpdesk in the Integrations page.',
        helpdeskRequired: true,
        redirectTo: '/dashboard/integrations'
      },
      { status: 403 }
    );
  }
}
```

**Note:** This check should happen early, before any expensive operations (scraping, KB generation, etc.)

---

### Phase 3: Update Agent Creation API

**File:** `app/api/dashboard/integrations/chatwoot/create-user/route.ts`

**Location:** After session validation (around line 43), before tier limit check

**Implementation:**
```typescript
// After: if (!session?.user?.id) { ... }
// Add:

// Check if paid user requires helpdesk
const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { subscriptionTier: true },
});

const userTier = user?.subscriptionTier || 'FREE';
const isPaidUser = userTier !== 'FREE';

if (isPaidUser) {
  const hasHelpdesk = await hasActiveHelpdesk(session.user.id);
  if (!hasHelpdesk) {
    return NextResponse.json(
      {
        error: 'Helpdesk required',
        message: 'Paid customers must create or connect a helpdesk before creating agents. Please set up your helpdesk in the Integrations page.',
        helpdeskRequired: true,
        redirectTo: '/dashboard/integrations'
      },
      { status: 403 }
    );
  }
}
```

---

### Phase 4: Frontend Updates

#### 4.1 Demo Creation Page/Component

**Files to check:**
- `app/dashboard/demos/page.tsx` (if exists)
- Any component that calls `/api/demo/create`

**Implementation:**
- Handle `helpdeskRequired: true` error response
- Show user-friendly message with link to integrations page
- Optionally: Pre-check helpdesk status and show warning before submission

**Example:**
```typescript
try {
  const response = await fetch('/api/demo/create', { ... });
  const data = await response.json();
  
  if (!response.ok) {
    if (data.helpdeskRequired) {
      notifications.error(
        'Please set up your helpdesk first',
        {
          action: {
            label: 'Go to Integrations',
            onClick: () => router.push('/dashboard/integrations')
          }
        }
      );
      return;
    }
    // ... other error handling
  }
} catch (error) { ... }
```

#### 4.2 Agent Creation Component

**File:** `app/dashboard/integrations/page.tsx` (likely where agent creation UI is)

**Implementation:**
- Similar error handling as demo creation
- Show message: "Please set up your helpdesk before creating agents"
- Link to helpdesk setup section

#### 4.3 Dashboard Navigation

**Consideration:** Add visual indicator or badge on dashboard if paid user doesn't have helpdesk set up.

---

### Phase 5: Edge Cases & Considerations

#### 5.1 Free Users with Expired Trial

**Current Behavior:** Free users with expired trial are blocked from actions.

**Decision Needed:** Should expired free trial users be treated as:
- Free users (no helpdesk required)?
- Paid users (helpdesk required)?

**Recommendation:** Treat as free users (no helpdesk required) since they're not actually paying.

#### 5.2 Users Switching from Free to Paid

**Scenario:** User creates demos/agents while on free tier, then upgrades.

**Decision Needed:** Should existing demos/agents/workflows be:
- Grandfathered in (allowed to continue)?
- Require helpdesk setup to continue using?

**Recommendation:** Grandfather existing resources, but require helpdesk for new creations.

#### 5.3 Helpdesk Deactivation

**Scenario:** Paid user deactivates their helpdesk integration.

**Decision Needed:** Should existing demos/agents/workflows be:
- Allowed to continue running?
- Paused/blocked until helpdesk is reactivated?

**Recommendation:** Allow existing resources to continue, but block new creations.

#### 5.4 Multiple Helpdesk Integrations

**Current Behavior:** System allows only one active CRM integration at a time (enforced in `deactivateAllActiveHelpdeskIntegrations()`).

**Impact:** No change needed - the check for "has active helpdesk" will work correctly.

---

## Testing Plan

### Unit Tests

1. **Helper Function:**
   - Test `hasActiveHelpdesk()` with:
     - User with active helpdesk → `true`
     - User with inactive helpdesk → `false`
     - User with no helpdesk → `false`
     - User with non-Chatwoot CRM → `false`

2. **API Endpoints:**
   - Test demo creation with paid user + no helpdesk → `403` error
   - Test demo creation with paid user + active helpdesk → success
   - Test demo creation with free user + no helpdesk → success
   - Similar tests for agent creation

### Integration Tests

1. **End-to-End Flow:**
   - Paid user tries to create demo without helpdesk → blocked
   - Paid user creates helpdesk → success
   - Paid user creates demo → success
   - Free user creates demo without helpdesk → success

2. **Edge Cases:**
   - User upgrades from free to paid → existing demos work, new ones require helpdesk
   - User deactivates helpdesk → existing demos work, new ones blocked

---

## Migration Strategy

### For Existing Paid Users

**Scenario:** Paid users who already have demos/agents but no helpdesk.

**Options:**
1. **Grandfather:** Allow them to continue, but require helpdesk for new creations
2. **Enforce:** Require helpdesk setup before any further actions

**Recommendation:** Grandfather approach (Option 1) for better UX.

**Implementation:**
- Check only applies to **new** creations
- Existing resources continue to work
- Show notification/banner encouraging helpdesk setup

---

## Rollout Plan

### Phase 1: Backend Implementation (Week 1)
- ✅ Create helper function
- ✅ Update demo creation API
- ✅ Update agent creation API
- ✅ Add unit tests

### Phase 2: Frontend Updates (Week 1-2)
- ✅ Update error handling in demo creation UI
- ✅ Update error handling in agent creation UI
- ✅ Add helpful messaging and redirects

### Phase 3: Testing & Refinement (Week 2)
- ✅ Integration testing
- ✅ Edge case testing
- ✅ User acceptance testing

### Phase 4: Documentation (Week 2)
- ✅ Update user documentation
- ✅ Update API documentation
- ✅ Add inline code comments

### Phase 5: Deployment (Week 3)
- ✅ Deploy to staging
- ✅ Monitor for issues
- ✅ Deploy to production
- ✅ Monitor metrics

---

## Success Metrics

1. **Compliance:** 100% of new demos/agents created by paid users have associated helpdesk
2. **User Experience:** Clear error messages with actionable guidance
3. **Support Tickets:** Reduction in "why can't I create X" tickets
4. **Helpdesk Adoption:** Increase in helpdesk setup rate among paid users

---

## Open Questions

1. **Should workflows have a separate check?** (Currently created with demos, so probably not needed)
2. **What about knowledge bases?** (Not mentioned in requirement, but consider if needed)
3. **Should there be a grace period?** (e.g., 7 days after upgrade to set up helpdesk)
4. **What about API access?** (Should API endpoints also enforce this?)

---

## Code Locations Summary

| Component | File Path | Line Range |
|-----------|-----------|------------|
| Helpdesk Creation | `app/api/helpdesk/create-voxe-helpdesk/route.ts` | 27-552 |
| Demo Creation | `app/api/demo/create/route.ts` | 89-578 |
| Agent Creation | `app/api/dashboard/integrations/chatwoot/create-user/route.ts` | 8-189 |
| Helpdesk Check Helper | `lib/integrations/crm-service.ts` | 233-331 |
| Usage Tracking | `lib/usage-tracking.ts` | 208-299 |
| User Model | `prisma/schema.prisma` | 11-53 |
| Integration Model | `prisma/schema.prisma` | 185-204 |
| Dashboard Integrations Page | `app/dashboard/integrations/page.tsx` | 31-827 |

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Clarify edge cases** (expired trials, upgrades, deactivations)
3. **Decide on grandfathering** approach
4. **Create implementation tickets** based on phases above
5. **Begin Phase 1 implementation**

---

**Document Version:** 1.0  
**Last Updated:** [Current Date]  
**Author:** AI Assistant  
**Status:** Draft - Awaiting Review

