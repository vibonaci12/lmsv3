import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { Loader, Center } from '@mantine/core';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: UserRole;
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!user || !role) {
    return <Navigate to="/" replace />;
  }

  if (role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
