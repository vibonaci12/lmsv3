-- Verify newsroom data exists
SELECT 'Checking newsroom table data:' as info;

-- Show all data in newsroom table
SELECT 
  id, 
  title, 
  type, 
  status, 
  target_audience, 
  created_at,
  created_by
FROM newsroom 
ORDER BY created_at DESC;

-- Count by type
SELECT 
  type,
  status,
  COUNT(*) as count
FROM newsroom 
GROUP BY type, status
ORDER BY type, status;

-- Check if we have any teachers
SELECT 'Teachers count:' as info, COUNT(*) as count FROM teachers;

-- If no data, add some basic data
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
  'Berita Test - Pembukaan Semester Baru',
  'Selamat datang di semester baru! Semoga semua siswa dapat mengikuti pembelajaran dengan baik.',
  'news',
  'published',
  'all',
  'normal',
  (SELECT id FROM teachers LIMIT 1),
  (SELECT id FROM teachers LIMIT 1),
  NOW(),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM newsroom WHERE type = 'news'
);

-- Add test announcement if none exists
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
  'Pengumuman Test - Jadwal Ujian',
  'Ujian semester akan dilaksanakan sesuai jadwal yang telah ditentukan. Silakan persiapkan diri dengan baik.',
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
  SELECT 1 FROM newsroom WHERE type = 'announcement'
);

-- Show final data
SELECT 'Final newsroom data:' as info;
SELECT 
  id, 
  title, 
  type, 
  status, 
  target_audience, 
  created_at
FROM newsroom 
ORDER BY created_at DESC;
