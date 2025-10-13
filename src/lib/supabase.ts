import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      teachers: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          password_hash: string;
          birth_date: string;
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          password_hash: string;
          birth_date: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          password_hash?: string;
          birth_date?: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          created_by?: string | null;
        };
      };
      classes: {
        Row: {
          id: string;
          name: string;
          grade: '10' | '11' | '12';
          subject: string;
          description: string | null;
          class_code: string;
          is_active: boolean;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          grade: '10' | '11' | '12';
          subject: string;
          description?: string | null;
          class_code: string;
          is_active?: boolean;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          grade?: '10' | '11' | '12';
          subject?: string;
          description?: string | null;
          class_code?: string;
          is_active?: boolean;
          created_at?: string;
          created_by?: string | null;
        };
      };
      assignments: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          deadline: string;
          total_points: number;
          assignment_type: 'wajib' | 'tambahan';
          class_id: string | null;
          target_grade: '10' | '11' | '12' | null;
          created_at: string;
          created_by: string | null;
          updated_at: string;
          updated_by: string | null;
        };
      };
      submissions: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          status: 'pending' | 'submitted' | 'graded';
          submitted_at: string | null;
          grade: number | null;
          feedback: string | null;
          graded_at: string | null;
          graded_by: string | null;
          created_at: string;
        };
      };
    };
  };
};
