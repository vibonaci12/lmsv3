import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { authService } from '../services/authService';
import { studentAuthService } from '../services/studentAuthService';
import { Teacher, Student, UserRole } from '../types';
import { supabase } from '../lib/supabase';

// Constants for session management
const STUDENT_SESSION_KEY = 'student_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface StudentSessionData {
  id: string;
  email: string;
  timestamp: number;
}

interface AuthContextType {
  user: Teacher | Student | null;
  role: UserRole | null;
  loading: boolean;
  loginTeacher: (email: string, password: string) => Promise<void>;
  loginStudent: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Teacher | Student | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to validate session timestamp
  const isSessionValid = useCallback((timestamp: number): boolean => {
    const now = Date.now();
    const sessionAge = now - timestamp;
    return sessionAge < SESSION_DURATION;
  }, []);

  // Function to get student session from localStorage
  const getStudentSession = useCallback((): StudentSessionData | null => {
    try {
      const sessionData = localStorage.getItem(STUDENT_SESSION_KEY);
      if (!sessionData) return null;
      
      const parsed = JSON.parse(sessionData) as StudentSessionData;
      
      // Validate session structure
      if (!parsed.id || !parsed.email || !parsed.timestamp) {
        console.warn('Invalid session structure, removing session');
        localStorage.removeItem(STUDENT_SESSION_KEY);
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error('Error parsing student session:', error);
      localStorage.removeItem(STUDENT_SESSION_KEY);
      return null;
    }
  }, []);

  // Function to save student session to localStorage
  const saveStudentSession = useCallback((student: Student): void => {
    const sessionData: StudentSessionData = {
      id: student.id,
      email: student.email,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(sessionData));
      console.log('Student session saved:', sessionData);
    } catch (error) {
      console.error('Error saving student session:', error);
    }
  }, []);

  // Function to clear student session from localStorage
  const clearStudentSession = useCallback((): void => {
    localStorage.removeItem(STUDENT_SESSION_KEY);
    console.log('Student session cleared');
  }, []);

  // Function to fetch student data from server
  const fetchStudentData = useCallback(async (studentId: string): Promise<Student | null> => {
    try {
      const { data: studentData, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching student data:', error);
        return null;
      }

      return studentData;
    } catch (error) {
      console.error('Error fetching student data:', error);
      return null;
    }
  }, []);

  // Function to validate and restore student session
  const validateStudentSession = useCallback(async (): Promise<boolean> => {
    const sessionData = getStudentSession();
    
    if (!sessionData) {
      console.log('No student session found');
      return false;
    }

    // Check if session is still valid based on timestamp
    if (!isSessionValid(sessionData.timestamp)) {
      console.log('Student session expired, removing session');
      clearStudentSession();
      return false;
    }

    // Fetch fresh student data from server
    const studentData = await fetchStudentData(sessionData.id);
    
    if (!studentData) {
      console.log('Student data not found or inactive, removing session');
      clearStudentSession();
      return false;
    }

    // Session is valid, set user data
    console.log('Valid student session found, setting user:', studentData);
    setUser(studentData);
    setRole('student');
    
    // Refresh session timestamp to keep it alive
    saveStudentSession(studentData);
    
    return true;
  }, [getStudentSession, isSessionValid, clearStudentSession, fetchStudentData, saveStudentSession]);

  // Function to validate and restore teacher session
  const validateTeacherSession = useCallback(async (): Promise<boolean> => {
    try {
      const teacher = await authService.getCurrentTeacher();
      if (teacher) {
        console.log('Valid teacher session found:', teacher);
        setUser(teacher);
        setRole('teacher');
        // Clear any student session when teacher is active
        clearStudentSession();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error validating teacher session:', error);
      return false;
    }
  }, [clearStudentSession]);

  // Main function to check and restore user session
  const checkUser = useCallback(async (): Promise<void> => {
    try {
      console.log('Checking user session...');
      setLoading(true);

      // Check if we have a student session first (priority for students)
      const studentSession = getStudentSession();
      if (studentSession && isSessionValid(studentSession.timestamp)) {
        console.log('Found valid student session, validating...');
        const isStudentValid = await validateStudentSession();
        if (isStudentValid) {
          setLoading(false);
          return;
        }
      }

      // If no valid student session, check teacher session
      const isTeacherValid = await validateTeacherSession();
      if (isTeacherValid) {
        setLoading(false);
        return;
      }

      // No valid session found
      console.log('No valid session found');
      setUser(null);
      setRole(null);
      setLoading(false);
    } catch (error) {
      console.error('Error checking user session:', error);
      setUser(null);
      setRole(null);
      setLoading(false);
    }
  }, [getStudentSession, isSessionValid, validateStudentSession, validateTeacherSession]);

  // Function to refresh current session
  const refreshSession = useCallback(async (): Promise<void> => {
    if (role === 'student' && user) {
      const studentData = await fetchStudentData(user.id);
      if (studentData) {
        setUser(studentData);
        saveStudentSession(studentData);
      } else {
        // Student data not found, logout
        await logout();
      }
    } else if (role === 'teacher') {
      // For teachers, just recheck the session
      await checkUser();
    }
  }, [role, user, fetchStudentData, saveStudentSession]);

  // Initialize authentication on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (!isInitialized) {
        await checkUser();
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [checkUser, isInitialized]);

  // Listen for storage changes (cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STUDENT_SESSION_KEY) {
        if (e.newValue) {
          // Session was added or updated in another tab
          console.log('Student session changed in another tab, rechecking...');
    checkUser();
        } else {
          // Session was removed in another tab
          console.log('Student session removed in another tab');
          if (role === 'student') {
            setUser(null);
            setRole(null);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkUser, role]);

  // Listen for Supabase auth state changes (for teachers only)
  useEffect(() => {
    const { data: { subscription } } = authService.onAuthStateChange(async (authUser) => {
      // Only handle teacher authentication changes
      if (authUser) {
        // Teacher logged in via Supabase
        const teacher = await authService.getCurrentTeacher();
        if (teacher) {
          setUser(teacher);
          setRole('teacher');
          // Clear any student session when teacher logs in
          clearStudentSession();
        }
      } else {
        // Teacher logged out via Supabase
        // Only clear user if we're currently a teacher
        if (role === 'teacher') {
        setUser(null);
        setRole(null);
        }
        // Don't interfere with student sessions
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [role, clearStudentSession]);

  // Teacher login function
  const loginTeacher = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Clear any existing student session when teacher logs in
      clearStudentSession();
      
      const { teacher } = await authService.loginTeacher(email, password);
        setUser(teacher);
        setRole('teacher');
      
      console.log('Teacher logged in successfully:', teacher);
    } catch (error) {
      console.error('Teacher login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [clearStudentSession]);

  // Student login function
  const loginStudent = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Clear any existing teacher session when student logs in
      // This is handled by the Supabase auth state change listener
      
    const student = await studentAuthService.loginStudent(email, password);
    setUser(student);
    setRole('student');
      saveStudentSession(student);
      
      console.log('Student logged in successfully:', student);
    } catch (error) {
      console.error('Student login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [saveStudentSession]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      const currentRole = role;
      
      if (currentRole === 'teacher') {
        // Teacher logout via Supabase
      await authService.logout();
        console.log('Teacher logged out successfully');
      } else if (currentRole === 'student') {
        // Student logout - clear localStorage
        clearStudentSession();
        console.log('Student logged out successfully');
      }
      
      // Always clear local state
      setUser(null);
      setRole(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
    setUser(null);
    setRole(null);
  }
  }, [role, clearStudentSession]);

  const contextValue: AuthContextType = {
        user,
        role,
        loading,
        loginTeacher,
        loginStudent,
        logout,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}