import { Navigate } from 'react-router-dom';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { UserRole } from '../types';
import { Loader, Center, Alert, Button, Stack, Text } from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';

interface UnifiedProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
}

export function UnifiedProtectedRoute({ 
  children, 
  allowedRoles,
  fallbackPath = '/' 
}: UnifiedProtectedRouteProps) {
  const { user, role, loading, isAuthenticated } = useUnifiedAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text size="sm" c="dimmed">
            Memverifikasi autentikasi...
          </Text>
        </Stack>
      </Center>
    );
  }

  // Show error state if not authenticated
  if (!isAuthenticated || !user || !role) {
    return (
      <Center h="100vh" p="xl">
        <Stack align="center" gap="md" maw={400}>
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Akses Ditolak"
            color="red"
            variant="light"
          >
            <Text size="sm">
              Anda harus login untuk mengakses halaman ini.
            </Text>
          </Alert>
          
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={() => window.location.reload()}
            size="sm"
          >
            Refresh Halaman
          </Button>
          
          <Button
            component="a"
            href={fallbackPath}
            variant="filled"
            size="sm"
          >
            Ke Halaman Login
          </Button>
        </Stack>
      </Center>
    );
  }

  // Check if user role is allowed
  if (!allowedRoles.includes(role)) {
    return (
      <Center h="100vh" p="xl">
        <Stack align="center" gap="md" maw={400}>
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Akses Ditolak"
            color="red"
            variant="light"
          >
            <Text size="sm">
              Anda tidak memiliki izin untuk mengakses halaman ini.
              <br />
              Role yang diizinkan: {allowedRoles.join(', ')}
              <br />
              Role Anda: {role}
            </Text>
          </Alert>
          
          <Button
            component="a"
            href={fallbackPath}
            variant="filled"
            size="sm"
          >
            Kembali ke Login
          </Button>
        </Stack>
      </Center>
    );
  }

  // User is authenticated and has correct role, render protected content
  return <>{children}</>;
}

// Convenience components for specific roles
export function TeacherProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <UnifiedProtectedRoute allowedRoles={['teacher']} fallbackPath="/">
      {children}
    </UnifiedProtectedRoute>
  );
}

export function StudentProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <UnifiedProtectedRoute allowedRoles={['student']} fallbackPath="/">
      {children}
    </UnifiedProtectedRoute>
  );
}

// Component for both roles
export function TeacherOrStudentProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <UnifiedProtectedRoute allowedRoles={['teacher', 'student']} fallbackPath="/">
      {children}
    </UnifiedProtectedRoute>
  );
}
