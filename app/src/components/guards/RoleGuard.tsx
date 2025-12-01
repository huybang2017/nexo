import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  redirectTo = '/',
}) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user role is in allowed roles
  const isAllowed = allowedRoles.includes(user.role);

  if (!isAllowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export default RoleGuard;

