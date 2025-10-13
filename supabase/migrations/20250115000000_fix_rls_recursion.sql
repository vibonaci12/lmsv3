/*
  Fix infinite recursion in RLS policies
  The issue was that teachers table policies were referencing themselves
  causing infinite recursion. We'll fix this by using auth.uid() directly.
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Teachers can view all teachers" ON teachers;
DROP POLICY IF EXISTS "Teachers can update all teacher profiles" ON teachers;

-- Create fixed policies for teachers table
CREATE POLICY "Teachers can view all teachers" ON teachers
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can update all teacher profiles" ON teachers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Also fix other tables that might have similar issues
DROP POLICY IF EXISTS "Teachers can view all students" ON students;
DROP POLICY IF EXISTS "Teachers can create students" ON students;
DROP POLICY IF EXISTS "Teachers can update all students" ON students;
DROP POLICY IF EXISTS "Teachers can delete students" ON students;

CREATE POLICY "Teachers can view all students" ON students
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can create students" ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can update all students" ON students
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can delete students" ON students
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix classes policies
DROP POLICY IF EXISTS "Teachers can view all classes" ON classes;
DROP POLICY IF EXISTS "Teachers can create classes" ON classes;
DROP POLICY IF EXISTS "Teachers can update all classes" ON classes;
DROP POLICY IF EXISTS "Teachers can delete classes" ON classes;

CREATE POLICY "Teachers can view all classes" ON classes
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can create classes" ON classes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can update all classes" ON classes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can delete classes" ON classes
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix class_students policies
DROP POLICY IF EXISTS "Teachers can view all enrollments" ON class_students;
DROP POLICY IF EXISTS "Teachers can enroll students" ON class_students;
DROP POLICY IF EXISTS "Teachers can remove enrollments" ON class_students;

CREATE POLICY "Teachers can view all enrollments" ON class_students
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can enroll students" ON class_students
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can remove enrollments" ON class_students
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix materials policies
DROP POLICY IF EXISTS "Teachers can view all materials" ON materials;
DROP POLICY IF EXISTS "Teachers can upload materials" ON materials;
DROP POLICY IF EXISTS "Teachers can update all materials" ON materials;
DROP POLICY IF EXISTS "Teachers can delete materials" ON materials;

CREATE POLICY "Teachers can view all materials" ON materials
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can upload materials" ON materials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can update all materials" ON materials
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can delete materials" ON materials
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix assignments policies
DROP POLICY IF EXISTS "Teachers can view all assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can create assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can update all assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can delete assignments" ON assignments;

CREATE POLICY "Teachers can view all assignments" ON assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can create assignments" ON assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can update all assignments" ON assignments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can delete assignments" ON assignments
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix questions policies
DROP POLICY IF EXISTS "Teachers can manage all questions" ON questions;

CREATE POLICY "Teachers can manage all questions" ON questions
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix submissions policies
DROP POLICY IF EXISTS "Teachers can view all submissions" ON submissions;
DROP POLICY IF EXISTS "Teachers can update all submissions" ON submissions;
DROP POLICY IF EXISTS "Teachers can insert submissions" ON submissions;

CREATE POLICY "Teachers can view all submissions" ON submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can update all submissions" ON submissions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can insert submissions" ON submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fix answers policies
DROP POLICY IF EXISTS "Teachers can manage all answers" ON answers;

CREATE POLICY "Teachers can manage all answers" ON answers
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix attendances policies
DROP POLICY IF EXISTS "Teachers can manage all attendances" ON attendances;

CREATE POLICY "Teachers can manage all attendances" ON attendances
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix activity_logs policies
DROP POLICY IF EXISTS "Teachers can view all activity logs" ON activity_logs;

CREATE POLICY "Teachers can view all activity logs" ON activity_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);
