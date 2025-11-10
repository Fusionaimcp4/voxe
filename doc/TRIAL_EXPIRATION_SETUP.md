# Free Trial Expiration System Setup Guide

## Overview

This system implements a complete 14-day free trial with:
- ✅ Automatic trial date setting on registration (email/password and OAuth)
- ✅ Email reminders 3 days before trial expiration
- ✅ Email notifications when trial expires
- ✅ Automatic status update to EXPIRED when trial ends
- ✅ Real-time enforcement (blocks API calls and features)

---

## Components

### 1. **Database Fields**
- `User.freeTrialEndsAt` - DateTime when the trial expires (14 days from registration)
- `User.subscriptionStatus` - Set to 'EXPIRED' when trial ends

### 2. **Email Templates**
- `emails/trial-expiring-soon.html` - Sent 3 days before expiration
- `emails/trial-expired.html` - Sent when trial expires

### 3. **Core Functions**
- `handleExpiringFreeTrials()` - Sends reminders to users whose trial expires in 3 days
- `handleExpiredFreeTrialUsers()` - Processes expired trials and sends notifications

### 4. **Cron Job Endpoint**
- `GET /api/cron/trial-expiration?secret=YOUR_SECRET` - Processes trials (requires CRON_SECRET)
- `POST /api/cron/trial-expiration` - Manual trigger (requires admin authentication)

---

## Setup Instructions

### Step 1: Set Environment Variables

Add to your `.env` file:

```bash
# Cron job security secret (generate a strong random string)
CRON_SECRET=your-strong-random-secret-here-min-32-chars

# Support email (optional, defaults to support@EMAIL_DOMAIN)
SUPPORT_EMAIL=support@mcp4.ai

# App name (already set, defaults to "Voxe")
APP_NAME=Voxe

# Email domain (already set)
EMAIL_DOMAIN=mcp4.ai
```

**Generate a secure CRON_SECRET:**
```bash
# On Linux/Mac
openssl rand -hex 32

# On Windows (PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### Step 2: Set Up Cron Job

Choose one of the following methods:

#### Option A: Vercel Cron (Recommended for Vercel deployments)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/trial-expiration?secret=YOUR_CRON_SECRET",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/trial-expiration?secret=YOUR_CRON_SECRET&action=remind",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Schedule Explanation:**
- First cron: Runs daily at midnight (00:00 UTC) to process expired trials
- Second cron: Runs daily at 9 AM UTC to send reminders (3 days before expiration)

#### Option B: External Cron Service (Recommended for self-hosted)

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com):

1. **Create Daily Expiration Check:**
   - URL: `https://yourdomain.com/api/cron/trial-expiration?secret=YOUR_CRON_SECRET`
   - Schedule: Daily at 00:00 (midnight UTC)
   - Method: GET

2. **Create Daily Reminder Check:**
   - URL: `https://yourdomain.com/api/cron/trial-expiration?secret=YOUR_CRON_SECRET&action=remind`
   - Schedule: Daily at 09:00 UTC
   - Method: GET

#### Option C: Node.js Cron (For long-running processes)

If you have a long-running Node.js process, use `node-cron`:

```bash
npm install node-cron
```

Create `scripts/cron-trial-expiration.ts`:

```typescript
import cron from 'node-cron';
import { handleExpiredFreeTrialUsers, handleExpiringFreeTrials } from '../lib/stripe-db';

// Run daily at midnight UTC
cron.schedule('0 0 * * *', async () => {
  console.log('Running expired trial check...');
  await handleExpiredFreeTrialUsers();
});

// Run daily at 9 AM UTC to send reminders
cron.schedule('0 9 * * *', async () => {
  console.log('Running expiring trial reminders...');
  await handleExpiringFreeTrials();
});
```

### Step 3: Test the System

#### Test Manually (as Admin)

```bash
# Process expired trials and send reminders
curl -X POST https://yourdomain.com/api/cron/trial-expiration \
  -H "Content-Type: application/json" \
  -d '{"action": "all"}' \
  -b "your-session-cookie"
```

Or use the browser console while logged in as admin:

```javascript
fetch('/api/cron/trial-expiration', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'all' })
}).then(r => r.json()).then(console.log);
```

#### Test with Cron Secret

```bash
# Process expired trials only
curl "https://yourdomain.com/api/cron/trial-expiration?secret=YOUR_CRON_SECRET&action=expire"

# Send reminders only
curl "https://yourdomain.com/api/cron/trial-expiration?secret=YOUR_CRON_SECRET&action=remind"

# Process both (default)
curl "https://yourdomain.com/api/cron/trial-expiration?secret=YOUR_CRON_SECRET"
```

---

## How It Works

### Registration Flow

1. **User registers** (email/password or OAuth)
2. **System sets** `freeTrialEndsAt` to 14 days from now
3. **System sets** `subscriptionTier` to 'FREE' and `subscriptionStatus` to 'ACTIVE'

### Daily Cron Jobs

#### Morning (9 AM UTC): Reminder Check
- Finds users whose trial expires in 3 days
- Sends "Trial Expiring Soon" email
- Includes upgrade button and days remaining

#### Midnight (00:00 UTC): Expiration Check
- Finds users whose trial has expired (past `freeTrialEndsAt`)
- Sets `subscriptionStatus` to 'EXPIRED'
- Sets `subscriptionExpiresAt` to trial end date
- Clears `freeTrialEndsAt`
- Sends "Trial Expired" email
- Creates transaction record

### Real-Time Enforcement

The system also checks trial expiration in real-time:

- **API Calls** (`lib/usage-tracking.ts`): Blocks API calls if trial expired
- **Feature Access** (`lib/usage-tracking.ts`): Blocks feature usage if trial expired
- **UI Display** (`app/pricing/page.tsx`): Shows trial expiration status

---

## Email Templates

### Trial Expiring Soon (3 days before)
- **Template**: `emails/trial-expiring-soon.html`
- **Variables**: `userName`, `appName`, `daysRemaining`, `trialEndDate`, `upgradeUrl`, etc.

### Trial Expired
- **Template**: `emails/trial-expired.html`
- **Variables**: `userName`, `appName`, `upgradeUrl`, `supportUrl`, `supportEmail`, etc.

Both templates are responsive HTML emails with:
- Professional styling
- Clear call-to-action buttons
- Support links
- Branding consistency

---

## Monitoring

### Check Logs

The system logs all actions:

```
[INFO] Checking for expiring free trials...
[INFO] Found 5 users with expiring free trials. Sending reminders...
[INFO] Sent trial expiration reminder to user@example.com (3 days remaining)
[INFO] Checking for expired free trials...
[INFO] Found 2 users with expired free trials. Processing...
[INFO] User user@example.com (ID: abc123) free trial expired. Status updated to EXPIRED and email sent.
```

### Database Queries

Check users with expiring trials:
```sql
SELECT email, name, "freeTrialEndsAt" 
FROM users 
WHERE "subscriptionTier" = 'FREE' 
  AND "subscriptionStatus" = 'ACTIVE'
  AND "freeTrialEndsAt" IS NOT NULL
  AND "freeTrialEndsAt" <= NOW() + INTERVAL '3 days'
ORDER BY "freeTrialEndsAt";
```

Check expired trials:
```sql
SELECT email, name, "subscriptionStatus", "subscriptionExpiresAt"
FROM users 
WHERE "subscriptionTier" = 'FREE' 
  AND "subscriptionStatus" = 'EXPIRED'
ORDER BY "subscriptionExpiresAt" DESC;
```

---

## Troubleshooting

### Emails Not Sending

1. **Check SMTP configuration** in `.env`:
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`

2. **Verify email templates exist**:
   - `emails/trial-expiring-soon.html`
   - `emails/trial-expired.html`

3. **Check logs** for email errors

### Cron Job Not Running

1. **Verify CRON_SECRET** is set and matches in cron service
2. **Check cron service logs** (Vercel Cron dashboard, cron-job.org dashboard)
3. **Test manually** using POST endpoint (requires admin login)
4. **Check server logs** for authentication errors

### Trials Not Expiring

1. **Verify `freeTrialEndsAt` is set** on user registration:
   ```sql
   SELECT email, "freeTrialEndsAt", "createdAt" 
   FROM users 
   WHERE "createdAt" > NOW() - INTERVAL '1 day';
   ```

2. **Check cron job is running** (see logs above)
3. **Verify timezone** - cron jobs run in UTC

---

## Security Considerations

1. **CRON_SECRET**: Use a strong, random secret (minimum 32 characters)
2. **HTTPS Only**: Always use HTTPS for cron endpoints
3. **IP Restrictions** (optional): Some cron services allow IP whitelisting
4. **Rate Limiting**: Consider adding rate limiting to prevent abuse

---

## Future Enhancements

Potential improvements:
- [ ] Add email preference settings (opt-out for reminders)
- [ ] Track if reminder email was sent (add `trialReminderSentAt` field)
- [ ] Customize reminder timing (7 days, 1 day, etc.)
- [ ] Add webhook notifications for trial expiration
- [ ] Analytics dashboard for trial conversion rates

---

## Support

For issues or questions:
- Check server logs for detailed error messages
- Verify environment variables are set correctly
- Test manually using the POST endpoint
- Review database to ensure trial dates are set correctly

