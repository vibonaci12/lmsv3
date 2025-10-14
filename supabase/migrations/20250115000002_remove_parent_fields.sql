/*
  Remove parent fields from students table
  Since we're simplifying student data structure
*/

-- Remove parent_name and parent_phone columns from students table
ALTER TABLE students DROP COLUMN IF EXISTS parent_name;
ALTER TABLE students DROP COLUMN IF EXISTS parent_phone;

-- Update any existing data if needed (optional)
-- Since we're removing the fields, no data migration is needed
