-- Convert type column to enum in newsroom table
-- This migration changes the type column from TEXT to ENUM

-- First, create the enum type
DO $$ 
BEGIN
    -- Drop existing enum if it exists
    DROP TYPE IF EXISTS newsroom_type_enum CASCADE;
    
    -- Create new enum type
    CREATE TYPE newsroom_type_enum AS ENUM ('news', 'announcement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add a new column with enum type
ALTER TABLE newsroom ADD COLUMN IF NOT EXISTS type_new newsroom_type_enum;

-- Update the new column with data from the old column
UPDATE newsroom SET type_new = 
  CASE 
    WHEN type = 'news' THEN 'news'::newsroom_type_enum
    WHEN type = 'announcement' THEN 'announcement'::newsroom_type_enum
    ELSE 'news'::newsroom_type_enum
  END;

-- Drop the old column
ALTER TABLE newsroom DROP COLUMN IF EXISTS type;

-- Rename the new column to the original name
ALTER TABLE newsroom RENAME COLUMN type_new TO type;

-- Add NOT NULL constraint
ALTER TABLE newsroom ALTER COLUMN type SET NOT NULL;

-- Add comment
COMMENT ON COLUMN newsroom.type IS 'Type of content: news or announcement';

-- Verify the changes
SELECT 'Verifying enum conversion:' as info;
SELECT type, COUNT(*) as count 
FROM newsroom 
GROUP BY type 
ORDER BY type;
