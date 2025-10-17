-- Fix RLS policies for newsroom table to ensure data is accessible
SELECT '=== FIXING NEWSROOM RLS POLICIES ===' as info;

-- First, let's see what policies exist
SELECT 'Current policies:' as info;
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'newsroom';

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Teachers can view all newsroom items" ON newsroom;
DROP POLICY IF EXISTS "Teachers can insert newsroom items" ON newsroom;
DROP POLICY IF EXISTS "Teachers can update their own newsroom items" ON newsroom;
DROP POLICY IF EXISTS "Teachers can delete their own newsroom items" ON newsroom;
DROP POLICY IF EXISTS "Students can view published newsroom items" ON newsroom;
DROP POLICY IF EXISTS "Public can view published newsroom items" ON newsroom;

-- Create comprehensive RLS policies for newsroom table

-- 1. Teachers can view all newsroom items (including drafts)
CREATE POLICY "Teachers can view all newsroom items" ON newsroom
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM teachers)
  );

-- 2. Teachers can insert newsroom items
CREATE POLICY "Teachers can insert newsroom items" ON newsroom
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT id FROM teachers) AND
    created_by = auth.uid()
  );

-- 3. Teachers can update their own newsroom items
CREATE POLICY "Teachers can update their own newsroom items" ON newsroom
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM teachers) AND
    created_by = auth.uid()
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM teachers) AND
    updated_by = auth.uid()
  );

-- 4. Teachers can delete their own newsroom items
CREATE POLICY "Teachers can delete their own newsroom items" ON newsroom
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM teachers) AND
    created_by = auth.uid()
  );

-- 5. Students can view published newsroom items
CREATE POLICY "Students can view published newsroom items" ON newsroom
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM students) AND
    status = 'published' AND
    target_audience IN ('all', 'students')
  );

-- 6. Public can view published newsroom items (for unauthenticated access if needed)
CREATE POLICY "Public can view published newsroom items" ON newsroom
  FOR SELECT
  TO anon
  USING (
    status = 'published' AND
    target_audience IN ('all', 'students')
  );

-- Verify policies were created
SELECT 'New policies created:' as info;
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'newsroom';

-- Test the policies
SELECT 'Testing policies:' as info;
SELECT 'Total newsroom items:' as test, COUNT(*) as count FROM newsroom;
SELECT 'Published items:' as test, COUNT(*) as count FROM newsroom WHERE status = 'published';
SELECT 'Announcements:' as test, COUNT(*) as count FROM newsroom WHERE type = 'announcement';
SELECT 'Published announcements:' as test, COUNT(*) as count FROM newsroom WHERE type = 'announcement' AND status = 'published';
