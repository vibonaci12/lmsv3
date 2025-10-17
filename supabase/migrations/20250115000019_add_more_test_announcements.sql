-- Add more test announcements to ensure they appear in student classroom
-- Use existing teacher or create one if none exists

-- Add test announcements with proper structure
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
  'Pengumuman Penting: Ujian Semester',
  'Kepada seluruh siswa, diinformasikan bahwa ujian semester akan dilaksanakan pada tanggal 20-25 Maret 2024. Silakan persiapkan diri dengan baik dan jangan lupa membawa alat tulis yang diperlukan.',
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
  'Informasi Libur Semester',
  'Diberitahukan bahwa libur semester akan dimulai pada tanggal 1 April 2024. Selamat berlibur dan jangan lupa untuk tetap belajar di rumah.',
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
  'Pembaruan Jadwal Kelas',
  'Ada perubahan jadwal kelas untuk minggu depan. Silakan cek jadwal terbaru di aplikasi LMS. Terima kasih.',
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
  'Workshop Teknologi untuk Siswa',
  'Akan diadakan workshop teknologi untuk semua siswa pada tanggal 15 Maret 2024. Workshop ini gratis dan akan memberikan sertifikat. Daftar segera!',
  'announcement',
  'published',
  'students',
  'normal',
  (SELECT id FROM teachers LIMIT 1),
  (SELECT id FROM teachers LIMIT 1),
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '4 days'
)
ON CONFLICT (id) DO NOTHING;
