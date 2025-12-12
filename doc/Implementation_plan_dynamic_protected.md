## Implementation plan: dynamic and protected system messages

## Architecture overview

### Current flow
1. Template → Demo-specific message (with KB merged)
2. User edits → Saved to DB and file
3. Update n8n → Full message sent to workflow

### New flow
1. Template → Structured sections (protected + editable)
2. Feature detection → Include/exclude sections dynamically
3. User edits → Only editable sections
4. Merge & validate → Combine sections safely
5. Update n8n → Final dynamic message sent

---

## Part 1: Dynamic system message generation

### 1.1 Section-based template structure

Instead of a single markdown file, use a structured template with identifiable sections:

```markdown
# ${businessName} – Chat Platform System Message

[PROTECTED_START:core_role]
You are a **customer assistant for ${businessName}**.
Use the provided system message Business Knowledge...
[PROTECTED_END:core_role]

[PROTECTED_START:kb_usage]
## Knowledge Base Usage Guidelines
**1. When to Use the Knowledge Base**
- First, check if the answer exists...
[PROTECTED_END:kb_usage]

[PROTECTED_START:calendar_booking]
## Calendar Booking
You have access to two tools: 
1) Get available time slots 
2) Book calendar events
[PROTECTED_END:calendar_booking]

[EDITABLE_START:business_knowledge]
## Business Knowledge
*(Automatically generated section — do not edit manually.)*
[EDITABLE_END:business_knowledge]

[PROTECTED_START:escalation_rules]
## AI to Human Escalation Rules
[PROTECTED_END:escalation_rules]

[PROTECTED_START:output_format]
## Output Format
**Normal case (confidence ≥ 0.85):**
```json
{
  "output": "..."
}
```
[PROTECTED_END:output_format]
```

### 1.2 Feature detection system

Create a function to detect enabled features for a workflow:

```typescript
interface WorkflowFeatures {
  hasKnowledgeBase: boolean;
  hasCalendar: boolean;
  // Future: hasCRM, hasDatabase, etc.
}

async function detectWorkflowFeatures(workflowId: string): Promise<WorkflowFeatures> {
  // Check if workflow has linked KBs
  const kbLinks = await prisma.workflowKnowledgeBase.findMany({
    where: { workflowId, isActive: true }
  });
  
  // Check if user has active calendar integration
  const calendarIntegration = await prisma.integration.findFirst({
    where: { 
      userId: workflow.userId,
      type: 'CALENDAR',
      isActive: true 
    }
  });
  
  return {
    hasKnowledgeBase: kbLinks.length > 0,
    hasCalendar: !!calendarIntegration
  };
}
```

### 1.3 Dynamic message generator

Function to build the final message from sections:

```typescript
function generateDynamicSystemMessage(
  template: string,
  features: WorkflowFeatures,
  editableContent: Record<string, string>
): string {
  // Parse template into sections
  const sections = parseTemplateSections(template);
  
  // Filter sections based on features
  const includedSections = sections.filter(section => {
    if (section.id === 'kb_usage' && !features.hasKnowledgeBase) return false;
    if (section.id === 'calendar_booking' && !features.hasCalendar) return false;
    return true; // Include all other sections
  });
  
  // Replace editable sections with user content
  includedSections.forEach(section => {
    if (section.type === 'EDITABLE' && editableContent[section.id]) {
      section.content = editableContent[section.id];
    }
  });
  
  // Combine sections back into final message
  return combineSections(includedSections);
}
```

### 1.4 Update points

1. When KB is linked/unlinked:
   - Regenerate system message with updated features
   - Update n8n workflow

2. When Calendar is enabled/disabled:
   - Regenerate system message with updated features
   - Update n8n workflow

3. When system message is viewed/edited:
   - Always generate dynamically based on current features

---

## Part 2: Protected vs editable sections

### 2.1 Database schema changes

Extend `SystemMessage` model:

```prisma
model SystemMessage {
  id        String   @id @default(cuid())
  demoId    String   @unique
  content   String   // Full generated message (for n8n)
  sections  Json?    // Structured sections for editing
  // New fields:
  editableContent Json?  // Only editable sections
  version   Int      @default(1)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Structure for `editableContent`:
```json
{
  "business_knowledge": "...",
  "tone_style": "...",
  "faqs": "...",
  "custom_instructions": "..."
}
```

### 2.2 Template parser

Function to parse template into structured sections:

```typescript
interface SystemMessageSection {
  id: string;
  type: 'PROTECTED' | 'EDITABLE';
  content: string;
  order: number;
}

function parseTemplateSections(template: string): SystemMessageSection[] {
  const sections: SystemMessageSection[] = [];
  const regex = /\[(PROTECTED|EDITABLE)_START:(\w+)\]([\s\S]*?)\[(PROTECTED|EDITABLE)_END:\2\]/g;
  
  let match;
  let order = 0;
  
  while ((match = regex.exec(template)) !== null) {
    sections.push({
      id: match[2],
      type: match[1] as 'PROTECTED' | 'EDITABLE',
      content: match[3].trim(),
      order: order++
    });
  }
  
  return sections;
}
```

### 2.3 Section validation

When saving, validate editable sections:

```typescript
function validateEditableSection(sectionId: string, content: string): ValidationResult {
  // Check for forbidden patterns that might break functionality
  const forbiddenPatterns = [
    /```json\s*\{[\s\S]*"output"[\s\S]*\}/,  // JSON format rules
    /calendar.*tool/i,  // Calendar tool references
    /knowledge.*base.*tool/i,  // KB tool references
    /escalation.*rules/i,  // Escalation rules
  ];
  
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      return {
        valid: false,
        error: `Section contains protected content that cannot be modified`
      };
    }
  }
  
  return { valid: true };
}
```

---

## Part 3: UI implementation

### 3.1 System message editor component

Structure:

```
SystemMessageEditor
├── ProtectedSection (read-only, collapsible)
│   ├── Core Role Instructions
│   ├── Knowledge Base Usage (if KB enabled)
│   ├── Calendar Booking (if Calendar enabled)
│   ├── Escalation Rules
│   └── Output Format
│
└── EditableSection (editable)
    ├── Business Knowledge
    ├── Tone & Style
    ├── FAQs
    └── Custom Instructions
```

### 3.2 Protected section component

```typescript
<ProtectedSection 
  title="Calendar Booking"
  visible={features.hasCalendar}
  content={protectedSections.calendar_booking}
  locked={true}
/>
```

- Read-only display
- Collapsible
- Lock icon indicator
- Tooltip explaining why it's protected

### 3.3 Editable section component

```typescript
<EditableSection
  id="business_knowledge"
  title="Business Knowledge"
  content={editableContent.business_knowledge}
  onChange={(content) => updateEditableSection('business_knowledge', content)}
  validation={validateEditableSection}
/>
```

- Markdown editor (or rich text)
- Real-time validation
- Save/cancel buttons
- Character count

### 3.4 Preview mode

Show the final generated message:
- Combines protected + editable sections
- Shows what will be sent to n8n
- Updates in real-time as user edits

---

## Part 4: API changes

### 4.1 Get system message endpoint

Update: `GET /api/dashboard/system-messages/[messageId]`

Response structure:
```json
{
  "id": "...",
  "demoId": "...",
  "features": {
    "hasKnowledgeBase": true,
    "hasCalendar": false
  },
  "protectedSections": {
    "core_role": "...",
    "kb_usage": "...",
    "calendar_booking": null,  // null if feature not enabled
    "escalation_rules": "...",
    "output_format": "..."
  },
  "editableSections": {
    "business_knowledge": "...",
    "tone_style": "...",
    "faqs": "..."
  },
  "preview": "..."  // Full generated message
}
```

### 4.2 Update system message endpoint

Update: `PUT /api/dashboard/system-messages/[messageId]`

Request structure:
```json
{
  "editableContent": {
    "business_knowledge": "...",
    "tone_style": "...",
    "faqs": "..."
  }
}
```

Process:
1. Validate editable sections
2. Detect current features
3. Generate dynamic message
4. Save to database
5. Update n8n workflow

### 4.3 Auto-regeneration hooks

Add hooks to regenerate when features change:

1. KB linked/unlinked:
   ```typescript
   // In link-workflow route
   await regenerateSystemMessage(workflowId);
   ```

2. Calendar enabled/disabled:
   ```typescript
   // In calendar toggle route
   await regenerateSystemMessageForUser(userId);
   ```

---

## Part 5: Implementation steps

### Phase 1: Template restructuring
1. Update `data/templates/n8n_System_Message.md` with section markers
2. Create parser to extract sections
3. Test parsing logic

### Phase 2: Feature detection
1. Create `detectWorkflowFeatures()` function
2. Test with various feature combinations
3. Add caching if needed

### Phase 3: Dynamic generation
1. Create `generateDynamicSystemMessage()` function
2. Update demo creation to use dynamic generation
3. Test with different feature combinations

### Phase 4: Database schema
1. Add `editableContent` field to `SystemMessage`
2. Migration script
3. Update existing records

### Phase 5: API updates
1. Update GET endpoint to return structured sections
2. Update PUT endpoint to accept only editable content
3. Add validation
4. Add auto-regeneration hooks

### Phase 6: UI implementation
1. Create `SystemMessageEditor` component
2. Create `ProtectedSection` component
3. Create `EditableSection` component
4. Add preview mode
5. Update existing system message page

### Phase 7: Integration
1. Update n8n workflow update to use dynamic message
2. Add regeneration on feature changes
3. Test end-to-end flow

---

## Part 6: Edge cases and considerations

### 6.1 Backward compatibility
- Existing system messages without sections should still work
- Migration script to convert old format to new format
- Fallback to full message if parsing fails

### 6.2 Version control
- Track changes to editable sections
- Allow rollback to previous versions
- Show diff between versions

### 6.3 Performance
- Cache generated messages
- Regenerate only when features change
- Lazy load sections in UI

### 6.4 Security
- Server-side validation of editable content
- Prevent injection of protected markers
- Sanitize user input

### 6.5 User experience
- Clear indicators for protected vs editable
- Helpful tooltips explaining why sections are protected
- Preview before saving
- Undo/redo for edits

---

## Part 7: Future extensibility

This structure supports:
- Adding new protected sections (e.g., CRM, Database)
- Adding new editable sections (e.g., Custom Prompts, Brand Voice)
- Feature flags for experimental sections
- A/B testing different message structures
- Multi-language support per section

---

## Summary

1. Template structure: Mark sections as PROTECTED or EDITABLE with markers
2. Feature detection: Check enabled features (KB, Calendar) per workflow
3. Dynamic generation: Include/exclude sections based on features
4. Protected editing: Only allow editing of safe sections
5. Validation: Prevent breaking changes in editable sections
6. Auto-regeneration: Update message when features change
7. UI: Clear separation between protected and editable sections

This keeps functionality intact while allowing customization of business content.