-- Verification query to check if editableContent column exists
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'system_messages' 
AND column_name = 'editableContent';

-- Expected result:
-- column_name      | data_type | is_nullable
-- -----------------|-----------|------------
-- editableContent  | jsonb     | YES

