import { supabase } from '../lib/supabase';
import { Student } from '../types';
import bcrypt from 'bcryptjs';

export const studentAuthService = {
  async loginStudent(email: string, birthDate: string): Promise<Student> {
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    if (!student) throw new Error('Student not found or inactive');

    const passwordMatch = await bcrypt.compare(birthDate, student.password_hash);

    if (!passwordMatch) {
      throw new Error('Invalid credentials');
    }

    return student;
  },

  async createStudent(
    email: string,
    fullName: string,
    birthDate: string,
    phone: string | null,
    createdBy: string
  ): Promise<Student> {
    const passwordHash = await bcrypt.hash(
      birthDate.replace(/\//g, ''),
      10
    );

    const { data, error } = await supabase
      .from('students')
      .insert({
        email,
        full_name: fullName,
        password_hash: passwordHash,
        birth_date: birthDate,
        phone,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async updateStudent(
    studentId: string,
    updates: Partial<Student>
  ): Promise<Student> {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', studentId)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async resetPassword(studentId: string, newBirthDate: string): Promise<void> {
    const passwordHash = await bcrypt.hash(
      newBirthDate.replace(/\//g, ''),
      10
    );

    const { error } = await supabase
      .from('students')
      .update({ password_hash: passwordHash })
      .eq('id', studentId);

    if (error) throw error;
  },
};
