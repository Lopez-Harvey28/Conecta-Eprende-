import { useEffect, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuthStore } from "../../stores/auth-store";
import { useCurrentUser } from "../../hooks/use-current-user";

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);
  const fetchMe = useAuthStore(state => state.fetchMe);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) void fetchMe();
  }, [isAuthenticated, isLoading, fetchMe]);

  return children;
}

export function RequireAuth() {
  const isLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const location = useLocation();

  if (isLoading) {
    return <div className="auth-loading"><ShieldCheck /><span>Verificando sesión...</span></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={`/auth/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return <Outlet />;
}

export function RequireAdmin() {
  const current = useCurrentUser();
  if (!current?.isAdmin) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}
