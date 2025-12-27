import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

export function ProtectedRoute({
  children,
  requireEmailVerification = true
}: ProtectedRouteProps) {
  const { user, loading, emailVerified } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireEmailVerification && !emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return <>{children}</>;
}
