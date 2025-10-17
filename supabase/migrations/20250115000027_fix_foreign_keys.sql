-- Fix foreign key constraints for newsroom table
SELECT '=== FIXING FOREIGN KEY CONSTRAINTS ===' as info;

-- Check current foreign key constraints
SELECT 'Current foreign keys:' as info;
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'newsroom';

-- Drop existing foreign key constraints if they exist
ALTER TABLE newsroom DROP CONSTRAINT IF EXISTS newsroom_created_by_fkey;
ALTER TABLE newsroom DROP CONSTRAINT IF EXISTS newsroom_updated_by_fkey;

-- Add foreign key constraints properly
ALTER TABLE newsroom 
ADD CONSTRAINT newsroom_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES teachers(id) ON DELETE SET NULL;

ALTER TABLE newsroom 
ADD CONSTRAINT newsroom_updated_by_fkey 
FOREIGN KEY (updated_by) REFERENCES teachers(id) ON DELETE SET NULL;

-- Verify foreign keys were created
SELECT 'New foreign keys:' as info;
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'newsroom';

-- Test the join query that's failing
SELECT 'Testing join query:' as info;
SELECT 
  n.id,
  n.title,
  n.type,
  n.status,
  t.full_name
FROM newsroom n
LEFT JOIN teachers t ON n.created_by = t.id
WHERE n.type = 'announcement'
LIMIT 5;
