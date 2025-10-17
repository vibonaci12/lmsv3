import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthProvider } from './contexts/AuthContext';
import { StudentAuthProvider } from './contexts/StudentAuthContext';
import { UnifiedAuthProvider } from './contexts/UnifiedAuthContext';
import { TeacherProtectedRoute, StudentProtectedRoute } from './components/UnifiedProtectedRoute';
import { TeacherLayout } from './layouts/TeacherLayout';
import { StudentLayout } from './layouts/StudentLayout';

import { UnifiedLogin } from './pages/auth/UnifiedLogin';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { ClassList } from './pages/teacher/ClassList';
import { ClassDetail } from './pages/teacher/ClassDetail';
import { ClassStudents } from './pages/teacher/ClassStudents';
import { ClassAssignments } from './pages/teacher/ClassAssignments';
import { ClassAttendance } from './pages/teacher/ClassAttendance';
import { AssignmentList } from './pages/teacher/AssignmentList';
import { AssignmentDetail } from './pages/teacher/AssignmentDetail';
import { Leaderboard } from './pages/teacher/Leaderboard';
import { Newsroom } from './pages/teacher/Newsroom';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentProfile } from './pages/student/StudentProfile';
import { StudentLeaderboard } from './pages/student/StudentLeaderboard';
import { StudentClassroom } from './pages/student/StudentClassroom';
import { StudentNewsroom } from './pages/student/StudentNewsroom';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';

function App() {
  return (
    <MantineProvider defaultColorScheme="light">
      <Notifications position="top-right" />
      <BrowserRouter>
        <AuthProvider>
          <StudentAuthProvider>
            <UnifiedAuthProvider>
              <Routes>
                {/* Main login page - unified for both teacher and student */}
                <Route path="/" element={<UnifiedLogin />} />
                <Route path="/login" element={<UnifiedLogin />} />
                <Route path="/login-siswa" element={<UnifiedLogin />} />

                {/* Teacher routes - using Supabase Auth */}
                <Route
                  path="/teacher/*"
                  element={
                    <TeacherProtectedRoute>
                      <TeacherLayout />
                    </TeacherProtectedRoute>
                  }
                >
                  <Route path="dashboard" element={<TeacherDashboard />} />
                  <Route path="classes" element={<ClassList />} />
                  <Route path="classes/:id" element={<ClassDetail />} />
                  <Route path="classes/:id/students" element={<ClassStudents />} />
                  <Route path="classes/:id/assignments" element={<ClassAssignments />} />
                  <Route path="classes/:id/attendance" element={<ClassAttendance />} />
                  <Route path="assignments" element={<AssignmentList />} />
                  <Route path="assignments/:id" element={<AssignmentDetail />} />
                  <Route path="leaderboard" element={<Leaderboard />} />
                  <Route path="newsroom" element={<Newsroom />} />
                  <Route path="profile" element={<div>Profile Page</div>} />
                  <Route index element={<Navigate to="/teacher/dashboard" replace />} />
                </Route>

                {/* Student routes - using custom auth */}
                <Route
                  path="/student/*"
                  element={
                    <StudentProtectedRoute>
                      <StudentLayout />
                    </StudentProtectedRoute>
                  }
                >
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="classroom" element={<StudentClassroom />} />
                  <Route path="leaderboard" element={<StudentLeaderboard />} />
                  <Route path="newsroom" element={<StudentNewsroom />} />
                  <Route path="profile" element={<StudentProfile />} />
                  <Route index element={<Navigate to="/student/dashboard" replace />} />
                </Route>

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </UnifiedAuthProvider>
          </StudentAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
