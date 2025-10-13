import { supabase } from '../lib/supabase';
import { Assignment } from '../types';

export const assignmentService = {
  async createAssignment(
    assignmentData: {
      title: string;
      description?: string;
      deadline: string;
      total_points: number;
      assignment_type: 'wajib' | 'tambahan';
      class_id?: string;
      target_grade?: '10' | '11' | '12';
      created_by: string;
    },
    questions: Array<{
      question_text: string;
      question_type: 'essay' | 'file_upload';
      points: number;
      order_number: number;
    }>
  ) {
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert(assignmentData)
      .select()
      .single();

    if (assignmentError) throw assignmentError;

    const questionsWithAssignmentId = questions.map((q) => ({
      ...q,
      assignment_id: assignment.id,
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsWithAssignmentId);

    if (questionsError) throw questionsError;

    await this.distributeAssignment(assignment);

    await supabase.from('activity_logs').insert({
      teacher_id: assignmentData.created_by,
      action: 'create',
      entity_type: 'assignment',
      entity_id: assignment.id,
      description: `Created assignment ${assignmentData.title}`,
    });

    return assignment;
  },

  async distributeAssignment(assignment: Assignment) {
    let studentIds: string[] = [];

    if (assignment.assignment_type === 'wajib' && assignment.class_id) {
      const { data, error } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', assignment.class_id);

      if (error) throw error;
      studentIds = data.map((cs) => cs.student_id);
    } else if (assignment.assignment_type === 'tambahan' && assignment.target_grade) {
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('grade', assignment.target_grade);

      if (classError) throw classError;

      const classIds = classes.map((c) => c.id);

      const { data, error } = await supabase
        .from('class_students')
        .select('student_id')
        .in('class_id', classIds);

      if (error) throw error;

      const uniqueStudentIds = new Set(data.map((cs) => cs.student_id));
      studentIds = Array.from(uniqueStudentIds);
    }

    if (studentIds.length > 0) {
      const submissions = studentIds.map((studentId) => ({
        assignment_id: assignment.id,
        student_id: studentId,
        status: 'pending' as const,
      }));

      const { error: submissionError } = await supabase
        .from('submissions')
        .insert(submissions);

      if (submissionError) throw submissionError;

      const notifications = studentIds.map((studentId) => ({
        user_id: studentId,
        user_type: 'student' as const,
        title: 'Tugas Baru',
        message: `Tugas "${assignment.title}" telah diberikan`,
        link: `/student/assignments/${assignment.id}`,
      }));

      await supabase.from('notifications').insert(notifications);
    }
  },

  async getAllAssignments() {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        class:classes(name, grade),
        questions(count),
        submissions(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getAssignmentById(assignmentId: string) {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        class:classes(name, grade),
        questions(*)
      `)
      .eq('id', assignmentId)
      .single();

    if (error) throw error;
    return data;
  },

  async getAssignmentSubmissions(assignmentId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        student:students(full_name, email)
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async deleteAssignment(assignmentId: string, deletedBy: string) {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      teacher_id: deletedBy,
      action: 'delete',
      entity_type: 'assignment',
      entity_id: assignmentId,
      description: `Deleted assignment`,
    });
  },
};
