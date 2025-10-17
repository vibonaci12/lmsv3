-- Fix database structure: Use newsroom table for both news and announcements
-- Drop the separate announcements table to avoid confusion

-- Drop the announcements table (we'll use newsroom for both)
DROP TABLE IF EXISTS announcements CASCADE;

-- Update newsroom table to ensure it has all necessary columns
ALTER TABLE newsroom ADD COLUMN IF NOT EXISTS image_file_name TEXT;
ALTER TABLE newsroom ADD COLUMN IF NOT EXISTS image_file_path TEXT;
ALTER TABLE newsroom ADD COLUMN IF NOT EXISTS image_file_size INTEGER;

-- Ensure the type column exists and has proper constraints
ALTER TABLE newsroom DROP CONSTRAINT IF EXISTS newsroom_type_check;
ALTER TABLE newsroom ADD CONSTRAINT newsroom_type_check CHECK (type IN ('announcement', 'news'));

-- Update RLS policies for newsroom table
DROP POLICY IF EXISTS "Teachers can manage all newsroom" ON newsroom;
DROP POLICY IF EXISTS "Students can view published newsroom" ON newsroom;

-- Create new RLS policies
CREATE POLICY "Teachers can manage all newsroom" ON newsroom
  FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Students can view published newsroom" ON newsroom
  FOR SELECT
  TO anon
  USING (
    status = 'published' AND 
    (target_audience = 'all' OR target_audience = 'students')
  );

-- Create storage bucket for newsroom images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('newsroom-images', 'newsroom-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for newsroom images
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anyone can view newsroom images') THEN
        CREATE POLICY "Anyone can view newsroom images" ON storage.objects
          FOR SELECT USING (bucket_id = 'newsroom-images');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Teachers can upload newsroom images') THEN
        CREATE POLICY "Teachers can upload newsroom images" ON storage.objects
          FOR INSERT WITH CHECK (bucket_id = 'newsroom-images' AND auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Teachers can update newsroom images') THEN
        CREATE POLICY "Teachers can update newsroom images" ON storage.objects
          FOR UPDATE USING (bucket_id = 'newsroom-images' AND auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Teachers can delete newsroom images') THEN
        CREATE POLICY "Teachers can delete newsroom images" ON storage.objects
          FOR DELETE USING (bucket_id = 'newsroom-images' AND auth.uid() IS NOT NULL);
    END IF;
END $$;
