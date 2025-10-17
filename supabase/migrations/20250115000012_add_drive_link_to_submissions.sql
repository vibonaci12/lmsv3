-- Add drive_link column to submissions table
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS drive_link TEXT;

-- Add comment
COMMENT ON COLUMN submissions.drive_link IS 'Google Drive link for assignment submission';

-- Update existing submissions to have empty drive_link
UPDATE submissions SET drive_link = NULL WHERE drive_link IS NULL;

