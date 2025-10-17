-- Add test announcements data
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
  'Selamat Datang di Semester Baru!',
  'Selamat datang di semester baru! Kami berharap semua siswa dapat mengikuti pembelajaran dengan baik dan mencapai prestasi yang gemilang.',
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
  'Jadwal Ujian Tengah Semester',
  'Ujian Tengah Semester akan dilaksanakan pada tanggal 15-20 Maret 2024. Silakan persiapkan diri dengan baik.',
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
  'Pembaruan Sistem LMS',
  'Sistem LMS telah diperbarui dengan fitur-fitur baru. Silakan eksplorasi dan manfaatkan fitur-fitur tersebut untuk pembelajaran yang lebih baik.',
  'announcement',
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
