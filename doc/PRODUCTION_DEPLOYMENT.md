# Production Deployment Guide

## Standard Deployment Process

### 1. Pull Latest Code
```bash
git pull origin main  # or your branch name
```

### 2. Build Docker Image
```bash
docker compose -f docker-compose.prod.yml build app
```

### 3. **Run Database Migration** (NEW - Required for editableContent column)
```bash
# Option A: Run migration SQL file directly (Recommended)
docker exec -i voxe_postgres psql -U postgres -d voxe < prisma/migrations/add_editable_content_to_system_messages.sql

# Option B: Run migration from inside the app container
docker exec -it voxe_app psql -h postgres -U postgres -d voxe -f /app/prisma/migrations/add_editable_content_to_system_messages.sql

# Option C: Use Prisma DB Push (if you prefer)
docker exec -it voxe_app npx prisma db push
```

### 4. Start/Update Application
```bash
docker compose -f docker-compose.prod.yml up -d app
```

### 5. Verify Migration (Optional)
```bash
# Check if column was added successfully
docker exec -it voxe_postgres psql -U postgres -d voxe -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'system_messages' AND column_name = 'editableContent';"
```

You should see:
```
column_name      | data_type
-----------------|----------
editableContent  | jsonb
```

---

## Complete Deployment Script

You can combine all steps into one script:

```bash
#!/bin/bash
# production-deploy.sh

echo "📥 Pulling latest code..."
git pull origin main

echo "🔨 Building Docker image..."
docker compose -f docker-compose.prod.yml build app

echo "🗄️  Running database migration..."
docker exec -i voxe_postgres psql -U postgres -d voxe < prisma/migrations/add_editable_content_to_system_messages.sql

echo "🚀 Starting application..."
docker compose -f docker-compose.prod.yml up -d app

echo "✅ Deployment complete!"
echo "📊 Verifying migration..."
docker exec -it voxe_postgres psql -U postgres -d voxe -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'system_messages' AND column_name = 'editableContent';"
```

---

## Important Notes

1. **Migration is Safe**: The migration uses `ADD COLUMN IF NOT EXISTS`, so it's safe to run multiple times.

2. **No Data Loss**: The `editableContent` column is nullable, so existing records won't be affected.

3. **Backup First** (Recommended for production):
   ```bash
   docker exec voxe_postgres pg_dump -U postgres voxe > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

4. **If Migration Fails**: The app will still work, but the new editable content features won't function until the column is added.

---

## Troubleshooting

### Migration Already Applied
If you see `ERROR: column "editableContent" already exists`, the migration was already applied. This is safe to ignore.

### Database Not Running
If you get connection errors, ensure the database container is running:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml up -d postgres
```

### Permission Issues
If you get permission errors, ensure the migration file is readable:
```bash
chmod 644 prisma/migrations/add_editable_content_to_system_messages.sql
```

