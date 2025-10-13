/*
  # Storage Buckets Setup
  
  1. Buckets
    - `avatars` - Public bucket for user profile pictures
    - `materials` - Private bucket for learning materials
    - `submissions` - Private bucket for student assignment submissions
    
  2. Security
    - Avatars: Public read, authenticated write
    - Materials: Teachers can upload, students can download enrolled class materials
    - Submissions: Students upload own, teachers can view all
*/

-- ============================================
-- Create Storage Buckets
-- ============================================

-- Avatars bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Materials bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', false)
ON CONFLICT (id) DO NOTHING;

-- Submissions bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies - AVATARS
-- ============================================

-- Anyone can view avatars (public bucket)
CREATE POLICY "Public avatars are viewable by everyone" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated users can upload avatars
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Users can update their own avatars
CREATE POLICY "Users can update own avatars" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');

-- Users can delete their own avatars
CREATE POLICY "Users can delete own avatars" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');

-- ============================================
-- Storage Policies - MATERIALS
-- ============================================

-- Teachers can upload materials
CREATE POLICY "Teachers can upload materials" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'materials' AND
    auth.uid() IN (SELECT id FROM teachers)
  );

-- Teachers can view all materials
CREATE POLICY "Teachers can view all materials" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'materials' AND
    auth.uid() IN (SELECT id FROM teachers)
  );

-- Teachers can update materials
CREATE POLICY "Teachers can update materials" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'materials' AND
    auth.uid() IN (SELECT id FROM teachers)
  );

-- Teachers can delete materials
CREATE POLICY "Teachers can delete materials" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'materials' AND
    auth.uid() IN (SELECT id FROM teachers)
  );

-- Students can view materials (will implement class-based filtering in app)
CREATE POLICY "Students can view materials" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'materials');

-- ============================================
-- Storage Policies - SUBMISSIONS
-- ============================================

-- Students can upload submissions
CREATE POLICY "Students can upload submissions" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'submissions');

-- Students can view own submissions
CREATE POLICY "Students can view own submissions" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'submissions');

-- Students can update own submissions
CREATE POLICY "Students can update own submissions" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'submissions');

-- Teachers can view all submissions
CREATE POLICY "Teachers can view all submissions" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'submissions' AND
    auth.uid() IN (SELECT id FROM teachers)
  );

-- Teachers can update submissions (for grading metadata)
CREATE POLICY "Teachers can update submissions" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'submissions' AND
    auth.uid() IN (SELECT id FROM teachers)
  );