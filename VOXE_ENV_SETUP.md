# Voxe.mcp4.ai Environment Variables Setup Guide

## 🔍 Issues Found and Fixed

### 1. **APP_BASE_URL Environment Variable**
   - **Issue**: Code was using `APP_BASE_URL` which is not a standard Next.js environment variable
   - **Fixed**: Changed to use `NEXTAUTH_URL`, `NEXT_PUBLIC_BASE_URL`, or `NEXT_PUBLIC_APP_URL` (in order of preference)
   - **Files Updated**:
     - `app/api/auth/register/route.ts`
     - `app/api/auth/resend-verification/route.ts`
     - `app/api/auth/forgot-password/route.ts`

### 2. **Cookie Security Configuration**
   - **Issue**: Cookies might not be secure if `NODE_ENV` is not set correctly
   - **Fixed**: Enhanced cookie configuration to check `NEXTAUTH_URL` for HTTPS
   - **File Updated**: `lib/auth.ts`

### 3. **Email Branding**
   - **Issue**: Emails still referenced "Localbox" instead of "Voxe"
   - **Fixed**: Added `APP_NAME` environment variable support
   - **Files Updated**:
     - `app/api/auth/register/route.ts`
     - `app/api/auth/resend-verification/route.ts`
     - `app/api/auth/forgot-password/route.ts`
     - `app/api/auth/2fa/setup/route.ts`
     - `lib/mailer.ts`

---

## ✅ Required Environment Variables for voxe.mcp4.ai

Add these to your `.env` file for voxe.mcp4.ai:

### Critical (Required for Authentication)

```bash
# Authentication - CRITICAL
NEXTAUTH_SECRET=your-unique-secret-key-here-min-32-chars
NEXTAUTH_URL=https://voxe.mcp4.ai

# Database - CRITICAL
DATABASE_URL=postgresql://user:password@host:5432/voxe_db

# Node Environment - CRITICAL for production
NODE_ENV=production

# OpenAI - CRITICAL
OPENAI_API_KEY=sk-your-openai-key
```

### Important (For Full Functionality)

```bash
# Base URLs
NEXT_PUBLIC_BASE_URL=https://voxe.mcp4.ai
NEXT_PUBLIC_APP_URL=https://voxe.mcp4.ai

# App Branding
APP_NAME=Voxe
EMAIL_DOMAIN=mcp4.ai
EMAIL_FROM=Voxe <no-reply@mcp4.ai>
```

### Optional (Service Integrations)

```bash
# Chatwoot (if using)
CHATWOOT_BASE_URL=https://chatvoxe.mcp4.ai
CHATWOOT_ACCOUNT_ID=your-account-id
CHATWOOT_API_KEY=your-api-key

# n8n (if using)
N8N_BASE_URL=https://n8n.mcp4.ai
N8N_API_KEY=your-api-key

# Fusion API (if using)
FUSION_BASE_URL=https://api.mcp4.ai
FUSION_API_KEY=your-api-key

# Email (SMTP - for verification emails)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@mcp4.ai
SMTP_PASS=your-email-password
SMTP_SECURE=false

# Stripe (if using billing)
STRIPE_BILLING_ENABLED=true
STRIPE_SECRET_KEY=sk_live_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-key

# OAuth (if using Google login)
OAUTH_GOOGLE_ENABLED=true
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Rate Limiting & Security
REDIS_URL=redis://localhost:6379  # If using Redis for rate limiting
CAPTCHA_ENABLED=true
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-key
TURNSTILE_SECRET_KEY=your-turnstile-secret

# Cron Jobs (for automated tasks)
CRON_SECRET=your-strong-random-secret-here-min-32-chars  # Required for trial expiration cron job
SUPPORT_EMAIL=support@mcp4.ai  # Optional, defaults to support@EMAIL_DOMAIN
```

---

## 🔑 Key Points

### 1. NEXTAUTH_SECRET
- **Must be unique** for voxe.mcp4.ai (different from localboxs.com)
- **Must be at least 32 characters** long
- **Generate a secure random string**:
  ```bash
  openssl rand -base64 32
  ```

### 2. NEXTAUTH_URL
- **Must be** `https://voxe.mcp4.ai` (with https://)
- **No trailing slash**
- **This is critical** - NextAuth uses this for callback URLs and cookie domain

### 3. NODE_ENV
- **Must be set to `production`** for voxe.mcp4.ai
- This enables:
  - Secure cookies
  - Production optimizations
  - Correct cookie naming (`__Secure-next-auth.session-token`)

### 4. Database
- **Should use a separate database** from localboxs.com
- Or use a separate schema if sharing the same PostgreSQL instance

### 5. APP_NAME
- **New variable** - Set to "Voxe" for branding
- Used in emails and app display

---

## 🧪 Testing Checklist

After updating your `.env` file:

1. **Restart the application** (PM2 restart or docker-compose restart)
2. **Test Sign Up**:
   - Go to https://voxe.mcp4.ai/auth/signin
   - Click "Sign Up"
   - Create a new account
   - Check email for verification link (should use https://voxe.mcp4.ai)
   
3. **Test Login**:
   - Log in with credentials
   - Check browser cookies - should see `__Secure-next-auth.session-token`
   - Cookie should be `Secure` and `HttpOnly`
   - Cookie domain should be `voxe.mcp4.ai`

4. **Verify Email Links**:
   - Check that verification emails use `https://voxe.mcp4.ai` in links
   - Not `http://localhost:3000` or `https://localboxs.com`

5. **Check Browser Console**:
   - No cookie-related errors
   - No CORS errors
   - No authentication errors

---

## 🐛 Troubleshooting

### Issue: Can't log in / Session not persisting
- **Check**: `NEXTAUTH_SECRET` is set and unique
- **Check**: `NEXTAUTH_URL` is exactly `https://voxe.mcp4.ai` (no trailing slash)
- **Check**: `NODE_ENV=production` is set
- **Check**: Browser cookies are being set (check DevTools > Application > Cookies)
- **Check**: HTTPS is properly configured (cookies require HTTPS in production)

### Issue: Email links point to wrong domain
- **Check**: `NEXTAUTH_URL` or `NEXT_PUBLIC_BASE_URL` is set correctly
- **Check**: Application was restarted after updating `.env`

### Issue: Cookies not secure
- **Check**: `NODE_ENV=production` is set
- **Check**: `NEXTAUTH_URL` starts with `https://`
- **Check**: HTTPS is properly configured on the server

### Issue: Can't sign up (database error)
- **Check**: `DATABASE_URL` is correct and database is accessible
- **Check**: Database migrations have been run
- **Check**: Database user has proper permissions

---

## 📝 Quick Setup Command

For voxe.mcp4.ai, ensure these are in your `.env`:

```bash
# Copy and update these values
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://voxe.mcp4.ai
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://voxe.mcp4.ai
NEXT_PUBLIC_APP_URL=https://voxe.mcp4.ai
APP_NAME=Voxe
EMAIL_DOMAIN=mcp4.ai
DATABASE_URL=postgresql://user:pass@host:5432/voxe_db
OPENAI_API_KEY=sk-...
CRON_SECRET=<generate-with-openssl-rand-hex-32>  # For trial expiration cron job
```

---

## 🔄 Next Steps

1. Update your `.env` file with the correct values
2. Restart the application
3. Clear browser cookies for voxe.mcp4.ai
4. Test sign up and login
5. Verify email links work correctly

---

**Note**: Make sure your voxe.mcp4.ai environment variables are **completely separate** from localboxs.com to avoid conflicts!

