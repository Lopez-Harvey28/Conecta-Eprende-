import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/auth-store";
import { PageLoader } from "../ui/LoadingSpinner";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader label="Verificando tu sesión..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  const roles = user ? new Set([user.role, ...(user.roleLabels ?? [])]) : new Set<string>();
  if (allowedRoles && user && !allowedRoles.some(role => roles.has(role))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
