-- Update materials table to support grade-based materials instead of class-specific
-- This allows materials to be shared across all classes of the same grade

-- Add new columns to materials table
ALTER TABLE materials ADD COLUMN IF NOT EXISTS target_grade TEXT CHECK (target_grade IN ('10', '11', '12'));
ALTER TABLE materials ADD COLUMN IF NOT EXISTS material_type TEXT DEFAULT 'class' CHECK (material_type IN ('class', 'grade'));

-- Update existing materials to have material_type = 'class' and keep their class_id
UPDATE materials SET material_type = 'class' WHERE material_type IS NULL;

-- Add constraint to ensure either class_id OR target_grade is set (but not both)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'materials_target_check') THEN
        ALTER TABLE materials ADD CONSTRAINT materials_target_check 
        CHECK (
          (material_type = 'class' AND class_id IS NOT NULL AND target_grade IS NULL) OR
          (material_type = 'grade' AND class_id IS NULL AND target_grade IS NOT NULL)
        );
    END IF;
END $$;

-- Create index for target_grade
CREATE INDEX IF NOT EXISTS idx_materials_target_grade ON materials(target_grade);
CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(material_type);

-- Update RLS policies for materials to handle both class and grade-based materials
DROP POLICY IF EXISTS "Students can view enrolled class materials" ON materials;

-- New policy for students to view materials
CREATE POLICY "Students can view materials" ON materials
  FOR SELECT
  TO anon
  USING (
    -- Class-based materials: student must be enrolled in the class
    (material_type = 'class' AND class_id IN (
      SELECT class_id FROM class_students WHERE student_id IN (
        SELECT id FROM students
      )
    )) OR
    -- Grade-based materials: student must be in the same grade
    (material_type = 'grade' AND target_grade IN (
      SELECT DISTINCT c.grade FROM classes c
      INNER JOIN class_students cs ON c.id = cs.class_id
      WHERE cs.student_id IN (
        SELECT id FROM students
      )
    ))
  );

-- Add comment to explain the new structure
COMMENT ON COLUMN materials.material_type IS 'Type of material: class (specific to one class) or grade (shared across all classes of same grade)';
COMMENT ON COLUMN materials.target_grade IS 'Target grade for grade-based materials (10, 11, or 12)';
COMMENT ON CONSTRAINT materials_target_check ON materials IS 'Ensures either class_id (for class materials) or target_grade (for grade materials) is set, but not both';
