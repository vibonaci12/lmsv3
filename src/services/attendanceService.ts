import { supabase } from '../lib/supabase';
import { Attendance } from '../types';

export const attendanceService = {
  async getAttendanceByClass(classId: string, date?: string) {
    const query = supabase
      .from('attendances')
      .select(`
        *,
        student:students(full_name, email),
        marked_by_teacher:teachers!attendances_marked_by_fkey(full_name)
      `)
      .eq('class_id', classId);

    if (date) {
      query.eq('date', date);
    } else {
      // Get today's attendance by default
      const today = new Date().toISOString().split('T')[0];
      query.eq('date', today);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getAttendanceByClassAndDate(classId: string, date: string) {
    const { data, error } = await supabase
      .from('attendances')
      .select(`
        *,
        student:students(full_name, email)
      `)
      .eq('class_id', classId)
      .eq('date', date);

    if (error) throw error;
    return data || [];
  },

  async getAttendanceHistory(classId: string, startDate?: string, endDate?: string) {
    const query = supabase
      .from('attendances')
      .select(`
        *,
        student:students(full_name, email)
      `)
      .eq('class_id', classId);

    if (startDate) {
      query.gte('date', startDate);
    }
    if (endDate) {
      query.lte('date', endDate);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async markAttendance(attendanceData: {
    student_id: string;
    class_id: string;
    date: string;
    status: 'present' | 'absent' | 'sick' | 'permission';
    notes?: string;
    marked_by: string;
  }) {
    const { data, error } = await supabase
      .from('attendances')
      .insert(attendanceData)
      .select();

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      teacher_id: attendanceData.marked_by,
      action: 'mark_attendance',
      entity_type: 'attendance',
      entity_id: attendanceData.class_id,
      description: `Marked attendance for ${attendanceData.date}`,
    });

    return data;
  },

  async markAttendanceBatch(
    classId: string,
    date: string,
    attendanceData: Array<{
      student_id: string;
      status: 'present' | 'absent' | 'sick' | 'permission';
      notes?: string;
    }>,
    markedBy: string
  ) {
    // First, delete existing attendance for this date and class
    await supabase
      .from('attendances')
      .delete()
      .eq('class_id', classId)
      .eq('date', date);

    // Insert new attendance records
    const attendanceRecords = attendanceData.map(record => ({
      class_id: classId,
      date,
      student_id: record.student_id,
      status: record.status,
      notes: record.notes || null,
      marked_by: markedBy,
    }));

    const { data, error } = await supabase
      .from('attendances')
      .insert(attendanceRecords)
      .select();

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      teacher_id: markedBy,
      action: 'mark_attendance',
      entity_type: 'attendance',
      entity_id: classId,
      description: `Marked attendance for ${date}`,
    });

    return data;
  },

  async getStudentAttendance(studentId: string, classId?: string) {
    const query = supabase
      .from('attendances')
      .select(`
        *,
        class:classes(name, subject)
      `)
      .eq('student_id', studentId);

    if (classId) {
      query.eq('class_id', classId);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;

    // Calculate attendance statistics
    const totalDays = data.length;
    const presentDays = data.filter(a => a.status === 'present').length;
    const absentDays = data.filter(a => a.status === 'absent').length;
    const sickDays = data.filter(a => a.status === 'sick').length;
    const permissionDays = data.filter(a => a.status === 'permission').length;

    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      records: data,
      statistics: {
        totalDays,
        presentDays,
        absentDays,
        sickDays,
        permissionDays,
        attendanceRate,
      },
    };
  },

  async getClassAttendanceStatistics(classId: string, startDate?: string, endDate?: string) {
    const query = supabase
      .from('attendances')
      .select(`
        student_id,
        status,
        date
      `)
      .eq('class_id', classId);

    if (startDate) {
      query.gte('date', startDate);
    }
    if (endDate) {
      query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get unique dates and students
    const uniqueDates = [...new Set(data.map(a => a.date))];
    const uniqueStudents = [...new Set(data.map(a => a.student_id))];

    // Calculate statistics for each student
    const studentStats = uniqueStudents.map(studentId => {
      const studentRecords = data.filter(a => a.student_id === studentId);
      const presentDays = studentRecords.filter(a => a.status === 'present').length;
      const totalDays = uniqueDates.length;
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      return {
        student_id: studentId,
        totalDays,
        presentDays,
        attendanceRate,
      };
    });

    // Calculate class average
    const classAverage = studentStats.length > 0 ? 
      studentStats.reduce((sum, s) => sum + s.attendanceRate, 0) / studentStats.length : 0;

    return {
      totalStudents: uniqueStudents.length,
      totalDays: uniqueDates.length,
      classAverage,
      studentStats,
    };
  },

  async getAttendanceCalendar(classId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('attendances')
      .select(`
        date,
        status,
        student_id
      `)
      .eq('class_id', classId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    // Group by date
    const calendarData: Record<string, { present: number, total: number }> = {};

    data.forEach(record => {
      if (!calendarData[record.date]) {
        calendarData[record.date] = { present: 0, total: 0 };
      }
      calendarData[record.date].total++;
      if (record.status === 'present') {
        calendarData[record.date].present++;
      }
    });

    return calendarData;
  },

  async exportAttendanceReport(classId: string, startDate?: string, endDate?: string) {
    const attendanceData = await this.getAttendanceHistory(classId, startDate, endDate);
    const statistics = await this.getClassAttendanceStatistics(classId, startDate, endDate);

    // Get student names
    const studentIds = [...new Set(attendanceData.map(a => a.student_id))];
    const { data: students } = await supabase
      .from('students')
      .select('id, full_name, email')
      .in('id', studentIds);

    const studentMap = students?.reduce((acc, student) => {
      acc[student.id] = student;
      return acc;
    }, {} as Record<string, any>) || {};

    // Format data for export
    const uniqueDates = [...new Set(attendanceData.map(a => a.date))].sort();
    
    const exportData = {
      headers: ['Student Name', 'Email', ...uniqueDates],
      rows: studentIds.map(studentId => {
        const student = studentMap[studentId];
        const row = [student.full_name, student.email];
        
        uniqueDates.forEach(date => {
          const attendance = attendanceData.find(a => 
            a.student_id === studentId && a.date === date
          );
          row.push(attendance ? attendance.status : 'Not Marked');
        });
        
        return row;
      }),
      statistics,
    };

    return exportData;
  },

  async bulkMarkAttendance(
    classId: string,
    date: string,
    status: 'present' | 'absent' | 'sick' | 'permission',
    studentIds: string[],
    markedBy: string
  ) {
    const attendanceRecords = studentIds.map(studentId => ({
      class_id: classId,
      date,
      student_id: studentId,
      status,
      marked_by: markedBy,
    }));

    const { data, error } = await supabase
      .from('attendances')
      .upsert(attendanceRecords, { 
        onConflict: 'class_id,date,student_id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      teacher_id: markedBy,
      action: 'bulk_mark_attendance',
      entity_type: 'attendance',
      entity_id: classId,
      description: `Bulk marked ${status} for ${studentIds.length} students on ${date}`,
    });

    return data;
  },

  async getClassAttendanceStats(classId: string) {
    // Get unique dates for this class
    const { data: uniqueDates, error: datesError } = await supabase
      .from('attendances')
      .select('date')
      .eq('class_id', classId)
      .order('date', { ascending: false });

    if (datesError) throw datesError;

    // Get total attendance records
    const { data: attendanceRecords, error: recordsError } = await supabase
      .from('attendances')
      .select('*')
      .eq('class_id', classId);

    if (recordsError) throw recordsError;

    const uniqueDatesSet = new Set(uniqueDates?.map(d => d.date) || []);
    const totalSessions = uniqueDatesSet.size;
    const totalRecords = attendanceRecords?.length || 0;
    const presentRecords = attendanceRecords?.filter(r => r.status === 'present').length || 0;
    const absentRecords = attendanceRecords?.filter(r => r.status === 'absent').length || 0;

    return {
      totalSessions,
      totalRecords,
      presentRecords,
      absentRecords,
      attendanceRate: totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0
    };
  },
};
