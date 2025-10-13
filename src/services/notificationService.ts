import { supabase } from '../lib/supabase';
import { Notification } from '../types';

export const notificationService = {
  async getNotifications(userId: string, userType: 'teacher' | 'student', limit: number = 20) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getUnreadNotifications(userId: string, userType: 'teacher' | 'student') {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async markAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markAllAsRead(userId: string, userType: 'teacher' | 'student') {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('user_type', userType)
      .eq('is_read', false)
      .select();

    if (error) throw error;
    return data;
  },

  async createNotification(notification: {
    user_id: string;
    user_type: 'teacher' | 'student';
    title: string;
    message: string;
    link?: string;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createBulkNotifications(notifications: Array<{
    user_id: string;
    user_type: 'teacher' | 'student';
    title: string;
    message: string;
    link?: string;
  }>) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) throw error;
    return data;
  },

  async deleteNotification(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  async deleteOldNotifications(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) throw error;
  },

  // Helper functions for common notification scenarios
  async notifyNewAssignment(assignmentId: string, studentIds: string[], assignmentTitle: string) {
    const notifications = studentIds.map(studentId => ({
      user_id: studentId,
      user_type: 'student' as const,
      title: 'Tugas Baru',
      message: `Tugas "${assignmentTitle}" telah diberikan`,
      link: `/student/assignments/${assignmentId}`,
    }));

    return this.createBulkNotifications(notifications);
  },

  async notifyAssignmentGraded(submissionId: string, studentId: string, assignmentTitle: string) {
    return this.createNotification({
      user_id: studentId,
      user_type: 'student',
      title: 'Tugas Dinilai',
      message: `Tugas "${assignmentTitle}" telah dinilai`,
      link: `/student/assignments/${submissionId}`,
    });
  },

  async notifyNewMaterial(materialId: string, classId: string, materialTitle: string) {
    // Get all students in the class
    const { data: classStudents } = await supabase
      .from('class_students')
      .select('student_id')
      .eq('class_id', classId);

    if (classStudents && classStudents.length > 0) {
      const notifications = classStudents.map(cs => ({
        user_id: cs.student_id,
        user_type: 'student' as const,
        title: 'Materi Baru',
        message: `Materi "${materialTitle}" telah diupload`,
        link: `/student/classes/${classId}`,
      }));

      return this.createBulkNotifications(notifications);
    }
  },

  async notifySubmissionReceived(submissionId: string, teacherId: string, studentName: string, assignmentTitle: string) {
    return this.createNotification({
      user_id: teacherId,
      user_type: 'teacher',
      title: 'Pengumpulan Tugas',
      message: `${studentName} telah mengumpulkan tugas "${assignmentTitle}"`,
      link: `/teacher/grading/${submissionId}`,
    });
  },

  async notifyDeadlineReminder(assignmentId: string, studentIds: string[], assignmentTitle: string, deadline: string) {
    const notifications = studentIds.map(studentId => ({
      user_id: studentId,
      user_type: 'student' as const,
      title: 'Pengingat Deadline',
      message: `Tugas "${assignmentTitle}" akan berakhir pada ${new Date(deadline).toLocaleDateString('id-ID')}`,
      link: `/student/assignments/${assignmentId}`,
    }));

    return this.createBulkNotifications(notifications);
  },

  async notifyAttendanceMarked(classId: string, studentIds: string[], date: string) {
    const notifications = studentIds.map(studentId => ({
      user_id: studentId,
      user_type: 'student' as const,
      title: 'Absensi Diperbarui',
      message: `Absensi untuk tanggal ${new Date(date).toLocaleDateString('id-ID')} telah diperbarui`,
      link: `/student/classes/${classId}`,
    }));

    return this.createBulkNotifications(notifications);
  },

  async getNotificationCount(userId: string, userType: 'teacher' | 'student') {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('user_type', userType)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  async getNotificationStats(userId: string, userType: 'teacher' | 'student') {
    const { data, error } = await supabase
      .from('notifications')
      .select('is_read, created_at')
      .eq('user_id', userId)
      .eq('user_type', userType);

    if (error) throw error;

    const total = data.length;
    const unread = data.filter(n => !n.is_read).length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCount = data.filter(n => 
      new Date(n.created_at) >= today
    ).length;

    return {
      total,
      unread,
      read: total - unread,
      today: todayCount,
    };
  },
};
