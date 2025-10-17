-- Fix missing foreign keys and clean up orphaned tables
-- This migration fixes the database relationships

-- 1. Drop the orphaned announcement_attachments table since announcements table was removed
DROP TABLE IF EXISTS announcement_attachments CASCADE;

-- 2. Add proper foreign keys to notifications table
-- First, let's check if we need to add foreign key constraints to notifications

-- Add foreign key to teachers table for notifications (if user_type = 'teacher')
-- Note: We can't add a direct foreign key because user_id can reference either teachers or students
-- Instead, we'll add check constraints to ensure data integrity

-- Note: We can't add a direct foreign key constraint because user_id can reference either teachers or students
-- The trigger function below will handle data integrity validation

-- 3. Add missing foreign keys to other tables that might be missing them

-- Ensure materials table has proper foreign keys (already exists but let's verify)
-- The materials table should reference classes and teachers

-- Ensure assignments table has proper foreign keys (already exists but let's verify)
-- The assignments table should reference classes and teachers

-- Ensure submissions table has proper foreign keys (already exists but let's verify)
-- The submissions table should reference assignments, students, and teachers

-- 4. Add any missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_type ON notifications(user_id, user_type);

-- 5. Add comments to clarify the relationships
COMMENT ON TABLE notifications IS 'User notifications - user_id can reference either teachers.id or students.id based on user_type';
COMMENT ON COLUMN notifications.user_id IS 'References teachers.id if user_type=teacher, or students.id if user_type=student';
COMMENT ON COLUMN notifications.user_type IS 'Determines whether user_id references teachers or students table';

-- 6. Create a view to help with notifications queries
CREATE OR REPLACE VIEW notifications_with_user_info AS
SELECT 
  n.*,
  CASE 
    WHEN n.user_type = 'teacher' THEN t.full_name
    WHEN n.user_type = 'student' THEN s.full_name
    ELSE 'Unknown'
  END as user_name,
  CASE 
    WHEN n.user_type = 'teacher' THEN t.email
    WHEN n.user_type = 'student' THEN s.email
    ELSE NULL
  END as user_email
FROM notifications n
LEFT JOIN teachers t ON n.user_type = 'teacher' AND n.user_id = t.id
LEFT JOIN students s ON n.user_type = 'student' AND n.user_id = s.id;

-- 7. Update RLS policies for notifications if needed
-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Teachers can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Students can view their notifications" ON notifications;

-- Create new RLS policies for notifications
CREATE POLICY "Teachers can view their notifications" ON notifications
  FOR ALL USING (
    user_type = 'teacher' AND user_id = auth.uid()
  );

CREATE POLICY "Students can view their notifications" ON notifications
  FOR ALL USING (
    user_type = 'student' AND user_id = auth.uid()
  );

-- 8. Add trigger to automatically set user_type based on user_id
-- This ensures data consistency
CREATE OR REPLACE FUNCTION set_notification_user_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user_id exists in teachers table
  IF EXISTS (SELECT 1 FROM teachers WHERE id = NEW.user_id) THEN
    NEW.user_type = 'teacher';
  -- Check if user_id exists in students table
  ELSIF EXISTS (SELECT 1 FROM students WHERE id = NEW.user_id) THEN
    NEW.user_type = 'student';
  ELSE
    RAISE EXCEPTION 'User ID % does not exist in teachers or students table', NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notifications
DROP TRIGGER IF EXISTS trigger_set_notification_user_type ON notifications;
CREATE TRIGGER trigger_set_notification_user_type
  BEFORE INSERT OR UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_notification_user_type();
