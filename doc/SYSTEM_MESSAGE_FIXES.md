# System Message Dynamic Generation Fixes

## Issues Fixed

### 1. Conditional Core Role Text
**Problem**: The `core_role` section always mentioned the "Retrieve Knowledge Base Context" tool even when KB was disabled.

**Clarification**: 
- **Business Knowledge** = Information scraped from user's website, ALWAYS included in system message (editable section)
- **Knowledge Base** = Documents uploaded by user, accessed via RAG tool (only when KB is enabled)

**Solution**: 
- Added `{{KB_TOOL_TEXT}}` placeholder in the template
- Updated `generateDynamicSystemMessage` to conditionally include KB tool mention only when `features.hasKnowledgeBase === true`
- Business Knowledge is ALWAYS mentioned (it's always in the system message)

**Result**: 
- When KB is enabled: "Use the provided system message Business Knowledge and, when appropriate, the 'Retrieve Knowledge Base Context' tool to answer questions accurately."
- When KB is disabled: "Use the provided system message Business Knowledge to answer questions accurately." (no KB tool mention)

### 2. Dynamic Section Filtering
**Problem**: Sections were not being properly filtered based on enabled features.

**Solution**: 
- `kb_usage` section is excluded when `hasKnowledgeBase === false`
- `calendar_booking` section is excluded when `hasCalendar === false`
- All other sections are always included

### 3. n8n Workflow Update
**Problem**: System messages were not being updated in n8n workflows when features changed.

**Solution**:
- Added `regenerateSystemMessageForWorkflow()` function that:
  1. Detects current features
  2. Generates dynamic message
  3. Updates database
  4. Updates file system
  5. **Updates n8n workflow** via `updateN8nWorkflowSystemMessage()`

### 4. Website Links Preservation
**Problem**: Website links section was lost during regeneration.

**Solution**: 
- Added logic to preserve website links section from existing content during regeneration
- Website links are injected after Business Knowledge section

### 5. Enhanced Logging
**Problem**: Difficult to debug when system messages weren't updating correctly.

**Solution**:
- Added detailed logging in `regenerateSystemMessageForWorkflow()`:
  - Feature detection results
  - Message length and preview
  - n8n update success/failure
  - Error details

## System Message Scenarios

The system now correctly generates messages for 4 scenarios:

### 1. KB Enabled + Calendar Enabled
- Includes: `core_role` (with KB mention), `kb_usage`, `calendar_booking`, all other sections

### 2. KB Disabled + Calendar Enabled  
- Includes: `core_role` (without KB mention), `calendar_booking`, all other sections
- Excludes: `kb_usage`

### 3. KB Enabled + Calendar Disabled
- Includes: `core_role` (with KB mention), `kb_usage`, all other sections
- Excludes: `calendar_booking`

### 4. KB Disabled + Calendar Disabled
- Includes: `core_role` (without KB mention), all other sections
- Excludes: `kb_usage`, `calendar_booking`

## Regeneration Triggers

System messages are automatically regenerated when:

1. **KB is linked to workflow**: `app/api/dashboard/knowledge-bases/[id]/link-workflow/route.ts`
2. **KB is unlinked from workflow**: `app/api/dashboard/knowledge-bases/[id]/unlink-workflow/route.ts`
3. **Calendar integration is enabled**: `app/api/dashboard/integrations/calendar/google/callback/route.ts`
4. **Calendar integration is toggled**: `app/api/dashboard/integrations/[id]/route.ts`
5. **System message is manually edited**: `app/api/dashboard/system-messages/[messageId]/route.ts`

## Testing

To test the fixes:

1. **Create a demo** - System message should be generated with correct features
2. **Link a KB** - System message should regenerate and include KB section
3. **Unlink KB** - System message should regenerate and remove KB section
4. **Enable Calendar** - System message should regenerate and include Calendar section
5. **Disable Calendar** - System message should regenerate and remove Calendar section
6. **Check n8n workflow** - System message in AI Agent node should match the generated message

## Debugging

If system messages aren't updating in n8n:

1. Check server logs for:
   - `✅ System message regenerated for workflow...`
   - `🔄 Updating n8n workflow...`
   - `✅ Successfully updated n8n workflow...`

2. Verify n8n API configuration:
   - `N8N_BASE_URL` is set correctly
   - `N8N_API_KEY` is valid
   - n8n workflow ID exists

3. Check n8n workflow structure:
   - AI Agent node exists with name "AI Agent"
   - System message is in `parameters.options.systemMessage`

## Files Modified

- `data/templates/n8n_System_Message.md` - Added conditional text placeholder
- `lib/system-message-sections.ts` - Added conditional text replacement logic
- `lib/system-message-regenerate.ts` - Added website links preservation and enhanced logging
- `lib/system-message-features.ts` - Feature detection (already existed)
- `lib/n8n-api.ts` - n8n workflow update (already existed)

