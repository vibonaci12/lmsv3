/*
  Remove subject field from classes table
  Since the web application is for single subject only
*/

-- Remove subject column from classes table
ALTER TABLE classes DROP COLUMN IF EXISTS subject;

-- Update any existing data if needed (optional)
-- Since we're removing the field, no data migration is needed

