-- Check RLS policies for newsroom table
SELECT '=== CHECKING RLS POLICIES ===' as info;

-- Check if RLS is enabled on newsroom table
SELECT 'RLS enabled on newsroom:' as info, 
  relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'newsroom';

-- Show all RLS policies for newsroom table
SELECT 'RLS policies for newsroom:' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'newsroom';

-- Check if there are any policies at all
SELECT 'All policies count:' as info, COUNT(*) as count 
FROM pg_policies 
WHERE tablename = 'newsroom';

-- Test direct query without RLS (as superuser)
SELECT 'Direct query test (should work):' as info;
SELECT COUNT(*) as count FROM newsroom;

-- Check current user and permissions
SELECT 'Current user info:' as info;
SELECT 
  current_user as current_user,
  session_user as session_user,
  current_setting('role') as current_role;

-- Check if we can select from newsroom as current user
SELECT 'Can select from newsroom:' as info;
SELECT COUNT(*) as count FROM newsroom WHERE type = 'announcement';
