/*
  # Newsroom/Announcements Table
  
  This table stores announcements and news that teachers can create
  and students can view. Teachers have full CRUD access, students
  can only view published announcements.
*/

-- ============================================
-- NEWSROOM TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS newsroom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT, -- Short description for preview
  image_url TEXT, -- Online image link
  type TEXT NOT NULL CHECK (type IN ('announcement', 'news')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'teachers', 'students')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES teachers(id) NOT NULL,
  updated_by UUID REFERENCES teachers(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsroom_type ON newsroom(type);
CREATE INDEX IF NOT EXISTS idx_newsroom_status ON newsroom(status);
CREATE INDEX IF NOT EXISTS idx_newsroom_published_at ON newsroom(published_at);
CREATE INDEX IF NOT EXISTS idx_newsroom_created_by ON newsroom(created_by);
CREATE INDEX IF NOT EXISTS idx_newsroom_target_audience ON newsroom(target_audience);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE newsroom ENABLE ROW LEVEL SECURITY;

-- Teachers can do everything (CRUD)
CREATE POLICY "Teachers can manage all newsroom" ON newsroom
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Students can only view published announcements/news
CREATE POLICY "Students can view published newsroom" ON newsroom
  FOR SELECT
  TO anon
  USING (status = 'published' AND (target_audience = 'all' OR target_audience = 'students'));

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_newsroom_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_newsroom_updated_at
  BEFORE UPDATE ON newsroom
  FOR EACH ROW
  EXECUTE FUNCTION update_newsroom_updated_at();

-- Function to set published_at when status changes to published
CREATE OR REPLACE FUNCTION set_newsroom_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set published_at
CREATE TRIGGER trigger_set_newsroom_published_at
  BEFORE UPDATE ON newsroom
  FOR EACH ROW
  EXECUTE FUNCTION set_newsroom_published_at();
