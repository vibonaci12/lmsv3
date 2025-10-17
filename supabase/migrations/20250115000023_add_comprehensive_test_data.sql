-- Add comprehensive test data to newsroom table
-- This ensures both news and announcements appear in the application

-- First, ensure we have a teacher to reference
-- If no teachers exist, we'll create a dummy one for testing
INSERT INTO teachers (id, full_name, email, created_at)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  'Guru Test',
  'guru@test.com',
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM teachers LIMIT 1);

-- Add comprehensive news data
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
(
  gen_random_uuid(),
  'Pembukaan Semester Baru 2024',
  'Selamat datang di semester baru! Kami berharap semua siswa dapat mengikuti pembelajaran dengan baik dan mencapai prestasi yang gemilang. Mari kita mulai semester ini dengan semangat yang tinggi!',
  'Pembukaan semester baru dengan berbagai program menarik untuk siswa',
  'news',
  'published',
  'all',
  'high',
  (SELECT id FROM teachers LIMIT 1),
  (SELECT id FROM teachers LIMIT 1),
  NOW(),
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Program Beasiswa Prestasi',
  'Dibuka pendaftaran program beasiswa prestasi untuk siswa berprestasi. Program ini memberikan bantuan biaya pendidikan dan fasilitas tambahan untuk mendukung pembelajaran.',
  'Program beasiswa untuk siswa berprestasi',
  'news',
  'published',
  'all',
  'normal',
  (SELECT id FROM teachers LIMIT 1),
  (SELECT id FROM teachers LIMIT 1),
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),
(
  gen_random_uuid(),
  'Workshop Teknologi Digital',
  'Akan diadakan workshop teknologi digital untuk semua siswa. Workshop ini akan membahas tentang penggunaan teknologi dalam pembelajaran dan persiapan menghadapi era digital.',
  'Workshop teknologi digital untuk siswa',
  'news',
  'published',
  'students',
  'normal',
  (SELECT id FROM teachers LIMIT 1),
  (SELECT id FROM teachers LIMIT 1),
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
)
ON CONFLICT (id) DO NOTHING;

-- Add comprehensive announcement data
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
) VALUES 
(
  gen_random_uuid(),
  'Jadwal Ujian Tengah Semester',
  'Kepada seluruh siswa, diinformasikan bahwa ujian tengah semester akan dilaksanakan pada tanggal 15-20 Maret 2024. Silakan persiapkan diri dengan baik dan jangan lupa membawa alat tulis yang diperlukan.',
  'announcement',
  'published',
  'students',
  'high',
  (SELECT id FROM teachers LIMIT 1),
  (SELECT id FROM teachers LIMIT 1),
  NOW(),
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Libur Semester Genap',
  'Diberitahukan bahwa libur semester genap akan dimulai pada tanggal 1 April 2024. Selamat berlibur dan jangan lupa untuk tetap belajar di rumah.',
  'announcement',
  'published',
  'all',
  'normal',
  (SELECT id FROM teachers LIMIT 1),
  (SELECT id FROM teachers LIMIT 1),
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),
(
  gen_random_uuid(),
  'Perubahan Jadwal Kelas',
  'Ada perubahan jadwal kelas untuk minggu depan. Silakan cek jadwal terbaru di aplikasi LMS. Terima kasih atas perhatiannya.',
  'announcement',
  'published',
  'students',
  'normal',
  (SELECT id FROM teachers LIMIT 1),
  (SELECT id FROM teachers LIMIT 1),
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
),
(
  gen_random_uuid(),
  'Reminder: Tugas Akhir Semester',
  'Bagi siswa kelas 12, jangan lupa untuk mengumpulkan tugas akhir semester sebelum deadline yang telah ditentukan. Hubungi guru pembimbing jika ada kendala.',
  'announcement',
  'published',
  'students',
  'urgent',
  (SELECT id FROM teachers LIMIT 1),
  (SELECT id FROM teachers LIMIT 1),
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
),
(
  gen_random_uuid(),
  'Pembaruan Sistem LMS',
  'Sistem LMS telah diperbarui dengan fitur-fitur baru. Silakan eksplorasi dan manfaatkan fitur-fitur tersebut untuk pembelajaran yang lebih baik.',
  'announcement',
  'published',
  'all',
  'normal',
  (SELECT id FROM teachers LIMIT 1),
  (SELECT id FROM teachers LIMIT 1),
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '4 days'
)
ON CONFLICT (id) DO NOTHING;

-- Show final data count
SELECT 'Final newsroom data count:' as info;
SELECT 
  type,
  status,
  target_audience,
  COUNT(*) as count
FROM newsroom 
GROUP BY type, status, target_audience
ORDER BY type, status, target_audience;
