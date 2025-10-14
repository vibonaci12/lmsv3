/*
  Add address field to students table
  Since we're using address in the application but it's missing from the schema
*/

-- Add address column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;
