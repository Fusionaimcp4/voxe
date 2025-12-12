# Database Migration Guide

## Adding editableContent to system_messages

This guide explains how to update your database to add the `editableContent` field to the `system_messages` table.

## Option 1: Using Prisma Migrate (Recommended)

If you're using Prisma Migrate, run:

```bash
npx prisma migrate dev --name add_editable_content_to_system_messages
```

This will:
1. Generate a migration file
2. Apply it to your database
3. Update your Prisma Client

## Option 2: Manual SQL Migration

If you prefer to run the migration manually:

### For PostgreSQL:

1. **Connect to your database:**
   ```bash
   psql -U your_username -d your_database_name
   ```

2. **Run the migration SQL:**
   ```sql
   ALTER TABLE "system_messages" 
   ADD COLUMN IF NOT EXISTS "editableContent" JSONB;
   ```

   Or use the migration file:
   ```bash
   psql -U your_username -d your_database_name -f prisma/migrations/add_editable_content_to_system_messages.sql
   ```

### For other databases:

Adjust the SQL syntax according to your database:
- **MySQL/MariaDB:** Use `JSON` instead of `JSONB`
- **SQLite:** Use `TEXT` with JSON content

## Option 3: Using Prisma Studio

1. Open Prisma Studio:
   ```bash
   npx prisma studio
   ```

2. The schema will be automatically synced, but you'll need to run the migration SQL manually.

## Verify the Migration

After running the migration, verify it worked:

```sql
-- Check if the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'system_messages' 
AND column_name = 'editableContent';
```

You should see:
```
column_name      | data_type
-----------------|----------
editableContent  | jsonb
```

## Rollback (if needed)

If you need to rollback the migration:

```sql
ALTER TABLE "system_messages" 
DROP COLUMN IF EXISTS "editableContent";
```

## Notes

- The `editableContent` field is nullable (optional), so existing records won't break
- The field stores JSON data with structure like:
  ```json
  {
    "business_knowledge": "...",
    "voice_pov": "...",
    "faqs": "..."
  }
  ```
- Existing system messages will have `null` for this field until they're updated through the UI

