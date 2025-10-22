-- Add support for multi-class assignments
-- Create junction table for assignment-class relationships

CREATE TABLE IF NOT EXISTS assignment_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_classes_assignment ON assignment_classes(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_classes_class ON assignment_classes(class_id);

-- Update assignments table to make class_id nullable for wajib assignments
-- (since we'll use the junction table instead)
ALTER TABLE assignments ALTER COLUMN class_id DROP NOT NULL;

-- Update the constraint to allow wajib assignments without direct class_id
-- (they'll use the junction table instead)
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_assignment_type_check;
ALTER TABLE assignments ADD CONSTRAINT assignments_assignment_type_check CHECK (
  (assignment_type = 'wajib' AND target_grade IS NULL) OR
  (assignment_type = 'tambahan' AND class_id IS NULL AND target_grade IS NOT NULL)
);

-- Add comment
COMMENT ON TABLE assignment_classes IS 'Junction table for multi-class wajib assignments';
