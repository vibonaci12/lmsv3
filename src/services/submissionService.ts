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

  async gradeSubmission(
    submissionId: string,
    grade: number,
    feedback: string | null,
    answers: Array<{
      id: string;
      points_earned: number;
      feedback?: string;
    }>,
    gradedBy: string
  ) {
    const { error: submissionError } = await supabase
      .from('submissions')
      .update({
        status: 'graded',
        grade,
        feedback,
        graded_at: new Date().toISOString(),
        graded_by: gradedBy,
      })
      .eq('id', submissionId);

    if (submissionError) throw submissionError;

    for (const answer of answers) {
      const { error: answerError } = await supabase
        .from('answers')
        .update({
          points_earned: answer.points_earned,
          feedback: answer.feedback,
        })
        .eq('id', answer.id);

      if (answerError) throw answerError;
    }

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
      teacher_id: gradedBy,
      action: 'grade',
      entity_type: 'submission',
      entity_id: submissionId,
      description: `Graded submission with score ${grade}`,
    });
  },
};
