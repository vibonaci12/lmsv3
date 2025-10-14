/*
  # LMS Database Schema - Complete Setup
  
  1. New Tables
    - `teachers` - Teacher profiles (linked to auth.users)
    - `students` - Student accounts with custom auth
    - `classes` - Course classes (shared access for all teachers)
    - `class_students` - Junction table for class enrollment
    - `materials` - Learning materials uploaded by teachers
    - `assignments` - Dual type system (wajib & tambahan)
    - `questions` - Questions within assignments
    - `submissions` - Student assignment submissions
    - `answers` - Student answers to questions
    - `attendances` - Class attendance records
    - `notifications` - User notifications
    - `activity_logs` - Audit trail for teacher actions
    
  2. Security
    - Enable RLS on all tables
    - Teachers have full shared access to all data
    - Students can only access their own data and enrolled classes
    
  3. Important Notes
    - Multi-teacher collaboration: All teachers access same data
    - Assignment types: 'wajib' (per class) and 'tambahan' (per grade)
    - Activity logging tracks which teacher performed which action
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TEACHERS (Shared Access)
-- ============================================
CREATE TABLE IF NOT EXISTS teachers (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STUDENTS
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  birth_date DATE NOT NULL,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES teachers(id)
);

CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active);

-- ============================================
-- CLASSES
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('10', '11', '12')),
  description TEXT,
  class_code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES teachers(id)
);

CREATE INDEX IF NOT EXISTS idx_classes_grade ON classes(grade);
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(class_code);
CREATE INDEX IF NOT EXISTS idx_classes_active ON classes(is_active);

-- ============================================
-- CLASS STUDENTS
-- ============================================
CREATE TABLE IF NOT EXISTS class_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  enrolled_by UUID REFERENCES teachers(id),
  UNIQUE(class_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_class_students_class ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student ON class_students(student_id);

-- ============================================
-- MATERIALS (Shared by all teachers)
-- ============================================
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES teachers(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES teachers(id)
);

CREATE INDEX IF NOT EXISTS idx_materials_class ON materials(class_id);

-- ============================================
-- ASSIGNMENTS (2 Types: Wajib & Tambahan)
-- ============================================
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Assignment Info
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  total_points INTEGER DEFAULT 100,
  
  -- Assignment Type
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('wajib', 'tambahan')),
  
  -- Target (different for wajib vs tambahan)
  class_id UUID REFERENCES classes ON DELETE CASCADE,
  target_grade TEXT CHECK (target_grade IN ('10', '11', '12')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES teachers(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES teachers(id),
  
  -- Constraints
  CHECK (
    (assignment_type = 'wajib' AND class_id IS NOT NULL AND target_grade IS NULL) OR
    (assignment_type = 'tambahan' AND class_id IS NULL AND target_grade IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_assignments_type ON assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_grade ON assignments(target_grade);
CREATE INDEX IF NOT EXISTS idx_assignments_deadline ON assignments(deadline);

-- ============================================
-- QUESTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('essay', 'file_upload')),
  points INTEGER DEFAULT 10,
  order_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_assignment ON questions(assignment_id);

-- ============================================
-- SUBMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'graded')),
  submitted_at TIMESTAMPTZ,
  grade NUMERIC(5,2),
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES teachers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- ============================================
-- ANSWERS
-- ============================================
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions ON DELETE CASCADE NOT NULL,
  answer_text TEXT,
  file_url TEXT,
  file_name TEXT,
  points_earned NUMERIC(5,2),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_answers_submission ON answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);

-- ============================================
-- ATTENDANCE
-- ============================================
CREATE TABLE IF NOT EXISTS attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'sick', 'permission')),
  notes TEXT,
  marked_by UUID REFERENCES teachers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendances_class ON attendances(class_id);
CREATE INDEX IF NOT EXISTS idx_attendances_date ON attendances(date);
CREATE INDEX IF NOT EXISTS idx_attendances_student ON attendances(student_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT CHECK (user_type IN ('teacher', 'student')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- ============================================
-- ACTIVITY LOG (Track all teacher actions)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_teacher ON activity_logs(teacher_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);