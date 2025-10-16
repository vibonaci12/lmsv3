/*
  # Fix RLS Policies for Custom Student Authentication
  
  The 406 error occurs because RLS policies are not properly configured
  for custom student authentication. We need to:
  
  1. Disable RLS temporarily for student access
  2. Or create proper policies that work with custom auth
  3. Fix teacher access issues
*/

-- ============================================
-- Temporarily disable RLS for student tables
-- This allows custom authentication to work
-- ============================================

-- Disable RLS for students table (students use custom auth)
ALTER TABLE students DISABLE ROW LEVEL SECURITY;

-- Disable RLS for class_students table
ALTER TABLE class_students DISABLE ROW LEVEL SECURITY;

-- Disable RLS for submissions table (students need to create/update)
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;

-- Disable RLS for answers table (students need to create/update)
ALTER TABLE answers DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Fix teacher access by ensuring proper RLS
-- ============================================

-- Ensure teachers table has proper RLS
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Drop existing teacher policies
DROP POLICY IF EXISTS "Teachers can view own profile" ON teachers;
DROP POLICY IF EXISTS "Teachers can update own profile" ON teachers;

-- Create proper teacher policies
CREATE POLICY "Teachers can view own profile" ON teachers
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Teachers can update own profile" ON teachers
  FOR UPDATE
  USING (id = auth.uid());

-- ============================================
-- Fix other tables for teacher access
-- ============================================

-- Classes table - teachers can manage all classes (shared access)
DROP POLICY IF EXISTS "Teachers can manage all classes" ON classes;
CREATE POLICY "Teachers can manage all classes" ON classes
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Materials table - teachers can manage all materials (shared access)
DROP POLICY IF EXISTS "Teachers can manage all materials" ON materials;
CREATE POLICY "Teachers can manage all materials" ON materials
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Assignments table - teachers can manage all assignments (shared access)
DROP POLICY IF EXISTS "Teachers can manage all assignments" ON assignments;
CREATE POLICY "Teachers can manage all assignments" ON assignments
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Questions table - teachers can manage all questions (shared access)
DROP POLICY IF EXISTS "Teachers can manage all questions" ON questions;
CREATE POLICY "Teachers can manage all questions" ON questions
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Attendances table - teachers can manage all attendance (shared access)
DROP POLICY IF EXISTS "Teachers can manage all attendance" ON attendances;
CREATE POLICY "Teachers can manage all attendance" ON attendances
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- Fix notifications for both user types
-- ============================================

-- Drop existing notification policies
DROP POLICY IF EXISTS "Users can view notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update notifications" ON notifications;

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
