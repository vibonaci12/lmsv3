import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/authService';
import { studentAuthService } from '../services/studentAuthService';
import { Teacher, Student, UserRole } from '../types';

interface AuthContextType {
  user: Teacher | Student | null;
  role: UserRole | null;
  loading: boolean;
  loginTeacher: (email: string, password: string) => Promise<void>;
  loginStudent: (email: string, birthDate: string) => Promise<void>;
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
      const teacher = await authService.getCurrentTeacher();
      if (teacher) {
        setUser(teacher);
        setRole('teacher');
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

  async function loginStudent(email: string, birthDate: string) {
    const student = await studentAuthService.loginStudent(email, birthDate);
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
