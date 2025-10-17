-- Check and ensure we have proper data in newsroom table
-- First, let's see what's in the newsroom table
SELECT 'Current newsroom data:' as info;
SELECT id, title, type, status, target_audience, created_at FROM newsroom ORDER BY created_at DESC;

-- If no data exists, let's add some test data
INSERT INTO newsroom (
  id,
  title,
  content,
  type,
  status,
  target_audience,
  priority,
  created_by,
  updated_by,
  created_at,
  updated_at,
  published_at
) 
SELECT 
  gen_random_uuid(),
  'Pengumuman Test - Ujian Semester',
  'Ini adalah pengumuman test untuk memastikan data muncul di halaman siswa. Ujian semester akan dilaksanakan sesuai jadwal yang telah ditentukan.',
  'announcement',
  'published',
  'students',
  'high',
  (SELECT id FROM teachers LIMIT 1),
  (SELECT id FROM teachers LIMIT 1),
  NOW(),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM newsroom WHERE type = 'announcement' AND status = 'published'
);

-- Add another announcement for 'all' audience
INSERT INTO newsroom (
  id,
  title,
  content,
  type,
  status,
  target_audience,
  priority,
  created_by,
  updated_by,
  created_at,
  updated_at,
  published_at
) 
SELECT 
  gen_random_uuid(),
  'Pengumuman Umum - Libur Semester',
  'Diberitahukan kepada seluruh warga sekolah bahwa libur semester akan dimulai pada tanggal yang telah ditentukan.',
  'announcement',
  'published',
  'all',
  'normal',
  (SELECT id FROM teachers LIMIT 1),
  (SELECT id FROM teachers LIMIT 1),
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (
  SELECT 1 FROM newsroom WHERE type = 'announcement' AND target_audience = 'all'
);

-- Show final data
SELECT 'Final newsroom data:' as info;
SELECT id, title, type, status, target_audience, created_at FROM newsroom WHERE type = 'announcement' ORDER BY created_at DESC;
