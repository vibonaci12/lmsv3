import { supabase } from '../lib/supabase';
import { Class } from '../types';

export const classService = {
  async getAllClasses(isActive: boolean = true) {
    const query = supabase
      .from('classes')
      .select(`
        *,
        created_by_teacher:teachers!classes_created_by_fkey(full_name),
        class_students(count)
      `)
      .order('created_at', { ascending: false });

    if (isActive !== null) {
      query.eq('is_active', isActive);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // Transform the data to extract student_count properly
    return data?.map(cls => ({
      ...cls,
      student_count: cls.class_students?.[0]?.count || 0
    })) || [];
  },

  async getClassById(classId: string) {
    // First try a simple query
    const { data: simpleData, error: simpleError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();

    if (simpleError) {
      throw simpleError;
    }

    // Now get class students separately
    const { data: classStudents, error: studentsError } = await supabase
      .from('class_students')
      .select(`
        id,
        enrolled_at,
        student:students(*)
      `)
      .eq('class_id', classId);

    // Get teacher info
    const { data: teacherData, error: teacherError } = await supabase
      .from('teachers')
      .select('full_name')
      .eq('id', simpleData.created_by)
      .single();

    const result = {
      ...simpleData,
      created_by_teacher: teacherData,
      class_students: classStudents || []
    };

    return result;
  },

  async createClass(classData: {
    name: string;
    grade: '10' | '11' | '12';
    description?: string;
    class_code: string;
    created_by: string;
  }) {
    const { data, error } = await supabase
      .from('classes')
      .insert(classData)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      teacher_id: classData.created_by,
      action: 'create',
      entity_type: 'class',
      entity_id: data.id,
      description: `Created class ${classData.name}`,
    });

    return data;
  },

  async updateClass(
    classId: string,
    updates: Partial<Class>,
    updatedBy: string
  ) {
    const { data, error } = await supabase
      .from('classes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', classId)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      teacher_id: updatedBy,
      action: 'update',
      entity_type: 'class',
      entity_id: classId,
      description: `Updated class ${data.name}`,
    });

    return data;
  },

  async deleteClass(classId: string, deletedBy: string) {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId);

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      teacher_id: deletedBy,
      action: 'delete',
      entity_type: 'class',
      entity_id: classId,
      description: `Deleted class`,
    });
  },

  async enrollStudent(classId: string, studentId: string, enrolledBy: string) {
    const { data, error } = await supabase
      .from('class_students')
      .insert({
        class_id: classId,
        student_id: studentId,
        enrolled_by: enrolledBy,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async unenrollStudent(classId: string, studentId: string) {
    const { error } = await supabase
      .from('class_students')
      .delete()
      .eq('class_id', classId)
      .eq('student_id', studentId);

    if (error) throw error;
  },

  generateClassCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },
};
