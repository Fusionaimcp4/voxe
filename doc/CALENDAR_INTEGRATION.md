# Calendar Integration Documentation

## Overview

Voxe's Calendar Integration allows AI agents to automatically check availability and book meetings directly from chat conversations. The integration supports Google Calendar and enables seamless scheduling without manual intervention.

## Key Capabilities

- **Automatic Availability Checking**: AI can query available time slots based on configured business hours, holidays, and existing calendar events
- **One-Click Meeting Booking**: Users can book meetings directly from chat by selecting from available time slots
- **Smart Scheduling Rules**: Configurable business hours, closed days, holidays, and booking limits
- **Google Meet Integration**: Automatically add Google Meet video conference links to booked events
- **Multi-Attendee Support**: Book meetings with multiple attendees
- **Timezone Awareness**: Full timezone support for accurate scheduling across regions

## Use Cases

### 1. Sales & Demos
- **Scenario**: Customer wants to book a product demo
- **Flow**: 
  1. Customer asks: "Can I schedule a demo?"
  2. AI checks available slots using "Get available time slots"
  3. AI presents 3-5 options to the customer
  4. Customer selects a time
  5. AI books the meeting using "Book calendar events"
  6. Customer receives calendar invite with Google Meet link

### 2. Support Callbacks
- **Scenario**: User needs technical support and wants a callback
- **Flow**:
  1. User requests: "I need help with API integration"
  2. AI offers: "I can schedule a technical support call. When works for you?"
  3. AI shows available slots
  4. User selects time
  5. Meeting is booked and assigned to "technical support / devops" team

### 3. Consultation Scheduling
- **Scenario**: Potential customer wants to discuss pricing/features
- **Flow**:
  1. Customer asks about enterprise pricing
  2. AI suggests: "Would you like to schedule a consultation with our sales team?"
  3. AI shows available consultation slots
  4. Customer books meeting
  5. Meeting assigned to "sales & partnerships" team

### 4. Rescheduling
- **Scenario**: Customer needs to change an existing appointment
- **Flow**:
  1. Customer: "I need to reschedule my demo"
  2. AI: "No problem! Let me show you new available times"
  3. AI fetches fresh availability
  4. Customer selects new time
  5. New meeting is booked

## Architecture

### Components

1. **Frontend (CalendarConfigModal)**
   - Connection UI for Google Calendar OAuth
   - Scheduling settings configuration
   - Integration status display

2. **Backend APIs**
   - `/api/dashboard/integrations/calendar` - Get calendar status
   - `/api/dashboard/integrations/calendar/google/connect` - Initiate OAuth
   - `/api/dashboard/integrations/calendar/google/callback` - Handle OAuth callback
   - `/api/dashboard/integrations/calendar/scheduling-settings` - Save scheduling configuration
   - `/api/dashboard/integrations/calendar/toggle-nodes` - Enable/disable calendar nodes in workflows

3. **Internal APIs (for n8n)**
   - `/api/internal/calendar/get-slots` - Get available time slots
   - `/api/internal/calendar/book-event` - Book a calendar event

4. **n8n Workflow Integration**
   - "Get available time slots" HTTP Request Tool node
   - "Book calendar events" HTTP Request Tool node
   - Automatic node enable/disable based on integration status

### Data Flow

```
User Chat Request
    ↓
AI Agent (n8n)
    ↓
"Get available time slots" Tool
    ↓
POST /api/internal/calendar/get-slots
    ↓
Voxe Backend:
  - Authenticates via workflowId
  - Loads user's calendar integration
  - Decrypts OAuth tokens
  - Calls Google Calendar freeBusy API
  - Applies scheduling rules (business hours, holidays, etc.)
  - Returns available slots
    ↓
AI Agent presents slots to user
    ↓
User selects slot
    ↓
"Book calendar events" Tool
    ↓
POST /api/internal/calendar/book-event
    ↓
Voxe Backend:
  - Validates input
  - Creates Google Calendar event
  - Adds Google Meet link (optional)
  - Adds attendees (optional)
  - Returns event details
    ↓
AI Agent confirms booking
```

## Setup & Configuration

### Step 1: Connect Google Calendar

1. Navigate to **Dashboard → Integrations**
2. Find **Calendar Integration** tile
3. Click **Add Integration** or **Configure** (if already exists)
4. Click **Connect Google Calendar**

#### Option A: Using System Credentials
- If `GOOGLE_CALENDAR_CLIENT_ID` and `GOOGLE_CALENDAR_CLIENT_SECRET` are set in environment variables, OAuth flow starts immediately

#### Option B: Using Your Own Credentials
- Enter your Google OAuth Client ID and Client Secret
- Add redirect URI to Google Cloud Console:
  ```
  http://localhost:3000/api/dashboard/integrations/calendar/google/callback
  ```
  (For production, use your actual domain)
- Click **Save & Connect**

5. Complete Google OAuth flow
6. Calendar is now connected

### Step 2: Configure Scheduling Settings

1. In Calendar Integration modal, click **Scheduling Configuration** tab
2. Configure the following settings:

#### Basic Settings
- **Timezone**: IANA timezone identifier (e.g., `America/Chicago`, `Europe/London`)
- **Days Ahead**: How many days in advance to show slots (1-90, default: 14)
- **Slot Duration**: Length of each meeting slot in minutes (15-480, default: 30)
- **Slot Interval**: Minutes between slot start times (15-480, default: 30)
- **Max Slots**: Maximum number of slots to return (1-20, default: 3)
- **Skip Past Time Today**: Don't show slots that have already passed today (default: true)

#### Business Hours
Configure available hours for each day of the week:
- **Monday - Sunday**: Set start and end times (e.g., 09:00 - 17:00)
- Times are in 24-hour format (HH:MM)

#### Closed Days
Select days when no meetings should be scheduled:
- Click day buttons to toggle (e.g., Saturday, Sunday)
- Selected days appear in red

#### Holiday Dates
Add specific dates when no meetings should be scheduled:
- One date per line
- Format: `YYYY-MM-DD` (e.g., `2024-12-25`, `2025-01-01`)

#### Booking Limits
- **Buffer Minutes Between Meetings**: Minimum gap between consecutive meetings (0-120, default: 15)
- **Max Bookings Per Day**: Maximum meetings per day (1-100, default: 10)
- **Max Bookings Per Week**: Maximum meetings per week (1-500, default: 40)

3. Click **Save Settings**
4. Settings are automatically synced to all your n8n workflows

### Step 3: Enable Chat Scheduling

1. In Calendar Integration modal, toggle **Enable Chat Scheduling** to ON
2. AI agents can now use calendar tools in conversations

## Scheduling Settings Reference

### Default Configuration

```json
{
  "timezone": "America/Chicago",
  "daysAhead": 14,
  "slotDurationMinutes": 30,
  "slotInterval": 30,
  "maxSlots": 3,
  "skipPastTimeToday": true,
  "businessHours": {
    "mon": ["09:00", "17:00"],
    "tue": ["09:00", "17:00"],
    "wed": ["09:00", "17:00"],
    "thu": ["09:00", "17:00"],
    "fri": ["09:00", "17:00"]
  },
  "closedDays": ["sat", "sun"],
  "holidayDates": [],
  "bufferMinutesBetweenMeetings": 15,
  "maxBookingsPerDay": 10,
  "maxBookingsPerWeek": 40
}
```

### Business Hours Format

- **Format**: `["HH:MM", "HH:MM"]` where first value is start time, second is end time
- **Example**: `["09:00", "17:00"]` means 9:00 AM to 5:00 PM
- **24-hour format**: Use 24-hour time (e.g., `14:30` for 2:30 PM)

### Closed Days Format

- **Values**: `["mon", "tue", "wed", "thu", "fri", "sat", "sun"]`
- **Example**: `["sat", "sun"]` means weekends are closed

### Holiday Dates Format

- **Format**: ISO 8601 date strings (`YYYY-MM-DD`)
- **Example**: `["2024-12-25", "2025-01-01"]`
- One date per line in the UI

## API Reference

### Internal APIs (for n8n workflows)

#### GET Available Time Slots

**Endpoint**: `POST /api/internal/calendar/get-slots`

**Authentication**: 
- Via `workflowId` (n8n automatically includes this)
- Or via session (for direct API calls)

**Request Body**:
```json
{
  "workflowId": "{{ $workflow.id }}",
  "timezone": "America/Chicago",
  "daysAhead": 14,
  "slotDurationMinutes": 30,
  "slotInterval": 30,
  "maxSlots": 3,
  "skipPastTimeToday": true,
  "businessHours": {
    "mon": ["09:00", "17:00"],
    "tue": ["09:00", "17:00"],
    "wed": ["09:00", "17:00"],
    "thu": ["09:00", "17:00"],
    "fri": ["09:00", "17:00"]
  },
  "closedDays": ["sat", "sun"],
  "holidayDates": [],
  "bufferMinutesBetweenMeetings": 15,
  "maxBookingsPerDay": 10,
  "maxBookingsPerWeek": 40
}
```

**Response**:
```json
{
  "slots": [
    {
      "start": "2025-01-15T14:00:00Z",
      "end": "2025-01-15T14:30:00Z"
    },
    {
      "start": "2025-01-15T15:00:00Z",
      "end": "2025-01-15T15:30:00Z"
    }
  ]
}
```

**Note**: Most parameters are optional and will use values from your scheduling settings configuration if not provided.

#### Book Calendar Event

**Endpoint**: `POST /api/internal/calendar/book-event`

**Authentication**: 
- Via `workflowId` (n8n automatically includes this)
- Or via session (for direct API calls)

**Request Body** (Nested Format):
```json
{
  "workflowId": "{{ $workflow.id }}",
  "slot": {
    "start": "2025-01-15T14:00:00Z",
    "end": "2025-01-15T14:30:00Z"
  },
  "title": "Consultation with John Doe",
  "description": "Product demo and pricing discussion",
  "attendees": ["john@example.com", "sales@company.com"],
  "addMeetLink": true
}
```

**Request Body** (Flat Format - also supported):
```json
{
  "workflowId": "{{ $workflow.id }}",
  "start": "2025-01-15T14:00:00Z",
  "end": "2025-01-15T14:30:00Z",
  "title": "Consultation with John Doe",
  "description": "Product demo and pricing discussion",
  "attendees": ["john@example.com"],
  "addMeetLink": true
}
```

**Response**:
```json
{
  "eventId": "abc123xyz",
  "htmlLink": "https://calendar.google.com/calendar/event?eid=...",
  "start": "2025-01-15T14:00:00Z",
  "end": "2025-01-15T14:30:00Z",
  "meetLink": "https://meet.google.com/xxx-yyyy-zzz"
}
```

**Parameters**:
- `workflowId` (required): n8n workflow ID
- `slot.start` or `start` (required): Start time in ISO 8601 format
- `slot.end` or `end` (required): End time in ISO 8601 format
- `title` (required): Meeting title/summary
- `description` (optional): Meeting description (defaults to "Booked from Voxe")
- `attendees` (optional): Array of email addresses (can be empty array `[]`)
- `addMeetLink` (optional): Boolean to add Google Meet link (defaults to `true`)

## n8n Workflow Configuration

### Node Setup

The calendar integration uses two HTTP Request Tool nodes in n8n:

1. **"Get available time slots"**
   - Type: `n8n-nodes-base.httpRequestTool`
   - Method: POST
   - URL: `{baseUrl}/api/internal/calendar/get-slots`
   - Body: JSON with scheduling parameters

2. **"Book calendar events"**
   - Type: `n8n-nodes-base.httpRequestTool`
   - Method: POST
   - URL: `{baseUrl}/api/internal/calendar/book-event`
   - Body: JSON with slot, title, description, attendees, addMeetLink

### Automatic Configuration

When you save scheduling settings, Voxe automatically:
1. Updates all your n8n workflows
2. Configures the calendar nodes with your settings
3. Sets the correct API URLs
4. Syncs scheduling parameters to the JSON body

### Node Enable/Disable

Calendar nodes are automatically:
- **Enabled** when calendar integration is connected/activated
- **Disabled** when calendar integration is disconnected/deactivated

This prevents errors when calendar is not available.

## System Message Integration

The AI Agent's system message includes instructions for using calendar tools:

```
## Calendar Booking Tools (IMPORTANT)

**Get available time slots**
- Use when user wants to book a call, schedule a meeting, book a demo, reschedule
- Returns list of time slots (start/end)
- Present 3–5 options clearly and ask user to pick one

**Book calendar events**
- Use after user chooses a time and provides name/email
- Must pass: start, end, title, description, attendees, addMeetLink
- Confirms booking and returns event details
- Always reply with confirmation and assign correct team
```

## Security & Privacy

### OAuth Token Storage
- OAuth tokens (access_token, refresh_token) are encrypted using AES-256-GCM
- Stored in the `Integration` table with encryption
- Tokens are automatically refreshed when expired

### Authentication
- Internal APIs authenticate via `workflowId` lookup
- No API keys required for n8n workflows
- Session-based auth available for direct API calls

### Data Privacy
- Calendar data is only accessed to check availability and book events
- No calendar data is stored permanently in Voxe
- All API calls are logged for debugging but don't expose sensitive data

## Troubleshooting

### Calendar Not Connecting

**Issue**: OAuth flow fails or redirects to error page

**Solutions**:
1. Verify redirect URI in Google Cloud Console matches exactly:
   - Development: `http://localhost:3000/api/dashboard/integrations/calendar/google/callback`
   - Production: `https://yourdomain.com/api/dashboard/integrations/calendar/google/callback`
2. Check that Google Calendar API is enabled in Google Cloud Console
3. Verify OAuth credentials (Client ID and Client Secret) are correct
4. Ensure scopes include: `calendar.readonly`, `calendar.events`, `userinfo.email`, `userinfo.profile`

### "Calendar integration not found" Error

**Issue**: API returns 404 when trying to get slots or book events

**Solutions**:
1. Verify calendar integration is connected and active
2. Check integration status in Dashboard → Integrations
3. Ensure `isActive: true` in integration settings
4. Reconnect calendar if needed

### "Google Calendar API has not been used in project" Error

**Issue**: 403 error when calling Google Calendar API

**Solutions**:
1. Enable Google Calendar API in Google Cloud Console:
   - Go to: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com
   - Click "Enable"
2. Wait a few minutes for API to activate
3. Retry the operation

### AI Agent Not Using Calendar Tools

**Issue**: AI doesn't suggest booking or check availability

**Solutions**:
1. Verify "Enable Chat Scheduling" toggle is ON
2. Check system message includes calendar tool instructions
3. Ensure calendar nodes are enabled in n8n workflow
4. Verify nodes are connected to AI Agent as tools

### Schema Validation Error

**Issue**: "Received tool input did not match expected schema"

**Solutions**:
1. This should not occur - calendar nodes don't use explicit toolParameters
2. If error persists, verify workflow was updated correctly
3. Check that JSON body expressions use correct format: `={{ $json.param }}`
4. Ensure AI Agent is passing parameters correctly

### No Available Slots Returned

**Issue**: get-slots returns empty array

**Solutions**:
1. Check business hours configuration
2. Verify timezone is correct
3. Check if all days are marked as closed
4. Verify calendar has free time in the configured date range
5. Check buffer minutes and booking limits aren't too restrictive

### Booking Fails with 400 Error

**Issue**: book-event returns 400 Bad Request

**Solutions**:
1. Verify `start` and `end` are valid ISO 8601 dates
2. Check that `end` is after `start`
3. Ensure `title` is provided
4. Verify `attendees` is an array (can be empty `[]`)
5. Check date format: `2025-01-15T14:00:00Z` (not `2025-01-15 14:00:00`)

## Best Practices

### Scheduling Configuration

1. **Business Hours**: Set realistic hours based on your availability
2. **Buffer Time**: Include buffer between meetings to prevent back-to-back scheduling
3. **Max Slots**: Return 3-5 slots for best user experience (not too many, not too few)
4. **Holidays**: Keep holiday list updated to avoid booking on closed days
5. **Timezone**: Always use IANA timezone identifiers (not abbreviations like "EST")

### AI Agent Behavior

1. **Always Present Options**: Show 3-5 time slots, not just one
2. **Clear Formatting**: Display times in user-friendly format (e.g., "Tuesday, Jan 15 at 2:00 PM")
3. **Confirmation**: Always confirm booking with event details
4. **Team Assignment**: Assign to appropriate team after booking (sales, support, etc.)
5. **Error Handling**: If booking fails, offer to try again or escalate to human

### Workflow Design

1. **Tool Order**: Use "Get available time slots" before "Book calendar events"
2. **Error Handling**: Handle cases where no slots are available
3. **User Input**: Collect user's email before booking if not already available
4. **Confirmation**: Always confirm booking details before finalizing

## Limitations

1. **Google Calendar Only**: Currently supports Google Calendar only (Outlook coming soon)
2. **Single Calendar**: Uses primary calendar only (calendar selection coming soon)
3. **No Recurring Events**: Cannot book recurring meetings (single events only)
4. **No Event Updates**: Cannot modify or cancel existing events (create only)
5. **Timezone**: Uses calendar owner's timezone (multi-timezone support coming soon)

## Future Enhancements

- Microsoft Outlook/Exchange support
- Multiple calendar selection
- Recurring event support
- Event modification and cancellation
- Multi-timezone scheduling
- Calendar conflict detection
- Custom meeting templates
- Automated reminders
- Integration with other calendar providers (iCal, CalDAV)

## Support

For issues or questions:
1. Check this documentation
2. Review troubleshooting section
3. Check n8n workflow logs
4. Review Voxe backend logs
5. Contact support with:
   - Workflow ID
   - Error messages
   - Steps to reproduce
   - Calendar integration status

## Changelog

### Version 1.0 (Current)
- Initial Google Calendar integration
- OAuth authentication
- Basic scheduling with business hours
- Holiday and closed day support
- Google Meet link integration
- Multi-attendee support
- Automatic node enable/disable
- Scheduling settings configuration UI

