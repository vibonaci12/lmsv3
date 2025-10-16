import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { studentAuthService } from '../services/studentAuthService';
import { Student } from '../types';
import { supabase } from '../lib/supabase';

// Constants for student session management
const STUDENT_SESSION_KEY = 'student_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface StudentSessionData {
  id: string;
  email: string;
  timestamp: number;
}

interface StudentAuthContextType {
  student: Student | null;
  loading: boolean;
  loginStudent: (email: string, password: string) => Promise<void>;
  logoutStudent: () => void;
  refreshStudentSession: () => Promise<void>;
  isSessionValid: () => boolean;
}

const StudentAuthContext = createContext<StudentAuthContextType | undefined>(undefined);

export function StudentAuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to validate session timestamp
  const isSessionValid = useCallback((timestamp?: number): boolean => {
    if (!timestamp) return false;
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
        console.warn('Invalid student session structure, removing session');
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
  const saveStudentSession = useCallback((studentData: Student): void => {
    const sessionData: StudentSessionData = {
      id: studentData.id,
      email: studentData.email,
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

    // Session is valid, set student data
    console.log('Valid student session found, setting student:', studentData);
    setStudent(studentData);
    
    // Refresh session timestamp to keep it alive
    saveStudentSession(studentData);
    
    return true;
  }, [getStudentSession, isSessionValid, clearStudentSession, fetchStudentData, saveStudentSession]);

  // Main function to check and restore student session
  const checkStudentSession = useCallback(async (): Promise<void> => {
    try {
      console.log('Checking student session...');
      setLoading(true);

      const isValid = await validateStudentSession();
      
      if (!isValid) {
        console.log('No valid student session found');
        setStudent(null);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error checking student session:', error);
      setStudent(null);
      setLoading(false);
    }
  }, [validateStudentSession]);

  // Initialize student authentication on component mount
  useEffect(() => {
    const initializeStudentAuth = async () => {
      if (!isInitialized) {
        await checkStudentSession();
        setIsInitialized(true);
      }
    };

    initializeStudentAuth();
  }, [checkStudentSession, isInitialized]);

  // Listen for storage changes (cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STUDENT_SESSION_KEY) {
        if (e.newValue) {
          // Session was added or updated in another tab
          console.log('Student session changed in another tab, rechecking...');
          checkStudentSession();
        } else {
          // Session was removed in another tab
          console.log('Student session removed in another tab');
          setStudent(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkStudentSession]);

  // Student login function
  const loginStudent = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      
      const studentData = await studentAuthService.loginStudent(email, password);
      setStudent(studentData);
      saveStudentSession(studentData);
      
      console.log('Student logged in successfully:', studentData);
    } catch (error) {
      console.error('Student login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [saveStudentSession]);

  // Student logout function
  const logoutStudent = useCallback((): void => {
    try {
      clearStudentSession();
      setStudent(null);
      console.log('Student logged out successfully');
    } catch (error) {
      console.error('Student logout error:', error);
      // Even if logout fails, clear local state
      setStudent(null);
    }
  }, [clearStudentSession]);

  // Function to refresh current student session
  const refreshStudentSession = useCallback(async (): Promise<void> => {
    if (student) {
      const studentData = await fetchStudentData(student.id);
      if (studentData) {
        setStudent(studentData);
        saveStudentSession(studentData);
      } else {
        // Student data not found, logout
        logoutStudent();
      }
    }
  }, [student, fetchStudentData, saveStudentSession, logoutStudent]);

  const contextValue: StudentAuthContextType = {
    student,
    loading,
    loginStudent,
    logoutStudent,
    refreshStudentSession,
    isSessionValid: () => {
      const sessionData = getStudentSession();
      return isSessionValid(sessionData?.timestamp);
    },
  };

  return (
    <StudentAuthContext.Provider value={contextValue}>
      {children}
    </StudentAuthContext.Provider>
  );
}

export function useStudentAuth(): StudentAuthContextType {
  const context = useContext(StudentAuthContext);
  if (context === undefined) {
    throw new Error('useStudentAuth must be used within a StudentAuthProvider');
  }
  return context;
}
