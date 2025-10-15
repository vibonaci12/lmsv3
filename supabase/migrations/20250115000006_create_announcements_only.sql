-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create announcement_attachments table
CREATE TABLE IF NOT EXISTS announcement_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Teachers can view all announcements
CREATE POLICY "Teachers can view all announcements" ON announcements
  FOR SELECT USING (true);

-- Teachers can insert announcements for their classes
CREATE POLICY "Teachers can insert announcements for their classes" ON announcements
  FOR INSERT WITH CHECK (
    teacher_id = auth.uid() AND
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
  );

-- Teachers can update their own announcements
CREATE POLICY "Teachers can update their own announcements" ON announcements
  FOR UPDATE USING (teacher_id = auth.uid());

-- Teachers can delete their own announcements
CREATE POLICY "Teachers can delete their own announcements" ON announcements
  FOR DELETE USING (teacher_id = auth.uid());

-- Students can view announcements for their classes
CREATE POLICY "Students can view announcements for their classes" ON announcements
  FOR SELECT USING (
    class_id IN (
      SELECT class_id FROM class_students 
      WHERE student_id = auth.uid()
    )
  );

-- Create RLS policies for announcement_attachments
ALTER TABLE announcement_attachments ENABLE ROW LEVEL SECURITY;

-- Teachers can view all attachments
CREATE POLICY "Teachers can view all attachments" ON announcement_attachments
  FOR SELECT USING (true);

-- Teachers can insert attachments for their announcements
CREATE POLICY "Teachers can insert attachments for their announcements" ON announcement_attachments
  FOR INSERT WITH CHECK (
    announcement_id IN (
      SELECT id FROM announcements WHERE teacher_id = auth.uid()
    )
  );

-- Teachers can update attachments for their announcements
CREATE POLICY "Teachers can update attachments for their announcements" ON announcement_attachments
  FOR UPDATE USING (
    announcement_id IN (
      SELECT id FROM announcements WHERE teacher_id = auth.uid()
    )
  );

-- Teachers can delete attachments for their announcements
CREATE POLICY "Teachers can delete attachments for their announcements" ON announcement_attachments
  FOR DELETE USING (
    announcement_id IN (
      SELECT id FROM announcements WHERE teacher_id = auth.uid()
    )
  );

-- Students can view attachments for their class announcements
CREATE POLICY "Students can view attachments for their class announcements" ON announcement_attachments
  FOR SELECT USING (
    announcement_id IN (
      SELECT a.id FROM announcements a
      JOIN class_students cs ON a.class_id = cs.class_id
      WHERE cs.student_id = auth.uid()
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_class_id ON announcements(class_id);
CREATE INDEX IF NOT EXISTS idx_announcements_teacher_id ON announcements(teacher_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_announcement_attachments_announcement_id ON announcement_attachments(announcement_id);

-- Add comments
COMMENT ON TABLE announcements IS 'Class announcements and notifications';
COMMENT ON TABLE announcement_attachments IS 'File attachments for announcements';
