import React, { useEffect, useState, type ErrorInfo, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { BriefcaseBusiness, ChevronDown, Flag, Home, Menu, MessageCircle, Search, Settings, ShieldCheck, Store, UserRound, X, LogIn } from "lucide-react";
import { useToastStore } from "../../stores/toast-store";
import { useAuthStore } from "../../stores/auth-store";
import { useQuotesStore } from "../../stores/quotes-store";

const nav = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/search", label: "Buscar", icon: Search },
  { to: "/requests", label: "Conversaciones", icon: MessageCircle },
  { to: "/formalization", label: "Formalización", icon: BriefcaseBusiness },
  { to: "/me", label: "Mi perfil", icon: UserRound },
];

class RouteErrorBoundary extends React.Component<{ children: ReactNode }, { error: Error | null }> {
  declare readonly props: { children: ReactNode };
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("Route render failed", error, info); }
  render() {
    if (this.state.error) {
      return (
        <section className="content-page">
          <div className="empty-state">
            <h1>No pudimos mostrar esta página</h1>
            <p>{this.state.error.message}</p>
            <Link className="button primary" to="/">Volver al inicio</Link>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState(false);
  const location = useLocation();

  const { toast, setToast, leaving, setLeaving } = useToastStore();
  const { threads, fetchThreadsByProvider, fetchThreadsBySender } = useQuotesStore();
  const { user, isAuthenticated, logout, fetchMe } = useAuthStore();

  const unread = threads.filter(t => t.status === "OPEN").length;

  useEffect(() => {
    if (!toast) return;
    setLeaving(false);
    const dismiss = setTimeout(() => setLeaving(true), 3700);
    const remove = setTimeout(() => {
      setToast(null);
      setLeaving(false);
    }, 4000);
    return () => {
      clearTimeout(dismiss);
      clearTimeout(remove);
    };
  }, [toast, setToast, setLeaving]);

  useEffect(() => {
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const providerId = user.providers?.[0]?.id || user.providerProfileId;
    if (providerId) {
      fetchThreadsByProvider(providerId);
    } else {
      fetchThreadsBySender(user.id);
    }
  }, [isAuthenticated, user, fetchThreadsByProvider, fetchThreadsBySender]);

  const handleLogout = async () => {
    setAccount(false);
    await logout();
  };

  const displayName = isAuthenticated ? (user?.name || user?.email?.split("@")[0] || "Usuario") : null;
  const initials = displayName ? displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "G";

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand" aria-label="Conecta Emprende, inicio">
          <span className="brand-mark"><Store /></span>
          <span>Conecta <strong>Emprende</strong></span>
        </Link>

        <nav className={open ? "main-nav open" : "main-nav"}>
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              onClick={() => setOpen(false)}
              end={end}
              to={to}
              key={to}
              className={({ isActive }) => isActive ? "active" : ""}
            >
              <Icon />
              {label}
              {to === "/requests" && unread > 0 && <span className="nav-unread">{unread}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="account-wrap">
          {isAuthenticated && user ? (
            <>
              <button className="account-button" onClick={() => setAccount(!account)} aria-expanded={account} aria-haspopup="menu">
                <span>{initials}</span>
                <span className="account-copy">
                  <strong>{displayName}</strong>
                  <small>{user.role === "ADMIN" ? "Administrador" : user.role === "PROVIDER" ? "Proveedor" : "Usuario"}</small>
                </span>
                <ChevronDown />
              </button>
              {account && (
                <div className="account-menu" role="menu">
                  <Link to="/settings/security" onClick={() => setAccount(false)}>
                    <Settings /> Configuración y seguridad
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link to="/admin/reports" onClick={() => setAccount(false)}>
                      <Flag /> Reportes
                    </Link>
                  )}
                  <Link to="/trust" onClick={() => setAccount(false)}>
                    <ShieldCheck /> Cómo funciona la confianza
                  </Link>
                  <button onClick={handleLogout}>Cerrar sesión</button>
                </div>
              )}
            </>
          ) : (
            <Link to="/auth/login" className="auth-link">
              <LogIn size={16} />
              Iniciar sesión
            </Link>
          )}
        </div>

        <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Abrir navegación">
          {open ? <X /> : <Menu />}
        </button>
      </header>

      <main className="app-content">
        <RouteErrorBoundary key={location.pathname}>
          <Outlet />
        </RouteErrorBoundary>
      </main>

      {toast && (
        <div className={`toast ${leaving ? "leaving" : ""}`} role="status">
          <ShieldCheck />
          <span>{toast}</span>
          <div className="toast-progress" />
        </div>
      )}
    </div>
  );
}
