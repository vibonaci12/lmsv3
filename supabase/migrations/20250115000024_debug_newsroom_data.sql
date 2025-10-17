-- Debug newsroom data to see what's actually in the database
SELECT '=== DEBUGGING NEWSROOM DATA ===' as info;

-- Check if newsroom table exists and has data
SELECT 'Newsroom table exists:' as info, 
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'newsroom') as table_exists;

-- Count total records
SELECT 'Total records in newsroom:' as info, COUNT(*) as count FROM newsroom;

-- Show all data with details
SELECT 'All newsroom data:' as info;
SELECT 
  id,
  title,
  type,
  status,
  target_audience,
  priority,
  created_at,
  created_by
FROM newsroom 
ORDER BY created_at DESC;

-- Check if we have any teachers
SELECT 'Teachers count:' as info, COUNT(*) as count FROM teachers;
SELECT 'Teachers data:' as info;
SELECT id, full_name, email FROM teachers LIMIT 5;

-- Check if there are any announcements specifically
SELECT 'Announcements count:' as info, COUNT(*) as count 
FROM newsroom 
WHERE type = 'announcement';

-- Check if there are any published announcements
SELECT 'Published announcements count:' as info, COUNT(*) as count 
FROM newsroom 
WHERE type = 'announcement' AND status = 'published';

-- Check if there are any announcements for students
SELECT 'Student announcements count:' as info, COUNT(*) as count 
FROM newsroom 
WHERE type = 'announcement' 
  AND status = 'published' 
  AND target_audience IN ('all', 'students');

-- Show specific announcement data
SELECT 'Student announcements data:' as info;
SELECT 
  id,
  title,
  type,
  status,
  target_audience,
  created_at
FROM newsroom 
WHERE type = 'announcement' 
  AND status = 'published' 
  AND target_audience IN ('all', 'students')
ORDER BY created_at DESC;

-- Check if there are any news items
SELECT 'News count:' as info, COUNT(*) as count 
FROM newsroom 
WHERE type = 'news';

-- Show news data
SELECT 'News data:' as info;
SELECT 
  id,
  title,
  type,
  status,
  target_audience,
  created_at
FROM newsroom 
WHERE type = 'news'
ORDER BY created_at DESC;
