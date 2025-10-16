import { supabase } from '../lib/supabase';
import { Student } from '../types';
import { studentAuthService } from './studentAuthService';

export const studentService = {
  async getAllStudents(isActive: boolean = true) {
    // First try a simple query without joins
    const { data: simpleData, error: simpleError } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (simpleError) {
      throw simpleError;
    }

    // If simple query works, try the complex one
    const query = supabase
      .from('students')
      .select(`
        *,
        created_by_teacher:teachers!students_created_by_fkey(full_name),
        class_count:class_students(count)
      `)
      .order('created_at', { ascending: false });

    if (isActive !== null) {
      query.eq('is_active', isActive);
    }

    const { data, error } = await query;

    if (error) {
      // If complex query fails, fall back to simple data
      return simpleData || [];
    }
    
    return data;
  },

  async getStudentById(studentId: string) {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        created_by_teacher:teachers!students_created_by_fkey(full_name),
        class_students(
          id,
          enrolled_at,
          class:classes(
            id,
            name,
            grade,
            subject
          )
        )
      `)
      .eq('id', studentId)
      .single();

    if (error) throw error;
    return data;
  },

  async createStudent(
    studentData: {
      email: string;
      full_name: string;
      birth_date: string;
      address?: string;
    },
    password: string,
    createdBy: string
  ) {
    const student = await studentAuthService.createStudent(
      studentData,
      password
    );

    await supabase.from('activity_logs').insert({
      teacher_id: createdBy,
      action: 'create',
      entity_type: 'student',
      entity_id: student.id,
      description: `Created student ${studentData.full_name}`,
    });

    return student;
  },

  async updateStudent(
    studentId: string,
    updates: Partial<Student>,
    updatedBy: string
  ) {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', studentId)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      teacher_id: updatedBy,
      action: 'update',
      entity_type: 'student',
      entity_id: studentId,
      description: `Updated student ${data.full_name}`,
    });

    return data;
  },

  async updatePassword(studentId: string, newPassword: string, updatedBy: string) {
    // Use studentAuthService to update password
    await studentAuthService.updatePassword(studentId, newPassword);

    // Get student info for logging
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('full_name')
      .eq('id', studentId)
      .single();

    if (fetchError) throw fetchError;

    // Log the password update
    await supabase.from('activity_logs').insert({
      teacher_id: updatedBy,
      action: 'update_password',
      entity_type: 'student',
      entity_id: studentId,
      description: `Updated password for student ${student.full_name}`,
    });

    return { success: true };
  },

  async deactivateStudent(studentId: string, deactivatedBy: string) {
    const { data, error } = await supabase
      .from('students')
      .update({ is_active: false })
      .eq('id', studentId)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      teacher_id: deactivatedBy,
      action: 'deactivate',
      entity_type: 'student',
      entity_id: studentId,
      description: `Deactivated student ${data.full_name}`,
    });

    return data;
  },

  async activateStudent(studentId: string, activatedBy: string) {
    const { data, error } = await supabase
      .from('students')
      .update({ is_active: true })
      .eq('id', studentId)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      teacher_id: activatedBy,
      action: 'activate',
      entity_type: 'student',
      entity_id: studentId,
      description: `Activated student ${data.full_name}`,
    });

    return data;
  },

  async getStudentPerformance(studentId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        assignment:assignments(
          title,
          total_points,
          assignment_type,
          class:classes(name, subject)
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'graded')
      .order('graded_at', { ascending: false });

    if (error) throw error;

    // Calculate performance metrics
    const totalAssignments = data.length;
    const totalPoints = data.reduce((sum, sub) => sum + (sub.grade || 0), 0);
    const maxPoints = data.reduce((sum, sub) => sum + (sub.assignment as any).total_points, 0);
    const averageGrade = totalAssignments > 0 ? totalPoints / totalAssignments : 0;
    const averagePercentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

    return {
      submissions: data,
      metrics: {
        totalAssignments,
        totalPoints,
        maxPoints,
        averageGrade,
        averagePercentage,
      },
    };
  },

  async bulkImportStudents(
    students: Array<{
      email: string;
      full_name: string;
      birth_date: string;
      phone?: string;
    }>,
    createdBy: string
  ) {
    const results = [];
    const errors = [];

    for (const studentData of students) {
      try {
        const student = await this.createStudent(studentData, createdBy);
        results.push(student);
      } catch (error: any) {
        errors.push({
          student: studentData,
          error: error.message,
        });
      }
    }

    return { results, errors };
  },

  async getStudentsByClass(classId: string) {
    const { data, error } = await supabase
      .from('class_students')
      .select(`
        *,
        student:students(*)
      `)
      .eq('class_id', classId)
      .order('enrolled_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getStudentsByGrade(grade: '10' | '11' | '12') {
    const { data, error } = await supabase
      .from('class_students')
      .select(`
        student:students(*)
      `)
      .eq('class.grade', grade);

    if (error) throw error;

    // Remove duplicates and return unique students
    const uniqueStudents = data.reduce((acc, curr) => {
      const student = curr.student;
      if (!acc.find(s => s.id === student.id)) {
        acc.push(student);
      }
      return acc;
    }, [] as Student[]);

    return uniqueStudents;
  },

  async deleteStudent(studentId: string, deletedBy: string) {
    // First, get student info for logging
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('full_name')
      .eq('id', studentId)
      .single();

    if (fetchError) throw fetchError;

    // Delete the student (this will cascade delete related records due to foreign key constraints)
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);

    if (error) throw error;

    // Log the deletion
    await supabase.from('activity_logs').insert({
      teacher_id: deletedBy,
      action: 'delete',
      entity_type: 'student',
      entity_id: studentId,
      description: `Deleted student ${student.full_name}`,
    });

    return { success: true };
  },
};
