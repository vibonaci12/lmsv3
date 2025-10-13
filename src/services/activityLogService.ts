import { supabase } from '../lib/supabase';
import { ActivityLog } from '../types';

export const activityLogService = {
  async getRecentActivities(limit: number = 20) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        teacher:teachers(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getActivitiesByTeacher(teacherId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getActivitiesByEntity(entityType: string, entityId: string) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        teacher:teachers(full_name, email)
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getActivitiesByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        teacher:teachers(full_name, email)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async logActivity(activity: {
    teacher_id: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    description?: string;
  }) {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert(activity)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getActivityStatistics(startDate?: string, endDate?: string) {
    const query = supabase
      .from('activity_logs')
      .select(`
        action,
        entity_type,
        created_at,
        teacher:teachers(full_name)
      `);

    if (startDate) {
      query.gte('created_at', startDate);
    }
    if (endDate) {
      query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by action
    const actionStats = data.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by entity type
    const entityStats = data.reduce((acc, log) => {
      acc[log.entity_type] = (acc[log.entity_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by teacher
    const teacherStats = data.reduce((acc, log) => {
      const teacherName = (log.teacher as any)?.full_name || 'Unknown';
      acc[teacherName] = (acc[teacherName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Daily activity
    const dailyStats = data.reduce((acc, log) => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalActivities: data.length,
      actionStats,
      entityStats,
      teacherStats,
      dailyStats,
    };
  },

  async getMostActiveTeachers(limit: number = 10) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        teacher_id,
        teacher:teachers(full_name, email)
      `);

    if (error) throw error;

    // Count activities per teacher
    const teacherCounts = data.reduce((acc, log) => {
      const teacherId = log.teacher_id;
      const teacherName = (log.teacher as any)?.full_name || 'Unknown';
      const teacherEmail = (log.teacher as any)?.email || '';
      
      if (!acc[teacherId]) {
        acc[teacherId] = {
          teacher_id: teacherId,
          full_name: teacherName,
          email: teacherEmail,
          count: 0,
        };
      }
      acc[teacherId].count++;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(teacherCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  async getActivityTimeline(days: number = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        teacher:teachers(full_name)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by day
    const timeline = data.reduce((acc, log) => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(log);
      return acc;
    }, {} as Record<string, any[]>);

    return timeline;
  },

  async searchActivities(searchTerm: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        teacher:teachers(full_name, email)
      `)
      .or(`description.ilike.%${searchTerm}%,action.ilike.%${searchTerm}%,entity_type.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async deleteOldLogs(daysOld: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error } = await supabase
      .from('activity_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) throw error;
  },

  // Helper function to format activity descriptions
  formatActivityDescription(action: string, entityType: string, description?: string): string {
    if (description) return description;

    const actionMap: Record<string, string> = {
      create: 'Created',
      update: 'Updated',
      delete: 'Deleted',
      grade: 'Graded',
      mark_attendance: 'Marked attendance',
      bulk_mark_attendance: 'Bulk marked attendance',
      enroll: 'Enrolled student',
      unenroll: 'Unenrolled student',
      submit: 'Submitted',
      activate: 'Activated',
      deactivate: 'Deactivated',
    };

    const entityMap: Record<string, string> = {
      class: 'class',
      student: 'student',
      assignment: 'assignment',
      submission: 'submission',
      material: 'material',
      attendance: 'attendance',
      notification: 'notification',
    };

    const actionText = actionMap[action] || action;
    const entityText = entityMap[entityType] || entityType;

    return `${actionText} ${entityText}`;
  },

  // Helper function to get activity icon
  getActivityIcon(action: string, entityType: string): string {
    const iconMap: Record<string, string> = {
      create: '➕',
      update: '✏️',
      delete: '🗑️',
      grade: '📝',
      mark_attendance: '✅',
      bulk_mark_attendance: '✅',
      enroll: '👥',
      unenroll: '👥',
      submit: '📤',
      activate: '🟢',
      deactivate: '🔴',
    };

    return iconMap[action] || '📋';
  },
};
