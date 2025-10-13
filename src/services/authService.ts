import { supabase } from '../lib/supabase';
import { Teacher } from '../types';

export const authService = {
  async loginTeacher(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Check if teacher profile exists, if not create it
    let { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (teacherError) throw teacherError;

    // If teacher profile doesn't exist, create it
    if (!teacher) {
      const { data: newTeacher, error: createError } = await supabase
        .from('teachers')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Teacher',
        })
        .select()
        .single();

      if (createError) throw createError;
      teacher = newTeacher;
    }

    return { user: data.user, teacher };
  },

  async getCurrentTeacher(): Promise<Teacher | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Check if teacher profile exists, if not create it
    let { data: teacher, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;

    // If teacher profile doesn't exist, create it
    if (!teacher) {
      const { data: newTeacher, error: createError } = await supabase
        .from('teachers')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Teacher',
        })
        .select()
        .single();

      if (createError) throw createError;
      teacher = newTeacher;
    }

    return teacher;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        callback(session?.user || null);
      })();
    });
  },
};
