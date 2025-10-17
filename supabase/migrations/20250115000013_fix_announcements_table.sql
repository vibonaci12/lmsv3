-- Create announcements table if it doesn't exist, or add missing columns
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  image_file_name TEXT,
  image_file_path TEXT,
  image_file_size INTEGER,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'teachers', 'students')),
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES teachers(id) NOT NULL,
  updated_by UUID REFERENCES teachers(id)
);

-- Add missing columns if they don't exist
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'));
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_file_name TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_file_path TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_file_size INTEGER;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'teachers', 'students'));
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES teachers(id);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES teachers(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements(published_at);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_announcements_target_audience ON announcements(target_audience);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);

-- Enable RLS if not already enabled
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'announcements' AND policyname = 'Teachers can manage all announcements') THEN
        CREATE POLICY "Teachers can manage all announcements" ON announcements
          FOR ALL
          USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'announcements' AND policyname = 'Students can view published announcements') THEN
        CREATE POLICY "Students can view published announcements" ON announcements
          FOR SELECT
          TO anon
          USING (status = 'published' AND (target_audience = 'all' OR target_audience = 'students'));
    END IF;
END $$;

-- Create storage bucket for announcement images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcement-images', 'announcement-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for announcement images
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anyone can view announcement images') THEN
        CREATE POLICY "Anyone can view announcement images" ON storage.objects
          FOR SELECT USING (bucket_id = 'announcement-images');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Teachers can upload announcement images') THEN
        CREATE POLICY "Teachers can upload announcement images" ON storage.objects
          FOR INSERT WITH CHECK (bucket_id = 'announcement-images' AND auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Teachers can update announcement images') THEN
        CREATE POLICY "Teachers can update announcement images" ON storage.objects
          FOR UPDATE USING (bucket_id = 'announcement-images' AND auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Teachers can delete announcement images') THEN
        CREATE POLICY "Teachers can delete announcement images" ON storage.objects
          FOR DELETE USING (bucket_id = 'announcement-images' AND auth.uid() IS NOT NULL);
    END IF;
END $$;
