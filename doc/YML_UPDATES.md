# YAML/Config Files Updated for Voxe.mcp4.ai

## Files Updated

### 1. `docker-compose.prod.yml`
**Changes:**
- ✅ Added `APP_NAME` environment variable
- ✅ Added `EMAIL_DOMAIN` environment variable
- ✅ Updated container names from `localboxs_*` to `voxe_*`
- ✅ Updated database name from `localboxs` to `voxe`

**Note**: If you're running both localboxs.com and voxe.mcp4.ai on the same server, you'll need separate Docker Compose files or use different container names.

### 2. `ecosystem.config.js` (PM2 Configuration)
**Changes:**
- ✅ Updated app name from `"localboxs"` to `"voxe"`
- ✅ Updated working directory from `/opt/localboxs-site` to `/opt/voxe-site`
- ✅ Updated URLs to `https://voxe.mcp4.ai`
- ✅ Added new environment variables:
  - `NEXTAUTH_URL: "https://voxe.mcp4.ai"`
  - `NEXT_PUBLIC_APP_URL: "https://voxe.mcp4.ai"`
  - `APP_NAME: "Voxe"`
  - `EMAIL_DOMAIN: "mcp4.ai"`

**Note**: Update the repository URL and deployment path to match your voxe deployment setup.

---

## If Running Both Environments on Same Server

If you're running both `localboxs.com` and `voxe.mcp4.ai` on the same server, consider:

1. **Separate PM2 Configs**: Create separate ecosystem files:
   - `ecosystem.localboxs.js`
   - `ecosystem.voxe.js`

2. **Separate Docker Compose Files**: Create separate compose files:
   - `docker-compose.localboxs.yml`
   - `docker-compose.voxe.yml`

3. **Different Ports**: Use different ports:
   - localboxs: Port 3000 → nginx proxy
   - voxe: Port 3001 → nginx proxy

4. **Different Databases**: Ensure separate databases:
   - localboxs: `DATABASE_URL=postgresql://.../localboxs_db`
   - voxe: `DATABASE_URL=postgresql://.../voxe_db`

---

## Next Steps

1. **Review the changes** in both files
2. **Update deployment paths** in `ecosystem.config.js` if different
3. **Update repository URLs** if voxe is in a different repo
4. **Ensure separate .env files** for each environment
5. **Test deployment** after making changes

