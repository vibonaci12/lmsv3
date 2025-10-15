-- Test Authentication System
-- Run these queries in Supabase SQL Editor to test the authentication

-- ============================================
-- TEST TEACHER AUTHENTICATION
-- ============================================

-- 1. Check if triggers are working
-- (This will be tested when a real user registers via Supabase Auth)

-- 2. Test teacher helper functions
SELECT 'Testing teacher functions...' as test;

-- Check if user is teacher (will return false for now since no auth context)
SELECT is_teacher() as is_teacher_result;

-- ============================================
-- TEST STUDENT AUTHENTICATION
-- ============================================

-- 1. Test student authentication with sample data
SELECT 'Testing student authentication...' as test;

-- Try to authenticate sample student
SELECT * FROM authenticate_student('ahmadr0612@s.school', '12062005');

-- 2. Test student helper functions
SELECT 'Testing student helper functions...' as test;

-- Get student by email
SELECT * FROM get_student_by_email('ahmadr0612@s.school');

-- Get student's enrolled classes
SELECT * FROM get_student_classes('650e8400-e29b-41d4-a716-446655440001');

-- ============================================
-- TEST STUDENT CREATION
-- ============================================

-- Create a new test student
SELECT 'Creating test student...' as test;

SELECT create_student(
  'teststudent@s.school',
  'Test Student',
  '2005-01-01',
  '01012005',  -- Birth date as password
  'Test Address',
  NULL  -- No created_by for now
) as new_student_id;

-- Test authentication of new student
SELECT * FROM authenticate_student('teststudent@s.school', '01012005');

-- ============================================
-- TEST PASSWORD UPDATE
-- ============================================

-- Update student password
SELECT 'Testing password update...' as test;

SELECT update_student_password(
  '650e8400-e29b-41d4-a716-446655440001',  -- Ahmad Rizki's ID
  '12062005',  -- Old password (birth date)
  '13062005'   -- New password
) as password_updated;

-- Test authentication with new password
SELECT * FROM authenticate_student('ahmadr0612@s.school', '13062005');

-- ============================================
-- VERIFY DATABASE STATE
-- ============================================

-- Check all teachers
SELECT 'Teachers in database:' as info;
SELECT id, full_name, email, created_at FROM teachers;

-- Check all students
SELECT 'Students in database:' as info;
SELECT id, full_name, email, birth_date, is_active FROM students;

-- Check enrollments
SELECT 'Student enrollments:' as info;
SELECT 
  s.full_name as student_name,
  c.name as class_name,
  c.grade,
  cs.enrolled_at
FROM class_students cs
JOIN students s ON cs.student_id = s.id
JOIN classes c ON cs.class_id = c.id;

-- Check triggers
SELECT 'Active triggers:' as info;
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%auth_user%';

-- Check functions
SELECT 'Authentication functions:' as info;
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%student%' 
  OR routine_name LIKE '%teacher%'
  OR routine_name LIKE '%handle_%'
ORDER BY routine_name;
