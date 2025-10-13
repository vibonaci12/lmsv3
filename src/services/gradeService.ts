import { supabase } from '../lib/supabase';

export const gradeService = {
  async getGradebookByClass(classId: string) {
    // Get all students in the class
    const { data: classStudents, error: studentsError } = await supabase
      .from('class_students')
      .select(`
        student:students(id, full_name, email)
      `)
      .eq('class_id', classId);

    if (studentsError) throw studentsError;

    // Get all assignments for this class
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        id,
        title,
        total_points,
        assignment_type,
        deadline
      `)
      .eq('class_id', classId)
      .order('created_at', { ascending: true });

    if (assignmentsError) throw assignmentsError;

    // Get all submissions for these assignments
    const assignmentIds = assignments.map(a => a.id);
    const studentIds = classStudents.map(cs => cs.student.id);

    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        id,
        assignment_id,
        student_id,
        status,
        grade,
        submitted_at,
        graded_at
      `)
      .in('assignment_id', assignmentIds)
      .in('student_id', studentIds);

    if (submissionsError) throw submissionsError;

    // Organize data into gradebook format
    const gradebook = {
      students: classStudents.map(cs => cs.student),
      assignments,
      grades: {} as Record<string, Record<string, any>>,
    };

    // Initialize grades matrix
    classStudents.forEach(cs => {
      gradebook.grades[cs.student.id] = {};
      assignments.forEach(assignment => {
        gradebook.grades[cs.student.id][assignment.id] = {
          submission: null,
          grade: null,
          status: 'not_submitted',
        };
      });
    });

    // Fill in actual grades
    submissions.forEach(submission => {
      if (gradebook.grades[submission.student_id] && 
          gradebook.grades[submission.student_id][submission.assignment_id]) {
        gradebook.grades[submission.student_id][submission.assignment_id] = {
          submission,
          grade: submission.grade,
          status: submission.status,
        };
      }
    });

    return gradebook;
  },

  async getGradebookByGrade(grade: '10' | '11' | '12') {
    // Get all classes for this grade
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, name, subject')
      .eq('grade', grade);

    if (classesError) throw classesError;

    // Get all students in these classes
    const classIds = classes.map(c => c.id);
    const { data: classStudents, error: studentsError } = await supabase
      .from('class_students')
      .select(`
        student:students(id, full_name, email),
        class:classes(id, name, subject)
      `)
      .in('class_id', classIds);

    if (studentsError) throw studentsError;

    // Get all assignments for these classes
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        id,
        title,
        total_points,
        assignment_type,
        deadline,
        class_id
      `)
      .in('class_id', classIds)
      .order('created_at', { ascending: true });

    if (assignmentsError) throw assignmentsError;

    // Get all submissions
    const assignmentIds = assignments.map(a => a.id);
    const studentIds = [...new Set(classStudents.map(cs => cs.student.id))];

    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        id,
        assignment_id,
        student_id,
        status,
        grade,
        submitted_at,
        graded_at
      `)
      .in('assignment_id', assignmentIds)
      .in('student_id', studentIds);

    if (submissionsError) throw submissionsError;

    return {
      classes,
      students: [...new Set(classStudents.map(cs => cs.student))],
      assignments,
      submissions,
    };
  },

  async getStudentGrades(studentId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        assignment:assignments(
          id,
          title,
          total_points,
          assignment_type,
          deadline,
          class:classes(name, subject, grade)
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate statistics
    const gradedSubmissions = data.filter(s => s.status === 'graded');
    const totalPoints = gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0);
    const maxPoints = gradedSubmissions.reduce((sum, s) => sum + (s.assignment as any).total_points, 0);
    const averageGrade = gradedSubmissions.length > 0 ? totalPoints / gradedSubmissions.length : 0;
    const averagePercentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

    return {
      submissions: data,
      statistics: {
        totalAssignments: data.length,
        submittedAssignments: data.filter(s => s.status !== 'pending').length,
        gradedAssignments: gradedSubmissions.length,
        totalPoints,
        maxPoints,
        averageGrade,
        averagePercentage,
      },
    };
  },

  async getClassStatistics(classId: string) {
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        grade,
        status,
        assignment:assignments(total_points, assignment_type)
      `)
      .eq('assignment.class_id', classId);

    if (error) throw error;

    const gradedSubmissions = submissions.filter(s => s.status === 'graded');
    const totalStudents = new Set(submissions.map(s => s.student_id)).size;
    const submittedCount = submissions.filter(s => s.status !== 'pending').length;
    const gradedCount = gradedSubmissions.length;

    const grades = gradedSubmissions.map(s => s.grade || 0);
    const maxGrades = gradedSubmissions.map(s => (s.assignment as any).total_points);
    
    const averageGrade = grades.length > 0 ? grades.reduce((sum, g) => sum + g, 0) / grades.length : 0;
    const averagePercentage = maxGrades.length > 0 ? 
      (grades.reduce((sum, g) => sum + g, 0) / maxGrades.reduce((sum, m) => sum + m, 0)) * 100 : 0;

    // Grade distribution
    const distribution = {
      A: 0, // 90-100%
      B: 0, // 80-89%
      C: 0, // 70-79%
      D: 0, // 60-69%
      F: 0, // <60%
    };

    gradedSubmissions.forEach(submission => {
      const percentage = ((submission.grade || 0) / (submission.assignment as any).total_points) * 100;
      if (percentage >= 90) distribution.A++;
      else if (percentage >= 80) distribution.B++;
      else if (percentage >= 70) distribution.C++;
      else if (percentage >= 60) distribution.D++;
      else distribution.F++;
    });

    return {
      totalStudents,
      submittedCount,
      gradedCount,
      submissionRate: totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0,
      gradingRate: submittedCount > 0 ? (gradedCount / submittedCount) * 100 : 0,
      averageGrade,
      averagePercentage,
      gradeDistribution: distribution,
    };
  },

  async exportGradesToExcel(classId: string) {
    const gradebook = await this.getGradebookByClass(classId);
    
    // This would typically use a library like xlsx to create Excel file
    // For now, return the data structure that can be used by the frontend
    return {
      headers: ['Student Name', 'Email', ...gradebook.assignments.map(a => a.title)],
      rows: gradebook.students.map(student => {
        const row = [student.full_name, student.email];
        gradebook.assignments.forEach(assignment => {
          const grade = gradebook.grades[student.id][assignment.id];
          if (grade.status === 'graded') {
            row.push(grade.grade);
          } else if (grade.status === 'submitted') {
            row.push('Submitted');
          } else {
            row.push('Not Submitted');
          }
        });
        return row;
      }),
    };
  },

  async getGradeAnalytics() {
    // Get system-wide grade analytics
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        grade,
        status,
        assignment:assignments(
          total_points,
          assignment_type,
          class:classes(grade, subject)
        )
      `)
      .eq('status', 'graded');

    if (error) throw error;

    // Group by grade level
    const byGrade = {
      '10': { total: 0, points: 0, maxPoints: 0 },
      '11': { total: 0, points: 0, maxPoints: 0 },
      '12': { total: 0, points: 0, maxPoints: 0 },
    };

    // Group by subject
    const bySubject: Record<string, { total: 0, points: 0, maxPoints: 0 }> = {};

    submissions.forEach(submission => {
      const assignment = submission.assignment as any;
      const grade = assignment.class.grade;
      const subject = assignment.class.subject;

      if (byGrade[grade as keyof typeof byGrade]) {
        byGrade[grade as keyof typeof byGrade].total++;
        byGrade[grade as keyof typeof byGrade].points += submission.grade || 0;
        byGrade[grade as keyof typeof byGrade].maxPoints += assignment.total_points;
      }

      if (!bySubject[subject]) {
        bySubject[subject] = { total: 0, points: 0, maxPoints: 0 };
      }
      bySubject[subject].total++;
      bySubject[subject].points += submission.grade || 0;
      bySubject[subject].maxPoints += assignment.total_points;
    });

    return {
      byGrade: Object.entries(byGrade).map(([grade, data]) => ({
        grade,
        average: data.total > 0 ? data.points / data.total : 0,
        percentage: data.maxPoints > 0 ? (data.points / data.maxPoints) * 100 : 0,
        totalSubmissions: data.total,
      })),
      bySubject: Object.entries(bySubject).map(([subject, data]) => ({
        subject,
        average: data.total > 0 ? data.points / data.total : 0,
        percentage: data.maxPoints > 0 ? (data.points / data.maxPoints) * 100 : 0,
        totalSubmissions: data.total,
      })),
    };
  },
};
