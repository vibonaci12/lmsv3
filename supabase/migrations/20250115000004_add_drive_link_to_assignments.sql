-- Add drive_link column to assignments table
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS drive_link TEXT;

-- Add comment
COMMENT ON COLUMN assignments.drive_link IS 'Optional Google Drive link for assignment materials';
