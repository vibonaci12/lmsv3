import { supabase } from '../lib/supabase';

export const submissionService = {
  async getStudentSubmissions(studentId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        assignment:assignments(
          title,
          description,
          deadline,
          total_points,
          assignment_type,
          class:classes(name),
          target_grade
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getSubmissionById(submissionId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        assignment:assignments(
          *,
          questions(*)
        ),
        answers(*)
      `)
      .eq('id', submissionId)
      .single();

    if (error) throw error;
    return data;
  },

  async submitAssignment(
    submissionId: string,
    answers: Array<{
      question_id: string;
      answer_text?: string;
      file_url?: string;
      file_name?: string;
      drive_link?: string;
    }>
  ) {
    const { error: submissionError } = await supabase
      .from('submissions')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (submissionError) throw submissionError;

    const answersWithSubmissionId = answers.map((a) => ({
      ...a,
      submission_id: submissionId,
    }));

    const { error: answersError } = await supabase
      .from('answers')
      .insert(answersWithSubmissionId);

    if (answersError) throw answersError;
  },

  async getAssignmentSubmissions(assignmentId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        student:students(
          id,
          full_name,
          email
        )
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async gradeSubmission(
    submissionId: string,
    gradeData: {
      grade: number;
      feedback: string;
      graded_by: string;
    }
  ) {
    const { error: submissionError } = await supabase
      .from('submissions')
      .update({
        status: 'graded',
        grade: gradeData.grade,
        feedback: gradeData.feedback,
        graded_at: new Date().toISOString(),
        graded_by: gradeData.graded_by,
      })
      .eq('id', submissionId);

    if (submissionError) throw submissionError;

    const { data: submission } = await supabase
      .from('submissions')
      .select('student_id, assignment:assignments(title)')
      .eq('id', submissionId)
      .single();

    if (submission) {
      await supabase.from('notifications').insert({
        user_id: submission.student_id,
        user_type: 'student',
        title: 'Tugas Dinilai',
        message: `Tugas "${(submission.assignment as any).title}" telah dinilai`,
        link: `/student/assignments/${submissionId}`,
      });
    }

    await supabase.from('activity_logs').insert({
      teacher_id: gradeData.graded_by,
      action: 'grade',
      entity_type: 'submission',
      entity_id: submissionId,
      description: `Graded submission with score ${gradeData.grade}`,
    });
  },

  // Cancel submission (delete submission and related data)
  async cancelSubmission(submissionId: string, studentId: string) {
    // First, delete all answers related to this submission
    const { error: answersError } = await supabase
      .from('answers')
      .delete()
      .eq('submission_id', submissionId);

    if (answersError) throw answersError;

    // Then, delete the submission itself
    const { error: submissionError } = await supabase
      .from('submissions')
      .delete()
      .eq('id', submissionId)
      .eq('student_id', studentId); // Ensure student can only cancel their own submission

    if (submissionError) throw submissionError;

    // Log the cancellation activity
    await supabase.from('activity_logs').insert({
      teacher_id: null, // Student action, no teacher involved
      action: 'cancel_submission',
      entity_type: 'submission',
      entity_id: submissionId,
      description: `Student cancelled submission`,
    });
  },

  // Cancel grading (reset grade and feedback, set status back to submitted)
  async cancelGrading(submissionId: string, teacherId: string) {
    console.log('Cancelling grading for submission:', submissionId, 'by teacher:', teacherId);
    
    try {
      // Use raw SQL query to bypass potential RLS issues
      const { data, error } = await supabase.rpc('cancel_grading', {
        submission_id: submissionId,
        teacher_id: teacherId
      });

      if (error) {
        console.error('Error cancelling grading with RPC:', error);
        // Fallback to direct update
        console.log('Falling back to direct update...');
        
        const { data: updateData, error: updateError } = await supabase
          .from('submissions')
          .update({
            grade: null,
            feedback: null,
            status: 'submitted',
            graded_at: null,
            graded_by: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', submissionId)
          .select();

        if (updateError) {
          console.error('Error with direct update:', updateError);
          throw updateError;
        }
        
        console.log('Grading cancelled successfully with direct update:', updateData);
        return;
      }
      
      console.log('Grading cancelled successfully with RPC:', data);
    } catch (error) {
      console.error('Exception in cancelGrading:', error);
      throw error;
    }

    // Log the cancellation activity
    await supabase.from('activity_logs').insert({
      teacher_id: teacherId,
      action: 'cancel_grading',
      entity_type: 'submission',
      entity_id: submissionId,
      description: `Teacher cancelled grading for submission`,
    });
  },
};
