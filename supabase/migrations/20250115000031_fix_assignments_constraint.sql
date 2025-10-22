-- Fix assignments constraint to properly support multi-class assignments
-- The constraint should allow wajib assignments without direct class_id
-- since they now use the junction table

-- Drop the existing constraint
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_assignment_type_check;

-- Add the corrected constraint
ALTER TABLE assignments ADD CONSTRAINT assignments_assignment_type_check CHECK (
  (assignment_type = 'wajib' AND target_grade IS NULL) OR
  (assignment_type = 'tambahan' AND class_id IS NULL AND target_grade IS NOT NULL)
);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT assignments_assignment_type_check ON assignments IS 
'Ensures wajib assignments have no target_grade (use junction table for classes) and tambahan assignments have no class_id but have target_grade';
