import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useStudentAuth } from './StudentAuthContext';
import { Teacher, Student, UserRole } from '../types';

interface UnifiedAuthContextType {
  user: Teacher | Student | null;
  role: UserRole | null;
  loading: boolean;
  loginTeacher: (email: string, password: string) => Promise<void>;
  loginStudent: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isTeacher: boolean;
  isStudent: boolean;
  isAuthenticated: boolean;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

export function UnifiedAuthProvider({ children }: { children: ReactNode }) {
  const teacherAuth = useAuth();
  const studentAuth = useStudentAuth();
  
  const [unifiedUser, setUnifiedUser] = useState<Teacher | Student | null>(null);
  const [unifiedRole, setUnifiedRole] = useState<UserRole | null>(null);
  const [unifiedLoading, setUnifiedLoading] = useState(true);

  // Sync teacher auth state
  useEffect(() => {
    if (teacherAuth.user && teacherAuth.role === 'teacher') {
      setUnifiedUser(teacherAuth.user);
      setUnifiedRole('teacher');
      setUnifiedLoading(false);
    } else if (!teacherAuth.loading && !studentAuth.loading) {
      // Only check student if teacher auth is not loading and no teacher user
      if (studentAuth.student) {
        setUnifiedUser(studentAuth.student);
        setUnifiedRole('student');
        setUnifiedLoading(false);
      } else if (!teacherAuth.user) {
        setUnifiedUser(null);
        setUnifiedRole(null);
        setUnifiedLoading(false);
      }
    }
  }, [teacherAuth.user, teacherAuth.role, teacherAuth.loading, studentAuth.student, studentAuth.loading]);

  // Sync student auth state
  useEffect(() => {
    if (studentAuth.student && !teacherAuth.user) {
      setUnifiedUser(studentAuth.student);
      setUnifiedRole('student');
      setUnifiedLoading(false);
    } else if (!studentAuth.loading && !teacherAuth.loading && !studentAuth.student && !teacherAuth.user) {
      setUnifiedUser(null);
      setUnifiedRole(null);
      setUnifiedLoading(false);
    }
  }, [studentAuth.student, studentAuth.loading, teacherAuth.user, teacherAuth.loading]);

  // Teacher login function
  const loginTeacher = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setUnifiedLoading(true);
      await teacherAuth.loginTeacher(email, password);
      // Clear student session when teacher logs in
      studentAuth.logoutStudent();
    } catch (error) {
      setUnifiedLoading(false);
      throw error;
    }
  }, [teacherAuth, studentAuth]);

  // Student login function
  const loginStudent = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setUnifiedLoading(true);
      await studentAuth.loginStudent(email, password);
      // Teacher logout is handled by Supabase auth state change
    } catch (error) {
      setUnifiedLoading(false);
      throw error;
    }
  }, [studentAuth]);

  // Unified logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      if (unifiedRole === 'teacher') {
        await teacherAuth.logout();
      } else if (unifiedRole === 'student') {
        studentAuth.logoutStudent();
      }
      
      setUnifiedUser(null);
      setUnifiedRole(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUnifiedUser(null);
      setUnifiedRole(null);
    }
  }, [unifiedRole, teacherAuth, studentAuth]);

  const contextValue: UnifiedAuthContextType = {
    user: unifiedUser,
    role: unifiedRole,
    loading: unifiedLoading || teacherAuth.loading || studentAuth.loading,
    loginTeacher,
    loginStudent,
    logout,
    isTeacher: unifiedRole === 'teacher',
    isStudent: unifiedRole === 'student',
    isAuthenticated: !!unifiedUser,
  };

  return (
    <UnifiedAuthContext.Provider value={contextValue}>
      {children}
    </UnifiedAuthContext.Provider>
  );
}

export function useUnifiedAuth(): UnifiedAuthContextType {
  const context = useContext(UnifiedAuthContext);
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
}
