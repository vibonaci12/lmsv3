/*
  # Update Newsroom Table for File Upload
  
  This migration updates the newsroom table to use Supabase Storage
  for image uploads instead of external image URLs.
*/

-- ============================================
-- UPDATE NEWSROOM TABLE
-- ============================================

-- Add new columns for file storage
ALTER TABLE newsroom 
ADD COLUMN IF NOT EXISTS image_file_name TEXT,
ADD COLUMN IF NOT EXISTS image_file_path TEXT,
ADD COLUMN IF NOT EXISTS image_file_size INTEGER;

-- Keep image_url for backward compatibility but make it nullable
ALTER TABLE newsroom 
ALTER COLUMN image_url DROP NOT NULL;

-- Add constraint for file size (2MB = 2,097,152 bytes)
ALTER TABLE newsroom 
ADD CONSTRAINT check_image_file_size 
CHECK (image_file_size IS NULL OR image_file_size <= 2097152);

-- ============================================
-- CREATE STORAGE BUCKET
-- ============================================

-- Create storage bucket for newsroom images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'newsroom-images',
  'newsroom-images',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Allow teachers to upload images
CREATE POLICY "Teachers can upload newsroom images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'newsroom-images' 
  AND auth.uid() IS NOT NULL
);

-- Allow teachers to update their uploaded images
CREATE POLICY "Teachers can update newsroom images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'newsroom-images' 
  AND auth.uid() IS NOT NULL
);

-- Allow teachers to delete their uploaded images
CREATE POLICY "Teachers can delete newsroom images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'newsroom-images' 
  AND auth.uid() IS NOT NULL
);

-- Allow public to view images
CREATE POLICY "Public can view newsroom images" ON storage.objects
FOR SELECT USING (bucket_id = 'newsroom-images');

-- ============================================
-- INDEXES
-- ============================================

-- Add index for file path queries
CREATE INDEX IF NOT EXISTS idx_newsroom_image_file_path ON newsroom(image_file_path);
