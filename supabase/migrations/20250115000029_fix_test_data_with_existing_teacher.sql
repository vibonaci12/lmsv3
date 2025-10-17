-- Fix test data by using existing teacher or creating proper user
SELECT '=== FIXING TEST DATA WITH EXISTING TEACHER ===' as info;

-- First, check if we have any existing teachers
SELECT 'Existing teachers:' as info;
SELECT id, full_name, email FROM teachers LIMIT 5;

-- Get the first existing teacher ID, or create a dummy one
DO $$
DECLARE
    teacher_id UUID;
BEGIN
    -- Try to get an existing teacher
    SELECT id INTO teacher_id FROM teachers LIMIT 1;
    
    -- If no teacher exists, we'll use a dummy UUID that won't cause foreign key issues
    IF teacher_id IS NULL THEN
        teacher_id := '00000000-0000-0000-0000-000000000001';
        RAISE NOTICE 'No existing teacher found, using dummy ID: %', teacher_id;
    ELSE
        RAISE NOTICE 'Using existing teacher ID: %', teacher_id;
    END IF;
    
    -- Clear existing test data
    DELETE FROM newsroom WHERE title LIKE '%Test%' OR title LIKE '%Pembukaan%' OR title LIKE '%Program%' OR title LIKE '%Workshop%' OR title LIKE '%Jadwal%' OR title LIKE '%Libur%' OR title LIKE '%Perubahan%' OR title LIKE '%Reminder%' OR title LIKE '%Pembaruan%';
    
    -- Insert fresh test data using the teacher ID
    INSERT INTO newsroom (
      id,
      title,
      content,
      excerpt,
      type,
      status,
      target_audience,
      priority,
      created_by,
      updated_by,
      created_at,
      updated_at,
      published_at
    ) VALUES 
    -- News items
    (
      gen_random_uuid(),
      'Pembukaan Semester Baru 2024',
      'Selamat datang di semester baru! Kami berharap semua siswa dapat mengikuti pembelajaran dengan baik dan mencapai prestasi yang gemilang.',
      'Pembukaan semester baru dengan berbagai program menarik',
      'news',
      'published',
      'all',
      'high',
      teacher_id,
      teacher_id,
      NOW(),
      NOW(),
      NOW()
    ),
    (
      gen_random_uuid(),
      'Program Beasiswa Prestasi',
      'Dibuka pendaftaran program beasiswa prestasi untuk siswa berprestasi. Program ini memberikan bantuan biaya pendidikan.',
      'Program beasiswa untuk siswa berprestasi',
      'news',
      'published',
      'all',
      'normal',
      teacher_id,
      teacher_id,
      NOW() - INTERVAL '1 day',
      NOW() - INTERVAL '1 day',
      NOW() - INTERVAL '1 day'
    ),
    -- Announcement items
    (
      gen_random_uuid(),
      'Jadwal Ujian Tengah Semester',
      'Kepada seluruh siswa, diinformasikan bahwa ujian tengah semester akan dilaksanakan pada tanggal 15-20 Maret 2024.',
      'Jadwal ujian tengah semester',
      'announcement',
      'published',
      'students',
      'high',
      teacher_id,
      teacher_id,
      NOW(),
      NOW(),
      NOW()
    ),
    (
      gen_random_uuid(),
      'Libur Semester Genap',
      'Diberitahukan bahwa libur semester genap akan dimulai pada tanggal 1 April 2024. Selamat berlibur!',
      'Libur semester genap',
      'announcement',
      'published',
      'all',
      'normal',
      teacher_id,
      teacher_id,
      NOW() - INTERVAL '1 day',
      NOW() - INTERVAL '1 day',
      NOW() - INTERVAL '1 day'
    ),
    (
      gen_random_uuid(),
      'Perubahan Jadwal Kelas',
      'Ada perubahan jadwal kelas untuk minggu depan. Silakan cek jadwal terbaru di aplikasi LMS.',
      'Perubahan jadwal kelas',
      'announcement',
      'published',
      'students',
      'normal',
      teacher_id,
      teacher_id,
      NOW() - INTERVAL '2 days',
      NOW() - INTERVAL '2 days',
      NOW() - INTERVAL '2 days'
    );
    
    RAISE NOTICE 'Test data inserted successfully with teacher ID: %', teacher_id;
END $$;

-- Verify the data
SELECT 'Final verification:' as info;
SELECT 
  type,
  status,
  target_audience,
  COUNT(*) as count
FROM newsroom 
GROUP BY type, status, target_audience
ORDER BY type, status, target_audience;

-- Show specific data
SELECT 'News items:' as info;
SELECT id, title, type, status, target_audience FROM newsroom WHERE type = 'news' ORDER BY created_at DESC;

SELECT 'Announcement items:' as info;
SELECT id, title, type, status, target_audience FROM newsroom WHERE type = 'announcement' ORDER BY created_at DESC;

-- Test the exact query that the app uses
SELECT 'Test query for announcements:' as info;
SELECT 
  id,
  title,
  content,
  created_at,
  created_by
FROM newsroom
WHERE type = 'announcement'
  AND status = 'published'
  AND target_audience IN ('all', 'students')
ORDER BY created_at DESC
LIMIT 10;
