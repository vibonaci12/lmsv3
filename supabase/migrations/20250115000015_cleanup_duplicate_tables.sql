-- Clean up duplicate tables and ensure consistent database structure
-- This migration removes the separate announcements table and ensures all content is in newsroom

-- Drop the announcements table completely (if it exists)
DROP TABLE IF EXISTS announcements CASCADE;

-- Ensure newsroom table has all necessary columns and constraints
ALTER TABLE newsroom ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'news';

-- Add constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'newsroom_type_check') THEN
        ALTER TABLE newsroom ADD CONSTRAINT newsroom_type_check CHECK (type IN ('announcement', 'news'));
    END IF;
END $$;

-- Ensure status column exists and has proper constraint
ALTER TABLE newsroom ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'newsroom_status_check') THEN
        ALTER TABLE newsroom ADD CONSTRAINT newsroom_status_check CHECK (status IN ('draft', 'published', 'archived'));
    END IF;
END $$;

-- Ensure priority column exists and has proper constraint
ALTER TABLE newsroom ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'newsroom_priority_check') THEN
        ALTER TABLE newsroom ADD CONSTRAINT newsroom_priority_check CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
    END IF;
END $$;

-- Ensure target_audience column exists and has proper constraint
ALTER TABLE newsroom ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'all';
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'newsroom_target_audience_check') THEN
        ALTER TABLE newsroom ADD CONSTRAINT newsroom_target_audience_check CHECK (target_audience IN ('all', 'teachers', 'students'));
    END IF;
END $$;

-- Ensure published_at column exists
ALTER TABLE newsroom ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Ensure created_by and updated_by columns exist
ALTER TABLE newsroom ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES teachers(id);
ALTER TABLE newsroom ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES teachers(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsroom_type ON newsroom(type);
CREATE INDEX IF NOT EXISTS idx_newsroom_status ON newsroom(status);
CREATE INDEX IF NOT EXISTS idx_newsroom_published_at ON newsroom(published_at);
CREATE INDEX IF NOT EXISTS idx_newsroom_created_by ON newsroom(created_by);
CREATE INDEX IF NOT EXISTS idx_newsroom_target_audience ON newsroom(target_audience);

-- Update RLS policies for newsroom to handle both types
DROP POLICY IF EXISTS "Teachers can manage all newsroom" ON newsroom;
DROP POLICY IF EXISTS "Students can view published newsroom" ON newsroom;

CREATE POLICY "Teachers can manage all newsroom" ON newsroom
  FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Students can view published newsroom" ON newsroom
  FOR SELECT
  TO authenticated
  USING (status = 'published' AND (target_audience = 'all' OR target_audience = 'students'));

-- Clean up any orphaned storage policies for announcements (if storage.policies exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'policies') THEN
        DELETE FROM storage.policies WHERE bucket_id = 'announcement-images' AND policyname LIKE '%announcement%';
    END IF;
END $$;

-- Ensure newsroom-images bucket exists and has proper policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('newsroom-images', 'newsroom-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for newsroom images
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anyone can view newsroom images') THEN
        CREATE POLICY "Anyone can view newsroom images" ON storage.objects
          FOR SELECT
          TO anon, authenticated
          USING (bucket_id = 'newsroom-images');
    END IF;
END $$;
