import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/authService';
import { studentAuthService } from '../services/studentAuthService';
import { Teacher, Student, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: Teacher | Student | null;
  role: UserRole | null;
  loading: boolean;
  loginTeacher: (email: string, password: string) => Promise<void>;
  loginStudent: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Teacher | Student | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = authService.onAuthStateChange(async (authUser) => {
      if (authUser) {
        const teacher = await authService.getCurrentTeacher();
        if (teacher) {
          setUser(teacher);
          setRole('teacher');
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      console.log('Checking user session...');
      
      // Check teacher session first
      const teacher = await authService.getCurrentTeacher();
      if (teacher) {
        console.log('Teacher session found:', teacher);
        setUser(teacher);
        setRole('teacher');
        setLoading(false);
        return;
      }

      // Check student session
      const studentSession = localStorage.getItem('student_session');
      console.log('Student session from localStorage:', studentSession);
      
      if (studentSession) {
        try {
          const sessionData = JSON.parse(studentSession);
          const now = Date.now();
          const sessionAge = now - sessionData.timestamp;
          
          console.log('Session data:', sessionData);
          console.log('Session age (hours):', sessionAge / (1000 * 60 * 60));
          
          // Check if session is not older than 24 hours
          if (sessionAge < 24 * 60 * 60 * 1000) {
            console.log('Session is valid, fetching student data...');
            
            // Get student data from database
            const { data: studentData, error } = await supabase
              .from('students')
              .select('*')
              .eq('id', sessionData.id)
              .single();

            console.log('Student data from DB:', studentData);
            console.log('Student data error:', error);

            if (!error && studentData) {
              console.log('Setting student user:', studentData);
              setUser(studentData);
              setRole('student');
              setLoading(false);
              return;
            } else {
              console.log('Student data not found or error, removing session');
              localStorage.removeItem('student_session');
            }
          } else {
            console.log('Session expired, removing it');
            // Session expired, remove it
            localStorage.removeItem('student_session');
          }
        } catch (error) {
          console.error('Error checking student session:', error);
          localStorage.removeItem('student_session');
        }
      } else {
        console.log('No student session found');
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loginTeacher(email: string, password: string) {
    const { teacher } = await authService.loginTeacher(email, password);
    setUser(teacher);
    setRole('teacher');
  }

  async function loginStudent(email: string, password: string) {
    const student = await studentAuthService.loginStudent(email, password);
    setUser(student);
    setRole('student');

    localStorage.setItem('student_session', JSON.stringify({
      id: student.id,
      email: student.email,
      timestamp: Date.now()
    }));
  }

  async function logout() {
    if (role === 'teacher') {
      await authService.logout();
    } else if (role === 'student') {
      localStorage.removeItem('student_session');
    }
    setUser(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        loginTeacher,
        loginStudent,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
