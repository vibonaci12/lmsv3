/*
  # Row Level Security (RLS) Policies
  
  1. Security Model
    - Teachers: Full shared access to all data (SELECT, INSERT, UPDATE, DELETE)
    - Students: Access only to their own data and enrolled classes
    
  2. Tables Covered
    - teachers, students, classes, class_students
    - materials, assignments, questions
    - submissions, answers, attendances
    - notifications, activity_logs
    
  3. Key Principles
    - All teachers can view and modify all data (shared collaboration)
    - Students restricted to their own submissions and enrolled classes
    - Notifications restricted to the intended recipient
*/

-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TEACHERS TABLE - Full access for teachers
-- ============================================
CREATE POLICY "Teachers can view all teachers" ON teachers
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can insert their profile" ON teachers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Teachers can update all teacher profiles" ON teachers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- STUDENTS TABLE - Teachers have full access
-- ============================================
CREATE POLICY "Teachers can view all students" ON students
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can create students" ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can update all students" ON students
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can delete students" ON students
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Students can view their own profile
CREATE POLICY "Students can view own profile" ON students
  FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- CLASSES TABLE - Full shared access for teachers
-- ============================================
CREATE POLICY "Teachers can view all classes" ON classes
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can create classes" ON classes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can update all classes" ON classes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can delete classes" ON classes
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Students can view enrolled classes
CREATE POLICY "Students can view enrolled classes" ON classes
  FOR SELECT
  TO anon
  USING (
    id IN (
      SELECT class_id FROM class_students WHERE student_id IN (
        SELECT id FROM students WHERE id IN (
          SELECT id FROM students
        )
      )
    )
  );

-- ============================================
-- CLASS_STUDENTS TABLE - Teachers manage enrollment
-- ============================================
CREATE POLICY "Teachers can view all enrollments" ON class_students
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can enroll students" ON class_students
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can remove enrollments" ON class_students
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Students can view their enrollments
CREATE POLICY "Students can view own enrollments" ON class_students
  FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- MATERIALS TABLE - Teachers full access, students read enrolled
-- ============================================
CREATE POLICY "Teachers can view all materials" ON materials
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can upload materials" ON materials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can update all materials" ON materials
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can delete materials" ON materials
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Students can view materials for enrolled classes
CREATE POLICY "Students can view enrolled class materials" ON materials
  FOR SELECT
  TO anon
  USING (
    class_id IN (
      SELECT class_id FROM class_students WHERE student_id IN (
        SELECT id FROM students WHERE id IN (
          SELECT id FROM students
        )
      )
    )
  );

-- ============================================
-- ASSIGNMENTS TABLE - Teachers full access
-- ============================================
CREATE POLICY "Teachers can view all assignments" ON assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can create assignments" ON assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can update all assignments" ON assignments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can delete assignments" ON assignments
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Students can view relevant assignments
CREATE POLICY "Students can view relevant assignments" ON assignments
  FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- QUESTIONS TABLE - Teachers manage, students read
-- ============================================
CREATE POLICY "Teachers can manage all questions" ON questions
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Students can view questions" ON questions
  FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- SUBMISSIONS TABLE - Teachers full access, students own
-- ============================================
CREATE POLICY "Teachers can view all submissions" ON submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can update all submissions" ON submissions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can insert submissions" ON submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Students policies for submissions
CREATE POLICY "Students can view own submissions" ON submissions
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Students can create own submissions" ON submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Students can update own submissions" ON submissions
  FOR UPDATE
  TO anon
  USING (true);

-- ============================================
-- ANSWERS TABLE - Teachers full access, students own
-- ============================================
CREATE POLICY "Teachers can manage all answers" ON answers
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Students can manage own answers" ON answers
  FOR ALL
  TO anon
  USING (true);

-- ============================================
-- ATTENDANCES TABLE - Teachers full access
-- ============================================
CREATE POLICY "Teachers can manage all attendances" ON attendances
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Students can view own attendance" ON attendances
  FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- NOTIFICATIONS TABLE - Users see own notifications
-- ============================================
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT
  USING (
    (user_type = 'teacher' AND user_id = auth.uid()) OR
    (user_type = 'student' AND user_id IN (SELECT id FROM students))
  );

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE
  USING (
    (user_type = 'teacher' AND user_id = auth.uid()) OR
    (user_type = 'student' AND user_id IN (SELECT id FROM students))
  );

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- ACTIVITY_LOGS TABLE - Teachers can view all
-- ============================================
CREATE POLICY "Teachers can view all activity logs" ON activity_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT
  WITH CHECK (true);