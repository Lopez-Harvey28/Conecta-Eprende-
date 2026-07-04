import { useEffect, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuthStore } from "../../stores/auth-store";
import { useCurrentUser } from "../../hooks/use-current-user";

export function AuthBootstrap({children}:{children:ReactNode}){
  const status=useAuthStore(state=>state.status);const refresh=useAuthStore(state=>state.refreshSession);
  useEffect(()=>{if(status==="IDLE")void refresh()},[status,refresh]);
  return children;
}

export function RequireAuth(){
  const status=useAuthStore(state=>state.status);const location=useLocation();
  if(status==="IDLE"||status==="LOADING")return <div className="auth-loading"><ShieldCheck/><span>Verificando sesión…</span></div>;
  if(status!=="AUTHENTICATED")return <Navigate to={`/login?next=${encodeURIComponent(location.pathname+location.search)}`} replace/>;
  return <Outlet/>;
}

export function RequireAdmin(){const current=useCurrentUser();if(!current?.isAdmin)return <Navigate to="/unauthorized" replace/>;return <Outlet/>}
