-- Migration: Add editableContent column to system_messages table
-- This migration adds the editableContent JSONB field to store user-editable sections
-- of the system message (business_knowledge, voice_pov, faqs, etc.)

-- Add editableContent column (nullable JSONB)
ALTER TABLE "system_messages" 
ADD COLUMN IF NOT EXISTS "editableContent" JSONB;

-- Add a comment to document the column
COMMENT ON COLUMN "system_messages"."editableContent" IS 'Stores user-editable sections of the system message (business_knowledge, voice_pov, faqs, etc.) as JSON';

