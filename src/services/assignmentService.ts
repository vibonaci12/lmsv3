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
      class_ids?: string[]; // Changed from single class_id to array for multi-class support
      target_grade?: '10' | '11' | '12';
      drive_link?: string | null;
      created_by: string;
    },
    questions: Array<{
      question_text: string;
      question_type: 'essay' | 'file_upload';
      points: number;
      order_number: number;
    }>
  ) {
    // Remove class_ids from assignmentData before inserting
    const { class_ids, ...assignmentInsertData } = assignmentData;
    
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert(assignmentInsertData)
      .select()
      .single();

    if (assignmentError) throw assignmentError;

    // Handle multi-class assignments for wajib type
    if (assignmentData.assignment_type === 'wajib' && class_ids && class_ids.length > 0) {
      const assignmentClasses = class_ids.map(classId => ({
        assignment_id: assignment.id,
        class_id: classId
      }));

      const { error: assignmentClassesError } = await supabase
        .from('assignment_classes')
        .insert(assignmentClasses);

      if (assignmentClassesError) throw assignmentClassesError;
    }

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

  async createSimpleAssignment(assignmentData: {
    title: string;
    description?: string;
    deadline: string;
    total_points: number;
    assignment_type: 'wajib' | 'tambahan';
    class_id?: string;
    class_ids?: string[]; // Support both single and multi-class
    target_grade?: '10' | '11' | '12';
    drive_link?: string | null;
    created_by: string;
    is_published?: boolean;
  }) {
    // Handle both single class_id and multi-class class_ids
    const { class_id, class_ids, ...baseAssignmentData } = assignmentData;
    const finalClassIds = class_ids || (class_id ? [class_id] : []);
    
    const createdAssignments = [];

    if (assignmentData.assignment_type === 'wajib' && finalClassIds.length > 0) {
      // Create separate assignment for each class
      for (const classId of finalClassIds) {
        const assignmentDataForClass = {
          ...baseAssignmentData,
          class_id: classId, // Set specific class_id for this assignment
          title: `${assignmentData.title} - ${classId}`, // Add class identifier to title
        };

        console.log('Creating assignment for class:', classId, assignmentDataForClass);
        
        const { data: assignment, error: assignmentError } = await supabase
          .from('assignments')
          .insert(assignmentDataForClass)
          .select()
          .single();

        if (assignmentError) {
          console.error('Assignment insert error for class', classId, ':', assignmentError);
          throw assignmentError;
        }
        
        console.log('Assignment created successfully for class:', classId, assignment);
        createdAssignments.push(assignment);

        // Distribute assignment to students in this class
        await this.distributeAssignment(assignment);

        // Log activity
        await supabase.from('activity_logs').insert({
          teacher_id: assignmentData.created_by,
          action: 'create',
          entity_type: 'assignment',
          entity_id: assignment.id,
          description: `Created assignment ${assignmentData.title} for class ${classId}`,
        });
      }
    } else {
      // For tambahan assignments or single class wajib, create as before
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .insert(baseAssignmentData)
        .select()
        .single();

      if (assignmentError) {
        console.error('Assignment insert error:', assignmentError);
        throw assignmentError;
      }
      
      console.log('Assignment created successfully:', assignment);
      createdAssignments.push(assignment);

      await this.distributeAssignment(assignment);

      await supabase.from('activity_logs').insert({
        teacher_id: assignmentData.created_by,
        action: 'create',
        entity_type: 'assignment',
        entity_id: assignment.id,
        description: `Created assignment ${assignmentData.title}`,
      });
    }

    return createdAssignments;
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
        class:classes(id, name, grade),
        assignment_classes(
          class_id,
          class:classes(id, name, grade)
        ),
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

  async getAssignmentsByClass(classId: string) {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        questions(count),
        submissions(count)
      `)
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getClassAssignmentStats(classId: string) {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        id,
        title,
        deadline,
        submissions(count)
      `)
      .eq('class_id', classId);

    if (error) throw error;

    const totalAssignments = data.length;
    const totalSubmissions = data.reduce((sum, assignment) => sum + (assignment.submissions?.[0]?.count || 0), 0);
    const pendingAssignments = data.filter(assignment => new Date(assignment.deadline) > new Date()).length;

    return {
      totalAssignments,
      totalSubmissions,
      pendingAssignments,
      completedAssignments: totalAssignments - pendingAssignments
    };
  },

  // Bulk operations
  async bulkDeleteAssignments(assignmentIds: string[], teacherId: string) {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .in('id', assignmentIds);

    if (error) throw error;

    // Log bulk delete activity
    await supabase.from('activity_logs').insert({
      teacher_id: teacherId,
      action: 'bulk_delete',
      entity_type: 'assignment',
      entity_id: null,
      description: `Bulk deleted ${assignmentIds.length} assignments`,
    });
  },

  async bulkUpdateAssignments(assignmentIds: string[], updates: {
    deadline?: string;
    total_points?: number;
    drive_link?: string;
  }, teacherId: string) {
    const { error } = await supabase
      .from('assignments')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: teacherId
      })
      .in('id', assignmentIds);

    if (error) throw error;

    // Log bulk update activity
    await supabase.from('activity_logs').insert({
      teacher_id: teacherId,
      action: 'bulk_update',
      entity_type: 'assignment',
      entity_id: null,
      description: `Bulk updated ${assignmentIds.length} assignments`,
    });
  },

  // Edit assignment
  async updateAssignment(assignmentId: string, updates: {
    title?: string;
    description?: string;
    deadline?: string;
    total_points?: number;
    class_ids?: string[];
    target_grade?: '10' | '11' | '12';
    drive_link?: string;
  }, teacherId: string) {
    const { class_ids, ...assignmentUpdates } = updates;
    
    const { error: assignmentError } = await supabase
      .from('assignments')
      .update({
        ...assignmentUpdates,
        updated_at: new Date().toISOString(),
        updated_by: teacherId
      })
      .eq('id', assignmentId);

    if (assignmentError) throw assignmentError;

    // Handle class assignments update for wajib type
    if (class_ids && class_ids.length > 0) {
      // First, delete existing class assignments
      await supabase
        .from('assignment_classes')
        .delete()
        .eq('assignment_id', assignmentId);

      // Then, insert new class assignments
      const assignmentClasses = class_ids.map(classId => ({
        assignment_id: assignmentId,
        class_id: classId
      }));

      const { error: assignmentClassesError } = await supabase
        .from('assignment_classes')
        .insert(assignmentClasses);

      if (assignmentClassesError) throw assignmentClassesError;
    }

    // Log update activity
    await supabase.from('activity_logs').insert({
      teacher_id: teacherId,
      action: 'update',
      entity_type: 'assignment',
      entity_id: assignmentId,
      description: `Updated assignment`,
    });
  },

  // Bulk grade submissions
  async bulkGradeSubmissions(submissionIds: string[], grade: number, feedback: string, teacherId: string) {
    const { error } = await supabase
      .from('submissions')
      .update({
        grade: grade,
        feedback: feedback,
        status: 'graded',
        graded_at: new Date().toISOString(),
        graded_by: teacherId,
        updated_at: new Date().toISOString()
      })
      .in('id', submissionIds);

    if (error) throw error;

    // Log activity
    await supabase.from('activity_logs').insert({
      teacher_id: teacherId,
      action: 'bulk_grade',
      entity_type: 'submission',
      entity_id: null,
      description: `Bulk graded ${submissionIds.length} submissions with grade ${grade}`,
    });
  },

  // Get submissions for grading with student info
  async getSubmissionsForGrading(assignmentId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        student:students(
          id,
          full_name,
          student_id,
          class:classes(name, grade)
        )
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
  },

};
