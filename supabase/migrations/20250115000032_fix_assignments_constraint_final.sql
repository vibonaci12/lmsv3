-- Final fix for assignments constraint
-- This migration ensures the constraint is properly updated

-- First, let's check what constraint exists and drop it completely
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_assignment_type_check;
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_check;

-- Now add the correct constraint that allows wajib assignments without class_id
ALTER TABLE assignments ADD CONSTRAINT assignments_assignment_type_check CHECK (
  (assignment_type = 'wajib' AND target_grade IS NULL) OR
  (assignment_type = 'tambahan' AND class_id IS NULL AND target_grade IS NOT NULL)
);

-- Also ensure class_id can be null for wajib assignments
ALTER TABLE assignments ALTER COLUMN class_id DROP NOT NULL;

-- Add comment
COMMENT ON CONSTRAINT assignments_assignment_type_check ON assignments IS 
'Allows wajib assignments without class_id (uses junction table) and tambahan assignments without class_id but with target_grade';
