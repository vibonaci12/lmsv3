import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
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
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentProfile } from './pages/student/StudentProfile';
import { StudentLeaderboard } from './pages/student/StudentLeaderboard';
import { StudentClassroom } from './pages/student/StudentClassroom';

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
          <Routes>
            <Route path="/" element={<UnifiedLogin />} />

            <Route
              path="/teacher/*"
              element={
                <ProtectedRoute allowedRole="teacher">
                  <TeacherLayout />
                </ProtectedRoute>
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
              <Route path="profile" element={<div>Profile Page</div>} />
              <Route index element={<Navigate to="/teacher/dashboard" replace />} />
            </Route>

            <Route
              path="/student/*"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="classroom" element={<StudentClassroom />} />
              <Route path="leaderboard" element={<StudentLeaderboard />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route index element={<Navigate to="/student/dashboard" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
