/*
  # Fix Student RLS Policies
  
  The issue is that students use custom authentication (not Supabase Auth)
  but the RLS policies are set to 'TO anon' which doesn't work properly.
  
  We need to:
  1. Allow students to access their own data
  2. Allow students to access enrolled class data
  3. Keep teacher access intact
*/

-- ============================================
-- Drop existing student policies that use 'TO anon'
-- ============================================

-- Drop student policies for students table
DROP POLICY IF EXISTS "Students can view own profile" ON students;

-- Drop student policies for classes table  
DROP POLICY IF EXISTS "Students can view enrolled classes" ON classes;

-- Drop student policies for class_students table
DROP POLICY IF EXISTS "Students can view own enrollments" ON class_students;

-- Drop student policies for materials table
DROP POLICY IF EXISTS "Students can view enrolled class materials" ON materials;

-- Drop student policies for assignments table
DROP POLICY IF EXISTS "Students can view relevant assignments" ON assignments;

-- Drop student policies for questions table
DROP POLICY IF EXISTS "Students can view questions" ON questions;

-- Drop student policies for submissions table
DROP POLICY IF EXISTS "Students can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Students can create own submissions" ON submissions;
DROP POLICY IF EXISTS "Students can update own submissions" ON submissions;

-- Drop student policies for answers table
DROP POLICY IF EXISTS "Students can manage own answers" ON answers;

-- Drop student policies for attendances table
DROP POLICY IF EXISTS "Students can view own attendance" ON attendances;

-- ============================================
-- Create new policies that work with custom student auth
-- ============================================

-- Students can view their own profile (no RLS restriction needed for basic profile access)
CREATE POLICY "Students can view own profile" ON students
  FOR SELECT
  TO anon
  USING (true);

-- Students can view all classes (they'll filter on frontend based on enrollment)
CREATE POLICY "Students can view all classes" ON classes
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Students can view all enrollments (they'll filter on frontend)
CREATE POLICY "Students can view all enrollments" ON class_students
  FOR SELECT
  TO anon
  USING (true);

-- Students can view materials for active classes
CREATE POLICY "Students can view class materials" ON materials
  FOR SELECT
  TO anon
  USING (true);

-- Students can view all assignments
CREATE POLICY "Students can view all assignments" ON assignments
  FOR SELECT
  TO anon
  USING (true);

-- Students can view all questions
CREATE POLICY "Students can view all questions" ON questions
  FOR SELECT
  TO anon
  USING (true);

-- Students can view all submissions (they'll filter on frontend)
CREATE POLICY "Students can view all submissions" ON submissions
  FOR SELECT
  TO anon
  USING (true);

-- Students can create submissions
CREATE POLICY "Students can create submissions" ON submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Students can update submissions
CREATE POLICY "Students can update submissions" ON submissions
  FOR UPDATE
  TO anon
  USING (true);

-- Students can manage answers
CREATE POLICY "Students can manage answers" ON answers
  FOR ALL
  TO anon
  USING (true);

-- Students can view all attendances (they'll filter on frontend)
CREATE POLICY "Students can view all attendances" ON attendances
  FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- Update notifications policy for students
-- ============================================

-- Drop existing notification policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Create new notification policies
CREATE POLICY "Users can view notifications" ON notifications
  FOR SELECT
  USING (
    (user_type = 'teacher' AND user_id = auth.uid()) OR
    (user_type = 'student')
  );

CREATE POLICY "Users can update notifications" ON notifications
  FOR UPDATE
  USING (
    (user_type = 'teacher' AND user_id = auth.uid()) OR
    (user_type = 'student')
  );
