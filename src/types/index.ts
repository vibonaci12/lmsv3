export interface Teacher {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  email: string;
  full_name: string;
  birth_date: string;
  phone?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  created_by?: string | null;
}

export interface Class {
  id: string;
  name: string;
  grade: '10' | '11' | '12';
  subject: string;
  description?: string | null;
  class_code: string;
  is_active: boolean;
  created_at: string;
  created_by?: string | null;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  deadline: string;
  total_points: number;
  assignment_type: 'wajib' | 'tambahan';
  class_id?: string | null;
  target_grade?: '10' | '11' | '12' | null;
  created_at: string;
  created_by?: string | null;
  updated_at: string;
  updated_by?: string | null;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  status: 'pending' | 'submitted' | 'graded';
  submitted_at?: string | null;
  grade?: number | null;
  feedback?: string | null;
  graded_at?: string | null;
  graded_by?: string | null;
  created_at: string;
}

export interface Question {
  id: string;
  assignment_id: string;
  question_text: string;
  question_type: 'essay' | 'file_upload';
  points: number;
  order_number: number;
  created_at: string;
}

export interface Answer {
  id: string;
  submission_id: string;
  question_id: string;
  answer_text?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  points_earned?: number | null;
  feedback?: string | null;
  created_at: string;
}

export interface Material {
  id: string;
  class_id: string;
  title: string;
  description?: string | null;
  file_url: string;
  file_name?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  created_at: string;
  created_by?: string | null;
  updated_at: string;
  updated_by?: string | null;
}

export interface Attendance {
  id: string;
  class_id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'sick' | 'permission';
  notes?: string | null;
  marked_by?: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  user_type: 'teacher' | 'student';
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  teacher_id: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  description?: string | null;
  created_at: string;
}

export type UserRole = 'teacher' | 'student';

export interface AuthState {
  user: Teacher | Student | null;
  role: UserRole | null;
  loading: boolean;
}
