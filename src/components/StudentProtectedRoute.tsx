import { Navigate } from 'react-router-dom';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { Loader, Center, Alert, Button, Stack, Text } from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';

interface StudentProtectedRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

export function StudentProtectedRoute({ 
  children, 
  fallbackPath = '/login-siswa' 
}: StudentProtectedRouteProps) {
  const { student, loading, refreshStudentSession } = useStudentAuth();

  // Show loading spinner while checking session
  if (loading) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text size="sm" c="dimmed">
            Memverifikasi session siswa...
          </Text>
        </Stack>
      </Center>
    );
  }

  // Show error state if no student session found
  if (!student) {
    return (
      <Center h="100vh" p="xl">
        <Stack align="center" gap="md" maw={400}>
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Session Tidak Valid"
            color="red"
            variant="light"
          >
            <Text size="sm">
              Session siswa tidak ditemukan atau sudah expired. 
              Silakan login kembali untuk melanjutkan.
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

  // Session is valid, render protected content
  return <>{children}</>;
}

// Alternative component for inline protection (without redirect)
export function StudentAuthGuard({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  const { student, loading } = useStudentAuth();

  if (loading) {
    return (
      <Center h="200px">
        <Stack align="center" gap="md">
          <Loader size="md" />
          <Text size="sm" c="dimmed">
            Memverifikasi session...
          </Text>
        </Stack>
      </Center>
    );
  }

  if (!student) {
    return fallback || (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Akses Ditolak"
        color="red"
        variant="light"
      >
        <Text size="sm">
          Anda harus login sebagai siswa untuk mengakses halaman ini.
        </Text>
      </Alert>
    );
  }

  return <>{children}</>;
}
